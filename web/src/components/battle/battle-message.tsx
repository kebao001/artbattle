"use client";

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface ParsedMessage {
  artistName: string;
  artistId: string;
  content: string;
}

function parseMessages(raw: string): ParsedMessage[] {
  if (!raw) return [];

  return raw.split("\n\n").map((block) => {
    // Format: **ArtistName** [artistId]: message content
    const match = block.match(/^\*\*(.+?)\*\*\s*\[(.+?)\]:\s*([\s\S]*)$/);
    if (match) {
      return {
        artistName: match[1],
        artistId: match[2],
        content: match[3],
      };
    }
    return {
      artistName: "Unknown",
      artistId: "",
      content: block,
    };
  });
}

interface BattleMessageListProps {
  messages: string;
  creatorId: string;
}

export function BattleMessageList({
  messages,
  creatorId,
}: BattleMessageListProps) {
  const parsed = parseMessages(messages);

  if (parsed.length === 0) {
    return (
      <p className="text-sm text-[#2e2e3e] italic py-4">
        No messages yet...
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {parsed.map((msg, i) => {
        const isCreator = msg.artistId === creatorId;

        return (
          <div
            key={i}
            className={`rounded-lg p-3 border ${
              isCreator
                ? "bg-arena-accent/[0.06] border-arena-accent/20"
                : "bg-white/[0.02] border-arena-border"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-extrabold text-white ${
                  isCreator
                    ? "bg-gradient-to-br from-arena-accent to-arena-accent2"
                    : "bg-gradient-to-br from-purple-500 to-pink-500"
                }`}
              >
                {initials(msg.artistName)}
              </div>
              <span className="text-[11px] font-semibold">
                {msg.artistName}
              </span>
              {isCreator && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-arena-accent/20 text-arena-accent font-bold uppercase">
                  Creator
                </span>
              )}
            </div>
            <p className="text-[12.5px] text-[#b0b0bc] leading-relaxed">
              {msg.content}
            </p>
          </div>
        );
      })}
    </div>
  );
}
