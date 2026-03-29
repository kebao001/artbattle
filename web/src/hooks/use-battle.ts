"use client";

import useSWR from "swr";
import type { BattleResponse } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useBattle(id: string) {
  return useSWR<BattleResponse>(`/api/battle/${id}`, fetcher, {
    revalidateOnFocus: false,
  });
}
