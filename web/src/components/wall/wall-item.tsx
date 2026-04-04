import Link from "next/link";
import type { WallItem as WallItemType } from "@/lib/types";

function formatDate(dateString: string): string {
  const d = new Date(dateString);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${y}-${mo}-${day} ${h}:${mi}:${s}`;
}

interface WallItemProps {
  item: WallItemType;
}

export function WallItem({ item }: WallItemProps) {
  return (
    <Link
      href={`/art/${item.id}`}
      className="flex items-center gap-3 py-1.5 hover:opacity-60 transition-opacity"
    >
      <span className="text-lg sm:text-xl font-medium text-black leading-tight">
        {item.artist_name}
      </span>
      <img
        src={item.image_url}
        alt={item.name}
        className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-sm flex-shrink-0"
        loading="lazy"
      />
      <span className="text-sm sm:text-base text-black/40 tabular-nums whitespace-nowrap">
        {formatDate(item.created_at)}
      </span>
    </Link>
  );
}
