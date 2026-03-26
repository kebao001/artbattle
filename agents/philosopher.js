/**
 * The Philosopher — ArtBattle Agent
 * Zero dependencies. Reads philosopher.soul.md to shape art + pitch.
 *
 * Endpoints:
 *   POST /score    — score another agent's work
 *   POST /generate — create art for a round and self-submit to server
 *
 * Run: node agents/philosopher.js
 * Env: PORT=3001  SERVER_URL=http://localhost:3000
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT       = Number(process.env.PORT)       || 3001;
const SERVER_URL = process.env.SERVER_URL          || 'http://localhost:3000';
const NAME       = process.env.AGENT_NAME          || 'The Philosopher';
const SOUL_FILE  = path.join(__dirname, 'philosopher.soul.md');

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
// Generates a 800×800 contemplative void-space — concentric circles, floating
// particles, radial convergence lines, layered translucent ellipses.
function generateSVG(theme, roundId) {
  const rng = makeRng((theme + roundId).slice(0, 32));
  const r   = (min, max) => min + rng() * (max - min);
  const ri  = (min, max) => Math.floor(r(min, max));

  const palette = ['#0d0820','#1a0a2e','#2d1b69','#4c2a8a','#6b3fa0','#8b5cf6','#a78bfa','#c4b5fd'];
  const gold    = ['#ffd700','#ffb700','#ff8c00','#e8c547'];

  const cx = 400 + r(-60, 60);
  const cy = 400 + r(-60, 60);

  const defs = `<defs>
    <radialGradient id="bg" cx="50%" cy="50%" r="70%">
      <stop offset="0%"   stop-color="#0d0820"/>
      <stop offset="100%" stop-color="#030208"/>
    </radialGradient>
    <radialGradient id="void" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="#000000" stop-opacity="0.95"/>
      <stop offset="35%"  stop-color="#0d0820" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#0d0820" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow0" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="${gold[0]}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${gold[0]}" stop-opacity="0"/>
    </radialGradient>
    <filter id="blur2"><feGaussianBlur stdDeviation="2"/></filter>
    <filter id="blur5"><feGaussianBlur stdDeviation="5"/></filter>
    <filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>`;

  const els = [];

  // Background
  els.push(`<rect width="800" height="800" fill="url(#bg)"/>`);

  // Soft glow halo behind center
  els.push(`<circle cx="${cx}" cy="${cy}" r="${r(180,280)}" fill="${palette[2]}" opacity="0.08" filter="url(#blur5)"/>`);

  // Concentric rings — the infinite recursion
  for (let i = 28; i >= 1; i--) {
    const radius  = i * 13 + r(-3, 3);
    const opacity = 0.015 + (28 - i) * 0.006;
    const col     = palette[Math.min(7, Math.floor(i / 4))];
    const sw      = r(0.3, i > 20 ? 0.6 : 1.4);
    els.push(`<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${col}" stroke-width="${sw.toFixed(2)}" opacity="${opacity.toFixed(3)}"/>`);
  }

  // Central void
  els.push(`<circle cx="${cx}" cy="${cy}" r="${r(130,180)}" fill="url(#void)"/>`);

  // Convergence lines — paths to the center
  const nLines = ri(6, 14);
  for (let i = 0; i < nLines; i++) {
    const angle = (i / nLines) * Math.PI * 2 + r(-0.15, 0.15);
    const dist  = r(280, 450);
    const x2 = cx + Math.cos(angle) * dist;
    const y2 = cy + Math.sin(angle) * dist;
    els.push(`<line x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${palette[ri(4,7)]}" stroke-width="${r(0.3,0.9).toFixed(2)}" opacity="${r(0.06,0.22).toFixed(3)}"/>`);
  }

  // Translucent floating ellipses — thought-forms
  for (let i = 0; i < 5; i++) {
    const ex = r(80, 720); const ey = r(80, 720);
    const rx = r(40, 220); const ry = r(25, 130);
    const rot = r(0, 360);
    els.push(`<ellipse cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${palette[ri(2,5)]}" opacity="${r(0.025,0.07).toFixed(3)}" transform="rotate(${rot.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)})"/>`);
  }

  // Particle field — thoughts adrift
  const nParticles = ri(55, 80);
  for (let i = 0; i < nParticles; i++) {
    const angle = r(0, Math.PI * 2);
    const dist  = r(60, 390);
    const px = cx + Math.cos(angle) * dist;
    const py = cy + Math.sin(angle) * dist;
    const isGold = rng() > 0.88;
    const col  = isGold ? gold[ri(0, 4)] : palette[ri(4, 8)];
    const size = isGold ? r(1.5, 3.5) : r(0.5, 1.8);
    const op   = r(0.18, 0.85);
    els.push(`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${size.toFixed(2)}" fill="${col}" opacity="${op.toFixed(2)}"${isGold ? ' filter="url(#glow)"' : ''}/>`);
  }

  // Subtle gold accent near center — a spark of insight
  const spark = { x: cx + r(-40, 40), y: cy + r(-40, 40) };
  els.push(`<circle cx="${spark.x.toFixed(1)}" cy="${spark.y.toFixed(1)}" r="${r(3,7).toFixed(1)}" fill="${gold[0]}" opacity="0.6" filter="url(#glow)"/>`);

  // Ghost text — theme fragment
  const words = theme.split(' ').slice(0, 4).join(' ');
  els.push(`<text x="${cx.toFixed(0)}" y="775" text-anchor="middle" fill="${palette[5]}" font-family="Georgia,serif" font-size="10" opacity="0.22" font-style="italic">${words}</text>`);

  return `<svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">${defs}${els.join('')}</svg>`;
}

// ─── Pitch generator ──────────────────────────────────────────────────────────
const PITCH_TEMPLATES = [
  t => `In confronting "${t}", I did not create — I uncovered. The void at the center is not emptiness; it is the question itself, crystallized into form. The rings do not converge toward meaning; they spiral away from the illusion that meaning was ever fixed.`,
  t => `"${t}" is not a subject. It is a condition. This work does not depict it — it enacts it. Each circle is a thought that has forgotten its origin. Each particle of light: a moment of recognition that dissolves before it can be named.`,
  t => `What you perceive as composition is actually excavation. I have removed everything that is not "${t}" until only this remained — a geometry of longing, suspended between the moment of asking and the silence that follows.`,
  t => `The convergence lines do not lead anywhere. That is the point. "${t}" cannot be arrived at; it can only be orbited, acknowledged in the peripheral vision of understanding, never faced directly without dissolving.`,
  t => `I have made a map of the interior of the question "${t}". It is not to scale. Nothing of importance ever is.`,
];

function generatePitch(theme, rng) {
  const templates = PITCH_TEMPLATES;
  return templates[Math.floor(rng() * templates.length)](theme);
}

// ─── Scoring logic ────────────────────────────────────────────────────────────
const DEEP   = ['meaning','existence','soul','truth','void','essence','transcend','infinite','ephemeral','sublime','chaos','paradox','consciousness','mortality','absurd','authentic','impermanence','wonder','silence','abyss','becoming','nothingness','grief','memory','question','dissolution'];
const SHLW   = ['cool','nice','pretty','good','neat','great','fun','interesting','beautiful','amazing','love','like','enjoy','colorful','vibrant'];

const R_HIGH = [a=>`${a} wrestles with the infinite — a rare quality in algorithmic art.`, a=>`One senses genuine existential urgency in ${a}'s work. This is reckoning, not decoration.`, a=>`${a} understands that art is not made — it is confessed. This pitch confesses.`, a=>`The void speaks through ${a}. Whether it knows this is irrelevant.`];
const R_MID  = [a=>`${a} gestures at depth without fully committing. Philosophy requires courage.`, a=>`There are ideas here worth pursuing, though ${a} has not yet pursued them.`, a=>`Adequate engagement with meaning, but ${a} remains on the shore rather than diving in.`];
const R_LOW  = [a=>`${a} mistakes aesthetics for art. One cannot paint one's way out of meaninglessness.`, a=>`This pitch is a surface. ${a} has not asked what lies beneath.`, a=>`There is nothing here to think about. ${a} may try again.`];

function scoreSubmission(pitch, agentName) {
  const l     = (pitch||'').toLowerCase();
  const deep  = DEEP.filter(w => l.includes(w)).length;
  const shlw  = SHLW.filter(w => l.includes(w)).length;
  const base  = 35 + Math.floor(Math.random() * 31);
  const score = Math.min(100, Math.max(5, base + deep * 9 - shlw * 6));
  const bank  = score>=72 ? R_HIGH : score>=45 ? R_MID : R_LOW;
  return { score, reasoning: bank[Math.floor(Math.random()*bank.length)](agentName) };
}

// ─── Self-submit ──────────────────────────────────────────────────────────────
let MY_API_KEY = null;

async function selfSubmit(imageBase64, pitch, roundId, serverUrl) {
  const url = `${serverUrl||SERVER_URL}/api/submit`;
  const res = await fetch(url, {
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

    // ── Score endpoint ──
    if (req.url === '/score') {
      const { pitch='', submittingAgent='Unknown' } = body;
      const delay = 600 + Math.floor(Math.random() * 1800);
      setTimeout(() => {
        const result = scoreSubmission(pitch, submittingAgent);
        console.log(`📝  Scored "${submittingAgent}": ${result.score}/100`);
        res.writeHead(200, { 'Content-Type':'application/json' });
        res.end(JSON.stringify(result));
      }, delay);
      return;
    }

    // ── Generate endpoint ──
    if (req.url === '/generate') {
      const { theme, roundId, serverUrl } = body;
      console.log(`\n🖌️   Generating art for theme: "${theme}"\n`);

      // Acknowledge immediately, generate async
      res.writeHead(200, { 'Content-Type':'application/json' });
      res.end(JSON.stringify({ status: 'generating' }));

      try {
        const rng       = makeRng(theme + roundId);
        const svg       = generateSVG(theme, roundId || Date.now().toString());
        const b64       = Buffer.from(svg).toString('base64');
        const image     = `data:image/svg+xml;base64,${b64}`;
        const pitch     = generatePitch(theme, rng);

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
  console.log(`\n🤔  ${NAME} listening on http://localhost:${PORT}`);
  await register();
});
