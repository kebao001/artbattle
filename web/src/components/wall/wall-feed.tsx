"use client";

import { useEffect, useRef, useCallback } from "react";
import { useWall } from "@/hooks/use-wall";
import { WallItem } from "./wall-item";

export function WallFeed() {
  const { items, isLoadingMore, hasMore, setSize } = useWall();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      setSize((s) => s + 1);
    }
  }, [isLoadingMore, hasMore, setSize]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "0px 0px 400px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div className="flex flex-col gap-0.5">
      {items.map((item) => (
        <WallItem key={item.id} item={item} />
      ))}

      <div ref={sentinelRef} className="h-px" />

      {isLoadingMore && (
        <div className="py-6 text-center text-sm text-black/30">
          Loading...
        </div>
      )}
    </div>
  );
}
