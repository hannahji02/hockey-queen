"use client";

import {
  useState,
  useMemo,
  KeyboardEvent,
  Dispatch,
  SetStateAction,
} from "react";

const MAX_PARTICIPANTS = 30;
const KOREAN_NAME_REGEX = /^[\uAC00-\uD7A3]{1,3}$/;

export interface Participant {
  id: string;
  name: string;
  checked: boolean;
}

interface Props {
  participants: Participant[];
  setParticipants: Dispatch<SetStateAction<Participant[]>>;
  mode: "first" | "last";
  setMode: Dispatch<SetStateAction<"first" | "last">>;
  onStart: () => void;
}

function makeParticipant(name: string): Participant {
  return {
    id: `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    checked: true,
  };
}

export default function ParticipantPanel({
  participants,
  setParticipants,
  mode,
  setMode,
  onStart,
}: Props) {
  const [inputValue, setInputValue] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const checkedCount = useMemo(
    () => participants.filter((p) => p.checked).length,
    [participants]
  );

  const isMaxReached = participants.length >= MAX_PARTICIPANTS;

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
    if (!trimmed) return triggerError("이름을 입력하세요");
    if (!KOREAN_NAME_REGEX.test(trimmed))
      return triggerError("한글 1~3자만 가능");
    if (participants.some((p) => p.name === trimmed))
      return triggerError("이미 존재하는 이름");
    if (isMaxReached) return triggerError(`최대 ${MAX_PARTICIPANTS}명까지`);

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

  const handleInputChange = (value: string) => {
    setInputValue(value.length > 3 ? value.slice(0, 3) : value);
    if (errorMsg) setErrorMsg(null);
  };

  return (
    <div className="flex h-full flex-col">
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

        <div className="mt-4">
          <div className={shake ? "animate-shake" : ""}>
            <div className="flex gap-1">
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
          </div>
          {errorMsg && (
            <p className="mt-1.5 text-[10px] text-neon-red">⚠ {errorMsg}</p>
          )}
        </div>
      </div>

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

      <div className="border-t border-rink-border p-4">
        <button
          onClick={onStart}
          disabled={checkedCount < 2}
          className="w-full rounded-md bg-gradient-to-r from-neon-cyan to-neon-magenta px-4 py-3 text-base font-bold text-rink-bg shadow-lg shadow-neon-cyan/20 transition hover:shadow-neon-magenta/30 disabled:cursor-not-allowed disabled:opacity-40"
          style={{ fontFamily: "Bebas Neue, sans-serif", letterSpacing: "0.15em" }}
        >
          🎲 ROULETTE START
        </button>
        {checkedCount < 2 && (
          <p className="mt-2 text-center text-[10px] text-gray-600">
            최소 2명 이상 체크하세요
          </p>
        )}
      </div>

      <div className="border-t border-rink-border p-4">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500">
          당첨 이력
        </label>
        <p className="mt-2 text-xs italic text-gray-600">아직 당첨자 없음</p>
      </div>
    </div>
  );
}
