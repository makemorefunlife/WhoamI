import MarriageReportView from "@/components/relationship/MarriageReportView";
import { legacySajuInputsFromPersonCore } from "@/lib/personCore/adapters/rehydrateSajuFromPersonCore";
import { mapSajuBundleToMasterJson } from "@/lib/personCore/mappers/mapSajuMasterJson";
import { buildMarriageReport } from "@/lib/relationship/marriage/buildMarriageReport";
import { buildPairDomainSignalsFromMasters } from "@/lib/personCore/sajuSignals/pairDomainSignals";
import { calculateSajuBundle } from "@/lib/v2/saju/calculateSajuBundle";

/** 로컬 UI 검증 — prescription_cohabitation 카드 프리뷰 */
export default function CohabitationPrescriptionDevPage() {
  const b1 = calculateSajuBundle({
    birthDate: "1992-08-20",
    birthTime: "09:15",
  });
  const b2 = calculateSajuBundle({
    birthDate: "1994-03-11",
    birthTime: "22:40",
  });
  const m1 = mapSajuBundleToMasterJson({
    bundle: b1,
    birthDate: "1992-08-20",
    birthTime: "09:15",
    birthTimeUnknown: false,
  });
  const m2 = mapSajuBundleToMasterJson({
    bundle: b2,
    birthDate: "1994-03-11",
    birthTime: "22:40",
    birthTimeUnknown: false,
  });
  const a = legacySajuInputsFromPersonCore(m1);
  const b = legacySajuInputsFromPersonCore(m2);
  const pairCohabitation = buildPairDomainSignalsFromMasters(m1, m2).cohabitation;

  const report = buildMarriageReport({
    nicknameA: "민수",
    nicknameB: "지연",
    sajuJsonA: a.sajuJson,
    sajuJsonB: b.sajuJson,
    psychMasterA: m1,
    psychMasterB: m2,
    pairCohabitation,
  });

  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-[#0f0a14] px-4 py-10">
      <p className="mb-6 text-center text-xs text-white/40">
        dev preview — cohabitation prescription UI
      </p>
      <MarriageReportView
        report={report}
        myName="민수"
        partnerName="지연"
        viewerIsReportA
      />
    </main>
  );
}
