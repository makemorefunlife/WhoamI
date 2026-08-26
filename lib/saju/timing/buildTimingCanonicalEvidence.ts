import type {
  TimingFacts,
  CanonicalTimingEvidencePackage,
  CanonicalTimingSignal,
  CESignalStrength,
  CESource,
} from "./types";

/**
 * Derives Domain-Neutral Canonical Timing Evidence (Timing CE).
 * Translates raw Saju timing facts into semantic activation signals.
 * STRICT RULE: No domain-specific language (no "marriage crisis", "career move", etc.).
 */
export function buildTimingCanonicalEvidence(
  timingFacts: TimingFacts,
): CanonicalTimingEvidencePackage {
  const { birthDate, daewoon, yearlySeun } = timingFacts;
  const targetYears = yearlySeun.map((y) => y.year);
  const signals: CanonicalTimingSignal[] = [];

  for (const seunFact of yearlySeun) {
    const yr = seunFact.year;
    const evidenceIds: string[] = [];
    const supportingFacts: string[] = [];

    // --- Daewoon Background Context ---
    const dwPillar = seunFact.currentDaewoonPillar;
    const dwTg = seunFact.currentDaewoonTenGodCode;
    const dwKorName = seunFact.currentDaewoonTenGodKorName;

    if (dwPillar && dwTg) {
      evidenceIds.push(`daewoon_background_${dwTg}_${yr}`);
      supportingFacts.push(`대운 기류 [${dwPillar}]: 십성=${dwKorName}`);

      // Emit Daewoon Background Theme Signals
      let bgKey: string | null = null;
      if (dwTg === "jeonggwan" || dwTg === "pyeongwan") bgKey = `officer_theme_background_${yr}`;
      else if (dwTg === "siksin" || dwTg === "sanggwan") bgKey = `output_theme_background_${yr}`;
      else if (dwTg === "jeongjae" || dwTg === "pyeonjae") bgKey = `wealth_theme_background_${yr}`;
      else if (dwTg === "jeongin" || dwTg === "pyeonin") bgKey = `seal_theme_background_${yr}`;
      else if (dwTg === "bigyeon" || dwTg === "geopjae") bgKey = `self_theme_background_${yr}`;

      if (bgKey) {
        signals.push({
          key: bgKey,
          strength: "MODERATE",
          factConfidence: "HIGH",
          interpretationConfidence: "MEDIUM",
          sources: [
            {
              layer: "DAEWOON",
              factType: "TEN_GOD",
              value: dwTg,
            },
          ],
          evidenceIds: [`daewoon_ten_god_${dwTg}_${yr}`],
          supportingFacts: [`대운 [${dwPillar}] 십성 기류 (${dwKorName})`],
        });
      }
    }

    // --- Check Daewoon Transition Shift Proximity ---
    const isDaewoonShiftYear = daewoon.periods.some(
      (p) => Math.abs(p.startYear - yr) <= 1,
    );
    if (isDaewoonShiftYear) {
      evidenceIds.push(`daewoon_shift_${yr}`);
      supportingFacts.push(`대운 교체 주기 전후 (${yr}년)`);
    }

    // --- Seun Ten God Activation ---
    const tg = seunFact.tenGodCode;
    supportingFacts.push(`세운 [${seunFact.pillar}]: 십성=${seunFact.tenGodKorName}`);

    // --- Day Branch Relations ---
    const dayRel = seunFact.dayBranchRelation;
    if (dayRel) {
      evidenceIds.push(`seun_day_rel_${dayRel}_${yr}`);
      const relLabel =
        seunFact.relations.find((r) => r.targetPillar === "day")?.label ??
        dayRel;
      supportingFacts.push(`일지(배우자/개인궁) ${relLabel} 작용`);
    }

    // --- Daewoon x Seun Cross-Layer Relations ---
    const dwSeunRel = seunFact.daewoonSeunRelation;
    if (dwSeunRel) {
      evidenceIds.push(`daewoon_seun_rel_${dwSeunRel.type}_${yr}`);
      supportingFacts.push(`대운-세운 지지관계 [${dwSeunRel.label}] 작용`);
    }

    // --- Signal Accumulation & DERIVATION RULES ---

    // A. change_pressure
    let changeScore = 0;
    const changeSources: CESource[] = [];

    if (dayRel === "branch_clash") {
      changeScore += 2;
      changeSources.push({ layer: "SEUN", factType: "BRANCH_RELATION", value: "branch_clash" });
    }
    if (dayRel === "branch_punishment") {
      changeScore += 1;
      changeSources.push({ layer: "SEUN", factType: "BRANCH_RELATION", value: "branch_punishment" });
    }
    if (isDaewoonShiftYear) {
      changeScore += 2;
      changeSources.push({ layer: "DAEWOON", factType: "SHIFT_PROXIMITY", value: `shift_${yr}` });
    }
    if (tg === "pyeongwan") {
      changeScore += 1;
      changeSources.push({ layer: "SEUN", factType: "TEN_GOD", value: "pyeongwan" });
    }
    if (dwSeunRel?.type === "branch_clash") {
      changeScore += 2;
      changeSources.push({ layer: "CROSS_LAYER", factType: "BRANCH_RELATION", value: "daewoon_seun_clash" });
    }

    if (changeScore > 0) {
      const strength: CESignalStrength =
        changeScore >= 3 ? "STRONG" : changeScore >= 2 ? "MODERATE" : "WEAK";
      signals.push({
        key: `change_pressure_${yr}`,
        strength,
        factConfidence: "HIGH",
        interpretationConfidence: "MEDIUM",
        sources: changeSources,
        evidenceIds: [...evidenceIds],
        supportingFacts: [...supportingFacts, `변화 압력 지수 (${changeScore})`],
      });
    }

    // B. stability_support
    let stabilityScore = 0;
    const stabilitySources: CESource[] = [];

    if (
      dayRel === "branch_six_combine" ||
      dayRel === "branch_three_combine"
    ) {
      stabilityScore += 2;
      stabilitySources.push({ layer: "SEUN", factType: "BRANCH_RELATION", value: dayRel });
    }
    if (tg === "jeongin" || tg === "pyeonin") {
      stabilityScore += 1;
      stabilitySources.push({ layer: "SEUN", factType: "TEN_GOD", value: tg });
    }
    if (dwSeunRel?.type === "branch_six_combine" || dwSeunRel?.type === "branch_three_combine") {
      stabilityScore += 1;
      stabilitySources.push({ layer: "CROSS_LAYER", factType: "BRANCH_RELATION", value: dwSeunRel.type });
    }

    if (stabilityScore > 0) {
      const strength: CESignalStrength =
        stabilityScore >= 3 ? "STRONG" : stabilityScore >= 2 ? "MODERATE" : "WEAK";
      signals.push({
        key: `stability_support_${yr}`,
        strength,
        factConfidence: "HIGH",
        interpretationConfidence: "MEDIUM",
        sources: stabilitySources,
        evidenceIds: [...evidenceIds],
        supportingFacts: [...supportingFacts, `안정 지원 지수 (${stabilityScore})`],
      });
    }

    // C. officer_theme_activation (RENAMED from responsibility_activation)
    if (tg === "jeonggwan" || tg === "pyeongwan") {
      const strength: CESignalStrength =
        tg === "jeonggwan" ? "STRONG" : "MODERATE";
      signals.push({
        key: `officer_theme_activation_${yr}`,
        strength,
        factConfidence: "HIGH",
        interpretationConfidence: "MEDIUM",
        sources: [
          {
            layer: "SEUN",
            factType: "TEN_GOD",
            value: tg,
          },
        ],
        evidenceIds: [...evidenceIds, `ten_god_${tg}_${yr}`],
        supportingFacts: [...supportingFacts, `관성 기류 작용 (${seunFact.tenGodKorName})`],
      });
    }

    // D. output_theme_activation (RENAMED from expression_activation)
    if (tg === "siksin" || tg === "sanggwan") {
      const strength: CESignalStrength =
        tg === "siksin" ? "STRONG" : "MODERATE";
      signals.push({
        key: `output_theme_activation_${yr}`,
        strength,
        factConfidence: "HIGH",
        interpretationConfidence: "MEDIUM",
        sources: [
          {
            layer: "SEUN",
            factType: "TEN_GOD",
            value: tg,
          },
        ],
        evidenceIds: [...evidenceIds, `ten_god_${tg}_${yr}`],
        supportingFacts: [...supportingFacts, `식상 기류 작용 (${seunFact.tenGodKorName})`],
      });
    }

    // E. wealth_theme_activation (RENAMED from resource_management_activation)
    if (tg === "jeongjae" || tg === "pyeonjae") {
      const strength: CESignalStrength =
        tg === "jeongjae" ? "STRONG" : "MODERATE";
      signals.push({
        key: `wealth_theme_activation_${yr}`,
        strength,
        factConfidence: "HIGH",
        interpretationConfidence: "MEDIUM",
        sources: [
          {
            layer: "SEUN",
            factType: "TEN_GOD",
            value: tg,
          },
        ],
        evidenceIds: [...evidenceIds, `ten_god_${tg}_${yr}`],
        supportingFacts: [...supportingFacts, `재성 기류 작용 (${seunFact.tenGodKorName})`],
      });
    }

    // F. relationship_sensitivity
    if (
      dayRel === "branch_clash" ||
      dayRel === "branch_harm" ||
      dayRel === "branch_break" ||
      dayRel === "wonjin"
    ) {
      const strength: CESignalStrength =
        dayRel === "branch_clash" || dayRel === "wonjin"
          ? "STRONG"
          : "MODERATE";
      signals.push({
        key: `relationship_sensitivity_${yr}`,
        strength,
        factConfidence: "HIGH",
        interpretationConfidence: "MEDIUM",
        sources: [
          {
            layer: "SEUN",
            factType: "BRANCH_RELATION",
            value: dayRel,
          },
        ],
        evidenceIds: [...evidenceIds, `day_rel_${dayRel}_${yr}`],
        supportingFacts: [...supportingFacts, `일지 민감 자극 작용`],
      });
    }
  }

  return {
    birthDate,
    targetYears,
    signals,
  };
}
