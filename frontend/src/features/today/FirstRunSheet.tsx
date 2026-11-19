"use client";

import { PrimaryButton } from "@/components/ui/buttons";

/** 첫 사용 때 한 번만 숫자와 막대의 뜻을 알려준다. 이후에는 물음표 버튼으로만 본다 (ADR-018) */
export function FirstRunSheet({
  onClose,
  title = "처음이라 한 번만 알려 드려요",
}: {
  onClose: () => void;
  /** 물음표나 "나" 화면에서 다시 열 때는 "숫자와 막대의 뜻"처럼 바꿔 쓴다 */
  title?: string;
}) {
  return (
    <div className="fixed inset-0 z-20 mx-auto flex max-w-[430px] flex-col justify-end">
      <div className="absolute inset-0 bg-ink/45" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="first-run-title"
        className="fade-up relative rounded-t-3xl bg-white px-6 pt-3 pb-7"
      >
        <div className="mx-auto mb-5 h-1 w-9 rounded-full bg-line-strong" />
        <h2 id="first-run-title" className="text-xl font-semibold tracking-[-0.4px]">
          {title}
        </h2>
        <dl className="mt-[18px] flex flex-col gap-4">
          <Row term={<span className="text-[22px] leading-[1.1] font-semibold">3</span>}>
            <b className="text-ink">큰 숫자</b>는 정해 둔 분량이 아니에요. 오늘 다시 확인할 때가 된 개념 수예요.
          </Row>
          <Row term={<Bars filled={2} />}>
            <b className="text-ink">막대 한 칸</b>은 통과한 확인 한 번이에요. 배운 날, 3일, 7일, 21일 뒤에 물어요.
          </Row>
          <Row term={<Bars filled={4} />}>
            <b className="text-ink">네 칸이 모두 차면 졸업</b>이에요. 그 개념은 더는 묻지 않아요.
          </Row>
        </dl>
        <PrimaryButton onClick={onClose} className="mt-6">
          알겠어요
        </PrimaryButton>
      </div>
    </div>
  );
}

function Row({ term, children }: { term: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3.5">
      <dt className="w-11 shrink-0">{term}</dt>
      <dd className="text-sm leading-[1.55] text-sub">{children}</dd>
    </div>
  );
}

function Bars({ filled }: { filled: number }) {
  return (
    <span className="flex gap-[3px] pt-2" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className={`h-1 w-[9px] rounded-full ${i < filled ? "bg-gold" : "bg-line-strong"}`} />
      ))}
    </span>
  );
}
