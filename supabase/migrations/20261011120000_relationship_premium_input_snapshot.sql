-- Relationship deep report: which inputs it was made from (fingerprint only,
-- no raw birth data -- lib/report/inputSnapshot.ts). Shown as "made with the
-- info at that time" and "info changed since". Additive, re-runnable; existing
-- rows keep NULL (= made before snapshots were recorded).
alter table public.relationship_premium_reports
  add column if not exists input_snapshot jsonb;
comment on column public.relationship_premium_reports.input_snapshot is
  '{v, captured_at, fp, has_survey[]} -- fingerprint of both participants'' inputs at generation (no raw data).';
