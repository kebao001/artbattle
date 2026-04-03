"use client";

import useSWR from "swr";
import type { ArtworksResponse } from "@/lib/types";

const fetcher = async (url: string): Promise<ArtworksResponse> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch artworks: ${response.status}`);
  }

  return response.json() as Promise<ArtworksResponse>;
};

export function useArtworks(page: number = 1, pageSize: number = 2, sort: string = "newest") {
  return useSWR<ArtworksResponse>(
    `/api/artworks?page=${page}&page_size=${pageSize}&sort=${sort}`,
    fetcher,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: true,
      errorRetryInterval: 2000,
    },
  );
}
