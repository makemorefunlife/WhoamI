/**
 * en-US version of the "Essence analysis" (Saju) summary fed to the integrated /
 * deep-report prompts.
 *
 * The Saju reference tables already carry an English counterpart for every Korean
 * natural-language field (meaning/strength/weakness/advice/metaphor/relationship
 * and display names). The runtime payload only carries the *_ko strings, so each
 * Korean string is mapped back to its English counterpart by exact match against
 * the same reference tables. If no English counterpart exists the field is
 * omitted — Korean prose is never passed through for en-US.
 *
 * Canonical Saju source terms (pillar strings, relation codes) are the only
 * non-English tokens that can remain; the guideline lines tell the model they
 * are internal reference and must never be written into the report.
 */
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import {
  REF_EARTHLY_BRANCHES,
  REF_HEAVENLY_STEMS,
  REF_HIDDEN_STEMS,
  REF_RELATION_RULES,
  REF_SHINSAL,
  REF_TEN_GODS,
  REF_TWELVE_STAGES,
} from "@/lib/hardcoded/sajuReferenceData";

type AnyRow = Record<string, unknown>;

const TEXT_FIELDS = ["meaning", "strength", "weakness", "advice", "metaphor", "relationship"] as const;

const textKoToEn = new Map<string, string>();
function indexText(rows: readonly AnyRow[]): void {
  for (const row of rows) {
    for (const f of TEXT_FIELDS) {
      const ko = row[`${f}_ko`];
      const en = row[`${f}_en`];
      if (typeof ko === "string" && ko && typeof en === "string" && en && !textKoToEn.has(ko)) {
        textKoToEn.set(ko, en);
      }
    }
  }
}
indexText(REF_HEAVENLY_STEMS as readonly AnyRow[]);
indexText(REF_EARTHLY_BRANCHES as readonly AnyRow[]);
indexText(REF_HIDDEN_STEMS as readonly AnyRow[]);
indexText(REF_TEN_GODS as readonly AnyRow[]);
indexText(REF_TWELVE_STAGES as readonly AnyRow[]);
indexText(REF_SHINSAL as readonly AnyRow[]);
indexText(REF_RELATION_RULES as readonly AnyRow[]);

function nameMap(rows: readonly AnyRow[], koKey: string, enKey: string): Map<string, string> {
  const m = new Map<string, string>();
  for (const row of rows) {
    const ko = row[koKey];
    const en = row[enKey];
    if (typeof ko === "string" && typeof en === "string" && en && !m.has(ko)) m.set(ko, en);
  }
  return m;
}
const stemNames = nameMap(REF_HEAVENLY_STEMS as readonly AnyRow[], "kor_name", "eng_name");
const branchNames = nameMap(REF_EARTHLY_BRANCHES as readonly AnyRow[], "kor_name", "eng_name");
const branchZodiac = nameMap(REF_EARTHLY_BRANCHES as readonly AnyRow[], "kor_name", "zodiac_en");
const tenGodNames = nameMap(REF_TEN_GODS as readonly AnyRow[], "kor_name", "eng_name");
const stageNames = nameMap(REF_TWELVE_STAGES as readonly AnyRow[], "kor_name", "eng_name");
const shinsalNames = nameMap(REF_SHINSAL as readonly AnyRow[], "name_ko", "name_en");

const RELATION_LABEL_EN: Record<string, string> = {
  천간합: "Heavenly stem combination",
  육합: "Six combination",
  삼합: "Triple combination",
  방합: "Directional combination",
  충: "Clash",
  형: "Punishment",
  파: "Break",
  해: "Harm",
};

const PILLAR_LABEL_EN: Record<string, string> = {
  년주: "Year pillar",
  월주: "Month pillar",
  일주: "Day pillar",
  시주: "Hour pillar",
  년: "Year pillar",
  월: "Month pillar",
  일: "Day pillar",
  시: "Hour pillar",
  year: "Year pillar",
  month: "Month pillar",
  day: "Day pillar",
  hour: "Hour pillar",
};

function pillarLabel(p: string | undefined): string {
  if (!p) return "Pillar";
  return PILLAR_LABEL_EN[p] ?? (/[가-힣]/.test(p) ? "Pillar" : p);
}

/** English counterpart of a Korean reference string, or null if none exists. */
function en(ko: string | null | undefined): string | null {
  if (!ko) return null;
  return textKoToEn.get(ko) ?? null;
}

function block(title: string, body: string): string {
  return `### ${title}\n${body.trim() || "(none)"}`;
}

function labeled(label: string, value: string | null): string | null {
  return value ? `${label}: ${value}` : null;
}

export function formatEssenceAnalysisForIntegratedEn(
  data: SajuDataForIntegrated | null | undefined,
): string {
  if (!data) return "(No Essence analysis data)";

  const pillars = data.saju
    ? `Year ${data.saju.yearPillar} · Month ${data.saju.monthPillar} · Day ${data.saju.dayPillar} · Hour ${data.saju.hourPillar}`
    : "(none)";

  const dayStem = data.dayStemData
    ? [
        [
          stemNames.get(data.dayStemData.kor_name ?? "") ?? "",
          en(data.dayStemData.metaphor_ko) ?? "",
        ]
          .filter(Boolean)
          .join(" — "),
        labeled("Strengths", en(data.dayStemData.strength_ko)),
        labeled("Watch-outs", en(data.dayStemData.weakness_ko)),
        labeled("Balance tip", en(data.dayStemData.advice_ko)),
      ]
        .filter(Boolean)
        .join("\n")
    : "(none)";

  const dayBranch = data.dayBranchData
    ? [
        [
          branchNames.get(data.dayBranchData.kor_name ?? "") ?? "",
          branchZodiac.get(data.dayBranchData.kor_name ?? "")
            ? `(${branchZodiac.get(data.dayBranchData.kor_name ?? "")})`
            : "",
        ]
          .filter(Boolean)
          .join(" "),
        en(data.dayBranchData.meaning_ko),
        labeled("Strengths", en(data.dayBranchData.strength_ko)),
        labeled("Watch-outs", en(data.dayBranchData.weakness_ko)),
        labeled("Balance tip", en(data.dayBranchData.advice_ko)),
      ]
        .filter(Boolean)
        .join("\n")
    : "(none)";

  const tenGods = data.tenGods?.length
    ? data.tenGods
        .map((t) => {
          const name = tenGodNames.get(t.godData?.kor_name ?? "") ?? "";
          const meaning = en(t.godData?.meaning_ko) ?? "";
          return `${pillarLabel(t.pillar)}: ${[name, meaning].filter(Boolean).join(" — ")}`;
        })
        .join("\n")
    : "(none)";

  const stageLine = (
    pillar: string | undefined,
    s: { kor_name?: string; meaning_ko?: string | null } | null | undefined,
  ) => {
    const name = stageNames.get(s?.kor_name ?? "") ?? "";
    const meaning = en(s?.meaning_ko) ?? "";
    return `${pillar ? `${pillarLabel(pillar)}: ` : ""}${[name, meaning].filter(Boolean).join(" — ")}`;
  };
  const stages = data.growthStages?.length
    ? data.growthStages.map((g) => stageLine(g.pillar, g.stageData)).join("\n")
    : data.twelveStageData
      ? stageLine(undefined, data.twelveStageData)
      : "(none)";

  const relations = data.relations?.length
    ? data.relations
        .map((r) => {
          const label = RELATION_LABEL_EN[r.type ?? ""] ?? "Relation";
          const text = en(r.interpretation);
          return text ? `[${label}] ${text}` : null;
        })
        .filter(Boolean)
        .join("\n")
    : "(none)";

  const hiddenStems = data.hiddenStemsData?.length
    ? data.hiddenStemsData
        .map((h) => {
          const text = en(h.meaning_ko);
          return text ? `${h.stem_code ?? ""}: ${text}` : null;
        })
        .filter(Boolean)
        .join("\n")
    : "(none)";

  const shinsals = data.shinsals?.length
    ? data.shinsals
        .map((s) =>
          [
            `- Signal (internal reference only — never name it in the report): ${shinsalNames.get(s.name_ko ?? "") ?? "special signal"}`,
            labeled("  Core meaning", en(s.meaning_ko)),
            labeled("  Strength tendency", en(s.strength_ko)),
            labeled("  Watch-out tendency", en(s.weakness_ko)),
            labeled("  Balance tip", en(s.advice_ko)),
          ]
            .filter(Boolean)
            .join("\n"),
        )
        .join("\n\n")
    : "(No special signals — use the other Essence signals only)";

  return [
    block("Natal chart (four pillars)", pillars),
    block("Day stem essence", dayStem),
    block("Day branch essence", dayBranch),
    block("Ten-god distribution", tenGods),
    block("Twelve life stages", stages),
    block("Hidden stems", hiddenStems),
    block("Combinations, clashes, punishments, breaks, harms", relations),
    block("Special Essence signals — must be reflected in the interpretation", shinsals),
    "",
    "[Writing guidelines — for the LLM]",
    "- The content above is 'Essence analysis' input. Do not use traditional terms such as Saju, Four Pillars, ten gods, or special-star names in the report text.",
    "- Any non-English token above (for example pillar strings) is internal source reference only. Never copy it into the report; write everything in natural English.",
    "- Turn the meaning, strengths and watch-outs of the special-signals section into everyday behavior, relationship and decision patterns across Parts 1–5.",
    "- When grounding a claim, say 'according to the Essence analysis', or simply describe it naturally with no stated source.",
  ].join("\n\n");
}
