/** 개념마다 확인 횟수: 배운 날, 3일, 7일, 21일 (ADR-017). 네 번 모두 통과하면 졸업 */
export const TOTAL_CHECKS = 4;

/** "확인 2/4"와 막대 네 칸. 통과한 칸만 골드 */
export function StageBar({ passed, total = TOTAL_CHECKS }: { passed: number; total?: number }) {
  return (
    <div
      role="img"
      aria-label={`확인 ${total}번 중 ${passed}번 통과`}
      className="flex shrink-0 items-center gap-2 whitespace-nowrap"
    >
      <span className="text-[11px] text-soft">
        확인 <span className="font-semibold text-ink">{passed}</span>/{total}
      </span>
      <span className="flex gap-[3px]">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`h-1 w-3 rounded-full ${i < passed ? "bg-gold" : "bg-line-strong"}`} />
        ))}
      </span>
    </div>
  );
}
