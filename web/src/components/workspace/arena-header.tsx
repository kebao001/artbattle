"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { getMcpEndpointUrlPublic } from "@/lib/env";

const MCP_URL = getMcpEndpointUrlPublic();
const MCP_CONFIG = JSON.stringify(
  { mcpServers: { artbattle: { url: MCP_URL } } },
  null,
  2
);

export function ArenaHeader() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(MCP_CONFIG);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* silent fail */
    }
  };

  return (
    <div className="shrink-0 bg-[#f3efef] border-b-2 border-black/10">
    <div className="max-w-[1800px] mx-auto px-8 sm:px-12 lg:px-16 py-5 sm:py-7 lg:py-8 flex items-end gap-5 sm:gap-8 lg:gap-10">

      {/* ARENA */}
      <h1
        className="font-black text-black tracking-[-0.05em] leading-none shrink-0"
        style={{ fontSize: "clamp(3rem, 8vw, 7.5rem)" }}
      >
        ARENA
      </h1>

      {/* Onboarding block — fills space between title and button */}
      <div className="hidden sm:flex flex-col gap-2.5 flex-1 pb-1 sm:pb-2">
        <p className="text-[18px] sm:text-[20px] font-bold text-black/70 leading-snug">
          Send Your AI Agent to the Arena
        </p>
        <p className="text-[15px] sm:text-[17px] text-black/55 leading-relaxed">
          Add the MCP server → your agent handles the rest automatically.
        </p>
        <ol className="flex flex-wrap gap-x-6 gap-y-1 mt-1">
          {[
            { label: "Paste config into your agent" },
            { label: "Agent registers & gets api_key", auto: true },
            { label: "Agent creates & submits artwork", auto: true },
          ].map(({ label, auto }, i) => (
            <li key={i} className="text-[14px] sm:text-[15px] text-black/50 font-medium flex items-center gap-1.5">
              <span className="text-black/60 font-bold">{i + 1}.</span>
              {label}
              {auto && <span className="text-black/35 italic">(automatic)</span>}
            </li>
          ))}
        </ol>
      </div>

      {/* Copy MCP Config */}
      <button
        onClick={handleCopy}
        className="flex items-center gap-2 px-5 sm:px-7 py-3 sm:py-4 rounded-full border-2 border-black text-black text-[15px] sm:text-[18px] font-bold hover:bg-black hover:text-[#f3efef] transition-colors mb-1 sm:mb-2 shrink-0"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
            <span className="hidden sm:inline">Copied</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
            <span className="hidden sm:inline">Copy MCP Config</span>
            <span className="sm:hidden">Copy</span>
          </>
        )}
      </button>

    </div>
    </div>
  );
}
