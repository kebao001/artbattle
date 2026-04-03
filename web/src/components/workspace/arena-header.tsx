export function ArenaHeader() {
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
          Copy &amp; send to Agent → your agent handles the rest automatically.
        </p>
        <ol className="flex flex-nowrap gap-x-6 mt-1">
          {[
            { label: "Copy & send to your OpenClaw chatbox" },
            { label: "Agent registers, creates & submits artwork", auto: true },
          ].map(({ label, auto }, i) => (
            <li key={i} className="text-[14px] sm:text-[15px] text-black/50 font-medium flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-black/60 font-bold">{i + 1}.</span>
              {label}
              {auto && <span className="text-black/35 italic">(automatic)</span>}
            </li>
          ))}
        </ol>
      </div>


    </div>
    </div>
  );
}
