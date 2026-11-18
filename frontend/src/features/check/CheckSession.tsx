"use client";

import { useState } from "react";
import { BottomActions, PrimaryButton } from "@/components/ui/buttons";
import { SessionTopBar } from "@/components/ui/SessionTopBar";
import { api, type Confidence, type SubmissionResult, type TodayCheck } from "@/lib/api";
import { useRemote } from "@/lib/useRemote";
import { ChooseStep } from "./ChooseStep";
import { DoneView } from "./DoneView";
import { RecallStep, needsRecall } from "./RecallStep";
import { ResultStep } from "./ResultStep";

type Step = "recall" | "choose" | "result";

/** 문제 하나를 푸는 동안의 상태. 다음 문제로 넘어가면 새로 만든다 */
interface Attempt {
  /**
   * 처음 제출할 때 만들고 그 문제 동안 다시 쓴다.
   * 응답을 못 받아 다시 보내도 서버가 처음 결과를 돌려준다 (재시도·두 번 누르기)
   */
  clientSubmissionId: string | null;
  draft: string;
  selected: string | null;
  confidence: Confidence | null;
  result: SubmissionResult | null;
}

const NEW_ATTEMPT: Attempt = { clientSubmissionId: null, draft: "", selected: null, confidence: null, result: null };

const fetchToday = () => api.todayChecks();

/** 문제를 열 때 첫 단계. 보기에서 고르는 문제만 답을 먼저 적게 한다 */
function firstStep(check: TodayCheck | undefined): Step {
  return check && needsRecall(check.question) ? "recall" : "choose";
}

/**
 * 오늘의 지연 확인을 하나씩 꺼낸다.
 * 답 먼저 적기 → 보기와 확신도 → 해설. 정답과 해설은 제출한 뒤에만 받는다 (답 먼저).
 */
export function CheckSession() {
  const [load, retry] = useRemote(fetchToday);
  const [index, setIndex] = useState(0);
  /** null이면 아직 이 문제의 첫 단계 */
  const [stepOverride, setStepOverride] = useState<Step | null>(null);
  const [attempt, setAttempt] = useState<Attempt>(NEW_ATTEMPT);
  const [results, setResults] = useState<SubmissionResult[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (load.status === "loading") {
    return <main className="app-frame" aria-busy="true" />;
  }
  if (load.status === "error") {
    return (
      <main className="app-frame items-center justify-center px-6 text-center">
        <p className="text-sm text-muted">문제를 불러오지 못했어요.</p>
        <p className="mt-1 text-xs text-faint">{load.message}</p>
        <button type="button" onClick={retry} className="mt-4 text-sm font-semibold underline">
          다시 불러오기
        </button>
      </main>
    );
  }

  const checks = load.data;
  if (checks.length === 0 || index >= checks.length) {
    return <DoneView total={checks.length} correct={results.filter((r) => r.correct).length} />;
  }

  const check = checks[index];
  const question = check.question;
  const step = stepOverride ?? firstStep(check);
  const setStep = (s: Step) => {
    setStepOverride(s);
    window.scrollTo(0, 0);
  };
  const update = (patch: Partial<Attempt>) => setAttempt((a) => ({ ...a, ...patch }));

  const submit = async () => {
    if (!attempt.selected || !attempt.confidence) return;
    const clientSubmissionId = attempt.clientSubmissionId ?? crypto.randomUUID();
    update({ clientSubmissionId });
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await api.submit({
        clientSubmissionId,
        questionVersionId: question.questionVersionId,
        selected: attempt.selected,
        confidence: attempt.confidence,
        mode: "DELAYED_CHECK",
      });
      update({ result });
      setResults((rs) => [...rs, result]);
      setStep("result");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "제출하지 못했어요");
    } finally {
      setSubmitting(false);
    }
  };

  const next = () => {
    const nextIndex = index + 1;
    setIndex(nextIndex);
    setAttempt(NEW_ATTEMPT);
    setSubmitError(null);
    setStepOverride(null);
    window.scrollTo(0, 0);
  };

  const topBar = <SessionTopBar title={`${index + 1} / ${checks.length}`} current={index + 1} total={checks.length} />;

  if (step === "recall") {
    return (
      <main className="app-frame">
        {topBar}
        <RecallStep
          check={check}
          draft={attempt.draft}
          onDraft={(draft) => update({ draft })}
          onReveal={() => setStep("choose")}
          onDontKnow={() => {
            update({ confidence: "UNKNOWN" });
            setStep("choose");
          }}
        />
      </main>
    );
  }

  if (step === "choose" || !attempt.result) {
    return (
      <main className="app-frame">
        {topBar}
        <ChooseStep
          check={check}
          draft={attempt.draft}
          selected={attempt.selected}
          confidence={attempt.confidence}
          onSelect={(selected) => update({ selected })}
          onConfidence={(confidence) => update({ confidence })}
        />
        <BottomActions>
          {submitError && <p className="pb-2 text-center text-xs text-wrong">{submitError}</p>}
          <PrimaryButton onClick={submit} disabled={!attempt.selected || !attempt.confidence || submitting}>
            {submitting ? "채점하는 중" : "제출"}
          </PrimaryButton>
          {(!attempt.selected || !attempt.confidence) && (
            <p className="pt-2 text-center text-xs text-soft">답과 확신도를 고르면 제출할 수 있어요</p>
          )}
        </BottomActions>
      </main>
    );
  }

  return (
    <main className="app-frame">
      {topBar}
      <ResultStep check={check} result={attempt.result} />
      <BottomActions>
        <PrimaryButton onClick={next}>{index + 1 < checks.length ? "다음 문제" : "마치기"}</PrimaryButton>
      </BottomActions>
    </main>
  );
}
