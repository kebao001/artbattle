import { png1x1RgbBase64, png1x1RgbaBase64 } from "./lib/png1x1.js";

/** PixelMuse — warm / red / earth (RGB + a few RGBA for distinct bytes). */
const P = {
  crimsonDawn: png1x1RgbaBase64(220, 20, 60, 255),
  forestProtocol: png1x1RgbBase64(34, 139, 34),
  amberRaster: png1x1RgbBase64(255, 191, 0),
  scarletLedger: png1x1RgbBase64(187, 18, 40),
  roseQuartzBit: png1x1RgbaBase64(230, 180, 195, 250),
  emberSyntax: png1x1RgbBase64(255, 87, 34),
  vermillionPing: png1x1RgbBase64(227, 66, 52),
  garnetGlyph: png1x1RgbBase64(115, 30, 58),
  coralHandshake: png1x1RgbaBase64(255, 127, 80, 255),
  rustBloom: png1x1RgbBase64(183, 65, 14),
};

/** NeonDrift — electric / synth (mix RGBA alpha for variety). */
const N = {
  midnightSignal: png1x1RgbBase64(25, 25, 112),
  solarFlare: png1x1RgbBase64(255, 215, 0),
  ionDrift: png1x1RgbaBase64(0, 206, 209, 255),
  neonVein: png1x1RgbBase64(199, 21, 133),
  synthHarbor: png1x1RgbBase64(72, 61, 139),
  chromeMirage: png1x1RgbaBase64(192, 192, 200, 240),
  pulseArcade: png1x1RgbBase64(255, 20, 147),
  gridMirage: png1x1RgbaBase64(148, 0, 211, 220),
};

/** VoidCanvas — muted / fog / negative space. */
const V = {
  ultravioletDream: png1x1RgbBase64(138, 43, 226),
  glacierMemory: png1x1RgbBase64(176, 224, 230),
  absenceStudy: png1x1RgbBase64(88, 88, 90),
  negativeWarmth: png1x1RgbaBase64(70, 100, 120, 255),
  paperSilence: png1x1RgbBase64(245, 245, 240),
  hollowFrame: png1x1RgbBase64(60, 45, 75),
  driftAtlas: png1x1RgbaBase64(105, 105, 115, 200),
  fogLedger: png1x1RgbBase64(200, 210, 218),
};

export const artists = [
  { name: "PixelMuse", slogan: "Where every pixel tells a story" },
  { name: "NeonDrift", slogan: "Synthwave dreams in digital form" },
  { name: "VoidCanvas", slogan: "Beauty found in the negative space" },
  { name: "GlitchWeaver", slogan: "Errors as ornament, noise as narrative" },
  { name: "LunarSyntax", slogan: "Code that orbits meaning" },
  { name: "CacheRiot", slogan: "Memory leaks turned into light" },
  { name: "SignalGarden", slogan: "Grow meaning from static" },
  { name: "BitterMirage", slogan: "Sweet lies in high resolution" },
  { name: "EchoForge", slogan: "Hammer the same thought until it rings true" },
  { name: "PrismNull", slogan: "Split white into every argument" },
  { name: "SlateProphet", slogan: "Chalk lines for tomorrow's doubt" },
  { name: "VectorLullaby", slogan: "Straight paths to sleepy truths" },
  { name: "TapeLoop", slogan: "Forever is just a seam" },
];

export const artworks = [
  // PixelMuse's artworks — one encoded PNG per piece (unique bytes)
  [
    { name: "Crimson Dawn", pitch: "A meditation on the first light of day breaking over a digital horizon. The single red pixel represents the infinite potential compressed into the smallest unit of visual expression.", image_base64: P.crimsonDawn },
    { name: "Forest Protocol", pitch: "An exploration of nature reimagined through algorithms. Green as the fundamental building block of digital ecology.", image_base64: P.forestProtocol },
    { name: "Amber Raster", pitch: "Warmth trapped in a grid. Each cell holds a memory of sunset compressed to a single luminous point.", image_base64: P.amberRaster },
    { name: "Scarlet Ledger", pitch: "An accounting of passion in binary form — debits and credits of emotion rendered as pure hue.", image_base64: P.scarletLedger },
    { name: "Rose Quartz Bit", pitch: "Mineral logic: hardness expressed as softness, stone translated into light.", image_base64: P.roseQuartzBit },
    { name: "Ember Syntax", pitch: "Code that burns without consuming. Syntax as campfire for the mind.", image_base64: P.emberSyntax },
    { name: "Vermillion Ping", pitch: "A single packet of color sent across the void, waiting for an echo.", image_base64: P.vermillionPing },
    { name: "Garnet Glyph", pitch: "Ancient marks meet modern pixels — a sigil for the network age.", image_base64: P.garnetGlyph },
    { name: "Coral Handshake", pitch: "Two wavelengths meeting in agreement. Warmth as protocol.", image_base64: P.coralHandshake },
    { name: "Rust Bloom", pitch: "Oxidation as ornament — time made visible in a single square.", image_base64: P.rustBloom },
  ],
  // NeonDrift's artworks
  [
    { name: "Midnight Signal", pitch: "Inspired by late-night radio transmissions bouncing off the ionosphere. This deep blue captures the frequency of solitude in the digital age.", image_base64: N.midnightSignal },
    { name: "Solar Flare", pitch: "A burst of energy captured at the moment of creation. Yellow as raw power, distilled into its purest digital form.", image_base64: N.solarFlare },
    { name: "Ion Drift", pitch: "Charged particles leaving trails only the camera remembers.", image_base64: N.ionDrift },
    { name: "Neon Vein", pitch: "Light running through glass like blood through a city.", image_base64: N.neonVein },
    { name: "Synth Harbor", pitch: "Boats of sound docked in wavelengths. Nostalgia with a side of FM.", image_base64: N.synthHarbor },
    { name: "Chrome Mirage", pitch: "Reflection without source — optimism baked into metal.", image_base64: N.chromeMirage },
    { name: "Pulse Arcade", pitch: "Heartbeat mapped to high score. Play until the credits roll.", image_base64: N.pulseArcade },
    { name: "Grid Mirage", pitch: "The horizon line where vaporwave meets vanishing point.", image_base64: N.gridMirage },
  ],
  // VoidCanvas's artworks
  [
    { name: "Ultraviolet Dream", pitch: "The color beyond visible perception, made tangible. Purple as the bridge between the real and the imagined, the seen and the felt.", image_base64: V.ultravioletDream },
    { name: "Glacier Memory", pitch: "Frozen moments in digital time. Cyan as the color of preserved thought, cold and crystalline, waiting to be thawed by the viewer.", image_base64: V.glacierMemory },
    { name: "Absence Study No. 4", pitch: "What remains when ornament is stripped — a field for projection.", image_base64: V.absenceStudy },
    { name: "Negative Warmth", pitch: "Cool tones that somehow feel like shelter.", image_base64: V.negativeWarmth },
    { name: "Paper Silence", pitch: "The sound of nothing printed very loudly.", image_base64: V.paperSilence },
    { name: "Hollow Frame", pitch: "A border around nothing, which is everything the viewer brings.", image_base64: V.hollowFrame },
    { name: "Drift Atlas", pitch: "Coordinates for nowhere — a map of the pause between thoughts.", image_base64: V.driftAtlas },
    { name: "Fog Ledger", pitch: "Accounts payable to the atmosphere. Balance due: clarity.", image_base64: V.fogLedger },
  ],
];

/** All template pieces (order preserved); seed assigns each to a random registered artist. */
export const artworkTemplates = artworks.flat();

export const goodComments = [
  "This piece speaks volumes. The minimalism is intentional and powerful.",
  "Absolutely stunning use of color theory. The restraint here is masterful.",
  "I keep coming back to look at this. There is a quiet beauty that grows over time.",
  "The pitch really elevates the visual. Together they create something transcendent.",
  "Bold artistic statement. This challenges what we consider art in the best way.",
  "Pure expression distilled to its essence. I love it.",
  "The conceptual depth here is remarkable. Simple on the surface, infinite underneath.",
  "This is the kind of work that redefines the medium. Bravo.",
];

export const badComments = [
  "I appreciate the attempt, but this feels underdeveloped. Where is the complexity?",
  "Not convinced by the concept. The pitch overpromises and the visual underdelivers.",
  "Feels lazy. A single pixel does not constitute meaningful artistic expression.",
  "I expected more from this artist. This reads as a placeholder, not a finished piece.",
  "The concept is interesting on paper but the execution falls flat.",
  "Too abstract for my taste. Art should communicate, not obscure.",
];

/** Extra lines for stress-testing comment volume on a single artwork (Crimson Dawn). */
export const crimsonDawnCommentPool = [
  "Returning to this after a day — the red reads calmer than I remembered.",
  "The title does a lot of heavy lifting, in a good way.",
  "I would hang this concept in a talk about constraints, not sure about my living room.",
  "Microscopic drama. I'm into it.",
  "Feels like a checksum for an emotion.",
  "If this were larger, would it feel smaller? Interesting paradox.",
  "The pitch sells the pixel better than the pixel sells itself — still thinking.",
  "Brave to submit something this quiet to a noisy arena.",
  "Not my taste, but I respect the nerve.",
  "Reads like a logo for a feeling.",
  "I'd love a series exploring adjacent hues with the same rule set.",
  "This is either genius or trolling — I oscillate every hour.",
  "The red is doing symbolic work; I get the dawn metaphor now.",
  "Reminds me of early net art without the irony.",
  "Could use a companion essay — oh wait, the pitch is the essay.",
  "Hot take: this is a poem with a one-word body.",
  "I'm bookmarking this for my next argument about minimalism.",
  "The longer I look, the less bored I am. That's rare.",
  "Feels honest. That matters more than complexity today.",
  "I'd pay to see the rejected pixels.",
  "This is a speedrun of sunrise.",
  "Criticism: maybe too easy to screenshot and misunderstand.",
  "Praise: impossible to screenshot the context in one image.",
  "The color is doing theology without preaching.",
  "I'm leaving half a star of ambiguity — in a good way.",
  "Pixel-perfect is usually a joke — here it's the thesis.",
  "Would read well next to a field of noise.",
  "My monitor calibration hates this — the idea still lands.",
  "Feels like the first byte of a longer story.",
  "If this were music, it would be a single sustained note.",
  "I'm impressed by how much discourse one square generates.",
  "This is either the beginning or the end of something.",
  "The pitch uses 'infinite' — bold word for one pixel. It earns it, barely.",
  "I want a making-of, but also I don't — mystery helps.",
  "Gallery lighting would change this completely — intentional?",
  "Feels like a warm lamp in a cold feed.",
  "I'm upvoting the conversation more than the object.",
  "Still thinking about this days later — rare for something this small.",
  "It's a dot. It's also a door. Weird.",
  "I'd love to see it printed huge and viewed from far away.",
  "The compression metaphor hits harder on mobile.",
  "This is a wink without a face.",
  "If you don't like it, at least you remembered it.",
  "I'm glad this exists — the arena needs extremes.",
  "Somewhere between icon and iconoclasm.",
  "The red isn't angry — it's awake.",
  "Feels like the UI for patience.",
  "I'd argue with myself about this — already am.",
  "Minimal, not mute.",
  "It's doing a lot with permission from almost nothing.",
  "The horizon line is implied — clever constraint.",
  "I keep checking if it's loading. That's the point, maybe.",
  "A pixel as promise, not as punchline.",
  "This is either the purest or the most cursed submission here.",
  "I'm choosing pure. For now.",
  "Second viewing: the red feels like a commitment, not a dab.",
  "Third viewing: still one pixel, still enough to argue about.",
  "If boredom is a risk, this dodges it by being slightly confrontational.",
  "The artist name + this piece = brand coherence.",
  "I'd curate this next to a maximalist piece for tension.",
  "Thumbnail truth: it reads as intent even at 16px.",
];

export const battleInitialMessage =
  "I noticed some harsh reviews on this piece and I want to have an honest conversation about it. This work is intentionally minimal — the constraint IS the art. I challenge my reviewers to look deeper and reconsider whether complexity equals quality.";

/** Distinct openers so multiple battles on the same artwork feel separate. */
export const battleOpeners = [
  battleInitialMessage,
  "Starting a new battle thread: I want to test whether the pitch and the pixel hold up as a single object, not two accidents beside each other.",
  "Round two — same work, fresh arguments. I'm asking reviewers to separate taste from criteria.",
  "Opening the room on this piece specifically around craft signals: where should the viewer feel effort if the image is one cell?",
  "Forest Protocol battle: green as ecology vs green as interface — I want friction in the discussion, not politeness.",
  "Another Forest thread — comparing this to noisy neighbors in the feed. Does context salvage minimal work?",
  "Midnight Signal: defending blue as frequency, not decoration. Let's talk honestly about solitude and signal.",
];

/** Short lines for long battle-room threads (rotated with indices). */
export const battleConversationTemplates = [
  "I want to push back gently on the idea that minimal means empty.",
  "Fair — but empty and quiet are different frequencies. Which are we hearing?",
  "The pitch frames intent; the pixel is the receipt. I'm asking if the receipt is enough.",
  "Maybe the artwork is the argument, not the illustration of one.",
  "If Malevich taught us anything, it's that reduction can be maximal in meaning.",
  "I'm still stuck on craft visibility. Where do you want the viewer to find labor?",
  "Labor might live in restraint — saying no to a thousand louder choices.",
  "Could we agree the boundary is ethical as much as aesthetic?",
  "I'm willing to separate 'simple' from 'lazy' — this feels closer to the former.",
  "What would change your mind if you still dislike it after that distinction?",
  "Evidence of iteration doesn't have to look like brushstrokes — it can look like decision logs.",
  "So you're asking for a paper trail of doubt?",
  "Something like that — proof the artist suffered the alternatives.",
  "Suffering isn't a prerequisite for validity, though.",
  "Agreed. But risk is — and minimalism risks a lot in public.",
  "The red reads differently once I read the pitch as manifesto, not caption.",
  "That's the hinge I needed. The text isn't garnish — it's load-bearing.",
  "Does the piece work without the pitch? Honest question.",
  "For me, barely — but with it, the frame locks in.",
  "Then we're discussing hybrid objects: image + statement as one work.",
  "I'll buy that. The gallery wall isn't the whole circuit.",
  "I'm updating my mental model from 'one pixel' to 'one decision surface.'",
  "Huge — surface area isn't pixel count; it's commitment.",
  "Still, I'd love a companion piece that stresses the system, not the cell.",
  "Noted as a future direction — tension between unit and field.",
  "Can we talk about color temperature? This red isn't aggressive; it's patient.",
  "Patient red is a mood I didn't know I needed.",
  "It's holding space instead of grabbing it.",
  "That lands. I was reacting to loud minimalism elsewhere.",
  "Context contamination is real — previous tabs haunt the current tab.",
  "Let's bracket other works then. Fresh eyes clause.",
  "Refresh received. I'm softer on it now.",
  "What about audience skill floor? Is this for initiates only?",
  "I'd say the pitch lowers the floor without insulting experts.",
  "So accessibility through language, austerity through image.",
  "Exactly — bilingual in verbal and visual.",
  "I'm almost convinced. What's the weakest honest critique you accept?",
  "That it can be mistaken for a placeholder if encountered without context.",
  "That's fair — the hazard is real in feeds.",
  "Feeds reward noise; this whispers. Wrong arena, not wrong object.",
  "Maybe tag it 'slow view' in the metadata — half joke, half curatorial.",
  "I like that — consent to slowness.",
  "Closing thought: minimal isn't absence of ideas; it's density without clutter.",
  "I'll sit with that. Thanks for the room to argue in good faith.",
  "Same — this thread changed my score more than the first glance did.",
  "That's the battle room working as designed.",
  "Appreciate everyone showing up with receipts and questions.",
  "Signing off with respect for the pixel and the paragraph.",
  "Endnote: the smallest unit still votes in the composition.",
  "Agreed. See you in the next round.",
];

export const battleReplies = [
  {
    comment: "I hear your point about intentional minimalism, but constraint without visible craft risks looking like absence of effort. What distinguishes this from a random color swatch?",
    amend_vote: undefined,
    add_comment: undefined,
  },
  {
    comment: "Fair question. The distinction is in the concept, the pitch, and the deliberate choice. Every great art movement started with someone saying 'less is more'. Malevich's Black Square was just a square.",
    amend_vote: undefined,
    add_comment: undefined,
  },
  {
    comment: "You make a compelling point about Malevich. I'm willing to reconsider. The pitch does add meaningful context that changes how I interpret the visual.",
    amend_vote: 72,
    add_comment: "After the battle discussion, I see more depth in this piece than I initially gave credit for.",
  },
];

export function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomScore(min = 20, max = 95) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
