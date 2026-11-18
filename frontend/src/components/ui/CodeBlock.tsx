import { highlight, type TokenKind } from "@/lib/highlight";

const COLORS: Record<TokenKind, string | undefined> = {
  plain: undefined,
  keyword: "#C4A7E7",
  type: "#9CCFD8",
  call: "#F6C177",
  annotation: "#F6C177",
  comment: "#6E6E73",
  string: "#A8D5A2",
  number: "#EBBCBA",
};

export type LineMark = "picked" | "answer" | "wrong";

const MARK_STYLE: Record<LineMark, string> = {
  picked: "bg-white/[0.14] shadow-[inset_2px_0_0_#ffffff]",
  answer: "bg-gold/[0.18] shadow-[inset_2px_0_0_var(--color-gold)]",
  wrong: "bg-wrong/[0.18] shadow-[inset_2px_0_0_var(--color-wrong)]",
};

interface Props {
  code: string;
  /** 줄 번호(1부터)별 표시 */
  marks?: Record<number, LineMark>;
  /** 주면 줄을 눌러 고를 수 있다 (줄 고르기 문제) */
  onPickLine?: (line: number) => void;
}

/** 줄 번호와 하이라이팅이 있는 어두운 코드 블록 */
export function CodeBlock({ code, marks = {}, onPickLine }: Props) {
  const lines = highlight(code);
  return (
    <div className="overflow-x-auto rounded-2xl bg-code py-4 font-mono text-[12px] leading-[1.85] text-[#E7E7E7] [scrollbar-width:none]">
      <div className="min-w-max">
        {lines.map((tokens, i) => {
          const no = i + 1;
          const mark = marks[no];
          const content = (
            <>
              <span className="w-9 shrink-0 select-none pr-3 text-right text-[#4A4A4F]">{no}</span>
              <span className="whitespace-pre pr-4">
                {tokens.length === 0
                  ? " "
                  : tokens.map((t, j) => (
                      <span key={j} style={COLORS[t.kind] ? { color: COLORS[t.kind] } : undefined}>
                        {t.text}
                      </span>
                    ))}
              </span>
            </>
          );
          const cls = `flex w-full text-left ${mark ? MARK_STYLE[mark] : ""}`;
          if (onPickLine) {
            return (
              <button
                key={no}
                type="button"
                aria-pressed={mark === "picked"}
                aria-label={`${no}번째 줄`}
                onClick={() => onPickLine(no)}
                className={`${cls} cursor-pointer`}
              >
                {content}
              </button>
            );
          }
          return (
            <div key={no} className={cls}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
