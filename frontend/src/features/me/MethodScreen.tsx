import Link from "next/link";

/**
 * 관리 원칙 (시안 Method): 무엇을 언제 다시 묻는지와 그 근거 8가지.
 * 근거 논문은 초록과 2차 요약으로 확인했다 (설계 문서 20장). 화면에도 그렇게 밝힌다.
 */
const PRINCIPLES = [
  {
    title: "배우기 전에 먼저 꺼내기",
    text: "레슨을 시작하기 전에 예측부터 하게 해요. 틀려도 그 뒤 학습이 더 잘 남아요.",
    source: "Richland, Kornell & Kao, 2009",
  },
  {
    title: "보지 않고 말로 설명하기",
    text: "서술형은 자료를 보지 않고 소리 내어 설명하게 해요.",
    source: "Karpicke & Blunt, 2011 · MacLeod 외, 2010",
  },
  {
    title: "답을 먼저 적고, 보기는 나중에",
    text: "보기를 고르기 전에 내 답을 직접 적게 해요.",
    source: "Kang, McDermott & Roediger, 2007",
  },
  {
    title: "배운 날 3번, 그 뒤 3번",
    text: "배운 날 세 번 맞힐 때까지 묻고, 넓은 간격으로 세 번 더 확인해요.",
    source: "Rawson & Dunlosky, 2011",
  },
  {
    title: "간격은 넓게",
    text: "간격의 모양보다 총 간격이 중요해요. 3일, 7일, 21일 뒤에 물어요.",
    source: "Cepeda 외, 2008 · Karpicke & Bauernschmidt, 2011",
  },
  {
    title: "섞어서, 매번 다른 문제로",
    text: "여러 개념을 섞어 내고, 재확인은 처음과 다른 문제로 해요.",
    source: "Rohrer & Taylor, 2007 · Butler, 2010",
  },
  {
    title: "틀린 확신은 다음 날, 애매한 정답엔 해설",
    text: "확실했는데 틀리면 다음 날 먼저 묻고, 애매하게 맞히면 해설을 꼭 보여 줘요.",
    source: "Butterfield & Metcalfe, 2001 · Butler 외, 2008",
  },
  {
    title: "졸업 전에는 가르치듯 설명",
    text: "마지막 확인을 통과하면 동료에게 설명하듯 말로 풀어 보게 해요.",
    source: "Koh, Lee & Lim, 2018",
  },
];

const TIMELINE = ["배운 날", "3일", "7일", "21일", "졸업"];

export function MethodScreen() {
  return (
    <main className="app-frame">
      <header className="flex h-14 shrink-0 items-center px-3">
        <Link href="/me" aria-label="뒤로" className="flex size-11 items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M11 6l-6 6 6 6" />
          </svg>
        </Link>
      </header>

      <section className="px-6 pt-4">
        <h1 className="text-[28px] leading-[1.3] font-semibold tracking-[-0.8px]">
          Retrievo가 기억을
          <br />
          관리하는 방법
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          편하게 읽는 대신 힘들여 꺼내게 해요. 근거는 여덟 가지예요.
        </p>
      </section>

      <div
        role="img"
        aria-label="확인 간격: 배운 날, 3일, 7일, 21일 뒤, 그리고 졸업"
        className="relative mx-6 mt-9 pb-7"
      >
        <div className="absolute top-[5px] right-[6px] left-[6px] h-px bg-line-strong" />
        <div className="relative flex justify-between">
          {TIMELINE.map((label, i) => {
            const last = i === TIMELINE.length - 1;
            return (
              <div key={label} className="relative flex w-3 flex-col items-center">
                <span
                  className={`size-3 rounded-full border-2 ${last ? "border-gold bg-gold" : "border-ink bg-white"}`}
                />
                <span
                  className={`absolute top-5 text-xs whitespace-nowrap ${last ? "font-semibold text-ink" : "text-muted"} ${
                    i === 0 ? "left-0" : last ? "right-0" : "left-1/2 -translate-x-1/2"
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <ol className="mx-6 mt-6 border-t border-line">
        {PRINCIPLES.map((p, i) => (
          <li key={p.title} className="flex gap-4 border-b border-line py-5">
            <span className="w-5 shrink-0 pt-0.5 text-xs font-semibold text-faint">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-semibold tracking-[-0.2px]">{p.title}</h2>
              <p className="mt-1 text-[14px] leading-relaxed text-sub">{p.text}</p>
              <div className="mt-2 text-xs text-soft">{p.source}</div>
            </div>
          </li>
        ))}
      </ol>

      <p className="mx-6 mt-5 mb-10 text-xs leading-relaxed text-soft">
        근거 논문은 초록과 2차 요약으로 확인했어요. 3일·7일·21일이라는 날짜는 Retrievo가 정한 값이고, 논문이 뒷받침하는 것은
        재확인 횟수와 넓은 간격까지예요.
      </p>
    </main>
  );
}
