import type { PolicyDocument } from "@/lib/legal/types";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Privacy Policy — en-US sourced from Legal/privacy_policy_en.md,
 * ko-KR sourced from Legal/privacy_policy_kr.md.
 *
 * The ko-KR source originally listed Toss Payments alongside Paddle as a
 * processor — that was the pre-Beta plan. The actual Beta implementation
 * routes ALL payments (both locales) through Paddle only (see
 * components/payment/CheckoutWithRefundConsent.tsx's own doc comment).
 * Section 4 below reflects that, matching the en-US version and the real
 * payment code.
 *
 * 2026-09-19 code/legal audit (against the 2026-09-18 legal consultation
 * memo) restructured this document further:
 * - Split the old combined "제3자 제공 및 국외 이전 (수탁 업체)" section into
 *   처리위탁" (vendors acting on our behalf — Vercel/Supabase/Clerk/Paddle/
 *   OpenAI/Google Tag Manager, confirmed against the actual codebase) and a
 *   separate "제3자 제공 및 국외이전" section, per the memo's explicit
 *   guidance that 섄탁 and 제3자 제공 must not be conflated (PIPA §17 vs
 *   §26 vs §28-8).
 * - Added Google Tag Manager to the vendor list — it's loaded on every page
 *   in app/layout.tsx and was previously undisclosed here.
 * - Resend (see package.json) is NOT listed as a processor: grepping the
 *   codebase found no `Resend(...)` call or `RESEND_API_KEY` reference, so
 *   it is not currently wired to send anything. Add it here the moment it
 *   is actually used for outbound email — leaving a dependency installed
 *   but undisclosed is exactly the doc/code mismatch this audit was asked
 *   to catch.
 * - Added "개인정보보첕 보핬책임자" (PIPA §31) and "안전성 확보조치" (PIPA §29)
 *   sections, which were entirely missing. Both are TODO placeholders —
 *   the officer's name/title/contact and the actual technical/
 *   administrative safeguards are real facts this document can't invent.
 *   Note: an internal security review previously flagged unresolved issues
 *   in this area (e.g. table-level access control) — do not fill in the
 *   "안전성 확보조치" section with specific claims (encryption, access
 *   control, etc.) until those are actually true in production, or this
 *   section becomes a false representation rather than a gap.
 * - Added a destruction-method line to the retention section (standard
 *   PIPA-required categories: irreversible deletion for electronic files,
 *   shredding/incineration for paper) — the exact backup-purge cadence is
 *   still an open item per the legal memo and is marked TODO here too.
 *
 * None of the added TODOs are final legal language — per the memo's own
 * disclaimer, get this reviewed by counsel before relying on it.
 */
export const privacyPolicy: Record<Locale, PolicyDocument> = {
  "en-US": {
    title: "Privacy Policy",
    description:
      'Aha It\'s me ("we," "us," or "the Company") processes personal data in accordance with applicable laws, including the Korean Personal Information Protection Act (PIPA), the EU General Data Protection Regulation (GDPR), and the California Consumer Privacy Act (CCPA).',
    lastUpdated: "2026-09-19",
    sections: [
      {
        id: "collect",
        title: "1. Information We Collect",
        paragraphs: [
          "We collect and process the following categories of information:",
        ],
        listItems: [
          "Account Information (processed via Clerk): Email address, password, sign-in/sign-out activity logs.",
          "Service input data: Name, date of birth, time of birth, and gender.",
          "Third-Party Data: Information you submit about another person (e.g., birth details, name) for relationship analysis.",
          "Payment Information (processed via Paddle): We do not store full credit card numbers on our servers. Paddle shares limited transaction-related data with us, such as your payment email, country, transaction ID, and subscription status.",
          "Automatically Collected Information: IP address, browser/device information, usage logs, and cookies collected during your visits, including via Google Tag Manager. You can control cookies through your browser settings, and California residents can also use the \"Do Not Sell My Personal Information\" link in the footer.",
        ],
      },
      {
        id: "use",
        title: "2. How We Use Your Information",
        paragraphs: [
          "We use the collected information for the following purposes:",
        ],
        listItems: [
          "To generate astrology/psychology-based analyses and AI reports.",
          "To provide relationship analysis and sharing features.",
          "To process payments and manage subscriptions via Paddle.",
          "To communicate with you regarding your account, updates, or customer support.",
          "To improve, secure, and optimize our Service.",
        ],
      },
      {
        id: "ai",
        title: "3. AI Processing Disclosure",
        paragraphs: [
          "To provide our Core Service, we use third-party AI models provided by OpenAI.",
          "Data Transmitted: The birth details and names (including Third-Party Data) you input may be sent to OpenAI to generate your personalized analysis report.",
          "Data Protection: We transmit this data via secure API connections. Under our agreement with OpenAI, the submitted data is used solely for generating your report and is not used to train OpenAI's public AI models.",
        ],
      },
      {
        id: "processors",
        title: "4. Sub-Processors (Vendors Acting on Our Behalf)",
        paragraphs: [
          "To host, secure, and operate our Service, your personal data is processed by the following vendors, acting under our instructions and only for the purposes below:",
        ],
        listItems: [
          "Vercel (USA / Global) — Application hosting and distribution",
          "Supabase (USA / Global) — Secure database hosting and storage",
          "Clerk (USA / Global) — User authentication and identity management",
          "Paddle (UK / USA / Global) — Payment processing and merchant services",
          "OpenAI (USA) — AI-based analysis report generation",
          "Google Tag Manager (USA / Global) — Loading of analytics/marketing tags on our site",
        ],
      },
      {
        id: "thirdPartyAndTransfer",
        title: "5. Third-Party Disclosure & International Transfers",
        paragraphs: [
          "We do not sell your personal information or share it with third parties for their own independent purposes. Should this change, we will provide notice and obtain consent as required by law before doing so.",
          "Because the vendors listed in Section 4 are located outside Korea, using their services necessarily involves an international transfer of your data. Where required under applicable data protection laws (such as GDPR), these transfers are conducted based on Standard Contractual Clauses (SCCs) and appropriate technical safeguards.",
          "[TODO: confirm, per vendor, the exact items transferred, transfer method/timing, and the opt-out method required under PIPA Art. 28-8, before relying on this section for Korean users.]",
        ],
      },
      {
        id: "rights",
        title: "6. Your Rights",
        paragraphs: [
          "Regardless of your location, you have the right to request access, correction, deletion, or restriction of the processing of your personal information. You may exercise these rights at any time by contacting us at contact@ahaitsme.com.",
        ],
      },
      {
        id: "officer",
        title: "7. Privacy Officer",
        paragraphs: [
          "[TODO: name, title, and direct contact (email/phone) of the person responsible for privacy inquiries and complaints — required before launch, cannot be filled in without real business information.]",
        ],
      },
      {
        id: "security",
        title: "8. Security Measures",
        paragraphs: [
          "We take administrative, technical, and physical measures to protect personal information from loss, theft, and unauthorized access.",
          "[TODO: list the specific measures actually in place (access controls, encryption, logging, staff training, etc.) once confirmed — do not state specific safeguards here until they are verified true in production.]",
        ],
      },
      {
        id: "california",
        title: "9. California Residents",
        paragraphs: [
          "We do not sell or share your personal information with third parties for cross-context behavioral advertising. California residents have specific rights under the CCPA (and CalOPPA) to request details about the personal data collected, request deletion, and opt-out of potential sales. To exercise these rights, please contact contact@ahaitsme.com.",
        ],
      },
      {
        id: "children",
        title: "10. Children's Privacy",
        paragraphs: [
          "The Service is not intended for children under 13, and we do not knowingly collect personal information from children under 13. If we learn we have collected such info, we will delete it immediately.",
        ],
      },
      {
        id: "retention",
        title: "11. Data Retention & Destruction",
        paragraphs: [
          "We retain your personal data for as long as your account is active. Upon account deletion, your data will be deleted or anonymized without delay, except where longer retention is required for legal, tax, or dispute-resolution purposes under applicable local laws (such as the Korean Act on Consumer Protection in Electronic Commerce).",
          "Destruction method: personal data in electronic file form is deleted using methods that prevent recovery; personal data in paper form is shredded or incinerated.",
          "[TODO: confirm the actual account-deletion and backup-purge timeline (how quickly reports/journal entries and backups are removed after account deletion) against the real implementation.]",
        ],
      },
      {
        id: "contact",
        title: "12. Contact",
        paragraphs: [
          "Company Name: Aha It's me",
          "Address: Hangangro-dong, Yongsan-gu, Seoul, Republic of Korea",
          "Email: contact@ahaitsme.com",
        ],
      },
    ],
  },
  "ko-KR": {
    title: "개인정보졘리방챨",
    description:
      "안하잇저미 (Aha It's me)(이하 \"회사\")는 개인정보보호법 등 대한민국 관련 법령을 준수하며, 이용자의 개인정보를 보호하고 관련 고충을 신속하고 원활하게 처리할 수 있도록 본 개인정보처리방침을 수립·공개합니다.",
    lastUpdated: "2026-09-19",
    sections: [
      {
        id: "collect",
        title: "1. 수집하는 개인정보 항목",
        paragraphs: [
          "회사는 다음과 같은 정보를 수집·처리합니다.",
        ],
        listItems: [
          "회원가입 및 인증 (Clerk 위탁): 이메일 주소, 로그인 기록",
          "서비스 분석 정보: 이름, 생년월일시, 성별",
          "상대방 정보(제3자 정보): 이용자가 관계 분석을 위해 입력하는 상대방의 이름, 생년월일시, 성별 (이용자의 직접 입력 및 제3자 동의 확보 보증에 근거하여 수집됨)",
          "결제 정보 (Paddle 위탁): 실제 카드 정보는 회사 서버에 관장되곀 않으며, Paddle이 결제 이메일, 국가, 거래 번호, 구독 상태 등 제한된 거래 관련 정보만 회사에 공유합니다.",
          "자동 수집 정보: 접속 로그, 쿠키(Google Tag Manager 포함), IP 주소, 기기 정보, 서비스 이용기록. 브라우저 설정에서 쿠키 저장을 거부하실 수 있으며, 이 경우 일부 서비스 이용에 제한이 있을 수 있습니다.",
        ],
      },
      {
        id: "use",
        title: "2. 개인정보의 처리 목적",
        paragraphs: [
          "회사는 수집한 개인정보를 다음의 목적으로만 처리하며, 목적이 변경될 경우 사전에 동의를 구합니다.",
        ],
        listItems: [
          "사주·행동심리·점성학 기반 분석 및 AI 보고서 생성",
          "관계 분석 및 공유 기능 제공",
          "Paddle을 통한 결제 처리 및 구독 관리",
          "계정, 업데이트, 고객 지원 관련 안내",
          "서비스 개선, 보안 강화 및 최적화",
        ],
      },
      {
        id: "ai",
        title: "3. 생성형 AI 처리 안내",
        paragraphs: [
          "회사는 핵심 서비스 제공을 위해 OpenAI가 제공하는 제3자 AI 모델을 사용합니다.",
          "전송되는 정보: 이용자가 입력한 생년월일시, 이름 등(상대방 정보 포함)이 맞춤 분석 보고서 생성을 위해 OpenAI로 전송될 수 있습니다.",
          "데이터 보호: 해당 데이터는 보안 API 연결을 통해 전송되며, OpenAI와의 계약에 따라 제출된 데이터는 보고서 생성 목적으로만 사용되고 OpenAI의 공개 AI 모델 학습에는 사용되지 않습니다.",
        ],
      },
      {
        id: "processors",
        title: "4. 개인정보 처리위탁",
        paragraphs: [
          "회사는 서비스 제공을 위해 아래 업체에 개인정보 처리업무를 위탁하고 있으며, 수탁업체는 회사의 지시 범위 내에서만, 아래 목적으로만 개인정보를 처리합니다.",
        ],
        listItems: [
          "Vercel (미국 / 글로벌) — 애플리케이션 호스팅 및 배포",
          "Supabase (미국 / 글로벌) — 데이터베이스 호스팅 및 관리",
          "Clerk (미국 / 글로벌) — 사용자 인증 및 계정 관리",
          "Paddle (영국 / 미국 / 글로벌) — 결제 처리 및 가맹점 서비스",
          "OpenAI (미국) — AI 기반 분석 보고서 생성",
          "Google Tag Manager (미국 / 글로벌) — 웹사이트 분석·마케팅 태그 로딩",
        ],
      },
      {
        id: "thirdPartyAndTransfer",
        title: "5. 제3자 제공 및 국외이전",
        paragraphs: [
          "회사는 이용자의 개인정보를 제3자의 독자적인 목적을 위해 제공하거나 판매하지 않습니다. 향후 제3자 제공이 발생할 경우 관련 법령에 따라 사전에 고지하고 별도의 동의를 받습니다.",
          "다만 위 4항의 수탁업체가 국외에 소재하므로, 해당 업체의 서비스를 이용하는 과정에서 개인정보의 국외이전이 발생합니다. GDPR 등 관련 법령상 요구되는 경우, 이러한 국외 이전은 표준계약조항(SCC) 및 적절한 기술적 보호조치에 근거하여 이루어집니다.",
          "[TODO: 개인정보보호법 제28조의8에 따라 업체별 이전 항목, 이전 일시·방법, 거부 방법 등을 확정하여 반영 필요 — 현재는 국외이전 발생 사실만 고지된 상태.]",
        ],
      },
      {
        id: "rights",
        title: "6. 정보주체의 권리",
        paragraphs: [
          "이용자는 거주 지역과 관계없이 언제든지 자신의 개인정보에 대한 열람, 정정, 삭제, 처리정지를 요청할 수 있습니다. contact@ahaitsme.com으로 문의해 주시면 지체 없이 처리해 드립니다.",
        ],
      },
      {
        id: "officer",
        title: "7. 개인정보 보호책임자",
        paragraphs: [
          "[TODO: 개인정보 보호책임자의 성명, 직책, 연락처(이메일/전화)를 기재해야 합니다. 실제 담당자 정보가 확정되기 전까지는 임의로 채울 수 없는 항목입니다 — 출시 전 P0.]",
        ],
      },
      {
        id: "security",
        title: "8. 안전성 확보조치",
        paragraphs: [
          "회사는 개인정보의 분실·도난·유출·위조·변조 또는 훼손을 방지하기 위해 관리적·기술적·물리적 조치를 취합니다.",
          "[TODO: 실제로 적용 중인 접근통제, 암호화, 접속기록 보관, 직원 교육 등 구체적 조치를 확인 후 기재. 확인되지 않은 조치를 기재하면 허위 고지가 될 수 있으므로, 보안 점검이 완료되기 전에는 구체적 조치를 명시하지 않습니다.]",
        ],
      },
      {
        id: "california",
        title: "9. 캘리포니아 거주자",
        paragraphs: [
          "회사는 이용자의 개인정보를 제3자에게 판매하거나 교차 맥락 행동 광고 목적으로 공유하지 않습니다. 캘리포니아 거주자는 CCPA(및 CalOPPA)에 따라 수집된 개인정보 세부 내역 확인, 삭제 요청, 판매 거부(opt-out) 등을 요청하실 수 있습니다. contact@ahaitsme.com 으로 문의해 주세요.",
        ],
      },
      {
        id: "children",
        title: "10. 아동의 개인정보 보호",
        paragraphs: [
          "본 서비스는 만 14세 미만 아동을 대상으로 하지 않으며, 회사는 만 14세 미만 아동의 개인정보를 고의로 수집하지 않습니다. 이러한 정보가 수집된 사실을 인지한 경우 즉시 삭제합니다.",
        ],
      },
      {
        id: "retention",
        title: "11. 개인정보의 보유 및 파기",
        paragraphs: [
          "회사는 계정이 활성 상태인 동안 개인정보를 보유합니다. 회원 탈퇴 시 개인정보는 지체 없이 삭제 또는 익명 처리되며, 다만 전자상거래 등에서의 소비자보호에 관한 법률 등 관련 법령에 따라 보존 의무가 있는 경우 아래 기간 동안 분리하여 보관합니다.",
          "파기 방법: 전자적 파일 형태의 개인정보는 복구가 불가능한 방법으로 영구 삭제하며, 종이 문서에 기록·저장된 개인정보는 분쇄하거나 소각합니다.",
          "[TODO: 회원 탈퇴 시 보고서/결정일기 삭제 시점과 백업 삭제 주기를 실제 구현 기준으로 확정하여 반영 필요.]",
        ],
        listItems: [
          "계약 또는 청약철회 등에 관한 기록: 5년",
          "대금결제 및 재화 등의 공급에 관한 기록: 5년",
          "소비자 불만 또는 분쟁처리에 관한 기록: 3년",
        ],
      },
      {
        id: "contact",
        title: "12. 문의처",
        paragraphs: [
          "상호명: 아하잇츠미 (Aha It's me)",
          "소재지: 서울 강남구 언주로 134길 18, 신승빌딩 5층",
          "이메일: contact@ahaitsme.com",
        ],
      },
    ],
  },
};
