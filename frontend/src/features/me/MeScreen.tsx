"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { BottomNav } from "@/components/ui/BottomNav";
import { ArrowRightIcon } from "@/components/ui/icons";
import { LoadError } from "@/components/ui/LoadError";
import { api } from "@/lib/api";
import { useRemote } from "@/lib/useRemote";
import { FirstRunSheet } from "../today/FirstRunSheet";

const fetchMe = () => api.me();

const LESSON_SITE = "https://wanja727.github.io/dev-lessons/";
const SOURCE = "https://github.com/wanja727/retrievo";

/**
 * 나: 프로필과, 이 앱이 왜 이렇게 묻는지 다시 볼 수 있는 곳.
 * 로그인(카카오, ADR-010)이 붙으면 연결된 계정과 로그아웃을 여기에 더한다.
 */
export function MeScreen() {
  const [state, retry] = useRemote(fetchMe);
  const [helpOpen, setHelpOpen] = useState(false);

  if (state.status === "error") {
    return <LoadError what="내 정보를" message={state.message} onRetry={retry} />;
  }

  const me = state.status === "ready" ? state.data : null;

  return (
    <main className="app-frame">
      <header className="flex h-14 shrink-0 items-center px-6">
        <h1 className="text-[17px] font-semibold tracking-[-0.3px]">나</h1>
      </header>

      <section className="px-6 pt-4" aria-label="프로필">
        {me ? (
          <>
            <div className="text-[28px] leading-tight font-semibold tracking-[-0.8px]">{me.nickname}</div>
            <p className="mt-1.5 text-[13px] text-muted">
              {formatDate(me.joinedOn)}부터 · <b className="font-semibold text-ink">{me.days}일째</b> 꺼내는 중
            </p>
          </>
        ) : (
          <div aria-busy="true" aria-label="불러오는 중">
            <div className="h-8 w-28 rounded bg-surface" />
            <div className="mt-2 h-4 w-44 rounded bg-surface" />
          </div>
        )}
      </section>

      <section className="mx-6 mt-9" aria-labelledby="method-title">
        <h2 id="method-title" className="border-b border-line pb-2.5 text-xs font-medium text-soft">
          Retrievo가 묻는 방식
        </h2>
        <Row href="/me/method" title="기억을 관리하는 방법" note="언제 다시 묻는지와 그 근거 8가지" />
        <Row onClick={() => setHelpOpen(true)} title="숫자와 막대의 뜻" note="처음에 본 안내를 다시 봐요" />
      </section>

      <section className="mx-6 mt-8" aria-labelledby="about-title">
        <h2 id="about-title" className="border-b border-line pb-2.5 text-xs font-medium text-soft">
          앱 정보
        </h2>
        <Row href={LESSON_SITE} external title="레슨 사이트" note="레슨 본문과 검증 테스트를 공개한 곳" />
        <Row href={SOURCE} external title="소스 코드" note="GitHub · wanja727/retrievo" />
        <div className="flex h-14 items-center justify-between border-b border-line text-[15px]">
          <span>버전</span>
          <span className="text-[13px] text-soft">{process.env.NEXT_PUBLIC_APP_VERSION || "개발 중"}</span>
        </div>
      </section>

      <div className="mt-auto pt-8" />
      <BottomNav active="나" />

      {helpOpen && <FirstRunSheet title="숫자와 막대의 뜻" onClose={() => setHelpOpen(false)} />}
    </main>
  );
}

function formatDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return `${y}년 ${m}월 ${d}일`;
}

function Row({
  title,
  note,
  href,
  external,
  onClick,
}: {
  title: string;
  note: string;
  href?: string;
  external?: boolean;
  onClick?: () => void;
}) {
  const body: ReactNode = (
    <>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-medium tracking-[-0.2px]">{title}</div>
        <div className="mt-0.5 text-xs text-soft">{note}</div>
      </div>
      <ArrowRightIcon size={16} className={`shrink-0 text-faint ${external ? "-rotate-45" : ""}`} />
    </>
  );
  const cls = "flex h-16 w-full items-center gap-3 border-b border-line text-left";
  if (href && external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>
        {body}
      </a>
    );
  }
  if (href) {
    return (
      <Link href={href} className={cls}>
        {body}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {body}
    </button>
  );
}
