"use client";

const HEX = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

const SKILLS = [
  { label: "Composition", value: 0.85 },
  { label: "Color", value: 0.92 },
  { label: "Concept", value: 0.78 },
  { label: "Speed", value: 0.65 },
  { label: "Technical", value: 0.88 },
];

const BADGES = [
  { name: "10 Win Streak", icon: "🔥", color: "#f97316" },
  { name: "Master Colorist", icon: "🎨", color: "#a78bfa" },
  { name: "Spring Champion", icon: "🌸", color: "#f472b6" },
  { name: "Speed Demon", icon: "⚡", color: "#fbbf24" },
  { name: "Concept Artist", icon: "💡", color: "#22d3ee" },
  { name: "100 Battles", icon: "⚔️", color: "#4ade80" },
  { name: "Crowd Favorite", icon: "❤️", color: "#f87171" },
  { name: "Night Owl", icon: "🦉", color: "#818cf8" },
  { name: "Rising Star", icon: "⭐", color: "#fbbf24" },
];

function RadarChart() {
  const cx = 100, cy = 100, maxR = 60;
  const angles = SKILLS.map((_, i) => (i * 2 * Math.PI) / SKILLS.length - Math.PI / 2);
  const pt = (a: number, r: number) => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  const dataPoints = SKILLS.map((s, i) => pt(angles[i], maxR * s.value));

  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[180px] mx-auto my-3">
      {[0.25, 0.5, 0.75, 1].map((lvl, li) => (
        <polygon key={li} points={angles.map(a => { const p = pt(a, maxR * lvl); return `${p.x},${p.y}`; }).join(" ")} fill="none" stroke="rgba(167,139,250,0.12)" strokeWidth="0.8" />
      ))}
      {angles.map((angle, i) => { const end = pt(angle, maxR); return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="rgba(167,139,250,0.1)" strokeWidth="0.8" />; })}
      <polygon points={dataPoints.map(p => `${p.x},${p.y}`).join(" ")} fill="rgba(167,139,250,0.18)" stroke="#a78bfa" strokeWidth="1.5" />
      {dataPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#a78bfa" />)}
      {SKILLS.map((skill, i) => { const lp = pt(angles[i], maxR + 20); return <text key={i} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="#666">{skill.label}</text>; })}
    </svg>
  );
}

export function LeftPanel() {
  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Rank Status */}
      <div className="bg-white/[0.02] border border-white/[0.05] rounded-[14px] p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-arena-muted mb-4">
          Marina Valentine · Rank Status
        </p>

        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-xs font-black text-[#1e293b] shrink-0" style={{ background: "linear-gradient(135deg, #e2e8f0, #94a3b8)" }}>
            PLAT
          </div>
          <div>
            <div className="text-lg font-black text-arena-text">Platinum</div>
            <div className="text-sm text-arena-muted">420W · 89L · 82.5% WR</div>
          </div>
        </div>

        <RadarChart />

        <div className="flex flex-col gap-2.5 mt-2">
          {SKILLS.map((skill) => (
            <div key={skill.label} className="flex items-center gap-3">
              <span className="text-sm text-arena-muted w-[90px] shrink-0">{skill.label}</span>
              <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-arena-accent to-arena-cyan" style={{ width: `${skill.value * 100}%` }} />
              </div>
              <span className="text-sm text-arena-muted w-7 text-right tabular-nums">{Math.round(skill.value * 100)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Battle Badges */}
      <div className="bg-white/[0.02] border border-white/[0.05] rounded-[14px] p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-arena-muted mb-4">
          Battle Badges
        </p>
        <div className="grid grid-cols-3 gap-4">
          {BADGES.map((badge) => (
            <div key={badge.name} className="flex flex-col items-center gap-2 group cursor-pointer">
              <div className="w-14 h-14 flex items-center justify-center text-2xl transition-transform group-hover:scale-110" style={{ clipPath: HEX, background: `${badge.color}22` }}>
                {badge.icon}
              </div>
              <span className="text-xs text-center leading-tight text-[#666] group-hover:text-arena-accent transition-colors line-clamp-2">
                {badge.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
