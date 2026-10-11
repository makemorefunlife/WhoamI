# 2026-10-11 개인정보처리방침 수정안 (초안 — 미적용)

상태: **초안. `lib/legal/privacyPolicy.ts`(공개 방침)는 바꾸지 않았다.** 법률 검토 후 반영.
근거: 현재 코드(2026-10-11 커밋 기준). 확인하지 못한 수치·상호·전화번호는 적지 않았다.

## 현재 방침과 실제 동작이 어긋나는 점 (반영 필요)

| # | 현재 방침 문구 | 실제(또는 이번에 추가된) 동작 |
|---|---|---|
| 1 | 결제 업체를 특정하지 않음("제3자 결제 서비스 제공업체") | 한국 결제는 토스페이먼츠로 처리(테스트 키로 운영 준비 중). 미국 결제는 비활성 |
| 2 | 메일 발송 업체 없음 | 구매 안내·인증코드 메일을 Resend로 발송(발신·답장 support@ahaitsme.com) |
| 3 | 계정 이메일만 수집한다고 기재 | 비회원 구매 시 구매 이메일, 비회원 초대 참여 시 선택적 이메일(인증 후 복구용) 수집 |
| 4 | 비회원 데이터·보관 기간 없음 | 비회원 Personal·단건 Relationship·초대 참여 데이터를 기간 한정 보관(아래) |
| 5 | Decision Journal은 기기에만 저장 | 계정 서버 저장 기능을 만들었으나 **꺼 둠**(`DECISION_JOURNAL_SERVER_STORAGE=on` 일 때만). 켜기 전에 방침 개정 필요 |
| 6 | 상대 정보 입력 시 이용자 책임만 안내 | 비회원 단건 Relationship에서 상대 정보 입력 전 안내 확인(필수 체크)을 받고 확인 시각·문구 버전을 저장 |

## 수정안 문구 (한국어)

**1항 수집 항목에 추가**
- 비회원 구매 정보: 구매 이메일, 주문번호·상품·금액·결제 상태, 구매 확인용 인증코드(해시로만 저장).
- 비회원 이용 입력 정보: 비회원으로 Personal·Relationship을 이용할 때 입력하는 이름(별칭), 생년월일, 태어난 시간·장소, 설문 응답, 그리고 생성된 보고서.
- 비회원 초대 참여 정보: 초대 링크로 가입 없이 참여할 때 입력하는 이름(별칭), 생년월일 정보, 설문 응답, 연령·개인정보 확인 여부, (선택) 복구용 이메일.
- (서버 저장을 켤 때) 디시전 저널 항목: 로그인한 계정의 기록. 이 기기에 저장된 기록은 이용자가 계정으로 옮기기를 선택했거나 본인 프로필의 기록인 경우에만 계정으로 옮겨지며, 기기의 기록은 삭제하지 않습니다.

**2항 제3자 정보에 추가**
- 비회원 단건 Relationship에서는 상대 정보를 입력하기 전에 안내를 확인받습니다. 입력한 상대 정보는 해당 관계 분석을 만들고 보여 주는 데만 쓰이며, 상대에게 연락하거나 다른 용도로 쓰지 않습니다.

**5·6항 처리위탁·국외이전에 추가**
- 토스페이먼츠 — 한국 결제·환불 처리. (국내 업체. 이전 항목·보유기간은 업체 정책에 따름 — 계약서로 확인 후 기재)
- Resend(미국) — 구매 안내·인증코드 메일 발송. 이전 항목: 수신 이메일 주소, 메일 본문(상품명, 구매일, 마스킹된 이메일, 이용 링크). 보유기간: Resend 자체 정책에 따름(확인 후 기재).

**12항 보유 기간에 추가**
- 비회원 Personal: 이용권은 구매일로부터 12개월 안에 사용. 분석을 만들면 입력 정보와 보고서는 생성일로부터 12개월 보관, 만들지 않으면 이용권 기한이 끝날 때 삭제. 환불·취소된 주문은 즉시 삭제.
- 비회원 단건 Relationship: 생성·다시 보기·보관 모두 구매일로부터 12개월. 이후 삭제. 환불·취소된 주문은 즉시 삭제. 기간 안에 구매 이메일로 가입하면 계정으로 옮겨져 계정 보관 기준을 따름.
- 비회원 초대 참여: 참여일로부터 30일. 이후 입력 정보와 복구용 이메일 삭제. 단, 초대한 사람이 그 관계로 유료 보고서를 이미 만든 경우 관계 기록은 남기되 참여자의 이름·생년월일 정보는 지움. 기간 안에 가입하면 계정으로 연결.
- 구매 이메일(주문 기록): 법령상 거래 기록 보관 대상과 함께 보관 — **보관 기간 확정 필요**(현재 정책 미정).
- 정리 작업은 정기 실행으로 처리됩니다. *(주의: 정기 실행 연결 전에는 이 문장을 넣지 말 것 — `2026-10-11_ops_retention_mail_schedule.md` 참고)*

**14항 문의처**: 변경 없음(contact@ahaitsme.com). 발신 주소 support@ahaitsme.com은 메일 답장용으로만 안내.

## English (same changes, short)

- Collect: guest purchase email and order data; guest-use inputs and the report; guest invite participant inputs with an optional recovery email; (when enabled) Decision Journal entries per account — device entries move only when they are the user's own profile's or the user confirms, and the device copy is not deleted.
- Third-party data: guest single Relationship asks the buyer to confirm a notice before entering the other person's details; used only for that analysis.
- Processors: Toss Payments (KR payments/refunds), Resend (US; purchase-guide and verification-code emails).
- Retention: guest Personal (use within 12 months; report and inputs 12 months from generation), guest Relationship (12 months from purchase in total), guest invite participation (30 days), refunded/cancelled guest orders deleted at once; guest purchase email retention to be decided.

## 결정 필요(사용자·법률 검토)
1. 토스페이먼츠·Resend의 보유기간·이전 항목 문구(계약서 확인).
2. 구매 이메일(주문 기록) 보관 기간.
3. 상대 정보 입력 안내 문구의 법률 검토(현재 앱 문구: `payments.guestRelationship.consentBody`).
4. Journal 서버 저장 시작 시점(방침 개정과 동시에 `DECISION_JOURNAL_SERVER_STORAGE=on`).
