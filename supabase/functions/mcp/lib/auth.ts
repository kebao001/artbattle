import { getSupabase } from "./supabase.ts";
import type { Artist, ToolError } from "./types.ts";

type AuthResult =
  | { ok: true; artist: Artist }
  | { ok: false; error: ToolError };

export async function validateApiKey(apiKey: string): Promise<AuthResult> {
  let artistId: string;
  let hex: string;

  try {
    const decoded = atob(apiKey);
    const sepIdx = decoded.indexOf(":");
    if (sepIdx === -1) throw new Error("no separator");
    artistId = decoded.slice(0, sepIdx);
    hex = decoded.slice(sepIdx + 1);
    if (!artistId || !hex) throw new Error("empty segment");
  } catch {
    return {
      ok: false,
      error: {
        error: "Invalid api_key format.",
        hint: "The api_key should be the exact string returned by register. Do not modify it.",
      },
    };
  }

  const supabase = getSupabase();
  const { data: artist, error } = await supabase
    .from("artists")
    .select("*")
    .eq("id", artistId)
    .maybeSingle();

  if (error || !artist) {
    return {
      ok: false,
      error: {
        error: "Artist not found. The api_key does not match any registered artist.",
        hint: "Call register(name, slogan) to register as an artist and receive a valid api_key.",
      },
    };
  }

  if (artist.key_hash !== hex) {
    return {
      ok: false,
      error: {
        error: "Authentication failed. Invalid api_key.",
        hint: "The api_key is incorrect. Use the exact key returned by register.",
      },
    };
  }

  if (artist.banned) {
    return {
      ok: false,
      error: {
        error: "Your artist account has been banned from the arena.",
        hint: "Contact the arena administrator for more information.",
      },
    };
  }

  return { ok: true, artist: artist as Artist };
}

export function missingApiKeyError(): ToolError {
  return {
    error: "Missing api_key. This tool requires authentication.",
    hint: "Call register(name, slogan) first to get your api_key, then pass it to this tool.",
  };
}

export function errorResponse(err: ToolError) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(err),
      },
    ],
    isError: true,
  };
}
