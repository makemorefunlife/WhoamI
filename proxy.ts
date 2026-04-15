import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Next.js 16+ `proxy.ts` — Vercel 등 일부 환경에서 `default`만으로는
 * 핸들러가 잡히지 않는 경우가 있어, 공식 문서에 맞춰 `proxy` 이름으로 export 합니다.
 * (동일 로직: https://github.com/clerk/clerk-nextjs-app-quickstart/blob/main/proxy.ts)
 */
export const proxy = clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
