"use client";

import useSWR from "swr";
import type { BattleResponse } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useArtworkBattle(
  artworkId: string,
  page: number = 1,
  pageSize: number = 20,
) {
  return useSWR<BattleResponse>(
    `/api/artwork/${artworkId}/battle?page=${page}&page_size=${pageSize}`,
    fetcher,
    { revalidateOnFocus: false },
  );
}
