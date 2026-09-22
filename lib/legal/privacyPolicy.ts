import type { PolicyDocument } from "@/lib/legal/types";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Privacy Policy — en-US and ko-KR, both written directly against verified
 * production facts (2026-09-22 audit) rather than from a template. No
 * section below states anything the codebase, our own account
 * configuration, or the named vendor's own official policy doesn't
 * actually support. Where a fact could only be confirmed at the "yes,
 * this vendor is used, for this purpose" level (not an exact retention
 * number the vendor itself doesn't publish per-customer), the language
 * below says so in a general, legally accurate way rather than inventing
 * a specific figure.
 *
 * Confirmed production facts this document is built on (2026-09-22):
 * - Hosting: Vercel, Hobby plan, serverless function region `sfo1`
 *   (San Francisco, USA). No other region is configured.
 * - Database: Supabase, production project region `us-west-1` (Oregon,
 *   USA). Paddle-tier backup retention (7/14/30 days depending on plan)
 *   is Supabase's own policy; our current plan tier is pending
 *   confirmation, so this document does not name a specific day count.
 * - Auth: Clerk. Clerk's own privacy policy states it provides no
 *   selectable regional data residency -- data is processed/hosted on US
 *   infrastructure.
 * - Payments: Paddle acts as Merchant of Record (Paddle's own privacy
 *   policy) for every purchase, both US and KR catalogs, currently in
 *   Paddle Sandbox test mode. Paddle collects payment/checkout data (email,
 *   card details) directly from the buyer -- our own Paddle.Checkout.open()
 *   calls (lib/payment/useRegionalCheckout.ts, useBetaCheckout.ts) never
 *   pass a `customer` object or email, only an internal user id and plan
 *   id, and no card/payment field exists anywhere in our own database.
 * - AI: OpenAI API only (never the ChatGPT consumer product). Verified via
 *   grep that OPENAI_API_KEY is referenced only in server-side route
 *   handlers/lib modules, never in a "use client" file, and that no email
 *   or payment field is ever included in a prompt sent to it. Per OpenAI's
 *   API platform data usage policy, API data is not used to train models
 *   by default and may be retained up to 30 days for abuse monitoring.
 * - Analytics: Google Tag Manager (GTM-M8ZQ6BJD, app/layout.tsx), loaded
 *   on every page. Confirmed with the account owner: the container
 *   currently holds GA4 only -- no Google Ads, no remarketing/audience
 *   tag, no Meta Pixel, and therefore no tag whose purpose is
 *   cross-context behavioral advertising as of this writing.
 *   INTERNAL COMPLIANCE NOTE: if Meta Pixel, Google Ads remarketing, or
 *   any other advertising/audience-sharing tag is EVER added to this GTM
 *   container in the future, this Privacy Policy's Sections 3, 5, 6 and
 *   10, the Do Not Sell or Share page (lib/i18n/messages/*.ts
 *   `doNotSellPage`), and the cookie banner's actual opt-out behavior
 *   (components/legal/CookieBanner.tsx currently only records a
 *   localStorage preference -- it does not gate GTM from loading) all need
 *   to be revisited together, in that order, before the new tag goes live.
 *   Do not add such a tag without updating this document first.
 * - Decision Journal (lib/decision/session.ts -> lib/v2/storage/
 *   localPersist.ts) is stored ONLY in the browser's localStorage. No API
 *   route or database table ever receives it. It is never sent to OpenAI
 *   or anywhere else.
 * - Account deletion (app/api/account/delete/route.ts): deleting the
 *   `reports` row cascades (all `on delete cascade` to reports.id) to
 *   survey_responses, report_analyses, relationship_reports, and
 *   person_core_blueprints. A second step (cleanup_account_entitlement_data,
 *   supabase/migrations/20260922070000_account_deletion_entitlement_cleanup.sql)
 *   deletes entitlement/credit/membership state and anonymizes (never
 *   deletes) the minimal purchase-grant transaction record kept for
 *   accounting/e-commerce recordkeeping. Neither step can guarantee
 *   instantaneous removal from Supabase's own periodic backups.
 * - Business address: unified to the one address already used in
 *   Terms of Service and the ko-KR footer -- "5F, 18 Eonju-ro 134-gil,
 *   Gangnam-gu, Seoul, Republic of Korea" -- as the single source of
 *   truth everywhere it appears.
 *
 * Open items this document does NOT resolve (see the accompanying audit
 * report for the full list): exact Vercel/Supabase account region is
 * confirmed but the Supabase plan tier is not; whether GTM's currently
 * GA4-only configuration remains that way is something only the account
 * owner can attest to going forward, not something code can verify by
 * itself.
 */
export const privacyPolicy: Record<Locale, PolicyDocument> = {
  "en-US": {
    title: "Privacy Policy",
    description:
      'Aha It\'s me ("we," "us," or "the Company") provides behavioral-psychology and Saju-based self-insight analyses, and processes personal data in accordance with applicable law, including the Korean Personal Information Protection Act (PIPA), the EU General Data Protection Regulation (GDPR) where applicable, and the California Consumer Privacy Act (CCPA).',
    lastUpdated: "2026-09-22",
    sections: [
      {
        id: "collect",
        title: "1. Information We Collect",
        paragraphs: [
          "We collect and process the following categories of information:",
        ],
        listItems: [
          "Account & Authentication Information (processed via Clerk): email address, and sign-in/session activity.",
          "Personal & Relationship Service Input: your name, date of birth, time of birth, and gender, where you provide them, used to generate your Personal and Relationship analyses.",
          "Behavioral Psychology Questionnaire Responses: your answers to our behavioral survey, used alongside your birth information to generate your analysis.",
          "Third-Party Data (Relationship Analysis): information you submit about another person -- such as their name, date of birth, time of birth, or gender -- in order to generate a Relationship analysis involving them. See Section 2 below for the responsibility this places on you.",
          "Payment & Transaction Information: we do not collect or store your full card number or other payment credentials. Our payment processor, Paddle, collects your payment details directly and shares limited transaction data back with us -- a transaction identifier, the product purchased, the price/currency, and transaction status.",
          "Automatically Collected Technical & Usage Information: IP address, browser/device information, and usage/analytics events, collected via cookies and Google Tag Manager (currently configured for GA4 analytics only -- see Section 6).",
          "Decision Journal entries are currently stored locally on your device and are not transmitted to our servers unless a future feature explicitly informs you otherwise.",
        ],
      },
      {
        id: "thirdPartyData",
        title: "2. Third-Party Data You Submit",
        paragraphs: [
          "If you submit another person's information to generate a Relationship analysis, you confirm that you have the appropriate authority or basis to provide that information -- for example, their consent, or another lawful basis recognized where you or they are located. Do not submit another person's sensitive or special-category information without their knowledge and agreement.",
        ],
      },
      {
        id: "use",
        title: "3. How We Use Your Information",
        paragraphs: [
          "We use the information described in Section 1 for the following purposes:",
        ],
        listItems: [
          "To generate your Personal analysis, Relationship analysis, and to support the Decision Journal feature (which, as noted above, is stored on your device, not ours).",
          "To combine your behavioral psychology questionnaire responses with Saju-derived contextual signals from your birth information, producing an AI-assisted, self-insight report -- not a fortune-telling or future-prediction service, and not a substitute for professional advice (see Section 4).",
          "To process payments and manage your purchases via Paddle.",
          "To communicate with you about your account, service updates, or customer support requests.",
          "To maintain the security of the Service and to improve it over time.",
        ],
      },
      {
        id: "ai",
        title: "4. AI Processing Disclosure",
        paragraphs: [
          "We use OpenAI's API to help generate part of your analysis. Only the information needed for that purpose is sent: your birth-date/time-derived signals and your behavioral questionnaire responses, and in some cases a name for personalizing the report's tone. We never send your account email address or any payment/billing information to OpenAI.",
          "Per OpenAI's published API platform data usage policy, data submitted through the API is not used to train OpenAI's models by default, and OpenAI may retain it for up to 30 days to provide the service and to monitor for misuse. We have not entered into any separate agreement with OpenAI that changes these terms.",
          "Your analysis is an AI-assisted, self-insight tool intended for personal reflection and entertainment. It is not medical, legal, financial, or psychological professional advice, and should not be relied on as a substitute for consulting a qualified professional.",
        ],
      },
      {
        id: "processors",
        title: "5. Service Providers & Sub-Processors",
        paragraphs: [
          "To operate the Service, the following vendors process personal data on our behalf, only for the purposes below:",
        ],
        listItems: [
          "Vercel Inc. (United States) -- application hosting and content delivery. Our production functions currently run in Vercel's sfo1 (San Francisco) region.",
          "Supabase (United States) -- database hosting and storage. Our production database is hosted in Supabase's us-west-1 (Oregon) region.",
          "Clerk (United States) -- authentication and account/identity management. Clerk provides no selectable regional data residency; account data is processed and hosted on Clerk's US infrastructure.",
          "Paddle.com Market Ltd (\"Paddle\") (United Kingdom / United States) -- Paddle acts as the Merchant of Record for every purchase and handles payment processing directly; we never receive your full card details.",
          "OpenAI, L.L.C. (United States) -- AI-assisted analysis generation, as described in Section 4.",
          "Google LLC, via Google Tag Manager (United States) -- currently configured to load Google Analytics 4 only, for website usage analytics. No advertising or remarketing tag is configured as of this writing.",
        ],
      },
      {
        id: "transfers",
        title: "6. International Transfers",
        paragraphs: [
          "We are located in the Republic of Korea. Because the service providers listed in Section 5 are located outside Korea, using their services necessarily involves transferring your personal data internationally. The table below sets out, for each recipient and to the extent we can confirm from our own production configuration and each vendor's own published policy, the country/region of processing, the data transferred, the purpose, the timing/method, retention, and where to find that vendor's own contact/privacy information. Where a vendor does not publish an exact retention period applicable to our account, we say so rather than stating a specific figure we cannot verify.",
        ],
        listItems: [
          "Vercel Inc. | United States (production functions run in the sfo1 / San Francisco region) | IP address, request/browser metadata | Application hosting and content delivery | Continuous and automated, with each request to our Service | Governed by Vercel's own data retention policy | See Vercel's published privacy policy for contact details.",
          "Supabase | United States (production database region: us-west-1 / Oregon) | Account identifiers, service input, questionnaire responses, relationship analysis data, transaction identifiers | Database hosting and storage | Continuous and automated | Retained while your account is active; our current Supabase plan tier (which determines backup retention length) is still being confirmed internally | See Supabase's published privacy policy for contact details.",
          "Clerk | United States (Clerk offers no selectable regional data residency) | Email address, authentication and session data | Authentication and account management | Continuous and automated | Governed by Clerk's own data retention policy | See Clerk's published privacy policy for contact details.",
          "Paddle.com Market Ltd | United Kingdom / United States (Paddle acts as Merchant of Record) | Email address, payment/cardholder details, transaction history | Payment processing; Paddle is the seller of record for your purchase | At checkout, directly between you and Paddle | Governed by Paddle's own data retention policy | See Paddle's published privacy policy for contact details.",
          "OpenAI, L.L.C. | United States | Birth-derived analysis signals, questionnaire responses, and (where applicable) a name for personalization -- never your account email or payment data | AI-assisted report generation | At the time each report is generated, via API | Not used to train OpenAI's models by default; retained by OpenAI for up to 30 days for service delivery and abuse monitoring | See OpenAI's published API/privacy policy for contact details.",
          "Google LLC (Google Tag Manager / Google Analytics 4) | United States | IP address, device/browser information, usage/analytics events | Website usage analytics only -- no advertising or remarketing tag is currently configured | Continuous and automated, via tags loaded on each page | Governed by Google's own data retention policy | See Google's published privacy policy for contact details.",
        ],
      },
      {
        id: "rights",
        title: "7. Your Privacy Rights",
        paragraphs: [
          "Regardless of where you are located, you may request access to, correction of, deletion of, or a restriction on the processing of your personal information, at any time, by contacting us at contact@ahaitsme.com. We will respond without undue delay.",
        ],
      },
      {
        id: "officer",
        title: "8. Privacy Officer",
        paragraphs: [
          "Name: Sunghyun Hong",
          "Email: contact@ahaitsme.com",
          "Phone: +1 626-381-8420",
        ],
      },
      {
        id: "security",
        title: "9. Security Measures",
        paragraphs: [
          "We take the following measures to protect your personal information, each of which is actually implemented in our production Service today:",
        ],
        listItems: [
          "All traffic to our Service is encrypted in transit over HTTPS.",
          "Our database uses row-level security, with direct data access restricted to service-role, server-side API calls only -- never exposed to the browser.",
          "API credentials for our AI and payment providers (OpenAI, Paddle) are used exclusively in server-side code and are never present in code that runs in your browser.",
          "We do not collect or store your full payment card details on our own servers; that information is handled directly by Paddle, our payment processor.",
          "Our server-side logging is designed to redact personal information -- including names, birth details, questionnaire answers, and free-text analysis content -- and to mask account and record identifiers, before anything is written to a log.",
        ],
      },
      {
        id: "california",
        title: "10. California Privacy Rights",
        paragraphs: [
          "Aha It's me does not currently sell your personal information for monetary consideration or knowingly share your personal information with third parties for cross-context behavioral advertising. If our practices change in a way that creates an applicable right to opt out under the California Consumer Privacy Act (CCPA), we will update this Policy and our Do Not Sell or Share My Personal Information page and provide the required opt-out mechanism.",
          "California residents have the right, under the CCPA and CalOPPA, to request details about the personal information we have collected about them, to request deletion of that information, and to exercise the rights described in Section 7. To exercise these rights, contact us at contact@ahaitsme.com.",
        ],
      },
      {
        id: "children",
        title: "11. Children's Privacy",
        paragraphs: [
          "The Service is not directed to children under 13, and we do not knowingly collect personal information from children under 13. If we become aware that we have done so, we will delete that information promptly.",
        ],
      },
      {
        id: "retention",
        title: "12. Data Retention & Account Deletion",
        paragraphs: [
          "We retain your personal data for as long as your account is active.",
          "When you delete your account: your reports and everything generated from them -- including your behavioral questionnaire responses, generated analyses, and relationship reports -- are deleted from our active database immediately, through automatic cascading deletion. Your active credit balances, entitlement/membership state, and gift coupons are also deleted from our active systems at that time.",
          "A minimal transaction record (your payment processor's transaction identifier, the product purchased, and the transaction date/status) is retained afterward, as required for accounting and legal recordkeeping under applicable law (such as Korea's Act on Consumer Protection in Electronic Commerce), but it is no longer linked to your account identifier.",
          "Decision Journal entries are never transmitted to our servers in the first place (see Section 1), so account deletion has nothing to remove on our end for that feature -- any entries remain only on the device where you last used them, until you clear them yourself.",
          "We also maintain periodic backups of our database for disaster-recovery purposes. Deleting your account removes your data from our active, in-use systems, but we cannot guarantee that a copy will be instantly removed from those backups as well; backup copies are retired on our backup provider's own schedule.",
          "Destruction method: personal data in electronic file form is deleted using methods that prevent recovery; personal data in paper form, if any, is shredded or incinerated.",
        ],
      },
      {
        id: "changes",
        title: "13. Policy Changes",
        paragraphs: [
          "We may update this Privacy Policy from time to time. If we make material changes, we will update the \"last updated\" date above and, where required by law, provide additional notice.",
        ],
      },
      {
        id: "contact",
        title: "14. Contact",
        paragraphs: [
          "Company Name: Aha It's me",
          "Address: 5F, 18 Eonju-ro 134-gil, Gangnam-gu, Seoul, Republic of Korea",
          "Email: contact@ahaitsme.com",
        ],
      },
    ],
  },
  "ko-KR": {
    title: "개인정보처리방침",
    description:
      "아하잇츠미(Aha It's me)(이하 \"회사\")는 행동심리 및 사주 기반 자기이해 분석 서비스를 제공하며, 개인정보보호법 등 대한민국 관련 법령, 그리고 해당되는 경우 EU GDPR, 미국 CCPA를 준수하여 개인정보를 처리합니다.",
    lastUpdated: "2026-09-22",
    sections: [
      {
        id: "collect",
        title: "1. 수집하는 개인정보 항목",
        paragraphs: [
          "회사는 다음과 같은 정보를 수집·처리합니다.",
        ],
        listItems: [
          "계정 및 인증 정보(Clerk 위탁 처리): 이메일 주소, 로그인·세션 활동 기록",
          "Personal/Relationship 서비스 입력 정보: 분석 생성을 위해 입력하시는 이름, 생년월일, 태어난 시간, 성별",
          "행동심리 설문 응답: 생년월일시 정보와 함께 분석 생성에 사용되는 행동심리 설문 응답",
          "제3자 정보(관계 분석용): 관계 분석을 위해 이용자가 입력하는 상대방의 이름, 생년월일, 태어난 시간, 성별 등의 정보. 이에 관한 이용자의 책임은 아래 2항을 참고해 주세요.",
          "결제 및 거래 정보: 회사는 카드번호 등 결제수단 정보 전체를 직접 수집·보관하지 않습니다. 결제대행사인 Paddle이 결제 정보를 직접 수집하며, 거래번호, 구매 상품, 가격·통화, 거래 상태 등 제한된 거래 관련 정보만 회사와 공유합니다.",
          "자동 수집되는 기술적·이용 정보: IP 주소, 브라우저·기기 정보, 그리고 쿠키 및 Google Tag Manager를 통해 수집되는 이용·분석 이벤트(현재 GA4 분석 용도로만 구성되어 있으며, 자세한 내용은 6항 참고).",
          "디시전 저널(Decision Journal) 항목은 현재 이용자의 기기에만 로컬로 저장되며, 향후 별도 기능을 통해 명시적으로 안내하지 않는 한 당사 서버로 전송되지 않습니다.",
        ],
      },
      {
        id: "thirdPartyData",
        title: "2. 이용자가 제공하는 제3자 정보",
        paragraphs: [
          "관계 분석을 위해 상대방의 정보를 입력하시는 경우, 이용자는 해당 정보를 제공할 적절한 권한 또는 근거(예: 상대방의 동의, 또는 이용자·상대방이 위치한 지역에서 인정되는 다른 적법한 근거)를 갖추고 있음을 확인하는 것으로 간주됩니다. 상대방의 민감정보를 본인 동의 없이 입력하지 말아 주세요.",
        ],
      },
      {
        id: "use",
        title: "3. 개인정보의 처리 목적",
        paragraphs: [
          "회사는 1항에서 수집한 정보를 다음의 목적으로 처리합니다.",
        ],
        listItems: [
          "Personal 분석, Relationship 분석 생성 및 디시전 저널 기능 지원(단, 디시전 저널은 위에서 설명한 바와 같이 회사 서버가 아닌 이용자의 기기에 저장됩니다.)",
          "행동심리 설문 응답과 생년월일시 기반 사주적 맥락 신호를 결합하여 AI 기반 자기이해 리포트를 생성 — 이는 미래예측이나 운세 서비스가 아니며, 전문가 조언을 대체하지 않습니다(4항 참고).",
          "Paddle을 통한 결제 처리 및 구매 관리",
          "계정, 서비스 업데이트, 고객 지원 관련 안내",
          "서비스의 보안 유지 및 지속적인 개선",
        ],
      },
      {
        id: "ai",
        title: "4. 생성형 AI 처리 안내",
        paragraphs: [
          "회사는 분석 결과의 일부를 생성하기 위해 OpenAI의 API를 사용합니다. 이 목적에 필요한 정보만 전송되며, 구체적으로는 생년월일시로부터 산출된 분석 신호와 행동심리 설문 응답이며, 리포트 어조의 개인화를 위해 이름이 함께 전송되는 경우도 있습니다. 이용자의 계정 이메일 주소나 결제 정보는 OpenAI로 전송되지 않습니다.",
          "OpenAI가 공개한 API 데이터 이용 정책에 따르면, API를 통해 제출된 데이터는 기본적으로 OpenAI 모델 학습에 사용되지 않으며, 서비스 제공 및 오남용 모니터링 목적으로 최대 30일간 보관될 수 있습니다. 회사는 이와 다른 내용의 별도 계약을 OpenAI와 체결하고 있지 않습니다.",
          "이용자의 분석 결과는 자기이해를 돕기 위한 AI 기반 참고 자료로, 개인적 성찰과 재미를 위한 것입니다. 의료·법률·재무·심리 전문가의 조언을 대체하지 않으며, 전문가 상담을 대신하는 용도로 사용되어서는 안 됩니다.",
        ],
      },
      {
        id: "processors",
        title: "5. 개인정보 처리위탁 및 수탁업체",
        paragraphs: [
          "회사는 서비스 운영을 위해 아래 업체에 개인정보 처리업무를 위탁하며, 각 업체는 아래 목적 범위 내에서만 개인정보를 처리합니다.",
        ],
        listItems: [
          "Vercel Inc.(미국) — 애플리케이션 호스팅 및 콘텐츠 전송. 현재 프로덕션 함수는 Vercel의 sfo1(샌프란시스코) 리전에서 실행됩니다.",
          "Supabase(미국) — 데이터베이스 호스팅 및 저장. 현재 프로덕션 데이터베이스는 Supabase의 us-west-1(오리건) 리전에 위치합니다.",
          "Clerk(미국) — 인증 및 계정 관리. Clerk는 별도의 리전 선택(data residency) 옵션을 제공하지 않으며, 계정 정보는 Clerk의 미국 인프라에서 처리·저장됩니다.",
          "Paddle.com Market Ltd(\"Paddle\")(영국/미국) — Paddle은 모든 구매 건에 대해 Merchant of Record(가맹점, 판매자)로서 결제를 직접 처리하며, 회사는 이용자의 전체 카드 정보를 전달받지 않습니다.",
          "OpenAI, L.L.C.(미국) — AI 기반 분석 생성(4항 참고).",
          "Google LLC, Google Tag Manager를 통해(미국) — 현재 웹사이트 이용 분석을 위한 Google Analytics 4만 구성되어 있으며, 이 문서 작성 시점 기준 광고·리마케팅 목적의 태그는 구성되어 있지 않습니다.",
        ],
      },
      {
        id: "transfers",
        title: "6. 국외이전",
        paragraphs: [
          "회사는 대한민국에 소재합니다. 5항에 기재된 수탁업체가 국외에 소재함에 따라, 해당 업체의 서비스를 이용하는 과정에서 개인정보의 국외이전이 발생합니다. 아래 표는 회사의 실제 프로덕션 설정 및 각 업체가 공식적으로 공개한 정책을 기준으로, 확인 가능한 범위 내에서 이전받는 자, 처리 국가/지역, 이전되는 항목, 이전 목적, 이전 일시·방법, 보유기간, 문의처(해당 업체의 공식 개인정보처리방침 참고 안내)를 정리한 것입니다. 업체가 당사 계정에 적용되는 정확한 보유기간을 공개하지 않는 경우, 확인되지 않은 특정 수치를 임의로 기재하지 않고 그 사실을 그대로 밝힙니다.",
        ],
        listItems: [
          "Vercel Inc. | 미국(프로덕션 함수는 sfo1/샌프란시스코 리전에서 실행) | IP 주소, 요청·브라우저 메타데이터 | 애플리케이션 호스팅 및 콘텐츠 전송 | 서비스 이용 시마다 자동·지속적으로 발생 | Vercel 자체 보유기간 정책에 따름 | 문의처는 Vercel의 공식 개인정보처리방침 참고",
          "Supabase | 미국(프로덕션 데이터베이스 리전: us-west-1/오리건) | 계정 식별자, 서비스 입력 정보, 설문 응답, 관계 분석 데이터, 거래 식별자 | 데이터베이스 호스팅 및 저장 | 자동·지속적으로 발생 | 계정이 활성 상태인 동안 보유되며, 백업 보유기간을 좌우하는 현재 Supabase 요금제는 사내에서 확인 중 | 문의처는 Supabase의 공식 개인정보처리방침 참고",
          "Clerk | 미국(Clerk는 리전 선택 옵션을 제공하지 않음) | 이메일 주소, 인증·세션 정보 | 인증 및 계정 관리 | 자동·지속적으로 발생 | Clerk 자체 보유기간 정책에 따름 | 문의처는 Clerk의 공식 개인정보처리방침 참고",
          "Paddle.com Market Ltd | 영국/미국(Paddle이 Merchant of Record로서 처리) | 이메일 주소, 결제·카드 정보, 거래 내역 | 결제 처리 — Paddle이 이용자 구매의 판매자(Merchant of Record) | 결제 시점에 이용자와 Paddle 간 직접 처리 | Paddle 자체 보유기간 정책에 따름 | 문의처는 Paddle의 공식 개인정보처리방침 참고",
          "OpenAI, L.L.C. | 미국 | 생년월일시 기반 분석 신호, 설문 응답, (해당 시) 개인화를 위한 이름 — 계정 이메일이나 결제 정보는 전송되지 않음 | AI 기반 리포트 생성 | 각 리포트 생성 시점에 API를 통해 발생 | 기본적으로 OpenAI 모델 학습에 사용되지 않으며, 서비스 제공·오남용 모니터링 목적으로 최대 30일간 보관 | 문의처는 OpenAI의 공식 개인정보처리방침 참고",
          "Google LLC(Google Tag Manager / Google Analytics 4) | 미국 | IP 주소, 기기·브라우저 정보, 이용·분석 이벤트 | 웹사이트 이용 분석 목적만 해당 — 이 문서 작성 시점 기준 광고·리마케팅 태그는 구성되어 있지 않음 | 페이지 로드 시마다 태그를 통해 자동·지속적으로 발생 | Google 자체 보유기간 정책에 따름 | 문의처는 Google의 공식 개인정보처리방침 참고",
        ],
      },
      {
        id: "rights",
        title: "7. 정보주체의 권리",
        paragraphs: [
          "이용자는 거주 지역과 관계없이 언제든지 자신의 개인정보에 대한 열람, 정정, 삭제, 처리정지를 요청할 수 있습니다. contact@ahaitsme.com으로 문의해 주시면 지체 없이 처리해 드립니다.",
        ],
      },
      {
        id: "officer",
        title: "8. 개인정보 보호책임자",
        paragraphs: [
          "성명: 홍성현 (Sunghyun Hong)",
          "이메일: contact@ahaitsme.com",
          "전화: +1 626-381-8420",
        ],
      },
      {
        id: "security",
        title: "9. 안전성 확보조치",
        paragraphs: [
          "회사는 아래와 같이, 현재 프로덕션 서비스에 실제로 적용되어 있는 조치를 통해 개인정보를 보호하고 있습니다.",
        ],
        listItems: [
          "서비스에 대한 모든 통신은 HTTPS를 통해 암호화되어 전송됩니다.",
          "데이터베이스는 행 단위 보안(Row-Level Security)이 적용되어 있으며, 데이터 접근은 서버 측 API를 통한 service-role 접근으로 제한되고 브라우저에는 노출되지 않습니다.",
          "AI·결제 제공업체(OpenAI, Paddle)의 API 인증정보는 서버 측 코드에서만 사용되며, 브라우저에서 실행되는 코드에는 포함되지 않습니다.",
          "회사는 이용자의 전체 결제카드 정보를 자체 서버에 수집·보관하지 않으며, 해당 정보는 결제대행사인 Paddle이 직접 처리합니다.",
          "서버 측 로그 시스템은 이름, 생년월일시, 설문 응답, 자유 서술형 분석 내용 등 개인정보를 자동으로 가리고(redact) 계정·기록 식별자를 마스킹한 뒤 기록하도록 설계되어 있습니다.",
        ],
      },
      {
        id: "california",
        title: "10. 캘리포니아 거주자의 개인정보 권리",
        paragraphs: [
          "Aha It's me는 현재 금전적 대가를 받고 이용자의 개인정보를 판매하지 않으며, 교차 맥락 행동 광고 목적으로 제3자와 개인정보를 공유하지도 않습니다. 향후 캘리포니아 소비자 개인정보 보호법(CCPA)상 옵트아웃 권리가 적용되는 방식으로 회사의 관행이 변경될 경우, 본 방침 및 개인정보 판매·공유 거부 페이지를 업데이트하고 필요한 옵트아웃 수단을 제공하겠습니다.",
          "캘리포니아 거주자는 CCPA 및 CalOPPA에 따라 수집된 개인정보의 세부 내역 확인, 삭제 요청, 그리고 7항에 기재된 권리를 행사할 수 있습니다. 이를 위해 contact@ahaitsme.com으로 문의해 주세요.",
        ],
      },
      {
        id: "children",
        title: "11. 아동의 개인정보 보호",
        paragraphs: [
          "본 서비스는 만 14세 미만 아동을 대상으로 하지 않으며, 회사는 만 14세 미만 아동의 개인정보를 고의로 수집하지 않습니다. 그러한 정보가 수집된 사실을 인지한 경우 즉시 삭제합니다.",
        ],
      },
      {
        id: "retention",
        title: "12. 개인정보의 보유 및 계정 삭제",
        paragraphs: [
          "회사는 계정이 활성 상태인 동안 개인정보를 보유합니다.",
          "이용자가 계정을 삭제하면: 보고서 및 이로부터 생성된 모든 데이터 — 행동심리 설문 응답, 생성된 분석 결과, 관계 분석 리포트를 포함 — 는 자동 연쇄 삭제(cascading deletion)를 통해 활성 데이터베이스에서 즉시 삭제됩니다. 이용자의 활성 크레딧 잔액, 멤버십·이용권 상태, 기프트 쿠폰 역시 이 시점에 활성 시스템에서 함께 삭제됩니다.",
          "다만 전자상거래 등에서의 소비자보호에 관한 법률 등 관련 법령에 따라 회계·법적 기록 보관이 필요한 최소한의 거래 기록(결제대행사의 거래번호, 구매한 상품, 거래 일자·상태)은 계정 삭제 이후에도 별도로 보관되며, 이 경우 더 이상 이용자의 계정 식별자와 연결되지 않도록 처리합니다.",
          "디시전 저널 항목은 애초에 회사 서버로 전송되지 않으므로(1항 참고), 계정을 삭제하더라도 해당 기능과 관련하여 회사 측에서 삭제할 데이터가 존재하지 않습니다 — 항목은 이용자가 마지막으로 사용한 기기에만 남아 있으며, 이용자가 직접 삭제하기 전까지 그대로 유지됩니다.",
          "회사는 재해 복구 목적으로 데이터베이스의 주기적인 백업을 보관합니다. 계정을 삭제하면 활성 시스템에서는 데이터가 제거되지만, 백업본에서도 즉시 제거된다고 보장할 수는 없으며, 백업본은 백업 제공업체(Supabase) 자체의 주기에 따라 폐기됩니다.",
          "파기 방법: 전자적 파일 형태의 개인정보는 복구가 불가능한 방법으로 영구 삭제하며, 종이 문서 형태로 기록·보관된 개인정보(있는 경우)는 분쇄하거나 소각합니다.",
        ],
      },
      {
        id: "changes",
        title: "13. 방침의 변경",
        paragraphs: [
          "본 개인정보처리방침은 수시로 개정될 수 있습니다. 중요한 변경이 있는 경우 위의 \"최종 업데이트\" 일자를 갱신하고, 법령상 요구되는 경우 별도의 방법으로 추가 고지합니다.",
        ],
      },
      {
        id: "contact",
        title: "14. 문의처",
        paragraphs: [
          "상호명: 아하잇츠미 (Aha It's me)",
          "소재지: 서울 강남구 언주로 134길 18, 신승빌딩 5층",
          "이메일: contact@ahaitsme.com",
        ],
      },
    ],
  },
};
