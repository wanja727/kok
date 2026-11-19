import { paragraphs, parseInline } from "@/lib/richText";

/** 레슨 본문 글. 문단, **굵게**, `코드`만 (HTML은 해석하지 않는다) */
export function RichText({ text, className = "" }: { text: string; className?: string }) {
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {paragraphs(text).map((p, i) => (
        <p key={i}>
          <RichInline text={p} />
        </p>
      ))}
    </div>
  );
}

/** 한 줄 글. **굵게**와 `코드`만 */
export function RichInline({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((part, j) => {
        if (part.kind === "bold") {
          return (
            <b key={j} className="font-semibold text-ink">
              {part.text}
            </b>
          );
        }
        if (part.kind === "code") {
          return (
            <code key={j} className="rounded bg-surface px-1 py-px font-mono text-[0.9em] text-ink">
              {part.text}
            </code>
          );
        }
        return <span key={j}>{part.text}</span>;
      })}
    </>
  );
}
