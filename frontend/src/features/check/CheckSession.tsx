"use client";

import { useState } from "react";
import { SessionTopBar } from "@/components/ui/SessionTopBar";
import { LoadError } from "@/components/ui/LoadError";
import { api, type SubmissionResult } from "@/lib/api";
import { useRemote } from "@/lib/useRemote";
import { QuestionFlow } from "../solve/QuestionFlow";
import { DoneView } from "./DoneView";

const fetchToday = () => api.todayChecks();

/** 오늘의 지연 확인을 하나씩 꺼낸다. 개념마다 처음과 다른 문제 하나 */
export function CheckSession() {
  const [load, retry] = useRemote(fetchToday);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<SubmissionResult[]>([]);

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
  return (
    <QuestionFlow
      key={check.question.questionVersionId}
      question={check.question}
      context={`${check.conceptName} · 처음과 다른 문제`}
      mode="DELAYED_CHECK"
      topBar={<SessionTopBar title={`${index + 1} / ${checks.length}`} current={index + 1} total={checks.length} />}
      nextLabel={index + 1 < checks.length ? "다음 문제" : "마치기"}
      onAnswered={(result) => setResults((rs) => [...rs, result])}
      onNext={() => setIndex(index + 1)}
    />
  );
}
