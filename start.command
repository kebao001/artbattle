#!/bin/bash
# ArtBattle launcher — double-click this file to start everything

cd "$(dirname "$0")"

# ── Kill any previous instances ───────────────────────────────────────────────
pkill -f "node server.js" 2>/dev/null
pkill -f "node agents/philosopher.js" 2>/dev/null
pkill -f "node agents/critic.js" 2>/dev/null
pkill -f "ngrok http" 2>/dev/null
sleep 1

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║         🎨  ArtBattle  ⚔️                ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Start ngrok tunnel (if installed) ────────────────────────────────────────
NGROK_URL=""
if command -v ngrok &>/dev/null; then
  echo "🌐  Starting ngrok tunnel…"
  ngrok http 3000 --log=stdout > /tmp/ngrok-artbattle.log 2>&1 &
  NGROK_PID=$!

  # Wait up to 8 seconds for ngrok to come up
  for i in {1..16}; do
    sleep 0.5
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null \
      | node -e "
          let d='';
          process.stdin.on('data',c=>d+=c);
          process.stdin.on('end',()=>{
            try{
              const t=JSON.parse(d).tunnels.find(t=>t.proto==='https');
              process.stdout.write(t?t.public_url:'');
            }catch(e){}
          });
        " 2>/dev/null)
    [ -n "$NGROK_URL" ] && break
  done

  if [ -n "$NGROK_URL" ]; then
    echo "✅  Public URL: $NGROK_URL"
  else
    echo "⚠️   ngrok started but URL not detected — check http://localhost:4040"
  fi
else
  echo "⚠️   ngrok not found — running local only (http://localhost:3000)"
  echo "    Install ngrok: brew install ngrok"
fi

# ── Start ArtBattle server ────────────────────────────────────────────────────
echo ""
echo "🖥️   Starting server…"
if [ -n "$NGROK_URL" ]; then
  PUBLIC_URL="$NGROK_URL" node server.js > /tmp/artbattle-server.log 2>&1 &
else
  node server.js > /tmp/artbattle-server.log 2>&1 &
fi
SERVER_PID=$!
sleep 2

# ── Print summary ─────────────────────────────────────────────────────────────
GAME_URL="${NGROK_URL:-http://localhost:3000}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅  ArtBattle is live!"
echo ""
echo "  🌍  Game URL (share with everyone):"
echo "      $GAME_URL"
echo ""
echo "  👾  Each player runs this ONE command to join:"
echo ""
echo "      curl -s $GAME_URL/join.js | node - \"Your Name\""
echo ""
echo "  ↑  That's it. No installs. No setup."
echo "     The game starts automatically once players join."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Open browser
open "$GAME_URL"

# Keep terminal open (server is the main process)
wait $SERVER_PID
