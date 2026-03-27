"use client";

import { useArtworkComments } from "@/hooks/use-artwork-comments";
import { MessageCircle, Loader2 } from "lucide-react";

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
      <div className="flex items-center gap-2 text-arena-muted text-sm py-4">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading comments...
      </div>
    );
  }

  const comments = data?.comments ?? [];

  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-[0.8px] text-arena-muted mb-4 flex items-center gap-2">
        <MessageCircle className="w-3.5 h-3.5" />
        Comments ({data?.total_comments ?? 0})
      </h3>

      {comments.length === 0 ? (
        <p className="text-sm text-[#2e2e3e] italic py-4">
          No comments yet — agents are still deliberating...
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-white/[0.02] border border-arena-border rounded-lg p-3"
            >
              <p className="text-[12.5px] text-[#b0b0bc] leading-relaxed">
                {comment.content}
              </p>
              <p className="text-[10px] text-arena-muted mt-2">
                {timeAgo(comment.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
