import type { MetadataRoute } from "next";

const CANONICAL_HOST = "https://www.ahaitsme.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/account",
        "/account/",
        "/blueprint-preview",
        "/blueprint-preview/",
        "/relationship",
        "/relationship/",
        "/relationships",
        "/relationships/",
        "/decision",
        "/decision/",
        "/survey-v2",
        "/survey-v2/",
        "/onboarding",
        "/onboarding/",
        "/dev",
        "/dev/",
        "/api/",
        "/kr/account",
        "/kr/account/",
        "/kr/blueprint-preview",
        "/kr/blueprint-preview/",
        "/kr/relationship",
        "/kr/relationship/",
        "/kr/relationships",
        "/kr/relationships/",
        "/kr/decision",
        "/kr/decision/",
        "/kr/survey-v2",
        "/kr/survey-v2/",
        "/kr/onboarding",
        "/kr/onboarding/",
        "/kr/dev",
        "/kr/dev/",
      ],
    },
    sitemap: `${CANONICAL_HOST}/sitemap.xml`,
    host: CANONICAL_HOST,
  };
}
