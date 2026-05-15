"use client";

import { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { createEngine, cleanupEngine } from "@/lib/physics/engine";
import { createPucks, drawPuckLabels, type PuckBody } from "@/lib/physics/puck";
import { STAGE, GOAL_LINE_Y } from "@/lib/physics/constants";

export type GameState = "idle" | "shuffling" | "running" | "finished";

interface GameCanvasProps {
  participants: string[];
  mode: "first" | "last";
  gameState: GameState;
  fullscreen: boolean;
  onShuffleComplete?: () => void;
}

export default function GameCanvas({
  participants,
  mode,
  gameState,
  fullscreen,
  onShuffleComplete,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bodyCanvasRef = useRef<HTMLCanvasElement>(null);
  const labelCanvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const pucksRef = useRef<PuckBody[]>([]);
  const animationRef = useRef<number | null>(null);

  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      const scaleX = width / STAGE.WIDTH;
      const scaleY = height / STAGE.HEIGHT;
      setScale(Math.min(scaleX, scaleY));
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [fullscreen]);

  useEffect(() => {
    if (gameState === "idle") {
      teardown();
      return;
    }

    if (gameState === "shuffling" || gameState === "running") {
      if (!engineRef.current) {
        setup();
      } else if (gameState === "running") {
        engineRef.current.gravity.scale = 0.0012;
      }
    }

    if (gameState === "shuffling") {
      const timer = setTimeout(() => {
        onShuffleComplete?.();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  const setup = () => {
    if (!bodyCanvasRef.current) return;

    const engineSetup = createEngine();
    engineRef.current = engineSetup.engine;

    if (gameState === "shuffling") {
      engineRef.current.gravity.scale = 0;
    }

    const pucks = createPucks(participants, true);
    pucksRef.current = pucks;
    Matter.Composite.add(engineSetup.world, pucks);

    const render = Matter.Render.create({
      canvas: bodyCanvasRef.current,
      engine: engineSetup.engine,
      options: {
        width: STAGE.WIDTH,
        height: STAGE.HEIGHT,
        wireframes: false,
        background: "transparent",
        pixelRatio: window.devicePixelRatio || 1,
      },
    });
    renderRef.current = render;
    Matter.Render.run(render);

    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    Matter.Runner.run(runner, engineSetup.engine);

    if (gameState === "shuffling") {
      const shakeInterval = setInterval(() => {
        pucks.forEach((p) => {
          Matter.Body.setVelocity(p, {
            x: (Math.random() - 0.5) * 8,
            y: (Math.random() - 0.5) * 2,
          });
        });
      }, 150);
      setTimeout(() => clearInterval(shakeInterval), 1100);
    }

    const labelLoop = () => {
      const ctx = labelCanvasRef.current?.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, STAGE.WIDTH, STAGE.HEIGHT);
        drawPuckLabels(ctx, pucksRef.current, 1);
      }
      animationRef.current = requestAnimationFrame(labelLoop);
    };
    labelLoop();
  };

  const teardown = () => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (renderRef.current) {
      Matter.Render.stop(renderRef.current);
      renderRef.current = null;
    }
    if (runnerRef.current) {
      Matter.Runner.stop(runnerRef.current);
      runnerRef.current = null;
    }
    if (engineRef.current) {
      cleanupEngine(engineRef.current);
      engineRef.current = null;
    }
    pucksRef.current = [];

    const bodyCtx = bodyCanvasRef.current?.getContext("2d");
    if (bodyCtx) bodyCtx.clearRect(0, 0, STAGE.WIDTH, STAGE.HEIGHT);
    const labelCtx = labelCanvasRef.current?.getContext("2d");
    if (labelCtx) labelCtx.clearRect(0, 0, STAGE.WIDTH, STAGE.HEIGHT);
  };

  useEffect(() => {
    return () => {
      teardown();
    };
  }, []);

  const displayWidth = STAGE.WIDTH * scale;
  const displayHeight = STAGE.HEIGHT * scale;

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full items-center justify-center p-4"
    >
      <div
        className="relative overflow-hidden rounded-lg border border-rink-border bg-gradient-to-b from-[#0d1424] via-[#0a1020] to-[#050810] rink-pattern shadow-2xl"
        style={{
          width: `${displayWidth}px`,
          height: `${displayHeight}px`,
        }}
      >
        <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-transparent via-neon-red/60 to-transparent" />

        <div className="absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b from-rink-border via-rink-line to-rink-border" />
        <div className="absolute bottom-0 right-0 top-0 w-1 bg-gradient-to-b from-rink-border via-rink-line to-rink-border" />

        <svg
          className="absolute inset-0 h-full w-full opacity-40"
          viewBox={`0 0 ${STAGE.WIDTH} ${STAGE.HEIGHT}`}
          fill="none"
          preserveAspectRatio="none"
        >
          <circle cx={STAGE.WIDTH / 2} cy="180" r="60" stroke="#22d3ee" strokeWidth="1" strokeOpacity="0.3" />
          <circle cx={STAGE.WIDTH / 2} cy="180" r="6" fill="#22d3ee" fillOpacity="0.4" />
          <circle cx="150" cy={STAGE.HEIGHT / 2} r="50" stroke="#22d3ee" strokeWidth="1" strokeOpacity="0.2" />
          <circle cx={STAGE.WIDTH - 150} cy={STAGE.HEIGHT / 2} r="50" stroke="#22d3ee" strokeWidth="1" strokeOpacity="0.2" />
          <circle cx={STAGE.WIDTH / 2} cy={STAGE.HEIGHT - 180} r="60" stroke="#e879f9" strokeWidth="1" strokeOpacity="0.3" />
          <circle cx={STAGE.WIDTH / 2} cy={STAGE.HEIGHT - 180} r="6" fill="#e879f9" fillOpacity="0.4" />
          <line x1="0" y1={STAGE.HEIGHT / 2} x2={STAGE.WIDTH} y2={STAGE.HEIGHT / 2} stroke="#7dd3fc" strokeWidth="1" strokeOpacity="0.15" strokeDasharray="6 6" />
        </svg>

        {gameState === "idle" && (
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
            <p className="mt-6 max-w-[240px] text-xs leading-relaxed text-gray-600">
              참가자를 확인하고<br />
              START 버튼을 눌러주세요
            </p>
          </div>
        )}

        <canvas
          ref={bodyCanvasRef}
          width={STAGE.WIDTH}
          height={STAGE.HEIGHT}
          className="absolute inset-0 h-full w-full"
          style={{ pointerEvents: "none" }}
        />

        <canvas
          ref={labelCanvasRef}
          width={STAGE.WIDTH}
          height={STAGE.HEIGHT}
          className="absolute inset-0 h-full w-full"
          style={{ pointerEvents: "none" }}
        />

        {(gameState === "running" || gameState === "shuffling") && (
          <div
            className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-neon-magenta to-transparent"
            style={{
              top: `${(GOAL_LINE_Y / STAGE.HEIGHT) * 100}%`,
              boxShadow: "0 0 12px rgba(232, 121, 249, 0.6)",
            }}
          />
        )}

        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-neon-magenta/20 to-transparent">
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-neon-magenta to-transparent" />
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest text-neon-magenta/80">
            Goal Zone · {mode === "first" ? "1ST WINS" : "LAST WINS"}
          </div>
        </div>

        {gameState === "shuffling" && (
          <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-neon-magenta/20 px-3 py-1 text-[10px] uppercase tracking-widest text-neon-magenta backdrop-blur">
            🎲 Shuffling...
          </div>
        )}
        {gameState === "running" && (
          <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-neon-cyan/20 px-3 py-1 text-[10px] uppercase tracking-widest text-neon-cyan backdrop-blur">
            ● LIVE
          </div>
        )}
      </div>
    </div>
  );
}
