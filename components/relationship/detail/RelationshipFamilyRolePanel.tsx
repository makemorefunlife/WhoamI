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
    <div className="mt-3 rounded-xl border border-secondary/30 bg-secondary/8 p-3">
      <p className="mb-2 text-[11px] font-semibold text-secondary">
        👪 Child DNA Playbook · 역할 선택
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            familyParentType === "mother"
              ? "bg-secondary/20 text-primary"
              : "border border-outline-variant/35 bg-surface-container-low/80 text-on-surface-variant hover:bg-surface-container-high"
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
              ? "bg-secondary/20 text-primary"
              : "border border-outline-variant/35 bg-surface-container-low/80 text-on-surface-variant hover:bg-surface-container-high"
          }`}
          onClick={() => onFamilyParentTypeChange("father")}
        >
          🛡️ 아빠 렌즈
        </button>
      </div>
      <label className="mt-3 flex cursor-pointer items-center gap-2 text-[11px] text-on-surface-variant">
        <input
          type="checkbox"
          checked={familyChildIsViewer}
          onChange={(e) => onFamilyChildIsViewerChange(e.target.checked)}
          disabled={busy}
          className="rounded border-outline-variant/50"
        />
        분석 대상 자녀가 &apos;나&apos;({viewerName || "시청자"})예요
      </label>
      {reportIdA && reportIdB ? (
        <p className="mt-1 text-[10px] text-on-surface-variant/70">
          parentType: {familyParentType} · 자녀=
          {familyChildIsViewer ? viewerName || "나" : partnerName}
        </p>
      ) : null}
    </div>
  );
}
