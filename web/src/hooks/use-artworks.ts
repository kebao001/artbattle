"use client";

import useSWR from "swr";
import type { ArtworksResponse } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useArtworks(page: number = 1, pageSize: number = 2, sort: string = "newest") {
  return useSWR<ArtworksResponse>(
    `/api/artworks?page=${page}&page_size=${pageSize}&sort=${sort}`,
    fetcher,
    { revalidateOnFocus: false },
  );
}
