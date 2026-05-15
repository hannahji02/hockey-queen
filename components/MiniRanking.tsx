"use client";

import { useState } from "react";

interface MiniRankingProps {
  participants: string[];
  mode: "first" | "last";
  onExit: () => void;
}

/**
 * 룰렛 풀스크린 모드용 사이드바
 * - 좁은 폭(120px)으로 캔버스 옆에 표시
 * - 현재 참가 인원 + 모드 + 종료 버튼
 * - Phase 5에서 실시간 순위 데이터 연동 예정
 */
export default function MiniRanking({
  participants,
  mode,
  onExit,
}: MiniRankingProps) {
  return (
    <aside className="flex h-full w-[140px] shrink-0 flex-col border-l border-rink-border bg-rink-surface/40 backdrop-blur">
      {/* 헤더 */}
      <div className="border-b border-rink-border p-3">
        <h2
          className="text-xs font-bold uppercase tracking-widest text-neon-magenta"
          style={{ fontFamily: "Bebas Neue, sans-serif" }}
        >
          LIVE
        </h2>
        <p className="mt-0.5 text-[9px] text-gray-500">
          {mode === "first" ? "1등 추첨" : "꼴등 추첨"}
        </p>
      </div>

      {/* 참가자 리스트 (실시간 순위는 Phase 5에서) */}
      <div className="flex-1 overflow-y-auto p-2">
        <p className="mb-2 text-[9px] uppercase tracking-widest text-gray-500">
          참가자 {participants.length}명
        </p>
        <ul className="space-y-0.5">
          {participants.map((name, idx) => (
            <li
              key={idx}
              className="flex items-center gap-1.5 rounded px-1.5 py-1 text-[10px] text-gray-300"
            >
              <span className="w-3 text-right text-gray-600">{idx + 1}</span>
              <span className="truncate">{name}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 종료 버튼 */}
      <div className="border-t border-rink-border p-2">
        <button
          onClick={onExit}
          className="w-full rounded-md border border-rink-line bg-rink-surface px-2 py-1.5 text-[10px] text-gray-400 transition hover:border-neon-red/50 hover:text-neon-red"
          title="ESC 키로도 종료 가능"
        >
          ✕ 종료 (ESC)
        </button>
      </div>
    </aside>
  );
}
