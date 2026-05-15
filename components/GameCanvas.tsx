"use client";

export default function GameCanvas() {
  // Phase 1: 정적 SVG 골격만. Phase 3에서 Matter.js 연결.
  return (
    <div className="relative flex h-full w-full items-center justify-center p-6">
      <div
        className="relative h-full max-h-[90vh] overflow-hidden rounded-lg border border-rink-border bg-gradient-to-b from-[#0d1424] via-[#0a1020] to-[#050810] rink-pattern shadow-2xl"
        style={{ aspectRatio: "9 / 16", width: "auto" }}
      >
        {/* 상단 골 라인 */}
        <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-transparent via-neon-red/60 to-transparent" />

        {/* 좌우 보드 */}
        <div className="absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b from-rink-border via-rink-line to-rink-border" />
        <div className="absolute bottom-0 right-0 top-0 w-1 bg-gradient-to-b from-rink-border via-rink-line to-rink-border" />

        {/* 페이스오프 서클 (장식) */}
        <svg
          className="absolute inset-0 h-full w-full opacity-40"
          viewBox="0 0 360 640"
          fill="none"
        >
          <circle cx="180" cy="120" r="40" stroke="#22d3ee" strokeWidth="0.5" strokeOpacity="0.3" />
          <circle cx="180" cy="120" r="4" fill="#22d3ee" fillOpacity="0.4" />
          <circle cx="100" cy="320" r="30" stroke="#22d3ee" strokeWidth="0.5" strokeOpacity="0.2" />
          <circle cx="260" cy="320" r="30" stroke="#22d3ee" strokeWidth="0.5" strokeOpacity="0.2" />
          <circle cx="180" cy="540" r="40" stroke="#e879f9" strokeWidth="0.5" strokeOpacity="0.3" />
          <circle cx="180" cy="540" r="4" fill="#e879f9" fillOpacity="0.4" />
          <line x1="0" y1="320" x2="360" y2="320" stroke="#7dd3fc" strokeWidth="0.5" strokeOpacity="0.15" strokeDasharray="4 4" />
        </svg>

        {/* 중앙 안내 텍스트 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-rink-surface/60 ring-2 ring-neon-cyan/30 backdrop-blur">
            <span className="text-3xl">🏒</span>
          </div>
          <p
            className="text-2xl font-bold tracking-widest text-neon-cyan/80"
            style={{ fontFamily: "Bebas Neue, sans-serif" }}
          >
            ICE RINK
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.3em] text-gray-500">
            Awaiting Pucks
          </p>
          <p className="mt-6 max-w-[200px] text-xs leading-relaxed text-gray-600">
            Phase 3에서 Matter.js 물리엔진 연결 후<br />
            퍽 낙하 시뮬레이션 시작
          </p>
        </div>

        {/* 하단 골인존 */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-neon-magenta/20 to-transparent">
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-neon-magenta to-transparent" />
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest text-neon-magenta/80">
            Goal Zone
          </div>
        </div>
      </div>
    </div>
  );
}
