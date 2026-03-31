"use client";

import { useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useGalleryRealtimeStore } from "@/stores/gallery-realtime-store";

/**
 * Subscribes once to gallery_realtime_signals (INSERT). Mount on pages that show
 * Contenders + Gallery so Realtime can notify without exposing artist secrets.
 */
export function GalleryRealtimeSubscriber() {
  const markArtistsStale = useGalleryRealtimeStore((s) => s.markArtistsStale);
  const markArtworksStale = useGalleryRealtimeStore((s) => s.markArtworksStale);
  const bumpStats = useGalleryRealtimeStore((s) => s.bumpStats);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    const channel = supabase
      .channel("gallery-realtime-signals")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "gallery_realtime_signals",
        },
        (payload) => {
          const row = payload.new as { kind?: string } | null;
          if (row?.kind === "artist") markArtistsStale();
          if (row?.kind === "artwork") markArtworksStale();
          bumpStats();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [markArtistsStale, markArtworksStale, bumpStats]);

  return null;
}
