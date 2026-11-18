import type { Confidence } from "@/lib/api";

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  SURE: "확실",
  UNSURE: "애매",
  UNKNOWN: "모름",
};

const ORDER: Confidence[] = ["SURE", "UNSURE", "UNKNOWN"];

/** 확신도: 확실 / 애매 / 모름. 밑줄 탭 */
export function ConfidenceTabs({
  value,
  onChange,
}: {
  value: Confidence | null;
  onChange: (value: Confidence) => void;
}) {
  return (
    <div role="radiogroup" aria-label="확신도" className="grid grid-cols-3 border-b border-line">
      {ORDER.map((c) => {
        const on = value === c;
        return (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(c)}
            className={`-mb-px h-12 border-b-2 text-[15px] ${
              on ? "border-ink font-semibold text-ink" : "border-transparent font-medium text-faint"
            }`}
          >
            {CONFIDENCE_LABEL[c]}
          </button>
        );
      })}
    </div>
  );
}
