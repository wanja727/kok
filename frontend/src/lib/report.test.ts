import { describe, expect, it } from "vitest";
import { activityGrid, activityLevel, percent } from "./report";

describe("percent", () => {
  it("표본이 없으면 null, 있으면 반올림한 백분율", () => {
    expect(percent({ correct: 0, total: 0 })).toBeNull();
    expect(percent({ correct: 2, total: 3 })).toBe(67);
  });
});

describe("activityLevel", () => {
  it("답 수를 0~4 진하기로 나눈다", () => {
    expect([0, 1, 2, 3, 5, 6, 9, 10, 40].map(activityLevel)).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4]);
  });
});

describe("activityGrid", () => {
  // 2026-11-19는 목요일
  const grid = activityGrid("2026-11-19", [
    { date: "2026-11-19", count: 4 },
    { date: "2026-11-15", count: 1 },
  ]);

  it("26주 × 7일이고 마지막 열이 오늘이 있는 주(일요일 시작)다", () => {
    expect(grid).toHaveLength(26);
    expect(grid.every((col) => col.length === 7)).toBe(true);
    expect(grid[25][0].date).toBe("2026-11-15");
    expect(grid[25][4]).toEqual({ date: "2026-11-19", count: 4, future: false });
    expect(grid[0][0].date).toBe("2026-05-24");
  });

  it("오늘 뒤의 요일은 future로 표시하고, 기록이 없는 날은 0이다", () => {
    expect(grid[25][5].future).toBe(true);
    expect(grid[25][0].count).toBe(1);
    expect(grid[25][1].count).toBe(0);
  });
});
