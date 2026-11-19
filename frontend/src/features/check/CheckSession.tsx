"use client";

import { useState } from "react";
import { LoadError } from "@/components/ui/LoadError";
import { SessionTopBar } from "@/components/ui/SessionTopBar";
import { api, type SubmissionResult } from "@/lib/api";
import { TOTAL_CHECKS } from "@/lib/stages";
import { useRemote } from "@/lib/useRemote";
import { QuestionFlow } from "../solve/QuestionFlow";
import { DoneView } from "./DoneView";
import { GraduateView } from "./GraduateView";
import { TeachStep } from "./TeachStep";

const fetchToday = () => api.todayChecks();

/** 문제를 푼 뒤: 다음 개념으로 가거나, 마지막 확인을 맞혔으면 졸업 확인(가르치듯 설명)과 졸업 화면을 거친다 */
type After = "teach" | "graduate" | null;

/**
 * 오늘의 지연 확인을 하나씩 꺼낸다. 개념마다 처음과 다른 문제 하나.
 * 마지막(21일) 확인을 맞히면 졸업한다: 가르치듯 말해 보기(자기 채점) → 졸업 화면 (20장, ADR-017)
 */
export function CheckSession() {
  const [load, retry] = useRemote(fetchToday);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<SubmissionResult[]>([]);
  const [after, setAfter] = useState<After>(null);

  if (load.status === "loading") {
    return <main className="app-frame" aria-busy="true" />;
  }
  if (load.status === "error") {
    return <LoadError what="문제를" message={load.message} onRetry={retry} />;
  }

  const checks = load.data;
  if (checks.length === 0 || index >= checks.length) {
    return <DoneView total={checks.length} correct={results.filter((r) => r.correct).length} />;
  }

  const check = checks[index];
  const nextLabel = index + 1 < checks.length ? "다음 개념" : "마치기";
  const next = () => {
    setAfter(null);
    setIndex(index + 1);
    window.scrollTo(0, 0);
  };

  if (after === "teach" && check.teach) {
    return (
      <TeachStep
        key={check.conceptId}
        conceptName={check.conceptName}
        prompt={check.teach}
        onDone={() => {
          setAfter("graduate");
          window.scrollTo(0, 0);
        }}
      />
    );
  }
  if (after === "graduate") {
    return (
      <GraduateView
        key={check.conceptId}
        conceptId={check.conceptId}
        conceptName={check.conceptName}
        nextLabel={nextLabel}
        onNext={next}
      />
    );
  }

  const isLastCheck = check.attemptNo === TOTAL_CHECKS - 1;
  const graduated = isLastCheck && results.at(-1)?.correct === true && results.length === index + 1;
  return (
    <QuestionFlow
      key={check.question.questionVersionId}
      question={check.question}
      context={`${check.conceptName} · ${isLastCheck ? "21일 뒤 마지막 확인" : "처음과 다른 문제"}`}
      mode="DELAYED_CHECK"
      topBar={<SessionTopBar title={`${index + 1} / ${checks.length}`} current={index + 1} total={checks.length} />}
      nextLabel={graduated ? (check.teach ? "졸업 확인" : "졸업") : index + 1 < checks.length ? "다음 문제" : "마치기"}
      onAnswered={(result) => setResults((rs) => [...rs, result])}
      onNext={() => {
        if (graduated) setAfter(check.teach ? "teach" : "graduate");
        else next();
        window.scrollTo(0, 0);
      }}
    />
  );
}
