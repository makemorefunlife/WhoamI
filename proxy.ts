import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * frontendApiProxy: 브라우저 → localhost/__clerk → Clerk FAPI
 * (clerk.accounts.dev 직접 호출 차단·실패 시 failed_to_load_clerk_js 완화)
 *
 * 클라이언트: AppClerkProvider 가 proxyUrl 설정 (개발 시 자동 /__clerk/)
 */
export const proxy = clerkMiddleware({
  frontendApiProxy: {
    enabled:
      process.env.NODE_ENV === "development" ||
      process.env.CLERK_FRONTEND_API_PROXY === "1",
  },
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
