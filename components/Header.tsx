export default function Header() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-rink-border bg-rink-surface/60 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neon-cyan/10 ring-1 ring-neon-cyan/40">
          <span className="text-lg">🏒</span>
        </div>
        <div>
          <h1
            className="text-xl font-bold leading-none tracking-wider text-neon-cyan"
            style={{ fontFamily: "Bebas Neue, sans-serif" }}
          >
            WEST HOCKEY MT 2026
          </h1>
          <p className="mt-1 text-[10px] uppercase tracking-widest text-gray-500">
            Puck Roulette
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span>Phase 5A · planck.js Engine</span>
        <div className="h-2 w-2 animate-pulse rounded-full bg-neon-green" />
      </div>
    </header>
  );
}
