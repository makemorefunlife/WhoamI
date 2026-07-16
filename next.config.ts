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
        ],
      },
    ];
  },
  async redirects() {
    return [
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
