-- 생년월일 1회 수정 사용 시각 (null = 아직 미사용)
alter table reports
  add column if not exists birth_date_correction_used_at timestamptz;

comment on column reports.birth_date_correction_used_at is
  '계정에서 생년월일 1회 수정을 사용한 시각. null이면 1회 수정 가능.';
