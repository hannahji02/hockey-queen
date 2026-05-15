/**
 * planck.js (Box2D) 엔진 wrapper
 *
 * 책임:
 * - World 생성 및 step 진행
 * - 맵 entity → planck Body 변환
 * - 퍽(원형 dynamic body) 생성
 * - 퍽 메타데이터 (이름, 색상, hue) 관리
 */

import * as planck from "planck";
import { WHEEL_OF_FORTUNE, type EntityDef } from "./map";

const { World, Vec2, Box, Circle, Edge } = planck;

export interface PuckMeta {
  id: number;
  name: string;
  hue: number;
  color: string;
}

export interface Puck {
  body: planck.Body;
  meta: PuckMeta;
}

export interface PhysicsWorld {
  world: planck.World;
  pucks: Puck[];
  kinematicBodies: planck.Body[];
  /** 시뮬레이션 시작 후 활성 상태 (false면 퍽이 spawn 위치에 정지) */
  isRunning: boolean;
}

/**
 * 새로운 물리 월드 생성 (맵 포함)
 */
export function createPhysicsWorld(): PhysicsWorld {
  const world = new World({
    gravity: new Vec2(0, 10), // 아래 방향 중력 (m/s²)
  });

  const kinematicBodies: planck.Body[] = [];

  // 맵 entity 추가
  for (const entity of WHEEL_OF_FORTUNE) {
    addEntityToWorld(world, entity, kinematicBodies);
  }

  return {
    world,
    pucks: [],
    kinematicBodies,
    isRunning: false,
  };
}

/**
 * EntityDef를 planck Body로 변환하여 world에 추가
 */
function addEntityToWorld(
  world: planck.World,
  entity: EntityDef,
  kinematicBodies: planck.Body[]
): void {
  const body = world.createBody({
    type: entity.type,
    position: new Vec2(entity.position.x, entity.position.y),
    angularVelocity: entity.props.angularVelocity,
  });

  if (entity.shape.type === "box") {
    const { width, height, rotation } = entity.shape;
    // rotation은 degrees → radians 변환
    const halfW = width / 2;
    const halfH = height / 2;
    const angle = (rotation * Math.PI) / 180;

    body.createFixture({
      shape: new Box(halfW, halfH, new Vec2(0, 0), angle),
      density: entity.props.density,
      restitution: entity.props.restitution,
      friction: 0.1,
    });
  } else if (entity.shape.type === "polyline") {
    // polyline은 연속된 Edge로 변환
    const points = entity.shape.points;
    for (let i = 0; i < points.length - 1; i++) {
      const [x1, y1] = points[i];
      const [x2, y2] = points[i + 1];
      body.createFixture({
        shape: new Edge(new Vec2(x1, y1), new Vec2(x2, y2)),
        density: entity.props.density,
        restitution: entity.props.restitution,
        friction: 0.1,
      });
    }
  }

  if (entity.type === "kinematic") {
    kinematicBodies.push(body);
  }
}

/**
 * 참가자 이름 배열로부터 퍽 생성
 *
 * 레퍼런스 방식 그대로:
 * - x = 10.25 + (i % 10) * 0.6
 * - y = (maxLine - line + lineDelta)
 *   - maxLine = ceil(count / 10)
 *   - line = floor(i / 10)
 *   - lineDelta = -max(0, ceil(maxLine - 5))
 */
export function createPucks(
  pw: PhysicsWorld,
  names: string[]
): Puck[] {
  // 기존 퍽 제거
  for (const puck of pw.pucks) {
    pw.world.destroyBody(puck.body);
  }
  pw.pucks = [];

  const count = names.length;
  if (count === 0) return [];

  // 순서 셔플 (Fisher-Yates)
  const orders = Array.from({ length: count }, (_, i) => i);
  for (let i = orders.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [orders[i], orders[j]] = [orders[j], orders[i]];
  }

  const maxLine = Math.ceil(count / 10);
  const lineDelta = -Math.max(0, Math.ceil(maxLine - 5));

  names.forEach((name, idx) => {
    const order = orders[idx];
    const line = Math.floor(order / 10);
    const x = 10.25 + (order % 10) * 0.6;
    const y = maxLine - line + lineDelta;

    const body = pw.world.createBody({
      type: "dynamic",
      position: new Vec2(x, y),
      bullet: false,
      linearDamping: 0,
      angularDamping: 0,
    });

    body.createFixture({
      shape: new Circle(0.25),
      density: 1,
      restitution: 0.3,
      friction: 0.1,
    });

    const hue = (360 / count) * idx;
    const color = `hsl(${hue} 80% 45%)`;

    pw.pucks.push({
      body,
      meta: {
        id: idx,
        name,
        hue,
        color,
      },
    });
  });

  return pw.pucks;
}

/**
 * 물리 시뮬레이션 step
 *
 * @param pw 물리 월드
 * @param dt 시뮬레이션 시간 (초)
 * @param timeScale 시간 배율 (1.0=정상, 0.3=슬로우)
 */
export function stepWorld(
  pw: PhysicsWorld,
  dt: number,
  timeScale: number = 1
): void {
  if (!pw.isRunning) return;
  const scaledDt = dt * timeScale;
  pw.world.step(scaledDt, 8, 3);
}

/**
 * 시뮬레이션 시작
 */
export function startSimulation(pw: PhysicsWorld): void {
  pw.isRunning = true;
}

/**
 * 퍽들을 골인 여부에 따라 분류
 * @returns 골인된 퍽과 활성 퍽
 */
export function checkGoals(
  pw: PhysicsWorld,
  goalY: number
): { active: Puck[]; finished: Puck[] } {
  const active: Puck[] = [];
  const finished: Puck[] = [];
  for (const puck of pw.pucks) {
    if (puck.body.getPosition().y > goalY) {
      finished.push(puck);
    } else {
      active.push(puck);
    }
  }
  return { active, finished };
}

/**
 * 월드 정리 (메모리 해제)
 */
export function destroyWorld(pw: PhysicsWorld): void {
  // planck은 GC가 자동 처리하지만, 명시적으로 정리
  pw.pucks = [];
  pw.kinematicBodies = [];
}
