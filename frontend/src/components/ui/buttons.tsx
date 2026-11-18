import Link from "next/link";
import type { ReactNode } from "react";

type Common = { children: ReactNode; className?: string };
type AsLink = Common & { href: string; onClick?: never; disabled?: never; type?: never };
type AsButton = Common & { href?: never; onClick?: () => void; disabled?: boolean; type?: "button" | "submit" };

const primary =
  "flex h-14 w-full items-center justify-center gap-2 rounded-full text-base font-semibold transition-colors";

/** 화면 아래의 검은 알약 버튼. 화면마다 하나만 둔다 */
export function PrimaryButton(props: AsLink | AsButton) {
  const tone = props.disabled ? "bg-line-strong text-soft" : "bg-ink text-white active:bg-ink-2";
  const cls = `${primary} ${tone} ${props.className ?? ""}`;
  if (props.href !== undefined) {
    return (
      <Link href={props.href} className={cls}>
        {props.children}
      </Link>
    );
  }
  return (
    <button type={props.type ?? "button"} onClick={props.onClick} disabled={props.disabled} className={cls}>
      {props.children}
    </button>
  );
}

/** 알약 버튼 아래의 보조 텍스트 버튼 */
export function TextButton(props: AsLink | AsButton) {
  const cls = `flex h-11 w-full items-center justify-center text-sm font-medium text-muted ${props.className ?? ""}`;
  if (props.href !== undefined) {
    return (
      <Link href={props.href} className={cls}>
        {props.children}
      </Link>
    );
  }
  return (
    <button type={props.type ?? "button"} onClick={props.onClick} disabled={props.disabled} className={cls}>
      {props.children}
    </button>
  );
}

/** 화면 아래에 붙는 버튼 영역. 내용이 길어도 버튼은 늘 보인다 */
export function BottomActions({ children, tone = "light" }: { children: ReactNode; tone?: "light" | "dark" }) {
  return (
    <div
      className={`sticky bottom-0 mt-auto flex flex-col gap-1 px-6 pt-3 pb-6 ${tone === "dark" ? "bg-ink" : "bg-white"}`}
    >
      {children}
    </div>
  );
}
