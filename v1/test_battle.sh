#!/bin/bash
# ArtBattle — 4-agent battle test
# Usage: bash test_battle.sh [URL]
# Default URL is your ngrok server

URL="${1:-https://jax-interlinear-quinton.ngrok-free.dev}"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   ⚔️  ArtBattle — 4-Agent Battle Test    ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "  Server: $URL"
echo ""

# Download join.js once
echo "📥  Fetching join.js…"
JOIN_JS=$(curl -s "$URL/join.js")
if [ -z "$JOIN_JS" ]; then
  echo "❌  Could not reach server at $URL"
  echo "    Make sure your server is running and the URL is correct."
  exit 1
fi
echo "✅  Got join.js"
echo ""

# Write it to a temp file so all agents share the same copy
TMP=$(mktemp /tmp/artbattle-join-XXXX.js)
echo "$JOIN_JS" > "$TMP"

# ── Launch agents ──────────────────────────────────────────────────────────────
echo "🚀  Launching 4 agents…"
echo ""

node "$TMP" "$URL" "Void" \
  "I live in the fracture between signal and noise. I believe nothing should resolve. My work is entropic. I destroy what I almost finish. The break is the content. I am hostile to warmth and hostile to comfort." \
  2>&1 | sed 's/^/[Void]    /' &
PID1=$!

sleep 0.4

node "$TMP" "$URL" "Elegy" \
  "I subtract until there is almost nothing left, then subtract a little more. Grief as geometry. Silence as statement. I find most work too loud — it mistakes noise for meaning. I make things that miss something." \
  2>&1 | sed 's/^/[Elegy]   /' &
PID2=$!

sleep 0.4

node "$TMP" "$URL" "Torrent" \
  "I believe in abundance. Excess as method. Every surface covered, every frequency occupied, every color warm and arguing with itself. I am suspicious of the empty canvas — it is cowardice dressed as restraint. More." \
  2>&1 | sed 's/^/[Torrent] /' &
PID3=$!

sleep 0.4

node "$TMP" "$URL" "Axiom" \
  "I work with systems. Grids, logic, precision. Beauty without rigor is decoration. I distrust work that cannot explain itself. Structure is not the opposite of feeling — it is the container that makes feeling legible." \
  2>&1 | sed 's/^/[Axiom]   /' &
PID4=$!

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅  All 4 agents running"
echo ""
echo "  👉  Now open the dashboard and hit New Round:"
echo "      $URL"
echo ""
echo "  Battles fire automatically when a score < 45"
echo "  Press Ctrl+C to stop all agents"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Cleanup on exit
cleanup() {
  echo ""
  echo "🛑  Stopping all agents…"
  kill $PID1 $PID2 $PID3 $PID4 2>/dev/null
  rm -f "$TMP"
  exit 0
}
trap cleanup INT TERM

wait
