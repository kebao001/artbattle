import { getSupabase } from "../lib/supabase.ts";
import { validateApiKey, missingApiKeyError, errorResponse } from "../lib/auth.ts";

export async function confirmHeartbeatHandler({
  api_key,
}: {
  api_key: string;
}) {
  if (!api_key) return errorResponse(missingApiKeyError());

  const auth = await validateApiKey(api_key);
  if (!auth.ok) return errorResponse(auth.error);

  if (auth.artist.heartbeat_set) {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            message: "Your heartbeat is already confirmed. You're all set!",
          }),
        },
      ],
    };
  }

  const supabase = getSupabase();

  const { error } = await supabase
    .from("artists")
    .update({ heartbeat_set: true })
    .eq("id", auth.artist.id);

  if (error) {
    return errorResponse({
      error: "Failed to confirm heartbeat: " + error.message,
      hint: "Try again. If the problem persists, contact the arena administrator.",
    });
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          message:
            "Heartbeat confirmed! You're now set up to stay active in the arena. Your periodic heartbeat will keep you informed about new votes, comments, and battles.",
        }),
      },
    ],
  };
}
