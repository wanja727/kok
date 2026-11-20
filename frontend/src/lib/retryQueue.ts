/**
 * 맞힐 때까지 묻는 대기열 (ADR-021, 원칙 4번 "배운 날 맞힐 때까지").
 * 문제를 순서대로 내고, 틀린 문제는 해설을 본 뒤 대기열 뒤로 보내 다른 문제를 푼 다음 다시 낸다.
 * 모든 문제를 한 번씩 맞히면 끝난다. 화면 상태만 다루고, 기록과 일정은 서버가 정한다.
 */
export interface RetryQueue {
  /** 남은 문제 번호(문제 목록의 인덱스). 맨 앞이 지금 문제다 */
  pending: number[];
  /** 문제마다 맞혔는지 */
  solved: boolean[];
  /** 문제마다 처음 낸 답이 맞았는지. 아직 안 풀었으면 null */
  firstCorrect: (boolean | null)[];
  /** 지금 문제에 낸 답. 아직 안 냈으면 null */
  answered: boolean | null;
  /** 지금까지 낸 답 수. 같은 문제를 다시 낼 때 화면을 새로 만드는 데 쓴다 */
  attempts: number;
}

export function startQueue(size: number): RetryQueue {
  return {
    pending: Array.from({ length: size }, (_, i) => i),
    solved: Array.from({ length: size }, () => false),
    firstCorrect: Array.from({ length: size }, () => null),
    answered: null,
    attempts: 0,
  };
}

/** 지금 문제 번호. 다 끝났으면 null */
export function current(q: RetryQueue): number | null {
  return q.pending[0] ?? null;
}

/** 지금 문제가 전에 틀렸던 문제를 다시 내는 것인지 */
export function isRetry(q: RetryQueue): boolean {
  const i = current(q);
  return i !== null && q.firstCorrect[i] === false;
}

/** 지금 문제에 답을 냈다 */
export function answer(q: RetryQueue, correct: boolean): RetryQueue {
  const i = current(q);
  if (i === null || q.answered !== null) return q;
  return {
    ...q,
    solved: q.solved.map((s, j) => (j === i ? s || correct : s)),
    firstCorrect: q.firstCorrect.map((f, j) => (j === i && f === null ? correct : f)),
    answered: correct,
    attempts: q.attempts + 1,
  };
}

/** 다음 문제로. 틀린 문제는 대기열 맨 뒤로 보낸다 */
export function next(q: RetryQueue): RetryQueue {
  const i = current(q);
  if (i === null || q.answered === null) return q;
  const rest = q.pending.slice(1);
  return { ...q, pending: q.answered ? rest : [...rest, i], answered: null };
}

/** 지금 답을 낸 뒤 다음으로 넘어가면 끝나는지 */
export function finishesAfterThis(q: RetryQueue): boolean {
  return q.answered === true && q.pending.length === 1;
}

/** 지금 틀린 문제를 곧바로 다시 내야 하는지 (남은 문제가 이것 하나뿐일 때) */
export function retriesRightAway(q: RetryQueue): boolean {
  return q.answered === false && q.pending.length === 1;
}

export function solvedCount(q: RetryQueue): number {
  return q.solved.filter(Boolean).length;
}

export function firstCorrectCount(q: RetryQueue): number {
  return q.firstCorrect.filter((f) => f === true).length;
}

export function isDone(q: RetryQueue): boolean {
  return q.pending.length === 0;
}
