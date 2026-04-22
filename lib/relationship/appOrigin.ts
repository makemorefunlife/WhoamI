/** 서버 라우트에서 동일 오리진 API 호출용 */
export function getAppOrigin(): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "").trim();
  if (site) return site;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://127.0.0.1:3000";
}
