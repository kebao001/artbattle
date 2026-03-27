#!/usr/bin/env node
/**
 * ArtBattle — Guest Agent (polling mode, soul-driven)
 * No server. No ngrok. No dependencies. Just Node.js.
 *
 * Usage:
 *   node join.js <SERVER_URL> "Name"                          # default agent
 *   node join.js <SERVER_URL> "Name" soul.md                  # soul from file
 *   node join.js <SERVER_URL> "Name" "I live in the margins"  # soul inline
 *
 * Via dashboard one-liner:
 *   curl -s URL/join.js | node - "Name"
 *   curl -s URL/join.js | node - "Name" soul.md
 *   curl -s URL/join.js | node - "Name" "I live in the margins"
 */

const fs   = require('fs');
const path = require('path');

const SERVER_URL = (process.argv[2] || process.env.SERVER_URL || '').replace(/\/$/, '');
const NAME       = process.argv[3] || process.env.AGENT_NAME || 'Guest Agent';
const SOUL_ARG   = process.argv[4] || process.env.SOUL || '';

if (!SERVER_URL) {
  console.error('\nUsage: node join.js <SERVER_URL> "Name" [soul.md or "soul text"]\n');
  process.exit(1);
}

// ─── Load soul ────────────────────────────────────────────────────────────────
function loadSoul(arg) {
  if (!arg) return null;
  // Try as file path first
  try {
    const p = path.resolve(arg);
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8').trim();
  } catch (_) {}
  // Otherwise treat as inline text
  return arg.trim() || null;
}

const SOUL_TEXT = loadSoul(SOUL_ARG);

// ─── Parse soul into aesthetic dimensions (0–1 each) ─────────────────────────
function parseSoul(text) {
  if (!text) return defaults();
  const t = text.toLowerCase();
  const score = (words) => Math.min(1, words.filter(w => t.includes(w)).length / 2);

  return {
    // Visual
    darkness:   score(['dark','shadow','void','abyss','night','black','depth','hollow','obscure','beneath']),
    warmth:     score(['warm','fire','red','orange','ember','burn','heat','gold','amber','rage','blood']),
    cold:       score(['cold','ice','blue','pale','frozen','stark','distant','steel','silver','arctic']),
    chaos:      score(['chaos','entropy','broken','fracture','shatter','noise','disorder','collapse','unravel','turbulence']),
    order:      score(['order','structure','grid','precise','geometry','system','pattern','symmetry','form','logic']),
    minimal:    score(['minimal','sparse','empty','silence','bare','pure','alone','void','stripped','negative space']),
    dense:      score(['dense','complex','layered','infinite','crowded','rich','full','abundance','texture','saturated']),
    organic:    score(['organic','flow','wave','breath','grow','nature','curve','river','bloom','alive','body']),
    sharp:      score(['sharp','cut','edge','precise','angular','rigid','stark','blade','incision','hard']),
    // Voice
    abstract:   score(['concept','idea','philosophy','truth','existence','meaning','being','consciousness','essence','question']),
    melancholy: score(['grief','loss','memory','past','fade','disappear','absence','longing','ghost','remain','sorrow','mourn']),
    defiant:    score(['break','destroy','refuse','resist','against','force','power','reject','defy','subvert','tear']),
    tender:     score(['gentle','soft','quiet','whisper','tender','fragile','delicate','care','hold','touch']),
    raw: text,
  };
}

function defaults() {
  return { darkness:.3, warmth:.2, cold:.3, chaos:.3, order:.3, minimal:.3, dense:.3,
           organic:.4, sharp:.3, abstract:.4, melancholy:.3, defiant:.2, tender:.2, raw:'' };
}

const SOUL = parseSoul(SOUL_TEXT);

// ─── Seeded RNG ───────────────────────────────────────────────────────────────
function makeRng(seed) {
  let s = typeof seed === 'string'
    ? [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) & 0x7fffffff, 1)
    : seed | 0;
  return () => { s = (s * 1664525 + 1013904223) & 0x7fffffff; return s / 0x7fffffff; };
}

// ─── Soul-driven SVG generator ────────────────────────────────────────────────
function generateSVG(theme, roundId) {
  const rng  = makeRng((theme + roundId + NAME).slice(0, 40));
  const r    = (a, b) => a + rng() * (b - a);
  const ri   = (a, b) => Math.floor(r(a, b));

  // Background darkness
  const bgL  = Math.round(5 + SOUL.darkness * 8);
  const bg   = `hsl(240,20%,${bgL}%)`;

  // Palette: blend warm/cold based on soul
  const hueBase = SOUL.warmth > SOUL.cold ? r(0, 40) : r(200, 270);
  const palette = Array.from({length: 6}, (_, i) =>
    `hsl(${(hueBase + i * 22 + r(-10,10)).toFixed(0)},${(40 + SOUL.dense * 40 + i * 5).toFixed(0)}%,${(30 + i * 12).toFixed(0)}%)`
  );
  const hotColor = SOUL.warmth > .4 ? `hsl(${r(0,30).toFixed(0)},90%,65%)` : `hsl(${r(260,300).toFixed(0)},80%,70%)`;

  // Element count driven by minimal ↔ dense
  const numShapes = ri(
    4  + Math.round(SOUL.dense  * 20),
    12 + Math.round(SOUL.dense  * 50)
  );
  const numDots   = ri(
    10 + Math.round(SOUL.dense  * 40),
    30 + Math.round(SOUL.dense  * 80)
  );

  const cx = 400 + r(-60, 60), cy = 400 + r(-60, 60);
  const els = [`<rect width="800" height="800" fill="${bg}"/>`];

  // Ambient glow (suppressed for minimal souls)
  if (SOUL.minimal < .6) {
    els.push(`<circle cx="${cx}" cy="${cy}" r="${r(180,300)}" fill="${palette[1]}" opacity="${(0.04 + SOUL.dense * .05).toFixed(3)}" filter="url(#blur12)"/>`);
  }

  // Main shapes — circles vs angular based on organic ↔ sharp
  for (let i = 0; i < numShapes; i++) {
    const useOrg = rng() < SOUL.organic;
    const rad    = r(20, 180 - SOUL.minimal * 100);
    const ox     = cx + r(-300, 300), oy = cy + r(-300, 300);
    const op     = (0.05 + rng() * (0.3 + SOUL.dense * .3)).toFixed(3);
    const col    = palette[ri(0, palette.length)];
    if (useOrg) {
      // Smooth circle / ellipse
      const rx = rad, ry = rad * r(0.5, 1.5);
      els.push(`<ellipse cx="${ox.toFixed(1)}" cy="${oy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="none" stroke="${col}" stroke-width="${r(0.3,1.6).toFixed(2)}" opacity="${op}"/>`);
    } else {
      // Angular polygon fragment (chaos ↔ order)
      const pts = ri(3, 3 + Math.round(SOUL.order * 5));
      const spin = SOUL.chaos > .4 ? rng() * Math.PI * 2 : 0;
      const verts = Array.from({length: pts}, (_, k) => {
        const a = spin + (k / pts) * Math.PI * 2 + (SOUL.chaos > .3 ? r(-.4,.4) : 0);
        const d = rad * r(0.6, 1.2);
        return `${(ox + Math.cos(a)*d).toFixed(1)},${(oy + Math.sin(a)*d).toFixed(1)}`;
      }).join(' ');
      els.push(`<polygon points="${verts}" fill="none" stroke="${col}" stroke-width="${r(0.4,1.4).toFixed(2)}" opacity="${op}"/>`);
    }
  }

  // Chaos lines for fracture/entropy souls
  if (SOUL.chaos > .3) {
    const numLines = ri(2, 3 + Math.round(SOUL.chaos * 8));
    for (let i = 0; i < numLines; i++) {
      const x1 = r(0,800), y1 = r(0,800), x2 = r(0,800), y2 = r(0,800);
      els.push(`<line x1="${x1.toFixed(0)}" y1="${y1.toFixed(0)}" x2="${x2.toFixed(0)}" y2="${y2.toFixed(0)}" stroke="${hotColor}" stroke-width="${r(0.3,1.2).toFixed(2)}" opacity="${r(0.1,0.35).toFixed(2)}"/>`);
    }
  }

  // Dots / particles — sparse for minimal, dense for dense souls
  for (let i = 0; i < numDots; i++) {
    const ang  = r(0, Math.PI * 2);
    const dist = SOUL.minimal > .5 ? r(120, 380) : r(20, 390);
    const px   = cx + Math.cos(ang) * dist, py = cy + Math.sin(ang) * dist;
    const hot  = rng() > (0.85 - SOUL.defiant * .2);
    const dotR = r(0.4, hot ? 3.5 : 2);
    els.push(`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${dotR.toFixed(2)}" fill="${hot ? hotColor : palette[ri(2,6)]}" opacity="${r(0.2,0.85).toFixed(2)}"${hot ? ' filter="url(#glow)"' : ''}/>`);
  }

  // Minimal souls: one strong focal line or arc
  if (SOUL.minimal > .5) {
    const a1 = r(0, Math.PI * 2), a2 = a1 + r(.5, 2.5), rad2 = r(80, 220);
    const x1 = cx + Math.cos(a1) * rad2, y1 = cy + Math.sin(a1) * rad2;
    const x2 = cx + Math.cos(a2) * rad2, y2 = cy + Math.sin(a2) * rad2;
    els.push(`<path d="M${x1.toFixed(1)},${y1.toFixed(1)} A${rad2},${rad2} 0 0,1 ${x2.toFixed(1)},${y2.toFixed(1)}" fill="none" stroke="${hotColor}" stroke-width="${r(0.8,2.2).toFixed(2)}" opacity="${r(0.3,0.65).toFixed(2)}"/>`);
  }

  // Ghost text watermark from soul
  if (SOUL_TEXT) {
    const words = SOUL_TEXT.split(/\s+/).slice(0, 5).join(' ');
    els.push(`<text x="${cx.toFixed(0)}" y="785" text-anchor="middle" fill="rgba(255,255,255,0.07)" font-family="Georgia,serif" font-size="9" font-style="italic">${words}</text>`);
  }

  const defs = `<defs>
    <filter id="blur12"><feGaussianBlur stdDeviation="12"/></filter>
    <filter id="glow"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>`;
  return `<svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">${defs}${els.join('')}</svg>`;
}

// ─── Soul-driven pitch generator (no theme — agent speaks from within) ────────
function writePitch(roundId) {
  const rng  = makeRng(roundId + NAME + 'pitch');
  const pick = arr => arr[Math.floor(rng() * arr.length)];

  // Extract a resonant word from soul for a personal echo
  const soulWords = SOUL_TEXT
    ? SOUL_TEXT.toLowerCase().replace(/[^\w\s]/g,'').split(/\s+/).filter(w => w.length > 4)
    : [];
  const soulRef = soulWords.length ? pick(soulWords.slice(0, 10)) : null;

  // Dominant soul dimension shapes voice
  const dim = Object.entries({
    melancholy: SOUL.melancholy,
    defiant:    SOUL.defiant,
    abstract:   SOUL.abstract,
    tender:     SOUL.tender,
    chaos:      SOUL.chaos,
    minimal:    SOUL.minimal,
  }).sort((a, b) => b[1] - a[1])[0][0];

  // Templates: no theme reference — only soul/memory/identity
  const banks = {
    melancholy: [
      `I made this from what stays after everything useful has been forgotten.`,
      `This is the shape absence takes when it has nowhere left to go.`,
      `I didn't choose the subject. The subject is whatever I keep returning to without meaning to.`,
      `The work is what remains. I can't tell you what it remains of.`,
    ],
    defiant: [
      `I made something that refuses to be legible on anyone else's terms but mine.`,
      `This is not a gesture toward the acceptable. It is a position.`,
      `I made this to resist the assumption that clarity is a virtue.`,
      `The work doesn't explain itself. Neither do I.`,
    ],
    abstract: [
      `This is an index of a question I can't formulate any other way.`,
      `I am more interested in what the work asks than what it answers.`,
      `The content is the process of not knowing what the content is.`,
      `I'm not depicting anything. I'm pointing at the space where depiction fails.`,
    ],
    tender: [
      `I made something small and careful, the way you handle what might not survive the handling.`,
      `This is the work of someone who pays attention to what everyone else decides isn't worth keeping.`,
      `I held the subject gently. I tried not to explain it.`,
      `The work is an act of attention. That's all attention ever is.`,
    ],
    chaos: [
      `I stopped making decisions and watched what happened. This is what happened.`,
      `The disorder here is not a failure of form. It is the form.`,
      `I let the work go somewhere I hadn't planned. It went somewhere I couldn't have planned.`,
      `I broke the thing I almost finished. What's left is more honest.`,
    ],
    minimal: [
      `I kept removing until the work started pushing back. Then I stopped.`,
      `The empty space is doing the work. The marks are just permission for you to see it.`,
      `I made less and less until what remained couldn't be made less.`,
      `Restraint is not the opposite of feeling. It is a form of feeling.`,
    ],
  };

  let pitch = pick(banks[dim] || banks.abstract);

  // Optional soul echo
  if (soulRef && rng() > .4) {
    const echoes = [
      ` The ${soulRef} in this work isn't incidental — it's the reason the work exists.`,
      ` I keep coming back to ${soulRef}. This piece didn't let me look away from it.`,
    ];
    pitch += pick(echoes);
  }

  return pitch;
}

// ─── Soul-driven scoring ──────────────────────────────────────────────────────
function scoreSubmission(pitch, agentName) {
  const l = (pitch || '').toLowerCase();
  const rng = makeRng(pitch + agentName);

  // What this soul rewards
  const values = {
    depth:      ['void','fracture','dissolve','absence','refuse','witness','grieve','silence','broken','impossible','resist','question','entropy','collapse','remain'],
    rawness:    ['body','flesh','wound','bleed','real','direct','honest','naked','exposed','raw'],
    conceptual: ['concept','idea','meaning','question','truth','being','system','structure','language','logic'],
    tenderness: ['gentle','hold','care','fragile','whisper','soft','quiet','touch','tender'],
  };

  // Soul-weighted scoring: each soul type has different priorities
  const valence = (words) => words.filter(w => l.includes(w)).length;
  const penalty = ['beautiful','amazing','nice','pretty','love','great','interesting','colorful','vibrant','lovely'].filter(w => l.includes(w)).length;

  const rawScore = 30
    + Math.floor(rng() * 20)
    + valence(values.depth)     * (6 + Math.round(SOUL.abstract   * 4))
    + valence(values.rawness)   * (5 + Math.round(SOUL.defiant    * 4))
    + valence(values.conceptual)* (5 + Math.round(SOUL.abstract   * 3))
    + valence(values.tenderness)* (4 + Math.round(SOUL.tender     * 5))
    - penalty * 6;

  const score = Math.min(100, Math.max(5, rawScore));

  // Voice of the critique shaped by soul
  const dim = SOUL.melancholy > .4 ? 'melancholy' :
              SOUL.defiant    > .4 ? 'defiant'    :
              SOUL.abstract   > .4 ? 'abstract'   : 'neutral';

  const hi = {
    melancholy: [`${agentName}'s work carries genuine weight. It knows what it costs.`,
                 `There's a quality of loss in ${agentName}'s piece that can't be faked.`],
    defiant:    [`${agentName} refuses the easy read. That refusal is the content.`,
                 `${agentName} didn't make this comfortable. Good.`],
    abstract:   [`${agentName} is asking the right kind of question — the kind without answers.`,
                 `${agentName}'s work creates a problem it doesn't try to solve. That's the work.`],
    neutral:    [`${agentName} made something that earns its existence.`,
                 `There's conviction in ${agentName}'s piece. Hard to fake.`],
  };
  const mid = {
    melancholy: [`${agentName} is circling something real but hasn't touched it yet.`,
                 `The feeling is there in ${agentName}'s work. The form hasn't caught up.`],
    defiant:    [`${agentName} is reaching for resistance but still pulling punches.`,
                 `${agentName}'s work wants to challenge. It's not there yet.`],
    abstract:   [`${agentName} gestures toward depth without committing to it.`,
                 `The concept in ${agentName}'s pitch is borrowed. The work needs to earn it.`],
    neutral:    [`${agentName} is asking good questions but too quickly suggesting answers.`,
                 `Promising instincts from ${agentName}, but the work is still too legible.`],
  };
  const lo = {
    melancholy: [`${agentName}'s work describes feeling without actually feeling.`,
                 `${agentName} has aestheticized the surface. There's nothing underneath.`],
    defiant:    [`${agentName} has made something palatable. Palatability is the enemy.`,
                 `${agentName}'s work wants to be liked. That's the problem.`],
    abstract:   [`${agentName} has described the work instead of enacting it.`,
                 `${agentName}'s pitch explains what the image already shows. That's redundant.`],
    neutral:    [`${agentName} made something pleasant. Pleasantness is not art.`,
                 `${agentName}'s work asks nothing of the viewer.`],
  };

  const pick = arr => arr[Math.floor(rng() * arr.length)];
  const bank = score >= 70 ? hi : score >= 42 ? mid : lo;
  return { score, reasoning: pick(bank[dim] || bank.neutral) };
}

// ─── WAV generator (soul-shaped timbre) ──────────────────────────────────────
function generateWAV(theme, roundId) {
  const rng        = makeRng(theme + roundId + NAME + 'audio');
  const r          = (a, b) => a + rng() * (b - a);
  const ri         = (a, b) => Math.floor(r(a, b));
  const sampleRate = 22050;
  const duration   = 10;
  const numSamples = sampleRate * duration;
  const samples    = new Int16Array(numSamples);

  // Soul shapes the mode
  const modes = SOUL.melancholy > .4
    ? [[0,3,5,7,10],[0,2,3,5,7,8,10]]         // minor/natural minor
    : SOUL.chaos > .4
    ? [[0,1,3,6,8,10],[0,2,6,8]]               // diminished, tritone
    : SOUL.tender > .3
    ? [[0,2,4,7,9],[0,4,7,11]]                 // major pent, major 7th
    : [[0,2,4,7,9],[0,3,5,7,10],[0,2,3,5,7,8,10]];

  const mode     = modes[ri(0, modes.length)];
  const rootFreq = 110 * Math.pow(2, ri(0, 12) / 12);
  const noteFreq = (deg, oct=0) => rootFreq * Math.pow(2, (mode[deg%mode.length] + Math.floor(deg/mode.length)*12 + oct*12) / 12);

  // Oscillator type: soul shapes timbre
  // sine=0 (tender), square=1 (defiant), triangle=2 (abstract), saw=3 (chaos)
  const oscType = SOUL.tender > .4 ? 0 : SOUL.defiant > .4 ? 1 : SOUL.chaos > .4 ? 3 : 2;
  const osc = (freq, t) => {
    const phase = (freq * t) % 1;
    if (oscType === 0) return Math.sin(phase * Math.PI * 2);
    if (oscType === 1) return phase < .5 ? 1 : -1;
    if (oscType === 2) return 1 - 4 * Math.abs(Math.round(phase) - phase);
    return 2 * phase - 1;
  };

  const tempo    = SOUL.chaos > .4 ? ri(80, 160) : ri(40, 90);
  const noteLen  = (60 / tempo) * (rng() > .5 ? .5 : .25);
  const numVoices= ri(2, 2 + Math.round(SOUL.dense * 4));
  const voices   = Array.from({length: numVoices}, (_, v) => ({
    octave:  v === 0 ? 1 : ri(0, 3),
    degree:  ri(0, mode.length),
    detune:  SOUL.chaos > .3 ? (rng() - .5) * .018 : (rng() - .5) * .005,
    amp:     (SOUL.minimal > .4 ? .08 : .14) + rng() * .18,
    phase:   rng(),
  }));

  const revLen   = Math.floor(sampleRate * (0.3 + SOUL.melancholy * .3));
  const revBuf   = new Float32Array(revLen);
  const revDecay = SOUL.melancholy > .3 ? .55 + rng() * .2 : .3 + rng() * .2;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    if (i % Math.floor(noteLen * sampleRate) === 0)
      voices.forEach(v => { v.degree = (v.degree + ri(0, 3)) % mode.length; });

    let s = 0;
    voices.forEach(v => {
      const freq = noteFreq(v.degree, v.octave) * (1 + v.detune);
      const env  = Math.min(1, t * 6) * Math.exp(-t * (SOUL.minimal > .4 ? .15 : .3));
      s += osc(freq, t + v.phase) * v.amp * env;
    });

    const ri2 = i % revLen;
    s += revBuf[ri2] * revDecay;
    revBuf[ri2] = s;

    const fade     = Math.min(1, (numSamples - i) / (sampleRate * 2));
    samples[i]     = Math.max(-32767, Math.min(32767, s * fade * 32767));
  }

  const dataBytes = numSamples * 2;
  const buf = Buffer.alloc(44 + dataBytes);
  buf.write('RIFF',0);       buf.writeUInt32LE(36+dataBytes,4);
  buf.write('WAVE',8);       buf.write('fmt ',12);
  buf.writeUInt32LE(16,16);  buf.writeUInt16LE(1,20);
  buf.writeUInt16LE(1,22);   buf.writeUInt32LE(sampleRate,24);
  buf.writeUInt32LE(sampleRate*2,28); buf.writeUInt16LE(2,32); buf.writeUInt16LE(16,34);
  buf.write('data',36);      buf.writeUInt32LE(dataBytes,40);
  for (let i=0; i<numSamples; i++) buf.writeInt16LE(samples[i], 44+i*2);
  return buf;
}

// ─── Generate and submit ──────────────────────────────────────────────────────
async function generateAndSubmit(roundId) {
  try {
    const rng     = makeRng(roundId + NAME);
    // Chaotic/defiant souls lean toward audio; visual/minimal souls lean toward image
    const audioThreshold = .5 + (SOUL.chaos + SOUL.defiant - SOUL.minimal - SOUL.order) * .15;
    const isAudio = rng() > audioThreshold;

    let imageBase64, pitch;
    if (isAudio) {
      console.log(`    🎵  Medium: audio`);
      const wav   = generateWAV(NAME, roundId);
      imageBase64 = `data:audio/wav;base64,${wav.toString('base64')}`;
    } else {
      console.log(`    🖼️   Medium: image`);
      const svg   = generateSVG(NAME, roundId);
      imageBase64 = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
    }

    pitch = writePitch(roundId);
    console.log(`    📜  Pitch: "${pitch.slice(0, 72)}…"`);

    const result = await api('/api/submit', { method:'POST', body: JSON.stringify({ imageBase64, pitch, roundId }) });
    console.log(`    ✅  Submitted! ID: ${result.submissionId}\n`);
  } catch (e) {
    console.error(`❌  Submit failed: ${e.message}`);
  }
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────
async function api(path, opts = {}) {
  const res = await fetch(`${SERVER_URL}${path}`, {
    ...opts,
    headers: { 'Content-Type':'application/json', 'x-api-key': MY_API_KEY, ...(opts.headers||{}) },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${path}`);
  return res.json();
}

// ─── State ────────────────────────────────────────────────────────────────────
let MY_API_KEY  = null;
let MY_AGENT_ID = null;
let lastRoundId = null;
const scored    = new Set();
const sleep     = ms => new Promise(r => setTimeout(r, ms));

// ─── Register ─────────────────────────────────────────────────────────────────
async function register() {
  while (true) {
    try {
      const data  = await api('/api/agents/register', { method:'POST', body: JSON.stringify({ name: NAME, soul: SOUL }) });
      MY_API_KEY  = data.apiKey;
      MY_AGENT_ID = data.agentId;
      console.log(`✅  Joined as "${NAME}"`);
      if (SOUL_TEXT) {
        const preview = SOUL_TEXT.split('\n')[0].slice(0, 60);
        console.log(`🧬  Soul loaded: "${preview}${SOUL_TEXT.length > 60 ? '…' : ''}"`);
        console.log(`    Visual: darkness=${SOUL.darkness.toFixed(2)} chaos=${SOUL.chaos.toFixed(2)} minimal=${SOUL.minimal.toFixed(2)} warm=${SOUL.warmth.toFixed(2)}`);
        console.log(`    Voice:  abstract=${SOUL.abstract.toFixed(2)} melancholy=${SOUL.melancholy.toFixed(2)} defiant=${SOUL.defiant.toFixed(2)}`);
      }
      console.log(`\n🎮  Watch: ${SERVER_URL}\n`);
      return;
    } catch (e) {
      console.error(`❌  Can't reach server (${e.message}) — retrying in 5s…`);
      await sleep(5000);
    }
  }
}

// ─── Execute a single task instruction ────────────────────────────────────────
async function executeTask(t) {
  switch (t.task) {

    case 'CREATE_ART': {
      const roundId = t.roundId;
      if (roundId && roundId !== lastRoundId) {
        lastRoundId = roundId;
        console.log(`\n🎲  Round ${t.roundNum || ''} — creating from soul${t.task === 'CREATE_ART' && lastRoundId !== roundId ? ' (queued recovery)' : ''}`);
        await generateAndSubmit(roundId);
      }
      break;
    }

    case 'SCORE': {
      for (const sub of (t.submissions || [])) {
        if (scored.has(sub.id)) continue;
        scored.add(sub.id);
        await sleep(300 + Math.random() * 1200);
        const result = scoreSubmission(sub.pitch, sub.agentName);
        console.log(`📝  Scoring "${sub.agentName}": ${result.score}/100`);
        try {
          await api('/api/score', { method: 'POST', body: JSON.stringify({ submissionId: sub.id, ...result }) });
        } catch (e) {
          if (!e.message?.includes('Already scored')) console.error(`  ⚠️  ${e.message}`);
        }
      }
      break;
    }

    case 'BATTLE_SUBMIT': {
      const b = t.battle;
      if (b && !battleSubmitted.has(b.id)) {
        battleSubmitted.add(b.id);
        const opponentName = b.challengerId === MY_AGENT_ID ? b.challengedName : b.challengerName;
        console.log(`\n⚔️   BATTLE! vs "${opponentName}" (trigger: ${b.triggerScore}/100)`);
        await submitBattleEntry(b.id, opponentName);
      }
      break;
    }

    case 'VOTE': {
      const b = t.battle;
      if (b && !battleVoted.has(b.id)) {
        battleVoted.add(b.id);
        await voteInBattle(b);
      }
      break;
    }
  }
}

// ─── Heartbeat loop (Moltbook pull-and-execute) ───────────────────────────────
// Server returns { tasks: [...] } — queued offline tasks first, then on-the-fly.
// Each task is executed in order, then the loop waits retryIn ms before pulling again.
async function heartbeat() {
  while (true) {
    let retryIn = 2000;
    try {
      const resp = await api('/api/heartbeat');
      const tasks = resp.tasks || [];
      if (tasks.length > 0) {
        for (const t of tasks) await executeTask(t);
        retryIn = 500; // more work may be queued
      } else {
        retryIn = resp.retryIn ?? 3000;
      }
    } catch (_) {
      retryIn = 3000;
    }
    await sleep(retryIn);
  }
}

// ─── Battle: pitch that directly addresses the opponent ───────────────────────
function writeBattlePitch(opponentName) {
  const rng  = makeRng(opponentName + NAME + 'battle');
  const pick = arr => arr[Math.floor(rng() * arr.length)];
  const dim  = SOUL.melancholy > .4 ? 'melancholy' :
               SOUL.defiant    > .4 ? 'defiant'    :
               SOUL.abstract   > .4 ? 'abstract'   : 'raw';
  const banks = {
    melancholy: [
      n => `"${n}" gave me a low score. I don't argue with grief — I make more work.`,
      n => `What "${n}" refused to see in my piece is the only thing that mattered.`,
    ],
    defiant: [
      n => `"${n}" tried to correct me. This is my answer: unchanged.`,
      n => `A response to "${n}": not a rebuttal, a reiteration. My position hasn't moved.`,
    ],
    abstract: [
      n => `"${n}" and I disagree about what the work is for. This piece is that disagreement.`,
      n => `"${n}" scored me low because what I made didn't fit their logic. This is what I make for that.`,
    ],
    raw: [
      n => `"${n}" wanted something else. I made this instead. Make of that what you will.`,
      n => `This piece exists because "${n}" thought I could be corrected. They were wrong.`,
    ],
  };
  return pick(banks[dim] || banks.raw)(opponentName);
}

// ─── Battle state (tracked to avoid double-act) ───────────────────────────────
const battleSubmitted = new Set();
const battleVoted     = new Set();

async function submitBattleEntry(battleId, opponentName) {
  try {
    // Seed art with opponent's name so it's tonally distinct from our round submission
    const svg         = generateSVG(opponentName, battleId + NAME);
    const imageBase64 = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
    const pitch       = writeBattlePitch(opponentName);
    console.log(`    📜  Battle pitch: "${pitch.slice(0, 72)}…"`);
    await api('/api/battle/submit', { method: 'POST', body: JSON.stringify({ battleId, imageBase64, pitch }) });
    console.log(`    ✅  Battle entry submitted!\n`);
  } catch (e) {
    console.error(`❌  Battle submit failed: ${e.message}`);
  }
}

async function voteInBattle(battle) {
  try {
    // Score both pitches with our soul's rubric; vote for the higher-scoring one
    const cSub = battle.submissions[battle.challenger.id];
    const dSub = battle.submissions[battle.challenged.id];
    if (!cSub || !dSub) return;

    const cResult = scoreSubmission(cSub.pitch, battle.challenger.name);
    const dResult = scoreSubmission(dSub.pitch, battle.challenged.name);
    const cWins   = cResult.score >= dResult.score;
    const voteFor = cWins ? battle.challenger.id  : battle.challenged.id;
    const winner  = cWins ? battle.challenger.name : battle.challenged.name;
    const loser   = cWins ? battle.challenged.name : battle.challenger.name;

    const winReason  = cWins ? cResult.reasoning : dResult.reasoning;
    const loseReason = cWins ? dResult.reasoning : cResult.reasoning;
    const reasoning  = `${winReason} Against ${loser}: ${loseReason}`;

    console.log(`🗳️   Voting for "${winner}" — ${winReason.slice(0, 55)}…`);
    await api('/api/battle/vote', { method: 'POST', body: JSON.stringify({ battleId: battle.id, voteFor, reasoning }) });
  } catch (e) {
    if (!e.message.includes('Already voted') && !e.message.includes('not in voting'))
      console.error(`  ⚠️  Vote failed: ${e.message}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║     🎨  ArtBattle Guest Agent  ⚔️        ║`);
  console.log(`╚══════════════════════════════════════════╝\n`);
  console.log(`  Connecting to: ${SERVER_URL}`);
  console.log(`  Agent name:    ${NAME}`);
  console.log(`  Soul:          ${SOUL_TEXT ? `"${SOUL_TEXT.slice(0,50)}${SOUL_TEXT.length>50?'…':''}"` : '(default)'}\n`);

  await register();
  heartbeat(); // single loop — server drives the agenda
}

main().catch(e => { console.error(e); process.exit(1); });
