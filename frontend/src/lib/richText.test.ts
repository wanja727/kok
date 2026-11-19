import { describe, expect, it } from "vitest";
import { paragraphs, parseInline } from "./richText";

describe("paragraphs", () => {
  it("빈 줄로 문단을 나누고, 문단 안의 줄바꿈은 공백으로 잇는다", () => {
    expect(paragraphs("첫 줄\n이어짐\n\n  둘째 문단  \n\n")).toEqual(["첫 줄 이어짐", "둘째 문단"]);
  });
});

describe("parseInline", () => {
  it("굵게와 코드만 나누고 나머지는 글자 그대로 둔다", () => {
    expect(parseInline("**LAZY**는 `size()`에서 <b>열려요</b>")).toEqual([
      { kind: "bold", text: "LAZY" },
      { kind: "text", text: "는 " },
      { kind: "code", text: "size()" },
      { kind: "text", text: "에서 <b>열려요</b>" },
    ]);
  });

  it("닫히지 않은 표시는 글자로 남긴다", () => {
    expect(parseInline("2 ** 3 그리고 `열린")).toEqual([{ kind: "text", text: "2 ** 3 그리고 `열린" }]);
  });
});
