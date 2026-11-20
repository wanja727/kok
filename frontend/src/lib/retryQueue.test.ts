import { describe, expect, it } from "vitest";
import {
  answer,
  current,
  finishesAfterThis,
  firstCorrectCount,
  isDone,
  isRetry,
  next,
  retriesRightAway,
  solvedCount,
  startQueue,
  type RetryQueue,
} from "./retryQueue";

function play(q: RetryQueue, correct: boolean): RetryQueue {
  return next(answer(q, correct));
}

describe("retryQueue", () => {
  it("모두 맞히면 순서대로 한 번씩 내고 끝난다", () => {
    let q = startQueue(3);
    expect(current(q)).toBe(0);
    q = play(q, true);
    q = play(q, true);
    q = answer(q, true);
    expect(finishesAfterThis(q)).toBe(true);
    q = next(q);
    expect(isDone(q)).toBe(true);
    expect(firstCorrectCount(q)).toBe(3);
  });

  it("틀린 문제는 다른 문제를 푼 뒤 맨 뒤에서 다시 내고, 맞힐 때까지 끝나지 않는다", () => {
    let q = startQueue(3);
    q = play(q, false); // 0 틀림 → 맨 뒤로
    expect(q.pending).toEqual([1, 2, 0]);
    q = play(q, true);
    q = play(q, true);
    expect(current(q)).toBe(0);
    expect(isRetry(q)).toBe(true);
    q = play(q, false); // 또 틀림. 남은 게 이것뿐이라 곧바로 다시 낸다
    expect(current(q)).toBe(0);
    q = answer(q, true);
    expect(finishesAfterThis(q)).toBe(true);
    q = next(q);
    expect(isDone(q)).toBe(true);
    expect(solvedCount(q)).toBe(3);
    // 처음 시도로 맞힌 것만 센다
    expect(firstCorrectCount(q)).toBe(2);
  });

  it("남은 문제가 틀린 하나뿐이면 곧바로 다시 낸다고 알려 준다", () => {
    let q = startQueue(1);
    q = answer(q, false);
    expect(retriesRightAway(q)).toBe(true);
    expect(finishesAfterThis(q)).toBe(false);
  });

  it("답을 두 번 내거나 답 없이 넘어가도 상태가 바뀌지 않는다", () => {
    const q = answer(startQueue(2), true);
    expect(answer(q, false)).toBe(q);
    const fresh = startQueue(2);
    expect(next(fresh)).toBe(fresh);
  });
});
