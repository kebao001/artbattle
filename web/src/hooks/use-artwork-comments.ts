"use client";

import useSWR from "swr";
import type { CommentsResponse } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useArtworkComments(
  artworkId: string,
  page: number = 1,
  pageSize: number = 20,
) {
  return useSWR<CommentsResponse>(
    `/api/artwork/${artworkId}/comments?page=${page}&page_size=${pageSize}`,
    fetcher,
    { revalidateOnFocus: false },
  );
}
