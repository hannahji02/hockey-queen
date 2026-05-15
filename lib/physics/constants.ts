/**
 * 물리 상수 (planck.js / Box2D 단위계)
 *
 * 레퍼런스 좌표계 차용:
 * - Stage Wheel of Fortune: 가로 약 26m, 세로 약 112m
 * - 퍽 직경: 0.5m
 * - 시작 위치: x=10.25, y=2
 * - 결승선 y: 111
 * - 줌인 시작 y: 106.75
 */

export const STAGE = {
  /** 좌측 보드 (벽) x */
  LEFT: 2,
  /** 우측 보드 (벽) x */
  RIGHT: 24,
  /** 상단 (스폰 영역 위) y */
  TOP: -5,
  /** 결승선 y */
  GOAL_Y: 111,
  /** 줌인 시작 y (이 이하로 내려오면 줌인) */
  ZOOM_Y: 106.75,
} as const;

export const PUCK = {
  /** 퍽 반지름 (m) */
  RADIUS: 0.25,
  /** 퍽 색상 가짓수 */
  COLOR_COUNT: 12,
} as const;

/** 카메라 줌 임계 거리 (m) - 결승선까지 이 이하 거리면 줌인 */
export const ZOOM_THRESHOLD = 4.25;

/** 픽셀당 미터 (초기 줌 기준) */
export const INITIAL_ZOOM = 12;

/** 캔버스 크기 기준 (실제 표시는 컨테이너에 맞춰 스케일) */
export const VIEWPORT = {
  WIDTH: 720,
  HEIGHT: 405,
} as const;

/** 퍽 컬러 팔레트 (HSL hue 값으로 동적 생성하므로 사용 안 함 - 호환용) */
export const NEON_COLORS = [
  "#0891b2",
  "#c026d3",
  "#ca8a04",
  "#16a34a",
  "#dc2626",
  "#7c3aed",
  "#ea580c",
  "#0d9488",
  "#db2777",
  "#2563eb",
  "#d97706",
  "#0e7490",
] as const;
