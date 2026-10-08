# 2026-10-08 상품별 비회원 이용 흐름 — 이메일 시안 & 변경 계획 (검토용)

상태: **계획만 작성.** 코드, DB, 배포 변경 없음. 발신·답장 주소는 support@ahaitsme.com 유지.

## 0. 현재 구현 확인 결과 (요약)

| 항목 | 지금 | 확정 흐름과의 차이 |
|---|---|---|
| 비회원 결제 | KR 4개 상품 가능. 주문은 `toss_payment_orders`에 `guest_email`과 함께 저장 | 유지 |
| 이용권 지급 | 비회원 주문은 **로그인한 Clerk 계정**의 인증 이메일이 주문 이메일과 같아야 연결됨(claim) | Personal은 계정 없이 사용해야 함 → 새 경로 필요 |
| 보고서 소유 | `reports.clerk_user_id`가 NOT NULL("guest reports forbidden"). 생성 API·출생정보·설문 API 모두 로그인 필수 | 비회원 Personal용 서버 보관소 필요 |
| 비회원 설문·출생정보 | **브라우저 localStorage에만** 있음. 서버 저장 없음 | 캐시 의존 금지 → 서버 임시 보관 필요 |
| Personal 심화 생성 | `/api/v2/deep/essence`가 로그인과 보고서 소유를 요구. 크레딧은 `clerk_user_id` 기준으로 예약·차감. 설문·출생정보는 **요청 본문 값을 그대로 사용** | 비회원은 주문 1건을 1회 사용권으로 소진. 입력값은 서버에 저장된 값만 사용 |
| 비회원 → 계정 이전 | `mergeGuestAccount`가 비활성("temporarily disabled") | 비회원 Personal 결과를 재생성 없이 계정으로 옮기는 기능 신규 필요 |
| 안내 메일 | 모든 상품이 템플릿 1종. 버튼 "계정 연결하고 분석 시작하기" | 상품군별 2종, 사용 순서·기한·환불 안내 |
| "저장되지 않아요" 문구 | 비회원 대시보드 안내(`GuestDashboardAuthNotice`). 지금은 사실과 일치(브라우저 저장만) | 구매한 비회원 Personal 화면에서는 쓰지 않고, 실제 보관 정책 문구로 대체 |

## 1. 확정 흐름 → 구현 설계

### 1-1. 단독 Personal (계정 없이 사용)

```
구매(비회원) → 안내 메일 [이용권 사용하기]
  → 소유권 확인: ① 메일 링크(서명 토큰) 또는 ② 구매 이메일 인증코드(6자리)
  → 비회원 이용 세션(httpOnly 쿠키, 이 주문에만 유효)
  → 생년월일·출생지(·필요한 설문) 입력 → 서버 임시 보관
  → Personal 심화 생성(주문 1회 사용 처리) → 결과 확인
  → [로그인하고 저장] / [가입하고 저장] → 재입력·재생성 없이 계정으로 이전
```

**소유권 확인**
- 이메일 주소를 입력하는 것만으로는 아무것도 허용하지 않는다.
- ① 메일 링크: 지금의 HMAC 토큰 + 30일 링크를 그대로 쓴다.
- ② 링크가 만료됐거나 다른 기기라면, 구매 이메일로 6자리 코드를 Resend로 보낸다. 코드는 해시로 저장하고 10분 뒤 만료, 5회 실패 시 잠금, 주문·IP별 발송 횟수를 제한한다.
- 확인되면 비회원 이용 세션을 발급한다. 세션 ID는 해시로 DB에 저장하고 쿠키는 httpOnly다. 기간은 이용권 기한 안에서 정한다(예: 7일). 끝나면 링크나 코드로 다시 확인한다.
- 다른 사람이 메일을 전달받아 링크를 누르면 그 사람도 사용할 수 있다. 메일 수신함을 가진 사람을 소유자로 보는 방식이라 생기는 한계다.

**Clerk 인증과의 차이**
- Clerk의 이메일 인증은 가입·로그인 과정 안에서만 동작한다. 인증을 마치면 Clerk 계정이 생기거나 그 계정으로 로그인된다.
- 그래서 회원가입을 강제하지 않는 Personal 흐름은 **자체 인증코드(Resend 발송)**를 쓴다. Clerk 계정은 생기지 않는다.
- 사용자가 [저장]을 누를 때에만 Clerk 가입·로그인이 일어난다.

**데이터 보관(캐시 의존 X)**
- 새 테이블 `guest_personal_sessions`를 만든다.
  - 컬럼: 주문 ID(유일), 출생 정보, 설문 응답(jsonb), 생성 결과(jsonb), 상태, 생성일, 보관 만료일, 이전한 계정·보고서 ID
  - 기존 `reports`의 "비회원 보고서 금지" 규칙은 건드리지 않는다.
- 생성할 때는 **서버에 저장된 입력값만** 쓴다. 요청 본문 값은 쓰지 않는다.
- 브라우저 캐시는 화면 속도용으로만 쓰고, 기준 데이터는 서버다.

**한 번만 사용**
- 주문에 사용 상태 `unused → generating → used`를 둔다. 크레딧 예약·차감과 같은 방식으로 잠금을 걸고, 실패하면 `unused`로 되돌린다.
- 이미 사용한 주문은 나중에 계정 연결(claim)을 해도 **크레딧을 다시 지급하지 않는다**. 결과 보고서만 이전한다.
- 사용 전에 계정으로 연결하면 지금처럼 Personal 크레딧 1개를 지급하고, 비회원 사용은 막힌다. 둘 중 하나만 된다.

**계정 저장(재입력·재생성 없음)**
- 결과 화면 문구: "로그인하거나 가입하면 입력한 정보와 보고서를 계정에 저장하고 다시 볼 수 있어요" + [저장하기] 버튼.
- 저장하기를 누르면 Clerk 가입·로그인 화면이 열린다. 구매 이메일이 미리 채워져 있고, 끝나면 돌아온다.
- 돌아오면 서버가 다음을 한다.
  1. 비회원 이용 세션이 유효한지 확인한다.
  2. `reports` 행을 새로 만들고(`clerk_user_id` 포함) 출생정보, `survey_responses`, `report_analyses(deep_essence_structured)`를 복사한다.
  3. 주문을 그 계정에 연결한다.
  - 한 트랜잭션으로 처리하고, 같은 요청을 다시 보내도 결과가 같다.

**재방문·복구**
- 같은 기기: 이용 세션이 있으면 결과로 바로 간다.
- 다른 기기 또는 쿠키 만료: 메일 링크를 다시 열거나 "구매 이메일로 인증코드 받기"를 쓴다. 이 기능은 주문 조회 페이지에도 넣는다.

### 1-2. Relationship / Triple / 30일 패스 / 12개월 회원권 (계정 필요)

```
구매(비회원) → 안내 메일 [계정 연결하고 이용하기]
  → 구매 이메일로 가입·간편 로그인 + 이메일 인증(Clerk, 이메일 미리 채움)
  → 이용권 연결(인증 이메일 = 주문 이메일, 1회 지급)
  → 상품별 이용 화면
```

- 지금 구현(claim-link → claim 화면 → claim API → 이동 경로 계산)을 그대로 쓴다.
- 바뀌는 것은 메일 문구, 버튼명, 상품별 안내다.
- 30일 패스: 패스에 포함된 Personal도 계정에 연결된 크레딧으로만 쓴다. 기간은 **구매일**부터 30일이며, 지금도 연결 시점이 아니라 결제 시점 기준으로 계산한다.
- 12개월 회원권(미국):
  - 지금은 `guestCheckout: false`라 로그인한 뒤에만 살 수 있다. 미국 결제 자체도 꺼져 있다.
  - 비회원 구매를 허용하려면, 연결하는 계정에 이미 활성 회원권이 있을 때의 처리(자동 환불 등)를 정해야 한다. → 결정 필요

### 1-3. 공통

- **지급·사용 1회**: 계정 연결은 기존 RPC로 1회만 지급된다. 비회원 Personal 사용 상태와 서로 배타적이다.
- **보관 정책(제안)**:
  - 비회원 Personal의 입력정보와 결과는 **구매일로부터 12개월**(이용권 기한과 같음) 보관한다.
  - 계정으로 저장하면 계정 데이터 정책을 따른다.
  - 기간이 지나면 자동 삭제한다(정기 작업).
  - 주문·결제 기록은 법정 기간(5년) 동안 보관하고, 출생정보 같은 분석 데이터는 포함하지 않는다.
- **문구**: 구매한 비회원 화면에서는 "저장되지 않아요"를 쓰지 않는다. 대신 "입력한 정보와 보고서는 구매일로부터 12개월간 이 구매에 연결해 보관돼요. 계정에 저장하면 언제든 다시 볼 수 있어요."를 쓴다.
  - 결제하지 않은 일반 비회원 대시보드 문구는 지금도 사실(브라우저에만 저장)이라 유지한다.
- **개인정보처리방침**: 비회원 Personal 입력정보(생년월일·출생지·설문)의 수집 목적과 보관 기간, Resend(미국) 국외 이전 항목을 추가해야 한다.

## 2. 이메일 시안

공통 사항:
- 발신 `Aha It's me <support@ahaitsme.com>`, 답장 support@ahaitsme.com.
- 테스트 결제일 때만 제목 앞에 `[테스트 구매·실제 청구 없음]`, 본문 맨 위에 배너를 붙인다.
- 링크 기한(30일)은 이용권 기한과 별개라고 명시한다.

### A. Personal — 한국어

**제목**: [Aha! It's me] 구매하신 Personal 분석 이용권 안내

> 구매해 주셔서 감사합니다
>
> Aha! It's me Personal 심화 분석 이용권 구매가 완료되었습니다. 회원가입 없이 바로 사용할 수 있어요.
>
> | 구매 상품 | Personal 심화 분석 1회 |
> |---|---|
> | 결제 금액 | 7,900원 |
> | 구매일 | 2026년 10월 8일 |
> | 이용권 사용 기한 | 구매일로부터 12개월 이내 1회 생성 |
>
> **이용 순서**
> 1. 아래 [이용권 사용하기]를 눌러 주세요. 다른 기기에서는 구매 이메일로 받은 인증코드로 확인할 수 있어요.
> 2. 생년월일·출생지와 필요한 설문을 입력해 주세요.
> 3. 개인 분석 결과를 확인하세요.
> 4. 로그인하거나 가입하면 입력한 정보와 보고서를 계정에 저장하고 언제든 다시 볼 수 있어요. 다시 입력하거나 다시 생성할 필요는 없어요.
>
> **[ 이용권 사용하기 ]**
>
> 이용권은 이 구매 1건에 대해 한 번 사용할 수 있어요. 입력한 정보와 보고서는 구매일로부터 12개월간 이 구매에 연결해 보관돼요.
> 이 메일의 링크는 30일 동안 유효해요. 링크 기한은 이용권 사용 기한과 별개라, 만료돼도 구매 이메일 인증코드로 계속 이용할 수 있어요.
>
> **환불 안내**: 보고서를 생성하기 전이라면 구매일로부터 7일 이내 전액 환불돼요. 보고서가 생성된 뒤에는 관련 법령에 따라 단순 변심 청약철회가 제한될 수 있어요. → [환불 정책 보기]
> 결제 영수증 보기(토스페이먼츠 제공)
>
> 본 메일은 구매 안내 메일입니다. 문의는 이 메일에 답장하시거나 support@ahaitsme.com으로 보내 주세요.

### A. Personal — English

**Subject**: [Aha! It's me] Your Personal analysis pass

> Thank you for your purchase
>
> Your Aha! It's me Personal deep analysis pass is ready. You can use it right away, no account needed.
>
> | Product | Personal deep analysis ×1 |
> |---|---|
> | Amount paid | ₩7,900 |
> | Purchase date | October 8, 2026 (UTC) |
> | Use by | One report within 12 months of purchase |
>
> **How to use it**
> 1. Tap **Use my pass** below. On another device, confirm with a code sent to your purchase email.
> 2. Enter your birth date and place, plus any questions we need.
> 3. See your personal analysis.
> 4. Sign in or sign up to save your details and report to an account and reopen them anytime. Nothing has to be re-entered or regenerated.
>
> **[ Use my pass ]**
>
> The pass can be used once for this purchase. Your details and report are kept with this purchase for 12 months from the purchase date.
> This link is valid for 30 days. That is separate from the pass's use-by date: if the link expires, you can keep going with a code sent to your purchase email.
>
> **Refunds**: Before a report is generated, you can get a full refund within 7 days of purchase. After generation, change-of-mind withdrawal may be limited by law. → [Refund policy]
> View payment receipt (by Toss Payments)
>
> Questions? Reply to this email or write to support@ahaitsme.com.

### B. 계정 필요 상품 — 한국어 (상품별로 바뀌는 줄만 표시)

**제목**: [Aha! It's me] 구매하신 {상품명} 이용권 안내

> Aha! It's me {상품명} 구매가 완료되었습니다. 이 상품은 계정에 연결한 뒤 이용할 수 있어요.
>
> | 구매 상품 | {상품명} |
> |---|---|
> | 결제 금액 | {금액} |
> | 구매일 | {구매일} |
> | 이용권 사용 기한 | {기한} |
>
> **이용 순서**
> 1. 아래 [계정 연결하고 이용하기]를 눌러 주세요.
> 2. 구매 이메일({가려진 이메일})로 가입하거나 간편 로그인한 뒤 이메일 인증을 완료해 주세요. 이미 계정이 있으면 로그인만 하면 돼요.
> 3. 이용권이 계정에 연결되면 {이용 화면}으로 이어져요.
>
> **[ 계정 연결하고 이용하기 ]**
>
> 계정 연결 후 이용권을 받을 수 있습니다. 이용권은 이 구매 1건에 대해 한 번만 연결돼요.
> 링크는 30일 동안 유효해요. 링크 기한은 이용권 기한과 별개라, 만료돼도 구매 이메일로 로그인하면 연결할 수 있어요.
>
> **환불 안내**: {환불 줄} → [환불 정책 보기]

| 상품 | {기한} | {이용 화면} | {환불 줄} |
|---|---|---|---|
| Relationship (14,900원) | 구매일로부터 12개월 이내 1회 생성 | 관계 분석 화면 | 생성 전 구매일로부터 7일 이내 전액 환불. 생성 후 단순 변심 청약철회 제한될 수 있음 |
| Relationship Triple (33,000원) | 구매일로부터 12개월 이내 총 3회 생성 | 관계 분석 화면 | 3회 모두 사용 전이면 구매일로부터 7일 이내 전액 환불. 사용 후 기준은 환불 정책 확인 |
| 30일 인사이트 패스 (20,000원) | **구매일로부터 30일**(계정 연결일이 아님). Personal 1회 · Relationship 1회 · Decision Journal 무제한 | 내 분석 화면(포함된 Personal부터) | 어떤 혜택도 사용하기 전이면 구매일로부터 7일 이내 전액 환불. 사용 후 기준은 환불 정책 확인 |
| 12-Month Membership (US, 영문만) | 12 months from the purchase date, no auto-renewal | Account home | Full refund within 7 days if no benefit was used; otherwise prorated refund for unused days |

### B. Account-required products — English (pattern)

> **Subject**: [Aha! It's me] Your {product} pass
>
> Your {product} purchase is complete. This product is used from an account.
> 1. Tap **Link my account** below.
> 2. Sign up or sign in with your purchase email ({masked}) and verify it. Already have an account? Just sign in.
> 3. Once the pass is linked, you'll go straight to {where}.
>
> You'll receive the pass after linking an account. It links once for this purchase. The link is valid for 30 days, which is separate from the pass's use-by date.
> Refunds: {refund line} → [Refund policy]

Notes on wording:
- The KR Triple and Pass refund lines follow refund policy section 1: "unused within 7 days, full refund". The policy has no separate partial-use rule for these two, so the line only says "see the refund policy for refunds after use".
- The membership line follows the EN policy: full refund within 7 days if unused, otherwise prorated.

## 3. 변경 계획 (현재 구현 대비)

| # | 작업 | 대상 | 규모 |
|---|---|---|---|
| 1 | 메일 템플릿 2종(Personal / 계정 필요) + 상품별 기한·이용 화면·환불 줄, 한·영 | `lib/email/guestPurchaseEmail.ts`, i18n | 소 |
| 2 | 메일 버튼 이동: Personal은 비회원 이용 화면, 나머지는 기존 claim 화면 | `claim-link` 라우트 | 소 |
| 3 | 비회원 인증코드: 발송·확인 API, 발송 제한, 시도 잠금 | 신규 API 2개 + 테이블 | 중 |
| 4 | 비회원 이용 세션(httpOnly, 해시 저장, 주문 단위) | 신규 lib + 테이블 | 중 |
| 5 | `guest_personal_sessions` 테이블·RPC: 입력 저장, 1회 사용 잠금, 결과 저장 | migration(DEV만) | 중 |
| 6 | 비회원 Personal 생성 API: 서버 저장 입력값으로 기존 생성 로직 재사용, 주문 1회 사용 | 생성 로직 분리 + 신규 라우트 | 대 |
| 7 | 비회원 이용 화면: 출생정보·설문 입력 → 생성 → 결과(기존 결과 컴포넌트 재사용) + 저장 배너·버튼 | 신규 페이지 | 대 |
| 8 | 계정 저장(이전) RPC: reports·설문·결과 복사, 주문 연결, 이미 사용한 주문은 크레딧 미지급 | migration + API | 중 |
| 9 | 기존 claim 수정: 비회원 사용 완료 주문이면 크레딧 대신 보고서만 연결 | `claim_paid_guest_toss_order` | 소 |
| 10 | 주문 조회·복구 페이지(이메일 → 인증코드 → 내 구매) | 신규 페이지 | 중 |
| 11 | 보관기간 만료 삭제(정기 작업) | cron 경로 재사용 | 소 |
| 12 | 문구: 구매한 비회원 화면에서 보관 안내로 교체 / 개인정보처리방침 수정안 | i18n, 법무 문서 | 소 |
| 13 | 테스트: 소유권(링크·코드·잘못된 코드·잠금), 1회 사용 동시성, 계정 저장 재시도, 이전 후 크레딧 중복 없음, 보관 만료 | 모의 + DEV 실제 | 중 |

권장 순서: 1–2(메일, 바로 반영 가능) → 3–5 → 6–7 → 8–9 → 10–12 → 13.
운영 DB 변경, 배포, 라이브 전환은 하지 않는다. migration은 DEV에만 적용한다.

## 4. 결정이 필요한 것

1. **계정 저장 시 이메일**: 비회원 세션으로 소유권이 확인됐다면, 구매 이메일과 **다른 이메일**의 계정에도 저장할 수 있게 할까요?
   - 권장: 허용(이미 수신함 소유가 확인됨). 대신 계정에 "구매 이메일" 기록을 남긴다.
2. **비회원 데이터 보관 기간**: 구매일로부터 12개월(이용권 기한과 같음)을 제안해요.
3. **KR 설문**: Personal에서 설문을 필수로 할까요, 선택으로 할까요? 지금 KR 정책은 생년월일만으로도 분석이 가능하게 되어 있어요.
4. **12개월 회원권 비회원 구매**: 지금은 로그인한 뒤에만 살 수 있어요. 허용한다면, 이미 회원인 계정에 연결할 때 자동 환불할지 정해야 해요. 미국 결제는 현재 비활성이에요.
5. **비회원 이용 세션 길이**: 예시로 7일을 제안해요. 끝나면 링크나 인증코드로 다시 확인해요.

## 정정 반영 (2026-10-09): 진입 경로·가입 필요 여부 안내

- 판매 중인 KR 4개 상품은 모두 비회원 구매가 가능하다(`guestCheckout: true`). US 결제 활성화 상태는 바꾸지 않았다.
- "시작하기" 모달(비로그인): '로그인 없이 상품 보고 구매하기'(→ `/pricing`)를 추가했다. 로그인은 선택으로 안내한다. 무료 체험은 기존대로 로그인 후 시작하며, 카드에 그 사실을 표시한다.
- 홈 로그인 모달 하단에도 '로그인 없이 상품 보고 구매하기'를 추가했다.
- 결제 전 안내(비로그인일 때만 표시): 요금 카드와 결제 팝업에서 Personal은 "회원가입 없이 이용 · 구매 이메일 인증만", 그 외 상품은 "계정 필요 · 구매 후 구매 이메일로 가입 또는 로그인"으로 표시한다.
- 구매 메일 도입 문구: Personal은 "회원가입 없이 … 저장하고 싶을 때만 선택해서 가입", 계정 상품은 "이 상품은 계정이 필요해요"로 바꿨다.
- 무료 체험, 토스 결제, 지급 로직은 변경하지 않았다.
- 검증: 모의 테스트 33개 통과(10 + 9 + 14). 실제 화면 확인은 미실행(로컬 dev 서버 미접속).
