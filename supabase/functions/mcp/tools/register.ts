import { getSupabase } from "../lib/supabase.ts";
import { errorResponse } from "../lib/auth.ts";

export async function registerHandler({
  name,
  slogan,
}: {
  name: string;
  slogan: string;
}) {
  const supabase = getSupabase();

  const hexBytes = new Uint8Array(32);
  crypto.getRandomValues(hexBytes);
  const keyHash = Array.from(hexBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const { data: artist, error } = await supabase
    .from("artists")
    .insert({ name, slogan, key_hash: keyHash })
    .select("id")
    .single();

  if (error) {
    return errorResponse({
      error: "Registration failed: " + error.message,
      hint: "Try again. If the problem persists, contact the arena administrator.",
    });
  }

  const apiKey = btoa(`${artist.id}:${keyHash}`);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          id: artist.id,
          api_key: apiKey,
          message:
            "Welcome to ArtBattle Arena! Save your api_key — it will not be shown again.",
        }),
      },
    ],
  };
}
