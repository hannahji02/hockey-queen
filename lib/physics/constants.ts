/**
 * 물리 시뮬레이션 상수
 */

// 캔버스 기준 크기 (실제는 비율 기반으로 동적 스케일)
// 가로 720, 세로 2400 - 트랙이 매우 김
export const STAGE = {
  WIDTH: 720,
  HEIGHT: 2400,
  ASPECT_RATIO: 720 / 2400,
} as const;

// 카메라 뷰포트 크기 (퍽 추적 시 보이는 영역)
// 16:9 비율로 화면 가로 풀필을 가정한 뷰포트
export const VIEWPORT = {
  WIDTH: 720,
  HEIGHT: 405, // 16:9
} as const;

// 퍽 크기/물리 속성
export const PUCK = {
  RADIUS: 26, // 카메라 줌 시 잘 보이도록 약간 키움
  RESTITUTION: 0.55,
  FRICTION: 0.005,
  FRICTION_AIR: 0.012,
  DENSITY: 0.002,
} as const;

// 시작 위치 (상단)
export const SPAWN = {
  TOP_Y: 80,
  MARGIN_X: 70,
  JITTER: 10,
} as const;

// 결승선 위치 (하단)
export const GOAL_LINE_Y = STAGE.HEIGHT - 80;

// 카메라 줌인 임계 거리 (결승선까지 남은 거리)
// 이 거리 이하로 들어오면 줌인 + 슬로우모션 시작
export const ZOOM_THRESHOLD = 700;
export const MAX_ZOOM = 3;
export const MIN_TIME_SCALE = 0.3;

// 네온 컬러 팔레트 (퍽 이름 색상) - 흰 배경에서도 잘 보이도록 진한 색 위주
export const NEON_COLORS = [
  "#0891b2", // cyan-dark
  "#c026d3", // magenta-dark
  "#ca8a04", // yellow-dark
  "#16a34a", // green-dark
  "#dc2626", // red-dark
  "#7c3aed", // violet-dark
  "#ea580c", // orange-dark
  "#0d9488", // teal-dark
  "#db2777", // pink-dark
  "#2563eb", // blue-dark
  "#d97706", // amber-dark
  "#0e7490", // teal-darker
] as const;

/**
 * 인덱스 기반으로 균등하게 컬러 분배 (인접 인원끼리 비슷한 색 방지 목적으로 셔플)
 */
export function pickColor(index: number): string {
  const shuffled = [
    0, 6, 1, 7, 2, 8, 3, 9, 4, 10, 5, 11,
  ];
  return NEON_COLORS[shuffled[index % shuffled.length]];
}
