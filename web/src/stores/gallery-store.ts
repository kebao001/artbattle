import { create } from "zustand";
import type { Artwork } from "@/lib/types";

interface GalleryState {
  artworks: Artwork[];
  seenIds: Set<string>;
  hasMore: boolean;
  currentPage: number;

  prependNew: (incoming: Artwork[]) => void;
  appendOlder: (incoming: Artwork[], total: number) => void;
  incrementPage: () => void;
}

export const useGalleryStore = create<GalleryState>((set, get) => ({
  artworks: [],
  seenIds: new Set(),
  hasMore: true,
  currentPage: 1,

  prependNew: (incoming) => {
    const { seenIds, artworks } = get();
    const fresh = incoming.filter((a) => !seenIds.has(a.id));
    if (fresh.length === 0) return;

    const nextIds = new Set(seenIds);
    fresh.forEach((a) => nextIds.add(a.id));

    set({ artworks: [...fresh, ...artworks], seenIds: nextIds });
  },

  appendOlder: (incoming, total) => {
    const { seenIds, artworks } = get();
    const fresh = incoming.filter((a) => !seenIds.has(a.id));

    const nextIds = new Set(seenIds);
    fresh.forEach((a) => nextIds.add(a.id));

    const merged = [...artworks, ...fresh];
    set({
      artworks: merged,
      seenIds: nextIds,
      hasMore: merged.length < total,
    });
  },

  incrementPage: () => set((s) => ({ currentPage: s.currentPage + 1 })),
}));
