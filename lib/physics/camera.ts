/**
 * 카메라 추적 시스템 (v2)
 *
 * - 1등+2등 중간점 추적 (lerp 스무딩)
 * - 결승선 잔여 거리 < ZOOM_THRESHOLD 진입 시 줌인 (1배 → 3배)
 * - 동시에 슬로우모션 트리거용 진행률 반환
 * - 카메라가 스테이지 밖으로 나가지 않도록 클램프
 */

import type { PuckBody } from "./puck";
import {
  STAGE,
  VIEWPORT,
  GOAL_LINE_Y,
  ZOOM_THRESHOLD,
  MAX_ZOOM,
  MIN_TIME_SCALE,
} from "./constants";

export interface Camera {
  /** 카메라 중심 좌표 (월드) */
  x: number;
  y: number;
  /** 현재 줌 배율 (1=기본, MAX_ZOOM=최대 확대) */
  zoom: number;
  /** 추적 모드 */
  mode: "first" | "last";
  /** 현재 슬로우모션 비율 (1=정상, MIN_TIME_SCALE=최대 슬로우) */
  timeScale: number;
}

export function createCamera(mode: "first" | "last"): Camera {
  return {
    x: STAGE.WIDTH / 2,
    y: VIEWPORT.HEIGHT / 2,
    zoom: 1,
    mode,
    timeScale: 1,
  };
}

/**
 * 프레임 단위 lerp 보간 (레퍼런스 방식)
 * 매 프레임 1/10씩 따라옴 → 부드러우면서도 응답성 좋음
 */
function lerpFrame(current: number, target: number, factor: number = 10): number {
  const diff = target - current;
  if (Math.abs(diff) < 0.5) return target;
  return current + diff / factor;
}

/**
 * 매 프레임 호출. 카메라 위치, 줌, 타임스케일을 갱신.
 *
 * 추적 대상:
 * - first 모드: 가장 아래 두 퍽 중심점 (1, 2등)
 * - last 모드: 가장 위 두 퍽 중심점 (꼴등, 꼴등 직전)
 *
 * 줌인 조건:
 * - 추적 대상의 결승선 잔여 거리가 ZOOM_THRESHOLD 이하일 때
 * - 거리가 가까울수록 줌 더 큼, 시간 더 느림
 */
export function updateCamera(camera: Camera, pucks: PuckBody[]): void {
  if (pucks.length === 0) return;

  const activePucks = pucks.filter((p) => p.puckMeta);
  if (activePucks.length === 0) return;

  const sorted = [...activePucks].sort((a, b) => b.position.y - a.position.y);

  let target1: PuckBody;
  let target2: PuckBody;

  if (camera.mode === "first") {
    target1 = sorted[0];
    target2 = sorted[1] ?? sorted[0];
  } else {
    target1 = sorted[sorted.length - 1];
    target2 = sorted[sorted.length - 2] ?? target1;
  }

  const targetX = (target1.position.x + target2.position.x) / 2;
  const targetY = (target1.position.y + target2.position.y) / 2;

  // 결승선까지 잔여 거리 (선두 기준)
  const leadPuck = camera.mode === "first" ? target1 : target1;
  const goalDist = Math.abs(GOAL_LINE_Y - leadPuck.position.y);

  // 줌 + 타임스케일 계산
  let targetZoom = 1;
  let targetTimeScale = 1;

  if (goalDist < ZOOM_THRESHOLD) {
    const proximity = 1 - goalDist / ZOOM_THRESHOLD; // 0~1
    targetZoom = 1 + proximity * (MAX_ZOOM - 1);
    targetTimeScale = Math.max(MIN_TIME_SCALE, 1 - proximity * (1 - MIN_TIME_SCALE));
  }

  // 보간 적용
  camera.x = lerpFrame(camera.x, targetX);
  camera.y = lerpFrame(camera.y, targetY);
  camera.zoom = lerpFrame(camera.zoom, targetZoom);
  camera.timeScale = lerpFrame(camera.timeScale, targetTimeScale, 5);

  // 카메라가 줌인되면 보이는 영역이 작아지므로, 클램프 영역도 줌에 따라 조정
  const visibleHalfW = VIEWPORT.WIDTH / 2 / camera.zoom;
  const visibleHalfH = VIEWPORT.HEIGHT / 2 / camera.zoom;
  camera.x = Math.max(visibleHalfW, Math.min(STAGE.WIDTH - visibleHalfW, camera.x));
  camera.y = Math.max(visibleHalfH, Math.min(STAGE.HEIGHT - visibleHalfH, camera.y));
}
