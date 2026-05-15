"use client";

import { useState, useMemo, KeyboardEvent } from "react";
import { HIDDEN_RANK_ADJUSTED } from "@/lib/roulette/excluded";

/**
 * Phase 2: 참가자 관리 인터랙티브 활성화.
 *
 * 기능:
 * - 디폴트 15명 표시 (2열 그리드)
 * - 체크박스 토글 (디폴트 전원 ON)
 * - 이름 추가 (한글 1~3자, 중복 차단, 최대 30명)
 * - 이름 제거 (hover ✕ 버튼)
 * - 모드 선택 (1등/꼴등, 디폴트 꼴등)
 *
 * 셔플/시작은 Phase 3에서 활성화.
 */

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

const MAX_PARTICIPANTS = 30;

// 한글 1~3자만 허용 (자모 단독 입력 차단을 위해 완성형 한글만)
const KOREAN_NAME_REGEX = /^[\uAC00-\uD7A3]{1,3}$/;

export interface Participant {
  id: string;
  name: string;
  checked: boolean;
}

function makeParticipant(name: string): Participant {
  return {
    id: `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    checked: true,
  };
}

export default function ParticipantPanel() {
  const [participants, setParticipants] = useState<Participant[]>(() =>
    DEFAULT_PARTICIPANTS.map(makeParticipant)
  );
  const [inputValue, setInputValue] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [mode, setMode] = useState<"first" | "last">("last");

  const checkedCount = useMemo(
    () => participants.filter((p) => p.checked).length,
    [participants]
  );

  const isMaxReached = participants.length >= MAX_PARTICIPANTS;

  // 에러 표시 + 흔들림 애니메이션 트리거
  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setShake(true);
    setTimeout(() => setShake(false), 400);
    setTimeout(() => setErrorMsg(null), 2000);
  };

  const handleToggle = (id: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, checked: !p.checked } : p))
    );
  };

  const handleRemove = (id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAdd = () => {
    const trimmed = inputValue.trim();

    if (!trimmed) {
      triggerError("이름을 입력하세요");
      return;
    }

    if (!KOREAN_NAME_REGEX.test(trimmed)) {
      triggerError("한글 1~3자만 가능");
      return;
    }

    if (participants.some((p) => p.name === trimmed)) {
      triggerError("이미 존재하는 이름");
      return;
    }

    if (isMaxReached) {
      triggerError(`최대 ${MAX_PARTICIPANTS}명까지`);
      return;
    }

    setParticipants((prev) => [...prev, makeParticipant(trimmed)]);
    setInputValue("");
    setErrorMsg(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  // 입력 검증: 입력 중에는 한글만 통과시키되 표시 자체는 막지 않음 (조합 중인 한글 고려)
  const handleInputChange = (value: string) => {
    // 3자 초과는 잘라냄
    if (value.length > 3) {
      setInputValue(value.slice(0, 3));
    } else {
      setInputValue(value);
    }
    if (errorMsg) setErrorMsg(null);
  };

  return (
    <div className="flex h-full flex-col">
      {/* 참가자 리스트 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-3 flex items-center justify-between">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            참가자
          </label>
          <span
            className={`text-[10px] transition ${
              isMaxReached ? "text-neon-red" : "text-neon-cyan"
            }`}
          >
            {checkedCount} / {participants.length}명
            {isMaxReached && " (MAX)"}
          </span>
        </div>

        {/* 2열 그리드 */}
        <ul className="grid grid-cols-2 gap-x-2 gap-y-1">
          {participants.map((p) => (
            <li
              key={p.id}
              className={`group flex items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-rink-surface/60 ${
                p.checked ? "" : "opacity-50"
              }`}
            >
              <input
                type="checkbox"
                checked={p.checked}
                onChange={() => handleToggle(p.id)}
                className="h-3.5 w-3.5 shrink-0 cursor-pointer rounded border-rink-line"
              />
              <span
                className={`flex-1 truncate text-xs ${
                  p.checked ? "text-gray-200" : "text-gray-500 line-through"
                }`}
              >
                {p.name}
              </span>
              <button
                onClick={() => handleRemove(p.id)}
                className="ml-auto text-[10px] text-gray-700 opacity-0 transition group-hover:opacity-100 hover:text-neon-red"
                aria-label={`${p.name} 제거`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>

        {/* 참가자 추가 input */}
        <div className="mt-4">
          <div
            className={`flex gap-1 ${shake ? "animate-shake" : ""}`}
            style={
              shake
                ? {
                    animation: "shake 0.4s cubic-bezier(.36,.07,.19,.97) both",
                  }
                : undefined
            }
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="이름 추가 (한글 3자)"
              maxLength={3}
              disabled={isMaxReached}
              className={`flex-1 rounded-md border bg-rink-surface/40 px-2 py-1.5 text-xs text-gray-200 placeholder:text-gray-600 transition focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-50 ${
                errorMsg
                  ? "border-neon-red focus:ring-neon-red"
                  : "border-rink-line focus:border-neon-cyan/50 focus:ring-neon-cyan/50"
              }`}
            />
            <button
              onClick={handleAdd}
              disabled={isMaxReached || !inputValue.trim()}
              className="rounded-md border border-rink-line bg-rink-surface/40 px-3 py-1.5 text-xs text-gray-300 transition hover:border-neon-cyan/50 hover:text-neon-cyan disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-rink-line disabled:hover:text-gray-300"
            >
              +
            </button>
          </div>
          {errorMsg && (
            <p className="mt-1.5 text-[10px] text-neon-red">⚠ {errorMsg}</p>
          )}
        </div>
      </div>

      {/* 모드 선택 */}
      <div className="border-t border-rink-border p-4">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500">
          당첨 모드
        </label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label
            className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs transition ${
              mode === "first"
                ? "border-neon-cyan/40 bg-neon-cyan/5"
                : "border-rink-line bg-rink-surface/40 hover:border-neon-cyan/50"
            }`}
          >
            <input
              type="radio"
              name="mode"
              checked={mode === "first"}
              onChange={() => setMode("first")}
            />
            <span className={mode === "first" ? "text-neon-cyan" : "text-gray-300"}>
              1등
            </span>
          </label>
          <label
            className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs transition ${
              mode === "last"
                ? "border-neon-cyan/40 bg-neon-cyan/5"
                : "border-rink-line bg-rink-surface/40 hover:border-neon-cyan/50"
            }`}
          >
            <input
              type="radio"
              name="mode"
              checked={mode === "last"}
              onChange={() => setMode("last")}
            />
            <span className={mode === "last" ? "text-neon-cyan" : "text-gray-300"}>
              꼴등
            </span>
          </label>
        </div>
      </div>

      {/* 버튼 영역 (Phase 3에서 활성화) */}
      <div className="space-y-2 border-t border-rink-border p-4">
        <button
          disabled
          className="w-full cursor-not-allowed rounded-md border border-rink-line bg-rink-surface px-4 py-2 text-xs font-medium text-gray-400 transition hover:border-neon-magenta/50 hover:text-neon-magenta"
        >
          🎲 셔플 (Phase 3)
        </button>
        <button
          disabled
          className="w-full cursor-not-allowed rounded-md bg-gradient-to-r from-neon-cyan to-neon-magenta px-4 py-2.5 text-sm font-bold text-rink-bg opacity-60 shadow-lg transition hover:opacity-100"
          style={{ fontFamily: "Bebas Neue, sans-serif", letterSpacing: "0.1em" }}
        >
          START
        </button>
      </div>

      {/* 당첨 이력 (Phase 5에서 채움) */}
      <div className="border-t border-rink-border p-4">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500">
          당첨 이력
        </label>
        <p className="mt-2 text-xs italic text-gray-600">아직 당첨자 없음</p>
      </div>
    </div>
  );
}

export { HIDDEN_RANK_ADJUSTED };
