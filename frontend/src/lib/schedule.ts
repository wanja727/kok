/*
 * 확인 일정 표시 (ADR-017: 배운 날 3번 정답, 그 뒤 3일·7일·21일 재확인, 네 번 통과하면 졸업).
 * 백엔드의 지연 확인은 아직 3일(attemptNo=1)·7일(attemptNo=2)뿐이다. 21일 확인은 백엔드에 더한 뒤 맞춘다.
 */

const DAYS_BY_ATTEMPT: Record<number, number> = { 1: 3, 2: 7, 3: 21 };
const ORDINAL = ["", "첫 번째", "두 번째", "세 번째"];

/** 오늘 확인 전까지 통과한 확인 수. 배운 날 통과 + 그 전 재확인 */
export function passedChecks(attemptNo: number): number {
  return attemptNo;
}

/** 오늘 이 개념을 묻는 이유 */
export function checkReason(attemptNo: number): string {
  const days = DAYS_BY_ATTEMPT[attemptNo];
  const nth = ORDINAL[attemptNo] ?? `${attemptNo}번째`;
  return days ? `배운 지 ${days}일 · ${nth} 재확인` : `${nth} 재확인`;
}

/** 개념 하나에 2분으로 잡는다 */
export function minutesFor(count: number): number {
  return count * 2;
}
