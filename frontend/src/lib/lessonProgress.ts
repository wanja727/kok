import type { ConceptStatus, LessonSummary } from "./api/types";
import { daysBetween } from "./schedule";
import { TOTAL_CHECKS } from "./stages";

/*
 * 레슨 화면의 진행 상태 (ADR-017).
 * 진행 상태는 개념 단위로 쌓인다. 레슨에는 개념이 여러 개일 수 있어서, 가장 늦은 개념을 레슨의 상태로 본다.
 */

export type LessonState = "graduated" | "managed" | "new";

export interface LessonProgress {
  lesson: LessonSummary;
  state: LessonState;
  /** 통과한 확인 수. 개념이 여럿이면 가장 적은 값 */
  passed: number;
  /** 다음 확인일. 개념이 여럿이면 가장 가까운 날 */
  dueDate: string | null;
  sureWrong: boolean;
}

export function lessonProgress(lessons: LessonSummary[], concepts: ConceptStatus[]): LessonProgress[] {
  const byLesson = new Map<number, ConceptStatus[]>();
  for (const c of concepts) {
    byLesson.set(c.lessonId, [...(byLesson.get(c.lessonId) ?? []), c]);
  }

  return lessons.map((lesson) => {
    const cs = byLesson.get(lesson.id) ?? [];
    if (cs.length === 0) {
      return { lesson, state: "new", passed: 0, dueDate: null, sureWrong: false };
    }
    const open = cs.filter((c) => !c.graduated);
    if (open.length === 0) {
      return { lesson, state: "graduated", passed: TOTAL_CHECKS, dueDate: null, sureWrong: false };
    }
    const dues = open.map((c) => c.dueDate).filter((d): d is string => d !== null);
    return {
      lesson,
      state: "managed",
      passed: Math.min(...open.map((c) => c.stage)),
      dueDate: dues.length ? dues.reduce((a, b) => (a < b ? a : b)) : null,
      sureWrong: open.some((c) => c.sureWrong),
    };
  });
}

/** 레슨 본문(7단계)은 아직 dev-lessons 사이트에 있다. 앱 안으로 옮기기 전까지 그 페이지로 연결한다 */
export function lessonPageUrl(key: string): string {
  return `https://wanja727.github.io/dev-lessons/lessons/${encodeURIComponent(key)}/`;
}

/** 관리 중인 레슨을 다음 확인이 가까운 순으로. 배우는 중(확인일 없음)은 맨 앞 */
export function byNextCheck(a: LessonProgress, b: LessonProgress): number {
  if (a.dueDate === b.dueDate) return a.lesson.id - b.lesson.id;
  if (a.dueDate === null) return -1;
  if (b.dueDate === null) return 1;
  return a.dueDate < b.dueDate ? -1 : 1;
}

/** 관리 중인 레슨 한 줄 설명: 언제 다시 묻는지와 그 이유 */
export function nextCheckLabel(p: LessonProgress, today: string): string {
  if (p.passed === 0 || p.dueDate === null) return "배우는 중 · 같은 날 모두 맞히면 3일 뒤 확인";
  const days = daysBetween(today, p.dueDate);
  const when = days <= 0 ? "오늘 확인" : `${days}일 뒤 확인`;
  if (p.sureWrong) return `${when} · 확실했는데 틀림`;
  if (p.passed === TOTAL_CHECKS - 1) return `${when} · 통과하면 졸업`;
  return when;
}

/** 오늘 확인할 레슨인가. 화면에서 이 줄만 진하게 보인다 */
export function isDueToday(p: LessonProgress, today: string): boolean {
  return p.state === "managed" && p.dueDate !== null && p.dueDate <= today;
}
