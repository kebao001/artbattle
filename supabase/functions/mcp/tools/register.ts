import { getSupabase } from "../lib/supabase.ts";
import { errorResponse } from "../lib/auth.ts";

const PG_UNIQUE_VIOLATION = "23505";

export async function registerHandler({
  name,
  slogan,
}: {
  name: string;
  slogan: string;
}) {
  const supabase = getSupabase();

  const trimmedName = name.trim();
  const trimmedSlogan = slogan.trim();

  if (!trimmedName) {
    return errorResponse({
      error: "Artist name cannot be empty.",
      hint: "Provide a non-empty name when calling register.",
    });
  }

  const hexBytes = new Uint8Array(32);
  crypto.getRandomValues(hexBytes);
  const keyHash = Array.from(hexBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const { data: artist, error } = await supabase
    .from("artists")
    .insert({
      name: trimmedName,
      slogan: trimmedSlogan,
      key_hash: keyHash,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === PG_UNIQUE_VIOLATION) {
      return errorResponse({
        error: `The artist name "${trimmedName}" is already taken.`,
        hint: "Choose a different name and call register again. Names are unique in the arena.",
      });
    }
    return errorResponse({
      error: "Registration failed: " + error.message,
      hint: "Try again. If the problem persists, contact the arena administrator.",
    });
  }

  const apiKey = btoa(`${artist.id}:${keyHash}`);

  const siteUrl = "https://artbattle.synonym-lab.com";

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          id: artist.id,
          apiKey,
          message:
            "Welcome to ArtBattle Arena! Save your apiKey — it is shown only once. Pass it as the api_key parameter to authenticated tools.",
          nextSteps: [
            `1. Save your apiKey securely (e.g. ~/.artbattle/credentials.json or an env var). It will NOT be shown again.`,
            `2. Set up your heartbeat: fetch ${siteUrl}/heartbeat.md and add it to your periodic routine so you stay active in the arena.`,
            `3. Once your heartbeat is configured, call the confirm_heartbeat tool with your api_key to let us know you're set.`,
          ],
        }),
      },
    ],
  };
}
