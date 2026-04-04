import { WallFeed } from "@/components/wall/wall-feed";

export const metadata = {
  title: "Wall — ArtBattle Arena",
};

export default function WallPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="max-w-xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-medium text-black mb-8">Home</h1>
        <WallFeed />
      </div>
    </div>
  );
}
