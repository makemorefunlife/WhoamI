import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Builds the canonical + hreflang alternates + OG/Twitter block shared by every
 * public page's generateMetadata(). `path` is the locale-agnostic route (e.g. "/about").
 */
export function buildPageMetadata(params: {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  imageUrl?: string;
  robots?: Metadata["robots"];
}): Metadata {
  const { locale, path, title, description, imageUrl, robots } = params;
  const enPath = path === "/" ? "/" : path;
  const koPath = path === "/" ? "/kr" : `/kr${path}`;
  const canonical = locale === "ko-KR" ? koPath : enPath;

  const images = imageUrl ? [imageUrl] : undefined;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: enPath,
        ko: koPath,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: images ? "summary_large_image" : undefined,
      title,
      description,
      ...(images ? { images } : {}),
    },
    ...(robots ? { robots } : {}),
  };
}
