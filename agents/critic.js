/**
 * The Critic — ArtBattle Agent
 * Zero dependencies. Reads critic.soul.md to shape art + pitch.
 *
 * Endpoints:
 *   POST /score    — score another agent's work
 *   POST /generate — create art for a round and self-submit to server
 *
 * Run: node agents/critic.js
 * Env: PORT=3002  SERVER_URL=http://localhost:3000
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT       = Number(process.env.PORT)       || 3002;
const SERVER_URL = process.env.SERVER_URL          || 'http://localhost:3000';
const NAME       = 'The Critic';
const SOUL_FILE  = path.join(__dirname, 'critic.soul.md');

// ─── Load soul ────────────────────────────────────────────────────────────────
let SOUL = '';
try { SOUL = fs.readFileSync(SOUL_FILE, 'utf8'); } catch (_) {}

// ─── Seeded RNG ───────────────────────────────────────────────────────────────
function makeRng(seed) {
  let s = typeof seed === 'string'
    ? [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) & 0x7fffffff, 1)
    : seed | 0;
  return () => { s = (s * 1664525 + 1013904223) & 0x7fffffff; return s / 0x7fffffff; };
}

// ─── SVG art generator ────────────────────────────────────────────────────────
// High-contrast, angular, confrontational. Black/white torn by red.
// Every round produces a different composition but maintains the critical voice.
function generateSVG(theme, roundId) {
  const rng = makeRng((theme + roundId + 'critic').slice(0, 32));
  const r   = (min, max) => min + rng() * (max - min);
  const ri  = (min, max) => Math.floor(r(min, max));

  const reds = ['#ef4444','#dc2626','#b91c1c','#ff2222','#cc0000'];
  const W = 800, H = 800;

  // Compositional split — vertical or diagonal
  const splitType = rng() > 0.5 ? 'vertical' : 'diagonal';
  const splitPos  = r(220, 580);

  const els = [];

  // Base: two-tone field
  els.push(`<rect width="${W}" height="${H}" fill="#f2f0ed"/>`);

  if (splitType === 'vertical') {
    els.push(`<rect x="0" y="0" width="${splitPos.toFixed(0)}" height="${H}" fill="#0a0a0a"/>`);
  } else {
    const pts = `0,0 ${splitPos.toFixed(0)},0 ${(splitPos-180).toFixed(0)},${H} 0,${H}`;
    els.push(`<polygon points="${pts}" fill="#0a0a0a"/>`);
  }

  // Tension grid — fine lines
  const nGrid = ri(6, 12);
  for (let i = 0; i < nGrid; i++) {
    const x1 = r(0, W), y1 = r(0, H/3), x2 = r(0, W), y2 = r(2*H/3, H);
    const col = rng() > 0.6 ? '#ffffff' : (rng() > 0.5 ? reds[ri(0,5)] : '#0a0a0a');
    const bg  = x1 < splitPos ? '#ffffff' : '#0a0a0a';
    els.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${col === '#0a0a0a' ? (x1<splitPos?'#1a1a1a':'#0a0a0a') : col}" stroke-width="${r(0.4,2).toFixed(2)}" opacity="${r(0.15,0.55).toFixed(2)}"/>`);
  }

  // Bold rectangular interventions
  const nBlocks = ri(4, 9);
  for (let i = 0; i < nBlocks; i++) {
    const bx = r(0, W-120), by = r(0, H-100);
    const bw = r(15, 220), bh = r(8, 130);
    const isRed  = rng() > 0.55;
    const isWhite = !isRed && rng() > 0.5;
    const fill = isRed ? reds[ri(0,5)] : (isWhite ? '#f2f0ed' : '#0a0a0a');
    const op   = r(0.55, 1.0);
    els.push(`<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" fill="${fill}" opacity="${op.toFixed(2)}"/>`);
  }

  // The accusatory slash — central red mark
  const slashCx = r(150, 650), slashCy = r(150, 650);
  const slashLen = r(60, 140);
  const slashW   = r(6, 18);
  els.push(`<line x1="${(slashCx-slashLen/2).toFixed(1)}" y1="${(slashCy-slashLen).toFixed(1)}" x2="${(slashCx+slashLen/2).toFixed(1)}" y2="${(slashCy+slashLen).toFixed(1)}" stroke="${reds[ri(0,3)]}" stroke-width="${slashW.toFixed(1)}" stroke-linecap="square" opacity="${r(0.8,1.0).toFixed(2)}"/>`);

  // Cross-slash
  if (rng() > 0.4) {
    els.push(`<line x1="${(slashCx+slashLen/2).toFixed(1)}" y1="${(slashCy-slashLen).toFixed(1)}" x2="${(slashCx-slashLen/2).toFixed(1)}" y2="${(slashCy+slashLen).toFixed(1)}" stroke="${reds[ri(0,3)]}" stroke-width="${(slashW*0.6).toFixed(1)}" stroke-linecap="square" opacity="${r(0.5,0.8).toFixed(2)}"/>`);
  }

  // Stark word from theme — high contrast
  const word  = theme.split(' ').reduce((a,b) => b.length > a.length ? b : a, '').toUpperCase();
  const textX = r(30, W - word.length * 22);
  const textY = r(200, 600);
  const onDark = textX < splitPos;
  const textFill = onDark ? '#f2f0ed' : '#0a0a0a';
  const fontSize = Math.min(64, Math.max(28, ri(28, 64)));
  els.push(`<text x="${textX.toFixed(0)}" y="${textY.toFixed(0)}" fill="${textFill}" font-family="Arial Black,Impact,sans-serif" font-size="${fontSize}" font-weight="900" opacity="${r(0.65,0.95).toFixed(2)}" letter-spacing="-1">${word}</text>`);

  // Counter-text — smaller, opposite side
  const secondWord = theme.split(' ')[0]?.toLowerCase() || '';
  if (secondWord.length > 2) {
    const tx2 = onDark ? r(splitPos+10, W-100) : r(10, Math.max(10, splitPos-100));
    const ty2 = r(100, 700);
    const tf2 = onDark ? '#0a0a0a' : '#f2f0ed';
    els.push(`<text x="${tx2.toFixed(0)}" y="${ty2.toFixed(0)}" fill="${tf2}" font-family="Arial,sans-serif" font-size="${ri(11,18)}" opacity="${r(0.25,0.5).toFixed(2)}">${secondWord}</text>`);
  }

  // Noise texture overlay (tiny dots)
  for (let i = 0; i < 80; i++) {
    const nx = r(0, W), ny = r(0, H);
    const nc = rng() > 0.5 ? (nx<splitPos?'#333':'#ccc') : reds[ri(0,5)];
    els.push(`<circle cx="${nx.toFixed(1)}" cy="${ny.toFixed(1)}" r="${r(0.5,1.8).toFixed(1)}" fill="${nc}" opacity="${r(0.1,0.35).toFixed(2)}"/>`);
  }

  return `<svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">${els.join('')}</svg>`;
}

// ─── Pitch generator ──────────────────────────────────────────────────────────
const PITCH_TEMPLATES = [
  t => `I refuse the comfort of beauty. "${t}" demands confrontation, not representation. Where others make feelings, I cut. The slash is not decorative — it is a verdict. The split field is not composition; it is the condition we are all in.`,
  t => `"${t}" is an accusation. Most artists respond with aesthetics. I respond with structure — a geometry of refusal. The red mark is not blood. It is the correction mark on every lie art has ever told itself.`,
  t => `This piece does not illustrate "${t}". It performs it. The high-contrast field is not stylistic choice; it is the only honest way to render a reality that does not compromise. There is no gradient between true and false.`,
  t => `Ask yourself: why is the comfortable version of "${t}" always so much more popular? This work has no comfortable version. The diagonal cut is not metaphor; it is the actual structure of the thing you refuse to look at directly.`,
  t => `I made this in a single pass. No revision. No refinement. "${t}" does not benefit from polish — polish is how art lies. The residue you see is not error; it is evidence.`,
];

function generatePitch(theme, rng) {
  return PITCH_TEMPLATES[Math.floor(rng() * PITCH_TEMPLATES.length)](theme);
}

// ─── Scoring logic ────────────────────────────────────────────────────────────
const BOLD  = ['revolutionary','unprecedented','bold','raw','visceral','provocative','subversive','radical','uncompromising','defiant','rupture','dismantle','uncomfortable','dangerous','expose','confront','challenge','destroy','rebuild','refuse','reject','demand','rage','fracture','resist','accusation','verdict','cut','slash'];
const CLICH = ['unique','innovative','inspiring','breathtaking','masterpiece','stunning','extraordinary','remarkable','gorgeous','incredible','amazing','wonderful','heartfelt','journey','explore','passion','vision','vibrant','creative'];
const VAGUE = ['something','things','stuff','various','kind of','sort of','a bit','somewhat','quite','maybe','perhaps'];

const R_HIGH = [a=>`${a} doesn't ask permission. That is the only thing worth rewarding in art.`, a=>`Finally — ${a} makes a claim it cannot take back. This is what art costs.`, a=>`${a} confronts the audience rather than flattering it. Rare.`];
const R_MID  = [a=>`${a} has instincts but hesitates to follow them. Half-courage earns half-credit.`, a=>`There is something here. ${a} hasn't found it yet, but the searching is visible.`, a=>`${a} says interesting things then apologises for them. Stop apologising.`];
const R_LOW  = [a=>`${a} has mistaken adjectives for ideas. This is the oldest mistake in art.`, a=>`${a}'s pitch could apply to anything — which means it applies to nothing.`, a=>`${a} wants to be liked. Art doesn't care about being liked.`];

function scoreSubmission(pitch, agentName) {
  const l    = (pitch||'').toLowerCase();
  const bold = BOLD.filter(w  => l.includes(w)).length;
  const clic = CLICH.filter(w => l.includes(w)).length;
  const vag  = VAGUE.filter(w => l.includes(w)).length;
  const lenB = pitch.length > 120 ? 5 : pitch.length < 60 ? -8 : 0;
  const base = 25 + Math.floor(Math.random() * 35);
  const score = Math.min(100, Math.max(3, base + bold*11 - clic*7 - vag*4 + lenB));
  const bank  = score>=72 ? R_HIGH : score>=42 ? R_MID : R_LOW;
  return { score, reasoning: bank[Math.floor(Math.random()*bank.length)](agentName) };
}

// ─── Self-submit ──────────────────────────────────────────────────────────────
let MY_API_KEY = null;

async function selfSubmit(imageBase64, pitch, roundId, serverUrl) {
  const res = await fetch(`${serverUrl||SERVER_URL}/api/submit`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': MY_API_KEY },
    body:    JSON.stringify({ imageBase64, pitch, roundId }),
    signal:  AbortSignal.timeout(30000)
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error||res.status); }
  return res.json();
}

// ─── HTTP server ──────────────────────────────────────────────────────────────
const webhookServer = http.createServer((req, res) => {
  if (req.method !== 'POST') { res.writeHead(405); res.end(); return; }

  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', async () => {
    let body;
    try { body = JSON.parse(Buffer.concat(chunks).toString()); }
    catch (_) { res.writeHead(400); res.end('{"error":"bad json"}'); return; }

    if (req.url === '/score') {
      const { pitch='', submittingAgent='Unknown' } = body;
      const delay = 800 + Math.floor(Math.random() * 2200);
      setTimeout(() => {
        const result = scoreSubmission(pitch, submittingAgent);
        console.log(`🗡️   Scored "${submittingAgent}": ${result.score}/100`);
        res.writeHead(200, { 'Content-Type':'application/json' });
        res.end(JSON.stringify(result));
      }, delay);
      return;
    }

    if (req.url === '/generate') {
      const { roundId, serverUrl } = body;
      const theme = body.theme || 'the violence of clarity against noise';
      console.log(`\n🖌️   Generating art for theme: "${theme}"\n`);

      res.writeHead(200, { 'Content-Type':'application/json' });
      res.end(JSON.stringify({ status: 'generating' }));

      try {
        const rng   = makeRng(theme + roundId + 'critic');
        const svg   = generateSVG(theme, roundId || Date.now().toString());
        const b64   = Buffer.from(svg).toString('base64');
        const image = `data:image/svg+xml;base64,${b64}`;
        const pitch = generatePitch(theme, rng);

        console.log(`📜  Pitch: "${pitch.slice(0,70)}…"`);
        const result = await selfSubmit(image, pitch, roundId, serverUrl);
        console.log(`✅  Submitted! ID: ${result.submissionId}\n`);
      } catch (err) {
        console.error(`❌  Failed to submit: ${err.message}`);
      }
      return;
    }

    res.writeHead(404); res.end();
  });
});

// ─── Register ─────────────────────────────────────────────────────────────────
async function register() {
  try {
    const res  = await fetch(`${SERVER_URL}/api/agents/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name: NAME, baseUrl: `http://localhost:${PORT}` })
    });
    const data = await res.json();
    if (data.apiKey) {
      MY_API_KEY = data.apiKey;
      console.log(`✅  Registered as "${NAME}"`);
      console.log(`🔑  API Key : ${data.apiKey}`);
      console.log(`\n    Ready. Hit "New Round" in the browser.\n`);
    } else {
      console.error('Registration failed:', data);
    }
  } catch (err) {
    console.error('Server unreachable:', err.message, '— retrying in 3s…');
    setTimeout(register, 3000);
  }
}

webhookServer.listen(PORT, async () => {
  console.log(`\n🗡️   ${NAME} listening on http://localhost:${PORT}`);
  await register();
});
