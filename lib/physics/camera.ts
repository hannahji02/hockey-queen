/**
 * 카메라 시스템 (레퍼런스 방식 차용)
 *
 * - 평소: 줌 1배, 카메라 중심 = 스테이지 중앙 부근
 * - 시뮬레이션 시작 후: 1등(또는 꼴등) 퍽 추적
 * - 결승선 잔여 거리 < ZOOM_THRESHOLD 진입 시 줌 1배 → 4배 점진 확대
 * - 프레임 lerp 보간 (current + (target - current) / 10)
 */

import { ZOOM_THRESHOLD, STAGE, INITIAL_ZOOM } from "./constants";
import type { Puck } from "./engine";

export interface Camera {
  x: number;
  y: number;
  zoom: number;
  targetX: number;
  targetY: number;
  targetZoom: number;
  mode: "first" | "last";
  shouldFollow: boolean;
  /** 슬로우모션 비율 (1=정상, 0.3=느림) */
  timeScale: number;
}

export function createCamera(mode: "first" | "last"): Camera {
  return {
    x: 12.95,
    y: 2,
    zoom: 1,
    targetX: 12.95,
    targetY: 2,
    targetZoom: 1,
    mode,
    shouldFollow: false,
    timeScale: 1,
  };
}

export function startFollowing(cam: Camera): void {
  cam.shouldFollow = true;
}

/**
 * 프레임 lerp 보간 (레퍼런스 방식)
 */
function interp(current: number, target: number): number {
  const d = target - current;
  if (Math.abs(d) < 1 / INITIAL_ZOOM) {
    return target;
  }
  return current + d / 10;
}

/**
 * 카메라 업데이트 (매 프레임 호출)
 *
 * 추적 대상:
 * - first 모드: y가 가장 큰 퍽 (1등 = 가장 아래)
 * - last 모드: y가 가장 작은 퍽 (꼴등 = 가장 위)
 */
export function updateCamera(cam: Camera, pucks: Puck[]): void {
  if (cam.shouldFollow && pucks.length > 0) {
    // 추적 대상 결정
    let target: Puck;
    if (cam.mode === "first") {
      target = pucks.reduce((a, b) =>
        a.body.getPosition().y > b.body.getPosition().y ? a : b
      );
    } else {
      target = pucks.reduce((a, b) =>
        a.body.getPosition().y < b.body.getPosition().y ? a : b
      );
    }

    const pos = target.body.getPosition();
    cam.targetX = pos.x;
    cam.targetY = pos.y;

    // 줌 + 슬로우모션 계산
    const goalDist = Math.abs(STAGE.ZOOM_Y - pos.y);
    if (goalDist < ZOOM_THRESHOLD) {
      const proximity = 1 - goalDist / ZOOM_THRESHOLD; // 0~1
      cam.targetZoom = Math.max(1, 1 + proximity * 3); // 1 → 4
      cam.timeScale = Math.max(0.25, 1 - proximity * 0.75); // 1 → 0.25
    } else {
      cam.targetZoom = 1;
      cam.timeScale = 1;
    }
  }

  // 보간 적용
  cam.x = interp(cam.x, cam.targetX);
  cam.y = interp(cam.y, cam.targetY);
  cam.zoom = interp(cam.zoom, cam.targetZoom);
}

/**
 * 초기 카메라 위치 (시작 영역 중앙)
 *
 * 레퍼런스 방식: 시작 영역에 따라 카메라 중심과 줌 자동 계산
 */
export function initCameraPosition(cam: Camera, puckCount: number): void {
  if (puckCount > 0) {
    const cols = Math.min(puckCount, 10);
    const rows = Math.ceil(puckCount / 10);
    const lineDelta = -Math.max(0, Math.ceil(rows - 5));
    const centerX = 10.25 + (cols - 1) * 0.3;
    const centerY = (1 + rows) / 2 + lineDelta;

    cam.x = centerX;
    cam.y = centerY;
    cam.targetX = centerX;
    cam.targetY = centerY;
    cam.zoom = 1.8;
    cam.targetZoom = 1.8;
  } else {
    cam.x = 12.95;
    cam.y = 2;
    cam.targetX = 12.95;
    cam.targetY = 2;
    cam.zoom = 1;
    cam.targetZoom = 1;
  }
  cam.shouldFollow = false;
  cam.timeScale = 1;
}
