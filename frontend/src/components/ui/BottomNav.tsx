import Link from "next/link";

const items = [
  { label: "오늘", href: "/" },
  { label: "레슨", href: "/lessons" },
  { label: "기록", href: "/report" },
  { label: "나", href: "/me" },
] as const;

/** 아이콘 없이 글자와 점만 쓰는 하단 메뉴 (ADR-018) */
export function BottomNav({ active }: { active: (typeof items)[number]["label"] }) {
  return (
    <nav
      aria-label="주요 메뉴"
      className="sticky bottom-0 grid h-16 grid-cols-4 border-t border-line bg-white pb-2"
    >
      {items.map((item) => {
        const current = item.label === active;
        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className={`flex flex-col items-center justify-center gap-[5px] text-[13px] ${
              current ? "font-semibold text-ink" : "font-medium text-faint"
            }`}
          >
            <span className={`size-1 rounded-full ${current ? "bg-ink" : ""}`} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
