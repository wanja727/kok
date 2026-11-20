import { BottomActions, PrimaryButton } from "@/components/ui/buttons";

/** 오늘 꺼낼 것을 다 꺼낸 뒤 */
export function DoneView({ total, correct, relearned = 0 }: { total: number; correct: number; relearned?: number }) {
  if (total === 0) {
    return (
      <main className="app-frame">
        <div className="px-6 pt-24">
          <h1 className="text-2xl leading-snug font-semibold tracking-[-0.6px]">오늘 꺼낼 개념이 없어요</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">새 레슨을 배우면 3일 뒤부터 다시 물어요.</p>
        </div>
        <BottomActions>
          <PrimaryButton href="/">오늘로 돌아가기</PrimaryButton>
        </BottomActions>
      </main>
    );
  }

  return (
    <main className="app-frame">
      <div className="fade-up px-6 pt-24">
        <div className="text-[13px] text-muted">오늘 꺼낸 개념</div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-[88px] leading-[0.9] font-semibold tracking-[-5px]">{correct}</span>
          <span className="text-lg text-soft">/ {total} 맞힘</span>
        </div>
        <div className="mt-6 grid gap-1" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={`h-1.5 rounded-full ${i < correct ? "bg-gold" : "bg-line-strong"}`} />
          ))}
        </div>
        {relearned > 0 && (
          <p className="mt-6 text-[15px] leading-relaxed text-ink">
            틀린 개념 {relearned}개는 다른 문제로 다시 배웠어요.
          </p>
        )}
        <p className={`${relearned > 0 ? "mt-2" : "mt-6"} text-[15px] leading-relaxed text-muted`}>
          맞힌 개념은 다음 확인으로 넘어가요. 틀린 개념은 더 짧은 간격으로 다시 물어요.
        </p>
      </div>
      <BottomActions>
        <PrimaryButton href="/">오늘로 돌아가기</PrimaryButton>
      </BottomActions>
    </main>
  );
}
