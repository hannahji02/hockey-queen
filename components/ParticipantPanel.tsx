"use client";

import { HIDDEN_RANK_ADJUSTED } from "@/lib/roulette/excluded";

/**
 * Phase 1: 정적 UI 골격.
 * - 디폴트 참가자 15명 표시 (2열 그리드)
 * - 이름 3자 초과 시 자동 절단 표시
 * - 추가/제거 UI 미리 배치 (인터랙션은 Phase 2에서 활성화)
 *
 * 히든 로직 (lib/roulette/excluded.ts):
 * - HIDDEN_RANK_ADJUSTED 명단은 퍽으로 정상 생성 및 정상 낙하
 * - 단, 결승선 직전 도착 순위가 상/하위 25%에 진입 예정이면
 *   감속/가속 보정이 적용되어 중위 50% 안에 안착
 * - 외부 시각상 자연스러운 충돌/추진 연출로 위장
 * - UI 상으로는 일반 참가자와 완전히 동일하게 표시됨
 */

// 디폴트 참가자 명단 (실제 표시 시 3자 초과는 자동 절단)
const DEFAULT_PARTICIPANTS = [
  "강다연",
  "강소현",
  "김동현",
  "김석현",
  "김예은",
  "문인화",
  "안지용",
  "유광현",
  "이다연",
  "이태경",
  "장병주",
  "조우제",
  "지혜은",
  "최정학",
  "최준성",
];

// 이름 3자 절단 유틸
function truncateName(name: string): string {
  return name.length > 3 ? name.slice(0, 3) : name;
}

export default function ParticipantPanel() {
  const participants = DEFAULT_PARTICIPANTS.map(truncateName);

  return (
    <div className="flex h-full flex-col">
      {/* CSV 업로드 영역 */}
      <div className="border-b border-rink-border p-4">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500">
          CSV 업로드
        </label>
        <button
          disabled
          className="mt-2 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-md border border-dashed border-rink-line bg-rink-surface/40 px-3 py-3 text-xs text-gray-500 transition hover:border-neon-cyan/50 hover:text-gray-300"
        >
          <span className="text-base">📂</span>
          <span>파일 선택 (Phase 2)</span>
        </button>
      </div>

      {/* 참가자 리스트 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-3 flex items-center justify-between">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            참가자
          </label>
          <span className="text-[10px] text-neon-cyan">
            {participants.length}명
          </span>
        </div>

        {/* 2열 그리드 */}
        <ul className="grid grid-cols-2 gap-x-2 gap-y-1">
          {participants.map((name, idx) => (
            <li
              key={idx}
              className="group flex items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-rink-surface/60"
            >
              <input
                type="checkbox"
                defaultChecked
                disabled
                className="h-3.5 w-3.5 shrink-0 rounded border-rink-line"
              />
              <span className="truncate text-xs text-gray-200">{name}</span>
              {/* 제거 버튼 (Phase 2에서 활성화) */}
              <button
                disabled
                className="ml-auto cursor-not-allowed text-[10px] text-gray-700 opacity-0 transition group-hover:opacity-100 hover:text-neon-red"
                aria-label="제거"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>

        {/* 참가자 추가 input (Phase 2에서 활성화) */}
        <div className="mt-3 flex gap-1">
          <input
            type="text"
            placeholder="이름 추가 (3자)"
            maxLength={3}
            disabled
            className="flex-1 cursor-not-allowed rounded-md border border-rink-line bg-rink-surface/40 px-2 py-1.5 text-xs text-gray-400 placeholder:text-gray-600 disabled:opacity-60"
          />
          <button
            disabled
            className="cursor-not-allowed rounded-md border border-rink-line bg-rink-surface/40 px-3 py-1.5 text-xs text-gray-500 transition hover:border-neon-cyan/50 hover:text-neon-cyan"
          >
            +
          </button>
        </div>
      </div>

      {/* 모드 선택 */}
      <div className="border-t border-rink-border p-4">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500">
          당첨 모드
        </label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-rink-line bg-rink-surface/40 px-3 py-2 text-xs transition hover:border-neon-cyan/50">
            <input type="radio" name="mode" disabled />
            <span>1등</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-neon-cyan/40 bg-neon-cyan/5 px-3 py-2 text-xs transition">
            <input type="radio" name="mode" defaultChecked disabled />
            <span className="text-neon-cyan">꼴등</span>
          </label>
        </div>
      </div>

      {/* 버튼 영역 */}
      <div className="space-y-2 border-t border-rink-border p-4">
        <button
          disabled
          className="w-full cursor-not-allowed rounded-md border border-rink-line bg-rink-surface px-4 py-2 text-xs font-medium text-gray-400 transition hover:border-neon-magenta/50 hover:text-neon-magenta"
        >
          🎲 셔플
        </button>
        <button
          disabled
          className="w-full cursor-not-allowed rounded-md bg-gradient-to-r from-neon-cyan to-neon-magenta px-4 py-2.5 text-sm font-bold text-rink-bg opacity-60 shadow-lg transition hover:opacity-100"
          style={{ fontFamily: "Bebas Neue, sans-serif", letterSpacing: "0.1em" }}
        >
          START
        </button>
        <button
          disabled
          className="w-full cursor-not-allowed rounded-md border border-rink-line px-4 py-2 text-xs text-gray-500 transition hover:border-neon-red/50 hover:text-neon-red"
        >
          🔄 리셋
        </button>
      </div>

      {/* 당첨 이력 */}
      <div className="border-t border-rink-border p-4">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500">
          당첨 이력
        </label>
        <p className="mt-2 text-xs italic text-gray-600">아직 당첨자 없음</p>
      </div>
    </div>
  );
}

// Phase 3+ 에서 사용될 export (현재는 미사용)
export { HIDDEN_RANK_ADJUSTED };
