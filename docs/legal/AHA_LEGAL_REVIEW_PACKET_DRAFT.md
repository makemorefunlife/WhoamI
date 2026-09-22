# Legal Review Packet: Aha! it's me (Beta / Launch Preparation)

> **Document Type:** Read-Only Product & Codebase Legal Audit  
> **Prepared for:** Legal Counsel (South Korea & United States - Federal / California)  
> **Target Product:** *Aha! it's me* (Web Platform - Next.js App Router / Supabase / Clerk / OpenAI / Paddle)  
> **Repository:** `makemorefunlife/WhoamI` (`C:\dev\WhoamI`)  
> **Notice:** This document is a technical and operational audit of the existing codebase and production infrastructure. It does not constitute legal advice or formal legal conclusions.

---

## 1. Executive Summary

*Aha! it's me* is a dual-locale (`ko-KR`, `en-US`) digital personality and relationship analysis platform. It combines deterministic traditional astrology/Saju (Manseryeok engine + birth chart calculations) with Large Language Model (OpenAI API) narrative generation to produce personalized self-discovery reports ("Personal Blueprint", "Slim V1", "Deep Report") and interpersonal dynamics reports ("Relationship Blueprint", "Romantic/Friend/Partner Compatibility").

### Service & Business Model Summary
1. **Free Tier**: 10-question survey + birth date/time/place input yielding a free "Lite Blueprint" and interpersonal "Gap Analysis".
2. **Paid Tiers**: One-time purchase digital reports and premium memberships processed globally via **Paddle.com** acting as the sole Merchant of Record (MoR).
3. **Target Markets**: South Korea (`ko-KR`) and the United States (`en-US`), specifically California.

### Key Legal Audit Highlights & Focus Areas for Counsel
- **Dual Jurisdiction Compliance**: Managing South Korea's Personal Information Protection Act (PIPA), Act on the Consumer Protection in Electronic Commerce, and Act on Promotion of Information and Communications Network Utilization vs. US Federal (COPPA, FTC Act § 5) and California (CCPA/CPRA, CalOPPA) requirements.
- **Second-Party Data Input**: Users submit birth date, birth time, and birth location of third parties (partners, friends, family) to generate relationship analysis.
- **AI & Automated Processing**: Automated narrative generation via OpenAI API; requires legal evaluation of automated decision-making disclosures and AI training opt-out verification.
- **Merchant of Record (MoR) Model**: Global payment handling by Paddle; evaluation of KRW/USD price displays, refund policies, and statutory withdrawal rights (*청약철회*).
- **Account Deletion & Data Retention**: Self-serve deletion via `/api/account/delete` cascades database records and deletes Clerk user profiles, but payment records remain in Paddle.

---

## 2. Product Overview & Architecture

### 2.1 Technical Stack & Core Infrastructure
- **Frontend / Application Framework**: Next.js (App Router, Node.js runtime) deployed on Vercel.
- **Authentication & Identity**: Clerk (`@clerk/nextjs`), managing user sign-up, login, session tokens, and metadata.
- **Database & Storage**: Supabase (PostgreSQL with Row Level Security - RLS).
- **AI Generation Engine**: OpenAI GPT-4o / GPT-4o-mini via API calls.
- **Payment & Merchant of Record**: Paddle (Global MoR handling billing, tax compliance, and refunds).
- **Social Integration**: Kakao JavaScript SDK (`Kakao.Share`) for South Korean invitation sharing.

### 2.2 Core Product Flows & Routes

```
[Unauthenticated User] 
       │
       ▼
 [Landing Page] (/ /kr)
       │
       ├─► [Free Survey / Blueprint Flow] (/blueprint/survey, /survey/result)
       │        └─► Collects: Self Birth Date, Time, Location, Gender + Survey Answers
       │
       ├─► [Relationship Invite / Connect Flow] (/invite, /connect)
       │        └─► Inputs: Second-Party (Partner/Friend) Birth Date, Time, Location
       │
       └─► [Sign-Up / Auth Flow] (Clerk Modal + /onboarding/legal-consent)
                │
                ▼
      [Authenticated User]
                │
                ├─► [Personal Reports & Dashboard] (/my/reports, /v1/slim)
                ├─► [Relationship Reports] (/relationship/*, /relationship/result/*)
                └─► [Account Settings & Deletion] (/account/settings, /api/account/delete)
```

### 2.3 Codebase References
- **Landing & SEO**: [`lib/seo/pageMetadata.ts`](file:///C:/dev/WhoamI/lib/seo/pageMetadata.ts#L1-L150)
- **Legal Consent Helper**: [`lib/legal/consent.ts`](file:///C:/dev/WhoamI/lib/legal/consent.ts#L1-L94)
- **Onboarding Page**: [`app/onboarding/legal-consent/page.tsx`](file:///C:/dev/WhoamI/app/onboarding/legal-consent/page.tsx#L1-L120)
- **Account Deletion API**: [`app/api/account/delete/route.ts`](file:///C:/dev/WhoamI/app/api/account/delete/route.ts#L1-L55)
- **Payment Config**: [`lib/payment/betaPaddlePricing.ts`](file:///C:/dev/WhoamI/lib/payment/betaPaddlePricing.ts#L1-L60)

---

## 3. User Data Flow & Data Mapping Matrix

### 3.1 Data Categories Collected & Processed

| Data Category | Specific Data Elements | Collection Point | Storage Location | Retention Period |
| :--- | :--- | :--- | :--- | :--- |
| **Account Identity** | Email address, User ID, Login timestamps, IP logs | Clerk Auth Sign-up / Login | Clerk Infrastructure (US) | Account lifetime + Clerk audit retention |
| **Legal Consent Logs** | Age confirmation (13/14+), Terms acceptance timestamp, Locale (`ko-KR`/`en-US`) | `/onboarding/legal-consent` or Clerk Auth | Clerk `unsafeMetadata.legalConsent` | Account lifetime |
| **First-Party Demographic Data** | Birth date, birth time (or 12:00 default), birth city/country, gender | Survey / Onboarding | Supabase `reports` table | Account lifetime / deleted upon request |
| **Psychological / Behavioral Survey** | 10-item personality survey responses | Free Blueprint Survey | Supabase `reports` table (`survey_answers` JSON) | Account lifetime / deleted upon request |
| **Second-Party (Third-Party) Data** | Partner/Friend birth date, birth time, birth location, relationship tag | Connect / Invite Flow | Supabase `relationship_reports` table | Account lifetime of initiating user |
| **Payment Transactions** | Purchase history, Paddle Transaction ID, Email, Currency | Paddle Checkout | Paddle MoR + Supabase `users_credits` | Tax requirement (up to 5–7 years per jurisdiction) |
| **AI Generation Prompts** | Anonymized Saju / Zodiac astrological parameters, survey trait vectors | API Route to OpenAI | OpenAI API (Ephemeral 30-day log) | 30 days per OpenAI zero-data retention API policy |

### 3.2 Audit Findings per Component

#### [CURRENT IMPLEMENTATION]
- First-party birth details and survey responses are stored in Supabase `reports` table tied to `clerk_user_id`.
- Second-party birth details are stored in Supabase `relationship_reports` table linked to the primary user.
- Consent records are stored in Clerk `unsafeMetadata.legalConsent` (`acceptedAt`, `locale`, `minAge`, `termsAccepted`, `ageConfirmed`).

#### [OBSERVED GAP]
- Birth location (city/country) is collected for astrology calculations (required for real local time adjustment in western/vedic astrology). Location precision is stored at city level, which may constitute precise geolocational data under CCPA/CPRA if combined with user identity.
- No separate express consent checkbox exists specifically for processing sensitive birth/astrological data under PIPA Article 23 (Sensitive Data).

#### [QUESTION FOR COUNSEL]
1. Does PIPA classify exact birth time and birth city combined with personality survey traits as "sensitive personal information" (*선택적/민감정보*) requiring separate explicit consent under PIPA Art. 23?
2. Under CCPA/CPRA, does city-level birth location input fall under "Sensitive Personal Information"? Is a "Limit the Use of My Sensitive Personal Information" notice required?

---

## 4. Third-Party Data Processors & Subprocessors

### 4.1 Subprocessor Inventory

| Subprocessor | Purpose / Function | Location / Transfer | DPA / Contract Status | Compliance Standard |
| :--- | :--- | :--- | :--- | :--- |
| **Clerk Inc.** | Authentication, User Identity, Consent Metadata | USA | Standard Terms / DPA available | SOC2, EU-US Data Privacy Framework |
| **Supabase Inc.** | PostgreSQL Cloud Database, RLS Security | USA (AWS East) | Standard Terms / DPA available | SOC2, HIPAA compliant infrastructure |
| **Vercel Inc.** | Web Application Hosting & Serverless Functions | USA / Global Edge | Standard Terms / DPA available | SOC2, ISO 27001 |
| **OpenAI LLC** | LLM API for generating report narratives | USA | Enterprise API Terms (Zero Data Retention / No Model Training) | SOC2, ISO 27001 |
| **Paddle.com Market Ltd** | Merchant of Record, Payment Processing, Global Tax | UK / USA / Global | MoR Merchant Agreement | PCI-DSS Level 1, GDPR compliant |
| **Kakao Corp.** | Social Share SDK (`Kakao.Share`) for South Korea | South Korea | Client-side SDK integration | PIPA compliant |

### 4.2 Audit Findings per Component

#### [CURRENT IMPLEMENTATION]
- OpenAI API is invoked via server-side API routes using standard API keys (`OPENAI_API_KEY`). API terms explicitly state input/output prompts via API are **not** used to train OpenAI models.
- Paddle acts as Merchant of Record (MoR), selling products directly to users as reseller.

#### [OBSERVED GAP]
- The public Privacy Policy ([`lib/legal/privacyPolicy.ts`](file:///C:/dev/WhoamI/lib/legal/privacyPolicy.ts#L1-L150)) lists third-party subprocessors in general terms, but does not explicitly name Clerk, Supabase, Vercel, and OpenAI in the Korean Privacy Policy itemized transfer table required under PIPA Article 28-2 and Article 39-12 (Cross-Border Transfer Disclosure).

#### [QUESTION FOR COUNSEL]
1. For South Korean users (`ko-KR`), is explicit cross-border data transfer consent (*개인정보 국외이전 동의*) required for transmitting data to US-based subprocessors (Clerk, Supabase, Vercel, OpenAI), or is public disclosure in the Privacy Policy sufficient under the amended PIPA?
2. Does relying on OpenAI API's zero-training terms satisfy EU/US/KR regulatory mandates for AI transparency and processor duty of care?

---

## 5. Current Legal Documents & Terms Assessment

### 5.1 Document Inventory & Last Updated Dates
- **Terms of Service**: [`lib/legal/termsOfService.ts`](file:///C:/dev/WhoamI/lib/legal/termsOfService.ts#L1-L158)
  - `en-US` `lastUpdated`: `2026-07-15`
  - `ko-KR` `lastUpdated`: `2026-09-10`
- **Privacy Policy**: [`lib/legal/privacyPolicy.ts`](file:///C:/dev/WhoamI/lib/legal/privacyPolicy.ts#L1-L150)
  - `en-US` `lastUpdated`: `2026-07-15`
  - `ko-KR` `lastUpdated`: `2026-09-10`
- **Refund Policy**: [`lib/legal/refundPolicy.ts`](file:///C:/dev/WhoamI/lib/legal/refundPolicy.ts#L1-L80)
  - `en-US` `lastUpdated`: `2026-07-15`
  - `ko-KR` `lastUpdated`: `2026-09-10`

### 5.2 Key Provisions Analysis

#### A. Merchant of Record (MoR) Alignment
Both `en-US` and `ko-KR` terms explicitly identify **Paddle.com** as the exclusive reseller and MoR for all digital checkouts, dropping an earlier draft plan for a dual Toss/Paddle split:
> *"All payments and subscription transactions for our global service are processed exclusively by Paddle.com, which acts as our online reseller and the Merchant of Record (MoR)."* ([`lib/legal/termsOfService.ts:L59`](file:///C:/dev/WhoamI/lib/legal/termsOfService.ts#L59))

#### B. Company Details & Address
- Listed Company Address: *5F, 18 Eonju-ro 134-gil, Gangnam-gu, Seoul, Republic of Korea*.
- Legal Entity Status: Currently operated by sole proprietor / preparing corporate incorporation.

### 5.3 Audit Findings per Component

#### [CURRENT IMPLEMENTATION]
- Policy documents are stored as TypeScript objects in `lib/legal/` and rendered dynamically based on the active locale (`ko-KR` or `en-US`).
- Policies include explicit clauses for AI Disclaimer, Third-Party Data warranty, MoR billing, and Governing Law (Seoul, Republic of Korea).

#### [OBSERVED GAP]
- Governing Law in Section 7 specifies South Korea court jurisdiction for all users. For US users (especially California consumers), mandatory foreign forum selection and foreign governing law clauses in consumer terms are frequently challenged or unenforceable under California Civil Code § 1789.6 and Federal arbitration/venue standards unless accompanied by arbitration/class action waiver provisions.
- No explicit Dispute Resolution / Informal Negotiations / Class Action Waiver clause exists in `en-US` Terms of Service.

#### [QUESTION FOR COUNSEL]
1. Should the `en-US` Terms of Service include a dedicated US Arbitration Clause and Class Action Waiver governed by US law, while maintaining South Korean governing law for `ko-KR` users?
2. Under Korean E-Commerce Act Article 13, does listing a business address without a registered business registration number (*사업자등록번호*) or E-Commerce Registration Number (*통신판매업신고번호*) on the website footer meet statutory disclosure requirements for commercial beta operations?

---

## 6. AI & Automated Processing Disclosure

### 6.1 AI Architecture in Service
The service uses deterministic algorithms (Saju Manseryeok engine and astrological positioning calculations) to derive structural signal vectors. These vectors are passed as structured JSON prompts to OpenAI GPT-4o / GPT-4o-mini to generate natural language narrative reports.

```
[User Input: Date/Time/Location] ──► [Deterministic Saju Engine] ──► [Signal Vector JSON]
                                                                            │
[OpenAI GPT-4o API] ◄───────────────────────────────────────────────────────┘
         │
         ▼
[Narrative Report Output] ──► [Rendered to User UI]
```

### 6.2 Existing AI Disclaimers in Codebase
Section 4 of Terms of Service ([`lib/legal/termsOfService.ts:L48-L54`](file:///C:/dev/WhoamI/lib/legal/termsOfService.ts#L48-L54)):
> *"1. Reports and analyses are generated using artificial intelligence (including OpenAI technology) and are provided for informational and entertainment purposes only.*  
> *2. The Service does not provide professional psychological counseling, medical, legal, or financial advice."*

### 6.3 Audit Findings per Component

#### [CURRENT IMPLEMENTATION]
- Clear contractual disclaimer in Section 4 of Terms of Service stating AI generation and entertainment scope.
- Server-side API route passes structured prompts without persistent storage of prompts on OpenAI's side (Zero Data Retention for API).

#### [OBSERVED GAP]
- California AB 2013 (Generative AI Training Transparency) and emerging EU AI Act / US FTC guidance require clear front-facing notices when users interact with AI-generated content or automated profiling.
- Under PIPA Article 37-2 (Right to Object to Automated Decision-Making, enacted 2024), users have the right to request explanations or object to fully automated decisions that significantly impact their rights.

#### [QUESTION FOR COUNSEL]
1. Does personality / astrological report generation qualify as "automated processing having legal or similarly significant effects" under PIPA Art. 37-2, or does its classification as entertainment/informational content exempt it?
2. Is a prominent inline UI badge stating "Generated by AI (OpenAI)" required on the report UI screen itself, in addition to the Terms of Service disclaimer?

---

## 7. Saju / Astrological / Psychological Advice & Liability Disclaimer

### 7.1 Nature of Output & Content
The platform delivers narrative insights on personal temperament, relationship compatibility, decision-making styles, and interpersonal gaps derived from traditional East Asian Saju (사주명리학) and psychological framework surveys.

### 7.2 Medical / Psychological Advice Boundary
The reports contain actionable advice (e.g., "how to communicate with your partner", "stress triggers to watch out for"). 

### 7.3 Audit Findings per Component

#### [CURRENT IMPLEMENTATION]
- Terms of Service Section 4 explicitly disclaims professional psychological, medical, legal, or financial advice.
- Limitation of liability clause (Section 6) caps company liability to maximum extent permitted by law.

#### [OBSERVED GAP]
- South Korean Medical Service Act (*의료법*) and Mental Health Act (*정신건강복지법*) restrict unlicensed medical/psychological diagnosis. While traditional fortune-telling (*사주/점술*) and personality test services are legally permissible entertainment/consulting services in Korea, framing outputs as "psychological diagnosis" (*심리진단*) could trigger regulatory scrutiny.
- In the US, state licensing laws for clinical psychologists and counselors prohibit unlicensed practice of psychology.

#### [QUESTION FOR COUNSEL]
1. What exact wording should be used in the UI banner and report footer to ensure Korean regulators do not classify the reports as unauthorized medical/psychological diagnosis (*무면허 의료/심리상담 행위*)?
2. Is the current liability cap ("maximum extent permitted by law") sufficient under California Consumer Privacy and Tort law to shield against claims of emotional distress or misreliance on relationship advice?

---

## 8. Payment, Entitlement, Refund, & Merchant of Record (MoR) Architecture

### 8.1 MoR Integration (Paddle)
All checkouts, subscription billing, tax collection (VAT/GST/Sales Tax), and payment processing are delegated to Paddle.com.

```
[User Clicks Purchase] ──► [CheckoutWithRefundConsent.tsx]
                                    │
                                    ▼
                          [Paddle Overlay / MoR]
                                    │
                         ┌──────────┴──────────┐
                         ▼                     ▼
                  [Payment Success]     [Tax & Compliance]
                         │                 (Handled by Paddle)
                         ▼
             [Supabase Webhook Entitlement]
```

### 8.2 Refund Policy Logic & Digital Content Delivery
[`lib/legal/refundPolicy.ts`](file:///C:/dev/WhoamI/lib/legal/refundPolicy.ts#L1-L80) establishes:
- **Digital Content Exception**: Digital reports are non-tangible content delivered immediately upon purchase/generation.
- **Pre-Generation Refund**: If a user cancels before AI generation commences, a 100% refund is issued.
- **Post-Generation Refund**: Once the report has been generated and rendered, statutory withdrawal rights (*청약철회*) are limited pursuant to Korean E-Commerce Act Article 17(2)(5) (digital content whose provision has commenced) and equivalent global digital goods standards, unless a critical technical failure prevented delivery.

### 8.3 Audit Findings per Component

#### [CURRENT IMPLEMENTATION]
- [`components/payment/CheckoutWithRefundConsent.tsx`](file:///C:/dev/WhoamI/components/payment/CheckoutWithRefundConsent.tsx#L1-L100) displays an explicit consent notice prior to launching Paddle checkout:
  > *"Purchasing digital content. Once generation begins, statutory refund rights are restricted under digital content regulations."*

#### [OBSERVED GAP]
- Under Korean E-Commerce Act Article 17(2)(5), restricting statutory 7-day withdrawal rights for digital content requires **both** explicit prior consumer consent **and** providing a test/preview version or technical safeguard.
- Paddle's global terms provide a 14-day refund window for certain EU/UK consumers unless explicitly waived during checkout.

#### [QUESTION FOR COUNSEL]
1. Does the explicit checkbox/notice in `CheckoutWithRefundConsent.tsx` legally satisfy Korean E-Commerce Act Art. 17(2)(5) requirements to waive the 7-day cooling-off period (*청약철회 제한*) for instant AI report generation?
2. Does Paddle's MoR structure fully shift sales tax / VAT compliance responsibility away from the company in both South Korea (Korean National Tax Service) and California (CDTFA)?

---

## 9. Account Deletion, Data Retention, & Right to be Forgotten

### 9.1 Self-Serve Account Deletion Flow
Located at [`app/api/account/delete/route.ts`](file:///C:/dev/WhoamI/app/api/account/delete/route.ts#L15-L54):

```typescript
// 1. Delete Supabase reports row (Cascades to child tables via FK)
const { error: deleteReportsError } = await supabase
  .from("reports")
  .delete()
  .eq("clerk_user_id", userId);

// 2. Delete Clerk User Account
const client = await clerkClient();
await client.users.deleteUser(userId);
```

### 9.2 Cascade & Retention Mapping

```
[POST /api/account/delete]
       │
       ├─► Supabase `reports` (DELETED)
       │        ├─► `relationship_reports` (CASCADE DELETED)
       │        ├─► `connect_links` (CASCADE DELETED)
       │        ├─► `decision_journals` (CASCADE DELETED)
       │        └─► `users_credits` (CASCADE DELETED)
       │
       ├─► Clerk Identity Profile (DELETED)
       │
       └─► Paddle Payment Records (RETAINED at Paddle for legal/tax statutory audit)
```

### 9.3 Audit Findings per Component

#### [CURRENT IMPLEMENTATION]
- Self-serve 1-click deletion endpoint deletes the core user profile from Supabase and cascades all relational records.
- Deletes user identity completely from Clerk auth infrastructure.

#### [OBSERVED GAP]
- Transaction and entitlement logs at Paddle are maintained under Paddle's statutory record retention obligations (up to 5–7 years for tax authorities).
- Backup snapshots in Supabase (if point-in-time recovery is enabled) retain deleted rows for up to 7–30 days until backup rotation occurs.
- Under PIPA Article 21, when personal data is retained pursuant to other statutes (e.g., E-Commerce Act retention of transactional data for 5 years), it must be **stored separately** (*별도 분리보관*) from active operational databases.

#### [QUESTION FOR COUNSEL]
1. Does the technical deletion flow in `/api/account/delete` satisfy PIPA Art. 21 (Destruction of Personal Information) and CCPA/CPRA Right to Delete (§ 1798.105)?
2. How should the platform communicate to users during deletion that financial/transaction logs are legally retained by Paddle for statutory tax compliance?

---

## 10. Cookie / Storage / Analytics Policy

### 10.1 Storage Technologies Employed
- **Session Storage**: `aha_signup_legal_consent` ([`lib/legal/consent.ts:L25`](file:///C:/dev/WhoamI/lib/legal/consent.ts#L25)) used to preserve draft consent choices across signup flow.
- **Cookies**: Essential authentication cookies set by Clerk (`__session`, `__client_uat`).
- **Local Storage**: UI state preferences (e.g., theme, active tab).

### 10.2 Cookie Consent Mechanism

#### [CURRENT IMPLEMENTATION]
- Storage technologies used are strictly necessary for core functionality (authentication session and legal consent state management).
- No third-party advertising cookies, cross-site tracking pixels (e.g., Meta Pixel, TikTok Pixel), or third-party ad networks are currently deployed.

#### [OBSERVED GAP]
- California CPRA and ePrivacy / GDPR standards require explicit cookie consent banners if non-essential analytics (e.g., Google Analytics 4, Mixpanel) or advertising cookies are added.
- No standalone Cookie Banner modal currently pops up for first-time visitors prior to authentication.

#### [QUESTION FOR COUNSEL]
1. Because current cookies/storage are limited to essential session and auth tokens (Clerk), is a formal Cookie Consent Banner legally mandatory for US/CA or KR visitors prior to sign-up?
2. If privacy-first analytics (e.g., Vercel Analytics / PostHog self-hosted) are enabled, what category of consent is required under California CCPA/CPRA ("Do Not Sell or Share My Personal Information")?

---

## 11. Disclosures & Consent Collection Mechanics (KR vs US)

### 11.1 Onboarding Consent Mechanics
Implemented in [`lib/legal/consent.ts`](file:///C:/dev/WhoamI/lib/legal/consent.ts#L40-L50) and [`app/onboarding/legal-consent/page.tsx`](file:///C:/dev/WhoamI/app/onboarding/legal-consent/page.tsx#L1-L120):

```typescript
export function buildLegalConsentRecord(locale: "ko-KR" | "en-US"): LegalConsentRecord {
  return {
    ageConfirmed: true,
    termsAccepted: true,
    acceptedAt: new Date().toISOString(),
    locale,
    minAge: locale === "ko-KR" ? 14 : 13,
  };
}
```

### 11.2 Flow Comparison

```
[ko-KR Onboarding Flow]
  Mandatory Checkboxes:
  [X] [필수] 만 14세 이상입니다 (Age 14+)
  [X] [필수] 서비스 이용약관 및 개인정보 처리방침 동의
  [ ] [선택] 마케팅 정보 수신 동의 (Marketing Opt-in)
  ──────► Recorded in Clerk `unsafeMetadata.legalConsent`

[en-US Onboarding Flow]
  Implicit Sign-In Notice:
  "By continuing, you agree to our Terms of Service and Privacy Policy. You affirm you are at least 13 years old."
  ──────► Recorded in Clerk `unsafeMetadata.legalConsent`
```

### 11.3 Audit Findings per Component

#### [CURRENT IMPLEMENTATION]
- Locale-specific age threshold enforcement (14+ for South Korea under PIPA, 13+ for US under COPPA).
- Mandatory explicit checkboxes for Korean locale (`ko-KR`); implicit notice for US locale (`en-US`).
- Optional marketing consent stored separately (`MARKETING_CONSENT_META_KEY`).

#### [OBSERVED GAP]
- PIPA Article 22 requires explicit separate consent items for:
  1. Collection and use of personal information (*개인정보 수집·이용 동의*)
  2. Processing of unique identifying / sensitive information (*민감정보 처리 동의*, if applicable)
  3. Third-party data provision / cross-border transfer (*개인정보 제3자 제공 및 국외이전 동의*)
  4. Optional marketing communications (*선택적 마케팅 동의*)
- Currently, `ko-KR` onboarding groups Terms and Privacy Policy into a single mandatory checkbox.

#### [QUESTION FOR COUNSEL]
1. Does bundling Terms of Service and Privacy Policy into a single mandatory checkbox violate PIPA Art. 22(1), which requires separate consent for Terms vs. Privacy Collection?
2. Is implicit consent ("By continuing, you agree...") legally enforceable for US/California users for standard SaaS/digital content terms under standard US circuit precedent (browsewrap vs. sign-in wrap)?

---

## 12. Minors & Age Verification Policy

### 12.1 Statutory Age Limits
- **South Korea**: Under PIPA Article 22-2, processing personal information of children under age 14 requires statutory legal representative consent (*법정대리인 동의*).
- **United States**: Under COPPA (15 U.S.C. § 6501), collecting personal information from children under age 13 requires verifiable parental consent. California CPRA imposes heightened opt-in requirements for minors aged 13–15.

### 12.2 Technical Enforcement
- Minimum age requirement is declared in code: 14 for `ko-KR`, 13 for `en-US`.
- Users must affirm age during onboarding checkbox/sign-in.

### 12.3 Audit Findings per Component

#### [CURRENT IMPLEMENTATION]
- The service blocks account creation if a user refuses the age affirmation checkbox.

#### [OBSERVED GAP]
- Age verification relies on self-declaration (affirmation checkbox). No formal identity/age verification API (e.g., NICE/KCB phone identity verification - *본인인증*) is integrated for South Korea.
- Birth date input during the Saju survey could theoretically allow a user to enter a birth date indicating they are under 14, even if they checked the 14+ affirmation box during onboarding.

#### [QUESTION FOR COUNSEL]
1. Is self-affirmation (checkbox) legally sufficient under PIPA Article 22-2 for digital content services, or is formal mobile identity verification (*본인인증*) mandatory for South Korean services?
2. If a user inputs a birth date in the survey that indicates they are currently under 13/14 years old, what automated account suspension/deletion measures are required?

---

## 13. Friend / Relationship Data & Second-Party Data Collection

### 13.1 Interpersonal Data Entry Mechanics
In the Relationship / Connect features (`/invite`, `/connect`, `/relationship/*`), User A enters third-party information regarding Person B:
- Person B's Name / Alias / Relationship Tag
- Person B's Birth Date, Birth Time, Birth Location, Gender

### 13.2 Contractual Warranty Clause
Terms of Service Section 3 ([`lib/legal/termsOfService.ts:L38-L46`](file:///C:/dev/WhoamI/lib/legal/termsOfService.ts#L38-L46)):
> *"1. Certain features allow you to input information about another person... ('Third-Party Data').*  
> *2. By submitting Third-Party Data, you represent and warrant that you have obtained that person's explicit consent to share their information with us for this purpose.*  
> *3. You are solely responsible for any disputes... We may remove such data immediately upon a verified request."*

### 13.3 Audit Findings per Component

#### [CURRENT IMPLEMENTATION]
- Clear contractual indemnity and consent representation warranty placed on the user submitting third-party birth details.
- Mechanism exists to delete relationship records upon request.

#### [OBSERVED GAP]
- PIPA strictly limits collecting and processing personal information of third parties without direct statutory legal basis or explicit third-party consent. A contractual warranty by User A ("I got my friend's permission") may not legally insulate the company from PIPA administrative liability if Person B files a complaint with the Personal Information Protection Commission (PIPC).

#### [QUESTION FOR COUNSEL]
1. Under PIPA, does storing a third party's birth date/time/city submitted by a primary user expose the platform to regulatory fines, even with Section 3's contractual user warranty?
2. Does sending an invitation link to Person B to "accept and view relationship analysis" constitute direct notice under PIPA Article 20 (Notice on Collection from Third Parties)?

---

## 14. Marketing Claims, Science vs Entertainment, & False Advertising Risk

### 14.1 Product Positioning & Claims
The platform describes its underlying analysis using terms such as:
- *"Behavioral Psychology & Astrological Data Synthesis"*
- *"Personal Blueprint & Interpersonal Dynamics Engine"*
- *"Decision-Making Matrix & Relationship Compatibility"*

### 14.2 False Advertising Standards
- **South Korea**: Fair Labeling and Advertising Act (*표시·광고의 공정화에 관한 법률*). Prohibits deceptive, false, or exaggerated advertising claims (*허위·과장광고*).
- **United States**: FTC Act Section 5 (Deceptive Practices). Prohibits unsubstantiated scientific or diagnostic claims.

### 14.3 Audit Findings per Component

#### [CURRENT IMPLEMENTATION]
- Terms of Service explicitly specify that reports are provided for **informational and entertainment purposes only**.

#### [OBSERVED GAP]
- If marketing materials (landing page copy, social ads, Kakao share messages) describe the analysis as "scientifically proven psychological profiling" rather than "astrological & behavioral insight framework", it may trigger FTC or KFTC (*공정거래위원회*) scrutiny regarding scientific substantiation.

#### [QUESTION FOR COUNSEL]
1. What terminology guidelines should marketing and UI copy follow to ensure claims cannot be construed as deceptive scientific claims under KFTC and FTC Act § 5 standards?
2. Is adding a small footer note ("For self-discovery and entertainment purposes") on all landing pages and marketing landing cards recommended?

---

## 15. South Korea vs United States (Federal + California) Legal Matrix

| Legal Dimension | South Korea (`ko-KR`) | United States - Federal & California (`en-US`) |
| :--- | :--- | :--- |
| **Primary Data Protection Law** | Personal Information Protection Act (PIPA) | FTC Act § 5, COPPA, California CCPA/CPRA |
| **Minimum User Age** | **14 years old** (PIPA Art. 22-2) | **13 years old** (COPPA) / 16 for CPRA opt-out |
| **Consent Collection Requirement** | Mandatory explicit separate checkboxes for terms & privacy | Sign-in wrap / implicit consent generally recognized for terms |
| **Sensitive Data Classification** | Strict statutory categories (Art. 23); birth details borderline | CCPA/CPRA Sensitive Personal Information (SPI) rules apply |
| **Cross-Border Data Transfer** | Mandatory disclosure & consent under PIPA Art. 28-8 | Privacy Policy disclosure of processors & transfer safeguards |
| **E-Commerce Withdrawal Rights** | 7-day statutory cooling-off (*청약철회*), waivable for digital content | State law / FTC regulations; seller terms govern unless deceptive |
| **Payment & Merchant Model** | Business registration & MoR tax compliance (Paddle MoR handles) | Sales tax nexus (Paddle MoR handles state sales tax collection) |
| **Account Deletion Obligation** | Immediate destruction + separate retention of statutory data (Art. 21) | CCPA § 1798.105 Right to Delete within 45 days |
| **Governing Law / Forum** | Republic of Korea Courts (Seoul Central District Court) | US Arbitration & Class Action Waiver recommended for US users |

---

## 16. Prioritized Questions for Legal Counsel

### Category A: South Korea Legal Counsel (Korean Bar - PIPA & E-Commerce)
1. **[PIPA Consent Granularity]** Does bundling Terms of Service and Privacy Policy into a single mandatory checkbox in our Korean onboarding flow violate PIPA Article 22? Should we split it into separate checkboxes for Terms, Privacy Collection, and Cross-Border Transfer?
2. **[Third-Party Data Input]** When User A inputs Person B's birth date, birth time, and birth city for relationship analysis, does our Section 3 user warranty ("User warrants they obtained consent") legally protect the platform under PIPA, or must we require Person B's explicit confirmation before processing?
3. **[Cross-Border Transfer Disclosure]** To comply with PIPA Article 28-8 regarding our US subprocessors (Clerk, Supabase, Vercel, OpenAI), is an updated Privacy Policy itemized list sufficient, or do we need an explicit onboarding checkbox for international data transfer?
4. **[E-Commerce Digital Content Refund]** Does our pre-checkout notice in `CheckoutWithRefundConsent.tsx` legally satisfy Korean E-Commerce Act Article 17(2)(5) to waive the 7-day withdrawal right upon AI report generation?
5. **[Medical/Psychological Service Boundaries]** What specific disclaimer phrasing must appear on report screens to prevent Korean health authorities from classifying our Saju/psychology reports as unauthorized medical or mental health diagnosis under the Medical Service Act?
6. **[Account Deletion Retention]** In `/api/account/delete`, we erase Supabase database records while Paddle retains financial transaction logs. Does this meet PIPA Article 21 requirements for destroying personal data while retaining legal tax records?
7. **[Business Identification on Footer]** As a digital service operating globally via Paddle MoR, what specific Korean business registration details (*사업자등록번호, 통신판매업신고번호*) must be displayed on the footer for `ko-KR` visitors under the E-Commerce Act?
8. **[Age Verification]** Is an age confirmation checkbox ("만 14세 이상입니다") legally sufficient for `ko-KR` digital reports, or is mobile identity verification (*본인인증*) mandatory?
9. **[Automated Decision-Making Objection]** Does AI narrative report generation fall under PIPA Article 37-2 (Right to Object to Automated Processing)? Is an automated processing disclosure required?
10. **[Marketing Claims]** Are terms like *"AI-Powered Personality & Relationship Blueprint"* permissible under the Fair Labeling and Advertising Act, provided entertainment disclaimers are present?

### Category B: US & California Legal Counsel (US Bar - Privacy & Consumer Protection)
11. **[Governing Law & Forum Clause]** Our Terms of Service currently specify Seoul, Republic of Korea as the exclusive venue for all disputes. Is this enforceable against California consumers, or should we add a tailored US Dispute Resolution & Binding Arbitration Clause with Class Action Waiver?
12. **[Sign-In Wrap Consent Validity]** Is our current US onboarding flow ("By continuing, you agree to our Terms and Privacy Policy") legally binding under Ninth Circuit precedents (e.g., *Berman v. Freedom Financial Network*)?
13. **[CCPA/CPRA Sensitive Personal Information]** Does collecting birth date, birth time, and birth city constitute "Sensitive Personal Information" under CCPA § 1798.140? Is a "Limit the Use of My Sensitive Personal Information" link required?
14. **[CCPA/CPRA Right to Delete & Subprocessors]** When a user triggers account deletion via `/api/account/delete`, we delete Clerk and Supabase data. Does our MoR (Paddle) retaining billing records comply with CCPA deletion exemptions for legal/statutory compliance?
15. **[FTC AI Guidance & Transparency]** Under FTC Section 5 guidelines on AI products, is an inline badge ("Generated by OpenAI") required on AI report output screens to avoid claims of deceptive automation?
16. **[COPPA Compliance]** Our US threshold is set to 13+. Is self-affirmation during onboarding compliant with COPPA, and what steps should be taken if a birth date entered in the survey calculates to an age under 13?
17. **[Third-Party Data Warranty]** Under US privacy torts and state privacy laws (CCPA/CPRA), does relying on User A's representation and warranty that they have consent to submit Person B's birth details protect the company from privacy claims by Person B?
18. **[Paddle MoR Sales Tax Nexus]** Does Paddle serving as Merchant of Record fully insulate the company from California Department of Tax and Fee Administration (CDTFA) sales tax collection and remittance requirements?
19. **[Automatic Renewal Disclosures]** If we introduce recurring subscriptions, what specific pre-checkout disclosures and simple cancellation mechanisms must be implemented to comply with California's Automatic Renewal Law (ARL, Cal. Bus. & Prof. Code § 17600)?
20. **[California AB 2013 Generative AI Disclosure]** Does California AB 2013 require specific generative AI data source disclosures on our website for California residents receiving AI-generated personality reports?

---

## 17. Audit Verification & Appendix

### Project Codebase References & File Index
- **Terms of Service Implementation**: [`lib/legal/termsOfService.ts`](file:///C:/dev/WhoamI/lib/legal/termsOfService.ts#L1-L158)
- **Privacy Policy Implementation**: [`lib/legal/privacyPolicy.ts`](file:///C:/dev/WhoamI/lib/legal/privacyPolicy.ts#L1-L150)
- **Refund Policy Implementation**: [`lib/legal/refundPolicy.ts`](file:///C:/dev/WhoamI/lib/legal/refundPolicy.ts#L1-L80)
- **Legal Consent State Machine**: [`lib/legal/consent.ts`](file:///C:/dev/WhoamI/lib/legal/consent.ts#L1-L94)
- **User Onboarding Consent UI**: [`app/onboarding/legal-consent/page.tsx`](file:///C:/dev/WhoamI/app/onboarding/legal-consent/page.tsx#L1-L120)
- **Account Deletion Backend Handler**: [`app/api/account/delete/route.ts`](file:///C:/dev/WhoamI/app/api/account/delete/route.ts#L1-L55)
- **Checkout Consent UI**: [`components/payment/CheckoutWithRefundConsent.tsx`](file:///C:/dev/WhoamI/components/payment/CheckoutWithRefundConsent.tsx#L1-L100)
- **Paddle Pricing & Config**: [`lib/payment/betaPaddlePricing.ts`](file:///C:/dev/WhoamI/lib/payment/betaPaddlePricing.ts#L1-L60)

---
*End of Legal Review Packet Draft — Prepared for Counsel Consultation.*
