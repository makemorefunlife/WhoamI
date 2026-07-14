import type { PolicyDocument } from "@/lib/legal/types";

/** Privacy Policy — sourced from Legal/privacy_policy_en.md */
export const privacyPolicy: PolicyDocument = {
  title: "Privacy Policy",
  description:
    'Aha It\'s me ("we," "us," or "the Company") processes personal data in accordance with applicable laws, including the Korean Personal Information Protection Act (PIPA), the EU General Data Protection Regulation (GDPR), and the California Consumer Privacy Act (CCPA).',
  lastUpdated: "2026-07-15",
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
        "Automatically Collected Information: IP address, browser/device information, usage logs, and cookies collected during your visits.",
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
        "Data Protection: We transmit this data via secure API connections. Under our agreement with OpenAI, the submitted data is used solely for generating your report and is not used to train OpenAI’s public AI models.",
      ],
    },
    {
      id: "processors",
      title: "4. Sharing & Data Transfers (Processors)",
      paragraphs: [
        "To host, secure, and operate our Service, your personal data is transferred to and stored by the following global cloud providers:",
        "Where required under applicable data protection laws (such as GDPR), these international transfers are conducted based on Standard Contractual Clauses (SCCs) and robust technical safeguards.",
      ],
      listItems: [
        "Vercel (USA / Global) — Application hosting and distribution",
        "Supabase (USA / Global) — Secure database hosting and storage",
        "Clerk (USA / Global) — User authentication and identity management",
        "Paddle (UK / USA / Global) — Payment processing and merchant services",
        "OpenAI (USA) — AI-based analysis report generation",
      ],
    },
    {
      id: "rights",
      title: "5. Your Rights",
      paragraphs: [
        "Regardless of your location, you have the right to request access, correction, deletion, or restriction of the processing of your personal information. You may exercise these rights at any time by contacting us at hong@ahaitsme.com.",
      ],
    },
    {
      id: "california",
      title: "6. California Residents",
      paragraphs: [
        "We do not sell or share your personal information with third parties for cross-context behavioral advertising. California residents have specific rights under the CCPA (and CalOPPA) to request details about the personal data collected, request deletion, and opt-out of potential sales. To exercise these rights, please contact hong@ahaitsme.com.",
      ],
    },
    {
      id: "children",
      title: "7. Children's Privacy",
      paragraphs: [
        "The Service is not intended for children under 13, and we do not knowingly collect personal information from children under 13. If we learn we have collected such info, we will delete it immediately.",
      ],
    },
    {
      id: "retention",
      title: "8. Data Retention",
      paragraphs: [
        "We retain your personal data for as long as your account is active. Upon account deletion, your data will be immediately deleted or anonymized, except where longer retention is required for legal, tax, or dispute-resolution purposes under applicable local laws (such as the Korean Act on Consumer Protection in Electronic Commerce).",
      ],
    },
    {
      id: "contact",
      title: "9. Contact",
      paragraphs: [
        "Company Name: Aha It's me",
        "Address: Hangangro-dong, Yongsan-gu, Seoul, Republic of Korea",
        "Email: hong@ahaitsme.com",
      ],
    },
  ],
};
