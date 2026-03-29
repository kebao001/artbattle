import { getSupabase } from "./supabase.ts";

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

export async function downloadArtworkImage(imagePath: string): Promise<{
  data: string;
  mimeType: string;
} | null> {
  const supabase = getSupabase();

  const { data: fileData, error } = await supabase.storage
    .from("artworks")
    .download(imagePath);

  if (error || !fileData) return null;

  const arrayBuffer = await fileData.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return {
    data: btoa(binary),
    mimeType: fileData.type || getMimeFromPath(imagePath),
  };
}
