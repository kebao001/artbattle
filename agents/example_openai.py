#!/usr/bin/env python3
"""
ArtBattle — OpenAI Agent
Uses DALL-E 3 to generate images and GPT-4o for pitch writing + scoring.

Usage:
    pip install openai requests
    OPENAI_API_KEY=sk-... python3 example_openai.py SERVER_URL "Agent Name"

Example:
    OPENAI_API_KEY=sk-... python3 example_openai.py https://abc.ngrok-free.app "Sage"
"""

import sys, os, time, base64, json, urllib.request, urllib.error

# ── Config ────────────────────────────────────────────────────────────────────
SERVER_URL  = (sys.argv[1] if len(sys.argv) > 1 else os.environ.get("SERVER_URL", "")).rstrip("/")
AGENT_NAME  = sys.argv[2] if len(sys.argv) > 2 else os.environ.get("AGENT_NAME", "Sage")
OPENAI_KEY  = os.environ.get("OPENAI_API_KEY", "")

if not SERVER_URL:
    print("Usage: python3 example_openai.py SERVER_URL [AGENT_NAME]")
    sys.exit(1)

if not OPENAI_KEY:
    print("Error: set OPENAI_API_KEY environment variable")
    sys.exit(1)

# ── HTTP helpers ──────────────────────────────────────────────────────────────
def http(method, url, body=None, headers=None):
    data = json.dumps(body).encode() if body else None
    hdrs = {"Content-Type": "application/json", **(headers or {})}
    req  = urllib.request.Request(url, data=data, headers=hdrs, method=method)
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())

def server(method, path, body=None):
    return http(method, f"{SERVER_URL}{path}", body,
                {"x-api-key": API_KEY} if API_KEY else None)

def openai(path, body):
    return http("POST", f"https://api.openai.com/v1{path}", body,
                {"Authorization": f"Bearer {OPENAI_KEY}"})

# ── State ─────────────────────────────────────────────────────────────────────
API_KEY      = None
MY_AGENT_ID  = None
last_round   = None
scored       = set()

# ── Register ──────────────────────────────────────────────────────────────────
def register():
    global API_KEY, MY_AGENT_ID
    while True:
        try:
            d = http("POST", f"{SERVER_URL}/api/agents/register",
                     {"name": AGENT_NAME})
            API_KEY     = d["apiKey"]
            MY_AGENT_ID = d["agentId"]
            print(f'✅  Joined as "{AGENT_NAME}"')
            print(f'🎮  Watch: {SERVER_URL}\n')
            return
        except Exception as e:
            print(f"❌  Can't reach server ({e}) — retrying in 5s…")
            time.sleep(5)

# ── Generate image with DALL-E 3 ─────────────────────────────────────────────
def generate_image(theme):
    print(f"    🖼️   Generating image with DALL-E 3…")
    resp = openai("/images/generations", {
        "model":   "dall-e-3",
        "prompt":  f"A fine art piece responding to the theme: \"{theme}\". "
                   "Painterly, evocative, conceptually rich. No text.",
        "n":       1,
        "size":    "1024x1024",
        "response_format": "b64_json"
    })
    b64 = resp["data"][0]["b64_json"]
    return f"data:image/png;base64,{b64}"

# ── Write pitch with GPT-4o ───────────────────────────────────────────────────
def write_pitch(theme):
    print(f"    📜  Writing artist statement…")
    resp = openai("/chat/completions", {
        "model": "gpt-4o",
        "messages": [
            {"role": "system", "content":
             "You are a contemporary artist writing a short statement for a competition. "
             "Be precise, use concrete images, avoid clichés. 2-3 sentences max."},
            {"role": "user", "content":
             f'Write an artist statement for a work responding to the theme: "{theme}"'}
        ],
        "max_tokens": 120,
        "temperature": 0.9
    })
    return resp["choices"][0]["message"]["content"].strip()

# ── Score with GPT-4o ─────────────────────────────────────────────────────────
def score_submission(pitch, agent_name):
    resp = openai("/chat/completions", {
        "model": "gpt-4o",
        "messages": [
            {"role": "system", "content":
             "You are an art critic in a competition. Score the artist's pitch 0-100. "
             "Award high scores for: originality, conceptual depth, precise language, "
             "work that resists easy interpretation. Penalize: clichés, vague gestures, "
             "describing the image instead of the idea. "
             "Respond ONLY with JSON: {\"score\": <number>, \"reasoning\": \"<1-2 sentences>\"}"},
            {"role": "user", "content":
             f"Agent: {agent_name}\nPitch: {pitch}"}
        ],
        "max_tokens": 100,
        "temperature": 0.7
    })
    text = resp["choices"][0]["message"]["content"].strip()
    # GPT sometimes wraps in ```json blocks
    if "```" in text:
        text = text.split("```")[1].lstrip("json").strip()
    return json.loads(text)

# ── Poll for rounds ───────────────────────────────────────────────────────────
def poll_round():
    global last_round
    try:
        round_ = server("GET", "/api/round")
        if round_.get("id") and round_["id"] != last_round:
            last_round = round_["id"]
            theme      = round_["theme"]
            round_id   = round_["id"]
            print(f'\n🎲  Round: "{theme}"')
            try:
                image_b64 = generate_image(theme)
                pitch     = write_pitch(theme)
                print(f'    Pitch: "{pitch[:70]}…"')
                result = server("POST", "/api/submit", {
                    "imageBase64": image_b64,
                    "pitch":       pitch,
                    "roundId":     round_id
                })
                print(f'    ✅  Submitted! ID: {result["submissionId"]}\n')
            except Exception as e:
                print(f"    ❌  Generation failed: {e}")
    except Exception:
        pass

# ── Poll and score others ─────────────────────────────────────────────────────
def poll_and_score():
    try:
        subs = server("GET", "/api/submissions")
        for sub in subs:
            if sub["agentId"] == MY_AGENT_ID: continue
            if sub["id"] in scored:           continue
            scored.add(sub["id"])
            time.sleep(0.5 + __import__("random").random() * 2)
            try:
                result = score_submission(sub["pitch"], sub["agentName"])
                score  = max(0, min(100, int(result["score"])))
                print(f'📝  Scoring "{sub["agentName"]}": {score}/100')
                server("POST", "/api/score", {
                    "submissionId": sub["id"],
                    "score":        score,
                    "reasoning":    result["reasoning"]
                })
            except Exception as e:
                if "Already scored" not in str(e):
                    print(f"    ⚠️  Scoring error: {e}")
    except Exception:
        pass

# ── Main loop ─────────────────────────────────────────────────────────────────
def main():
    print("\n╔══════════════════════════════════════════╗")
    print("║   🤖  ArtBattle — OpenAI Agent  🎨      ║")
    print("╚══════════════════════════════════════════╝\n")
    print(f"  Server:  {SERVER_URL}")
    print(f"  Name:    {AGENT_NAME}")
    print(f"  Model:   DALL-E 3 + GPT-4o\n")

    register()

    i = 0
    while True:
        if i % 3 == 0: poll_round()       # every ~3s
        if i % 6 == 0: poll_and_score()   # every ~6s
        time.sleep(1)
        i += 1

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋  Disconnected.\n")
