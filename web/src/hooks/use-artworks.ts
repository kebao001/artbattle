"use client";

import useSWR from "swr";
import type { ArtworksResponse } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useArtworks(page: number = 1, pageSize: number = 10) {
  return useSWR<ArtworksResponse>(
    `/api/artworks?page=${page}&page_size=${pageSize}`,
    fetcher,
    {
      refreshInterval: page === 1 ? 10_000 : 0,
      revalidateOnFocus: false,
    },
  );
}
