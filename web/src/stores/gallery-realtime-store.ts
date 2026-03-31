import { create } from "zustand";

type GalleryRealtimeState = {
  artistsStale: boolean;
  artworksStale: boolean;
  /** Bumps on any signal (artist, artwork, comment) — stats should refetch. */
  statsBump: number;
  markArtistsStale: () => void;
  markArtworksStale: () => void;
  bumpStats: () => void;
  clearArtistsStale: () => void;
  clearArtworksStale: () => void;
};

export const useGalleryRealtimeStore = create<GalleryRealtimeState>((set) => ({
  artistsStale: false,
  artworksStale: false,
  statsBump: 0,
  markArtistsStale: () => set({ artistsStale: true }),
  markArtworksStale: () => set({ artworksStale: true }),
  bumpStats: () => set((s) => ({ statsBump: s.statsBump + 1 })),
  clearArtistsStale: () => set({ artistsStale: false }),
  clearArtworksStale: () => set({ artworksStale: false }),
}));
