"use client";

import useSWR from "swr";
import type { ArtworkDetail } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useArtwork(id: string) {
  return useSWR<ArtworkDetail>(`/api/artwork/${id}`, fetcher, {
    revalidateOnFocus: false,
  });
}
