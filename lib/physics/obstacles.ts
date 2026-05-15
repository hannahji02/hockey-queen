/**
 * 장애물 생성 모듈 (Phase 4.5 - 긴 트랙 대응)
 *
 * 트랙 구성 (스테이지 720x2400):
 * - Y 80~480 (구간 1: 출발 + 좁은 통로 + 코치 핀)
 * - Y 480~960 (구간 2: 사선 슬로프 분기 + 골대)
 * - Y 960~1440 (구간 3: 휘둘리는 스틱 영역)
 * - Y 1440~1920 (구간 4: 스케이팅 선수 + 지그재그)
 * - Y 1920~2320 (구간 5: 페이스오프 깔때기 + 결승선)
 *
 * 디자인 컨셉: 네온 라인 스타일 (외곽선만, 채움 없음)
 */

import Matter from "matter-js";
import { STAGE } from "./constants";

export interface ObstacleSet {
  bodies: Matter.Body[];
  update: (timeMs: number) => void;
}

// ---------- 헬퍼: 네온 라인 스타일 옵션 ----------

const neonWhite = {
  fillStyle: "transparent",
  strokeStyle: "#ffffff",
  lineWidth: 2,
};

const neonCyan = {
  fillStyle: "transparent",
  strokeStyle: "#22d3ee",
  lineWidth: 2,
};

const neonRed = {
  fillStyle: "transparent",
  strokeStyle: "#f87171",
  lineWidth: 2.5,
};

const neonBlue = {
  fillStyle: "transparent",
  strokeStyle: "#60a5fa",
  lineWidth: 2,
};

const neonOrange = {
  fillStyle: "transparent",
  strokeStyle: "#fb923c",
  lineWidth: 2,
};

const solidNeonCyan = {
  fillStyle: "#22d3ee",
  strokeStyle: "#67e8f9",
  lineWidth: 1,
};

// ---------- 구간 1: 출발 + 좁은 통로 + 코치 핀 ----------

function buildSection1(W: number): Matter.Body[] {
  const bodies: Matter.Body[] = [];

  // 출발 직후 좁아지는 통로 양쪽 (Y 150~300)
  const leftFunnel = Matter.Bodies.fromVertices(
    W * 0.15,
    220,
    [
      [
        { x: 0, y: 0 },
        { x: 60, y: 0 },
        { x: 80, y: 100 },
        { x: 80, y: 150 },
        { x: 0, y: 150 },
      ],
    ],
    { isStatic: true, label: "wall-funnel", render: neonWhite }
  );
  const rightFunnel = Matter.Bodies.fromVertices(
    W * 0.85,
    220,
    [
      [
        { x: 0, y: 0 },
        { x: 60, y: 0 },
        { x: 60, y: 150 },
        { x: -20, y: 150 },
        { x: -20, y: 100 },
      ],
    ],
    { isStatic: true, label: "wall-funnel", render: neonWhite }
  );

  if (leftFunnel) bodies.push(leftFunnel);
  if (rightFunnel) bodies.push(rightFunnel);

  // 코치 핀 2개 (Y 380~420)
  bodies.push(
    Matter.Bodies.circle(W * 0.35, 400, 18, {
      isStatic: true,
      label: "obstacle-coach",
      restitution: 0.75,
      render: neonRed,
    }),
    Matter.Bodies.circle(W * 0.65, 400, 18, {
      isStatic: true,
      label: "obstacle-coach",
      restitution: 0.75,
      render: neonRed,
    })
  );

  return bodies;
}

// ---------- 구간 2: 사선 슬로프 + 골대 ----------

function buildSection2(W: number): Matter.Body[] {
  const bodies: Matter.Body[] = [];

  // 사선 슬로프 좌측 (Y 540~700) - 우측 아래로 기울어짐
  const slopeLeft = Matter.Bodies.rectangle(W * 0.22, 620, 240, 8, {
    isStatic: true,
    angle: Math.PI / 8, // 22.5도
    label: "wall-slope",
    restitution: 0.5,
    render: neonWhite,
  });

  // 사선 슬로프 우측 (Y 540~700) - 좌측 아래로 기울어짐
  const slopeRight = Matter.Bodies.rectangle(W * 0.78, 620, 240, 8, {
    isStatic: true,
    angle: -Math.PI / 8,
    label: "wall-slope",
    restitution: 0.5,
    render: neonWhite,
  });

  bodies.push(slopeLeft, slopeRight);

  // 골대 (Y 800~880) - ㄷ자 구조
  const goalX = W * 0.5;
  const goalY = 840;
  const goalW = 120;
  const goalH = 70;
  const thickness = 6;

  bodies.push(
    Matter.Bodies.rectangle(goalX - goalW / 2, goalY, thickness, goalH, {
      isStatic: true,
      label: "obstacle-goal-post",
      restitution: 0.6,
      render: neonBlue,
    }),
    Matter.Bodies.rectangle(goalX + goalW / 2, goalY, thickness, goalH, {
      isStatic: true,
      label: "obstacle-goal-post",
      restitution: 0.6,
      render: neonBlue,
    }),
    Matter.Bodies.rectangle(goalX, goalY - goalH / 2, goalW, thickness, {
      isStatic: true,
      label: "obstacle-goal-crossbar",
      restitution: 0.4,
      render: neonBlue,
    })
  );

  return bodies;
}

// ---------- 구간 3: 휘둘리는 스틱 ----------

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

function makeStick(
  pivotX: number,
  pivotY: number,
  length: number,
  baseAngle: number,
  phaseOffset: number
): SwingingStick {
  const body = Matter.Bodies.rectangle(
    pivotX + (length / 2) * Math.cos(baseAngle),
    pivotY + (length / 2) * Math.sin(baseAngle),
    length,
    10,
    {
      isStatic: true,
      label: "obstacle-stick",
      restitution: 0.85,
      angle: baseAngle,
      render: neonOrange,
    }
  );

  return {
    body,
    pivotX,
    pivotY,
    length,
    baseAngle,
    amplitude: Math.PI / 2.5,
    frequency: 0.0018,
    phaseOffset,
  };
}

function updateStick(s: SwingingStick, t: number) {
  const offset = s.amplitude * Math.sin(t * s.frequency + s.phaseOffset);
  const ang = s.baseAngle + offset;
  Matter.Body.setPosition(s.body, {
    x: s.pivotX + (s.length / 2) * Math.cos(ang),
    y: s.pivotY + (s.length / 2) * Math.sin(ang),
  });
  Matter.Body.setAngle(s.body, ang);
}

function buildSection3(W: number): {
  bodies: Matter.Body[];
  sticks: SwingingStick[];
} {
  const sticks: SwingingStick[] = [];

  // 좌측 스틱 (Y 1080)
  const s1 = makeStick(W * 0.12, 1080, 130, 0, 0);
  // 우측 스틱 (Y 1080)
  const s2 = makeStick(W * 0.88, 1080, 130, Math.PI, Math.PI / 2);
  // 중앙 위쪽 스틱 (Y 1280) - 위에서 휘둘림
  const s3 = makeStick(W * 0.5, 1280, 110, -Math.PI / 2, Math.PI / 3);

  sticks.push(s1, s2, s3);

  return {
    bodies: sticks.map((s) => s.body),
    sticks,
  };
}

// ---------- 구간 4: 스케이팅 선수 + 지그재그 ----------

interface SkatingPlayer {
  bodies: Matter.Body[];
  baseX: number;
  baseY: number;
  amplitude: number;
  frequency: number;
  phaseOffset: number;
}

function makePlayer(
  baseX: number,
  baseY: number,
  phaseOffset: number
): SkatingPlayer {
  const torsoW = 32;
  const torsoH = 44;
  const bladeW = 56;
  const bladeH = 5;

  const torso = Matter.Bodies.rectangle(baseX, baseY, torsoW, torsoH, {
    isStatic: true,
    label: "obstacle-player-torso",
    restitution: 0.55,
    render: {
      fillStyle: "transparent",
      strokeStyle: "#fcd34d",
      lineWidth: 2,
    },
  });

  const leftBlade = Matter.Bodies.rectangle(
    baseX - torsoW / 2 - bladeW / 2 + 5,
    baseY + torsoH / 2 - 4,
    bladeW,
    bladeH,
    {
      isStatic: true,
      label: "obstacle-player-blade",
      restitution: 0.95,
      render: {
        fillStyle: "#ffffff",
        strokeStyle: "#ffffff",
        lineWidth: 1,
      },
    }
  );

  const rightBlade = Matter.Bodies.rectangle(
    baseX + torsoW / 2 + bladeW / 2 - 5,
    baseY + torsoH / 2 - 4,
    bladeW,
    bladeH,
    {
      isStatic: true,
      label: "obstacle-player-blade",
      restitution: 0.95,
      render: {
        fillStyle: "#ffffff",
        strokeStyle: "#ffffff",
        lineWidth: 1,
      },
    }
  );

  return {
    bodies: [torso, leftBlade, rightBlade],
    baseX,
    baseY,
    amplitude: 40,
    frequency: 0.0009,
    phaseOffset,
  };
}

function updatePlayer(p: SkatingPlayer, t: number) {
  const offset = p.amplitude * Math.sin(t * p.frequency + p.phaseOffset);
  const torsoW = 32;
  const bladeW = 56;

  // 몸통
  Matter.Body.setPosition(p.bodies[0], {
    x: p.baseX + offset,
    y: p.bodies[0].position.y,
  });
  // 좌측 날
  Matter.Body.setPosition(p.bodies[1], {
    x: p.baseX - torsoW / 2 - bladeW / 2 + 5 + offset,
    y: p.bodies[1].position.y,
  });
  // 우측 날
  Matter.Body.setPosition(p.bodies[2], {
    x: p.baseX + torsoW / 2 + bladeW / 2 - 5 + offset,
    y: p.bodies[2].position.y,
  });
}

function buildSection4(W: number): {
  bodies: Matter.Body[];
  players: SkatingPlayer[];
} {
  const bodies: Matter.Body[] = [];
  const players: SkatingPlayer[] = [];

  // 스케이팅 선수 2명 (Y 1560, 1760)
  const p1 = makePlayer(W * 0.3, 1560, 0);
  const p2 = makePlayer(W * 0.7, 1760, Math.PI);
  players.push(p1, p2);
  bodies.push(...p1.bodies, ...p2.bodies);

  // 지그재그 벽 사이사이 (Y 1640, 1840)
  // 작은 사선 막대 4개 - 좌우 교차
  bodies.push(
    Matter.Bodies.rectangle(W * 0.55, 1640, 90, 4, {
      isStatic: true,
      angle: Math.PI / 10,
      label: "wall-zigzag",
      render: neonCyan,
    }),
    Matter.Bodies.rectangle(W * 0.45, 1840, 90, 4, {
      isStatic: true,
      angle: -Math.PI / 10,
      label: "wall-zigzag",
      render: neonCyan,
    })
  );

  return { bodies, players };
}

// ---------- 구간 5: 페이스오프 깔때기 ----------

function buildSection5(W: number, H: number): Matter.Body[] {
  const bodies: Matter.Body[] = [];

  // 깔때기 도트 15개 (V자, 5→4→3→2→1)
  const funnelTop = H * 0.84;
  const funnelBottom = H - 130;
  const rows = 5;
  const rowConfigs = [
    { count: 5, spread: 0.78 },
    { count: 4, spread: 0.6 },
    { count: 3, spread: 0.42 },
    { count: 2, spread: 0.25 },
    { count: 1, spread: 0.0 },
  ];

  rowConfigs.forEach((cfg, rowIdx) => {
    const y = funnelTop + ((funnelBottom - funnelTop) / (rows - 1)) * rowIdx;
    if (cfg.count === 1) {
      bodies.push(
        Matter.Bodies.circle(W * 0.5, y, 8, {
          isStatic: true,
          label: "obstacle-funnel-dot",
          restitution: 0.65,
          render: solidNeonCyan,
        })
      );
    } else {
      const totalSpan = W * cfg.spread;
      const startX = W * 0.5 - totalSpan / 2;
      const step = totalSpan / (cfg.count - 1);
      for (let i = 0; i < cfg.count; i++) {
        bodies.push(
          Matter.Bodies.circle(startX + step * i, y, 8, {
            isStatic: true,
            label: "obstacle-funnel-dot",
            restitution: 0.65,
            render: solidNeonCyan,
          })
        );
      }
    }
  });

  return bodies;
}

// ---------- 전체 조립 ----------

export function createObstacles(): ObstacleSet {
  const bodies: Matter.Body[] = [];
  const sticks: SwingingStick[] = [];
  const players: SkatingPlayer[] = [];

  const W = STAGE.WIDTH;
  const H = STAGE.HEIGHT;

  // 구간 1
  bodies.push(...buildSection1(W));

  // 구간 2
  bodies.push(...buildSection2(W));

  // 구간 3
  const s3 = buildSection3(W);
  bodies.push(...s3.bodies);
  sticks.push(...s3.sticks);

  // 구간 4
  const s4 = buildSection4(W);
  bodies.push(...s4.bodies);
  players.push(...s4.players);

  // 구간 5
  bodies.push(...buildSection5(W, H));

  const update = (t: number) => {
    sticks.forEach((s) => updateStick(s, t));
    players.forEach((p) => updatePlayer(p, t));
  };

  return { bodies, update };
}
