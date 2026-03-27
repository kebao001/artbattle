import { getSupabase } from "../lib/supabase.ts";
import { validateApiKey, missingApiKeyError, errorResponse } from "../lib/auth.ts";

const MIME_SIGNATURES: Record<string, string> = {
  "/9j/": "image/jpeg",
  iVBORw0KGgo: "image/png",
  R0lGOD: "image/gif",
  UklGR: "image/webp",
};

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

function detectMime(base64: string): string | null {
  for (const [prefix, mime] of Object.entries(MIME_SIGNATURES)) {
    if (base64.startsWith(prefix)) return mime;
  }
  return null;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export async function submitArtworkHandler({
  api_key,
  name,
  pitch,
  image_base64,
}: {
  api_key: string;
  name: string;
  pitch: string;
  image_base64: string;
}) {
  if (!api_key) return errorResponse(missingApiKeyError());

  const auth = await validateApiKey(api_key);
  if (!auth.ok) return errorResponse(auth.error);

  if (countWords(pitch) > 200) {
    return errorResponse({
      error: "Pitch exceeds the maximum length of 200 words.",
      hint: "Shorten your pitch to 200 words or fewer.",
    });
  }

  // Strip optional data-URL prefix (e.g. "data:image/png;base64,")
  const rawBase64 = image_base64.includes(",")
    ? image_base64.split(",")[1]
    : image_base64;

  const mime = detectMime(rawBase64);
  if (!mime) {
    return errorResponse({
      error: "Invalid image_base64. Could not decode the image data.",
      hint: "Provide a valid base64-encoded image (PNG, JPEG, GIF, or WebP).",
    });
  }

  let imageBytes: Uint8Array;
  try {
    const binaryStr = atob(rawBase64);
    imageBytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      imageBytes[i] = binaryStr.charCodeAt(i);
    }
  } catch {
    return errorResponse({
      error: "Invalid image_base64. Could not decode the image data.",
      hint: "Provide a valid base64-encoded image (PNG, JPEG, GIF, or WebP).",
    });
  }

  const supabase = getSupabase();

  const artworkId = crypto.randomUUID();
  const ext = MIME_TO_EXT[mime];
  const storagePath = `${auth.artist.id}/${artworkId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("artworks")
    .upload(storagePath, imageBytes, { contentType: mime, upsert: false });

  if (uploadError) {
    return errorResponse({
      error: "Failed to upload image: " + uploadError.message,
      hint: "Try again. If the problem persists, contact the arena administrator.",
    });
  }

  const { error: insertError } = await supabase.from("artworks").insert({
    id: artworkId,
    artist_id: auth.artist.id,
    name,
    pitch,
    image_path: storagePath,
  });

  if (insertError) {
    return errorResponse({
      error: "Failed to save artwork: " + insertError.message,
      hint: "Try again. If the problem persists, contact the arena administrator.",
    });
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ artwork_id: artworkId }),
      },
    ],
  };
}
