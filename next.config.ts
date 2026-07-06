import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
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
    ];
  },
};

export default nextConfig;
