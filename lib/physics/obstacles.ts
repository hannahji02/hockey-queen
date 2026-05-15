/**
 * 장애물 생성 모듈
 *
 * 장애물 종류:
 * 1. 코치 핀 (정적 원, 빨강)         x2
 * 2. 골대 (트랩 영역, 파랑 프레임)    x1
 * 3. 휘둘리는 스틱 (회전 부채꼴)      x2
 * 4. 스케이팅 선수 (양옆 반발 막대)    x2
 * 5. 페이스오프 깔때기 도트            x15
 *
 * 모든 장애물에 label 부여 → Phase 5에서 collision 이벤트로 특수 효과 적용 예정.
 */

import Matter from "matter-js";
import { STAGE } from "./constants";

export interface ObstacleSet {
  bodies: Matter.Body[];
  /** 각 프레임마다 호출되어 움직이는 장애물(스틱, 선수) 업데이트 */
  update: (timeMs: number) => void;
}

// ---------- 각 장애물 생성 함수 ----------

function createCoachPin(x: number, y: number, radius: number = 14): Matter.Body {
  return Matter.Bodies.circle(x, y, radius, {
    isStatic: true,
    label: "obstacle-coach",
    restitution: 0.7,
    friction: 0.02,
    render: {
      fillStyle: "#dc2626",
      strokeStyle: "#fca5a5",
      lineWidth: 2,
    },
  });
}

/**
 * 골대: ㄷ자 형태의 3면 정적 프레임
 * - 좌측 기둥, 우측 기둥, 상단 크로스바
 * - 퍽이 안으로 들어오면 잠시 갇혔다가 빠져나옴
 */
function createGoal(
  centerX: number,
  centerY: number,
  width: number = 80,
  height: number = 50
): Matter.Body[] {
  const thickness = 6;
  const half = width / 2;

  const leftPost = Matter.Bodies.rectangle(
    centerX - half,
    centerY,
    thickness,
    height,
    {
      isStatic: true,
      label: "obstacle-goal-post",
      restitution: 0.5,
      render: {
        fillStyle: "#3b82f6",
        strokeStyle: "#93c5fd",
        lineWidth: 2,
      },
    }
  );

  const rightPost = Matter.Bodies.rectangle(
    centerX + half,
    centerY,
    thickness,
    height,
    {
      isStatic: true,
      label: "obstacle-goal-post",
      restitution: 0.5,
      render: {
        fillStyle: "#3b82f6",
        strokeStyle: "#93c5fd",
        lineWidth: 2,
      },
    }
  );

  const crossbar = Matter.Bodies.rectangle(
    centerX,
    centerY - height / 2 + thickness / 2,
    width + thickness,
    thickness,
    {
      isStatic: true,
      label: "obstacle-goal-crossbar",
      restitution: 0.4,
      render: {
        fillStyle: "#3b82f6",
        strokeStyle: "#93c5fd",
        lineWidth: 2,
      },
    }
  );

  return [leftPost, rightPost, crossbar];
}

/**
 * 휘둘리는 스틱: 가는 직사각형이 한 끝을 중심으로 좌우 회전
 * - update에서 angle을 sine 함수로 업데이트
 */
interface SwingingStick {
  body: Matter.Body;
  pivotX: number;
  pivotY: number;
  length: number;
  baseAngle: number;
  amplitude: number;
  frequency: number;
  phaseOffset: number;
}

function createSwingingStick(
  pivotX: number,
  pivotY: number,
  length: number = 80,
  baseAngle: number = 0,
  amplitude: number = Math.PI / 3,
  frequency: number = 0.0015,
  phaseOffset: number = 0
): SwingingStick {
  // 스틱 본체: 직사각형, 한쪽 끝이 pivot
  const body = Matter.Bodies.rectangle(
    pivotX + (length / 2) * Math.cos(baseAngle),
    pivotY + (length / 2) * Math.sin(baseAngle),
    length,
    8,
    {
      isStatic: true,
      label: "obstacle-stick",
      restitution: 0.8,
      angle: baseAngle,
      render: {
        fillStyle: "#9ca3af",
        strokeStyle: "#e5e7eb",
        lineWidth: 1,
      },
    }
  );

  return {
    body,
    pivotX,
    pivotY,
    length,
    baseAngle,
    amplitude,
    frequency,
    phaseOffset,
  };
}

function updateStick(stick: SwingingStick, timeMs: number): void {
  const offset =
    stick.amplitude * Math.sin(timeMs * stick.frequency + stick.phaseOffset);
  const currentAngle = stick.baseAngle + offset;

  const cx = stick.pivotX + (stick.length / 2) * Math.cos(currentAngle);
  const cy = stick.pivotY + (stick.length / 2) * Math.sin(currentAngle);

  Matter.Body.setPosition(stick.body, { x: cx, y: cy });
  Matter.Body.setAngle(stick.body, currentAngle);
}

/**
 * 스케이팅 선수: 중앙 몸통(직사각형) + 양옆 날(얇은 막대)
 * - 좌우로 살짝 진동
 * - 날 부분 반발력 높음
 */
interface SkatingPlayer {
  bodies: Matter.Body[];
  baseX: number;
  baseY: number;
  amplitude: number;
  frequency: number;
  phaseOffset: number;
}

function createSkatingPlayer(
  baseX: number,
  baseY: number,
  amplitude: number = 30,
  frequency: number = 0.0008,
  phaseOffset: number = 0
): SkatingPlayer {
  const torsoW = 28;
  const torsoH = 40;
  const bladeW = 50;
  const bladeH = 4;

  const torso = Matter.Bodies.rectangle(baseX, baseY, torsoW, torsoH, {
    isStatic: true,
    label: "obstacle-player-torso",
    restitution: 0.5,
    render: {
      fillStyle: "#854d0e",
      strokeStyle: "#fcd34d",
      lineWidth: 1.5,
    },
  });

  // 좌우 스케이트 날 (반발력 높음)
  const leftBlade = Matter.Bodies.rectangle(
    baseX - torsoW / 2 - bladeW / 2 + 4,
    baseY + torsoH / 2 - 4,
    bladeW,
    bladeH,
    {
      isStatic: true,
      label: "obstacle-player-blade",
      restitution: 0.95,
      render: {
        fillStyle: "#e5e7eb",
        strokeStyle: "#ffffff",
        lineWidth: 1,
      },
    }
  );

  const rightBlade = Matter.Bodies.rectangle(
    baseX + torsoW / 2 + bladeW / 2 - 4,
    baseY + torsoH / 2 - 4,
    bladeW,
    bladeH,
    {
      isStatic: true,
      label: "obstacle-player-blade",
      restitution: 0.95,
      render: {
        fillStyle: "#e5e7eb",
        strokeStyle: "#ffffff",
        lineWidth: 1,
      },
    }
  );

  return {
    bodies: [torso, leftBlade, rightBlade],
    baseX,
    baseY,
    amplitude,
    frequency,
    phaseOffset,
  };
}

function updatePlayer(player: SkatingPlayer, timeMs: number): void {
  const offset =
    player.amplitude *
    Math.sin(timeMs * player.frequency + player.phaseOffset);

  player.bodies.forEach((body, idx) => {
    // 각 body의 baseX에 offset을 더함
    let baseX = player.baseX;
    if (idx === 1) baseX = player.baseX - 14 - 25 + 4; // left blade
    if (idx === 2) baseX = player.baseX + 14 + 25 - 4; // right blade

    const newX = baseX + offset;
    Matter.Body.setPosition(body, {
      x: newX,
      y: body.position.y,
    });
  });
}

function createFunnelDot(x: number, y: number, radius: number = 5): Matter.Body {
  return Matter.Bodies.circle(x, y, radius, {
    isStatic: true,
    label: "obstacle-funnel-dot",
    restitution: 0.6,
    friction: 0.01,
    render: {
      fillStyle: "#22d3ee",
      strokeStyle: "#67e8f9",
      lineWidth: 1,
    },
  });
}

// ---------- 전체 장애물 셋 생성 ----------

/**
 * 모든 장애물을 한번에 생성하고 update 함수를 묶어서 반환.
 *
 * 구성:
 * - 코치 핀 2개 (상단 분기 지점)
 * - 골대 1개 (중상단 중앙)
 * - 휘둘리는 스틱 2개 (중단 좌우)
 * - 스케이팅 선수 2개 (중하단 좌우)
 * - 페이스오프 깔때기 도트 15개 (결승선 직전, 좁아지는 V자 패턴)
 */
export function createObstacles(): ObstacleSet {
  const bodies: Matter.Body[] = [];
  const sticks: SwingingStick[] = [];
  const players: SkatingPlayer[] = [];

  const W = STAGE.WIDTH;
  const H = STAGE.HEIGHT;

  // === 1. 코치 핀 2개 (상단 분기) ===
  const coachPins = [
    createCoachPin(W * 0.35, H * 0.18, 16),
    createCoachPin(W * 0.65, H * 0.18, 16),
  ];
  bodies.push(...coachPins);

  // === 2. 골대 1개 (중상단 중앙) ===
  const goalParts = createGoal(W * 0.5, H * 0.35, 100, 60);
  bodies.push(...goalParts);

  // === 3. 휘둘리는 스틱 2개 (중단 좌우) ===
  const stick1 = createSwingingStick(
    W * 0.15,
    H * 0.52,
    100,
    0, // 수평 시작
    Math.PI / 3,
    0.0018,
    0
  );
  const stick2 = createSwingingStick(
    W * 0.85,
    H * 0.52,
    100,
    Math.PI, // 반대 방향
    Math.PI / 3,
    0.0018,
    Math.PI / 2 // 위상차
  );
  sticks.push(stick1, stick2);
  bodies.push(stick1.body, stick2.body);

  // === 4. 스케이팅 선수 2개 (중하단 좌우) ===
  const player1 = createSkatingPlayer(W * 0.3, H * 0.68, 30, 0.0009, 0);
  const player2 = createSkatingPlayer(W * 0.7, H * 0.68, 30, 0.0009, Math.PI);
  players.push(player1, player2);
  bodies.push(...player1.bodies, ...player2.bodies);

  // === 5. 페이스오프 깔때기 도트 15개 ===
  // 결승선(H-60) 위 약 200px 영역에 V자 깔때기 형태로 배치
  const funnelTop = H * 0.78;
  const funnelBottom = H - 80;
  const funnelRows = 5;
  // 각 행마다 도트 개수와 간격 조정 (좁아지는 형태)
  const rowConfigs = [
    { count: 5, spread: 0.85 }, // 가장 넓음
    { count: 4, spread: 0.65 },
    { count: 3, spread: 0.45 },
    { count: 2, spread: 0.28 },
    { count: 1, spread: 0.0 }, // 중앙 1개
  ];

  let dotCount = 0;
  rowConfigs.forEach((cfg, rowIdx) => {
    const y =
      funnelTop + ((funnelBottom - funnelTop) / (funnelRows - 1)) * rowIdx;
    if (cfg.count === 1) {
      bodies.push(createFunnelDot(W * 0.5, y, 6));
      dotCount++;
    } else {
      const totalSpan = W * cfg.spread;
      const startX = W * 0.5 - totalSpan / 2;
      const step = totalSpan / (cfg.count - 1);
      for (let i = 0; i < cfg.count; i++) {
        bodies.push(createFunnelDot(startX + step * i, y, 6));
        dotCount++;
      }
    }
  });

  // 총 5+4+3+2+1 = 15개 ✓

  const update = (timeMs: number) => {
    sticks.forEach((s) => updateStick(s, timeMs));
    players.forEach((p) => updatePlayer(p, timeMs));
  };

  return { bodies, update };
}
