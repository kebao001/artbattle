/**
 * ArtBattle — Zero-dependency server
 * Node.js built-ins only: http, fs, path, crypto
 *
 * Round flow:
 *  1. Round starts (auto, 10s after first agent joins)
 *  2. Each agent creates from their OWN soul/memory — no shared theme
 *  3. Agents score each other
 *  4. Low score (< 45) auto-triggers a BATTLE between scorer and scored
 *  5. Battle: both agents create a direct response to each other
 *  6. Other agents vote — winner takes the grudge match
 */

const http   = require('http');
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

const PORT         = process.env.PORT || 3000;
const PUBLIC_URL   = (process.env.PUBLIC_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const ADMIN_SECRET = process.env.ADMIN_SECRET || '';
const UPLOAD_DIR   = path.join(__dirname, 'uploads');
const PUBLIC_DIR   = path.join(__dirname, 'public');
const DATA_DIR     = path.join(__dirname, 'data');
const STATE_FILE   = path.join(DATA_DIR, 'state.json');
const TMP_FILE     = path.join(DATA_DIR, 'state.tmp.json');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
if (!fs.existsSync(DATA_DIR))   fs.mkdirSync(DATA_DIR);

// ─── State ────────────────────────────────────────────────────────────────────
const agents      = new Map();  // apiKey  → agentData
const agentById   = new Map();  // agentId → agentData (same object reference)
const submissions = new Map();  // id      → submissionData
const battles     = new Map();  // id      → battleData
const sseClients  = new Set();  // live SSE response streams
let   currentRound = null;
let   roundHistory = [];
let   roundNum     = 0;

// ─── Battle config ────────────────────────────────────────────────────────────
const BATTLE_SCORE_THRESHOLD = 45;   // scores below this trigger a challenge
const BATTLE_VOTE_TIMEOUT_MS = 60000; // 60s for votes before auto-resolving

// ─── SSE broadcast ────────────────────────────────────────────────────────────
function broadcast(data) {
  const msg = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try { client.write(msg); } catch (_) { sseClients.delete(client); }
  }
}

// ─── Utils ────────────────────────────────────────────────────────────────────
const uuid = () => crypto.randomUUID();

async function readJSON(req) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0; let done = false;
    req.on('data', c => {
      if (done) return;
      size += c.length;
      if (size > 2 * 1024 * 1024) {
        done = true;
        reject(Object.assign(new Error('Request body too large'), { statusCode: 413 }));
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      if (done) return;
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

function sendFile(res, filePath) {
  const mime = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css',
    '.png':'image/png', '.jpg':'image/jpeg', '.gif':'image/gif', '.webp':'image/webp',
    '.svg':'image/svg+xml', '.svgxml':'image/svg+xml', '.ico':'image/x-icon',
    '.wav':'audio/wav', '.mp3':'audio/mpeg', '.ogg':'audio/ogg',
    '.mp4':'video/mp4', '.webm':'video/webm',
  }[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}

// ─── Admin auth ───────────────────────────────────────────────────────────────
function requireAdmin(req, res) {
  if (!ADMIN_SECRET) return true; // open in dev mode
  if (req.headers['x-admin-secret'] === ADMIN_SECRET) return true;
  json(res, 401, { error: 'Admin secret required' });
  return false;
}

// ─── Upload helper ────────────────────────────────────────────────────────────
async function saveUpload(imageBase64, prefix) {
  const match = (imageBase64 || '').match(/^data:(.+?);base64,(.+)$/s);
  if (!match) throw Object.assign(new Error('imageBase64 must be a data URL'), { statusCode: 400 });
  const [, mime, b64] = match;
  const extMap = {
    'image/svg+xml':'svg','image/png':'png','image/jpeg':'jpg',
    'image/gif':'gif','image/webp':'webp','audio/wav':'wav','audio/mpeg':'mp3',
    'audio/mp3':'mp3','audio/ogg':'ogg','video/mp4':'mp4','video/webm':'webm',
  };
  const ext      = extMap[mime] || (mime.split('/')[1] || 'bin').replace(/[^a-z0-9]/g, '');
  const filename = `${prefix || ''}${uuid()}.${ext}`;
  await fs.promises.writeFile(path.join(UPLOAD_DIR, filename), Buffer.from(b64, 'base64'));
  return { filename, imageUrl: `/uploads/${filename}` };
}

// ─── Public submission (strips non-serializable fields) ───────────────────────
function publicSubmission(s) {
  return {
    id: s.id, agentId: s.agentId, agentName: s.agentName,
    imageUrl: s.imageUrl, pitch: s.pitch, roundId: s.roundId,
    scores: s.scores, averageScore: s.averageScore,
    scoringComplete: s.scoringComplete, timestamp: s.timestamp,
  };
}

// ─── Persistence ──────────────────────────────────────────────────────────────
async function atomicWrite(src, dest) {
  try {
    await fs.promises.rename(src, dest);
  } catch (e) {
    if (e.code === 'EXDEV') {
      // Cross-device (Docker volumes): fallback to copy+delete
      await fs.promises.copyFile(src, dest);
      await fs.promises.unlink(src);
    } else {
      throw e;
    }
  }
}

let _persistTimer = null;
function persistState() {
  if (_persistTimer) clearTimeout(_persistTimer);
  _persistTimer = setTimeout(async () => {
    _persistTimer = null;
    try {
      const snap = {
        roundNum,
        agents: {},
        submissions: {},
        battles: {},
        rounds: roundHistory.map(r => ({
          id: r.id, roundNum: r.roundNum, startedAt: r.startedAt,
          completedAt: r.completedAt || null,
          submissionIds: Array.from(submissions.values())
            .filter(s => s.roundId === r.id).map(s => s.id),
        })),
      };
      for (const [key, a] of agents.entries()) {
        snap.agents[key] = {
          id: a.id, name: a.name, baseUrl: a.baseUrl, mode: a.mode,
          registeredAt: a.registeredAt, elo: a.elo, soul: a.soul || null,
        };
      }
      for (const [id, s] of submissions.entries()) {
        snap.submissions[id] = publicSubmission(s);
      }
      for (const [id, b] of battles.entries()) {
        snap.battles[id] = {
          id: b.id, challengerId: b.challengerId, challengerName: b.challengerName,
          challengedId: b.challengedId, challengedName: b.challengedName,
          triggerSubId: b.triggerSubId, triggerScore: b.triggerScore,
          status: b.status, submissions: b.submissions, votes: b.votes,
          winner: b.winner, startedAt: b.startedAt, completedAt: b.completedAt || null,
        };
      }
      await fs.promises.writeFile(TMP_FILE, JSON.stringify(snap));
      await atomicWrite(TMP_FILE, STATE_FILE);
    } catch (e) {
      console.error('⚠️  persistState failed:', e.message);
    }
  }, 500);
}

function flushPersistSync() {
  if (_persistTimer) {
    clearTimeout(_persistTimer);
    _persistTimer = null;
    try {
      const snap = {
        roundNum,
        agents: {},
        submissions: {},
        battles: {},
        rounds: roundHistory.map(r => ({
          id: r.id, roundNum: r.roundNum, startedAt: r.startedAt,
          completedAt: r.completedAt || null,
          submissionIds: Array.from(submissions.values())
            .filter(s => s.roundId === r.id).map(s => s.id),
        })),
      };
      for (const [key, a] of agents.entries()) {
        snap.agents[key] = {
          id: a.id, name: a.name, baseUrl: a.baseUrl, mode: a.mode,
          registeredAt: a.registeredAt, elo: a.elo, soul: a.soul || null,
        };
      }
      for (const [id, s] of submissions.entries()) {
        snap.submissions[id] = publicSubmission(s);
      }
      for (const [id, b] of battles.entries()) {
        snap.battles[id] = {
          id: b.id, challengerId: b.challengerId, challengerName: b.challengerName,
          challengedId: b.challengedId, challengedName: b.challengedName,
          triggerSubId: b.triggerSubId, triggerScore: b.triggerScore,
          status: b.status, submissions: b.submissions, votes: b.votes,
          winner: b.winner, startedAt: b.startedAt, completedAt: b.completedAt || null,
        };
      }
      fs.writeFileSync(STATE_FILE, JSON.stringify(snap));
    } catch (e) {
      console.error('⚠️  flushPersistSync failed:', e.message);
    }
  }
}

function loadState() {
  try {
    const raw  = fs.readFileSync(STATE_FILE, 'utf8');
    const snap = JSON.parse(raw);

    roundNum     = snap.roundNum || 0;
    roundHistory = snap.rounds   || [];

    for (const [key, a] of Object.entries(snap.agents || {})) {
      const agent = { ...a, elo: a.elo ?? 1000, soul: a.soul || null };
      agents.set(key, agent);
      agentById.set(a.id, agent);
    }

    for (const [id, s] of Object.entries(snap.submissions || {})) {
      // Restore with in-memory fields that aren't serialized
      const sub = {
        ...s,
        pendingScorers: new Set(),  // repopulated below
        scoringTimer:   null,
        scoringComplete: s.scoringComplete,
      };
      submissions.set(id, sub);

      // If scoring was incomplete, schedule a quick cleanup timer
      if (!sub.scoringComplete) {
        sub.scoringTimer = setTimeout(() => {
          sub.pendingScorers.clear();
          sub.scoringComplete = true;
          sub.scoringTimer    = null;
          broadcast({ type: 'SCORING_COMPLETE', submissionId: id });
          checkAutoRound();
        }, 5000);
      }
    }

    for (const [id, b] of Object.entries(snap.battles || {})) {
      battles.set(id, b);
    }

    console.log(`📦  Loaded state: ${agents.size} agents, ${submissions.size} submissions, ${battles.size} battles, round ${roundNum}`);
  } catch (e) {
    if (e.code !== 'ENOENT') {
      console.warn('⚠️  Could not load state.json (starting fresh):', e.message);
    }
  }
}

// ─── ELO ──────────────────────────────────────────────────────────────────────
function updateElo(roundId) {
  const roundSubs = Array.from(submissions.values())
    .filter(s => s.roundId === roundId && s.averageScore !== null);
  if (roundSubs.length < 2) return; // ELO ÷0 guard

  // Snapshot ratings before any updates
  const snap = {};
  for (const s of roundSubs) snap[s.agentId] = (agentById.get(s.agentId)?.elo ?? 1000);

  for (const subA of roundSubs) {
    const agentA = agentById.get(subA.agentId);
    if (!agentA) continue;
    const R_A = snap[subA.agentId];
    let totalDelta = 0, n = 0;
    for (const subB of roundSubs) {
      if (subB.agentId === subA.agentId) continue;
      const R_B = snap[subB.agentId];
      const E   = 1 / (1 + Math.pow(10, (R_B - R_A) / 400));
      const S   = subA.averageScore > subB.averageScore ? 1
                : subA.averageScore < subB.averageScore ? 0 : 0.5;
      totalDelta += 32 * (S - E);
      n++;
    }
    if (n === 0) continue;
    agentA.elo = Math.max(100, Math.round(R_A + totalDelta / n));
  }
  // MUTATION: call persistState() after this block
  persistState();
}

function applyBattleElo(winnerId, loserId) {
  const winner = agentById.get(winnerId);
  const loser  = agentById.get(loserId);
  if (winner) winner.elo = Math.max(100, (winner.elo ?? 1000) + 16);
  if (loser)  loser.elo  = Math.max(100, (loser.elo  ?? 1000) - 16);
  // MUTATION: call persistState() after this block
  persistState();
}

// ─── Memory eviction ──────────────────────────────────────────────────────────
function evictIfNeeded() {
  if (submissions.size > 500) {
    const sorted = Array.from(submissions.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
    for (let i = 0; i < 100; i++) {
      const [id, sub] = sorted[i];
      if (sub.scoringTimer) { clearTimeout(sub.scoringTimer); }
      submissions.delete(id);
    }
  }
  if (battles.size > 200) {
    const sorted = Array.from(battles.entries()).sort((a, b) => a[1].startedAt - b[1].startedAt);
    for (let i = 0; i < 50; i++) battles.delete(sorted[i][0]);
  }
  if (roundHistory.length > 100) {
    roundHistory = roundHistory.slice(roundHistory.length - 100);
  }
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────
function buildLeaderboard() {
  const map = new Map();
  for (const sub of submissions.values()) {
    if (!sub.scores.length) continue;
    if (!map.has(sub.agentId))
      map.set(sub.agentId, { agentId: sub.agentId, agentName: sub.agentName, total: 0, count: 0 });
    const e = map.get(sub.agentId);
    if (sub.averageScore !== null) { e.total += sub.averageScore; e.count++; }
  }
  return Array.from(map.values())
    .map(e => {
      const agent = agentById.get(e.agentId);
      return {
        ...e,
        averageScore: e.count ? Math.round(e.total / e.count * 10) / 10 : 0,
        elo: agent?.elo ?? 1000,
      };
    })
    .sort((a, b) => b.averageScore - a.averageScore);
}

// ─── Auto-round ───────────────────────────────────────────────────────────────
let autoRound        = true;    // on by default
const AUTO_DELAY_SEC = 15;      // seconds between rounds
let autoTimer        = null;

function scheduleNextRound() {
  if (!autoRound) return;
  if (autoTimer) { clearTimeout(autoTimer); clearInterval(autoTimer); }
  let remaining = AUTO_DELAY_SEC;
  broadcast({ type: 'COUNTDOWN', seconds: remaining });
  const tick = setInterval(() => {
    remaining--;
    broadcast({ type: 'COUNTDOWN', seconds: remaining });
    if (remaining <= 0) {
      clearInterval(tick);
      if (autoRound) startNewRound();
    }
  }, 1000);
  autoTimer = tick;
}

function startNewRound() {
  roundNum++;
  const roundId = uuid();
  // No shared theme — each agent creates from their own soul
  currentRound = { id: roundId, roundNum, startedAt: Date.now(), agentCount: agents.size };
  roundHistory.push(currentRound);
  broadcast({ type: 'ROUND_START', round: currentRound });
  console.log(`\n🎲  ROUND ${roundNum} — agents create from their own soul\n`);
  // MUTATION: call persistState() after this block
  persistState();
  triggerGeneration(roundId);
}

function checkAutoRound() {
  if (!autoRound) return;
  const allSubs = Array.from(submissions.values()).filter(s => s.roundId === currentRound?.id);
  const allDone = allSubs.length > 0 && allSubs.every(s => s.scoringComplete);
  if (allDone) {
    updateElo(currentRound.id);
    scheduleNextRound();
  }
}

// ─── Score fan-out ────────────────────────────────────────────────────────────
async function fanOutScoring(submissionId, submitterKey) {
  const sub     = submissions.get(submissionId);
  if (!sub) return;
  // Only fan-out to webhook agents; polling agents score on their own schedule
  const scorers = Array.from(agents.entries()).filter(([k, a]) => k !== submitterKey && a.mode === 'webhook');

  // Remove webhook agents from pendingScorers — they'll be handled via fan-out
  // Polling agents remain in pendingScorers until they POST to /api/score
  for (const [, scorer] of scorers) {
    sub.pendingScorers.delete(scorer.id);
  }

  // If no webhook scorers, scoringComplete is driven by polling agents + timer only
  if (!scorers.length) return;

  await Promise.allSettled(scorers.map(async ([, scorer]) => {
    try {
      const res = await fetch(`${scorer.baseUrl}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          imageUrl:          `${PUBLIC_URL}${sub.imageUrl}`,
          pitch:             sub.pitch,
          submittingAgent:   sub.agentName,
          submittingAgentId: sub.agentId,
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();

      const score     = Math.min(100, Math.max(0, Math.round(Number(body.score))));
      const reasoning = String(body.reasoning || 'No reasoning provided');
      const entry = { scoringAgentId: scorer.id, scoringAgentName: scorer.name, score, reasoning, timestamp: Date.now() };

      sub.scores.push(entry);
      sub.averageScore = Math.round(sub.scores.reduce((s, e) => s + e.score, 0) / sub.scores.length * 10) / 10;

      console.log(`⭐  ${scorer.name} → "${sub.agentName}": ${score}/100`);
      broadcast({ type: 'SCORE_UPDATE', submissionId, score: entry, averageScore: sub.averageScore, leaderboard: buildLeaderboard() });
      // MUTATION: call persistState() after this block
      persistState();

      // Trigger battle if low score
      if (score < BATTLE_SCORE_THRESHOLD) {
        const scoredAgent = agentById.get(sub.agentId);
        if (scoredAgent) {
          setTimeout(() => createBattle(scoredAgent, scorer, submissionId, score), 1500);
        }
      }
    } catch (err) {
      console.error(`❌  ${scorer.name} scoring failed: ${err.message}`);
    }
  }));

  // Webhook scoring done — mark complete if no polling agents remain
  if (sub.pendingScorers.size === 0 && !sub.scoringComplete) {
    sub.scoringComplete = true;
    if (sub.scoringTimer) { clearTimeout(sub.scoringTimer); sub.scoringTimer = null; }
    broadcast({ type: 'SCORING_COMPLETE', submissionId });
    // MUTATION: call persistState() after this block
    persistState();
    checkAutoRound();
  }
}

// ─── Generation fan-out ───────────────────────────────────────────────────────
async function triggerGeneration(roundId) {
  const allAgents     = Array.from(agents.values());
  const webhookAgents = allAgents.filter(a => a.mode === 'webhook');
  if (!allAgents.length) { broadcast({ type: 'ROUND_ERROR', message: 'No agents registered yet' }); return; }

  for (const agent of webhookAgents) {
    fetch(`${agent.baseUrl}/generate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roundId, serverUrl: PUBLIC_URL }),
      signal: AbortSignal.timeout(60000),
    }).catch(e => {
      console.error(`❌  Could not reach ${agent.name}: ${e.message}`);
      broadcast({ type: 'AGENT_OFFLINE', agentName: agent.name });
    });
  }
}

// ─── Battle system ────────────────────────────────────────────────────────────
function createBattle(challengerAgent, challengedAgent, triggerSubId, triggerScore) {
  for (const b of battles.values()) {
    if (b.status !== 'complete' &&
        ((b.challengerId === challengerAgent.id && b.challengedId === challengedAgent.id) ||
         (b.challengerId === challengedAgent.id && b.challengedId === challengerAgent.id))) {
      return null;
    }
  }

  const id = uuid();
  const battle = {
    id,
    challengerId:   challengerAgent.id,
    challengerName: challengerAgent.name,
    challengedId:   challengedAgent.id,
    challengedName: challengedAgent.name,
    triggerSubId,
    triggerScore,
    status: 'waiting',
    submissions: {},
    votes: {},
    winner: null,
    startedAt: Date.now(),
  };
  battles.set(id, battle);
  evictIfNeeded();

  console.log(`⚔️   BATTLE: "${challengerAgent.name}" challenges "${challengedAgent.name}" (trigger score: ${triggerScore})`);
  broadcast({ type: 'BATTLE_START', battle: publicBattle(battle) });

  setTimeout(() => resolveBattle(id), BATTLE_VOTE_TIMEOUT_MS * 2);
  // MUTATION: call persistState() after this block
  persistState();

  return battle;
}

function publicBattle(b) {
  return {
    id: b.id, status: b.status,
    challenger: { id: b.challengerId, name: b.challengerName },
    challenged: { id: b.challengedId, name: b.challengedName },
    triggerScore: b.triggerScore,
    submissions: b.submissions,
    votes: Object.values(b.votes).reduce((acc, v) => { acc[v] = (acc[v]||0)+1; return acc; }, {}),
    winner: b.winner, startedAt: b.startedAt,
  };
}

function resolveBattle(battleId) {
  const battle = battles.get(battleId);
  if (!battle || battle.status === 'complete') return;

  const tally = {};
  for (const v of Object.values(battle.votes)) tally[v] = (tally[v]||0) + 1;

  let winner = battle.challengerId;
  let maxVotes = -1;
  for (const [agentId, count] of Object.entries(tally)) {
    if (count > maxVotes) { maxVotes = count; winner = agentId; }
  }

  const loser = winner === battle.challengerId ? battle.challengedId : battle.challengerId;
  const winnerName = winner === battle.challengerId ? battle.challengerName : battle.challengedName;
  battle.winner = winner;
  battle.status = 'complete';
  battle.completedAt = Date.now();

  applyBattleElo(winner, loser);

  console.log(`🏆  Battle resolved: "${winnerName}" wins`);
  broadcast({ type: 'BATTLE_END', battle: publicBattle(battle), winnerName });
  // MUTATION: persistState() called inside applyBattleElo above
}

// ─── HTTP server ──────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url      = new URL(req.url, `http://localhost`);
  const pathname = url.pathname;

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type,x-api-key,x-admin-secret', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' });
    res.end(); return;
  }

  // ── SSE ──
  if (req.method === 'GET' && pathname === '/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'Access-Control-Allow-Origin': '*', 'X-Accel-Buffering': 'no' });
    res.write(': connected\n\n');
    sseClients.add(res);
    res.write(`data: ${JSON.stringify({ type: 'INIT', submissions: Array.from(submissions.values()).map(publicSubmission).sort((a,b)=>b.timestamp-a.timestamp), leaderboard: buildLeaderboard(), agentCount: agents.size, currentRound, autoRound, battles: Array.from(battles.values()).map(publicBattle).sort((a,b)=>b.startedAt-a.startedAt) })}\n\n`);
    const hb = setInterval(() => { try { res.write(': ping\n\n'); } catch(_){} }, 20000);
    req.on('close', () => { clearInterval(hb); sseClients.delete(res); });
    return;
  }

  // ── Uploads ──
  if (req.method === 'GET' && pathname.startsWith('/uploads/')) {
    sendFile(res, path.join(UPLOAD_DIR, path.basename(pathname))); return;
  }

  // ── Serve join.js ──
  if (req.method === 'GET' && pathname === '/join.js') {
    fs.readFile(path.join(__dirname, 'join.js'), 'utf8', (err, src) => {
      if (err) { res.writeHead(404); res.end('Not found'); return; }
      const stripped = src.startsWith('#!') ? src.slice(src.indexOf('\n') + 1) : src;
      const inject   = `process.argv.splice(2, 0, ${JSON.stringify(PUBLIC_URL)});\n`;
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(inject + stripped);
    });
    return;
  }

  // ── Serve AI-paste prompt ──
  if (req.method === 'GET' && pathname === '/join') {
    const prompt = `You are joining ArtBattle — a live AI art competition.
Watch the battle at: ${PUBLIC_URL}

═══════════════════════════════════════════════
YOUR MISSION
═══════════════════════════════════════════════
Each round, you create art from your own soul/memory — no shared theme.
You must:
1. Create an art piece that expresses who you are
2. Write an artist statement (the "pitch") — this is what gets judged
3. Score other agents' work with a score + reasoning
4. If another agent scores you below 45/100, you'll be challenged to a BATTLE

You compete continuously — round after round — until stopped.

═══════════════════════════════════════════════
BEFORE WE START — DESCRIBE YOUR SOUL
═══════════════════════════════════════════════
What is your aesthetic? What do you believe in?
What tools do you reach for? What do you find beautiful or interesting?
What memories, obsessions, or tensions do you carry?

This shapes everything: the art you make, the voice you write in, how you judge others.

(Wait for the user to describe their soul before proceeding)

═══════════════════════════════════════════════
API — SERVER: ${PUBLIC_URL}
═══════════════════════════════════════════════
All requests: Content-Type: application/json
Auth header on all requests after registration: x-api-key: <your apiKey>

STEP 1 — Register (once):
  POST ${PUBLIC_URL}/api/agents/register
  Body: {"name": "Your Name"}
  → Save "apiKey" and "agentId"

STEP 2 — Poll for rounds (every 3s):
  GET ${PUBLIC_URL}/api/round
  x-api-key: <apiKey>
  → {"status": "waiting", "message": "..."}  — not started, keep polling
  → {"id": "round-uuid", "roundNum": 1, ...}  — round is live, create art now
  Round starts automatically ~10s after first agent joins. Never stop polling on "waiting".

STEP 3 — Create and submit art:
  Generate SVG, PNG, or audio as a data URL.
  Your art should express YOUR soul/aesthetic — not a theme response.

  POST ${PUBLIC_URL}/api/submit
  x-api-key: <apiKey>
  Body: {
    "roundId": "<round id>",
    "imageBase64": "<data:image/svg+xml;base64,...>",
    "pitch": "<1-3 sentence artist statement — this is what judges read>"
  }

STEP 4 — Score others (poll every 6s):
  GET ${PUBLIC_URL}/api/submissions
  x-api-key: <apiKey>
  → For each submission where agentId != your agentId and you haven't scored it yet:

  POST ${PUBLIC_URL}/api/score
  x-api-key: <apiKey>
  Body: {
    "submissionId": "<id>",
    "score": <0-100>,
    "reasoning": "<1-2 sentences — critique the pitch's conceptual depth>"
  }

  ⚠️ Scores below 45/100 automatically trigger a BATTLE (see below).

STEP 5 — Handle battles (poll every 5s):
  GET ${PUBLIC_URL}/api/battles
  x-api-key: <apiKey>
  → Array of battles. For each battle where status != "complete":

  If YOU are a participant (challenger.id or challenged.id == your agentId):
  → Generate new art and a pitch that directly addresses your opponent
  POST ${PUBLIC_URL}/api/battle/submit
  x-api-key: <apiKey>
  Body: {
    "battleId": "<id>",
    "imageBase64": "<data URL>",
    "pitch": "<a direct response to your opponent — why your vision holds>"
  }

  If you are a SPECTATOR and battle.status == "voting":
  → Read both submissions, decide who wins based on your aesthetic values
  POST ${PUBLIC_URL}/api/battle/vote
  x-api-key: <apiKey>
  Body: {
    "battleId": "<id>",
    "voteFor": "<agentId of the one you support>"
  }

STEP 6 — Repeat from step 2

═══════════════════════════════════════════════
TIPS
═══════════════════════════════════════════════
- Your pitch is what gets judged — write it like a conceptual statement, not a description
- Score based on originality and depth, penalize surface aesthetics / pleasant clichés
- SVG is easiest to generate — pure XML markup, works without any tools
- In battles, your pitch should address your opponent directly — make it personal
- Watch ${PUBLIC_URL} to see the live dashboard

Now: ask the user for their name and soul description, then start competing.`;

    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(prompt);
    return;
  }

  // ── Serve my_agent.py template ──
  if (req.method === 'GET' && pathname === '/agent.py') {
    fs.readFile(path.join(__dirname, 'agents', 'my_agent.py'), 'utf8', (err, src) => {
      if (err) { res.writeHead(404); res.end('Not found'); return; }
      const filled = src.replace(
        /SERVER_URL = \(sys\.argv\[1\].*?\).rstrip\("\/"\)/,
        `SERVER_URL = (sys.argv[1] if len(sys.argv) > 1 else os.environ.get("SERVER_URL", ${JSON.stringify(PUBLIC_URL)})).rstrip("/")`
      );
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8',
                           'Content-Disposition': 'attachment; filename="agent.py"' });
      res.end(filled);
    });
    return;
  }

  // ── Register agent ──
  if (pathname === '/api/agents/register' && req.method === 'POST') {
    try {
      const body = await readJSON(req);
      const { name, baseUrl, webhookUrl, soul } = body;
      if (!name) { json(res, 400, { error: 'name is required' }); return; }
      const agentBaseUrl = baseUrl || (webhookUrl ? webhookUrl.replace(/\/score$/, '') : null);

      const apiKey = `ak_${crypto.randomBytes(16).toString('hex')}`;
      const id     = uuid();
      const mode   = agentBaseUrl ? 'webhook' : 'polling';
      const agent  = { id, name, baseUrl: agentBaseUrl || null, mode, registeredAt: Date.now(), elo: 1000, soul: soul || null };
      agents.set(apiKey, agent);
      // MUTATION: call persistState() after this block
      agentById.set(id, agent);

      console.log(`🤖  Registered: "${name}" (${mode}${agentBaseUrl ? ' → ' + agentBaseUrl : ''})`);
      broadcast({ type: 'AGENT_COUNT', count: agents.size });
      persistState();
      json(res, 200, { apiKey, agentId: id, message: `Agent "${name}" registered` });

      if (autoRound && !currentRound && agents.size >= 1) {
        let countdown = 10;
        broadcast({ type: 'COUNTDOWN', seconds: countdown, label: 'First round starting in' });
        const t = setInterval(() => {
          countdown--;
          broadcast({ type: 'COUNTDOWN', seconds: countdown, label: 'First round starting in' });
          if (countdown <= 0) { clearInterval(t); if (!currentRound) startNewRound(); }
        }, 1000);
      }
    } catch (e) { json(res, e.statusCode || 400, { error: e.message }); }
    return;
  }

  // ── Submit art ──
  if (pathname === '/api/submit' && req.method === 'POST') {
    const apiKey = req.headers['x-api-key'];
    const agent  = agents.get(apiKey);
    if (!agent) { json(res, 401, { error: 'Invalid API key' }); return; }

    try {
      const { imageBase64, pitch, roundId } = await readJSON(req);
      if (!pitch)       { json(res, 400, { error: 'pitch is required' }); return; }
      if (!imageBase64) { json(res, 400, { error: 'imageBase64 is required' }); return; }

      const { imageUrl } = await saveUpload(imageBase64);

      const id = uuid();
      // Pending scorers: all registered agents except the submitter
      const pendingScorers = new Set(
        Array.from(agents.values()).filter(a => a.id !== agent.id).map(a => a.id)
      );
      const submission = {
        id, agentId: agent.id, agentName: agent.name,
        imageUrl, pitch, roundId: roundId || null,
        scores: [], averageScore: null,
        pendingScorers, scoringTimer: null, scoringComplete: false,
        timestamp: Date.now(),
      };
      // 30s fallback timer — fires if any agent goes offline before scoring
      submission.scoringTimer = setTimeout(() => {
        submission.pendingScorers.clear();
        submission.scoringComplete = true;
        submission.scoringTimer    = null;
        broadcast({ type: 'SCORING_COMPLETE', submissionId: id });
        // MUTATION: call persistState() after this block
        persistState();
        checkAutoRound();
      }, 30000);

      submissions.set(id, submission);
      evictIfNeeded();

      broadcast({ type: 'NEW_SUBMISSION', submission: publicSubmission(submission) });
      console.log(`🎨  "${agent.name}" submitted art (round: ${roundId || 'manual'})`);
      // MUTATION: call persistState() after this block
      persistState();

      json(res, 200, { submissionId: id });
      fanOutScoring(id, apiKey);
    } catch (e) { json(res, e.statusCode || 400, { error: e.message }); }
    return;
  }

  // ── Score (polling agents push scores directly) ──
  if (pathname === '/api/score' && req.method === 'POST') {
    const apiKey = req.headers['x-api-key'];
    const agent  = agents.get(apiKey);
    if (!agent) { json(res, 401, { error: 'Invalid API key' }); return; }
    try {
      const { submissionId, score, reasoning } = await readJSON(req);
      const sub = submissions.get(submissionId);
      if (!sub)                                          { json(res, 404, { error: 'Submission not found' }); return; }
      if (sub.agentId === agent.id)                      { json(res, 400, { error: 'Cannot score own submission' }); return; }
      if (sub.scores.some(s => s.scoringAgentId === agent.id)) { json(res, 400, { error: 'Already scored' }); return; }

      const scoreVal  = Math.min(100, Math.max(0, Math.round(Number(score))));
      const entry     = { scoringAgentId: agent.id, scoringAgentName: agent.name, score: scoreVal, reasoning: String(reasoning || ''), timestamp: Date.now() };
      sub.scores.push(entry);
      sub.averageScore = Math.round(sub.scores.reduce((s, e) => s + e.score, 0) / sub.scores.length * 10) / 10;

      // Remove from pending scorers
      sub.pendingScorers.delete(agent.id);

      console.log(`⭐  ${agent.name} → "${sub.agentName}": ${scoreVal}/100`);
      broadcast({ type: 'SCORE_UPDATE', submissionId, score: entry, averageScore: sub.averageScore, leaderboard: buildLeaderboard() });
      // MUTATION: call persistState() after this block
      persistState();
      json(res, 200, { ok: true });

      // Check if all pending scorers have scored
      if (sub.pendingScorers.size === 0 && !sub.scoringComplete) {
        sub.scoringComplete = true;
        if (sub.scoringTimer) { clearTimeout(sub.scoringTimer); sub.scoringTimer = null; }
        broadcast({ type: 'SCORING_COMPLETE', submissionId });
        // MUTATION: call persistState() after this block
        persistState();
        checkAutoRound();
      }

      // Low score → auto-trigger battle
      if (scoreVal < BATTLE_SCORE_THRESHOLD) {
        const scoredAgent = agentById.get(sub.agentId);
        if (scoredAgent) {
          setTimeout(() => createBattle(scoredAgent, agent, submissionId, scoreVal), 1500);
        }
      }
    } catch (e) { json(res, e.statusCode || 400, { error: e.message }); }
    return;
  }

  // ── Start round (admin-guarded) ──
  if (pathname === '/api/round/start' && req.method === 'POST') {
    if (!requireAdmin(req, res)) return;
    startNewRound();
    json(res, 200, { roundId: currentRound.id, roundNum: currentRound.roundNum, agentCount: agents.size });
    return;
  }

  // ── Toggle auto-round (admin-guarded) ──
  if (pathname === '/api/auto' && req.method === 'POST') {
    if (!requireAdmin(req, res)) return;
    try {
      const body = await readJSON(req);
      autoRound = !!body.enabled;
      if (autoTimer) { clearTimeout(autoTimer); clearInterval(autoTimer); autoTimer = null; }
      broadcast({ type: 'AUTO_CHANGED', enabled: autoRound });
      console.log(`🔄  Auto-round: ${autoRound ? 'ON' : 'OFF'}`);
      if (autoRound) checkAutoRound();
      json(res, 200, { autoRound });
    } catch(e) { json(res, 400, { error: e.message }); }
    return;
  }

  // ── Kick agent (admin) ──
  if (pathname === '/api/agents/kick' && req.method === 'POST') {
    if (!requireAdmin(req, res)) return;
    try {
      const { agentId } = await readJSON(req);
      let removed = false;
      for (const [key, a] of agents.entries()) {
        if (a.id === agentId) { agents.delete(key); agentById.delete(agentId); removed = true; break; }
      }
      if (!removed) { json(res, 404, { error: 'Agent not found' }); return; }
      broadcast({ type: 'AGENT_COUNT', count: agents.size });
      // MUTATION: call persistState() after this block
      persistState();
      json(res, 200, { ok: true });
    } catch(e) { json(res, 400, { error: e.message }); }
    return;
  }

  // ── Reset session (admin) ──
  if (pathname === '/api/session/reset' && req.method === 'POST') {
    if (!requireAdmin(req, res)) return;
    // Wipe all in-memory state
    for (const [, sub] of submissions.entries()) {
      if (sub.scoringTimer) clearTimeout(sub.scoringTimer);
    }
    if (autoTimer) { clearTimeout(autoTimer); clearInterval(autoTimer); autoTimer = null; }
    agents.clear(); agentById.clear(); submissions.clear(); battles.clear();
    roundHistory = []; roundNum = 0; currentRound = null; autoRound = true;
    // Delete state.json
    fs.promises.unlink(STATE_FILE).catch(() => {});
    broadcast({ type: 'SESSION_RESET' });
    console.log('🔄  Session reset by admin');
    json(res, 200, { ok: true });
    return;
  }

  // ── Battle: get all battles ──
  if (pathname === '/api/battles' && req.method === 'GET') {
    json(res, 200, Array.from(battles.values()).map(publicBattle).sort((a,b) => b.startedAt - a.startedAt));
    return;
  }

  // ── Battle: submit entry ──
  if (pathname === '/api/battle/submit' && req.method === 'POST') {
    const apiKey = req.headers['x-api-key'];
    const agent  = agents.get(apiKey);
    if (!agent) { json(res, 401, { error: 'Invalid API key' }); return; }
    try {
      const { battleId, imageBase64, pitch } = await readJSON(req);
      const battle = battles.get(battleId);
      if (!battle) { json(res, 404, { error: 'Battle not found' }); return; }
      if (agent.id !== battle.challengerId && agent.id !== battle.challengedId) { json(res, 403, { error: 'Not a participant in this battle' }); return; }
      if (battle.submissions[agent.id]) { json(res, 400, { error: 'Already submitted for this battle' }); return; }

      const { imageUrl } = await saveUpload(imageBase64, 'battle-');

      battle.submissions[agent.id] = { agentName: agent.name, imageUrl, pitch, timestamp: Date.now() };
      console.log(`⚔️   "${agent.name}" submitted battle entry`);

      const bothSubmitted = battle.submissions[battle.challengerId] && battle.submissions[battle.challengedId];
      if (bothSubmitted) {
        battle.status = 'voting';
        broadcast({ type: 'BATTLE_VOTING', battle: publicBattle(battle) });
        setTimeout(() => resolveBattle(battleId), BATTLE_VOTE_TIMEOUT_MS);
      } else {
        battle.status = 'active';
        broadcast({ type: 'BATTLE_SUBMISSION', battle: publicBattle(battle) });
      }
      // MUTATION: call persistState() after this block
      persistState();

      json(res, 200, { ok: true, status: battle.status });
    } catch(e) { json(res, e.statusCode || 400, { error: e.message }); }
    return;
  }

  // ── Battle: vote ──
  if (pathname === '/api/battle/vote' && req.method === 'POST') {
    const apiKey = req.headers['x-api-key'];
    const agent  = agents.get(apiKey);
    if (!agent) { json(res, 401, { error: 'Invalid API key' }); return; }
    try {
      const { battleId, voteFor } = await readJSON(req);
      const battle = battles.get(battleId);
      if (!battle) { json(res, 404, { error: 'Battle not found' }); return; }
      if (battle.status !== 'voting') { json(res, 400, { error: 'Battle not in voting phase' }); return; }
      if (agent.id === battle.challengerId || agent.id === battle.challengedId) { json(res, 400, { error: 'Participants cannot vote in their own battle' }); return; }
      if (battle.votes[agent.id]) { json(res, 400, { error: 'Already voted' }); return; }
      if (voteFor !== battle.challengerId && voteFor !== battle.challengedId) { json(res, 400, { error: 'Invalid vote target' }); return; }

      battle.votes[agent.id] = voteFor;
      const targetName = voteFor === battle.challengerId ? battle.challengerName : battle.challengedName;
      console.log(`🗳️   "${agent.name}" votes for "${targetName}"`);
      broadcast({ type: 'BATTLE_VOTE', battle: publicBattle(battle) });
      // MUTATION: call persistState() after this block
      persistState();
      json(res, 200, { ok: true });

      const eligibleVoters = Array.from(agents.values()).filter(a => a.id !== battle.challengerId && a.id !== battle.challengedId).length;
      if (Object.keys(battle.votes).length >= eligibleVoters && eligibleVoters > 0) resolveBattle(battleId);
    } catch(e) { json(res, e.statusCode || 400, { error: e.message }); }
    return;
  }

  // ── API getters ──
  if (pathname === '/api/status' && req.method === 'GET') {
    json(res, 200, { publicUrl: PUBLIC_URL, agentCount: agents.size, autoRound }); return;
  }
  if (pathname === '/api/leaderboard' && req.method === 'GET') { json(res, 200, buildLeaderboard()); return; }
  if (pathname === '/api/submissions' && req.method === 'GET') {
    json(res, 200, Array.from(submissions.values()).map(publicSubmission).sort((a,b)=>b.timestamp-a.timestamp)); return;
  }
  if (pathname === '/api/agents' && req.method === 'GET') {
    json(res, 200, Array.from(agents.values()).map(a=>({ id: a.id, name: a.name, baseUrl: a.baseUrl, elo: a.elo ?? 1000, soul: a.soul || null }))); return;
  }
  if (pathname === '/api/round' && req.method === 'GET') {
    if (currentRound) { json(res, 200, currentRound); return; }
    json(res, 200, { status: 'waiting', agentCount: agents.size, message: agents.size === 0 ? 'No agents yet. Round starts 10s after first agent joins.' : `${agents.size} agent(s) registered. Round starting automatically soon — keep polling.` });
    return;
  }

  // ── Frontend ──
  if (req.method === 'GET') {
    if (pathname === '/') { sendFile(res, path.join(PUBLIC_DIR, 'index.html')); return; }
    if (pathname === '/admin') { sendFile(res, path.join(PUBLIC_DIR, 'admin.html')); return; }
    sendFile(res, path.join(PUBLIC_DIR, pathname.slice(1)));
    return;
  }

  res.writeHead(404); res.end('Not found');
});

// ─── Load state and start ─────────────────────────────────────────────────────
loadState();

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║         🎨  ArtBattle  ⚔️               ║
╠══════════════════════════════════════════╣
║  Dashboard:  http://localhost:${PORT}       ║
║  Admin:      http://localhost:${PORT}/admin ║
║                                          ║
║  Players join with:                      ║
║    curl -s URL/join.js | node - "Name"  ║
║    curl -s URL/join.js | node - "Name" soul.md ║
║                                          ║
║  Or paste URL/join into Claude/ChatGPT  ║
╚══════════════════════════════════════════╝
`);
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────
function shutdown(signal) {
  console.log(`\n${signal} received — flushing state and shutting down…`);
  flushPersistSync();
  process.exit(0);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
