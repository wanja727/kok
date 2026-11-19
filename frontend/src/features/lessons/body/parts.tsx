"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { CheckIcon, CloseIcon, MicIcon } from "@/components/ui/icons";
import { RichInline } from "@/components/ui/RichText";
import { useSpeechInput } from "@/lib/useSpeechInput";

/** 본문 7단계의 이름. 레슨 표준(dev-lessons docs/lesson-standard.md)의 순서와 같다 */
export const STEP_NAMES = ["예측", "배경", "실습", "함정", "해결", "확인", "면접 답변"] as const;

/** 본문 위: 닫기, 레슨 이름, 일곱 칸 진행 막대, "3 / 7 · 실습" */
export function BodyTopBar({ title, step, sub }: { title: string; step: number; sub?: string }) {
  return (
    <header className="shrink-0">
      <div className="grid h-14 grid-cols-[44px_1fr_44px] items-center px-3">
        <Link href="/lessons" aria-label="닫기" className="flex size-11 items-center justify-center">
          <CloseIcon />
        </Link>
        <div className="truncate text-center text-[13px] font-medium text-muted">{title}</div>
      </div>
      <div
        role="progressbar"
        aria-label="레슨 진행"
        aria-valuenow={step}
        aria-valuemin={0}
        aria-valuemax={STEP_NAMES.length}
        className="mx-6 grid grid-cols-7 gap-1"
      >
        {STEP_NAMES.map((name, i) => (
          <div key={name} className={`h-0.5 ${i < step ? "bg-ink" : "bg-line-strong"}`} />
        ))}
      </div>
      <div className="mx-6 mt-2.5 text-xs text-soft">
        <span className="font-semibold text-ink">
          {step} / {STEP_NAMES.length}
        </span>{" "}
        · {STEP_NAMES[step - 1]}
        {sub ? ` · ${sub}` : ""}
      </div>
    </header>
  );
}

export function StepTitle({ children }: { children: ReactNode }) {
  return <h1 className="mx-6 mt-6 text-[22px] leading-[1.42] font-semibold tracking-[-0.5px]">{children}</h1>;
}

/** 보기 고르기. 답을 고른 뒤(revealed)에는 정답을 골드 점, 틀린 내 답을 빨간 점으로 표시하고 더 바꿀 수 없다 */
export function ChoiceList({
  label,
  choices,
  selected,
  answer,
  revealed,
  onSelect,
}: {
  label: string;
  choices: string[];
  selected: number | null;
  /** 1부터. revealed일 때만 쓴다 */
  answer?: number;
  revealed?: boolean;
  onSelect: (n: number) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col gap-2">
      {choices.map((choice, i) => {
        const n = i + 1;
        const on = selected === n;
        const isAnswer = revealed && answer === n;
        const isWrong = revealed && on && answer !== n;
        const tone = revealed
          ? isAnswer
            ? "border-ink font-semibold"
            : "border-line-strong text-soft"
          : on
            ? "border-ink bg-ink font-semibold text-white"
            : "border-line-strong bg-white font-medium";
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={revealed}
            onClick={() => onSelect(n)}
            className={`flex min-h-[52px] w-full items-center gap-3 rounded-[14px] border px-4 py-2.5 text-left text-[15px] ${tone}`}
          >
            <span className="flex-1">{choice}</span>
            {isAnswer && <span className="size-1.5 rounded-full bg-gold" aria-label="정답" />}
            {isWrong && <span className="size-1.5 rounded-full bg-wrong" aria-label="내가 고른 답" />}
            {!revealed && on && <CheckIcon size={18} />}
          </button>
        );
      })}
    </div>
  );
}

/** 넘어가기 전에 보지 않고 꺼내 보는 칸. 단계 끝에 붙는다 */
export function BeforeNext({ question, children }: { question: string; children: ReactNode }) {
  return (
    <section className="mx-6 mt-9 border-t border-line pt-6" aria-label="넘어가기 전에">
      <div className="text-xs font-medium text-soft">넘어가기 전에 · 위를 보지 않고</div>
      <h2 className="mt-2 text-[17px] leading-normal font-semibold tracking-[-0.3px]">{question}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** 적거나 말해서 답하는 칸 */
export function SpokenInput({
  id,
  value,
  onChange,
  placeholder,
  rows = 3,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
  disabled?: boolean;
}) {
  const speech = useSpeechInput((text) => onChange(value ? `${value} ${text}` : text));
  return (
    <div className="flex items-start gap-1 rounded-[14px] border border-ink py-2 pr-1.5 pl-4">
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 resize-none bg-transparent py-1.5 text-[15px] leading-relaxed outline-none placeholder:text-faint disabled:text-sub"
      />
      {speech.supported && !disabled && (
        <button
          type="button"
          onClick={speech.toggle}
          aria-label={speech.listening ? "말하기 멈추기" : "말로 답하기"}
          aria-pressed={speech.listening}
          className={`flex size-11 shrink-0 items-center justify-center rounded-full ${speech.listening ? "bg-ink text-white" : ""}`}
        >
          <MicIcon />
        </button>
      )}
    </div>
  );
}

/** 번호 붙은 단계 목록. 도식 대신 쓴다 */
export function FlowList({ items }: { items: string[] }) {
  return (
    <ol className="mx-6 mt-5 flex flex-col gap-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 rounded-xl border border-line px-4 py-3 text-[14px] leading-relaxed">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-white">
            {i + 1}
          </span>
          <span className="pt-px">
            <RichInline text={item} />
          </span>
        </li>
      ))}
    </ol>
  );
}

/** 단계 사이를 오가는 아래 버튼: 이전(화살표)과 다음 */
export function StepNav({
  onBack,
  onNext,
  nextLabel,
  disabled,
  hint,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel: string;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div className="sticky bottom-0 mt-auto bg-white px-6 pt-3 pb-6">
      {hint && <p className="pb-2.5 text-center text-xs text-soft">{hint}</p>}
      <div className="flex gap-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="이전 단계"
            className="flex size-14 shrink-0 items-center justify-center rounded-full border border-line-strong"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="M11 6l-6 6 6 6" />
            </svg>
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={disabled}
          className={`flex h-14 flex-1 items-center justify-center rounded-full text-base font-semibold ${
            disabled ? "bg-line-strong text-soft" : "bg-ink text-white active:bg-ink-2"
          }`}
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
