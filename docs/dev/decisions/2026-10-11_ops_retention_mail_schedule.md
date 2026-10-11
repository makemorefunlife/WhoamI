# 2026-10-11 보관·메일 운영 연결 (IA v2 6단계)

상태: **코드 준비됨. 정기 실행은 아직 연결되지 않음 → 자동으로 동작하지 않음.**
DEV·운영 DB, 운영 환경변수, 배포는 이번 작업에서 변경하지 않았다.

## 1. 지금 실제로 일어나는 일

| 작업 | 실행 경로 | 지금 자동 실행? |
|---|---|---|
| 구매 안내 메일 첫 발송 | 결제 확인(`/api/payments/toss/confirm`) 안에서 즉시 | 예 (결제할 때) |
| 구매 안내 메일 재시도(일시 오류·429) | ① 결제 확인·`claim-info` 요청 뒤 `after()`로 최대 3건 ② `/api/cron/guest-emails` | ①만. 다른 구매·접속이 있어야 돈다. 조용한 시간에는 재시도가 밀린다 |
| 비회원 Personal 보관 정리 `purge_guest_personal_data` | `/api/cron/guest-emails` | **아니오** |
| 비회원 초대 참여 30일 정리 `purge_guest_invite_data` | `/api/cron/guest-emails` | **아니오** |
| 비회원 단건 Relationship 정리 `purge_guest_relationship_data` (구매일+12개월, 환불·취소 즉시) | `/api/cron/guest-emails` | **아니오** |
| 초대 인증코드 메일 | 요청 시 즉시 발송(큐 없음) | 해당 없음 |

- 저장소에 `vercel.json`이 없고, 마이그레이션에 `pg_cron` 예약도 없다. 따라서 정리(purge) 함수는 **누군가 위 경로를 호출하기 전까지 실행되지 않는다.**
- 보관 기간이 지나도 데이터는 화면·API에서 "만료"로 처리되어 다시 쓸 수 없지만(코드에서 기간 확인), **DB에서 지워지지는 않는다.** 방침에 적힌 삭제 시점을 지키려면 정기 실행 연결이 필요하다.
- 발신·답장 주소는 `support@ahaitsme.com` 그대로(변경 없음). 공개 문의처는 `contact@ahaitsme.com` 그대로.

## 2. 실행 경로 정보

- 경로: `GET|POST /api/cron/guest-emails`
- 인증: `Authorization: Bearer <CRON_SECRET>` (16자 이상). 값이 없거나 다르면 401.
- 한 번 실행: 메일 최대 25건 + 세 가지 정리 함수. 응답 예
  `{ processed, sent, pending, failed, purgedRows, purgedInvites, purgedRelationships }`
- 여러 번 실행해도 안전: 메일은 DB 임대(lease)+Resend Idempotency-Key로 중복 발송 방지, 정리 함수는 이미 정리한 행을 건너뜀.

## 3. DEV에서 확인하는 방법 (사용자가 실행)

1. DEV 앱 환경변수에 `CRON_SECRET`(16자 이상 임의 값)이 있는지 확인. 없으면 DEV에만 추가.
2. DEV SQL 적용 순서(아래 5항)를 마친 뒤 실행:
   ```
   BASE_URL=<DEV 또는 http://localhost:3000> CRON_SECRET=<DEV 값> node scripts/ops/run-guest-maintenance.mjs
   ```
   - 결과 숫자만 출력되고 비밀값은 출력하지 않는다. `ahaitsme.com` 주소는 기본적으로 거부한다.
3. 기대값: 처음엔 대부분 0. 만료 테스트 주문을 만들어 두었다면 `purged*` 값이 1 이상.

## 4. 정기 실행 연결 방법 (선택 필요 — 별도 서비스 설정)

Vercel 공식 문서 기준(2026-07 갱신): Hobby 플랜은 크론을 **하루 1번**만 허용하고 실행 시각이 ±59분 흔들린다. Pro는 1분 단위 가능.
현재 방침 문서에는 "Vercel Hobby"로 적혀 있다(플랜 변경 여부는 확인 필요).

**A. Vercel Cron (가장 단순, Hobby면 하루 1번)**
1. Vercel 프로젝트 환경변수에 `CRON_SECRET` 추가(Production / Preview 각각). Vercel은 이 값이 있으면 크론 호출 시 `Authorization: Bearer <CRON_SECRET>`를 자동으로 붙인다.
2. 저장소 루트에 `vercel.json` 추가:
   ```json
   { "crons": [{ "path": "/api/cron/guest-emails", "schedule": "0 18 * * *" }] }
   ```
   (`0 18 * * *` = 매일 03:00 KST 전후. Pro라면 `0 * * * *` 매시 권장)
3. 배포 후 Vercel 대시보드 → Settings → Cron Jobs에서 등록 확인, "Run" 버튼으로 1회 실행해 응답 숫자 확인.
- 한계: Hobby에서는 메일 재시도가 최대 하루 늦을 수 있다(결제·접속 시 자동 재시도는 그대로).

**B. Supabase pg_cron + pg_net (매시 가능, Vercel 플랜 무관)**
1. Supabase 대시보드에서 `pg_cron`, `pg_net` 확장 활성화.
2. `CRON_SECRET`을 Supabase Vault에 저장(`select vault.create_secret('<값>', 'cron_secret');`).
3. 예약 등록(값은 Vault에서 읽음):
   ```sql
   select cron.schedule('guest-maintenance-hourly', '7 * * * *', $$
     select net.http_post(
       url := 'https://<앱 도메인>/api/cron/guest-emails',
       headers := jsonb_build_object('Authorization', 'Bearer ' ||
         (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret'))
     );
   $$);
   ```
4. `select * from cron.job_run_details order by start_time desc limit 5;` 로 실행 기록 확인.

**C. 외부 스케줄러(GitHub Actions 등)**: `scripts/ops/run-guest-maintenance.mjs`를 `ALLOW_PROD=1`과 함께 매시 실행. 비밀값은 저장소 Secrets에만 둔다.

권장: DEV에서 B 또는 3항 수동 실행으로 먼저 확인 → 운영은 사용자 결정(A는 하루 1회 한계).

## 5. 이번 리팩토링의 DEV SQL 적용 순서 (미적용 — 사용자가 실행)

1. `supabase/DEV_APPLY_20261011b_REPORT_INPUT_SNAPSHOT.sql`
2. `supabase/DEV_APPLY_20261011c_GUEST_INVITE.sql`
3. `supabase/DEV_APPLY_20261011d_GUEST_RELATIONSHIP.sql` (2번과 비회원 Personal 접근 마이그레이션 20261009090000 이후)
4. `supabase/DEV_APPLY_20261011e_DECISION_JOURNAL.sql`

각 파일은 시작 시 전제 조건을 확인하고(맞지 않으면 STOP 메시지로 중단), 끝에서 확인용 select를 출력한다.

## 6. 후속(이번 범위 아님)

- 만료 알림 메일(비회원 보관 만료 전 안내) — 후속 작업.
- `toss_payment_orders.guest_email`의 보관 기간 정책 미정(현재 주문과 함께 보관).
