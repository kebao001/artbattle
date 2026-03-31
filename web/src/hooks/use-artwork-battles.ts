"use client";

import useSWR from "swr";
import type { ArtworkBattlesResponse } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useArtworkBattles(artworkId: string) {
  return useSWR<ArtworkBattlesResponse>(
    `/api/artwork/${artworkId}/battles`,
    fetcher,
    { revalidateOnFocus: false },
  );
}
