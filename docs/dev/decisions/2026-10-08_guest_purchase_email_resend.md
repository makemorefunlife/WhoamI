# 2026-10-08 비회원 결제 안내 메일(Resend)·계정 연결·테스트 결제 정책

브랜치: `pay/toss-guest-ux` (기준 `pay/toss-kr-test` 625b97c). 운영 DB·main·배포·라이브 키는 손대지 않음.

## 1. 흐름

1. **결제 모달**: 로그아웃 상태에서 상품의 구매 버튼을 누르면 모달이 열린다.
   - "로그인하면 결과 자동 저장, 관계 분석도 빠르게!" 문구와 [간편 로그인] 버튼이 있다. 로그인 후 같은 페이지로 돌아오며 `?checkout=<planId>`로 상품을 유지하고, 돌아오면 "결제 계속하기"가 뜬다.
   - "또는 비회원으로 결제" 영역: 구매 안내를 받을 이메일, 안내문, [필수] 구매 조건 및 취소·환불 규정 동의, 환불 고지, 이용약관·환불 정책·개인정보처리방침 링크.
2. **결제 승인**: 서버(`/api/payments/toss/confirm`)가 주문 행 기준으로 상품·금액·통화를 검증한 뒤 토스 confirm을 호출한다.
   - 비회원 주문은 `paid` 상태로 두고, 안내 메일을 DB 큐에 넣은 뒤 1회 즉시 발송을 시도한다.
3. **완료 화면**:
   - 회원: 이용권 지급이 확인된 뒤 "이용권이 계정에 연결됐어요!"를 보여 준다.
   - 비회원: 승인이 확인된 뒤 "구매가 완료됐어요!"를 보여 준다. "링크를 보냈어요"는 Resend가 실제로 메일을 접수(id 반환)한 경우에만 표시한다.
4. **계정 연결**:
   - 메일 링크가 `/api/payments/toss/claim-link`로 들어오면 토큰을 검증하고, 토큰을 30분짜리 httpOnly 쿠키로 옮긴 뒤 claim 화면으로 보낸다. 그래서 claim 화면 URL에는 토큰이 없다.
   - claim 화면에서 가입/로그인할 때 구매 이메일이 미리 채워진다(Clerk `initialValues`, sessionStorage 경유, URL 미포함). 인증 후 claim 화면으로 돌아온다.
   - `/api/payments/toss/claim`이 Clerk 인증 이메일과 주문 이메일이 같은지 서버에서 확인한다. 이용권은 SQL 경로에서 한 번만 지급된다.
   - 연결이 끝나면 상품·언어·설문·출생정보 상태에 맞는 기존 경로로 이동한다(`lib/payment/postPurchaseDestination.ts`).
5. **링크 만료(30일)**: 이용권 기한과는 별개다. 만료돼도 주문과 이용권은 그대로이고, 구매 이메일로 로그인하면 연결할 수 있다.
   - "새 링크 받기"를 누르면 새 nonce를 발급해 이전 링크를 무효화하고, **주문 이메일로만** 새 링크를 보낸다. 주문당 5분에 1회로 제한되며 IP 제한도 함께 적용된다.

## 2. 메일 큐와 자동 재시도

| 상태 | 의미 |
|---|---|
| pending | 승인 직후 큐에 들어감 |
| sending | 발송 중(2분 리스, 한 번에 한 발송자만) |
| sent | Resend 접수 완료 |
| retry | 일시 오류 또는 429. Retry-After를 따르거나 1→2→4… 분(최대 6시간) 뒤 재시도 |
| failed | 영구 오류(잘못된 발신자·수신자 등) 또는 6회 초과. 운영자가 재발송 |
| skipped | 공개 환경에서 허용되지 않은 테스트 결제 |

- **중복 방지**: DB 리스와 Resend `Idempotency-Key: guest-guide-<orderId>-<generation>`(24시간)을 함께 쓴다. 승인 재시도, 동시 요청, 백그라운드 재시도가 겹쳐도 같은 세대의 메일은 한 번만 나간다.
- **결제와 분리**: 메일 실패는 주문·이용권에 영향을 주지 않는다.
- **서버리스 처리 경로**(아래 세 가지 모두 동작):
  1. confirm 요청 안에서 즉시 1회 발송
  2. `after()`(Next.js): confirm·claim-info 응답 뒤 기한이 지난 큐를 최대 3건 처리
  3. `/api/cron/guest-emails`(Authorization: Bearer `CRON_SECRET`): 정기 실행 경로. 스케줄러가 필요하다.
     - Vercel Cron: Pro 이상이면 `vercel.json`에 `*/5 * * * *` 같은 일정을 넣는다. Hobby 플랜은 하루 1회만 허용되고, 더 잦은 일정은 배포가 실패한다. 그래서 `vercel.json`은 이번 브랜치에 넣지 않았다.
     - Supabase pg_cron + pg_net(플랜 무관): 운영 적용 시 아래 SQL을 쓴다. 비밀값은 Vault에 넣는다.
       ```sql
       select cron.schedule('guest-emails', '*/5 * * * *', $$
         select net.http_post(
           url := 'https://www.ahaitsme.com/api/cron/guest-emails',
           headers := jsonb_build_object('Authorization', 'Bearer ' ||
             (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')));
       $$);
       ```
- **운영자 재발송**: `POST /api/admin/toss-guest-email/<orderId>/resend` (`{ "allowResend": true }`이면 이미 보낸 메일도 다시 보냄).

## 3. 테스트 결제 정책

- 주문 생성 시 서버 키가 `test_sk_`이면 `is_test = true`로 표시한다. 실제 구매와 구분된다.
- **DEV**(VERCEL_ENV 없음): 제한 없이 메일 → 가입·인증 → 연결 → 분석까지 전체를 테스트할 수 있다. 메일 제목과 본문에 "테스트 구매·실제 청구 없음"이 표시된다.
- **공개 환경**(VERCEL_ENV=production/preview, 또는 `TOSS_TEST_RESTRICT=true`):
  - 일반 방문자의 테스트 결제는 `status = 'test_completed'`로 기록하고 이용권을 지급하지 않는다. 메일은 skipped 처리한다. **자동 취소는 하지 않는다.**
  - 허용 계정(`TOSS_TEST_ALLOWLIST`: Clerk user id 또는 이메일)만 서버에서 확인해 지급한다. 기준은 Clerk 인증 이메일이며, 수량은 `TOSS_TEST_GRANT_LIMIT`(기본 3)까지다.
  - 비회원 이메일은 브라우저 입력값이므로 "메일 발송·흐름 계속" 여부만 정한다. 실제 지급은 연결하는 계정의 인증 이메일로 다시 판단한다.
- 미국 USD 결제 활성화 상태는 변경하지 않았다.

## 4. 환경변수

| 이름 | 용도 | 비고 |
|---|---|---|
| `RESEND_API_KEY` | Resend 발송 | 서버 전용 |
| `MAIL_FROM` | 발신자 | 예: `Aha! It's me <no-reply@ahaitsme.com>`. 도메인을 Resend에서 인증해야 함(SPF/DKIM). `onboarding@resend.dev`는 Resend 계정 소유자 이메일로만 발송됨 |
| `APP_BASE_URL` | 메일 링크의 사이트 주소 | DEV `http://localhost:3000`, 운영 `https://www.ahaitsme.com` |
| `GUEST_CLAIM_TOKEN_SECRET` | 연결 링크 HMAC | 32자 이상 랜덤. 바꾸면 기존 링크가 무효(새 링크 받기로 복구) |
| `CRON_SECRET` | 백그라운드 발송 경로 인증 | 16자 이상 |
| `TOSS_TEST_ALLOWLIST`, `TOSS_TEST_GRANT_LIMIT` | 공개 환경 테스트 허용 | 선택 |

설정 확인: `node scripts/dev/check-resend-setup.mjs` (키 값은 출력하지 않음).

## 5. 영수증

- 토스 문서에는 `customerEmail`이 "결제 상태가 바뀌면 이메일 주소로 결제내역이 전송됩니다"로 설명되어 있다. 그러나 테스트·실제 수신은 확인하지 못했다.
- 그래서 입력란 라벨은 "구매 안내를 받을 이메일"로 유지한다. 수신이 확인되면 "구매 안내·영수증 받을 이메일"로 바꾼다(`guestEmailLabelWithReceipt`가 준비되어 있음).
- 우리 메일은 영수증이 아니다. 토스가 준 `receipt.url`(매출전표)이 있을 때만 "결제 영수증 보기(토스페이먼츠 제공)" 링크를 넣는다.

## 6. 개인정보처리방침 수정안(미반영, 대표 확인 필요)

현재 방침에는 비회원 결제 이메일 항목이 없다. 추가할 안:

- **수집 항목**: 비회원 결제 시 구매자 이메일, 주문번호, 결제 상품·금액·일시(결제수단 정보는 토스페이먼츠가 처리).
- **목적**: 구매 안내·계정 연결 링크 발송, 구매 소유권 확인(동일 이메일로 인증된 계정에 이용권 연결), 결제·환불 처리, 고객 문의 대응.
- **보유 기간**: 전자상거래법에 따라 대금결제·재화 공급 기록은 5년, 소비자 불만·분쟁 처리 기록은 3년. 계정 연결 전 미수령 주문의 이메일도 같은 기간 보관하고, 이후 파기한다.
- **처리 위탁**: Resend(Resend, Inc., 미국) — 이메일 발송.
- **국외 이전 고지**: 이전 항목(이메일 주소, 메일 본문의 주문 정보), 국가(미국), 이전 일시·방법(메일 발송 시 네트워크 전송), 보유 기간(Resend 보관 정책), 거부 방법과 불이익(비회원 결제 불가, 회원 결제 이용 가능).
- 토스페이먼츠 결제 처리 위탁 항목이 있는지도 확인해야 한다.

## 7. 푸터 확인(추정값 없음)

- 상호 아하잇츠미, 대표자 홍성현, 사업자등록번호 387-06-03769, 주소(사업자등록 기준 표기), 이메일 contact@ahaitsme.com: 표시 중.
- **누락**: 통신판매업 신고번호(값이 비어 있어 줄 자체가 숨겨짐).
- **확인 필요**: 고객센터 전화번호가 미국 번호(+1 626-381-8420)이고 "전화 상담 미제공"으로 되어 있음. 국내 고객센터 번호 기재 여부를 확인해야 함.
- 푸터 링크는 모두 실제 페이지로 연결된다. 빈 메뉴나 `href="#"` 링크는 발견되지 않았다.
