/**
 * 히든 순위 보정 명단
 *
 * 이 명단의 인원은:
 * - 참가자 리스트에 정상 표시 (체크박스 정상 작동)
 * - 추첨 시작 시 퍽으로 **정상 생성** 및 **정상 낙하**
 * - 단, 결승선 통과 직전 시점에 도착 순위가 보정됨:
 *   - 상위 25% 진입 예정 → 인위적 감속 (스틱 충돌처럼 연출)
 *   - 하위 25% 진입 예정 → 인위적 가속 (밀어주는 듯한 연출)
 *   - 중위 50% 안에 있으면 그대로 진행
 * - 결과적으로 1등/꼴등에 절대 선정되지 않음
 *
 * 외부 노출 금지. 코드 내부에서만 관리.
 *
 * 실제 적용은 Phase 3 (Matter.js 연결) 시 puck.ts / engine.ts 의
 * beforeFinishLine 이벤트 훅에서 처리.
 */

export const HIDDEN_RANK_ADJUSTED: readonly string[] = [
  "지혜은",
  "최정학",
] as const;

/**
 * 주어진 이름이 순위 보정 대상인지 확인
 */
export function isRankAdjusted(name: string): boolean {
  return HIDDEN_RANK_ADJUSTED.includes(name);
}

/**
 * 중위 보정 비율 설정
 * - SAFE_ZONE_RATIO = 0.25 : 상위/하위 각 25% 회피 (중위 50% 안에 안착)
 */
export const SAFE_ZONE_RATIO = 0.25;

/**
 * 보정 대상의 현재 예상 순위가 중위 안전 구간에 있는지 판정
 *
 * @param projectedRank - 현재 예상 도착 순위 (1부터 시작)
 * @param totalPucks    - 전체 퍽 개수
 * @returns 안전 구간이면 true, 보정이 필요하면 false
 *
 * 예시: 전체 10개, SAFE_ZONE_RATIO = 0.25
 *   → 안전 구간 = [3 ~ 8] (1~2등 회피, 9~10등 회피)
 */
export function isInSafeZone(
  projectedRank: number,
  totalPucks: number
): boolean {
  const cutoff = Math.max(1, Math.floor(totalPucks * SAFE_ZONE_RATIO));
  const safeStart = cutoff + 1;
  const safeEnd = totalPucks - cutoff;
  return projectedRank >= safeStart && projectedRank <= safeEnd;
}

/**
 * 보정 방향 결정
 * @returns 'decelerate' (상위권 진입 중, 감속 필요)
 *        | 'accelerate' (하위권 진입 중, 가속 필요)
 *        | 'none' (중위권, 보정 불필요)
 */
export function getAdjustmentDirection(
  projectedRank: number,
  totalPucks: number
): "decelerate" | "accelerate" | "none" {
  const cutoff = Math.max(1, Math.floor(totalPucks * SAFE_ZONE_RATIO));
  const safeStart = cutoff + 1;
  const safeEnd = totalPucks - cutoff;

  if (projectedRank < safeStart) return "decelerate";
  if (projectedRank > safeEnd) return "accelerate";
  return "none";
}

/**
 * 보정 강도 (Phase 3에서 Matter.js 속도 벡터에 곱할 계수)
 *
 * - 자연스러운 연출을 위해 한 번에 강하게 적용하지 않고,
 *   결승선 직전 일정 거리에서 점진적으로 적용
 */
export const ADJUSTMENT_FORCE = {
  decelerate: 0.7, // 속도 30% 감소
  accelerate: 1.4, // 속도 40% 증가
} as const;

/**
 * 보정 트리거 구간
 * - 결승선까지 남은 거리가 이 비율 이하일 때부터 보정 활성화
 * - 예: 0.15 → 결승선까지 남은 거리가 전체 트랙의 15% 이하일 때
 */
export const ADJUSTMENT_TRIGGER_DISTANCE_RATIO = 0.15;
