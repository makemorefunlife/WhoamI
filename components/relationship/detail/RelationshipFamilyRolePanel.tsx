import type { FamilyParentRole } from "@/lib/relationship/familyParent/types";

type RelationshipFamilyRolePanelProps = {
  familyParentType: FamilyParentRole;
  onFamilyParentTypeChange: (role: FamilyParentRole) => void;
  familyChildIsViewer: boolean;
  onFamilyChildIsViewerChange: (checked: boolean) => void;
  busy: boolean;
  viewerName: string;
  partnerName: string;
  reportIdA: string;
  reportIdB: string;
};

export default function RelationshipFamilyRolePanel({
  familyParentType,
  onFamilyParentTypeChange,
  familyChildIsViewer,
  onFamilyChildIsViewerChange,
  busy,
  viewerName,
  partnerName,
  reportIdA,
  reportIdB,
}: RelationshipFamilyRolePanelProps) {
  return (
    <div className="mt-3 rounded-xl border border-[#9ed4b8]/25 bg-[#9ed4b8]/5 p-3">
      <p className="mb-2 text-[11px] font-semibold text-[#9ed4b8]">
        👪 Child DNA Playbook · 역할 선택
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            familyParentType === "mother"
              ? "bg-[#9ed4b8]/25 text-white"
              : "bg-white/5 text-[var(--space-text-muted)] hover:bg-white/10"
          }`}
          onClick={() => onFamilyParentTypeChange("mother")}
        >
          🌸 엄마 렌즈
        </button>
        <button
          type="button"
          disabled={busy}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            familyParentType === "father"
              ? "bg-[#9ed4b8]/25 text-white"
              : "bg-white/5 text-[var(--space-text-muted)] hover:bg-white/10"
          }`}
          onClick={() => onFamilyParentTypeChange("father")}
        >
          🛡️ 아빠 렌즈
        </button>
      </div>
      <label className="mt-3 flex cursor-pointer items-center gap-2 text-[11px] text-[var(--space-text-muted)]">
        <input
          type="checkbox"
          checked={familyChildIsViewer}
          onChange={(e) => onFamilyChildIsViewerChange(e.target.checked)}
          disabled={busy}
          className="rounded border-white/20"
        />
        분석 대상 자녀가 &apos;나&apos;({viewerName || "시청자"})예요
      </label>
      {reportIdA && reportIdB ? (
        <p className="mt-1 text-[10px] text-white/40">
          parentType: {familyParentType} · 자녀=
          {familyChildIsViewer ? viewerName || "나" : partnerName}
        </p>
      ) : null}
    </div>
  );
}
