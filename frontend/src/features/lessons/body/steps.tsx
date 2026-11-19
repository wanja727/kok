"use client";

import { CodeBlock } from "@/components/ui/CodeBlock";
import { RichText } from "@/components/ui/RichText";
import type { ExplainStep, LessonSteps } from "@/lib/api";
import { BeforeNext, ChoiceList, FlowList, SpokenInput, StepTitle } from "./parts";

/** 받아 적은 답과, 예시 답을 열었는지 */
export interface RecallState {
  draft: string;
  revealed: boolean;
}

export const EMPTY_RECALL: RecallState = { draft: "", revealed: false };

/** 1 예측: 설명은 예측한 다음에 열린다 */
export function PredictView({
  step,
  selected,
  onSelect,
}: {
  step: LessonSteps["predict"];
  selected: number | null;
  onSelect: (n: number) => void;
}) {
  return (
    <div className="pb-4">
      <StepTitle>{step.question}</StepTitle>
      {step.text && <RichText text={step.text} className="mx-6 mt-3 text-[15px] leading-[1.7] text-sub" />}
      {step.code && (
        <div className="mx-6 mt-5">
          <CodeBlock code={step.code} />
        </div>
      )}
      <div className="mx-6 mt-6">
        <ChoiceList label="내 예측" choices={step.choices} selected={selected} onSelect={onSelect} />
      </div>
    </div>
  );
}

/** 함정 단계 위에 붙는 한 줄: 내 예측과 실제 */
export function PredictionResult({ step, predicted }: { step: LessonSteps["predict"]; predicted: number | null }) {
  if (predicted === null) return null;
  const right = predicted === step.answer;
  return (
    <div className="mx-6 mt-5 flex items-center gap-2 text-[13px] text-muted">
      <span className={`size-1.5 shrink-0 rounded-full ${right ? "bg-gold" : "bg-wrong"}`} aria-hidden="true" />
      <span>
        내 예측 {right ? <b className="text-ink">{step.choices[predicted - 1]}</b> : <s className="text-faint">{step.choices[predicted - 1]}</s>} · 실제{" "}
        <b className="text-ink">{step.choices[step.answer - 1]}</b>
      </span>
    </div>
  );
}

/** 2 배경, 4 함정, 5 해결: 설명 → 퀴즈 또는 한 문장으로 답하기 */
export function ExplainView({
  id,
  step,
  header,
  quizAnswer,
  onQuiz,
  recall,
  onRecall,
}: {
  id: string;
  step: ExplainStep;
  header?: React.ReactNode;
  quizAnswer: number | null;
  onQuiz: (n: number) => void;
  recall: RecallState;
  onRecall: (state: RecallState) => void;
}) {
  return (
    <div className="pb-4">
      {header}
      <StepTitle>{step.title}</StepTitle>
      <RichText text={step.text} className="mx-6 mt-3 text-[15px] leading-[1.7] text-sub" />
      {step.flow && <FlowList items={step.flow} />}
      {step.code && (
        <div className="mx-6 mt-5">
          <CodeBlock code={step.code} />
          {step.codeNote && <p className="mt-2 text-xs leading-relaxed text-muted">{step.codeNote}</p>}
        </div>
      )}
      {step.alternatives && (
        <section className="mx-6 mt-7" aria-labelledby={`${id}-alt`}>
          <h2 id={`${id}-alt`} className="border-b border-line pb-2.5 text-xs font-medium text-soft">
            다른 방법과 주의할 점
          </h2>
          {step.alternatives.map((alt) => (
            <div key={alt.title} className="border-b border-line py-3">
              <div className="text-[14px] font-semibold">{alt.title}</div>
              <div className="mt-1 text-[13px] leading-relaxed text-muted">{alt.note}</div>
            </div>
          ))}
        </section>
      )}

      {step.quiz && (
        <BeforeNext question={step.quiz.question}>
          <ChoiceList
            label="보기"
            choices={step.quiz.choices}
            selected={quizAnswer}
            answer={step.quiz.answer}
            revealed={quizAnswer !== null}
            onSelect={onQuiz}
          />
          {quizAnswer !== null && (
            <p className="mt-3 text-[13px] text-muted">
              {quizAnswer === step.quiz.answer ? "맞아요. 다음 단계가 열렸어요" : "정답을 확인했어요. 다음 단계가 열렸어요"}
            </p>
          )}
        </BeforeNext>
      )}

      {step.recall && (
        <BeforeNext question={step.recall.prompt}>
          <SpokenInput
            id={`${id}-recall`}
            value={recall.draft}
            onChange={(draft) => onRecall({ ...recall, draft })}
            placeholder="내 말로 적거나 말하기"
            disabled={recall.revealed}
          />
          {recall.revealed ? (
            <div className="mt-4 rounded-[14px] bg-surface px-4 py-3.5">
              <div className="text-xs font-medium text-soft">예시 답 · 내 답과 비교해 보세요</div>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">{step.recall.answer}</p>
            </div>
          ) : (
            <button
              type="button"
              disabled={!recall.draft.trim()}
              onClick={() => onRecall({ ...recall, revealed: true })}
              className="mt-3 text-[13px] font-semibold underline underline-offset-2 disabled:text-faint disabled:no-underline"
            >
              적었어요 · 예시 답 보기
            </button>
          )}
        </BeforeNext>
      )}
    </div>
  );
}

/** 다음 단계가 열렸는가 */
export function explainOpen(step: ExplainStep, quizAnswer: number | null, recall: RecallState): boolean {
  if (step.quiz) return quizAnswer !== null;
  if (step.recall) return recall.revealed;
  return true;
}

/** 3 실습: 실행마다 결과를 먼저 예상하고, 고르면 실제 결과가 열린다 */
export function PracticeView({
  step,
  guesses,
  onGuess,
}: {
  step: LessonSteps["practice"];
  guesses: (number | null)[];
  onGuess: (index: number, n: number) => void;
}) {
  const allDone = step.runs.every((_, i) => guesses[i] != null);
  return (
    <div className="pb-4">
      <StepTitle>{step.title}</StepTitle>
      <RichText text={step.text} className="mx-6 mt-3 text-[15px] leading-[1.7] text-sub" />
      {step.code && (
        <div className="mx-6 mt-5">
          <CodeBlock code={step.code} />
        </div>
      )}
      <section className="mx-6 mt-7" aria-label="실행 결과 예상">
        <h2 className="border-b border-line pb-2.5 text-xs font-medium text-soft">결과를 먼저 예상하고 골라요</h2>
        {step.runs.map((run, i) => {
          const guess = guesses[i] ?? null;
          const right = guess === run.answer;
          return (
            <div key={run.call} className="border-b border-line py-4">
              <div className="text-[14px] font-semibold tracking-[-0.2px]">{run.call}</div>
              {run.note && <div className="mt-0.5 text-xs text-soft">{run.note}</div>}
              <div role="radiogroup" aria-label={`${run.call} 결과 예상`} className="mt-3 flex flex-wrap gap-2">
                {run.choices.map((c, j) => {
                  const n = j + 1;
                  const on = guess === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      disabled={guess !== null}
                      onClick={() => onGuess(i, n)}
                      className={`h-9 rounded-full border px-4 text-[14px] ${
                        on ? "border-ink bg-ink font-semibold text-white" : "border-line-strong text-sub disabled:text-faint"
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
              {guess !== null && (
                <div className="fade-up mt-3 flex items-start gap-2 text-[14px] leading-relaxed">
                  <span
                    className={`mt-[7px] size-1.5 shrink-0 rounded-full ${right ? "bg-gold" : "bg-wrong"}`}
                    aria-label={right ? "예상이 맞음" : "예상과 다름"}
                  />
                  <span>
                    <span className="text-soft">실제 </span>
                    <b className="font-semibold">{run.output}</b>
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </section>
      {allDone && step.after && <p className="mx-6 mt-5 text-[14px] leading-relaxed text-muted">{step.after}</p>}
    </div>
  );
}

/** 7 면접 답변: 먼저 말하고, 모범 답변의 뼈대와 비교해 말한 항목만 직접 체크한다 */
export function InterviewView({
  step,
  answer,
  onAnswer,
  checked,
  onToggle,
}: {
  step: LessonSteps["interview"];
  answer: RecallState;
  onAnswer: (state: RecallState) => void;
  checked: boolean[];
  onToggle: (index: number) => void;
}) {
  const count = checked.filter(Boolean).length;
  return (
    <div className="pb-4">
      <StepTitle>면접에서는 이렇게 물어요</StepTitle>
      <div className="mx-6 mt-4 rounded-[14px] bg-surface px-4 py-3.5 text-[15px] leading-relaxed font-medium">
        {step.question}
      </div>
      <div className="mx-6 mt-6">
        <label htmlFor="interview-answer" className="text-[13px] font-medium">
          먼저 내 답변을 말하거나 적어요
        </label>
        <div className="mt-2">
          <SpokenInput
            id="interview-answer"
            value={answer.draft}
            onChange={(draft) => onAnswer({ ...answer, draft })}
            placeholder="정의 → 원리 → 해결 → 경험 순서로"
            rows={5}
            disabled={answer.revealed}
          />
        </div>
      </div>

      {answer.revealed ? (
        <section className="fade-up mx-6 mt-7" aria-labelledby="model-title">
          <div className="flex items-baseline justify-between border-b border-line pb-2.5">
            <h2 id="model-title" className="text-xs font-medium text-soft">
              모범 답변의 뼈대 · 말한 것만 직접 체크해요
            </h2>
            <span className="text-xs text-soft">
              <b className="text-ink">{count}</b> / {step.points.length}
            </span>
          </div>
          {step.points.map((p, i) => (
            <button
              key={p.label}
              type="button"
              role="checkbox"
              aria-checked={checked[i]}
              onClick={() => onToggle(i)}
              className="flex w-full items-start gap-3 border-b border-line py-3.5 text-left"
            >
              <span className="w-9 shrink-0 pt-px text-xs font-semibold text-soft">{p.label}</span>
              <span className="flex-1 text-[14px] leading-relaxed">{p.text}</span>
              <span
                className={`mt-1 flex size-[18px] shrink-0 items-center justify-center rounded-full border ${
                  checked[i] ? "border-gold bg-gold" : "border-line-strong"
                }`}
                aria-hidden="true"
              />
            </button>
          ))}
          <p className="mt-3 text-xs leading-relaxed text-soft">빠진 항목은 다음 확인 때 떠올려 보세요.</p>
        </section>
      ) : (
        <p className="mx-6 mt-4 text-xs text-soft">모범 답변은 내가 먼저 말한 뒤에 열려요.</p>
      )}
    </div>
  );
}
