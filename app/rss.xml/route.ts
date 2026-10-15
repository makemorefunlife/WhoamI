import { NextResponse } from "next/server";

export const dynamic = "force-static";

const CANONICAL_HOST = "https://www.ahaitsme.com";

interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

const RSS_ITEMS: RssItem[] = [
  {
    title: "Aha It's me! — 나를 아는 가장 솔직한 여정",
    link: `${CANONICAL_HOST}/kr`,
    description: "설문, 사주·점성학 차트, 관계 분석을 통해 나만의 본래 패턴과 타인과의 연결을 발견하세요.",
    pubDate: new Date("2026-08-01T00:00:00Z").toUTCString(),
  },
  {
    title: "작동 방식 | Aha It's me!",
    link: `${CANONICAL_HOST}/kr/how-it-works`,
    description: "심리학 설문과 동서양 지혜(사주, 점성학)를 통합하여 본래의 나와 관계의 상호작용을 분석하는 원리를 소개합니다.",
    pubDate: new Date("2026-08-01T00:00:00Z").toUTCString(),
  },
  {
    title: "소개 | Aha It's me!",
    link: `${CANONICAL_HOST}/kr/about`,
    description: "Aha It's me!가 지향하는 가치와 나다운 삶, 관계 이해를 돕는 서비스 철학을 소개합니다.",
    pubDate: new Date("2026-08-01T00:00:00Z").toUTCString(),
  },
  {
    title: "가격 안내 | Aha It's me!",
    link: `${CANONICAL_HOST}/kr/pricing`,
    description: "Aha It's me!의 블루프린트 및 심화 관계 리포트 가격 및 혜택 안내.",
    pubDate: new Date("2026-08-01T00:00:00Z").toUTCString(),
  },
  {
    title: "자주 묻는 질문 (FAQ) | Aha It's me!",
    link: `${CANONICAL_HOST}/kr/faq`,
    description: "Aha It's me! 서비스 이용, 설문, 리포트 생성에 관한 자주 묻는 질문과 답변.",
    pubDate: new Date("2026-08-01T00:00:00Z").toUTCString(),
  },
  {
    title: "Aha It's me! — Know yourself",
    link: `${CANONICAL_HOST}`,
    description: "Discover your patterns through surveys, charts, and relationships.",
    pubDate: new Date("2026-08-01T00:00:00Z").toUTCString(),
  },
  {
    title: "How It Works | Aha It's me!",
    link: `${CANONICAL_HOST}/how-it-works`,
    description: "How Aha It's me integrates psychology surveys and eastern/western wisdom to decode patterns.",
    pubDate: new Date("2026-08-01T00:00:00Z").toUTCString(),
  },
  {
    title: "About | Aha It's me!",
    link: `${CANONICAL_HOST}/about`,
    description: "About Aha It's me! and our mission to help you understand yourself and your relationships.",
    pubDate: new Date("2026-08-01T00:00:00Z").toUTCString(),
  },
  {
    title: "Pricing | Aha It's me!",
    link: `${CANONICAL_HOST}/pricing`,
    description: "Pricing plans and detailed reports for self-discovery and relationship insights.",
    pubDate: new Date("2026-08-01T00:00:00Z").toUTCString(),
  },
  {
    title: "FAQ | Aha It's me!",
    link: `${CANONICAL_HOST}/faq`,
    description: "Frequently asked questions about Aha It's me! features, surveys, and reports.",
    pubDate: new Date("2026-08-01T00:00:00Z").toUTCString(),
  },
];

export function buildRssXml(feedUrl: string = `${CANONICAL_HOST}/rss.xml`): string {
  const buildDate = new Date().toUTCString();

  const itemsXml = RSS_ITEMS.map((item) => `    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${item.link}</link>
      <guid isPermaLink="true">${item.link}</guid>
      <description><![CDATA[${item.description}]]></description>
      <pubDate>${item.pubDate}</pubDate>
    </item>`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[Aha It's me!]]></title>
    <link>${CANONICAL_HOST}</link>
    <description><![CDATA[Discover your patterns through surveys, charts, and relationships. / 나를 아는 가장 솔직한 여정]]></description>
    <language>ko</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`.trim();
}

export async function GET() {
  const xml = buildRssXml(`${CANONICAL_HOST}/rss.xml`);

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
    },
  });
}
