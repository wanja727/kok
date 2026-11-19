/*
 * 레슨 본문 글 형식: 빈 줄로 문단을 나누고, **굵게**와 `코드`만 쓴다.
 * HTML은 해석하지 않는다 (콘텐츠 파일의 글을 그대로 화면에 넣지 않는다).
 */

export type Inline = { kind: "text" | "bold" | "code"; text: string };

export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
}

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  const pattern = /\*\*(.+?)\*\*|`([^`]+)`/g;
  let last = 0;
  for (let m = pattern.exec(text); m; m = pattern.exec(text)) {
    if (m.index > last) out.push({ kind: "text", text: text.slice(last, m.index) });
    out.push(m[1] !== undefined ? { kind: "bold", text: m[1] } : { kind: "code", text: m[2] });
    last = pattern.lastIndex;
  }
  if (last < text.length) out.push({ kind: "text", text: text.slice(last) });
  return out;
}
