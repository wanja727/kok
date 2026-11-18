/*
 * 코드 문제용 Java 신택스 하이라이터. 화면에 필요한 만큼만 나눈다.
 * 외부 라이브러리를 쓰지 않는 이유: 문제 코드는 짧은 Java 조각뿐이고, 디자인이 정한 색 다섯 가지만 필요하다.
 */

export type TokenKind = "plain" | "keyword" | "type" | "call" | "annotation" | "comment" | "string" | "number";

export interface Token {
  kind: TokenKind;
  text: string;
}

const KEYWORDS = new Set([
  "abstract", "boolean", "break", "byte", "case", "catch", "char", "class", "continue", "default", "do",
  "double", "else", "enum", "extends", "final", "finally", "float", "for", "if", "implements", "import",
  "instanceof", "int", "interface", "long", "new", "null", "package", "private", "protected", "public",
  "record", "return", "short", "static", "super", "switch", "synchronized", "this", "throw", "throws",
  "try", "var", "void", "volatile", "while", "true", "false", "yield",
]);

/** 백엔드 LinePicks.lineCount와 같게 끝의 줄바꿈 하나는 줄로 세지 않는다 */
export function splitLines(code: string): string[] {
  const trimmed = code.endsWith("\n") ? code.slice(0, -1) : code;
  return trimmed.split("\n");
}

/**
 * 코드를 줄마다 토큰으로 나눈다. 여러 줄 주석은 줄을 넘어 이어진다.
 */
export function highlight(code: string): Token[][] {
  const lines = splitLines(code);
  const result: Token[][] = [];
  let inBlockComment = false;

  for (const line of lines) {
    const tokens: Token[] = [];
    const push = (kind: TokenKind, text: string) => {
      if (!text) return;
      const last = tokens[tokens.length - 1];
      if (last && last.kind === kind) last.text += text;
      else tokens.push({ kind, text });
    };

    let i = 0;
    while (i < line.length) {
      if (inBlockComment) {
        const end = line.indexOf("*/", i);
        if (end === -1) {
          push("comment", line.slice(i));
          i = line.length;
        } else {
          push("comment", line.slice(i, end + 2));
          i = end + 2;
          inBlockComment = false;
        }
        continue;
      }

      const rest = line.slice(i);
      if (rest.startsWith("//")) {
        push("comment", rest);
        break;
      }
      if (rest.startsWith("/*")) {
        inBlockComment = true;
        push("comment", "/*");
        i += 2;
        continue;
      }

      const ch = line[i];
      if (ch === '"' || ch === "'") {
        let j = i + 1;
        while (j < line.length && line[j] !== ch) j += line[j] === "\\" ? 2 : 1;
        push("string", line.slice(i, Math.min(j + 1, line.length)));
        i = j + 1;
        continue;
      }
      if (ch === "@" && /[A-Za-z]/.test(line[i + 1] ?? "")) {
        const m = /^@[A-Za-z_][\w.]*/.exec(rest)!;
        push("annotation", m[0]);
        i += m[0].length;
        continue;
      }
      if (/\d/.test(ch)) {
        const m = /^\d[\d_.]*[lLfFdD]?/.exec(rest)!;
        push("number", m[0]);
        i += m[0].length;
        continue;
      }
      if (/[A-Za-z_$]/.test(ch)) {
        const m = /^[A-Za-z_$][\w$]*/.exec(rest)!;
        const word = m[0];
        const after = line.slice(i + word.length);
        let kind: TokenKind = "plain";
        if (KEYWORDS.has(word)) kind = "keyword";
        else if (/^\s*\(/.test(after)) kind = "call";
        else if (/^[A-Z]/.test(word)) kind = "type";
        push(kind, word);
        i += word.length;
        continue;
      }
      push("plain", ch);
      i += 1;
    }
    result.push(tokens);
  }
  return result;
}
