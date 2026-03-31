"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationNavProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function PaginationNav({
  page,
  pageSize,
  total,
  onPageChange,
}: PaginationNavProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-1 pt-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={!hasPrev}
        className="w-9 h-9 flex items-center justify-center border-2 border-black/15 hover:border-black disabled:opacity-25 disabled:cursor-not-allowed transition-[border-color] duration-200"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pageRange(page, totalPages).map((p, i) =>
        p === "..." ? (
          <span
            key={`ellipsis-${i}`}
            className="w-9 h-9 flex items-center justify-center text-black/40 text-sm font-bold select-none"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            className={`w-9 h-9 flex items-center justify-center border-2 text-sm font-black transition-[border-color,background-color,color] duration-200 ${
              p === page
                ? "bg-black text-[#f3efef] border-black"
                : "border-black/15 hover:border-black"
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNext}
        className="w-9 h-9 flex items-center justify-center border-2 border-black/15 hover:border-black disabled:opacity-25 disabled:cursor-not-allowed transition-[border-color] duration-200"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

const MAX_PAGE_SLOTS = 8;

/** At most eight page slots between prev/next; middle gap uses ellipsis when needed. */
function pageRange(current: number, total: number): (number | "...")[] {
  if (total <= MAX_PAGE_SLOTS) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  if (current <= 6) {
    return [1, 2, 3, 4, 5, 6, "...", total];
  }

  if (current >= total - 5) {
    return [
      1,
      "...",
      total - 5,
      total - 4,
      total - 3,
      total - 2,
      total - 1,
      total,
    ];
  }

  return [
    1,
    "...",
    current - 2,
    current - 1,
    current,
    current + 1,
    "...",
    total,
  ];
}
