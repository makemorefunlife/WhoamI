import type { PolicyDocument } from "@/lib/legal/types";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Terms of Service — en-US sourced from Legal/terms_of_service_en.md,
 * ko-KR sourced from Legal/terms_of_service_kr.md.
 *
 * The ko-KR source originally described a dual processor split (Toss
 * Payments for KRW, Paddle for USD) — that was the pre-Beta plan. The
 * actual Beta implementation routes ALL checkouts (both locales) through
 * Paddle only (see components/payment/CheckoutWithRefundConsent.tsx's own
 * doc comment: "the earlier Toss-for-ko-KR branch was dropped"). Section 5
 * below reflects that — Paddle only, matching the en-US version and the
 * real payment code — not the original KR draft's Toss/Paddle split.
 */
export const termsOfService: Record<Locale, PolicyDocument> = {
  "en-US": {
    title: "Terms of Service",
    description:
      "Terms governing use of Aha It's me, including AI reports, third-party data, payments via Paddle, and dispute resolution.",
    lastUpdated: "2026-07-15",
    sections: [
      {
        id: "about",
        title: "1. About the Service",
        paragraphs: [
          'Aha It\'s me ("we," "us," or "the Company"), located at Hangangro-dong, Yongsan-gu, Seoul, Republic of Korea, provides an online service offering personality and relationship analysis based on astrology, behavioral psychology, and related frameworks, including AI-generated reports and decision-support tools (the "Service").',
        ],
      },
      {
        id: "eligibility",
        title: "2. Eligibility",
        paragraphs: [
          "You must be at least 13 years old to use the Service. If you are under 18, you represent that you have your parent or guardian's permission to use the Service.",
        ],
      },
      {
        id: "third-party",
        title: "3. Third-Party Information",
        paragraphs: [
          '1. Certain features allow you to input information about another person (e.g., a partner, family member, or friend) for relationship analysis ("Third-Party Data").',
          "2. By submitting Third-Party Data, you represent and warrant that you have obtained that person's explicit consent to share their information with us for this purpose.",
          "3. You are solely responsible for any disputes arising from your submission of Third-Party Data. We may remove such data immediately upon a verified request from the affected individual.",
        ],
      },
      {
        id: "ai-disclaimer",
        title: "4. AI-Generated Content & Disclaimer",
        paragraphs: [
          "1. Reports and analyses are generated using artificial intelligence (including OpenAI technology) and are provided for informational and entertainment purposes only.",
          "2. The Service does not provide professional psychological counseling, medical, legal, or financial advice. Consult a qualified professional before making significant decisions.",
          "3. We do not guarantee the accuracy, reliability, or completeness of AI-generated content and disclaim liability for outcomes resulting from reliance on it, except where caused by our gross negligence or willful misconduct.",
        ],
      },
      {
        id: "payments",
        title: "5. Payments, Subscriptions & Refunds",
        paragraphs: [
          "1. All payments and subscription transactions for our global service are processed exclusively by Paddle.com, which acts as our online reseller and the Merchant of Record (MoR). By making a purchase, you agree to Paddle’s Terms of Use and Privacy Policy.",
          "2. Subscriptions renew automatically unless cancelled through your account settings or Paddle support at least 24 hours before the renewal date.",
          "3. All refund requests are handled in accordance with our standalone Refund Policy and Paddle’s reseller terms.",
        ],
      },
      {
        id: "liability",
        title: "6. Limitation of Liability",
        paragraphs: [
          "To the maximum extent permitted by law, Aha It's me is not liable for indirect, incidental, or consequential damages arising from your use of the Service.",
        ],
      },
      {
        id: "governing-law",
        title: "7. Governing Law & Dispute Resolution",
        paragraphs: [
          "These Terms and your use of the Service shall be governed by and construed in accordance with the laws of the Republic of Korea. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts located in Seoul, Republic of Korea.",
        ],
      },
      {
        id: "changes",
        title: "8. Changes to These Terms",
        paragraphs: [
          "We may update these Terms from time to time. Material changes will be notified via the Service or email at least 7 days (or 30 days for changes unfavorable to users) in advance.",
        ],
      },
    ],
  },
  "ko-KR": {
    title: "이용약관",
    description:
      "아하잇츠미(Aha It's me) 서비스 이용에 관한 약관입니다 — AI 분석 보고서, 상대방 정보 입력, Paddle을 통한 결제, 분쟁 해결 방법을 포함합니다.",
    lastUpdated: "2026-09-10",
    sections: [
      {
        id: "about",
        title: "1. 서비스 소개",
        paragraphs: [
          "아하잇츠미(Aha It's me)(이하 \"회사\")는 대한민국 서울특별시 용산구 한강로동에 소재하며, 사주·행동심리·점성학 기반 분석 및 AI 생성 보고서, 의사결정 지원 도구를 포함한 온라인 서비스(이하 \"서비스\")를 제공합니다.",
        ],
      },
      {
        id: "eligibility",
        title: "2. 이용 자격",
        paragraphs: [
          "본 서비스는 만 14세 이상 이용자를 대상으로 합니다. 만 14세 미만 아동은 법정대리인(부모 등)의 동의 없이 서비스를 이용하거나 개인정보를 제공할 수 없습니다.",
        ],
      },
      {
        id: "third-party",
        title: "3. 상대방 정보 입력에 관한 특별 조항",
        paragraphs: [
          "1. 이용자는 관계 분석 등의 기능을 이용하기 위해 상대방(가족, 연인, 지인 등)의 정보(생년월일시, 이름 등)를 입력할 수 있습니다.",
          "2. 이용자는 상대방 정보를 입력하기 전, 해당 상대방으로부터 정보 제공 및 이용에 관한 명시적인 동의를 받았음을 보증합니다.",
          "3. 상대방 정보 입력으로 인해 발생하는 모든 분쟁에 대해 회사는 책임을 지지 않으며, 법적 책임은 정보를 입력한 이용자 본인에게 있습니다. 상대방이 자신의 정보가 무단으로 입력되었다고 이의를 제기하는 경우, 회사는 해당 정보를 지체 없이 삭제할 수 있습니다.",
        ],
      },
      {
        id: "ai-disclaimer",
        title: "4. AI 생성 콘텐츠에 관한 면책",
        paragraphs: [
          "1. 본 서비스에서 제공하는 분석 결과 및 보고서는 OpenAI의 인공지능 모델을 통해 자동 생성되며, 참고 및 정보 제공 목적으로만 제공됩니다.",
          "2. 본 서비스의 분석 결과는 전문적인 심리상담, 의료, 법률, 재무 자문을 대체하지 않습니다. 중요한 결정을 내리기 전에는 전문가와 상담해 주세요.",
          "3. 회사는 AI 생성 콘텐츠의 정확성, 신뢰성, 완전성을 보증하지 않으며, 이를 신뢰하여 발생한 결과에 대해 회사의 고의 또는 중과실이 없는 한 책임을 지지 않습니다.",
        ],
      },
      {
        id: "payments",
        title: "5. 결제, 구독 및 환불",
        paragraphs: [
          "1. 모든 결제 및 구독 거래는 회사의 결제 대행사(Merchant of Record)인 Paddle.com을 통해 처리됩니다. 결제를 진행함으로써 이용자는 Paddle의 이용약관 및 개인정보처리방침에도 동의하게 됩니다.",
          "2. 구독 서비스는 이용자가 계정 설정 또는 Paddle 고객지원을 통해 다음 결제일 최소 24시간 전까지 해지하지 않는 한 자동으로 갱신됩니다.",
          "3. 모든 환불 요청은 별도의 환불 정책 및 Paddle의 결제대행 약관에 따라 처리됩니다.",
        ],
      },
      {
        id: "liability",
        title: "6. 책임의 제한",
        paragraphs: [
          "법이 허용하는 최대 범위 내에서, 회사는 서비스 이용으로 인해 발생하는 간접적, 부수적, 결과적 손해에 대해 책임을 지지 않습니다. 또한 천재지변, 이용자의 귀책사유, 제3자(Paddle, Vercel, Supabase, Clerk 등)의 서비스 장애로 인한 서비스 중단에 대해서도 책임을 지지 않습니다.",
        ],
      },
      {
        id: "governing-law",
        title: "7. 준거법 및 관할법원",
        paragraphs: [
          "본 약관 및 서비스 이용과 관련하여 발생하는 분쟁은 대한민국 법률을 준거법으로 하며, 서울중앙지방법원을 전속 관할법원으로 합니다.",
        ],
      },
      {
        id: "changes",
        title: "8. 약관의 변경",
        paragraphs: [
          "회사는 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있습니다. 중요한 변경 사항은 적용일자 및 변경사유를 명시하여 서비스 화면 또는 이메일을 통해 최소 7일 전(이용자에게 불리한 변경의 경우 30일 전)에 공지합니다.",
        ],
      },
    ],
  },
};
