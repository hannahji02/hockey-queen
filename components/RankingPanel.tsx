"use client";

export default function RankingPanel() {
  // Phase 1: 정적 골격. Phase 5에서 실시간 순위 로직 연결.
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-rink-border p-4">
        <h2
          className="text-sm font-bold uppercase tracking-widest text-neon-magenta"
          style={{ fontFamily: "Bebas Neue, sans-serif" }}
        >
          Live Ranking
        </h2>
        <p className="mt-1 text-[10px] text-gray-500">실시간 도착 순위</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex h-full flex-col items-center justify-center text-center">
          <div className="mb-3 text-3xl opacity-30">📊</div>
          <p className="text-xs italic text-gray-600">
            게임 시작 시<br />
            순위가 표시됩니다
          </p>
        </div>
      </div>

      <div className="border-t border-rink-border p-4">
        <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500">
          <div className="flex flex-col items-center rounded bg-rink-surface/40 p-2">
            <span className="uppercase tracking-widest">1st</span>
            <span className="mt-1 text-neon-yellow">—</span>
          </div>
          <div className="flex flex-col items-center rounded bg-rink-surface/40 p-2">
            <span className="uppercase tracking-widest">Last</span>
            <span className="mt-1 text-neon-magenta">—</span>
          </div>
        </div>
      </div>
    </div>
  );
}
