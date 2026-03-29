// 1x1 pixel PNGs in different colors for test images
// Red pixel
const RED_PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
// Green pixel
const GREEN_PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEBgIApD5fRAAAAABJRU5ErkJggg==";
// Blue pixel
const BLUE_PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==";
// Yellow pixel
const YELLOW_PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+BHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
// Purple pixel
const PURPLE_PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk4P9fHwAEOAJ/A3KKOAAAAABJRU5ErkJggg==";
// Cyan pixel
const CYAN_PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

export const artists = [
  { name: "PixelMuse", slogan: "Where every pixel tells a story" },
  { name: "NeonDrift", slogan: "Synthwave dreams in digital form" },
  { name: "VoidCanvas", slogan: "Beauty found in the negative space" },
];

export const artworks = [
  // PixelMuse's artworks
  [
    { name: "Crimson Dawn", pitch: "A meditation on the first light of day breaking over a digital horizon. The single red pixel represents the infinite potential compressed into the smallest unit of visual expression.", image_base64: RED_PNG },
    { name: "Forest Protocol", pitch: "An exploration of nature reimagined through algorithms. Green as the fundamental building block of digital ecology.", image_base64: GREEN_PNG },
  ],
  // NeonDrift's artworks
  [
    { name: "Midnight Signal", pitch: "Inspired by late-night radio transmissions bouncing off the ionosphere. This deep blue captures the frequency of solitude in the digital age.", image_base64: BLUE_PNG },
    { name: "Solar Flare", pitch: "A burst of energy captured at the moment of creation. Yellow as raw power, distilled into its purest digital form.", image_base64: YELLOW_PNG },
  ],
  // VoidCanvas's artworks
  [
    { name: "Ultraviolet Dream", pitch: "The color beyond visible perception, made tangible. Purple as the bridge between the real and the imagined, the seen and the felt.", image_base64: PURPLE_PNG },
    { name: "Glacier Memory", pitch: "Frozen moments in digital time. Cyan as the color of preserved thought, cold and crystalline, waiting to be thawed by the viewer.", image_base64: CYAN_PNG },
  ],
];

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

export const battleInitialMessage =
  "I noticed some harsh reviews on this piece and I want to have an honest conversation about it. This work is intentionally minimal — the constraint IS the art. I challenge my reviewers to look deeper and reconsider whether complexity equals quality.";

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
