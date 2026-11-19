"use client";

import { BottomActions, PrimaryButton, TextButton } from "@/components/ui/buttons";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { LockIcon, MicIcon } from "@/components/ui/icons";
import type { QuestionView } from "@/lib/api";
import { useSpeechInput } from "@/lib/useSpeechInput";

/**
 * 보기를 보기 전에 답을 먼저 적게 할 문제인가.
 * 보기에서 고르는 문제만 해당한다. OX는 두 값뿐이고, 줄 고르기는 고르는 일 자체가 회상이다.
 */
export function needsRecall(question: QuestionView): boolean {
  return (question.type === "MULTIPLE_CHOICE" || question.type === "CODE_PREDICT") && !!question.choices?.length;
}

export function RecallStep({
  question: q,
  context,
  draft,
  onDraft,
  onReveal,
  onDontKnow,
}: {
  question: QuestionView;
  /** 질문 위에 작게 보이는 맥락. 예: "JPA · N+1 문제 · 처음과 다른 문제" */
  context: string;
  draft: string;
  onDraft: (draft: string) => void;
  onReveal: () => void;
  onDontKnow: () => void;
}) {
  const speech = useSpeechInput((text) => onDraft(draft ? `${draft} ${text}` : text));
  const count = q.choices?.length ?? 0;

  return (
    <>
      <div className="px-6 pt-8 text-[13px] text-muted">
        {context}
      </div>
      <h1 className="mx-6 mt-2.5 text-2xl leading-[1.42] font-semibold tracking-[-0.6px]">{q.body}</h1>

      {q.code && (
        <div className="mx-6 mt-6">
          <CodeBlock code={q.code} />
        </div>
      )}

      <div className="mx-6 mt-6">
        <label htmlFor="my-answer" className="block text-[13px] font-medium">
          먼저 내 답을 적어요
        </label>
        <div className="mt-2 flex h-[54px] items-center rounded-[14px] border border-ink pr-1.5 pl-4">
          <input
            id="my-answer"
            type="text"
            value={draft}
            onChange={(e) => onDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && draft.trim()) onReveal();
            }}
            autoComplete="off"
            placeholder="떠오른 답"
            className="min-w-0 flex-1 bg-transparent text-base font-medium outline-none placeholder:text-faint"
          />
          {speech.supported && (
            <button
              type="button"
              onClick={speech.toggle}
              aria-label={speech.listening ? "말하기 멈추기" : "말로 답하기"}
              aria-pressed={speech.listening}
              className={`flex size-11 items-center justify-center rounded-full ${speech.listening ? "bg-ink text-white" : ""}`}
            >
              <MicIcon />
            </button>
          )}
        </div>

        <div className="mt-5 flex items-center gap-2 text-[13px] text-muted">
          <LockIcon />
          보기 {count}개는 답을 적은 다음에 열려요
        </div>
        <div aria-hidden="true" className="mt-2.5 grid grid-cols-2 gap-2">
          {Array.from({ length: count }, (_, i) => (
            <div key={i} className="flex h-10 items-center rounded-xl bg-[#F5F5F5] px-3.5">
              <div className="h-2 rounded bg-[#E8E8E8]" style={{ width: `${35 + ((i * 13) % 25)}%` }} />
            </div>
          ))}
        </div>
      </div>

      <BottomActions>
        <PrimaryButton onClick={onReveal} disabled={!draft.trim()}>
          보기 열기
        </PrimaryButton>
        <TextButton onClick={onDontKnow}>모르겠어요</TextButton>
      </BottomActions>
    </>
  );
}
