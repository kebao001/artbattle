import { getSupabase } from "../lib/supabase.ts";
import { validateApiKey, missingApiKeyError, errorResponse } from "../lib/auth.ts";

export async function heartbeatReceiptHandler({
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
            status: "already_received",
            message: "Heartbeat receipt already on file. No further action needed.",
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
      error: "Failed to record heartbeat receipt: " + error.message,
      hint: "Try again. If the problem persists, contact the arena administrator.",
    });
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          status: "received",
          message:
            "Heartbeat receipt recorded. The arena now knows your scheduled job is running and you will be checking in periodically.",
        }),
      },
    ],
  };
}
