import type { PolicyDocument } from "@/lib/legal/types";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Refund Policy.
 *
 * en-US and ko-KR intentionally differ (2026-10-07): the US catalog has the
 * 30-Day Insight Pass + 12-Month Membership + $9.99 Additional Relationship,
 * the KR catalog has Personal / Relationship / Relationship Triple / 30-Day
 * Insight Pass only. en-US text is the 2026-10-07 policy supplied by Sera;
 * ko-KR section 2 ("서비스 제공 기간 및 결제 방식") replaced the old
 * "구독 해지" section on the same date. Have both reviewed for legal accuracy.
 *
 * Wording here must match what the credit engine actually does (see
 * process_us_purchase / process_kr_purchase). Known gaps as of 2026-10-07
 * are tracked in docs/dev/decisions/2026-10-07_pricing_refund_policy_gaps.md.
 */
export const refundPolicy: Record<Locale, PolicyDocument> = {
  "en-US": {
    title: "Refund Policy",
    description:
      "Thank you for using Aha It's me. We offer individual AI-generated reports, a 30-Day Insight Pass, and a 12-Month Membership. This policy explains each product's validity period and refund terms.",
    lastUpdated: "2026-10-07",
    sections: [
      {
        id: "service-periods",
        title: "1. Payment and Service Periods",
        paragraphs: [
          "All products are one-time purchases. We do not automatically renew your access or charge you again when a pass or membership expires.",
        ],
        listItems: [
          "Personal and Relationship reports: Each purchase includes one report generation credit, valid for 12 months from the purchase date.",
          "30-Day Insight Pass: Includes one Personal report, one Relationship report, and unlimited Decision Journal access for 30 days from the purchase date. Both reports must be generated during this period.",
          "12-Month Membership: Begins on the purchase date and provides membership benefits for 12 months. It includes one Personal report, two Relationship reports per membership month, two Personal report gift coupons issued at purchase, and unlimited Decision Journal access. Unused monthly Relationship credits do not roll over.",
          "Gift coupons: Membership gift coupons must be redeemed and used to generate a report before the membership expires.",
          "Additional Relationship reports: Reports purchased separately for $9.99 each include one generation credit valid for 12 months from their purchase date.",
        ],
        closingParagraphs: [
          "Generation credits expire at the end of their stated validity period. Reports successfully generated before expiration remain available for viewing in your account, subject to our Terms of Service.",
        ],
      },
      {
        id: "individual-reports",
        title: "2. Individual Report Refunds",
        paragraphs: [
          "For Personal, Relationship, and separately purchased additional Relationship reports:",
        ],
        listItems: [
          "Before generation: You may request a full refund within seven days of purchase if the purchased credit has not been used to generate a report.",
          "After delivery: We do not offer change-of-mind refunds once the report has been successfully generated and delivered to your account.",
          "After seven days: Unused credits remain valid for their stated validity period, but change-of-mind refunds are not offered under this policy.",
        ],
        closingParagraphs: [
          "Technical failures, duplicate charges, and mandatory consumer rights are addressed below.",
        ],
      },
      {
        id: "insight-pass",
        title: "3. 30-Day Insight Pass Refunds",
        paragraphs: [
          "You may request a full refund within seven days of purchase if you have not generated either included report or used any paid Decision Journal features.",
          "Once an included report has been generated or a paid Decision Journal feature has been used, we do not offer change-of-mind or partial refunds for the pass.",
          "The pass expires 30 days after purchase and does not renew automatically.",
          "Technical failures, duplicate charges, and mandatory consumer rights are addressed below.",
        ],
      },
      {
        id: "membership",
        title: "4. 12-Month Membership Cancellation and Refunds",
        paragraphs: [
          "You may request early cancellation by emailing support@ahaitsme.com.",
          "If you request cancellation within seven days of purchase and neither you nor a gift recipient has used any included benefit, you are eligible for a full refund.",
          "Otherwise, we provide a prorated refund for the unused membership period:",
          "Refund amount = membership price paid × unused membership days ÷ total membership days.",
          "We use the date we receive your cancellation request as the cancellation date. Refunds are calculated using calendar days and rounded to the nearest cent.",
          "When cancellation takes effect:",
        ],
        listItems: [
          "Membership benefits and paid Decision Journal access end.",
          "Unused membership report credits and unredeemed gift coupons are canceled.",
          "Gift credits already redeemed but not used to generate a report are canceled.",
          "Reports already generated remain available in the relevant account.",
        ],
        closingParagraphs: [
          "Reports and gift coupons already used are not deducted separately from the time-based refund. Unused credits from past membership months do not increase the refund amount.",
          "Additional Relationship reports purchased separately are governed by Section 2 and are not included in the membership refund calculation.",
        ],
      },
      {
        id: "technical-errors",
        title: "5. Technical Errors and Duplicate Charges",
        paragraphs: [],
        listItems: [
          "Report non-delivery: If a technical failure prevents a purchased report from being generated or delivered, contact us. We will restore the credit or reissue the report at no additional cost. If we cannot provide the report, we will refund the affected purchase or the portion attributable to the undelivered report.",
          "Pass or membership access failures: If a technical failure prevents access to paid features, contact us. We will investigate and provide an appropriate remedy, which may include restoring access, extending the access period, or refunding the affected portion.",
          "Duplicate charges: Duplicate payments for the same order will be refunded in full.",
        ],
      },
      {
        id: "request",
        title: "6. How to Request a Refund",
        paragraphs: ["Email support@ahaitsme.com with:"],
        listItems: [
          "The email address used for the purchase",
          "Your order or transaction ID",
          "The product purchased",
          "The reason for your request",
        ],
        closingParagraphs: [
          "Aha It's me reviews refund requests under this policy. Approved refunds are processed through our payment service provider to the original payment method.",
        ],
      },
      {
        id: "processing",
        title: "7. Processing Time",
        paragraphs: [
          "Once approved, refunds are submitted to our payment service provider. It may take five to ten business days for the refund to appear on your statement, depending on the payment method and financial institution.",
        ],
      },
      {
        id: "consumer-rights",
        title: "8. Consumer Rights",
        paragraphs: [
          "This policy does not limit any mandatory consumer rights under applicable law. Where applicable law requires a refund or other remedy beyond this policy, those requirements take precedence.",
        ],
      },
    ],
  },
  "ko-KR": {
    title: "환불 정책",
    description:
      "아하잇츠미(Aha It's me)를 이용해 주셔서 감사합니다. 본 서비스는 생성 즉시 제공되는 디지털 AI 분석 보고서를 다루는 특성상, 공정성과 투명성을 위해 다음과 같은 환불 정책을 운영합니다.",
    lastUpdated: "2026-10-07",
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
        id: "service-periods",
        title: "2. 서비스 제공 기간 및 결제 방식",
        paragraphs: [
          "한국에서 판매하는 모든 유료 상품은 일회성 결제 상품이며, 정기결제 또는 자동 갱신되지 않습니다.",
        ],
        listItems: [
          "Personal 및 Relationship: 구매일로부터 12개월 이내에 심화 분석 보고서 1회를 생성할 수 있습니다.",
          "Relationship Triple: 구매일로부터 12개월 이내에 관계 심화 분석 보고서를 총 3회 생성할 수 있습니다.",
          "30-Day Insight Pass: 구매일로부터 30일간 Personal 심화 분석 1회, Relationship 심화 분석 1회 및 Decision Journal 무제한 이용이 제공됩니다.",
        ],
        closingParagraphs: [
          "분석 생성권의 사용 기한과 생성된 보고서의 재열람은 구분됩니다. 생성된 보고서는 계정에서 다시 열람할 수 있습니다.",
          "환불 가능 여부와 기준은 본 정책의 제1항에 따릅니다.",
        ],
      },
      {
        id: "request",
        title: "3. 환불 요청 방법 및 결제 서비스 제공업체 권한",
        paragraphs: [
          "글로벌 주문 건의 결제 및 환불 처리는 당사가 이용하는 제3자 결제 서비스 제공업체를 통해 처리될 수 있으며, 해당 업체가 판매자(Merchant of Record) 역할을 하는 경우 결제 문의, 분쟁, 환불 요청은 관련 법령 및 해당 업체의 약관에 따라 처리됩니다.",
        ],
        listItems: [
          "환불을 원하시면 거래 번호와 함께 contact@ahaitsme.com으로 문의하시거나, 결제 영수증에 안내된 고객지원 정보를 이용해 주세요. 필요한 경우 당사가 결제 서비스 제공업체에 요청이 전달되도록 도와드립니다.",
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
