import type { PolicyDocument } from "@/lib/legal/types";

/** Terms of Service — sourced from Legal/terms_of_service_en.md */
export const termsOfService: PolicyDocument = {
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
};
