import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Report-Only while we confirm the allowlist against real Clerk/Paddle/Supabase
          // traffic in production. Promote to `Content-Security-Policy` once a deploy
          // shows no unexpected violation reports.
          {
            key: "Content-Security-Policy-Report-Only",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.com https://js.paddle.com https://cdn.paddle.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://*.supabase.co https://api.openai.com https://vitals.vercel-insights.com",
              "frame-src https://*.clerk.accounts.dev https://buy.paddle.com https://checkout.paddle.com",
              "object-src 'none'",
              "base-uri 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "ahaitsme.com" }],
        destination: "https://www.ahaitsme.com/:path*",
        permanent: true,
      },
      {
        source: "/blueprint-preview/:reportId/innate",
        destination: "/blueprint-preview/:reportId/essence",
        permanent: true,
      },
      {
        source: "/blueprint-preview/:reportId/innate/deep",
        destination: "/blueprint-preview/:reportId/essence/deep",
        permanent: true,
      },
      {
        source: "/api/v2/lite/innate",
        destination: "/api/v2/lite/essence",
        permanent: true,
      },
      {
        source: "/api/v2/deep/innate",
        destination: "/api/v2/deep/essence",
        permanent: true,
      },
      {
        source: "/report",
        destination: "/blueprint-preview",
        permanent: false,
      },
      {
        source: "/dashboard",
        destination: "/",
        permanent: false,
      },
      {
        source: "/result",
        destination: "/blueprint-preview",
        permanent: false,
      },
      {
        source: "/survey",
        destination: "/survey-v2",
        permanent: false,
      },
      {
        source: "/payment",
        destination: "/pricing",
        permanent: false,
      },
      {
        source: "/relationship",
        destination: "/relationships",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
