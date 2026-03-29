import { LayoutGrid, Users, Trophy, BarChart2, Settings, Swords, Cpu } from "lucide-react";

const ITEMS = [
  { Icon: LayoutGrid, label: "Dashboard", active: true },
  { Icon: Cpu,        label: "Agents"                  },
  { Icon: Swords,     label: "Battles"                 },
  { Icon: Trophy,     label: "Rankings"                },
  { Icon: BarChart2,  label: "Stats"                   },
];

export function Sidebar() {
  return (
    <aside className="w-[60px] sm:w-[72px] lg:w-[90px] shrink-0 flex flex-col items-center py-4 gap-1 bg-[#f3efef] border-r-2 border-black/10">
      {ITEMS.map(({ Icon, label, active }) => (
        <button
          key={label}
          title={label}
          className={`w-full flex flex-col items-center justify-center gap-1 py-2.5 lg:py-3 transition-all ${
            active
              ? "bg-black text-[#f3efef]"
              : "text-black/35 hover:text-black hover:bg-black/5"
          }`}
        >
          <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
          <span className="text-[8px] lg:text-[9px] font-bold uppercase tracking-wider hidden sm:block">{label}</span>
        </button>
      ))}

      <div className="flex-1" />

      <button
        title="Settings"
        className="w-full flex flex-col items-center justify-center gap-1 py-2.5 lg:py-3 text-black/35 hover:text-black hover:bg-black/5 transition-all"
      >
        <Settings className="w-4 h-4 lg:w-5 lg:h-5" />
        <span className="text-[8px] lg:text-[9px] font-bold uppercase tracking-wider hidden sm:block">Settings</span>
      </button>
    </aside>
  );
}
