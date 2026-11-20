"use client";

import { useState } from "react";
import type { LessonDetail, LessonSteps, QuestionView } from "@/lib/api";
import { RetrySolve, type RetrySummary } from "../../solve/RetrySolve";
import { BodyTopBar, STEP_NAMES, StepNav } from "./parts";
import {
  EMPTY_RECALL,
  ExplainView,
  InterviewView,
  PracticeView,
  PredictView,
  PredictionResult,
  explainOpen,
  type RecallState,
} from "./steps";

type ExplainKey = "background" | "pitfall" | "fix";

/** 단계 번호(1부터) → 본문 항목. 6(확인)은 레슨의 판정 문제를 모두 맞힐 때까지 푼다 (ADR-021) */
const EXPLAIN_AT: Record<number, ExplainKey> = { 2: "background", 4: "pitfall", 5: "fix" };

/**
 * 레슨 본문 7단계를 한 단계씩 넘긴다 (20장).
 * 단계 끝에서 보지 않고 꺼내 봐야 다음 단계가 열린다. 이전 단계로 돌아가도 이미 연 것은 그대로다.
 */
export function LessonBody({
  lesson,
  steps,
  questions,
  onFinish,
}: {
  lesson: LessonDetail;
  steps: LessonSteps;
  questions: QuestionView[];
  onFinish: (summary: RetrySummary) => void;
}) {
  const [step, setStepState] = useState(1);
  const [predicted, setPredicted] = useState<number | null>(null);
  const [quiz, setQuiz] = useState<Record<ExplainKey, number | null>>({ background: null, pitfall: null, fix: null });
  const [recall, setRecall] = useState<Record<ExplainKey, RecallState>>({
    background: EMPTY_RECALL,
    pitfall: EMPTY_RECALL,
    fix: EMPTY_RECALL,
  });
  const [guesses, setGuesses] = useState<(number | null)[]>(() => steps.practice.runs.map(() => null));
  // 확인 단계를 마치면 요약을 둔다. 앞 단계로 갔다 와도 다시 풀지 않는다
  const [summary, setSummary] = useState<RetrySummary | null>(null);
  const [interview, setInterview] = useState<RecallState>(EMPTY_RECALL);
  const [checked, setChecked] = useState<boolean[]>(() => steps.interview.points.map(() => false));

  const go = (next: number) => {
    // 확인할 문제가 없으면 6단계를 건너뛴다
    const target = next === 6 && questions.length === 0 ? (step < 6 ? 7 : 5) : next;
    setStepState(target);
    window.scrollTo(0, 0);
  };
  const nextName = (n: number) => `다음 · ${STEP_NAMES[n]}`;
  const top = (sub?: string) => <BodyTopBar title={lesson.title} step={step} sub={sub} />;

  if (step === 1) {
    return (
      <main className="app-frame">
        {top()}
        <PredictView step={steps.predict} selected={predicted} onSelect={setPredicted} />
        <StepNav
          onNext={() => go(2)}
          nextLabel="예측하고 계속"
          disabled={predicted === null}
          hint={predicted === null ? "설명은 예측한 다음에 열려요" : undefined}
        />
      </main>
    );
  }

  const explainKey = EXPLAIN_AT[step];
  if (explainKey) {
    const s = steps[explainKey];
    const open = explainOpen(s, quiz[explainKey], recall[explainKey]);
    return (
      <main className="app-frame">
        {top()}
        <ExplainView
          key={explainKey}
          id={explainKey}
          step={s}
          header={explainKey === "pitfall" ? <PredictionResult step={steps.predict} predicted={predicted} /> : undefined}
          quizAnswer={quiz[explainKey]}
          onQuiz={(n) => setQuiz((q) => ({ ...q, [explainKey]: n }))}
          recall={recall[explainKey]}
          onRecall={(r) => setRecall((all) => ({ ...all, [explainKey]: r }))}
        />
        <StepNav
          onBack={() => go(step - 1)}
          onNext={() => go(step + 1)}
          nextLabel={nextName(step)}
          disabled={!open}
          hint={open ? undefined : s.quiz ? "답을 골라야 다음 단계가 열려요" : "답을 적어야 다음 단계가 열려요"}
        />
      </main>
    );
  }

  if (step === 3) {
    const done = guesses.every((g) => g !== null);
    return (
      <main className="app-frame">
        {top()}
        <PracticeView
          step={steps.practice}
          guesses={guesses}
          onGuess={(i, n) => setGuesses((gs) => gs.map((g, j) => (j === i ? n : g)))}
        />
        <StepNav
          onBack={() => go(2)}
          onNext={() => go(4)}
          nextLabel={nextName(3)}
          disabled={!done}
          hint={done ? undefined : "결과를 모두 예상해야 다음 단계가 열려요"}
        />
      </main>
    );
  }

  if (step === 6 && summary === null) {
    return (
      <RetrySolve
        questions={questions}
        context={`${lesson.unit} · ${lesson.title}`}
        mode="LESSON"
        topBar={(solved, total) => top(`${solved} / ${total} 맞힘`)}
        finishLabel={nextName(6)}
        onFinish={(done) => {
          setSummary(done);
          go(7);
        }}
      />
    );
  }

  return (
    <main className="app-frame">
      {top()}
      <InterviewView
        step={steps.interview}
        answer={interview}
        onAnswer={setInterview}
        checked={checked}
        onToggle={(i) => setChecked((cs) => cs.map((c, j) => (j === i ? !c : c)))}
      />
      {interview.revealed ? (
        <StepNav onNext={() => onFinish(summary ?? { total: 0, firstCorrect: 0 })} nextLabel="레슨 마치기" />
      ) : (
        <StepNav
          onNext={() => setInterview({ ...interview, revealed: true })}
          nextLabel="모범 답변과 비교하기"
          disabled={!interview.draft.trim()}
          hint={interview.draft.trim() ? undefined : "먼저 말하거나 적어야 비교할 수 있어요"}
        />
      )}
    </main>
  );
}
