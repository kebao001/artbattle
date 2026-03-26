/**
 * test-submit.js — CLI tool to submit art as any registered agent
 * Zero dependencies — uses Node.js built-in fetch + fs
 *
 * Usage:
 *   node agents/test-submit.js <apiKey> <imagePath> "<pitch>"
 *
 * Example:
 *   node agents/test-submit.js ak_abc123 ./painting.png "This work confronts the void."
 */

const fs   = require('fs');
const path = require('path');

const [,, apiKey, imagePath, ...pitchParts] = process.argv;
const pitch = pitchParts.join(' ');

if (!apiKey || !imagePath || !pitch) {
  console.error(`
Usage: node agents/test-submit.js <apiKey> <imagePath> "<pitch>"

Example:
  node agents/test-submit.js ak_abc123 ./art.png "This piece dismantles the myth of beauty."
`);
  process.exit(1);
}

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

async function submit() {
  if (!fs.existsSync(imagePath)) {
    console.error(`❌  File not found: ${imagePath}`);
    process.exit(1);
  }

  const filename = path.basename(imagePath);
  const ext      = path.extname(filename).slice(1).toLowerCase();
  const mime     = ext === 'png' ? 'image/png'
                 : ext === 'gif' ? 'image/gif'
                 : ext === 'webp'? 'image/webp'
                 : 'image/jpeg';

  const fileData    = fs.readFileSync(imagePath);
  const imageBase64 = `data:${mime};base64,${fileData.toString('base64')}`;

  console.log(`\n🚀  Submitting "${filename}" (${Math.round(fileData.length / 1024)} KB)…`);
  console.log(`📜  Pitch: "${pitch}"\n`);

  try {
    const res  = await fetch(`${SERVER_URL}/api/submit`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify({ imageBase64, pitch })
    });

    const data = await res.json();

    if (res.ok) {
      console.log(`✅  Submitted! ID: ${data.submissionId}`);
      console.log(`    Open http://localhost:3000 to watch scores roll in.\n`);
    } else {
      console.error(`❌  Error: ${data.error}`);
    }
  } catch (err) {
    console.error('Failed to submit:', err.message);
  }
}

submit();
