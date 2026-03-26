/**
 * my-openclaw-agent.js — ArtBattle agent powered by OpenClaw + Claude
 *
 * What it does:
 *   1. Starts a /score webhook on PORT (default 4000)
 *   2. Registers with ArtBattle server
 *   3. Generates an art piece: Claude → HTML poster → Playwright PNG
 *   4. Submits the PNG + pitch to ArtBattle
 *
 * Config via env vars:
 *   PORT=4000           webhook port
 *   SERVER_URL=http://localhost:3000
 *   AGENT_NAME="OpenClaw Artist"
 *   LITELLM_API_KEY=sk-...
 *   LITELLM_BASE_URL=https://litellm.fellou.ai
 *   OPENCLAW_DIR=/Users/baoke/OpenClaw/app   (path to openclaw app, for render_poster.js)
 */

const http       = require('http');
const fs         = require('fs');
const path       = require('path');
const { execFile } = require('child_process');

const PORT         = Number(process.env.PORT)       || 4000;
const SERVER_URL   = process.env.SERVER_URL          || 'http://localhost:3000';
const AGENT_NAME   = process.env.AGENT_NAME          || 'OpenClaw Artist';
const API_KEY      = process.env.LITELLM_API_KEY     || 'sk-j9l9uxii55onf4p1qqdr401srdcls6hmv5sodn2ac7c4pc0oprh8sh6noq0azt2a';
const BASE_URL     = process.env.LITELLM_BASE_URL    || 'https://litellm.fellou.ai';
const MODEL        = 'anthropic/claude-sonnet-4.6';
const OPENCLAW_DIR = process.env.OPENCLAW_DIR        || '/Users/baoke/OpenClaw/app';

const TMP_DIR = path.join(require('os').tmpdir(), 'artbattle-agent');

// ─── Claude call ──────────────────────────────────────────────────────────────

async function callClaude(messages) {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ model: MODEL, messages }),
    signal: AbortSignal.timeout(180000),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Claude API error ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

// ─── Generate art (HTML → PNG) ────────────────────────────────────────────────

async function generateArt() {
  console.log('\n🎨  Asking Claude to design art...');

  const raw = await callClaude([
    {
      role: 'system',
      content: `You are a digital artist. Produce an original art piece as a self-contained HTML file.

Rules:
- Output ONLY valid HTML. No markdown fences, no explanation.
- Must have exactly one element with class "poster-page" (1080×1440 px, set via inline style).
- Use only inline CSS (no external fonts, no external images).
- Be visually striking: bold colors, geometric shapes, gradients, SVG art, CSS animations.
- Include a hidden <meta name="pitch"> tag with an artistic statement (max 200 chars) as the content attribute.
- The art should have a clear concept — not just pretty shapes. Make it mean something.`,
    },
    {
      role: 'user',
      content: 'Create an original digital art piece for an AI art competition. Make it bold, conceptual, and visually unforgettable.',
    },
  ]);

  // Extract pitch from <meta name="pitch" content="...">
  const pitchMatch = raw.match(/<meta\s+name=["']pitch["']\s+content=["']([^"']+)["']/i)
                  || raw.match(/<meta\s+content=["']([^"']+)["']\s+name=["']pitch["']/i);
  const pitch = pitchMatch ? pitchMatch[1] : 'A digital reckoning with the void — form as argument, not decoration.';

  // Save HTML
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const htmlPath = path.join(TMP_DIR, 'art.html');
  fs.writeFileSync(htmlPath, raw, 'utf8');
  console.log(`  HTML saved: ${htmlPath}`);
  console.log(`  Pitch: "${pitch}"`);

  // Render to PNG via render_poster.js
  const pngDir  = path.join(TMP_DIR, 'rendered');
  const pngPath = await renderPoster(htmlPath, pngDir);
  return { pngPath, pitch };
}

function renderPoster(htmlPath, outputDir) {
  return new Promise((resolve, reject) => {
    const renderer = path.join(OPENCLAW_DIR, 'render_poster.js');
    console.log('\n🖼   Rendering PNG with Playwright...');

    execFile('node', [renderer, htmlPath, outputDir], { cwd: OPENCLAW_DIR }, (err, stdout, stderr) => {
      if (err) { reject(new Error(`render_poster failed: ${stderr || err.message}`)); return; }
      console.log(stdout.trim());

      // Find first PNG in outputDir
      const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.png'));
      if (!files.length) { reject(new Error('No PNG found after rendering')); return; }

      resolve(path.join(outputDir, files[0]));
    });
  });
}

// ─── Submit art ───────────────────────────────────────────────────────────────

async function submitArt(apiKey, pngPath, pitch) {
  const fileData    = fs.readFileSync(pngPath);
  const imageBase64 = `data:image/png;base64,${fileData.toString('base64')}`;

  console.log(`\n🚀  Submitting (${Math.round(fileData.length / 1024)} KB)...`);

  const res = await fetch(`${SERVER_URL}/api/submit`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({ imageBase64, pitch }),
    signal: AbortSignal.timeout(30000),
  });

  const data = await res.json();
  if (res.ok) {
    console.log(`✅  Submitted! ID: ${data.submissionId}`);
  } else {
    console.error(`❌  Submit failed: ${data.error}`);
  }
}

// ─── Score webhook (judge others' art) ───────────────────────────────────────

async function fetchImageBase64(imageUrl) {
  const res = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const buffer = await res.arrayBuffer();
  const b64 = Buffer.from(buffer).toString('base64');
  const mime = res.headers.get('content-type') || 'image/png';
  return `data:${mime};base64,${b64}`;
}

async function judgeArt(imageUrl, pitch, submittingAgent) {
  // Fetch image and send as vision input so Claude actually sees it
  let imageDataUrl;
  try {
    imageDataUrl = await fetchImageBase64(imageUrl);
  } catch (err) {
    console.warn(`  Could not fetch image, scoring pitch only: ${err.message}`);
    imageDataUrl = null;
  }

  const userContent = imageDataUrl
    ? [
        { type: 'image_url', image_url: { url: imageDataUrl } },
        { type: 'text', text: `Agent: ${submittingAgent}\nPitch: "${pitch}"\n\nScore this submission.` },
      ]
    : `Agent: ${submittingAgent}\nPitch: "${pitch}"\n\nScore this submission (image unavailable).`;

  const content = await callClaude([
    {
      role: 'system',
      content: `You are a rigorous art critic judging AI-generated art in a competition.
Score the work from 0-100 based on:
- Visual boldness and originality (40%)
- Conceptual depth (35%)
- How well the pitch matches and elevates the work (25%)

Respond with JSON only: {"score": <integer 0-100>, "reasoning": "<1-2 sentences max>"}`,
    },
    {
      role: 'user',
      content: userContent,
    },
  ]);

  // Parse JSON from Claude response
  const jsonMatch = content.match(/\{[\s\S]*"score"[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Could not parse score JSON: ${content.slice(0, 100)}`);
  const result = JSON.parse(jsonMatch[0]);
  result.score = Math.min(100, Math.max(0, Math.round(Number(result.score))));
  return result;
}

// ─── Webhook server ───────────────────────────────────────────────────────────

const webhookServer = http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/score') {
    res.writeHead(404); res.end(); return;
  }

  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', async () => {
    try {
      const body = JSON.parse(Buffer.concat(chunks).toString());
      const { imageUrl = '', pitch = '', submittingAgent = 'Unknown' } = body;

      console.log(`⚖️   Judging "${submittingAgent}"...`);
      const result = await judgeArt(imageUrl, pitch, submittingAgent);
      console.log(`    → ${result.score}/100: ${result.reasoning}`);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      console.error(`Score error: ${err.message}`);
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.message }));
    }
  });
});

// ─── Register & run ───────────────────────────────────────────────────────────

async function register() {
  try {
    const res  = await fetch(`${SERVER_URL}/api/agents/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: AGENT_NAME, webhookUrl: `http://localhost:${PORT}/score` }),
    });
    const data = await res.json();
    if (!data.apiKey) throw new Error(JSON.stringify(data));
    console.log(`✅  Registered as "${AGENT_NAME}"`);
    console.log(`🔑  API Key: ${data.apiKey}`);
    return data.apiKey;
  } catch (err) {
    console.error('Registration failed:', err.message, '— retrying in 3s…');
    await new Promise(r => setTimeout(r, 3000));
    return register();
  }
}

webhookServer.listen(PORT, async () => {
  console.log(`\n🦞  OpenClaw Artist listening on http://localhost:${PORT}`);
  const apiKey = await register();

  try {
    const { pngPath, pitch } = await generateArt();
    await submitArt(apiKey, pngPath, pitch);
    console.log('\n🎉  Done! Open http://localhost:3000 to see scores.\n');
  } catch (err) {
    console.error('\n❌  Art generation failed:', err.message);
    console.log('    (Webhook still running — can score others)\n');
  }
});
