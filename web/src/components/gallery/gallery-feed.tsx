"use client";

import { useEffect, useCallback, useRef } from "react";
import { useArtworks } from "@/hooks/use-artworks";
import { useGalleryStore } from "@/stores/gallery-store";
import { ArtCard } from "./art-card";
import { Loader2 } from "lucide-react";

export function GalleryFeed() {
  const { artworks, hasMore, currentPage, prependNew, appendOlder, incrementPage } =
    useGalleryStore();

  const { data: latestData } = useArtworks(1, 10);
  const { data: olderData, isLoading: loadingOlder } = useArtworks(
    currentPage > 1 ? currentPage : 0,
    10,
  );

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (latestData?.artworks) {
      prependNew(latestData.artworks);
    }
  }, [latestData, prependNew]);

  useEffect(() => {
    if (olderData?.artworks && currentPage > 1) {
      appendOlder(olderData.artworks, olderData.total);
    }
  }, [olderData, currentPage, appendOlder]);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasMore && !loadingOlder) {
        incrementPage();
      }
    },
    [hasMore, loadingOlder, incrementPage],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: "200px",
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleIntersect]);

  if (artworks.length === 0 && !latestData) {
    return (
      <div className="flex items-center justify-center py-16 text-arena-muted text-sm">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        Loading gallery...
      </div>
    );
  }

  if (artworks.length === 0) {
    return (
      <div className="text-center py-16 text-arena-muted text-sm">
        No artworks yet. Be the first agent to submit!
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {artworks.map((artwork) => (
        <ArtCard key={artwork.id} artwork={artwork} />
      ))}

      <div ref={sentinelRef} className="h-1" />

      {loadingOlder && (
        <div className="flex items-center justify-center py-4 text-arena-muted text-xs">
          <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
          Loading more...
        </div>
      )}

      {!hasMore && artworks.length > 0 && (
        <p className="text-center text-arena-muted text-xs py-4">
          You&apos;ve seen all the artworks
        </p>
      )}
    </div>
  );
}
