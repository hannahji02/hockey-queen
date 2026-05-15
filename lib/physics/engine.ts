/**
 * Matter.js 엔진 셋업
 * - World, Engine, Bounds 생성
 * - Phase 3에서는 좌우 보드 + 바닥만 생성 (장애물은 Phase 4)
 */
import Matter from "matter-js";
import { STAGE } from "./constants";

export interface EngineSetup {
  engine: Matter.Engine;
  world: Matter.World;
  walls: Matter.Body[];
}

export function createEngine(): EngineSetup {
  const engine = Matter.Engine.create({
    gravity: { x: 0, y: 1, scale: 0.0012 },
  });

  const world = engine.world;

  // 좌우 보드 (벽)
  const thickness = 40;
  const leftWall = Matter.Bodies.rectangle(
    -thickness / 2,
    STAGE.HEIGHT / 2,
    thickness,
    STAGE.HEIGHT,
    {
      isStatic: true,
      label: "wall-left",
      render: { fillStyle: "#1f2937" },
    }
  );
  const rightWall = Matter.Bodies.rectangle(
    STAGE.WIDTH + thickness / 2,
    STAGE.HEIGHT / 2,
    thickness,
    STAGE.HEIGHT,
    {
      isStatic: true,
      label: "wall-right",
      render: { fillStyle: "#1f2937" },
    }
  );

  // 바닥 (결승선 아래 catch)
  const floor = Matter.Bodies.rectangle(
    STAGE.WIDTH / 2,
    STAGE.HEIGHT + thickness / 2,
    STAGE.WIDTH + thickness * 2,
    thickness,
    {
      isStatic: true,
      label: "floor",
      render: { fillStyle: "#1f2937" },
    }
  );

  Matter.Composite.add(world, [leftWall, rightWall, floor]);

  return {
    engine,
    world,
    walls: [leftWall, rightWall, floor],
  };
}

/**
 * 엔진 정리 (메모리 누수 방지)
 */
export function cleanupEngine(engine: Matter.Engine): void {
  Matter.World.clear(engine.world, false);
  Matter.Engine.clear(engine);
}
