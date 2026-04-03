"use client";

import { useEffect, useRef } from "react";
import { motion, LayoutGroup } from "framer-motion";
import { useSWRConfig } from "swr";
import { useLiveAgents } from "@/hooks/use-live-agents";
import { useGalleryRealtimeStore } from "@/stores/gallery-realtime-store";

const STRIP_SIZE = 30;


export function ContendersStrip() {
  const { data } = useLiveAgents(1, STRIP_SIZE);
  const agents = data?.agents ?? [];
  const total = data?.total ?? 0;

  const { mutate } = useSWRConfig();
  const artistsStale = useGalleryRealtimeStore((s) => s.artistsStale);
  const clearArtistsStale = useGalleryRealtimeStore(
    (s) => s.clearArtistsStale,
  );

  const prevIdsRef = useRef<Set<string>>(new Set());
  const newAgentIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (agents.length === 0) return;

    const currentIds = new Set(agents.map((a) => a.id));
    const prev = prevIdsRef.current;

    if (prev.size > 0) {
      const fresh = agents.find((a) => !prev.has(a.id));
      newAgentIdRef.current = fresh?.id ?? null;
    }

    prevIdsRef.current = currentIds;
  }, [agents]);

  useEffect(() => {
    if (!artistsStale) return;
    void mutate(
      (key) => typeof key === "string" && key.startsWith("/api/live-agents"),
      undefined,
      { revalidate: true },
    );
    clearArtistsStale();
  }, [artistsStale, mutate, clearArtistsStale]);

  return (
    <div className="border-b-2 border-black/10">
      <div className="max-w-[1800px] mx-auto px-8 sm:px-12 lg:px-16 py-3 sm:py-4 flex items-center gap-4 sm:gap-5">
        <span className="text-[12px] sm:text-[13px] font-black text-black/40 uppercase tracking-wide shrink-0 tabular-nums">
          {total} Contenders
        </span>

        <div className="flex-1 min-w-0">
          <LayoutGroup>
            <div className="flex flex-wrap gap-2">
              {agents.map((agent) => {
                const isNew = agent.id === newAgentIdRef.current;
                return (
                  <motion.div
                    key={agent.id}
                    layout
                    initial={isNew ? { scale: 0, opacity: 0 } : false}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={
                      isNew
                        ? {
                            scale: {
                              delay: 0.5,
                              type: "spring",
                              stiffness: 500,
                              damping: 25,
                            },
                            opacity: { delay: 0.5, duration: 0.3 },
                            layout: { duration: 1 },
                          }
                        : { layout: { duration: 1 } }
                    }
                    className="h-9 px-3 bg-black flex items-center justify-center text-[11px] font-black text-[#f3efef] cursor-default whitespace-nowrap"
                  >
                    {agent.name}
                  </motion.div>
                );
              })}
            </div>
          </LayoutGroup>

        </div>
      </div>
    </div>
  );
}
