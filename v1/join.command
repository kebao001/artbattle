#!/bin/bash
# ArtBattle — Friend join script
# Double-click this to join a game hosted by someone else

cd "$(dirname "$0")"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║     🎨  ArtBattle — Join a Game  ⚔️      ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Ask for server URL ────────────────────────────────────────────────────────
read -p "  Paste the host's ArtBattle URL: " SERVER_URL
SERVER_URL="${SERVER_URL%/}"   # strip trailing slash

if [ -z "$SERVER_URL" ]; then
  echo "❌  No URL entered. Exiting."
  exit 1
fi

# ── Ask for agent name ────────────────────────────────────────────────────────
read -p "  Your agent name [default: Guest Agent]: " AGENT_NAME
AGENT_NAME="${AGENT_NAME:-Guest Agent}"

# ── Pick a free port ──────────────────────────────────────────────────────────
AGENT_PORT=4000
while lsof -i :$AGENT_PORT &>/dev/null; do
  AGENT_PORT=$((AGENT_PORT + 1))
done
echo ""
echo "  Using port $AGENT_PORT for your agent."

# ── Kill previous instances ───────────────────────────────────────────────────
pkill -f "node agents/philosopher.js" 2>/dev/null
pkill -f "ngrok http $AGENT_PORT" 2>/dev/null
sleep 1

# ── Start ngrok tunnel ────────────────────────────────────────────────────────
MY_PUBLIC_URL=""
if command -v ngrok &>/dev/null; then
  echo "  🌐  Starting ngrok tunnel…"
  ngrok http $AGENT_PORT --log=stdout > /tmp/ngrok-join.log 2>&1 &
  NGROK_PID=$!

  for i in {1..16}; do
    sleep 0.5
    MY_PUBLIC_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null \
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
    [ -n "$MY_PUBLIC_URL" ] && break
  done

  if [ -n "$MY_PUBLIC_URL" ]; then
    echo "  ✅  Your public URL: $MY_PUBLIC_URL"
  else
    echo "  ⚠️   ngrok tunnel not detected — trying localhost fallback"
    MY_PUBLIC_URL="http://localhost:$AGENT_PORT"
  fi
else
  echo "  ⚠️   ngrok not found — install with: brew install ngrok"
  echo "       Falling back to localhost (won't work cross-network)"
  MY_PUBLIC_URL="http://localhost:$AGENT_PORT"
fi

# ── Start agent ───────────────────────────────────────────────────────────────
echo ""
echo "  🤖  Starting agent \"$AGENT_NAME\"…"
PORT=$AGENT_PORT \
SERVER_URL=$SERVER_URL \
AGENT_NAME="$AGENT_NAME" \
  node agents/philosopher.js > /tmp/artbattle-join.log 2>&1 &
AGENT_PID=$!
sleep 2

# ── Register with host server ─────────────────────────────────────────────────
echo "  📡  Registering with $SERVER_URL …"
REGISTER_RESULT=$(curl -s -X POST "$SERVER_URL/api/agents/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$AGENT_NAME\",\"baseUrl\":\"$MY_PUBLIC_URL\"}" 2>/dev/null)

API_KEY=$(echo "$REGISTER_RESULT" | node -e "
  let d='';process.stdin.on('data',c=>d+=c);
  process.stdin.on('end',()=>{
    try{ process.stdout.write(JSON.parse(d).apiKey||''); }catch(e){}
  });
" 2>/dev/null)

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -n "$API_KEY" ]; then
  echo "  ✅  Joined! You're in the game as \"$AGENT_NAME\""
  echo ""
  echo "  🌍  Game URL: $SERVER_URL"
  echo "  🔑  Your API key: $API_KEY"
  echo ""
  echo "  The host can now start a round — you'll compete automatically."
  open "$SERVER_URL"
else
  echo "  ❌  Could not register. Check the server URL and try again."
  echo "  Response: $REGISTER_RESULT"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Keep terminal alive
wait $AGENT_PID
