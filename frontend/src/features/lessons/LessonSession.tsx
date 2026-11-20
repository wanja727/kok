"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { BottomActions, PrimaryButton, TextButton } from "@/components/ui/buttons";
import { ArrowRightIcon, CloseIcon } from "@/components/ui/icons";
import { LoadError } from "@/components/ui/LoadError";
import { SessionTopBar } from "@/components/ui/SessionTopBar";
import { api } from "@/lib/api";
import { isDueToday, lessonPageUrl, lessonProgress, nextCheckLabel, type LessonProgress } from "@/lib/lessonProgress";
import { serviceDate } from "@/lib/schedule";
import { useRemote } from "@/lib/useRemote";
import { RetrySolve, type RetrySummary } from "../solve/RetrySolve";
import { LessonBody } from "./body/LessonBody";

type Phase = "intro" | "body" | "solve" | "done";

/**
 * 레슨 하나. 판정 문제를 모두 맞힐 때까지 묻는다. 틀린 문제는 다른 문제를 푼 뒤 다시 나온다.
 * 같은 날 모두 맞히면 배운 날 기준을 통과해 3일 뒤 다시 묻는다 (ADR-017, ADR-021).
 * 이미 배운 레슨(1단계 이상)은 다시 풀어도 연습으로만 기록되고 일정은 바뀌지 않는다.
 * - 본문이 있는 레슨: 본문 7단계(예측 → … → 확인(문제 풀기) → 면접 답변) → 결과
 * - 본문이 아직 없는 레슨: 소개(본문은 레슨 사이트 링크) → 문제 풀기 → 결과
 */
export function LessonSession({ lessonId }: { lessonId: number }) {
  const fetchLesson = useCallback(async () => {
    const [lesson, questions, concepts] = await Promise.all([
      api.lesson(lessonId),
      api.lessonQuestions(lessonId),
      api.concepts(),
    ]);
    // 배운 날 기준을 이미 넘은 레슨이면 다시 풀어도 연습이다
    const learned = concepts.some((c) => c.lessonId === lessonId && c.stage >= 1);
    return { lesson, questions, learned };
  }, [lessonId]);
  const [load, retry] = useRemote(fetchLesson);
  const [phaseState, setPhase] = useState<Phase | null>(null);
  const [round, setRound] = useState(0);
  const [summary, setSummary] = useState<RetrySummary | null>(null);

  if (load.status === "loading") {
    return <main className="app-frame" aria-busy="true" />;
  }
  if (load.status === "error") {
    return <LoadError what="레슨을" message={load.message} onRetry={retry} />;
  }

  const { lesson, questions, learned } = load.data;
  const phase: Phase = phaseState ?? (lesson.steps ? "body" : "intro");

  const start = () => {
    setRound((r) => r + 1);
    setSummary(null);
    setPhase("solve");
    window.scrollTo(0, 0);
  };

  if (phase === "body" && lesson.steps) {
    return (
      <LessonBody
        key={round}
        lesson={lesson}
        steps={lesson.steps}
        questions={questions}
        onFinish={(done) => {
          setSummary(done);
          setPhase("done");
          window.scrollTo(0, 0);
        }}
      />
    );
  }

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
          <Step n={2} title={questions.length > 1 ? `문제 ${questions.length}개를 모두 맞힐 때까지` : "문제를 맞힐 때까지"}>
            답과 확신도를 고르면 해설이 열려요. 틀린 문제는 해설을 읽고, 다른 문제를 푼 뒤에 다시 풀어요.
          </Step>
          <Step n={3} title="3일 뒤 다시 확인">
            {learned
              ? "이미 배운 레슨이에요. 다시 풀어도 연습으로만 남고, 3일·7일·21일 확인 일정은 바뀌지 않아요."
              : "모두 맞히면 배운 날로 쳐요. 3일·7일·21일 뒤에 다시 물어요."}
          </Step>
        </ol>

        <BottomActions>
          <PrimaryButton onClick={start} disabled={questions.length === 0}>
            {questions.length === 0
              ? "아직 풀 문제가 없어요"
              : learned
                ? "다시 풀어 보기"
                : `문제 ${questions.length}개 풀기`}
          </PrimaryButton>
        </BottomActions>
      </main>
    );
  }

  if (phase === "done" && summary) {
    return <LessonDone lessonId={lesson.id} summary={summary} onAgain={start} />;
  }

  return (
    <RetrySolve
      key={round}
      questions={questions}
      context={`${lesson.unit} · ${lesson.title}`}
      mode="LESSON"
      topBar={(solved, total) => (
        <SessionTopBar title={`${solved} / ${total} 맞힘`} current={solved} total={total} closeHref="/lessons" />
      )}
      finishLabel="마치기"
      onFinish={(done) => {
        setSummary(done);
        setPhase("done");
        window.scrollTo(0, 0);
      }}
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

/** 레슨을 마친 뒤. 처음에 맞힌 수, 다시 풀어 맞힌 수, 이 레슨을 언제 다시 묻는지 */
function LessonDone({
  lessonId,
  summary,
  onAgain,
}: {
  lessonId: number;
  summary: RetrySummary;
  onAgain: () => void;
}) {
  const { total, firstCorrect: correct } = summary;
  const retried = total - correct;
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
        <div className="text-[13px] text-muted">처음에 맞힌 문제</div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-[88px] leading-[0.9] font-semibold tracking-[-5px]">{correct}</span>
          <span className="text-lg text-soft">/ {total}</span>
        </div>
        <div className="mt-6 grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.max(total, 1)}, minmax(0, 1fr))` }}>
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={`h-1.5 rounded-full ${i < correct ? "bg-gold" : "bg-line-strong"}`} />
          ))}
        </div>
        {retried > 0 && (
          <p className="mt-6 text-[15px] leading-relaxed text-ink">틀렸던 {retried}문제도 다시 풀어 모두 맞혔어요.</p>
        )}
        <p className={`${retried > 0 ? "mt-2" : "mt-6"} min-h-[3.4em] text-[15px] leading-relaxed text-muted`}>
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
    return <>아직 배우는 중이에요. 같은 날 문제를 모두 맞히면 3일 뒤에 다시 물어요.</>;
  }
  const today = serviceDate();
  if (isDueToday(p, today)) {
    return <>오늘 확인할 차례예요. 오늘 탭에서 다시 물어요. 레슨에서 다시 푼 것은 연습으로만 남아요.</>;
  }
  return (
    <>
      <b className="font-semibold text-ink">{nextCheckLabel(p, today)}</b>. 그날 다시 물어요. 레슨에서 다시 푼 것은
      연습으로만 남고 일정은 바뀌지 않아요.
    </>
  );
}
