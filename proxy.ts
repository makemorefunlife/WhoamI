import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { ROUTES } from "@/constants/routes";

const isAccountRoute = createRouteMatcher([`${ROUTES.account}(.*)`]);

/**
 * Next 16+는 middleware.ts 대신 proxy.ts 사용.
 * 전역에서는 로그인 여부만 가볍게 가드하고, 데이터 판정은 페이지/API에서 처리한다.
 */
export const proxy = clerkMiddleware(async (auth, req) => {
  if (isAccountRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
