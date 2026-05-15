"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import ParticipantPanel, {
  type Participant,
} from "@/components/ParticipantPanel";
import { type GameState } from "@/components/GameCanvas";
import RankingPanel from "@/components/RankingPanel";
import MiniRanking from "@/components/MiniRanking";
import Header from "@/components/Header";

// Matter.js는 SSR 미지원 → 동적 import + ssr false
const GameCanvas = dynamic(() => import("@/components/GameCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <p className="text-xs text-gray-500">물리엔진 로딩 중...</p>
    </div>
  ),
});

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

function makeParticipant(name: string): Participant {
  return {
    id: `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    checked: true,
  };
}

export default function Home() {
  const [participants, setParticipants] = useState<Participant[]>(() =>
    DEFAULT_PARTICIPANTS.map(makeParticipant)
  );
  const [mode, setMode] = useState<"first" | "last">("last");
  const [gameState, setGameState] = useState<GameState>("idle");

  const checkedNames = participants
    .filter((p) => p.checked)
    .map((p) => p.name);

  const handleStart = useCallback(() => {
    if (checkedNames.length < 2) return;
    setGameState("shuffling");
  }, [checkedNames.length]);

  const handleShuffleComplete = useCallback(() => {
    setGameState("running");
  }, []);

  const handleExit = useCallback(() => {
    setGameState("idle");
  }, []);

  // ESC 키 핸들러
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && gameState !== "idle") {
        handleExit();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [gameState, handleExit]);

  const isFullscreen = gameState !== "idle";

  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden bg-rink-bg">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* 좌측 패널 - idle 상태일 때만 */}
        {!isFullscreen && (
          <aside className="w-[320px] shrink-0 border-r border-rink-border bg-rink-surface/40 backdrop-blur">
            <ParticipantPanel
              participants={participants}
              setParticipants={setParticipants}
              mode={mode}
              setMode={setMode}
              onStart={handleStart}
            />
          </aside>
        )}

        {/* 중앙 캔버스 */}
        <section className="flex flex-1 items-center justify-center bg-rink-bg">
          <GameCanvas
            participants={checkedNames}
            mode={mode}
            gameState={gameState}
            fullscreen={isFullscreen}
            onShuffleComplete={handleShuffleComplete}
          />
        </section>

        {/* 우측 패널 */}
        {!isFullscreen ? (
          <aside className="w-[260px] shrink-0 border-l border-rink-border bg-rink-surface/40 backdrop-blur">
            <RankingPanel />
          </aside>
        ) : (
          <MiniRanking
            participants={checkedNames}
            mode={mode}
            onExit={handleExit}
          />
        )}
      </div>
    </main>
  );
}
