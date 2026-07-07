-- reports: 점성 차트용 출생 좌표 (유료 geocoding 없이 birth_place 해석 또는 명시값)

alter table public.reports
  add column if not exists birth_latitude double precision,
  add column if not exists birth_longitude double precision,
  add column if not exists birth_timezone real;

comment on column public.reports.birth_latitude is '출생 위도 (birth 저장 시 place lookup 또는 명시)';
comment on column public.reports.birth_longitude is '출생 경도';
comment on column public.reports.birth_timezone is '출생지 UTC 오프셋(시간), 예: 9 = KST';
