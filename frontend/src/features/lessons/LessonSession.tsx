"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { BottomActions, PrimaryButton, TextButton } from "@/components/ui/buttons";
import { ArrowRightIcon, CloseIcon } from "@/components/ui/icons";
import { LoadError } from "@/components/ui/LoadError";
import { SessionTopBar } from "@/components/ui/SessionTopBar";
import { api, type SubmissionResult } from "@/lib/api";
import { lessonPageUrl, lessonProgress, nextCheckLabel, type LessonProgress } from "@/lib/lessonProgress";
import { serviceDate } from "@/lib/schedule";
import { useRemote } from "@/lib/useRemote";
import { QuestionFlow } from "../solve/QuestionFlow";

type Phase = "intro" | "solve" | "done";

/**
 * 레슨 하나: 소개 → 문제 풀기(답 먼저 → 보기와 확신도 → 해설) → 결과.
 * 같은 날 3번 맞힌 개념은 배운 날 기준을 통과해 3일 뒤 다른 문제로 다시 묻는다 (ADR-017).
 * 레슨 본문 7단계는 아직 dev-lessons 사이트에 있어서 그 페이지로 연결한다.
 */
export function LessonSession({ lessonId }: { lessonId: number }) {
  const fetchLesson = useCallback(async () => {
    const [lessons, questions] = await Promise.all([api.lessons(), api.lessonQuestions(lessonId)]);
    const lesson = lessons.find((l) => l.id === lessonId);
    if (!lesson) throw new Error("없는 레슨이에요");
    return { lesson, questions };
  }, [lessonId]);
  const [load, retry] = useRemote(fetchLesson);
  const [phase, setPhase] = useState<Phase>("intro");
  const [round, setRound] = useState(0);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<SubmissionResult[]>([]);

  if (load.status === "loading") {
    return <main className="app-frame" aria-busy="true" />;
  }
  if (load.status === "error") {
    return <LoadError what="레슨을" message={load.message} onRetry={retry} />;
  }

  const { lesson, questions } = load.data;

  const start = () => {
    setRound((r) => r + 1);
    setIndex(0);
    setResults([]);
    setPhase("solve");
    window.scrollTo(0, 0);
  };

  if (phase === "intro") {
    return (
      <main className="app-frame">
        <header className="grid h-14 shrink-0 grid-cols-[44px_1fr_44px] items-center px-3">
          <Link href="/lessons" aria-label="닫기" className="flex size-11 items-center justify-center">
            <CloseIcon />
          </Link>
        </header>
        <div className="px-6 pt-6">
          <div className="text-[13px] text-muted">{lesson.unit}</div>
          <h1 className="mt-2 text-[28px] leading-snug font-semibold tracking-[-0.8px]">{lesson.title}</h1>
        </div>

        <ol className="mx-6 mt-8 flex flex-col border-t border-line">
          <Step n={1} title="본문 읽기">
            예측부터 면접 답변까지 7단계. 지금은 레슨 사이트에서 열려요.
            <a
              href={lessonPageUrl(lesson.key)}
              target="_blank"
              rel="noreferrer"
              className="mt-2 flex items-center gap-1 text-[13px] font-semibold text-ink underline underline-offset-2"
            >
              레슨 본문 열기
              <ArrowRightIcon size={14} />
            </a>
          </Step>
          <Step n={2} title={`문제 ${questions.length}개 풀기`}>
            객관식은 보기를 보기 전에 내 답을 먼저 적어요. 고른 뒤에는 얼마나 확실한지 골라요.
          </Step>
          <Step n={3} title="3일 뒤 다시 확인">
            같은 날 3번 맞히면 배운 날로 쳐요. 3일·7일·21일 뒤에 다른 문제로 다시 물어요.
          </Step>
        </ol>

        <BottomActions>
          <PrimaryButton onClick={start} disabled={questions.length === 0}>
            {questions.length === 0 ? "아직 풀 문제가 없어요" : `문제 ${questions.length}개 풀기`}
          </PrimaryButton>
        </BottomActions>
      </main>
    );
  }

  if (phase === "done") {
    return (
      <LessonDone
        lessonId={lesson.id}
        total={results.length}
        correct={results.filter((r) => r.correct).length}
        onAgain={start}
      />
    );
  }

  const question = questions[index];
  const last = index + 1 >= questions.length;
  return (
    <QuestionFlow
      key={`${round}-${question.questionVersionId}`}
      question={question}
      context={`${lesson.unit} · ${lesson.title}`}
      mode="LESSON"
      topBar={
        <SessionTopBar
          title={`${index + 1} / ${questions.length}`}
          current={index + 1}
          total={questions.length}
          closeHref="/lessons"
        />
      }
      nextLabel={last ? "마치기" : "다음 문제"}
      onAnswered={(result) => setResults((rs) => [...rs, result])}
      onNext={() => (last ? setPhase("done") : setIndex(index + 1))}
    />
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4 border-b border-line py-4">
      <span className="w-4 pt-px text-[13px] font-semibold text-faint">{n}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-semibold tracking-[-0.2px]">{title}</div>
        <div className="mt-1 text-[13px] leading-relaxed text-muted">{children}</div>
      </div>
    </li>
  );
}

/** 레슨을 마친 뒤. 맞힌 수와, 이 레슨을 언제 다시 묻는지 */
function LessonDone({
  lessonId,
  total,
  correct,
  onAgain,
}: {
  lessonId: number;
  total: number;
  correct: number;
  onAgain: () => void;
}) {
  // 제출할 때 서버가 진행 상태를 바꿨으니 다시 불러온다
  const fetchProgress = useCallback(async () => {
    const [lessons, concepts] = await Promise.all([api.lessons(), api.concepts()]);
    return lessonProgress(lessons, concepts).find((p) => p.lesson.id === lessonId) ?? null;
  }, [lessonId]);
  const [load] = useRemote(fetchProgress);
  const progress = load.status === "ready" ? load.data : null;
  const learning = progress !== null && progress.state === "managed" && progress.passed === 0;

  return (
    <main className="app-frame">
      <div className="fade-up px-6 pt-24">
        <div className="text-[13px] text-muted">이번에 맞힌 문제</div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-[88px] leading-[0.9] font-semibold tracking-[-5px]">{correct}</span>
          <span className="text-lg text-soft">/ {total}</span>
        </div>
        <div className="mt-6 grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.max(total, 1)}, minmax(0, 1fr))` }}>
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={`h-1.5 rounded-full ${i < correct ? "bg-gold" : "bg-line-strong"}`} />
          ))}
        </div>
        <p className="mt-6 min-h-[3.4em] text-[15px] leading-relaxed text-muted">
          {progress && <NextStep progress={progress} />}
        </p>
      </div>
      <BottomActions>
        <PrimaryButton href="/lessons">레슨 목록으로</PrimaryButton>
        {learning && <TextButton onClick={onAgain}>한 번 더 풀기</TextButton>}
      </BottomActions>
    </main>
  );
}

function NextStep({ progress: p }: { progress: LessonProgress }) {
  if (p.state === "graduated") {
    return <>졸업한 레슨이에요. 다시 풀어도 복습 일정은 바뀌지 않아요.</>;
  }
  if (p.state === "new" || p.passed === 0) {
    return <>아직 배우는 중이에요. 같은 날 3번 맞히면 3일 뒤에 다른 문제로 다시 물어요.</>;
  }
  return (
    <>
      <b className="font-semibold text-ink">{nextCheckLabel(p, serviceDate())}</b>. 그날 다른 문제로 다시 물어요. 레슨에서
      다시 풀어도 일정은 바뀌지 않아요.
    </>
  );
}
