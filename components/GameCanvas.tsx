"use client";

import { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { createEngine, cleanupEngine } from "@/lib/physics/engine";
import { createPucks, type PuckBody } from "@/lib/physics/puck";
import { createObstacles, type ObstacleSet } from "@/lib/physics/obstacles";
import { createCamera, updateCamera, type Camera } from "@/lib/physics/camera";
import { STAGE, VIEWPORT, PUCK, GOAL_LINE_Y } from "@/lib/physics/constants";

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapCanvasRef = useRef<HTMLCanvasElement>(null);

  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const pucksRef = useRef<PuckBody[]>([]);
  const obstacleSetRef = useRef<ObstacleSet | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const animationRef = useRef<number | null>(null);

  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      const targetRatio = VIEWPORT.WIDTH / VIEWPORT.HEIGHT;
      const containerRatio = width / height;
      let w: number, h: number;
      if (containerRatio > targetRatio) {
        h = height;
        w = h * targetRatio;
      } else {
        w = width;
        h = w / targetRatio;
      }
      setDisplaySize({ w, h });
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

    if (
      (gameState === "shuffling" || gameState === "running") &&
      !engineRef.current
    ) {
      setup();
    }

    if (gameState === "shuffling") {
      const timer = setTimeout(() => {
        onShuffleComplete?.();
      }, 1200);
      return () => clearTimeout(timer);
    }

    if (gameState === "running" && engineRef.current) {
      engineRef.current.gravity.scale = 0.0012;
    }
  }, [gameState]);

  const setup = () => {
    if (!canvasRef.current) return;

    const engineSetup = createEngine();
    engineRef.current = engineSetup.engine;

    if (gameState === "shuffling") {
      engineRef.current.gravity.scale = 0;
    }

    const pucks = createPucks(participants, true);
    pucksRef.current = pucks;
    Matter.Composite.add(engineSetup.world, pucks);

    const obstacles = createObstacles();
    obstacleSetRef.current = obstacles;
    Matter.Composite.add(engineSetup.world, obstacles.bodies);

    cameraRef.current = createCamera(mode);

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

    renderLoop();
  };

  const renderLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const now = performance.now();

    if (obstacleSetRef.current) {
      obstacleSetRef.current.update(now);
    }

    if (cameraRef.current && pucksRef.current.length > 0) {
      updateCamera(cameraRef.current, pucksRef.current);

      // 슬로우모션 적용
      if (engineRef.current && gameState === "running") {
        engineRef.current.timing.timeScale = cameraRef.current.timeScale;
      }
    }

    renderScene(ctx);
    renderMinimap();

    animationRef.current = requestAnimationFrame(renderLoop);
  };

  const renderScene = (ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = displaySize.w * dpr;
    canvas.height = displaySize.h * dpr;
    canvas.style.width = `${displaySize.w}px`;
    canvas.style.height = `${displaySize.h}px`;

    if (!cameraRef.current) return;
    const cam = cameraRef.current;

    // 카메라 줌 적용된 스케일
    const baseScale = (displaySize.w / VIEWPORT.WIDTH) * dpr;
    const scale = baseScale * cam.zoom;

    // 카메라 변환 (줌 고려)
    const visibleHalfW = VIEWPORT.WIDTH / 2 / cam.zoom;
    const visibleHalfH = VIEWPORT.HEIGHT / 2 / cam.zoom;
    const camOffsetX = cam.x - visibleHalfW;
    const camOffsetY = cam.y - visibleHalfH;

    const wx = (x: number) => (x - camOffsetX) * scale;
    const wy = (y: number) => (y - camOffsetY) * scale;
    const ws = (s: number) => s * scale;

    // === 흰색 아이스링크 배경 ===
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, "#f0f9ff"); // sky-50
    bgGrad.addColorStop(0.5, "#e0f2fe"); // sky-100
    bgGrad.addColorStop(1, "#bae6fd"); // sky-200
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 빙판 표면 라인 (장식)
    ctx.strokeStyle = "rgba(186, 230, 253, 0.6)";
    ctx.lineWidth = 1 * baseScale;
    for (let y = 200; y < STAGE.HEIGHT; y += 200) {
      ctx.beginPath();
      ctx.moveTo(wx(0), wy(y));
      ctx.lineTo(wx(STAGE.WIDTH), wy(y));
      ctx.stroke();
    }

    // 좌우 보드 (빨간색 NHL 보드)
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 4 * baseScale;
    ctx.beginPath();
    ctx.moveTo(wx(0), wy(0));
    ctx.lineTo(wx(0), wy(STAGE.HEIGHT));
    ctx.moveTo(wx(STAGE.WIDTH), wy(0));
    ctx.lineTo(wx(STAGE.WIDTH), wy(STAGE.HEIGHT));
    ctx.stroke();

    // 상단 빨강 라인 (블루라인 컨셉)
    ctx.strokeStyle = "#1e3a8a";
    ctx.lineWidth = 3 * baseScale;
    ctx.beginPath();
    ctx.moveTo(wx(0), wy(0));
    ctx.lineTo(wx(STAGE.WIDTH), wy(0));
    ctx.stroke();

    // 결승선 (빨강, 두께감)
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 5 * baseScale;
    ctx.beginPath();
    ctx.moveTo(wx(0), wy(GOAL_LINE_Y));
    ctx.lineTo(wx(STAGE.WIDTH), wy(GOAL_LINE_Y));
    ctx.stroke();

    // 골존 (빨강 그라데이션)
    const goalGrad = ctx.createLinearGradient(0, wy(GOAL_LINE_Y), 0, wy(STAGE.HEIGHT));
    goalGrad.addColorStop(0, "rgba(220, 38, 38, 0.0)");
    goalGrad.addColorStop(1, "rgba(220, 38, 38, 0.25)");
    ctx.fillStyle = goalGrad;
    ctx.fillRect(wx(0), wy(GOAL_LINE_Y), ws(STAGE.WIDTH), ws(STAGE.HEIGHT - GOAL_LINE_Y));

    // 장애물 렌더링
    if (obstacleSetRef.current) {
      obstacleSetRef.current.bodies.forEach((body) => {
        renderBody(ctx, body, wx, wy, ws, baseScale);
      });
    }

    // 퍽 렌더링
    pucksRef.current.forEach((puck) => {
      renderPuck(ctx, puck, wx, wy, ws, baseScale);
    });
  };

  const renderBody = (
    ctx: CanvasRenderingContext2D,
    body: Matter.Body,
    wx: (x: number) => number,
    wy: (y: number) => number,
    ws: (s: number) => number,
    baseScale: number
  ) => {
    const render = body.render as Matter.IBodyRenderOptions & {
      lineWidth?: number;
    };
    const strokeStyle = (render.strokeStyle as string) ?? "#1e293b";
    const fillStyle = render.fillStyle ?? "transparent";
    const lineWidth = (render.lineWidth ?? 1) * baseScale;

    ctx.save();

    if (body.circleRadius) {
      ctx.beginPath();
      ctx.arc(wx(body.position.x), wy(body.position.y), ws(body.circleRadius), 0, Math.PI * 2);
      if (fillStyle !== "transparent") {
        ctx.fillStyle = fillStyle as string;
        ctx.fill();
      }
      if (strokeStyle !== "transparent") {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
    } else {
      const verts = body.vertices;
      ctx.beginPath();
      ctx.moveTo(wx(verts[0].x), wy(verts[0].y));
      for (let i = 1; i < verts.length; i++) {
        ctx.lineTo(wx(verts[i].x), wy(verts[i].y));
      }
      ctx.closePath();
      if (fillStyle !== "transparent") {
        ctx.fillStyle = fillStyle as string;
        ctx.fill();
      }
      if (strokeStyle !== "transparent") {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
    }
    ctx.restore();
  };

  const renderPuck = (
    ctx: CanvasRenderingContext2D,
    puck: PuckBody,
    wx: (x: number) => number,
    wy: (y: number) => number,
    ws: (s: number) => number,
    baseScale: number
  ) => {
    if (!puck.puckMeta) return;
    const cx = wx(puck.position.x);
    const cy = wy(puck.position.y);
    const r = ws(PUCK.RADIUS);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(puck.angle);

    // 그림자 (흰 배경에서 더 강함)
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 12 * baseScale;
    ctx.shadowOffsetY = 4 * baseScale;

    // 검은 입체 퍽 본체
    const puckGrad = ctx.createRadialGradient(
      -r * 0.3,
      -r * 0.3,
      r * 0.1,
      0,
      0,
      r
    );
    puckGrad.addColorStop(0, "#404040");
    puckGrad.addColorStop(0.5, "#1a1a1a");
    puckGrad.addColorStop(1, "#000000");
    ctx.fillStyle = puckGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // 측면 두께감 링 (밝은 색)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 1.5 * baseScale;
    ctx.beginPath();
    ctx.arc(0, 0, r - 1.5 * baseScale, 0, Math.PI * 2);
    ctx.stroke();

    // 이름 텍스트 (검은 퍽 위 → 밝은 색 + 검은 외곽선 유지)
    const fontSize = r * 0.85;
    ctx.font = `900 ${fontSize}px "Black Han Sans", "Noto Sans KR", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.lineWidth = r * 0.32;
    ctx.lineJoin = "round";
    ctx.miterLimit = 2;
    ctx.strokeStyle = "#000000";
    ctx.strokeText(puck.puckMeta.name, 0, 1);

    ctx.lineWidth = r * 0.16;
    ctx.strokeText(puck.puckMeta.name, 0, 1);

    ctx.fillStyle = puck.puckMeta.color;
    ctx.fillText(puck.puckMeta.name, 0, 1);

    ctx.restore();
  };

  const renderMinimap = () => {
    const canvas = minimapCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const mapW = 80;
    const mapH = (mapW * STAGE.HEIGHT) / STAGE.WIDTH;

    canvas.width = mapW * dpr;
    canvas.height = mapH * dpr;
    canvas.style.width = `${mapW}px`;
    canvas.style.height = `${mapH}px`;
    ctx.scale(dpr, dpr);

    // 흰 배경
    ctx.fillStyle = "rgba(240, 249, 255, 0.95)";
    ctx.fillRect(0, 0, mapW, mapH);

    // 경계
    ctx.strokeStyle = "#1e3a8a";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, mapW - 1, mapH - 1);

    const sx = mapW / STAGE.WIDTH;
    const sy = mapH / STAGE.HEIGHT;

    // 결승선
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, GOAL_LINE_Y * sy);
    ctx.lineTo(mapW, GOAL_LINE_Y * sy);
    ctx.stroke();

    // 장애물 (코치 + 도트)
    if (obstacleSetRef.current) {
      obstacleSetRef.current.bodies.forEach((body) => {
        if (body.label === "obstacle-coach") {
          ctx.fillStyle = "rgba(220, 38, 38, 0.6)";
          ctx.beginPath();
          ctx.arc(body.position.x * sx, body.position.y * sy, 1.8, 0, Math.PI * 2);
          ctx.fill();
        } else if (body.label === "obstacle-funnel-dot") {
          ctx.fillStyle = "rgba(30, 58, 138, 0.5)";
          ctx.beginPath();
          ctx.arc(body.position.x * sx, body.position.y * sy, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // 퍽 (검은 점 + 컬러 테두리)
    pucksRef.current.forEach((puck) => {
      if (!puck.puckMeta) return;
      ctx.fillStyle = "#000000";
      ctx.strokeStyle = puck.puckMeta.color;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(puck.position.x * sx, puck.position.y * sy, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // 카메라 뷰포트 박스 (줌 고려)
    if (cameraRef.current) {
      const cam = cameraRef.current;
      const visibleW = VIEWPORT.WIDTH / cam.zoom;
      const visibleH = VIEWPORT.HEIGHT / cam.zoom;
      const boxX = (cam.x - visibleW / 2) * sx;
      const boxY = (cam.y - visibleH / 2) * sy;
      const boxW = visibleW * sx;
      const boxH = visibleH * sy;
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(boxX, boxY, boxW, boxH);
    }
  };

  const teardown = () => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
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
    obstacleSetRef.current = null;
    cameraRef.current = null;

    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    const mmCtx = minimapCanvasRef.current?.getContext("2d");
    if (mmCtx && minimapCanvasRef.current) {
      mmCtx.clearRect(0, 0, minimapCanvasRef.current.width, minimapCanvasRef.current.height);
    }
  };

  useEffect(() => {
    return () => teardown();
  }, []);

  const isPlaying = gameState !== "idle";

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full items-center justify-center overflow-hidden"
    >
      {gameState === "idle" && (
        <div className="flex flex-col items-center text-center">
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
          <p className="mt-6 max-w-[280px] text-xs leading-relaxed text-gray-600">
            참가자를 확인하고 START 버튼을 눌러주세요
          </p>
        </div>
      )}

      {isPlaying && (
        <>
          <canvas
            ref={canvasRef}
            className="rounded-lg shadow-2xl"
          />

          <div className="pointer-events-none absolute left-3 top-3 z-20 rounded-md border border-blue-900/50 bg-white/85 p-1 backdrop-blur">
            <canvas ref={minimapCanvasRef} className="block" />
            <p className="mt-1 text-center text-[8px] uppercase tracking-widest text-blue-900/70">
              MAP
            </p>
          </div>

          <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2">
            {gameState === "shuffling" && (
              <div className="rounded-full bg-red-600/90 px-3 py-1 text-[10px] uppercase tracking-widest text-white">
                🎲 Shuffling...
              </div>
            )}
            {gameState === "running" && (
              <div className="rounded-full bg-blue-900/90 px-3 py-1 text-[10px] uppercase tracking-widest text-white">
                ● LIVE · {mode === "first" ? "1ST WINS" : "LAST WINS"}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
