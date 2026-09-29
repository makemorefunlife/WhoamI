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
    lastUpdated: "2026-09-29",
    sections: [
      {
        id: "eligibility",
        title: "1. Refund Eligibility",
        paragraphs: [
          "Without limiting any mandatory statutory consumer rights under applicable law, refund eligibility for digital content on Aha It's me is determined as follows:",
        ],
        listItems: [
          "Before Digital Content Delivery: You are eligible for a full refund within 7 days of purchase, provided that you have not generated, viewed, or accessed the AI analysis report or premium content.",
          "After Digital Content Delivery: Once an AI report has been successfully generated and delivered to your account, the digital service is considered consumed. In accordance with applicable electronic commerce and consumer protection laws, refunds for simple change of mind are restricted after delivery.",
          "Technical Errors & Non-Delivery: If a system fault or technical failure prevents your report from being generated or delivered, you are eligible for a full refund or free re-issuance.",
          "Duplicate Charges: If an error results in duplicate charges for the same order, the duplicate transaction will be refunded in full.",
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
        title: "3. How to Request a Refund & Merchant Authority",
        paragraphs: [
          "Global payment and refund processing may be handled through third-party payment service providers, which may act as the seller or Merchant of Record for an order. Billing inquiries, disputes, and refund requests are processed in accordance with the applicable provider's terms and applicable consumer protection laws.",
        ],
        listItems: [
          "To request a refund, contact us at support@ahaitsme.com with your transaction ID, or use the support information included in your payment receipt. Where needed, we will help escalate your request to the payment service provider.",
          "Where a payment service provider acts as the Merchant of Record, it has final authority to evaluate, approve, and process refunds in compliance with applicable consumer rights, technical non-delivery cases, and its own terms.",
        ],
      },
      {
        id: "processing",
        title: "4. Processing Time",
        paragraphs: [
          "Once approved, refunds are processed by the payment service provider and will automatically be applied to your original method of payment. Please note that it may take 5 to 10 business days for the credit to appear on your statement, depending on your financial institution.",
        ],
      },
    ],
  },
  "ko-KR": {
    title: "환불 정책",
    description:
      "아하잇츠미(Aha It's me)를 이용해 주셔서 감사합니다. 본 서비스는 생성 즉시 제공되는 디지털 AI 분석 보고서를 다루는 특성상, 공정성과 투명성을 위해 다음과 같은 환불 정책을 운영합니다.",
    lastUpdated: "2026-09-29",
    sections: [
      {
        id: "eligibility",
        title: "1. 환불 가능 여부",
        paragraphs: [
          "관련 법령에 따른 소비자의 필수적 법정 권리를 침해하지 않는 범위 내에서, 아하잇츠미 서비스의 디지털 콘텐츠 결제건에 대한 환불 기준은 다음과 같습니다.",
        ],
        listItems: [
          "디지털 콘텐츠 제공 전: AI 분석 보고서 또는 프리미엄 콘텐츠를 생성·열람·이용하지 않은 경우, 구매일로부터 7일 이내 전액 환불이 가능합니다.",
          "디지털 콘텐츠 제공 후: AI 보고서가 정상적으로 생성되어 계정에 제공된 경우, 서비스가 소진된 것으로 간주되어 전자상거래법 및 관련 법령에 따라 단순 변심에 의한 청약철회/환불이 제한될 수 있습니다.",
          "기술적 오류 및 미제공: 시스템 결함이나 기술적 오류로 인해 보고서가 정상 생성되거나 전달되지 않은 경우, 전액 환불 또는 재발급 조치가 제공됩니다.",
          "중복 결제: 시스템 오류 등으로 인해 동일 주문건에 대해 중복 결제가 발생한 경우, 중복 결제 금액은 전액 환불됩니다.",
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
        title: "3. 환불 요청 방법 및 결제 서비스 제공업체 권한",
        paragraphs: [
          "글로벌 주문 건의 결제 및 환불 처리는 당사가 이용하는 제3자 결제 서비스 제공업체를 통해 처리될 수 있으며, 해당 업체가 판매자(Merchant of Record) 역할을 하는 경우 결제 문의, 분쟁, 환불 요청은 관련 법령 및 해당 업체의 약관에 따라 처리됩니다.",
        ],
        listItems: [
          "환불을 원하시면 거래 번호와 함께 support@ahaitsme.com으로 문의하시거나, 결제 영수증에 안내된 고객지원 정보를 이용해 주세요. 필요한 경우 당사가 결제 서비스 제공업체에 요청이 전달되도록 도와드립니다.",
          "결제 서비스 제공업체가 판매자(Merchant of Record) 역할을 하는 경우, 해당 업체는 법정 소비자 권리, 자체 약관 및 기술적 미제공 건에 대해 환불 심사, 승인 및 처리 권한을 가집니다.",
        ],
      },
      {
        id: "processing",
        title: "4. 처리 기간",
        paragraphs: [
          "환불이 승인되면 결제 서비스 제공업체를 통해 처리되며, 결제하신 원래 수단으로 자동 환급됩니다. 이용하시는 금융기관에 따라 명세서에 반영되기까지 영업일 기준 5~10일이 소요될 수 있습니다.",
        ],
      },
    ],
  },
};
