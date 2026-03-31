"use client";

import useSWR from "swr";
import type { LiveAgentsResponse } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useLiveAgents(page: number = 1, pageSize: number = 50) {
  return useSWR<LiveAgentsResponse>(
    `/api/live-agents?page=${page}&page_size=${pageSize}`,
    fetcher,
    {
      refreshInterval: 30_000,
      revalidateOnFocus: false,
    },
  );
}
