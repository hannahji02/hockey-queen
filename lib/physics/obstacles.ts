/**
 * 장애물 생성 모듈 v3
 *
 * 흰색 아이스링크 배경 대응:
 * - 진한 색상 (네이비/빨강/파랑/주황) 사용
 * - 검은색 윤곽 강조
 *
 * 트랙 구성 (720×2400, 5구간):
 * - 구간 1 (Y 80~480): 출발 + 사선 통로 + 코치 핀
 * - 구간 2 (Y 480~960): 회전 막대 영역 + 골대
 * - 구간 3 (Y 960~1440): 휘둘리는 스틱 + 튕기는 원 핀
 * - 구간 4 (Y 1440~1920): 스케이팅 선수 + 추가 회전 막대
 * - 구간 5 (Y 1920~2320): 페이스오프 깔때기 + 결승선
 */

import Matter from "matter-js";
import { STAGE } from "./constants";

export interface ObstacleSet {
  bodies: Matter.Body[];
  update: (timeMs: number) => void;
}

// ---------- 색상 스타일 (흰 배경용) ----------

const navyLine = {
  fillStyle: "transparent",
  strokeStyle: "#1e293b", // slate-800
  lineWidth: 3,
};

const redLine = {
  fillStyle: "transparent",
  strokeStyle: "#dc2626",
  lineWidth: 3,
};

const blueLine = {
  fillStyle: "transparent",
  strokeStyle: "#2563eb",
  lineWidth: 3,
};

const orangeFill = {
  fillStyle: "#ea580c",
  strokeStyle: "#9a3412",
  lineWidth: 2,
};

const cyanFill = {
  fillStyle: "#0891b2",
  strokeStyle: "#0e7490",
  lineWidth: 2,
};

const yellowFill = {
  fillStyle: "#ca8a04",
  strokeStyle: "#854d0e",
  lineWidth: 2,
};

// ---------- 구간 1: 출발 + 사선 통로 + 코치 핀 ----------

function buildSection1(W: number): Matter.Body[] {
  const bodies: Matter.Body[] = [];

  // 좌측 사선 통로 (Y 150~330) - 우측 위로 기울어짐
  const leftSlope = Matter.Bodies.rectangle(W * 0.18, 240, 220, 8, {
    isStatic: true,
    angle: Math.PI / 7, // 약 25도
    label: "wall-slope",
    restitution: 0.6,
    render: navyLine,
  });

  // 우측 사선 통로
  const rightSlope = Matter.Bodies.rectangle(W * 0.82, 240, 220, 8, {
    isStatic: true,
    angle: -Math.PI / 7,
    label: "wall-slope",
    restitution: 0.6,
    render: navyLine,
  });

  bodies.push(leftSlope, rightSlope);

  // 코치 핀 2개 (Y 400~430)
  bodies.push(
    Matter.Bodies.circle(W * 0.35, 410, 20, {
      isStatic: true,
      label: "obstacle-coach",
      restitution: 0.9,
      render: {
        fillStyle: "#dc2626",
        strokeStyle: "#7f1d1d",
        lineWidth: 3,
      },
    }),
    Matter.Bodies.circle(W * 0.65, 410, 20, {
      isStatic: true,
      label: "obstacle-coach",
      restitution: 0.9,
      render: {
        fillStyle: "#dc2626",
        strokeStyle: "#7f1d1d",
        lineWidth: 3,
      },
    })
  );

  return bodies;
}

// ---------- 구간 2: 회전 막대 + 골대 ----------

interface RotatingBar {
  body: Matter.Body;
  angularVelocity: number;
}

function makeRotatingBar(
  x: number,
  y: number,
  width: number,
  angularVelocity: number,
  color: { fillStyle: string; strokeStyle: string; lineWidth: number }
): RotatingBar {
  const body = Matter.Bodies.rectangle(x, y, width, 10, {
    isStatic: true,
    label: "obstacle-rotating-bar",
    restitution: 0.8,
    render: color,
  });
  return { body, angularVelocity };
}

function updateRotatingBar(bar: RotatingBar, deltaMs: number): void {
  const deltaAngle = bar.angularVelocity * (deltaMs / 1000);
  Matter.Body.setAngle(bar.body, bar.body.angle + deltaAngle);
}

function buildSection2(W: number): {
  bodies: Matter.Body[];
  rotatingBars: RotatingBar[];
} {
  const bodies: Matter.Body[] = [];
  const rotatingBars: RotatingBar[] = [];

  // 회전 막대 3개 (Y 580, 680, 780) - 좌우 교차 회전
  const bar1 = makeRotatingBar(W * 0.3, 580, 130, 2.0, orangeFill);
  const bar2 = makeRotatingBar(W * 0.7, 680, 130, -2.0, cyanFill);
  const bar3 = makeRotatingBar(W * 0.5, 780, 140, 1.5, yellowFill);

  rotatingBars.push(bar1, bar2, bar3);
  bodies.push(bar1.body, bar2.body, bar3.body);

  // 골대 (Y 880) - ㄷ자 구조
  const goalX = W * 0.5;
  const goalY = 880;
  const goalW = 130;
  const goalH = 70;
  const thickness = 8;

  bodies.push(
    Matter.Bodies.rectangle(goalX - goalW / 2, goalY, thickness, goalH, {
      isStatic: true,
      label: "obstacle-goal-post",
      restitution: 0.6,
      render: blueLine,
    }),
    Matter.Bodies.rectangle(goalX + goalW / 2, goalY, thickness, goalH, {
      isStatic: true,
      label: "obstacle-goal-post",
      restitution: 0.6,
      render: blueLine,
    }),
    Matter.Bodies.rectangle(goalX, goalY - goalH / 2, goalW, thickness, {
      isStatic: true,
      label: "obstacle-goal-crossbar",
      restitution: 0.5,
      render: blueLine,
    })
  );

  return { bodies, rotatingBars };
}

// ---------- 구간 3: 스틱 + 튕기는 원 핀 ----------

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
    12,
    {
      isStatic: true,
      label: "obstacle-stick",
      restitution: 0.85,
      angle: baseAngle,
      render: {
        fillStyle: "#9a3412",
        strokeStyle: "#7c2d12",
        lineWidth: 2,
      },
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

  // 좌우 스틱 (Y 1060)
  sticks.push(
    makeStick(W * 0.1, 1060, 140, 0, 0),
    makeStick(W * 0.9, 1060, 140, Math.PI, Math.PI / 2)
  );
  // 중앙 스틱 (Y 1280)
  sticks.push(makeStick(W * 0.5, 1280, 120, -Math.PI / 2, Math.PI / 3));

  const bodies: Matter.Body[] = sticks.map((s) => s.body);

  // 튕기는 원 핀 9개 (Y 1170~1230, 3x3 그리드)
  // 강한 반발력으로 퍽이 화려하게 튕김
  const bouncePinPositions = [
    { x: W * 0.3, y: 1170 },
    { x: W * 0.5, y: 1170 },
    { x: W * 0.7, y: 1170 },
    { x: W * 0.2, y: 1230 },
    { x: W * 0.4, y: 1230 },
    { x: W * 0.6, y: 1230 },
    { x: W * 0.8, y: 1230 },
  ];

  bouncePinPositions.forEach((pos) => {
    bodies.push(
      Matter.Bodies.circle(pos.x, pos.y, 12, {
        isStatic: true,
        label: "obstacle-bounce-pin",
        restitution: 1.3, // 매우 강한 반발
        render: {
          fillStyle: "#fbbf24",
          strokeStyle: "#854d0e",
          lineWidth: 2,
        },
      })
    );
  });

  return { bodies, sticks };
}

// ---------- 구간 4: 스케이팅 선수 + 추가 회전 막대 ----------

interface SkatingPlayer {
  bodies: Matter.Body[];
  baseX: number;
  baseY: number;
  amplitude: number;
  frequency: number;
  phaseOffset: number;
}

function makePlayer(baseX: number, baseY: number, phaseOffset: number): SkatingPlayer {
  const torsoW = 34;
  const torsoH = 46;
  const bladeW = 60;
  const bladeH = 6;

  const torso = Matter.Bodies.rectangle(baseX, baseY, torsoW, torsoH, {
    isStatic: true,
    label: "obstacle-player-torso",
    restitution: 0.55,
    render: {
      fillStyle: "#854d0e",
      strokeStyle: "#451a03",
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
      restitution: 0.98,
      render: {
        fillStyle: "#475569",
        strokeStyle: "#1e293b",
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
      restitution: 0.98,
      render: {
        fillStyle: "#475569",
        strokeStyle: "#1e293b",
        lineWidth: 1,
      },
    }
  );

  return {
    bodies: [torso, leftBlade, rightBlade],
    baseX,
    baseY,
    amplitude: 50,
    frequency: 0.001,
    phaseOffset,
  };
}

function updatePlayer(p: SkatingPlayer, t: number) {
  const offset = p.amplitude * Math.sin(t * p.frequency + p.phaseOffset);
  const torsoW = 34;
  const bladeW = 60;

  Matter.Body.setPosition(p.bodies[0], {
    x: p.baseX + offset,
    y: p.bodies[0].position.y,
  });
  Matter.Body.setPosition(p.bodies[1], {
    x: p.baseX - torsoW / 2 - bladeW / 2 + 5 + offset,
    y: p.bodies[1].position.y,
  });
  Matter.Body.setPosition(p.bodies[2], {
    x: p.baseX + torsoW / 2 + bladeW / 2 - 5 + offset,
    y: p.bodies[2].position.y,
  });
}

function buildSection4(W: number): {
  bodies: Matter.Body[];
  players: SkatingPlayer[];
  rotatingBars: RotatingBar[];
} {
  const bodies: Matter.Body[] = [];
  const players: SkatingPlayer[] = [];
  const rotatingBars: RotatingBar[] = [];

  // 스케이팅 선수 2명
  const p1 = makePlayer(W * 0.3, 1560, 0);
  const p2 = makePlayer(W * 0.7, 1760, Math.PI);
  players.push(p1, p2);
  bodies.push(...p1.bodies, ...p2.bodies);

  // 추가 회전 막대 2개 (Y 1660)
  const bar1 = makeRotatingBar(W * 0.2, 1660, 100, 3.0, cyanFill);
  const bar2 = makeRotatingBar(W * 0.8, 1660, 100, -3.0, orangeFill);
  rotatingBars.push(bar1, bar2);
  bodies.push(bar1.body, bar2.body);

  // 45도 회전 다이아몬드 핀 5개 (Y 1860)
  for (let i = 0; i < 5; i++) {
    bodies.push(
      Matter.Bodies.rectangle(W * (0.15 + i * 0.175), 1860, 16, 16, {
        isStatic: true,
        angle: Math.PI / 4, // 45도
        label: "obstacle-diamond-pin",
        restitution: 0.9,
        render: {
          fillStyle: "#1e293b",
          strokeStyle: "#0f172a",
          lineWidth: 1.5,
        },
      })
    );
  }

  return { bodies, players, rotatingBars };
}

// ---------- 구간 5: 페이스오프 깔때기 ----------

function buildSection5(W: number, H: number): Matter.Body[] {
  const bodies: Matter.Body[] = [];

  // 깔때기 도트 15개 (V자)
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
        Matter.Bodies.circle(W * 0.5, y, 9, {
          isStatic: true,
          label: "obstacle-funnel-dot",
          restitution: 0.75,
          render: {
            fillStyle: "#1e3a8a",
            strokeStyle: "#172554",
            lineWidth: 2,
          },
        })
      );
    } else {
      const totalSpan = W * cfg.spread;
      const startX = W * 0.5 - totalSpan / 2;
      const step = totalSpan / (cfg.count - 1);
      for (let i = 0; i < cfg.count; i++) {
        bodies.push(
          Matter.Bodies.circle(startX + step * i, y, 9, {
            isStatic: true,
            label: "obstacle-funnel-dot",
            restitution: 0.75,
            render: {
              fillStyle: "#1e3a8a",
              strokeStyle: "#172554",
              lineWidth: 2,
            },
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
  const rotatingBars: RotatingBar[] = [];

  const W = STAGE.WIDTH;
  const H = STAGE.HEIGHT;

  bodies.push(...buildSection1(W));

  const s2 = buildSection2(W);
  bodies.push(...s2.bodies);
  rotatingBars.push(...s2.rotatingBars);

  const s3 = buildSection3(W);
  bodies.push(...s3.bodies);
  sticks.push(...s3.sticks);

  const s4 = buildSection4(W);
  bodies.push(...s4.bodies);
  players.push(...s4.players);
  rotatingBars.push(...s4.rotatingBars);

  bodies.push(...buildSection5(W, H));

  let lastT = 0;
  const update = (t: number) => {
    const deltaMs = lastT === 0 ? 16 : t - lastT;
    lastT = t;
    sticks.forEach((s) => updateStick(s, t));
    players.forEach((p) => updatePlayer(p, t));
    rotatingBars.forEach((b) => updateRotatingBar(b, deltaMs));
  };

  return { bodies, update };
}
