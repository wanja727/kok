import type { Rate } from "./api/types";
import { daysBetween } from "./schedule";

/** 정답률(0~100, 반올림). 표본이 없으면 null: 화면은 숫자 대신 아직 없다고 말한다 */
export function percent(rate: Rate): number | null {
  if (rate.total === 0) return null;
  return Math.round((rate.correct / rate.total) * 100);
}

/** 꺼낸 날 칸의 진하기 0~4. 0은 답을 내지 않은 날 */
export function activityLevel(count: number): number {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

export interface ActivityCell {
  date: string;
  count: number;
  /** 오늘 이후의 칸 (마지막 주의 남은 요일). 그리지 않는다 */
  future: boolean;
}

/**
 * 최근 weeks주를 주(열) × 요일(행)로. 마지막 열이 오늘이 있는 주이고, 주는 일요일부터 시작한다.
 * 반환값은 열(주)의 배열이고, 열마다 일~토 7칸이다.
 */
export function activityGrid(today: string, activity: { date: string; count: number }[], weeks = 26): ActivityCell[][] {
  const byDate = new Map(activity.map((a) => [a.date, a.count]));
  const todayMs = Date.parse(`${today}T00:00:00Z`);
  const weekday = new Date(todayMs).getUTCDay(); // 0 = 일요일
  const start = todayMs - ((weeks - 1) * 7 + weekday) * 86_400_000;
  const grid: ActivityCell[][] = [];
  for (let w = 0; w < weeks; w++) {
    const column: ActivityCell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(start + (w * 7 + d) * 86_400_000).toISOString().slice(0, 10);
      column.push({ date, count: byDate.get(date) ?? 0, future: daysBetween(today, date) > 0 });
    }
    grid.push(column);
  }
  return grid;
}
