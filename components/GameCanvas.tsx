"use client";

import { useEffect, useRef, useState } from "react";
import * as planck from "planck";
import {
  createPhysicsWorld,
  createPucks,
  stepWorld,
  startSimulation,
  destroyWorld,
  type PhysicsWorld,
  type Puck,
} from "@/lib/physics/engine";
import {
  createCamera,
  updateCamera,
  initCameraPosition,
  startFollowing,
  type Camera,
} from "@/lib/physics/camera";
import { STAGE, PUCK, INITIAL_ZOOM, VIEWPORT } from "@/lib/physics/constants";

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

  const pwRef = useRef<PhysicsWorld | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);

  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });

  // 컨테이너 크기에 맞춰 캔버스 표시 크기 결정 (16:9 유지)
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

  // 게임 상태 변경 처리
  useEffect(() => {
    if (gameState === "idle") {
      teardown();
      return;
    }

    if ((gameState === "shuffling" || gameState === "running") && !pwRef.current) {
      setup();
    }

    if (gameState === "shuffling") {
      const timer = setTimeout(() => {
        onShuffleComplete?.();
      }, 1200);
      return () => clearTimeout(timer);
    }

    if (gameState === "running" && pwRef.current && cameraRef.current) {
      startSimulation(pwRef.current);
      startFollowing(cameraRef.current);
    }
  }, [gameState]);

  const setup = () => {
    if (!canvasRef.current) return;

    const pw = createPhysicsWorld();
    pwRef.current = pw;

    createPucks(pw, participants);

    const cam = createCamera(mode);
    cameraRef.current = cam;
    initCameraPosition(cam, participants.length);

    lastTimeRef.current = performance.now();
    elapsedRef.current = 0;
    renderLoop();
  };

  const renderLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (!pwRef.current || !cameraRef.current) return;

    const now = performance.now();
    const deltaMs = Math.min(50, now - lastTimeRef.current);
    lastTimeRef.current = now;

    // 물리 step (10ms 고정 간격, 누적 시간만큼 진행)
    elapsedRef.current += deltaMs;
    const STEP_MS = 10;
    while (elapsedRef.current >= STEP_MS) {
      stepWorld(pwRef.current, STEP_MS / 1000, cameraRef.current.timeScale);
      elapsedRef.current -= STEP_MS;
    }

    // 카메라 업데이트
    updateCamera(cameraRef.current, pwRef.current.pucks);

    // 렌더링
    renderScene(ctx);
    renderMinimap();

    animationRef.current = requestAnimationFrame(renderLoop);
  };

  const renderScene = (ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current;
    if (!canvas || !cameraRef.current || !pwRef.current) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = displaySize.w * dpr;
    canvas.height = displaySize.h * dpr;
    canvas.style.width = `${displaySize.w}px`;
    canvas.style.height = `${displaySize.h}px`;

    const cam = cameraRef.current;
    const w = canvas.width;
    const h = canvas.height;

    // 배경 (흰색 아이스링크)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, "#f0f9ff");
    bgGrad.addColorStop(0.5, "#e0f2fe");
    bgGrad.addColorStop(1, "#bae6fd");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // ===== 카메라 변환 =====
    // 레퍼런스 방식: 화면 중앙에 카메라가 오도록 translate, scale은 zoom
    // worldX → pixelX: (worldX - cam.x) * zoomFactor + w/2
    const zoomFactor = INITIAL_ZOOM * dpr * cam.zoom;

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(cam.zoom * dpr, cam.zoom * dpr);
    ctx.translate(-cam.x * INITIAL_ZOOM, -cam.y * INITIAL_ZOOM);
    ctx.scale(INITIAL_ZOOM, INITIAL_ZOOM);

    // 이제 ctx는 월드 좌표계로 그릴 수 있음. (1단위 = 1m)
    const lineScale = 1 / (cam.zoom * INITIAL_ZOOM * dpr);

    // === 빙판 가로 라인 (장식) ===
    ctx.strokeStyle = "rgba(125, 211, 252, 0.5)";
    ctx.lineWidth = lineScale * 2;
    for (let y = 0; y <= 120; y += 10) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(30, y);
      ctx.stroke();
    }

    // === 결승선 (빨강) ===
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = lineScale * 4;
    ctx.beginPath();
    ctx.moveTo(0, STAGE.GOAL_Y);
    ctx.lineTo(30, STAGE.GOAL_Y);
    ctx.stroke();

    // === 골존 빨강 그라데이션 ===
    const goalGrad = ctx.createLinearGradient(0, STAGE.ZOOM_Y, 0, STAGE.GOAL_Y);
    goalGrad.addColorStop(0, "rgba(220, 38, 38, 0)");
    goalGrad.addColorStop(1, "rgba(220, 38, 38, 0.2)");
    ctx.fillStyle = goalGrad;
    ctx.fillRect(0, STAGE.ZOOM_Y, 30, STAGE.GOAL_Y - STAGE.ZOOM_Y);

    // === 장애물 렌더링 (월드 좌표계) ===
    renderBodies(ctx, pwRef.current, lineScale);

    // === 퍽 렌더링 ===
    renderPucks(ctx, pwRef.current.pucks, lineScale);

    ctx.restore();
  };

  const renderBodies = (
    ctx: CanvasRenderingContext2D,
    pw: PhysicsWorld,
    lineScale: number
  ) => {
    // World iterate all bodies
    for (let body = pw.world.getBodyList(); body; body = body.getNext()) {
      const pos = body.getPosition();
      const angle = body.getAngle();
      const type = body.getType();

      // dynamic body는 퍽이므로 별도 렌더링
      if (type === "dynamic") continue;

      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(angle);

      // 모든 fixture 순회
      for (let fixture = body.getFixtureList(); fixture; fixture = fixture.getNext()) {
        const shape = fixture.getShape();
        const shapeType = shape.getType();

        if (shapeType === "polygon") {
          const polygon = shape as planck.PolygonShape;
          const vertices = polygon.m_vertices;

          ctx.beginPath();
          ctx.moveTo(vertices[0].x, vertices[0].y);
          for (let i = 1; i < vertices.length; i++) {
            ctx.lineTo(vertices[i].x, vertices[i].y);
          }
          ctx.closePath();

          // kinematic = 회전 막대, static = 고정 장애물
          if (type === "kinematic") {
            ctx.fillStyle = "#ea580c";
            ctx.fill();
            ctx.strokeStyle = "#9a3412";
            ctx.lineWidth = lineScale * 1.5;
            ctx.stroke();
          } else {
            ctx.fillStyle = "#1e293b";
            ctx.fill();
          }
        } else if (shapeType === "circle") {
          const circle = shape as planck.CircleShape;
          const r = circle.getRadius();
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fillStyle = "#1e293b";
          ctx.fill();
        } else if (shapeType === "edge") {
          const edge = shape as planck.EdgeShape;
          const v1 = edge.m_vertex1;
          const v2 = edge.m_vertex2;
          ctx.beginPath();
          ctx.moveTo(v1.x, v1.y);
          ctx.lineTo(v2.x, v2.y);
          ctx.strokeStyle = "#1e293b";
          ctx.lineWidth = lineScale * 3;
          ctx.stroke();
        }
      }

      ctx.restore();
    }
  };

  const renderPucks = (
    ctx: CanvasRenderingContext2D,
    pucks: Puck[],
    lineScale: number
  ) => {
    for (const puck of pucks) {
      const pos = puck.body.getPosition();
      const angle = puck.body.getAngle();
      const r = PUCK.RADIUS;

      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(angle);

      // 그림자
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = lineScale * 8;
      ctx.shadowOffsetY = lineScale * 3;

      // 검은 퍽
      const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
      grad.addColorStop(0, "#404040");
      grad.addColorStop(0.5, "#1a1a1a");
      grad.addColorStop(1, "#000000");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // 측면 두께감
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = lineScale * 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, r - lineScale * 1, 0, Math.PI * 2);
      ctx.stroke();

      // 이름 (볼드 제거 - normal weight)
      const fontSize = r * 1.5;
      ctx.font = `normal ${fontSize}px "Pretendard", "Noto Sans KR", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // 검은 외곽선 (두 번 그려 진하게)
      ctx.lineJoin = "round";
      ctx.miterLimit = 2;
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = r * 0.35;
      ctx.strokeText(puck.meta.name, 0, r * 0.05);
      ctx.lineWidth = r * 0.18;
      ctx.strokeText(puck.meta.name, 0, r * 0.05);

      // 컬러 채움
      ctx.fillStyle = puck.meta.color;
      ctx.fillText(puck.meta.name, 0, r * 0.05);

      ctx.restore();
    }
  };

  const renderMinimap = () => {
    const canvas = minimapCanvasRef.current;
    if (!canvas || !pwRef.current || !cameraRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const mapW = 80;
    // 맵 비율: 26m × 120m
    const mapH = mapW * (120 / 26);

    canvas.width = mapW * dpr;
    canvas.height = mapH * dpr;
    canvas.style.width = `${mapW}px`;
    canvas.style.height = `${mapH}px`;
    ctx.scale(dpr, dpr);

    // 배경
    ctx.fillStyle = "rgba(240, 249, 255, 0.95)";
    ctx.fillRect(0, 0, mapW, mapH);
    ctx.strokeStyle = "#1e3a8a";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, mapW - 1, mapH - 1);

    // 좌표 변환: world (0~30, 0~120) → minimap pixels
    const sx = mapW / 26;
    const sy = mapH / 120;
    const ox = -2 * sx; // x=2가 좌측 벽

    // 결승선
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, STAGE.GOAL_Y * sy);
    ctx.lineTo(mapW, STAGE.GOAL_Y * sy);
    ctx.stroke();

    // 퍽 위치
    for (const puck of pwRef.current.pucks) {
      const pos = puck.body.getPosition();
      ctx.fillStyle = "#000000";
      ctx.strokeStyle = puck.meta.color;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(pos.x * sx + ox, pos.y * sy, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // 카메라 뷰포트 박스
    const cam = cameraRef.current;
    const viewW = (VIEWPORT.WIDTH / (INITIAL_ZOOM * cam.zoom)) * sx;
    const viewH = (VIEWPORT.HEIGHT / (INITIAL_ZOOM * cam.zoom)) * sy;
    const bx = cam.x * sx + ox - viewW / 2;
    const by = cam.y * sy - viewH / 2;
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, by, viewW, viewH);
  };

  const teardown = () => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (pwRef.current) {
      destroyWorld(pwRef.current);
      pwRef.current = null;
    }
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
            className="text-2xl tracking-widest text-neon-cyan/80"
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
          <canvas ref={canvasRef} className="rounded-lg shadow-2xl" />

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
