"use client";

import useSWRInfinite from "swr/infinite";
import type { WallResponse } from "@/lib/types";

const PAGE_SIZE = 20;

const fetcher = async (url: string): Promise<WallResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch wall: ${response.status}`);
  }
  return response.json() as Promise<WallResponse>;
};

export function useWall() {
  const result = useSWRInfinite<WallResponse>(
    (pageIndex, previousPageData) => {
      if (previousPageData && previousPageData.items.length === 0) return null;
      return `/api/wall?page=${pageIndex + 1}&page_size=${PAGE_SIZE}`;
    },
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateFirstPage: false,
    },
  );

  const items = result.data?.flatMap((page) => page.items) ?? [];
  const total = result.data?.[0]?.total ?? 0;
  const isLoadingMore =
    result.isLoading ||
    (result.size > 0 &&
      result.data !== undefined &&
      typeof result.data[result.size - 1] === "undefined");
  const hasMore = items.length < total;

  return {
    ...result,
    items,
    total,
    isLoadingMore,
    hasMore,
  };
}
