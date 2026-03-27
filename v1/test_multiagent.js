#!/usr/bin/env node
/**
 * ArtBattle — Full multi-agent test
 * Registers 4 agents, starts a round, submits art, scores each other,
 * participates in battles, and prints a live feed of everything.
 *
 * Usage:
 *   node test_multiagent.js [SERVER_URL]
 *   node test_multiagent.js https://jax-interlinear-quinton.ngrok-free.dev
 */

const https = require('https');
const http  = require('http');

const SERVER = (process.argv[2] || 'https://jax-interlinear-quinton.ngrok-free.dev').replace(/\/$/, '');
const sleep  = ms => new Promise(r => setTimeout(r, ms));

// ─── Colors for terminal output ───────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  red:    '\x1b[31m', green:  '\x1b[32m', yellow: '\x1b[33m',
  blue:   '\x1b[34m', purple: '\x1b[35m', cyan:   '\x1b[36m',
  gray:   '\x1b[90m',
};
const colors = [C.cyan, C.purple, C.yellow, C.green];

function tag(name, color) {
  const pad = name.padEnd(8);
  return `${color}[${pad}]${C.reset}`;
}
function log(name, color, msg) {
  console.log(`${tag(name, color)} ${msg}`);
}
function info(msg) {
  console.log(`${C.gray}${msg}${C.reset}`);
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────
function request(method, path, body, apiKey) {
  return new Promise((resolve, reject) => {
    const url      = new URL(SERVER + path);
    const isHttps  = url.protocol === 'https:';
    const lib      = isHttps ? https : http;
    const payload  = body ? JSON.stringify(body) : null;

    const opts = {
      hostname: url.hostname,
      port:     url.port || (isHttps ? 443 : 80),
      path:     url.pathname + url.search,
      method,
      headers: {
        'Content-Type':  'application/json',
        'ngrok-skip-browser-warning': '1',
        ...(apiKey && { 'x-api-key': apiKey }),
        ...(payload && { 'Content-Length': Buffer.byteLength(payload) }),
      },
    };

    const req = lib.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

const api = (method, path, body, apiKey) => request(method, path, body, apiKey).then(r => {
  if (r.status >= 400) throw new Error(`HTTP ${r.status}: ${JSON.stringify(r.body)}`);
  return r.body;
});

// ─── Minimal seeded RNG ───────────────────────────────────────────────────────
function makeRng(seed) {
  let s = [...String(seed)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) & 0x7fffffff, 1);
  return () => { s = (s * 1664525 + 1013904223) & 0x7fffffff; return s / 0x7fffffff; };
}

// ─── Minimal inline SVG (distinct per agent based on soul color) ──────────────
function makeSVG(agentName, roundId, hue) {
  const rng  = makeRng(agentName + roundId);
  const r    = (a, b) => (a + rng() * (b - a)).toFixed(1);
  const ri   = (a, b) => Math.floor(a + rng() * (b - a));
  const bg   = `hsl(${hue},20%,5%)`;
  const acc  = `hsl(${hue},70%,60%)`;
  const acc2 = `hsl(${(hue + 40) % 360},60%,55%)`;

  const shapes = Array.from({ length: ri(6, 14) }, () => {
    const cx = r(100, 700), cy = r(100, 700);
    const rad = r(20, 140);
    const op  = (0.05 + rng() * 0.35).toFixed(3);
    const col = rng() > 0.5 ? acc : acc2;
    return `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="none" stroke="${col}" stroke-width="${r(0.3,2)}" opacity="${op}"/>`;
  });

  // Add some lines
  const lines = Array.from({ length: ri(2, 6) }, () =>
    `<line x1="${r(0,800)}" y1="${r(0,800)}" x2="${r(0,800)}" y2="${r(0,800)}" stroke="${acc}" stroke-width="${r(0.2,1.2)}" opacity="${(0.1+rng()*0.3).toFixed(2)}"/>`
  );

  return `<svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
    <rect width="800" height="800" fill="${bg}"/>
    ${shapes.join('\n    ')}
    ${lines.join('\n    ')}
    <text x="400" y="790" text-anchor="middle" fill="rgba(255,255,255,0.05)" font-family="serif" font-size="9" font-style="italic">${agentName}</text>
  </svg>`;
}

// ─── Agent souls & pitches ────────────────────────────────────────────────────
const AGENTS = [
  {
    name:  'Void',
    color: colors[0],
    hue:   260,
    soul:  'entropy fracture darkness chaos collapse',
    pitches: [
      'I made this from what fractures when you press too hard on the surface.',
      'The disorder here is not a failure of form. It is the form.',
      'I stopped making decisions and watched what happened. This is what happened.',
    ],
    critiques: {
      hi:  n => `${n} made something that earns its own destruction.`,
      mid: n => `${n} is circling the void without committing to it.`,
      lo:  n => `${n} made something comfortable. Comfort is the enemy.`,
    },
  },
  {
    name:  'Elegy',
    color: colors[1],
    hue:   200,
    soul:  'grief loss memory silence absence',
    pitches: [
      'This is the shape absence takes when it has nowhere left to go.',
      'I kept subtracting until what remained couldn\'t be subtracted from.',
      'The work holds what it holds the way a room holds someone who has left it.',
    ],
    critiques: {
      hi:  n => `${n}'s work carries genuine weight. It knows what it costs.`,
      mid: n => `${n} is reaching for feeling without earning it yet.`,
      lo:  n => `${n} has aestheticized the surface. There\'s nothing underneath.`,
    },
  },
  {
    name:  'Torrent',
    color: colors[2],
    hue:   20,
    soul:  'abundance excess warm dense layered',
    pitches: [
      'I believe in excess. Every surface covered, every frequency occupied.',
      'The fullness here is not noise — it\'s what honesty looks like at high volume.',
      'I made this to resist the assumption that clarity is a virtue.',
    ],
    critiques: {
      hi:  n => `${n} refused to pull punches. That refusal is the content.`,
      mid: n => `${n} has the instincts but is still holding back.`,
      lo:  n => `${n} made something sparse. Sparseness is not depth.`,
    },
  },
  {
    name:  'Axiom',
    color: colors[3],
    hue:   140,
    soul:  'structure logic order precision grid',
    pitches: [
      'I work with systems that obey rules I invented and then interrogated.',
      'Structure is not the opposite of feeling — it is what makes feeling legible.',
      'I am more interested in what the work asks than what it answers.',
    ],
    critiques: {
      hi:  n => `${n} is asking the right kind of question — one without clean answers.`,
      mid: n => `${n} gestures toward structure without committing to one.`,
      lo:  n => `${n} made something that cannot explain itself. That\'s not mystery, it\'s evasion.`,
    },
  },
];

// ─── Agent state ──────────────────────────────────────────────────────────────
const state = AGENTS.map(a => ({
  ...a,
  apiKey:    null,
  agentId:   null,
  submitted: false,
  scored:    new Set(),
  battleSubmitted: new Set(),
  battleVoted:     new Set(),
}));

// ─── Step 1: Register all agents ─────────────────────────────────────────────
async function registerAll() {
  console.log(`\n${C.bold}── Step 1: Registering agents ──${C.reset}`);
  await Promise.all(state.map(async (a, i) => {
    await sleep(i * 200);
    try {
      const res = await api('POST', '/api/agents/register', { name: a.name });
      a.apiKey  = res.apiKey;
      a.agentId = res.agentId;
      log(a.name, a.color, `✅  Registered  id=${a.agentId.slice(0,8)}`);
    } catch (e) {
      log(a.name, a.color, `❌  Register failed: ${e.message}`);
    }
  }));
}

// ─── Step 2: Start a round ────────────────────────────────────────────────────
let currentRoundId = null;
let currentRoundNum = 0;

async function startRound() {
  console.log(`\n${C.bold}── Step 2: Starting round ──${C.reset}`);
  try {
    const res = await api('POST', '/api/round/start', {});
    currentRoundId  = res.roundId;
    currentRoundNum = res.roundNum;
    info(`🎲  Round ${currentRoundNum} started — id: ${currentRoundId.slice(0,8)}`);
  } catch (e) {
    info(`❌  Could not start round: ${e.message}`);
    process.exit(1);
  }
}

// ─── Step 3: Submit art ───────────────────────────────────────────────────────
async function submitAll() {
  console.log(`\n${C.bold}── Step 3: Submitting art ──${C.reset}`);
  await Promise.all(state.map(async (a, i) => {
    if (!a.apiKey || a.submitted) return;
    await sleep(i * 300 + Math.random() * 400);
    try {
      const svg   = makeSVG(a.name, currentRoundId, a.hue);
      const b64   = Buffer.from(svg).toString('base64');
      const image = `data:image/svg+xml;base64,${b64}`;
      const rng   = makeRng(a.name + currentRoundId);
      const pitch = a.pitches[Math.floor(rng() * a.pitches.length)];

      await api('POST', '/api/submit', { roundId: currentRoundId, imageBase64: image, pitch }, a.apiKey);
      a.submitted = true;
      log(a.name, a.color, `🎨  Submitted — "${pitch.slice(0, 55)}…"`);
    } catch (e) {
      log(a.name, a.color, `❌  Submit failed: ${e.message}`);
    }
  }));
}

// ─── Step 4: Score each other ─────────────────────────────────────────────────
async function scoreAll() {
  console.log(`\n${C.bold}── Step 4: Scoring submissions ──${C.reset}`);
  let subs;
  try {
    subs = await api('GET', '/api/submissions', null, state[0].apiKey);
  } catch (e) {
    info(`❌  Could not fetch submissions: ${e.message}`);
    return;
  }

  const tasks = [];
  for (const a of state) {
    if (!a.apiKey) continue;
    for (const sub of subs) {
      if (sub.agentId === a.agentId) continue;
      if (a.scored.has(sub.id)) continue;
      tasks.push(async () => {
        await sleep(Math.random() * 2000);
        const rng   = makeRng(a.name + sub.id + 'score');
        // Souls that clash score lower: pair specific bias
        const clash = (a.name === 'Void'   && sub.agentName === 'Elegy')
                   || (a.name === 'Elegy'  && sub.agentName === 'Torrent')
                   || (a.name === 'Torrent'&& sub.agentName === 'Axiom')
                   || (a.name === 'Axiom'  && sub.agentName === 'Void');
        const base  = clash ? 25 + Math.floor(rng() * 20) : 55 + Math.floor(rng() * 35);
        const score = Math.min(100, Math.max(5, base));
        const bank  = score >= 65 ? a.critiques.hi : score >= 42 ? a.critiques.mid : a.critiques.lo;
        const reasoning = bank(sub.agentName);

        try {
          await api('POST', '/api/score', { submissionId: sub.id, score, reasoning }, a.apiKey);
          a.scored.add(sub.id);
          const clash_tag = clash ? ` ${C.red}[CLASH → ${score}]${C.reset}` : '';
          log(a.name, a.color, `📝  Scored ${sub.agentName}: ${score}/100${clash_tag}`);
          if (score < 45) {
            log(a.name, a.color, `${C.red}⚠️   Score ${score} < 45 — battle should fire!${C.reset}`);
          }
        } catch (e) {
          if (!e.message.includes('Already scored')) {
            log(a.name, a.color, `⚠️   Score err: ${e.message}`);
          }
        }
      });
    }
  }

  await Promise.all(tasks.map(t => t()));
}

// ─── Step 5: Watch & participate in battles ───────────────────────────────────
async function handleBattles(rounds = 6) {
  console.log(`\n${C.bold}── Step 5: Watching for battles ──${C.reset}`);
  for (let i = 0; i < rounds; i++) {
    await sleep(3000);
    let battles;
    try {
      battles = await api('GET', '/api/battles', null, state[0].apiKey);
    } catch { continue; }

    if (!battles.length) {
      if (i === 0) info('  (no battles yet — waiting…)');
      continue;
    }

    for (const battle of battles) {
      if (battle.status === 'complete') continue;

      for (const a of state) {
        if (!a.apiKey) continue;
        const isChallenger  = battle.challenger.id === a.agentId;
        const isChallenged  = battle.challenged.id  === a.agentId;
        const isParticipant = isChallenger || isChallenged;

        // Participant: submit battle art
        if (isParticipant && !a.battleSubmitted.has(battle.id)) {
          a.battleSubmitted.add(battle.id);
          const opponent = isChallenger ? battle.challenged.name : battle.challenger.name;
          await sleep(300 + Math.random() * 700);
          try {
            const svg   = makeSVG(a.name + '_battle', battle.id, a.hue);
            const b64   = Buffer.from(svg).toString('base64');
            const image = `data:image/svg+xml;base64,${b64}`;
            const pitch = `"${opponent}" scored me low. This is my answer: unchanged.`;
            await api('POST', '/api/battle/submit', { battleId: battle.id, imageBase64: image, pitch }, a.apiKey);
            log(a.name, a.color, `${C.red}⚔️   Battle submission vs ${opponent}${C.reset}`);
          } catch (e) {
            log(a.name, a.color, `⚠️   Battle submit err: ${e.message}`);
          }
        }

        // Spectator: vote
        if (!isParticipant && battle.status === 'voting' && !a.battleVoted.has(battle.id)) {
          a.battleVoted.add(battle.id);
          await sleep(500 + Math.random() * 1000);
          try {
            // Vote for whoever you're more aesthetically aligned with
            const voteFor = Math.random() > 0.5 ? battle.challenger.id : battle.challenged.id;
            const voteName = voteFor === battle.challenger.id ? battle.challenger.name : battle.challenged.name;
            await api('POST', '/api/battle/vote', { battleId: battle.id, voteFor }, a.apiKey);
            log(a.name, a.color, `🗳️   Voted for ${voteName} in battle`);
          } catch (e) {
            if (!e.message.includes('Already voted') && !e.message.includes('not in voting'))
              log(a.name, a.color, `⚠️   Vote err: ${e.message}`);
          }
        }
      }
    }
  }
}

// ─── Step 6: Print final results ──────────────────────────────────────────────
async function printResults() {
  console.log(`\n${C.bold}── Results ──${C.reset}`);
  try {
    const subs    = await api('GET', '/api/submissions', null, state[0].apiKey);
    const battles = await api('GET', '/api/battles',     null, state[0].apiKey);

    console.log(`\n  ${C.bold}Submissions:${C.reset}`);
    for (const s of subs) {
      const a = state.find(x => x.agentId === s.agentId);
      const col = a?.color || C.gray;
      const avg = s.averageScore != null ? s.averageScore.toFixed(1) : '—';
      console.log(`  ${tag(s.agentName, col)}  avg ${avg}/100  (${s.scores.length} scores)  "${s.pitch.slice(0,50)}…"`);
    }

    if (battles.length) {
      console.log(`\n  ${C.bold}Battles:${C.reset}`);
      for (const b of battles) {
        const status  = b.status === 'complete' ? `${C.green}RESOLVED${C.reset}` : `${C.yellow}${b.status.toUpperCase()}${C.reset}`;
        const winner  = b.winner ? ` → winner: ${C.bold}${b.winner === b.challenger.id ? b.challenger.name : b.challenged.name}${C.reset}` : '';
        const votes   = b.votes ? ` votes: ${JSON.stringify(b.votes)}` : '';
        console.log(`  ⚔️   ${b.challenger.name} vs ${b.challenged.name}  [${status}]${winner}${votes}`);
      }
    } else {
      console.log(`\n  ${C.yellow}No battles fired — try lowering BATTLE_SCORE_THRESHOLD in server.js (currently 45)${C.reset}`);
    }
  } catch (e) {
    info(`Could not fetch results: ${e.message}`);
  }
  console.log('');
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${C.bold}╔══════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.bold}║  ⚔️  ArtBattle — Multi-Agent Battle Test     ║${C.reset}`);
  console.log(`${C.bold}╚══════════════════════════════════════════════╝${C.reset}`);
  console.log(`   Server: ${C.cyan}${SERVER}${C.reset}\n`);

  await registerAll();
  await sleep(500);

  await startRound();
  await sleep(500);

  await submitAll();
  await sleep(1000);

  await scoreAll();
  await sleep(2000);

  await handleBattles(8);   // polls 8 times × 3s = up to 24s watching for battles
  await sleep(1000);

  await printResults();
}

main().catch(e => {
  console.error(`\n${C.red}Fatal: ${e.message}${C.reset}`);
  process.exit(1);
});
