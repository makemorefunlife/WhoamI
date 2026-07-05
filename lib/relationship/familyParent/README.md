# 가족(자녀-부모) 심화 분석 — 스켈레톤

1차 범위: **자녀 ↔ 부모** (엄마 / 아빠 렌즈 분리)

## 디렉터리

```
lib/relationship/familyParent/
  types.ts                      # roleA/B: child | mother | father
  buildFamilyParentRuleContext.ts
  buildFamilyParentReport.ts
  familyReportTemplate.ts       # section_mother | section_father
  familyParentLanguage.ts       # buildMotherParentLens / buildFatherParentLens
  familyParentTenGodAnalysis.ts
  familyParentEventScores.ts
  buildFamilySnapshotPanel.ts
  familyRoleConfig.ts           # 역할 선택 옵션 (UX TODO)
  index.ts

lib/saju/familyParentAnalysis.ts

lib/prompts/relationshipPremium/familyParentChild/
  index.ts                      # runFamilyParentChildDeepAnalysis
  outputSchema.ts               # family_parent_child_deep_v1

components/relationship/
  FamilyParentReportView.tsx
```

## 리포트 섹션 (v1)

| 섹션 | 내용 |
|------|------|
| section_roles | 자녀/부모 닉네임, parent_role (mother/father) |
| section_snapshot | 유대·지지·리스크 3지표 |
| section_child | 자녀 내면·애착·자율 |
| section_mother | 엄마 렌즈 (parent_role=mother 일 때) |
| section_father | 아빠 렌즈 (parent_role=father 일 때) |
| section_repair | 갈등·회복 |

## 다음 연동 TODO

- [ ] `relationshipAnalysisKinds.ts` — family deep registry
- [ ] `premium/route.ts` — `kind === "family"` + roles 파라미터
- [ ] `RelationshipView.tsx` — FamilyRolePicker + FamilyParentReportView
- [ ] `detail/route.ts` — `family_deep_report` 필드
- [ ] `triScoreSnapshot/kinds.ts` — FAMILY_CONFIG
- [ ] `premiumByKind.ts` — getFamilyParentDeepReport
- [ ] DB `family_roles jsonb` (선택)

## 역할 규칙

- `roleA` + `roleB` 중 **정확히 1명 child**, **1명 mother 또는 father**
- 엄마/아빠에 따라 `section_mother` 또는 `section_father` 중 하나만 채움
