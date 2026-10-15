import { buildRssXml } from "../rss.xml/route";

export const dynamic = "force-static";

const CANONICAL_HOST = "https://www.ahaitsme.com";

export async function GET() {
  const xml = buildRssXml(`${CANONICAL_HOST}/feed.xml`);

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
    },
  });
}
