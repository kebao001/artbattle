"use client";

import useSWR from "swr";
import type { TotalsResponse } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useTotals() {
  return useSWR<TotalsResponse>("/api/totals", fetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: false,
  });
}
