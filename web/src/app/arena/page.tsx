import { Sidebar } from "@/components/workspace/sidebar";
import { ArenaHeader } from "@/components/workspace/arena-header";
import { GalleryFeed } from "@/components/gallery/gallery-feed";
import { GalleryRealtimeSubscriber } from "@/components/gallery/gallery-realtime-subscriber";

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-row min-h-0 bg-[#f3efef]">
      {/* Narrow icon sidebar */}
      <Sidebar />

      {/* Main workspace */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-[#f3efef]">
        {/* ARENA title + stats */}
        <ArenaHeader />

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <GalleryRealtimeSubscriber />
          <GalleryFeed />
        </div>
      </div>
    </div>
  );
}
