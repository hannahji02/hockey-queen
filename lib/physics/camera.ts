/**
 * 카메라 추적 시스템
 *
 * - 1등과 2등 퍽의 중심점을 따라감 (mode에 따라 선두/꼴찌)
 * - lerp 스무딩으로 부드러운 이동
 * - 화면 밖으로 카메라가 나가지 않도록 클램프
 */

import type { PuckBody } from "./puck";
import { STAGE, VIEWPORT } from "./constants";

export interface Camera {
  /** 카메라 중심 좌표 (스테이지 좌표계) */
  x: number;
  y: number;
  /** 추적 모드 */
  mode: "first" | "last";
}

export function createCamera(mode: "first" | "last"): Camera {
  return {
    x: STAGE.WIDTH / 2,
    // 초기 위치: 출발 지점 약간 아래
    y: VIEWPORT.HEIGHT / 2,
    mode,
  };
}

/**
 * 매 프레임 호출. 추적 대상의 중심점을 lerp로 따라감.
 *
 * 대상 결정:
 * - first 모드: 가장 아래 두 퍽의 중심점 (1,2등)
 * - last 모드: 가장 위 두 퍽의 중심점 (꼴등, 꼴등 직전)
 *
 * 단, 모든 퍽이 골인존에 가까이 모이면 중앙 결승선 추적으로 전환.
 */
export function updateCamera(
  camera: Camera,
  pucks: PuckBody[],
  deltaSec: number
): void {
  if (pucks.length === 0) return;

  // 활성 퍽만 (골인된 퍽은 메타데이터로 표시될 예정, 일단은 전체)
  const activePucks = pucks.filter((p) => p.puckMeta);

  if (activePucks.length === 0) return;

  // Y 좌표로 정렬
  const sorted = [...activePucks].sort((a, b) => b.position.y - a.position.y);

  // 추적 대상 2개 선정
  let target1: PuckBody;
  let target2: PuckBody;

  if (camera.mode === "first") {
    // 가장 아래에 있는 2개 (1, 2등)
    target1 = sorted[0];
    target2 = sorted[1] ?? sorted[0];
  } else {
    // 가장 위에 있는 2개 (꼴등, 꼴등 직전)
    target1 = sorted[sorted.length - 1];
    target2 = sorted[sorted.length - 2] ?? target1;
  }

  // 중심점 계산
  const targetX = (target1.position.x + target2.position.x) / 2;
  const targetY = (target1.position.y + target2.position.y) / 2;

  // lerp 스무딩 (값이 클수록 빠르게 따라옴)
  const lerpFactor = Math.min(1, deltaSec * 4);
  camera.x += (targetX - camera.x) * lerpFactor;
  camera.y += (targetY - camera.y) * lerpFactor;

  // 카메라 영역이 스테이지 밖으로 나가지 않도록 클램프
  const halfW = VIEWPORT.WIDTH / 2;
  const halfH = VIEWPORT.HEIGHT / 2;
  camera.x = Math.max(halfW, Math.min(STAGE.WIDTH - halfW, camera.x));
  camera.y = Math.max(halfH, Math.min(STAGE.HEIGHT - halfH, camera.y));
}

/**
 * 스테이지 좌표를 카메라 기준 뷰포트 좌표로 변환
 */
export function worldToView(
  camera: Camera,
  worldX: number,
  worldY: number
): { x: number; y: number } {
  return {
    x: worldX - (camera.x - VIEWPORT.WIDTH / 2),
    y: worldY - (camera.y - VIEWPORT.HEIGHT / 2),
  };
}
