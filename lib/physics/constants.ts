/**
 * 물리 시뮬레이션 상수
 */

// 캔버스 기준 크기 (실제는 비율 기반으로 동적 스케일)
export const STAGE = {
  WIDTH: 540,
  HEIGHT: 960, // 9:16 세로형
} as const;

// 퍽 크기/물리 속성
export const PUCK = {
  RADIUS: 22,
  RESTITUTION: 0.55, // 반발력 (얼음 위 미끄러짐)
  FRICTION: 0.005, // 표면 마찰
  FRICTION_AIR: 0.012, // 공기 저항 (낙하 속도 제어)
  DENSITY: 0.002,
} as const;

// 시작 위치 (상단)
export const SPAWN = {
  TOP_Y: 60,
  MARGIN_X: 50,
  JITTER: 8, // 미세 랜덤 오프셋
} as const;

// 결승선 위치 (하단)
export const GOAL_LINE_Y = STAGE.HEIGHT - 60;

// 네온 컬러 팔레트 (퍽 이름 색상)
export const NEON_COLORS = [
  "#22d3ee", // cyan
  "#e879f9", // magenta
  "#fde047", // yellow
  "#4ade80", // green
  "#f87171", // red
  "#a78bfa", // violet
  "#fb923c", // orange
  "#34d399", // emerald
  "#f472b6", // pink
  "#60a5fa", // blue
  "#fbbf24", // amber
  "#2dd4bf", // teal
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
