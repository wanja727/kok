"use client";

import Link from "next/link";
import { useState } from "react";
import { BottomNav } from "@/components/ui/BottomNav";
import { ArrowRightIcon, CheckIcon } from "@/components/ui/icons";
import { LoadError } from "@/components/ui/LoadError";
import { StageBar } from "@/components/ui/StageBar";
import { api } from "@/lib/api";
import {
  byNextCheck,
  isDueToday,
  lessonProgress,
  nextCheckLabel,
  type LessonProgress,
} from "@/lib/lessonProgress";
import { serviceDate } from "@/lib/schedule";
import { useClientValue, useRemote } from "@/lib/useRemote";
import { FirstRunSheet } from "../today/FirstRunSheet";

const fetchLessons = async () => {
  const [lessons, concepts] = await Promise.all([api.lessons(), api.concepts()]);
  return lessonProgress(lessons, concepts);
};

/**
 * 레슨별 진행 상태 (20장 "레슨별 이해도").
 * 관리 중인 레슨을 다음 확인이 가까운 순으로 보여주고, 졸업한 레슨은 복습에서 뺐다고 알린다.
 */
export function LessonsScreen() {
  const [state, retry] = useRemote(fetchLessons);
  const today = useClientValue(() => serviceDate(), "");
  const [helpOpen, setHelpOpen] = useState(false);

  if (state.status === "error") {
    return <LoadError what="레슨을" message={state.message} onRetry={retry} />;
  }

  const all = state.status === "ready" ? state.data : [];
  const managed = all.filter((p) => p.state === "managed").sort(byNextCheck);
  const graduated = all.filter((p) => p.state === "graduated");
  const fresh = all.filter((p) => p.state === "new");

  return (
    <main className="app-frame">
      <header className="flex h-14 shrink-0 items-center px-6">
        <h1 className="text-[17px] font-semibold tracking-[-0.3px]">레슨</h1>
        <button
          type="button"
          onClick={() => setHelpOpen(true)}
          aria-label="막대의 뜻"
          className="ml-auto inline-flex size-5 items-center justify-center rounded-full border border-[#C9C9C9] text-[11px] font-semibold text-muted"
        >
          ?
        </button>
      </header>

      {state.status === "loading" ? (
        <div className="px-6 pt-1" aria-busy="true" aria-label="불러오는 중">
          <div className="h-9 w-40 rounded bg-surface" />
          <div className="mt-4 h-1.5 rounded bg-surface" />
        </div>
      ) : (
        <Summary total={all.length} graduated={graduated.length} managed={managed.length} fresh={fresh.length} />
      )}

      {managed.length > 0 && (
        <section className="mx-6 mt-[18px]" aria-labelledby="managed-title">
          <SectionLabel id="managed-title">관리 중 {managed.length} · 다음 확인이 가까운 순</SectionLabel>
          {managed.map((p) => (
            <ManagedRow key={p.lesson.id} progress={p} today={today} />
          ))}
        </section>
      )}

      {graduated.length > 0 && (
        <section className="mx-6 mt-3 rounded-[14px] bg-surface px-4 py-3" aria-label="졸업한 레슨">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CheckIcon size={16} />
            졸업 {graduated.length} · 복습에서 뺐어요
          </div>
          <div className="mt-1 text-xs leading-relaxed text-muted">
            {graduated.map((p) => p.lesson.title).join(" · ")}
          </div>
        </section>
      )}

      {fresh.length > 0 && (
        <section className="mx-6 mt-[18px] pb-6" aria-labelledby="fresh-title">
          <SectionLabel id="fresh-title">시작 전 {fresh.length}</SectionLabel>
          {fresh.map((p) => (
            <Link
              key={p.lesson.id}
              href={`/lessons/${p.lesson.id}`}
              className="flex h-14 items-center gap-3 border-b border-line"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-medium tracking-[-0.2px]">{p.lesson.title}</div>
                <div className="mt-0.5 text-xs text-soft">{p.lesson.unit}</div>
              </div>
              <ArrowRightIcon size={16} className="text-faint" />
            </Link>
          ))}
        </section>
      )}

      <div className="mt-auto" />
      <BottomNav active="레슨" />

      {helpOpen && <FirstRunSheet title="숫자와 막대의 뜻" onClose={() => setHelpOpen(false)} />}
    </main>
  );
}

function SectionLabel({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="border-b border-line pb-2.5 text-xs font-medium text-soft">
      {children}
    </h2>
  );
}

/** 졸업 수와 레슨 전체를 한 줄 막대로. 한 칸이 레슨 하나 */
function Summary({
  total,
  graduated,
  managed,
  fresh,
}: {
  total: number;
  graduated: number;
  managed: number;
  fresh: number;
}) {
  const cells = [
    ...Array<string>(graduated).fill("bg-gold"),
    ...Array<string>(managed).fill("bg-faint"),
    ...Array<string>(fresh).fill("bg-line-strong"),
  ];
  return (
    <section className="px-6 pt-1" aria-label="레슨 진행">
      <div className="flex items-baseline gap-2">
        <span className="text-4xl leading-none font-semibold tracking-[-1.5px]">{graduated}</span>
        <span className="text-[15px] text-muted">/ {total} 레슨 졸업</span>
      </div>
      <div
        role="img"
        aria-label={`${total}개 레슨: 졸업 ${graduated}, 관리 중 ${managed}, 시작 전 ${fresh}`}
        className="mt-3.5 grid gap-[3px]"
        style={{ gridTemplateColumns: `repeat(${Math.max(total, 1)}, minmax(0, 1fr))` }}
      >
        {cells.map((cls, i) => (
          <span key={i} className={`h-1.5 rounded-[3px] ${cls}`} />
        ))}
      </div>
      <div className="mt-2.5 flex gap-4 text-xs text-muted">
        <Legend dot="bg-gold">졸업 {graduated}</Legend>
        <Legend dot="bg-faint">관리 중 {managed}</Legend>
        <Legend dot="bg-line-strong">시작 전 {fresh}</Legend>
      </div>
    </section>
  );
}

function Legend({ dot, children }: { dot: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-1.5 rounded-full ${dot}`} aria-hidden="true" />
      {children}
    </span>
  );
}

function ManagedRow({ progress: p, today }: { progress: LessonProgress; today: string }) {
  const due = today !== "" && isDueToday(p, today);
  return (
    <Link href={`/lessons/${p.lesson.id}`} className="flex h-16 items-center gap-3 border-b border-line">
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold tracking-[-0.2px]">{p.lesson.title}</div>
        <div className={`mt-0.5 flex items-center gap-1.5 text-xs ${due ? "text-ink" : "text-soft"}`}>
          {p.sureWrong && <span className="size-1.5 shrink-0 rounded-full bg-wrong" aria-hidden="true" />}
          <span className="truncate">
            {p.lesson.unit} · {today === "" ? " " : nextCheckLabel(p, today)}
          </span>
        </div>
      </div>
      <StageBar passed={p.passed} />
    </Link>
  );
}
