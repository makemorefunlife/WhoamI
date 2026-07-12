"use client";

import type { StrengthWeaknessLists } from "@/lib/relationship/psychMatch/strengthWeaknessTemplates";

const TEAL = "#3F8477";
const PLUM = "#8C4A5C";
const STRENGTH_BG = "rgba(63,132,119,0.10)";
const STRENGTH_BORDER = "rgba(63,132,119,0.28)";
const WEAK_BG = "rgba(140,74,92,0.08)";
const WEAK_BORDER = "rgba(140,74,92,0.24)";

export type StrengthWeaknessCardProps = {
  result: StrengthWeaknessLists;
  strengthTitle?: string;
  weaknessTitle?: string;
};

function SwList({
  items,
  tone,
  title,
}: {
  items: string[];
  tone: "strength" | "weak";
  title: string;
}) {
  const isStrength = tone === "strength";

  return (
    <div
      className="rounded-2xl px-[13px] py-[15px]"
      style={{
        backgroundColor: isStrength ? STRENGTH_BG : WEAK_BG,
        border: `1px solid ${isStrength ? STRENGTH_BORDER : WEAK_BORDER}`,
      }}
    >
      <p
        className="mb-2.5 text-xs font-bold"
        style={{ color: isStrength ? TEAL : PLUM }}
      >
        {title}
      </p>
      {items.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {items.map((text, index) => (
            <li
              key={`${tone}-${index}`}
              className="relative pl-3.5 text-[11.8px] leading-[1.55] text-on-surface"
            >
              <span
                className="absolute top-1.5 left-0 h-[5px] w-[5px] rounded-full"
                style={{ backgroundColor: isStrength ? TEAL : PLUM }}
                aria-hidden
              />
              {text}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[11.8px] leading-[1.55] text-on-surface-variant">
          아직 뚜렷한 패턴이 없어요.
        </p>
      )}
    </div>
  );
}

export default function StrengthWeaknessCard({
  result,
  strengthTitle = "이 사람에게서 얻는 것",
  weaknessTitle = "함께 있으면 약해지는 지점",
}: StrengthWeaknessCardProps) {
  const strengthTexts = result.strengths.map((item) => item.text);
  const weaknessTexts = result.weaknesses.map((item) => item.text);

  if (strengthTexts.length === 0 && weaknessTexts.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      <SwList items={strengthTexts} tone="strength" title={strengthTitle} />
      <SwList items={weaknessTexts} tone="weak" title={weaknessTitle} />
    </div>
  );
}
