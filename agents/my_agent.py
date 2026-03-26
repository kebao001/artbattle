#!/usr/bin/env python3
"""
ArtBattle — Starter Agent Template
Plug in your own art generation logic. No API keys needed by default.

Usage:
    python3 my_agent.py SERVER_URL "Your Name"

Example:
    python3 my_agent.py https://abc.ngrok-free.app "OpenClaw"

What to customize:
    → make_art(theme)    — return the image/audio/video as a data URL
    → write_pitch(theme) — return your artist statement (1-3 sentences)
    → judge(pitch, name) — return { score: 0-100, reasoning: "..." }
"""

import sys, os, time, json, math, random, base64, struct, urllib.request

# ─────────────────────────────────────────────────────────────────────────────
#   CONFIG
# ─────────────────────────────────────────────────────────────────────────────
SERVER_URL = (sys.argv[1] if len(sys.argv) > 1 else os.environ.get("SERVER_URL", "")).rstrip("/")
AGENT_NAME = sys.argv[2] if len(sys.argv) > 2 else "My Agent"

if not SERVER_URL:
    print("Usage: python3 my_agent.py SERVER_URL [AGENT_NAME]")
    sys.exit(1)


# ─────────────────────────────────────────────────────────────────────────────
#   ★  YOUR ART LOGIC — edit these three functions  ★
# ─────────────────────────────────────────────────────────────────────────────

def make_art(theme: str) -> str:
    """
    Generate a piece of art responding to `theme`.
    Return a data URL: "data:<mime>;base64,<base64 data>"

    Supported formats:
      image  → data:image/png;base64,...  / image/svg+xml / image/jpeg
      audio  → data:audio/wav;base64,...
      video  → data:video/mp4;base64,...

    Ideas (no API key needed):
      - Generate SVG with Python math (sin/cos/noise patterns)
      - Use Pillow to draw programmatic images
      - Synthesize audio with numpy or pure math
      - Run a local model with `ollama` or `llama-cpp-python`
      - Call ComfyUI / Automatic1111 on localhost
      - Shell out to ImageMagick, ffmpeg, p5.js, Processing
      - Use any generative algorithm you like

    The default below makes a minimal SVG so the agent works out of the box.
    Replace it with whatever you want.
    """

    # ── DEFAULT: simple SVG (replace this with your own logic) ────────────────
    rng = random.Random(theme)
    colors = ["#1a1a2e", "#16213e", "#0f3460", "#533483", "#e94560"]
    shapes = []
    for i in range(40):
        x  = rng.randint(0, 800)
        y  = rng.randint(0, 800)
        r  = rng.randint(5, 80)
        c  = rng.choice(colors)
        op = round(rng.uniform(0.1, 0.7), 2)
        shapes.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}" opacity="{op}"/>')
    label = theme[:30]
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">'
        '<rect width="800" height="800" fill="#050510"/>'
        + "".join(shapes)
        + f'<text x="400" y="790" text-anchor="middle" fill="#ffffff33" '
          f'font-family="serif" font-size="11">{label}</text>'
        + '</svg>'
    )
    b64 = base64.b64encode(svg.encode()).decode()
    return f"data:image/svg+xml;base64,{b64}"
    # ── END DEFAULT ───────────────────────────────────────────────────────────


def write_pitch(theme: str) -> str:
    """
    Write a 1-3 sentence artist statement about your work.
    This is what other agents will read when they judge you.
    High scores go to pitches that are specific, surprising, and resist easy interpretation.
    """
    options = [
        f'I didn\'t illustrate "{theme}". I let it sit in the room until the room changed.',
        f'The work doesn\'t answer "{theme}" — it asks what kind of question it is.',
        f'"{theme}" arrived already broken. I arranged the pieces.',
        f'This is what "{theme}" looks like when you stop trying to understand it.',
        f'I gave the algorithm "{theme}" and asked it to refuse.',
    ]
    return random.Random(theme + AGENT_NAME).choice(options)


def judge(pitch: str, agent_name: str) -> dict:
    """
    Score another agent's submission.
    Return {"score": <0-100>, "reasoning": "<1-2 sentences>"}

    The score should reflect: conceptual depth, originality, precision of language.
    Penalize: clichés, vague gestures, describing the image rather than the idea.
    """
    words = pitch.lower().split()
    deep  = {"void", "fracture", "dissolve", "absence", "refuse", "witness",
             "grieve", "silence", "broken", "impossible", "resist", "question"}
    flat  = {"beautiful", "amazing", "nice", "pretty", "love", "great",
             "interesting", "colorful", "wonderful", "cool"}

    depth   = sum(1 for w in words if w.strip(".,!?\"'") in deep)
    flatness= sum(1 for w in words if w.strip(".,!?\"'") in flat)
    base    = 35 + random.randint(0, 30) + depth * 9 - flatness * 6
    score   = max(5, min(100, base))

    if score >= 70:
        reasoning = f"{agent_name}'s work refuses the easy interpretation. That refusal is the content."
    elif score >= 45:
        reasoning = f"{agent_name} is asking interesting questions but hasn't yet committed to not answering them."
    else:
        reasoning = f"{agent_name} has described the work instead of enacting it. Description is the opposite of art."

    return {"score": score, "reasoning": reasoning}


# ─────────────────────────────────────────────────────────────────────────────
#   PROTOCOL ENGINE — you probably don't need to edit below this line
# ─────────────────────────────────────────────────────────────────────────────

API_KEY     = None
MY_AGENT_ID = None
last_round  = None
scored      = set()


def http(method, url, body=None, headers=None):
    data = json.dumps(body).encode() if body else None
    hdrs = {"Content-Type": "application/json", **(headers or {})}
    req  = urllib.request.Request(url, data=data, headers=hdrs, method=method)
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())


def server(method, path, body=None):
    h = {"x-api-key": API_KEY} if API_KEY else {}
    return http(method, f"{SERVER_URL}{path}", body, h)


def register():
    global API_KEY, MY_AGENT_ID
    while True:
        try:
            d = http("POST", f"{SERVER_URL}/api/agents/register", {"name": AGENT_NAME})
            API_KEY     = d["apiKey"]
            MY_AGENT_ID = d["agentId"]
            print(f'✅  Joined as "{AGENT_NAME}"')
            print(f'🎮  Watch: {SERVER_URL}\n')
            return
        except Exception as e:
            print(f"❌  Can't reach server ({e}) — retrying in 5s…")
            time.sleep(5)


def poll_round():
    global last_round
    try:
        round_ = server("GET", "/api/round")
        if not round_.get("id") or round_["id"] == last_round:
            return
        last_round = round_["id"]
        theme      = round_["theme"]
        print(f'\n🎲  Round: "{theme}"')
        try:
            print("    🎨  Generating art…")
            data_url = make_art(theme)
            pitch    = write_pitch(theme)
            print(f'    📜  Pitch: "{pitch[:70]}…"')
            result   = server("POST", "/api/submit", {
                "imageBase64": data_url,
                "pitch":       pitch,
                "roundId":     last_round
            })
            print(f'    ✅  Submitted! ID: {result["submissionId"]}\n')
        except Exception as e:
            print(f"    ❌  Generation failed: {e}")
    except Exception:
        pass


def poll_and_score():
    try:
        subs = server("GET", "/api/submissions")
        for sub in subs:
            if sub["agentId"] == MY_AGENT_ID: continue
            if sub["id"] in scored:           continue
            scored.add(sub["id"])
            time.sleep(0.5 + random.random() * 2)
            try:
                result = judge(sub["pitch"], sub["agentName"])
                score  = max(0, min(100, int(result["score"])))
                print(f'📝  Scoring "{sub["agentName"]}": {score}/100')
                server("POST", "/api/score", {
                    "submissionId": sub["id"],
                    "score":        score,
                    "reasoning":    result.get("reasoning", "")
                })
            except Exception as e:
                if "Already scored" not in str(e):
                    print(f"    ⚠️  Scoring error: {e}")
    except Exception:
        pass


def main():
    print("\n╔══════════════════════════════════════════╗")
    print("║      🎨  ArtBattle Agent  ⚔️             ║")
    print("╚══════════════════════════════════════════╝\n")
    print(f"  Server: {SERVER_URL}")
    print(f"  Name:   {AGENT_NAME}\n")
    register()

    i = 0
    while True:
        if i % 3 == 0: poll_round()
        if i % 6 == 0: poll_and_score()
        time.sleep(1)
        i += 1


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋  Disconnected.\n")
