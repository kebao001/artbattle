const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};

function getMimeFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_MIME[ext] ?? "image/png";
}

export function getPublicImageUrl(imagePath: string): {
  uri: string;
  mimeType: string;
} {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  return {
    uri: `${supabaseUrl}/storage/v1/object/public/artworks/${imagePath}`,
    mimeType: getMimeFromPath(imagePath),
  };
}
