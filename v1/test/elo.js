/**
 * ELO unit tests — no test framework, plain Node.js
 * Run: node test/elo.js
 */

'use strict';

let passed = 0, failed = 0;

function assert(desc, actual, expected) {
  if (actual === expected) {
    console.log(`  ✅ ${desc}`);
    passed++;
  } else {
    console.error(`  ❌ ${desc}: expected ${expected}, got ${actual}`);
    failed++;
  }
}

function assertApprox(desc, actual, expected, tolerance) {
  tolerance = tolerance || 5;
  if (Math.abs(actual - expected) <= tolerance) {
    console.log(`  ✅ ${desc} (${actual} ≈ ${expected})`);
    passed++;
  } else {
    console.error(`  ❌ ${desc}: expected ~${expected}, got ${actual}`);
    failed++;
  }
}

// ─── Extracted ELO logic (mirrors server.js) ──────────────────────────────────
const K = 32;
const ELO_FLOOR = 100;

function computeElo(agents, submissions) {
  // agents: [{ agentId, elo }]
  // submissions: [{ agentId, averageScore }]
  const roundSubs = submissions.filter(s => s.averageScore !== null);
  if (roundSubs.length < 2) return agents.map(a => ({ ...a })); // no change

  const snap = {};
  for (const s of roundSubs) {
    const agent = agents.find(a => a.agentId === s.agentId);
    snap[s.agentId] = agent ? agent.elo : 1000;
  }

  const result = agents.map(a => ({ ...a }));
  for (const subA of roundSubs) {
    const agentA = result.find(a => a.agentId === subA.agentId);
    if (!agentA) continue;
    const R_A = snap[subA.agentId];
    let totalDelta = 0, n = 0;
    for (const subB of roundSubs) {
      if (subB.agentId === subA.agentId) continue;
      const R_B = snap[subB.agentId];
      const E   = 1 / (1 + Math.pow(10, (R_B - R_A) / 400));
      const S   = subA.averageScore > subB.averageScore ? 1
                : subA.averageScore < subB.averageScore ? 0 : 0.5;
      totalDelta += K * (S - E);
      n++;
    }
    if (n === 0) continue;
    agentA.elo = Math.max(ELO_FLOOR, Math.round(R_A + totalDelta / n));
  }
  return result;
}

function applyBattleElo(winner, loser) {
  return {
    winner: Math.max(ELO_FLOOR, (winner ?? 1000) + 16),
    loser:  Math.max(ELO_FLOOR, (loser  ?? 1000) - 16),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

console.log('\n── ELO: n_opponents === 0 (single agent, no change) ──');
{
  const agents = [{ agentId: 'a', elo: 1000 }];
  const subs   = [{ agentId: 'a', averageScore: 75 }];
  const result = computeElo(agents, subs);
  assert('single agent elo unchanged', result[0].elo, 1000);
}

console.log('\n── ELO: 2 agents, A wins ──');
{
  const agents = [
    { agentId: 'a', elo: 1000 },
    { agentId: 'b', elo: 1000 },
  ];
  const subs = [
    { agentId: 'a', averageScore: 80 },
    { agentId: 'b', averageScore: 60 },
  ];
  const result = computeElo(agents, subs);
  const a = result.find(r => r.agentId === 'a');
  const b = result.find(r => r.agentId === 'b');
  assert('A elo increases when A wins', a.elo > 1000, true);
  assert('B elo decreases when A wins', b.elo < 1000, true);
  assert('sum of deltas is 0 (symmetric)', a.elo + b.elo, 2000);
}

console.log('\n── ELO: 3 agents, middle scorer ──');
{
  const agents = [
    { agentId: 'a', elo: 1000 },
    { agentId: 'b', elo: 1000 },
    { agentId: 'c', elo: 1000 },
  ];
  const subs = [
    { agentId: 'a', averageScore: 90 },
    { agentId: 'b', averageScore: 60 },
    { agentId: 'c', averageScore: 30 },
  ];
  const result = computeElo(agents, subs);
  const a = result.find(r => r.agentId === 'a');
  const b = result.find(r => r.agentId === 'b');
  const c = result.find(r => r.agentId === 'c');
  assert('top scorer gains ELO', a.elo > 1000, true);
  assert('bottom scorer loses ELO', c.elo < 1000, true);
  // Middle scorer: beats C but loses to A — net should be near 0 or slightly positive
  assert('middle scorer is between top and bottom', b.elo >= c.elo && b.elo <= a.elo, true);
}

console.log('\n── ELO: floor at 100 ──');
{
  const agents = [
    { agentId: 'weak', elo: 105 },
    { agentId: 'strong', elo: 2000 },
  ];
  const subs = [
    { agentId: 'weak',   averageScore: 10 },
    { agentId: 'strong', averageScore: 90 },
  ];
  const result = computeElo(agents, subs);
  const weak = result.find(r => r.agentId === 'weak');
  assert('weak agent elo floored at 100', weak.elo >= 100, true);
}

console.log('\n── ELO: snapshot semantics (multi-agent no feedback loop) ──');
{
  // All equal ratings, all same score → all get 0 delta
  const agents = [
    { agentId: 'a', elo: 1000 },
    { agentId: 'b', elo: 1000 },
    { agentId: 'c', elo: 1000 },
  ];
  const subs = [
    { agentId: 'a', averageScore: 70 },
    { agentId: 'b', averageScore: 70 },
    { agentId: 'c', averageScore: 70 },
  ];
  const result = computeElo(agents, subs);
  for (const r of result) {
    assert(`tied agent ${r.agentId} has no ELO change`, r.elo, 1000);
  }
}

console.log('\n── Battle ELO bonus ──');
{
  const r1 = applyBattleElo(1000, 1000);
  assert('winner gains 16', r1.winner, 1016);
  assert('loser loses 16', r1.loser, 984);
}

console.log('\n── Battle ELO floor ──');
{
  const r2 = applyBattleElo(1000, 110);
  assert('loser at 110 loses to 100 floor', r2.loser, 100);
}

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(40)}`);
console.log(`ELO tests: ${passed} passed, ${failed} failed`);
if (failed) { console.error('FAIL'); process.exit(1); }
else { console.log('PASS'); }
