import { describe, expect, it } from "vitest";
import { describeAnswer, formatLines, isCorrect, parseLines } from "./grading";

describe("줄 고르기", () => {
  it("순서와 공백, 중복을 무시하고 집합으로 비교한다", () => {
    expect(parseLines("8, 7,7")).toEqual([7, 8]);
    expect(formatLines([8, 7])).toBe("7,8");
    expect(isCorrect("LINE_PICK", "8,7", "7, 8")).toBe(true);
    expect(isCorrect("LINE_PICK", "7", "7, 8")).toBe(false);
    expect(isCorrect("LINE_PICK", "", "7")).toBe(false);
  });
});

describe("보기와 OX", () => {
  it("OX는 대소문자를 가리지 않는다", () => {
    expect(isCorrect("OX", "x", "X")).toBe(true);
  });

  it("보기 번호를 보기 내용으로 바꿔 보여준다", () => {
    expect(describeAnswer("MULTIPLE_CHOICE", "4", ["1번", "2번", "10번", "11번"])).toBe("11번");
    expect(describeAnswer("LINE_PICK", "8,4", null)).toBe("4, 8번째 줄");
  });
});
