import type { MetadataRoute } from "next";

/**
 * Next.js App Router native manifest route — served at /manifest.webmanifest
 * and auto-linked into <head> by Next, no manual <link rel="manifest"> needed.
 * Reuses the existing brand icons (app/icon.png is already 512x512) rather
 * than generating new assets.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aha It's me! — Know yourself",
    short_name: "Aha It's me!",
    description: "Discover your patterns through surveys, charts, and relationships.",
    start_url: "/",
    display: "standalone",
    background_color: "#fffdf8",
    theme_color: "#1a382c",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
