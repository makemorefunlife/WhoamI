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
