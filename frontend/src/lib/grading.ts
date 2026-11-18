import type { QuestionType } from "./api/types";

/** 줄 고르기 답("7, 8", "8,7")을 정렬된 줄 번호 목록으로 바꾼다 */
export function parseLines(value: string): number[] {
  return [
    ...new Set(
      value
        .split(",")
        .map((s) => Number.parseInt(s.trim(), 10))
        .filter((n) => Number.isInteger(n) && n > 0),
    ),
  ].sort((a, b) => a - b);
}

export function formatLines(lines: Iterable<number>): string {
  return [...new Set(lines)].sort((a, b) => a - b).join(",");
}

/** 백엔드 Grading과 같은 규칙. 목 API가 쓴다 */
export function isCorrect(type: QuestionType, selected: string, answer: string): boolean {
  if (type === "LINE_PICK") {
    const a = parseLines(selected);
    const b = parseLines(answer);
    return a.length > 0 && a.length === b.length && a.every((n, i) => n === b[i]);
  }
  return selected.trim().toUpperCase() === answer.trim().toUpperCase();
}

/** 화면에 보여줄 답 문구. 보기 번호는 보기 내용으로, 줄 번호는 "4번째 줄"로 */
export function describeAnswer(type: QuestionType, value: string, choices: string[] | null): string {
  if (type === "LINE_PICK") {
    const lines = parseLines(value);
    return lines.length === 0 ? "-" : `${lines.join(", ")}번째 줄`;
  }
  if (type === "OX") return value.toUpperCase();
  const index = Number.parseInt(value, 10) - 1;
  return choices?.[index] ?? value;
}
