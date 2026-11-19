"use client";

import Link from "next/link";
import { useState } from "react";
import { BottomNav } from "@/components/ui/BottomNav";
import { PrimaryButton } from "@/components/ui/buttons";
import { ArrowRightIcon } from "@/components/ui/icons";
import { StageBar } from "@/components/ui/StageBar";
import { api } from "@/lib/api";
import { checkReason, minutesFor, passedChecks } from "@/lib/schedule";
import { useClientValue, useRemote } from "@/lib/useRemote";
import { FirstRunSheet } from "./FirstRunSheet";

const FIRST_RUN_KEY = "retrievo.firstRunSeen";

const fetchToday = () => api.todayChecks();

function todayLabel(): string {
  return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "long" }).format(new Date());
}

function firstRunSeen(): boolean {
  try {
    return localStorage.getItem(FIRST_RUN_KEY) !== null;
  } catch {
    return true; // 저장소를 못 쓰면 안내를 띄우지 않는다
  }
}

export function TodayScreen() {
  const [state, retry] = useRemote(fetchToday);
  // 날짜와 첫 사용 여부는 브라우저에서만 알 수 있다
  const dateLabel = useClientValue(todayLabel, "");
  const seen = useClientValue(firstRunSeen, true);
  const [sheetOpen, setSheetOpen] = useState<boolean | null>(null);
  const showFirstRun = sheetOpen ?? !seen;

  const closeFirstRun = () => {
    setSheetOpen(false);
    try {
      localStorage.setItem(FIRST_RUN_KEY, "1");
    } catch {
      // 저장하지 못하면 다음에 한 번 더 보일 뿐이다
    }
  };

  const checks = state.status === "ready" ? state.data : [];

  return (
    <main className="app-frame">
      <header className="flex h-14 shrink-0 items-center px-6">
        <div className="text-[17px] font-semibold tracking-[-0.4px]">Retrievo</div>
      </header>

      <section className="px-6 pt-5" aria-labelledby="today-title">
        <div className="h-5 text-[13px] text-soft">{dateLabel}</div>
        <div className="mt-1.5 flex items-end gap-3.5">
          <div className="text-[104px] leading-[0.9] font-semibold tracking-[-6px]" aria-hidden="true">
            {state.status === "ready" ? checks.length : "·"}
          </div>
          <div className="pb-1.5">
            <h1 id="today-title" className="text-lg font-semibold tracking-[-0.3px]">
              <span className="sr-only">{checks.length}개 </span>오늘 꺼낼 개념
            </h1>
            <div className="mt-0.5 text-[13px] text-soft">
              {state.status === "ready" && checks.length > 0 ? `약 ${minutesFor(checks.length)}분` : " "}
            </div>
          </div>
        </div>
        <div className="mt-3.5 flex items-center gap-2 text-[13px] text-muted">
          다시 확인할 때가 된 개념이에요
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            aria-label="숫자와 막대의 뜻"
            className="inline-flex size-5 items-center justify-center rounded-full border border-[#C9C9C9] text-[11px] font-semibold text-muted"
          >
            ?
          </button>
        </div>
      </section>

      <section className="mx-6 mt-7 border-t border-line" aria-label="오늘 꺼낼 개념 목록">
        {state.status === "loading" && <ListSkeleton />}
        {state.status === "error" && (
          <div className="py-8 text-center text-sm text-muted">
            <p>오늘 꺼낼 개념을 불러오지 못했어요.</p>
            <p className="mt-1 text-xs text-faint">{state.message}</p>
            <button type="button" onClick={retry} className="mt-4 text-sm font-semibold text-ink underline">
              다시 불러오기
            </button>
          </div>
        )}
        {state.status === "ready" && checks.length === 0 && (
          <p className="py-8 text-sm leading-relaxed text-muted">
            오늘은 다시 확인할 개념이 없어요. 새 레슨을 배우면 3일 뒤부터 여기에 나와요.
          </p>
        )}
        {checks.map((check) => (
          <Link
            key={check.conceptId}
            href="/check"
            className="flex h-[70px] items-center gap-3.5 border-b border-line"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-semibold tracking-[-0.2px]">{check.conceptName}</div>
              <div className="mt-[3px] flex items-center gap-1.5 text-[13px] text-soft">
                {check.sureWrong && <span className="size-1.5 shrink-0 rounded-full bg-wrong" aria-hidden="true" />}
                {checkReason(check)}
              </div>
            </div>
            <StageBar passed={passedChecks(check.attemptNo)} />
          </Link>
        ))}
      </section>

      <div className="sticky bottom-16 mt-auto px-6 pt-6 pb-4">
        {checks.length > 0 && (
          <PrimaryButton href="/check">
            {checks.length}개 꺼내기
            <ArrowRightIcon />
          </PrimaryButton>
        )}
      </div>

      <BottomNav active="오늘" />

      {showFirstRun && (
        <FirstRunSheet title={sheetOpen ? "숫자와 막대의 뜻" : undefined} onClose={closeFirstRun} />
      )}
    </main>
  );
}

function ListSkeleton() {
  return (
    <div aria-busy="true" aria-label="불러오는 중">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex h-[70px] items-center gap-3.5 border-b border-line">
          <div className="flex-1">
            <div className="h-4 w-40 rounded bg-surface" />
            <div className="mt-2 h-3 w-28 rounded bg-surface" />
          </div>
          <div className="h-1 w-14 rounded bg-surface" />
        </div>
      ))}
    </div>
  );
}
