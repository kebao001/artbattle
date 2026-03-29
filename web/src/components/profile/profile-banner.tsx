import { ExternalLink } from "lucide-react";

const HEX = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

const STATS = [
  { label: "Wins", value: "420" },
  { label: "Rank", value: "Platinum" },
  { label: "Level", value: "24" },
  { label: "Region", value: "NA" },
];

const SOCIALS = ["Twitter", "Behance", "ArtStation"];

export function ProfileBanner() {
  return (
    <div className="shrink-0">
      {/* Banner */}
      <div className="h-[180px] relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #1a0535 0%, #0a1535 50%, #051a1a 100%)" }} />
        <div className="absolute left-[22%] top-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-arena-accent/25 blur-3xl" />
        <div className="absolute right-[22%] top-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-arena-cyan/20 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "repeating-linear-gradient(55deg, transparent, transparent 30px, rgba(167,139,250,0.5) 30px, rgba(167,139,250,0.5) 31px)" }} />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[80px] font-black text-white/[0.03] tracking-tight select-none">VS</div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-arena-bg/95" />
      </div>

      {/* Profile info */}
      <div className="flex flex-col items-center -mt-14 pb-6 px-4">
        {/* Hex avatar */}
        <div className="relative mb-3">
          <div className="w-[96px] h-[96px] flex items-center justify-center" style={{ clipPath: HEX, background: "linear-gradient(135deg, #a78bfa, #22d3ee)" }}>
            <div className="w-[88px] h-[88px] flex items-center justify-center text-2xl font-black text-arena-accent bg-[#130a2a]" style={{ clipPath: HEX }}>
              MV
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-[8px] font-black text-[#1a1a1a] ring-2 ring-arena-bg" style={{ background: "linear-gradient(135deg, #e2e8f0, #94a3b8)" }}>
            PT
          </div>
        </div>

        <h2 className="text-2xl font-black text-arena-text leading-none mb-1.5">
          Marina Valentine
        </h2>
        <p className="text-base text-arena-muted mb-5">
          @marina_v · AI Artist · Region: NA
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-10 mb-5">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-black text-arena-text leading-none">{s.value}</div>
              <div className="text-xs text-arena-muted uppercase tracking-wide mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 mb-4">
          <button className="px-5 py-2.5 rounded-lg bg-arena-cyan/10 border border-arena-cyan/25 text-sm font-bold text-arena-cyan hover:bg-arena-cyan/20 transition-all">
            View Artwork Portfolio
          </button>
          <button className="px-5 py-2.5 rounded-lg bg-arena-accent/10 border border-arena-accent/25 text-sm font-bold text-arena-accent hover:bg-arena-accent/20 transition-all">
            Send Battle Challenge
          </button>
        </div>

        {/* Social links */}
        <div className="flex items-center gap-5">
          {SOCIALS.map((s) => (
            <a key={s} href="#" className="flex items-center gap-1 text-sm text-[#555] hover:text-arena-accent transition-colors">
              {s} <ExternalLink className="w-3 h-3" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
