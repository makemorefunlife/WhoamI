-- PROD READ-ONLY: 비회원 구매 안내 메일 상태 확인 (변경 없음, select만)
-- 사용: 아래 '<ORDER_ID>'를 성공 화면 주소의 orderId 값(aha_로 시작)으로 바꿔 Supabase SQL Editor에서 실행.
-- 이메일은 마스킹, 토큰·논스 값은 출력하지 않음(있음/없음만).
--
-- 판단:
--   last_attempt_at(마지막 발송 시도 시각)이 GUEST_CLAIM_TOKEN_SECRET 저장 후 재배포 시각보다
--     이전  -> 화면 코드는 "과거 시도 결과". 재시도 대기(next_attempt_at)가 지나면 다음 결제/이용 화면 접속 때 자동 재시도.
--     이후  -> 새 설정으로 다시 시도했는데도 실패 = 실행 중인 운영 서버에 그 값이 없음(이름·범위·프로젝트·길이 확인).
--   has_claim_nonce = false 이면 비밀키와 무관하게 같은 코드가 나옴(주문 생성 시 링크 논스 누락).

select
  o.order_id,
  o.created_at,
  o.approved_at,
  o.is_test,
  o.status                                   as order_status,
  o.guest_email_status                       as mail_status,
  o.guest_email_last_error                   as mail_reason,
  o.guest_email_attempts                     as mail_attempts,
  o.guest_email_generation                   as mail_generation,
  o.guest_email_locked_at                    as last_attempt_at,
  o.guest_email_next_attempt_at              as next_attempt_at,
  o.guest_email_sent_at                      as sent_at,
  (o.claim_token_nonce is not null)          as has_claim_nonce,
  regexp_replace(o.guest_email, '^(.{2})[^@]*', '\1***') as email_masked,
  now()                                      as checked_at
from public.toss_payment_orders o
where o.order_id = '<ORDER_ID>';

-- 최근 비회원 주문 10건 요약(같은 판단용)
select
  o.order_id, o.created_at, o.is_test, o.status,
  o.guest_email_status, o.guest_email_last_error,
  o.guest_email_attempts, o.guest_email_locked_at as last_attempt_at,
  o.guest_email_next_attempt_at, (o.claim_token_nonce is not null) as has_claim_nonce
from public.toss_payment_orders o
where o.guest_email is not null
order by o.created_at desc
limit 10;

-- ───────────────────────────────────────────────────────────────
-- '구매 안내 메일 다시 받기' 결과 추적 (이메일 기준, 읽기 전용)
-- '<EMAIL>'를 다시 받기에 입력한 이메일로 바꿔 실행. 결과에는 마스킹된 이메일만 나옴.
--
--  1. 대상 주문 조회됨?   → lookup_target = true 인 행이 있어야 함 (status=paid, 계정 미연결)
--  2. 실제 발송 시도?      → mail_generation 이 다시 받기 전보다 1 증가 + last_attempt_at 이 다시 받기 시각
--  3. 큐 상태·오류 갱신?   → mail_status / mail_reason 이 그 시각 기준 값
--  4. Resend 수락?         → resend_accepted = true (message id 저장) + sent_at 이 그 시각
--     mail_status=retry 이고 mail_reason=claim_token_secret_missing 이면 운영 서버가 아직 그 값을 못 읽음
select
  o.order_id,
  o.created_at,
  o.is_test,
  o.status                                         as order_status,
  (o.clerk_user_id is not null)                    as linked_to_account,
  (o.status = 'paid' and o.clerk_user_id is null)  as lookup_target,
  o.guest_email_status                             as mail_status,
  o.guest_email_last_error                         as mail_reason,
  o.guest_email_generation                         as mail_generation,
  o.guest_email_attempts                           as mail_attempts,
  o.guest_email_locked_at                          as last_attempt_at,
  o.guest_email_sent_at                            as sent_at,
  (o.guest_email_message_id is not null)           as resend_accepted,
  regexp_replace(o.guest_email, '^(.{2})[^@]*', '\1***') as email_masked,
  now()                                            as checked_at
from public.toss_payment_orders o
where o.guest_email = lower(trim('<EMAIL>'))
order by o.created_at desc
limit 10;
