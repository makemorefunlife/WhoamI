import type { PolicyDocument } from "@/lib/legal/types";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Refund Policy — en-US sourced from Legal/refund_policy_en.md.
 *
 * No Korean source markdown existed for this one (unlike Terms/Privacy,
 * which had Legal/*_kr.md drafts) — the ko-KR text below is a direct
 * translation of the en-US policy, written to match it section-for-section
 * so both locales state the same terms. Have this reviewed for legal
 * accuracy before relying on it.
 */
export const refundPolicy: Record<Locale, PolicyDocument> = {
  "en-US": {
    title: "Refund Policy",
    description:
      "Thank you for using Aha It's me. Because our Service provides digital, AI-generated analysis reports that are delivered instantly upon creation, we maintain the following refund policy to ensure fairness and transparency.",
    lastUpdated: "2026-07-15",
    sections: [
      {
        id: "eligibility",
        title: "1. Refund Eligibility",
        paragraphs: [],
        listItems: [
          "Before Digital Content Delivery: You are eligible for a full refund within 7 days of purchase, provided that you have NOT generated, viewed, or downloaded any AI analysis reports or premium content.",
          "After Digital Content Delivery: Once an AI report has been successfully generated and delivered to your account, the service is considered consumed. In accordance with applicable electronic commerce and consumer protection laws, refunds cannot be granted for digital goods that have already been rendered, unless there is a confirmed technical defect caused entirely by our system.",
        ],
      },
      {
        id: "subscriptions",
        title: "2. Subscription Cancellations",
        paragraphs: [],
        listItems: [
          "If you are subscribed to a recurring plan, you may cancel your subscription at any time through your billing settings.",
          "Upon cancellation, you will retain access to premium features until the end of your current billing cycle. No partial refunds will be issued for unused days within a billing period.",
        ],
      },
      {
        id: "request",
        title: "3. How to Request a Refund",
        paragraphs: [
          "Since Paddle.com is the Merchant of Record for our global orders, all billing inquiries, disputes, and refund requests are processed through Paddle.",
        ],
        listItems: [
          "You can submit your refund request directly to Paddle support via your email receipt, or contact us at contact@ahaitsme.com with your transaction ID, and we will assist in escalating the request to Paddle.",
        ],
      },
      {
        id: "processing",
        title: "4. Processing Time",
        paragraphs: [
          "Once approved, refunds are processed by Paddle and will automatically be applied to your original method of payment. Please note that it may take 5 to 10 business days for the credit to appear on your statement, depending on your financial institution.",
        ],
      },
    ],
  },
  "ko-KR": {
    title: "환불 정책",
    description:
      "아하잇츠미(Aha It's me)를 이용해 주셔서 감사합니다. 본 서비스는 생성 즉시 제공되는 디지털 AI 분석 보고서를 다루는 특성상, 공정성과 투명성을 위해 다음과 같은 환불 정책을 운영합니다.",
    lastUpdated: "2026-09-10",
    sections: [
      {
        id: "eligibility",
        title: "1. 환불 가능 여부",
        paragraphs: [],
        listItems: [
          "디지털 콘텐츠 제공 전: AI 분석 보고서 또는 프리미엄 콘텐츠를 생성·열람·다운로드하지 않은 경우, 구매일로부터 7일 이내 전액 환불이 가능합니다.",
          "디지털 콘텐츠 제공 후: AI 보고서가 정상적으로 생성되어 계정에 제공된 경우, 서비스가 이미 소비된 것으로 간주됩니다. 관련 전자상거래법 및 소비자보호법령에 따라, 회사 시스템의 명백한 기술적 결함이 확인된 경우가 아닌 한 이미 제공된 디지털 콘텐츠에 대한 환불은 제한됩니다.",
        ],
      },
      {
        id: "subscriptions",
        title: "2. 구독 해지",
        paragraphs: [],
        listItems: [
          "정기 구독 중인 경우, 결제 설정 화면에서 언제든지 구독을 해지할 수 있습니다.",
          "해지 후에도 현재 결제 주기가 끝날 때까지는 프리미엄 기능을 계속 이용하실 수 있습니다. 결제 주기 내 미사용 기간에 대한 부분 환불은 제공되지 않습니다.",
        ],
      },
      {
        id: "request",
        title: "3. 환불 요청 방법",
        paragraphs: [
          "글로벌 주문 건의 결제 대행사(Merchant of Record)는 Paddle.com이므로, 모든 결제 문의, 분쟁, 환불 요청은 Paddle을 통해 처리됩니다.",
        ],
        listItems: [
          "이메일 영수증에 포함된 링크로 Paddle 고객지원에 직접 환불을 요청하시거나, 거래 번호와 함께 contact@ahaitsme.com으로 문의해 주시면 Paddle에 요청이 전달되도록 안내해 드리겠습니다.",
        ],
      },
      {
        id: "processing",
        title: "4. 처리 기간",
        paragraphs: [
          "환불이 승인되면 Paddle을 통해 처리되며, 결제하신 원래 수단으로 자동 환급됩니다. 이용하시는 금융기관에 따라 명세서에 반영되기까지 영업일 기준 5~10일이 소요될 수 있습니다.",
        ],
      },
    ],
  },
};
