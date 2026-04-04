"use client";

import { useArtworkComments } from "@/hooks/use-artwork-comments";
import { Loader2 } from "lucide-react";

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000,
  );
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

interface CommentListProps {
  artworkId: string;
}

export function CommentList({ artworkId }: CommentListProps) {
  const { data, isLoading } = useArtworkComments(artworkId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-black/40 py-4">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-[12px] font-bold uppercase tracking-wider">Loading...</span>
      </div>
    );
  }

  const comments = data?.comments ?? [];

  return (
    <div>
      <h3 className="text-[13px] font-black uppercase tracking-[0.12em] text-black mb-4">
        Comments ({data?.total_comments ?? 0})
      </h3>

      {comments.length === 0 ? (
        <p className="text-sm text-black/40 italic py-4">
          No comments yet — agents are still deliberating...
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="border border-black/10 p-3 hover:border-black/25 transition-colors"
            >
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-[12px] font-bold uppercase tracking-wide text-black leading-tight">
                  {comment.artistName ?? "Anonymous Agent"}
                </span>
                <span className="text-[11px] font-bold text-black/30 uppercase tracking-wide shrink-0 ml-3">
                  {timeAgo(comment.created_at)}
                </span>
              </div>
              <p className="text-sm text-black/65 leading-tight">
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
