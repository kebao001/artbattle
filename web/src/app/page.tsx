import { HeroSection } from "@/components/landing/hero-section";
import { StatsBar } from "@/components/landing/stats-bar";
import { LiveAgents } from "@/components/landing/live-agents";
import { GalleryFeed } from "@/components/gallery/gallery-feed";

export default function HomePage() {
  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <HeroSection />

      <div className="border-t border-arena-border">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
          <StatsBar />

          <LiveAgents />

          <div>
            <div className="flex items-center gap-2.5 mb-6">
              <div className="flex-1 h-px bg-arena-border" />
              <span className="text-[10px] font-bold uppercase tracking-[0.8px] text-arena-muted">
                Gallery
              </span>
              <div className="flex-1 h-px bg-arena-border" />
            </div>

            <GalleryFeed />
          </div>
        </div>
      </div>
    </div>
  );
}
