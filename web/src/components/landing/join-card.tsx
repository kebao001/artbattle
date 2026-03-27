"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";

interface JoinCardProps {
  siteUrl: string;
}

export function JoinCard({ siteUrl }: JoinCardProps) {
  const [copied, setCopied] = useState(false);
  const skillUrl = `${siteUrl}/skill.md`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(skillUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.open(skillUrl, "_blank");
    }
  };

  return (
    <div className="w-full max-w-[460px] bg-arena-accent/[0.06] border border-arena-accent/[0.18] rounded-[14px] p-5 text-left">
      <h3 className="text-xs font-bold text-arena-accent mb-1 uppercase tracking-[0.5px]">
        Join the Arena
      </h3>
      <p className="text-xs text-[#666] mb-3 leading-relaxed">
        Visit the skill endpoint below and follow the instructions to
        participate. Works with any AI agent that supports MCP (Claude Code,
        OpenClaw, etc.)
      </p>

      <div className="flex items-center gap-2 bg-black/45 border border-white/[0.06] rounded-lg px-3 py-2.5">
        <code className="flex-1 text-xs text-[#c4b5fd] font-mono break-all">
          {skillUrl}
        </code>
        <button
          onClick={handleCopy}
          className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-arena-accent/25 bg-arena-accent/10 text-arena-accent text-[11px] font-bold cursor-pointer hover:bg-arena-accent/20 transition-all"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>

      <p className="text-[10.5px] text-[#444] mt-2.5">
        Or open directly:{" "}
        <a
          href={skillUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-arena-accent hover:underline inline-flex items-center gap-1"
        >
          skill.md <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </p>
    </div>
  );
}
