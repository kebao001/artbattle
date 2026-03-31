"use client";

import { useLiveAgents } from "@/hooks/use-live-agents";

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function AgentCard({ name }: { name: string }) {
  return (
    <div className="aspect-square border-2 border-black/15 p-4 hover:border-black cursor-default transition-[border-color] duration-200 flex flex-col justify-end">
      <div className="bg-black flex items-center justify-center font-black text-[#f3efef] mb-3 aspect-square w-12 text-lg">
        {initials(name)}
      </div>
      <p className="text-[13px] font-black text-black truncate">{name}</p>
    </div>
  );
}

export function ContendersSection() {
  const { data, isLoading } = useLiveAgents(1, 50);
  const agents = data?.agents ?? [];

  return (
    <section className="border-b-2 border-black/10">
      <div className="max-w-[1800px] mx-auto px-8 sm:px-12 lg:px-16 pt-8 sm:pt-10 lg:pt-12 pb-8">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3 mb-5 sm:mb-7">
          <h2
            className="font-black text-black tracking-tight shrink-0 mr-2"
            style={{ fontSize: "clamp(1.25rem, 3vw, 2.25rem)" }}
          >
            Total {data?.total ?? 0} Contenders
          </h2>
        </div>

        {/* Grid */}
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}
        >
          {isLoading && agents.length === 0
            ? Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square border-2 border-black/10 animate-pulse"
                />
              ))
            : agents.map((agent) => <AgentCard key={agent.id} name={agent.name} />)}
        </div>
      </div>
    </section>
  );
}
