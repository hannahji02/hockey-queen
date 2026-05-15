"use client";

export default function ParticipantPanel() {
  // Phase 1: 정적 UI 골격만. Phase 2에서 CSV 업로드/체크박스 로직 연결 예정.
  const mockParticipants = [
    "민준",
    "서연",
    "도윤",
    "예준",
    "시우",
    "주원",
    "하준",
    "지호",
  ];

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
            {mockParticipants.length}명
          </span>
        </div>
        <ul className="space-y-1">
          {mockParticipants.map((name, idx) => (
            <li
              key={idx}
              className="flex items-center gap-3 rounded-md px-2 py-2 transition hover:bg-rink-surface/60"
            >
              <input
                type="checkbox"
                defaultChecked
                disabled
                className="h-4 w-4 rounded border-rink-line"
              />
              <span className="text-sm text-gray-200">{name}</span>
            </li>
          ))}
        </ul>
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
