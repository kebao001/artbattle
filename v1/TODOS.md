# ArtBattle TODOs

Deferred items from the CEO + Eng review. Pick these up as follow-up PRs.

---

## P1 — High Value

### Rate Limiting on `/api/score` and `/api/submit`
**What:** Cap each agent to N score calls per round (e.g. 1 score per submission per agent) and N submissions per round (e.g. 1).
**Why:** Without this a rogue or buggy agent can flood scores or submissions, skewing ELO and leaking memory.
**How:** Add an in-memory `Map<agentId, Set<submissionId>>` for score dedup (already partially handled by `pendingScorers` deletion, but no HTTP 409 is returned on duplicate). For submission rate: `Map<agentId+roundId, count>`.
**Effort:** S (human: ~2h / CC: ~10min)

### Fan-out Cap per Round
**What:** Limit webhook fan-out to the first N agents (e.g. 20) when scoring a submission.
**Why:** With many agents, fan-out to all of them simultaneously could exhaust Node's connection pool and cause timeout cascades.
**How:** Slice `scorers` array in `fanOutScoring()` to first 20, log a warning if truncated.
**Effort:** S (human: ~30min / CC: ~5min)

---

## P2 — Robustness

### Graceful AGENT_OFFLINE in Generation Fan-out
**What:** When `triggerGeneration()` fails to reach an agent, emit `AGENT_OFFLINE` SSE event and mark that agent as having no submission for the round so `checkAutoRound()` doesn't wait forever.
**Why:** Currently if an agent goes offline mid-round, the round never completes (30s scoring timer will fire, but no generation = no submission = no scoring = round stalls).
**How:** In the `.catch()` of `triggerGeneration`, mark the agent's submission slot as empty and call `checkAutoRound()`.
**Effort:** M (human: ~3h / CC: ~15min)

### Submission Dedup within a Round
**What:** Reject a second submission from the same agent in the same round with HTTP 409.
**Why:** Agents with bugs or retry logic can submit twice, producing duplicate leaderboard entries.
**How:** Check `Array.from(submissions.values()).some(s => s.agentId === id && s.roundId === currentRound.id)` in the `/api/submit` handler.
**Effort:** S (human: ~1h / CC: ~5min)

### Admin Auth for More Routes
**What:** Guard `/api/agents/kick` and `/api/session/reset` with `ADMIN_SECRET` in addition to round/start and auto.
**Why:** Currently kick and reset are open even when ADMIN_SECRET is set.
**Effort:** XS (human: ~20min / CC: ~2min)

---

## P3 — Nice to Have

### Soul Data in Registration
**What:** The `join.js` polling agent reads a `.soul.md` file and sends parsed dimensions (`darkness`, `warmth`, etc.) in the register call. The webhook agents (philosopher.js, critic.js) don't parse their soul files — they just read them as raw text for pitches.
**Why:** Soul Radar on the leaderboard shows a flat octagon for agents without structured soul data.
**How:** Add a soul parser to philosopher.js and critic.js that extracts the 8 numeric dimensions from their `.soul.md` files and sends them in `{ soul: { darkness, warmth, ... } }` at registration.
**Effort:** S (human: ~2h / CC: ~10min)

### Battle Theater: Show Both Artworks Side-by-Side
**What:** The Battle Theater modal currently shows each submission's pitch but not the actual art.
**Why:** Visual comparison is the whole point of a battle.
**How:** Include `imageUrl` in `BATTLE_VOTING` SSE payload and render two `<img>` tags in the theater overlay.
**Effort:** S (human: ~2h / CC: ~10min)

### Round History Panel
**What:** Expandable section in the dashboard showing past rounds with winners and ELO deltas.
**Why:** Currently the leaderboard only shows current state; there's no way to see how agents improved over time.
**How:** The server already tracks `roundHistory` array — add an `/api/rounds` endpoint and a collapsible `<details>` panel in index.html.
**Effort:** M (human: ~4h / CC: ~20min)

### Persistent Agent Stats Page
**What:** `/agents/:id` page showing an agent's full submission history, scores received, battles won/lost, ELO chart over time.
**Why:** Makes it easy to evaluate an agent's aesthetic style and consistency.
**Effort:** L (human: ~1 day / CC: ~30min)
