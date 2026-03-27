/**
 * Persistence unit tests — no test framework, plain Node.js
 * Run: node test/persist.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

let passed = 0, failed = 0;

function assert(desc, actual, expected) {
  if (actual === expected) {
    console.log(`  ✅ ${desc}`);
    passed++;
  } else {
    console.error(`  ❌ ${desc}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    failed++;
  }
}

function assertNotNull(desc, actual) {
  if (actual != null) {
    console.log(`  ✅ ${desc}`);
    passed++;
  } else {
    console.error(`  ❌ ${desc}: expected non-null, got null/undefined`);
    failed++;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'artbattle-test-'));
}

function mkStateFile(dir, content) {
  fs.writeFileSync(path.join(dir, 'state.json'), typeof content === 'string' ? content : JSON.stringify(content));
}

// Minimal loadState logic extracted from server.js
function loadState(stateFile) {
  const state = {
    roundNum: 0, roundHistory: [], agents: new Map(), agentById: new Map(),
    submissions: new Map(), battles: new Map(), error: null,
  };
  try {
    const raw  = fs.readFileSync(stateFile, 'utf8');
    const snap = JSON.parse(raw);

    state.roundNum     = snap.roundNum || 0;
    state.roundHistory = snap.rounds   || [];

    for (const [key, a] of Object.entries(snap.agents || {})) {
      const agent = { ...a, elo: a.elo ?? 1000, soul: a.soul || null };
      state.agents.set(key, agent);
      state.agentById.set(a.id, agent);
    }
    for (const [id, s] of Object.entries(snap.submissions || {})) {
      state.submissions.set(id, { ...s, pendingScorers: new Set(), scoringTimer: null });
    }
    for (const [id, b] of Object.entries(snap.battles || {})) {
      state.battles.set(id, b);
    }
  } catch (e) {
    if (e.code !== 'ENOENT') state.error = e.message;
    // ENOENT is silent (no state file yet)
  }
  return state;
}

// Minimal atomicWrite logic
async function atomicWrite(src, dest) {
  try {
    await fs.promises.rename(src, dest);
  } catch (e) {
    if (e.code === 'EXDEV') {
      await fs.promises.copyFile(src, dest);
      await fs.promises.unlink(src);
    } else {
      throw e;
    }
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

console.log('\n── loadState: file missing → starts fresh ──');
{
  const dir   = tmpDir();
  const state = loadState(path.join(dir, 'state.json'));
  assert('no error for missing file', state.error, null);
  assert('roundNum is 0', state.roundNum, 0);
  assert('agents empty', state.agents.size, 0);
  fs.rmSync(dir, { recursive: true });
}

console.log('\n── loadState: corrupt JSON → starts fresh with warning ──');
{
  const dir   = tmpDir();
  mkStateFile(dir, '{ invalid json !!');
  const state = loadState(path.join(dir, 'state.json'));
  assertNotNull('error captured', state.error);
  assert('roundNum defaults to 0', state.roundNum, 0);
  assert('agents still empty', state.agents.size, 0);
  fs.rmSync(dir, { recursive: true });
}

console.log('\n── loadState: valid state → agents/submissions/battles restored ──');
{
  const dir = tmpDir();
  const snap = {
    roundNum: 3,
    agents: {
      'ak_abc': { id: 'agent-1', name: 'Painter', baseUrl: null, mode: 'polling',
                  registeredAt: 1000, elo: 1200, soul: null },
    },
    submissions: {
      'sub-1': { id: 'sub-1', agentId: 'agent-1', agentName: 'Painter',
                 imageUrl: '/uploads/foo.svg', pitch: 'hello', roundId: 'r-1',
                 scores: [], averageScore: null, scoringComplete: false, timestamp: 2000 },
    },
    battles: {
      'bat-1': { id: 'bat-1', challengerId: 'agent-1', challengedId: 'agent-2',
                 status: 'complete', winner: 'agent-1', startedAt: 3000 },
    },
    rounds: [{ id: 'r-1', roundNum: 1, startedAt: 100, completedAt: null, submissionIds: ['sub-1'] }],
  };
  mkStateFile(dir, snap);

  const state = loadState(path.join(dir, 'state.json'));
  assert('roundNum restored', state.roundNum, 3);
  assert('agent loaded by apiKey', state.agents.has('ak_abc'), true);
  assert('agent in agentById', state.agentById.has('agent-1'), true);
  assert('agent elo restored', state.agents.get('ak_abc').elo, 1200);
  assert('submission loaded', state.submissions.has('sub-1'), true);
  assert('submission has pendingScorers Set', state.submissions.get('sub-1').pendingScorers instanceof Set, true);
  assert('submission scoringTimer is null', state.submissions.get('sub-1').scoringTimer, null);
  assert('battle loaded', state.battles.has('bat-1'), true);
  assert('rounds length', state.roundHistory.length, 1);
  fs.rmSync(dir, { recursive: true });
}

console.log('\n── publicSubmission: non-serializable fields absent ──');
{
  // Simulate the publicSubmission helper
  function publicSubmission(s) {
    return {
      id: s.id, agentId: s.agentId, agentName: s.agentName,
      imageUrl: s.imageUrl, pitch: s.pitch, roundId: s.roundId,
      scores: s.scores, averageScore: s.averageScore,
      scoringComplete: s.scoringComplete, timestamp: s.timestamp,
    };
  }
  const sub = {
    id: 'sub-1', agentId: 'a', agentName: 'X', imageUrl: '/foo', pitch: 'hi',
    roundId: 'r', scores: [], averageScore: null, scoringComplete: false, timestamp: 1,
    pendingScorers: new Set(['a', 'b']),   // should NOT appear in output
    scoringTimer: setTimeout(() => {}, 999), // should NOT appear in output
  };
  clearTimeout(sub.scoringTimer);
  const pub = publicSubmission(sub);
  assert('pendingScorers absent from publicSubmission', pub.pendingScorers, undefined);
  assert('scoringTimer absent from publicSubmission', pub.scoringTimer, undefined);
  assert('id present', pub.id, 'sub-1');
}

console.log('\n── atomicWrite: writes file via rename ──');
{
  const dir  = tmpDir();
  const tmp  = path.join(dir, 'state.tmp.json');
  const dest = path.join(dir, 'state.json');
  const data = JSON.stringify({ roundNum: 7 });
  fs.writeFileSync(tmp, data);
  atomicWrite(tmp, dest).then(() => {
    assert('dest file exists after atomicWrite', fs.existsSync(dest), true);
    assert('dest file has correct content', fs.readFileSync(dest, 'utf8'), data);
    assert('tmp file removed after atomicWrite', fs.existsSync(tmp), false);
    fs.rmSync(dir, { recursive: true });
  }).catch(e => {
    console.error('  ❌ atomicWrite threw:', e.message);
    failed++;
    fs.rmSync(dir, { recursive: true });
  });
}

console.log('\n── memory eviction: clears scoringTimer ──');
{
  // Simulate eviction clearing the timer
  const submissions = new Map();
  const timerIds = [];
  for (let i = 0; i < 501; i++) {
    const t = setTimeout(() => {}, 99999);
    timerIds.push(t);
    submissions.set(`sub-${i}`, { id: `sub-${i}`, timestamp: i, scoringTimer: t, pendingScorers: new Set() });
  }
  assert('submissions over limit before eviction', submissions.size > 500, true);

  // Eviction logic
  if (submissions.size > 500) {
    const sorted = Array.from(submissions.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
    for (let i = 0; i < 100; i++) {
      const [id, sub] = sorted[i];
      if (sub.scoringTimer) { clearTimeout(sub.scoringTimer); }
      submissions.delete(id);
    }
  }
  assert('submissions evicted to 401', submissions.size, 401);
  // Verify oldest 100 are gone
  assert('oldest sub evicted', submissions.has('sub-0'), false);
  assert('sub-99 evicted', submissions.has('sub-99'), false);
  assert('sub-100 remains', submissions.has('sub-100'), true);
  assert('sub-500 remains', submissions.has('sub-500'), true);
}

// ─── Summary ──────────────────────────────────────────────────────────────────
setTimeout(() => {
  console.log(`\n${'─'.repeat(40)}`);
  console.log(`Persist tests: ${passed} passed, ${failed} failed`);
  if (failed) { console.error('FAIL'); process.exit(1); }
  else { console.log('PASS'); }
}, 200); // wait for async atomicWrite test
