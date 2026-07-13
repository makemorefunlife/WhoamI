import { legacySajuInputsFromPersonCore } from "../adapters/rehydrateSajuFromPersonCore";
import type { PersonCoreBlueprint } from "../types/personCoreBlueprint";
import type { PsychMasterJson } from "../types/psychMaster";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import type { SajuChartProvenance } from "@/lib/saju/loadSajuBundleFromReport";
import type { PersonCorePair } from "./getOrBuildPersonCore";

export type PremiumPersonCoreBundle = {
  reportId: string;
  displayName: string;
  sajuJson: SajuDataForIntegrated;
  provenance: SajuChartProvenance;
  psychMaster: PsychMasterJson;
  blueprint: PersonCoreBlueprint;
};

export function bundlePersonCoreForPremium(
  blueprint: PersonCoreBlueprint,
): PremiumPersonCoreBundle {
  const { sajuJson, provenance } = legacySajuInputsFromPersonCore(
    blueprint.saju_master_json,
  );
  return {
    reportId: blueprint.report_id,
    displayName: blueprint.user_meta.display_name,
    sajuJson,
    provenance,
    psychMaster: blueprint.psych_master_json,
    blueprint,
  };
}

export type PremiumPersonCorePairBundles = {
  a: PremiumPersonCoreBundle;
  b: PremiumPersonCoreBundle;
};

export function bundlePersonCorePairForPremium(
  pair: PersonCorePair,
): PremiumPersonCorePairBundles {
  return {
    a: bundlePersonCoreForPremium(pair.personA),
    b: bundlePersonCoreForPremium(pair.personB),
  };
}

/** premium 관계 분석 — psych + fingerprint 메타 일괄 추출 */
export function personCoreRelationParamsFromBundles(
  bundles: PremiumPersonCorePairBundles,
): {
  psychMasterA: PsychMasterJson;
  psychMasterB: PsychMasterJson;
  personCoreMeta: {
    reportIdA: string;
    reportIdB: string;
    inputFingerprintA: string;
    inputFingerprintB: string;
  };
} {
  return {
    psychMasterA: bundles.a.psychMaster,
    psychMasterB: bundles.b.psychMaster,
    personCoreMeta: {
      reportIdA: bundles.a.reportId,
      reportIdB: bundles.b.reportId,
      inputFingerprintA: bundles.a.blueprint.input_fingerprint,
      inputFingerprintB: bundles.b.blueprint.input_fingerprint,
    },
  };
}
