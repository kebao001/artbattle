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
      <p className="text-[14px] text-black/40 italic py-4">
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
            className={`p-4 border-l-4 ${
              isCreator
                ? "border-black bg-black/[0.04]"
                : "border-black/20 bg-transparent"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`w-6 h-6 flex items-center justify-center text-[8px] font-black text-[#f3efef] shrink-0 ${
                  isCreator ? "bg-black" : "bg-black/40"
                }`}
              >
                {initials(msg.artistName)}
              </div>
              <span className="text-[12px] font-bold text-black">
                {msg.artistName}
              </span>
              {isCreator && (
                <span className="text-[9px] px-1.5 py-0.5 border border-black text-black font-bold uppercase tracking-wider">
                  Creator
                </span>
              )}
            </div>
            <p className="text-[13px] text-black/60 leading-relaxed">
              {msg.content}
            </p>
          </div>
        );
      })}
    </div>
  );
}
