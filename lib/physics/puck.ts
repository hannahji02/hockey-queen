/**
 * 퍽 객체 생성 및 관리
 */
import Matter from "matter-js";
import { PUCK, SPAWN, STAGE, pickColor } from "./constants";

export interface PuckMeta {
  id: string;
  name: string;
  color: string;
}

export interface PuckBody extends Matter.Body {
  puckMeta?: PuckMeta;
}

/**
 * 참가자 배열로부터 퍽 Body 배열 생성
 *
 * @param names 퍽으로 만들 참가자 이름 배열 (체크된 인원만)
 * @param shuffleOrder X좌표 셔플 여부 (true면 무작위 배치)
 */
export function createPucks(
  names: string[],
  shuffleOrder: boolean = true
): PuckBody[] {
  const count = names.length;
  if (count === 0) return [];

  // 시작 X 좌표 계산: 상단 가로 일렬 균등 배치
  const usableWidth = STAGE.WIDTH - SPAWN.MARGIN_X * 2;
  const positions: number[] = [];

  if (count === 1) {
    positions.push(STAGE.WIDTH / 2);
  } else {
    const step = usableWidth / (count - 1);
    for (let i = 0; i < count; i++) {
      positions.push(SPAWN.MARGIN_X + step * i);
    }
  }

  // 셔플
  const orderedNames = [...names];
  if (shuffleOrder) {
    // Fisher-Yates
    for (let i = orderedNames.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [orderedNames[i], orderedNames[j]] = [orderedNames[j], orderedNames[i]];
    }
  }

  // 퍽 생성
  return orderedNames.map((name, idx) => {
    const baseX = positions[idx];
    const jitterX = (Math.random() - 0.5) * SPAWN.JITTER * 2;
    const jitterY = (Math.random() - 0.5) * SPAWN.JITTER;

    const body = Matter.Bodies.circle(
      baseX + jitterX,
      SPAWN.TOP_Y + jitterY,
      PUCK.RADIUS,
      {
        restitution: PUCK.RESTITUTION,
        friction: PUCK.FRICTION,
        frictionAir: PUCK.FRICTION_AIR,
        density: PUCK.DENSITY,
        label: "puck",
        render: {
          fillStyle: "#0a0a0a",
          strokeStyle: "#1f2937",
          lineWidth: 1.5,
        },
      }
    ) as PuckBody;

    body.puckMeta = {
      id: `puck-${idx}-${Date.now()}`,
      name,
      color: pickColor(idx),
    };

    // 미세 초기 속도 노이즈
    Matter.Body.setVelocity(body, {
      x: (Math.random() - 0.5) * 0.5,
      y: 0,
    });

    return body;
  });
}

/**
 * 퍽 위에 이름 텍스트 그리기 (Canvas 2D context)
 * - Matter.js 기본 렌더러는 텍스트 미지원이므로 별도 오버레이로 처리
 */
export function drawPuckLabels(
  ctx: CanvasRenderingContext2D,
  pucks: PuckBody[],
  scale: number = 1
): void {
  pucks.forEach((puck) => {
    if (!puck.puckMeta) return;

    const { position, angle } = puck;
    const { name, color } = puck.puckMeta;

    ctx.save();
    ctx.translate(position.x * scale, position.y * scale);
    ctx.rotate(angle);

    // 퍽 위 글로우 효과
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;

    // 이름 텍스트
    ctx.fillStyle = color;
    ctx.font = `bold ${
      PUCK.RADIUS * 0.7 * scale
    }px "Black Han Sans", "Noto Sans KR", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name, 0, 1);

    ctx.restore();
  });
}
