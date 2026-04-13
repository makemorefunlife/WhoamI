-- reports: 출생/태어난 장소 (홈에서 선택 입력)
-- 적용: Supabase SQL Editor에서 실행하거나 `supabase db push` 등으로 반영

alter table public.reports
  add column if not exists birth_place text;

comment on column public.reports.birth_place is '태어난 곳 등 자유 입력 (선택)';
