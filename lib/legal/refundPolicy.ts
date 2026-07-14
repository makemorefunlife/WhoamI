import type { PolicyDocument } from "@/lib/legal/types";

/** Refund Policy — sourced from Legal/refund_policy_en.md */
export const refundPolicy: PolicyDocument = {
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
        "You can submit your refund request directly to Paddle support via your email receipt, or contact us at hong@ahaitsme.com with your transaction ID, and we will assist in escalating the request to Paddle.",
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
};
