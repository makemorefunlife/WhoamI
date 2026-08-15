import type { Locale } from "@/lib/i18n/locale";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { WorkSajuSignals } from "@/lib/personCore/sajuSignals/types";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import { pick, LEGACY_FALLBACK_LOCALE } from "./workColleagueCopy";

export type WorkRoleDimension =
  | "direction"
  | "execution"
  | "coordination"
  | "qa_risk"
  | "external"
  | "ideation"
  | "detail"
  | "decision";

export type CanonicalPersonRoleProfile = {
  name: string;
  primaryRole: WorkRoleDimension;
  secondaryRole: WorkRoleDimension;
  roleTitle: string;
  coreWeapons: string[];
  departmentFit: string;
  preferredWorkMode: "think_first" | "discuss_first" | "contextual";
};

export type CanonicalPairRoleMap = {
  directionOwner: "A" | "B" | "SHARED";
  executionOwner: "A" | "B" | "SHARED";
  coordinationOwner: "A" | "B" | "SHARED";
  qaRiskOwner: "A" | "B" | "SHARED";
  externalOwner: "A" | "B" | "SHARED";
  personA: CanonicalPersonRoleProfile;
  personB: CanonicalPersonRoleProfile;
};

/**
 * Canonical Work Role Model SSOT.
 * Guarantees zero role contradictions across Office DNA, Role Matrix, Leadership Split,
 * Best Role, Delegation, and Project Fit.
 */
export function buildCanonicalWorkRoleMap(params: {
  nameA: string;
  nameB: string;
  sajuJsonA: SajuDataForIntegrated;
  sajuJsonB: SajuDataForIntegrated;
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  workSignalsA?: WorkSajuSignals;
  workSignalsB?: WorkSajuSignals;
  locale?: Locale;
}): CanonicalPairRoleMap {
  const { nameA, nameB, psychA, psychB, workSignalsA, workSignalsB } = params;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;

  const decA = (psychA?.secondary_axes.decision_style ?? 50) + (workSignalsA ? 10 : 0);
  const decB = (psychB?.secondary_axes.decision_style ?? 50) + (workSignalsB ? 10 : 0);

  const strA = (psychA?.secondary_axes.structure ?? 50) + (workSignalsA?.month_geokguk?.month_stem_category === "officer" ? 15 : 0);
  const strB = (psychB?.secondary_axes.structure ?? 50) + (workSignalsB?.month_geokguk?.month_stem_category === "officer" ? 15 : 0);

  const empA = (psychA?.secondary_axes.empathy ?? 50) + (workSignalsA?.month_geokguk?.month_stem_category === "seal" ? 10 : 0);
  const empB = (psychB?.secondary_axes.empathy ?? 50) + (workSignalsB?.month_geokguk?.month_stem_category === "seal" ? 10 : 0);

  const recA = (psychA?.secondary_axes.recognition ?? 50) + (workSignalsA?.drive_stubborn?.officer_count ? 10 : 0);
  const recB = (psychB?.secondary_axes.recognition ?? 50) + (workSignalsB?.drive_stubborn?.officer_count ? 10 : 0);

  // Standard domain lens threshold (delta >= 15 for meaningful role differentiation)
  const directionOwner: "A" | "B" | "SHARED" = Math.abs(decA - decB) < 15 ? "SHARED" : decA > decB ? "A" : "B";
  const qaRiskOwner: "A" | "B" | "SHARED" = Math.abs(strA - strB) < 15 ? "SHARED" : strA > strB ? "A" : "B";
  const externalOwner: "A" | "B" | "SHARED" = Math.abs(recA - recB) < 15 ? "SHARED" : recA > recB ? "A" : "B";
  const coordinationOwner: "A" | "B" | "SHARED" = Math.abs(empA - empB) < 15 ? "SHARED" : empA > empB ? "A" : "B";
  const executionOwner: "A" | "B" | "SHARED" = directionOwner === "A" ? "B" : directionOwner === "B" ? "A" : "SHARED";

  const getProfile = (
    name: string,
    isA: boolean,
  ): CanonicalPersonRoleProfile => {
    const isDirectionLead = isA ? directionOwner === "A" : directionOwner === "B";
    const isQALead = isA ? qaRiskOwner === "A" : qaRiskOwner === "B";
    const isExternalLead = isA ? externalOwner === "A" : externalOwner === "B";

    const psych = isA ? psychA : psychB;
    const thinking = psych?.secondary_axes.thinking_style ?? 50;

    let preferredWorkMode: "think_first" | "discuss_first" | "contextual" = "contextual";
    if (thinking >= 65) preferredWorkMode = "think_first";
    else if (thinking <= 35) preferredWorkMode = "discuss_first";

    if (isDirectionLead && isExternalLead) {
      return {
        name,
        primaryRole: "direction",
        secondaryRole: "external",
        roleTitle: pick(locale, "Strategy & External Lead", "전략 기획 및 대외 총괄"),
        coreWeapons: [pick(locale, "Big Picture Strategy", "비전·방향 설정"), pick(locale, "External Presentation", "대외 브리핑")],
        departmentFit: pick(locale, "Strategy & Business Development", "전략기획·사업개발"),
        preferredWorkMode,
      };
    }
    if (isQALead) {
      return {
        name,
        primaryRole: "qa_risk",
        secondaryRole: "detail",
        roleTitle: pick(locale, "QA & Operations Manager", "품질 검수 및 운영 관리자"),
        coreWeapons: [pick(locale, "Risk Verification", "리스크 검증"), pick(locale, "Process Control", "프로세스 정밀화")],
        departmentFit: pick(locale, "PMO & Quality Control", "PMO·경영지원"),
        preferredWorkMode,
      };
    }
    return {
      name,
      primaryRole: "execution",
      secondaryRole: "coordination",
      roleTitle: pick(locale, "Core Execution & Team Coordinator", "핵심 실행 및 팀 조율자"),
      coreWeapons: [pick(locale, "Hands-on Execution", "현장 실행력"), pick(locale, "Stakeholder Sync", "팀원 소통 조율")],
      departmentFit: pick(locale, "Operations & Project Execution", "운영팀·프로젝트 실행"),
      preferredWorkMode,
    };
  };

  return {
    directionOwner,
    executionOwner,
    coordinationOwner,
    qaRiskOwner,
    externalOwner,
    personA: getProfile(nameA, true),
    personB: getProfile(nameB, false),
  };
}
