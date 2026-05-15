/**
 * 레퍼런스 Wheel of Fortune 맵
 *
 * 출처: lazygyu/roulette - src/data/maps.ts
 * 라이선스: MIT
 *
 * 좌표는 Box2D 미터 단위.
 * planck.js Body로 변환되어 world에 추가됨.
 */

export type ShapeDef =
  | {
      type: "polyline";
      points: [number, number][];
    }
  | {
      type: "box";
      width: number;
      height: number;
      rotation: number; // degrees
    };

export interface EntityDef {
  type: "static" | "kinematic";
  position: { x: number; y: number };
  shape: ShapeDef;
  props: {
    density: number;
    angularVelocity: number;
    restitution: number;
  };
}

/**
 * Wheel of Fortune 맵 정의
 */
export const WHEEL_OF_FORTUNE: EntityDef[] = [
  // ===== 메인 외곽 윤곽 (좌측) =====
  {
    position: { x: 0, y: 0 },
    shape: {
      type: "polyline",
      points: [
        [16.5, -300],
        [9.25, -300],
        [9.25, 8.5],
        [2, 19.25],
        [2, 26],
        [9.75, 30],
        [9.75, 33.5],
        [1.25, 41],
        [1.25, 53.75],
        [8.25, 58.75],
        [8.25, 63],
        [9.25, 64],
        [8.25, 65],
        [8.25, 99.25],
        [15.1, 106.75],
        [15.1, 111.75],
      ],
    },
    type: "static",
    props: { density: 1, angularVelocity: 0, restitution: 0 },
  },
  // ===== 메인 외곽 윤곽 (우측) =====
  {
    type: "static",
    position: { x: 0, y: 0 },
    props: { density: 1, angularVelocity: 0, restitution: 0 },
    shape: {
      type: "polyline",
      points: [
        [16.5, -300],
        [16.5, 9.25],
        [9.5, 20],
        [9.5, 22.5],
        [17.5, 26],
        [17.5, 33.5],
        [24, 38.5],
        [19, 45.5],
        [19, 55.5],
        [24, 59.25],
        [24, 63],
        [23, 64],
        [24, 65],
        [24, 100.5],
        [16, 106.75],
        [16, 111.75],
      ],
    },
  },
  // ===== 좌측 좁은 통로 내부 =====
  {
    type: "static",
    position: { x: 0, y: 0 },
    props: { density: 1, angularVelocity: 0, restitution: 0 },
    shape: {
      type: "polyline",
      points: [
        [12.75, 37.5],
        [7, 43.5],
        [7, 49.75],
        [12.75, 53.75],
        [12.75, 37.5],
      ],
    },
  },
  // ===== 우측 좁은 통로 내부 (작은 삼각형) =====
  {
    type: "static",
    position: { x: 0, y: 0 },
    props: { density: 1, angularVelocity: 0, restitution: 0 },
    shape: {
      type: "polyline",
      points: [
        [14.75, 37.5],
        [14.75, 43],
        [17.5, 40.25],
        [14.75, 37.5],
      ],
    },
  },
  // ===== 다이아몬드 핀들 (Y 28~32) =====
  {
    position: { x: 15.5, y: 30.0 },
    shape: { type: "box", width: 0.2, height: 0.2, rotation: -45 },
    type: "static",
    props: { density: 1, angularVelocity: 0, restitution: 1 },
  },
  {
    position: { x: 15.5, y: 32 },
    type: "static",
    shape: { type: "box", width: 0.2, height: 0.2, rotation: -45 },
    props: { density: 1, angularVelocity: 0, restitution: 0 },
  },
  {
    position: { x: 15.5, y: 28 },
    type: "static",
    shape: { type: "box", width: 0.2, height: 0.2, rotation: -45 },
    props: { density: 1, angularVelocity: 0, restitution: 0 },
  },
  {
    position: { x: 12.5, y: 30 },
    type: "static",
    shape: { type: "box", width: 0.2, height: 0.2, rotation: -45 },
    props: { density: 1, angularVelocity: 0, restitution: 0 },
  },
  {
    position: { x: 12.5, y: 32 },
    type: "static",
    shape: { type: "box", width: 0.2, height: 0.2, rotation: -45 },
    props: { density: 1, angularVelocity: 0, restitution: 0 },
  },
  {
    position: { x: 12.5, y: 28 },
    type: "static",
    shape: { type: "box", width: 0.2, height: 0.2, rotation: -45 },
    props: { density: 1, angularVelocity: 0, restitution: 0 },
  },
  // ===== 사선 핀 행 (Y 66.6) =====
  ...[9.4, 11.3, 13.2, 15.1, 17, 18.9, 20.7, 22.7].map(
    (x): EntityDef => ({
      position: { x, y: 66.6 },
      type: "static",
      shape: { type: "box", width: 0.6, height: 0.1, rotation: 45 },
      props: { density: 1, angularVelocity: 0, restitution: 0 },
    })
  ),
  // ===== 반대 사선 핀 행 (Y 69.1) =====
  ...[9.4, 11.3, 13.2, 15.1, 17, 18.9, 20.7, 22.7].map(
    (x): EntityDef => ({
      position: { x, y: 69.1 },
      type: "static",
      shape: { type: "box", width: 0.6, height: 0.1, rotation: -45 },
      props: { density: 1, angularVelocity: 0, restitution: 0 },
    })
  ),
  // ===== 다이아몬드 핀필드 (Y 92) =====
  ...[9.5, 12.75, 16, 19.25, 22.5].map(
    (x): EntityDef => ({
      position: { x, y: 92 },
      type: "static",
      shape: { type: "box", width: 0.25, height: 0.25, rotation: 45 },
      props: { density: 1, angularVelocity: 0, restitution: 0 },
    })
  ),
  // ===== 다이아몬드 핀필드 (Y 95) =====
  ...[11, 14.25, 17.5, 20.75].map(
    (x): EntityDef => ({
      position: { x, y: 95 },
      type: "static",
      shape: { type: "box", width: 0.25, height: 0.25, rotation: 45 },
      props: { density: 1, angularVelocity: 0, restitution: 0 },
    })
  ),
  // ===== 다이아몬드 핀필드 (Y 98) =====
  ...[9.5, 12.75, 16, 19.25, 22.5].map(
    (x): EntityDef => ({
      position: { x, y: 98 },
      type: "static",
      shape: { type: "box", width: 0.25, height: 0.25, rotation: 45 },
      props: { density: 1, angularVelocity: 0, restitution: 0 },
    })
  ),
  // ===== 회전 막대 5개 (Y 75) =====
  {
    position: { x: 8, y: 75 },
    type: "kinematic",
    shape: { type: "box", width: 2, height: 0.1, rotation: 0 },
    props: { density: 1, angularVelocity: 3.5, restitution: 0 },
  },
  {
    position: { x: 12, y: 75 },
    type: "kinematic",
    shape: { type: "box", width: 2, height: 0.1, rotation: 0 },
    props: { density: 1, angularVelocity: -3.5, restitution: 0 },
  },
  {
    position: { x: 16, y: 75 },
    type: "kinematic",
    shape: { type: "box", width: 2, height: 0.1, rotation: 0 },
    props: { density: 1, angularVelocity: 3.5, restitution: 0 },
  },
  {
    position: { x: 20, y: 75 },
    type: "kinematic",
    shape: { type: "box", width: 2, height: 0.1, rotation: 0 },
    props: { density: 1, angularVelocity: -3.5, restitution: 0 },
  },
  {
    position: { x: 24, y: 75 },
    type: "kinematic",
    shape: { type: "box", width: 2, height: 0.1, rotation: 0 },
    props: { density: 1, angularVelocity: 3.5, restitution: 0 },
  },
  // ===== 결승선 직전 회전 막대 =====
  {
    position: { x: 14, y: 106.75 },
    type: "kinematic",
    shape: { type: "box", width: 2, height: 0.1, rotation: 0 },
    props: { density: 1, angularVelocity: -1.2, restitution: 0 },
  },
];
