import { describe, expect, it } from "vitest";
import { highlight, splitLines } from "./highlight";

const kinds = (code: string) => highlight(code).map((line) => line.filter((t) => t.text.trim()).map((t) => [t.kind, t.text]));

describe("highlight", () => {
  it("키워드, 타입, 메서드 호출, 애너테이션을 나눈다", () => {
    expect(kinds("@Transactional\nvoid place(Order o) {")).toEqual([
      [["annotation", "@Transactional"]],
      [["keyword", "void"], ["call", "place"], ["plain", "("], ["type", "Order"], ["plain", " o) {"]],
    ]);
  });

  it("한 줄 주석은 줄 끝까지 주석이다", () => {
    expect(kinds("t.size(); // 팀마다 SELECT")).toEqual([
      [["plain", "t."], ["call", "size"], ["plain", "(); "], ["comment", "// 팀마다 SELECT"]],
    ]);
  });

  it("여러 줄 주석은 다음 줄로 이어진다", () => {
    const lines = highlight("/* 첫 줄\n둘째 줄 */ int a;");
    expect(lines[0]).toEqual([{ kind: "comment", text: "/* 첫 줄" }]);
    expect(lines[1][0]).toEqual({ kind: "comment", text: "둘째 줄 */" });
    expect(lines[1].find((t) => t.text === "int")?.kind).toBe("keyword");
  });

  it("문자열 안의 키워드는 문자열이다", () => {
    expect(kinds('em.createQuery("select t from Team t")')[0]).toContainEqual(["string", '"select t from Team t"']);
  });

  it("토큰을 이어 붙이면 원래 줄과 같다", () => {
    const code = "List<Team> teams = repo.findAll();\nfor (Team t : teams) {\n  t.getMembers().size();\n}";
    expect(highlight(code).map((line) => line.map((t) => t.text).join(""))).toEqual(code.split("\n"));
  });
});

describe("splitLines", () => {
  it("끝의 줄바꿈 하나는 줄로 세지 않는다 (백엔드 LinePicks와 같다)", () => {
    expect(splitLines("a\nb\n")).toEqual(["a", "b"]);
    expect(splitLines("a\nb")).toEqual(["a", "b"]);
  });
});
