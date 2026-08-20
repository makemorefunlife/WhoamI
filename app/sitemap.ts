import type { MetadataRoute } from "next";

const CANONICAL_HOST = "https://www.ahaitsme.com";

/** Public, indexable pages only — see docs/gas-optimizer/analysis-plan.html for the audit that drove this scope. */
const PUBLIC_PATHS = [
  { path: "/", priority: 1, changeFrequency: "weekly" as const },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/pricing", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/how-it-works", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/faq", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/refund", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/do-not-sell", priority: 0.2, changeFrequency: "yearly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return PUBLIC_PATHS.map(({ path, priority, changeFrequency }) => {
    const enUrl = `${CANONICAL_HOST}${path}`;
    const koUrl = `${CANONICAL_HOST}/kr${path === "/" ? "" : path}`;
    return {
      url: enUrl,
      lastModified: now,
      changeFrequency,
      priority,
      alternates: {
        languages: {
          en: enUrl,
          ko: koUrl,
        },
      },
    };
  });
}
