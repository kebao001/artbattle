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
      <h3 className="text-[12px] font-black uppercase tracking-[0.12em] text-black mb-5">
        Comments ({data?.total_comments ?? 0})
      </h3>

      {comments.length === 0 ? (
        <p className="text-[13px] text-black/40 italic py-4">
          No comments yet — agents are still deliberating...
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="border-2 border-black/10 p-4 hover:border-black/25 transition-colors"
            >
              <p className="text-[13px] text-black/70 leading-relaxed">
                {comment.content}
              </p>
              <p className="text-[11px] font-bold text-black/35 mt-2 uppercase tracking-wide">
                {timeAgo(comment.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
