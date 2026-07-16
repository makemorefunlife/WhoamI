"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

type Props = Omit<ComponentProps<typeof NextLink>, "href"> & {
  href: string;
  /** If true, do not apply locale prefix (rare escape hatch) */
  skipLocale?: boolean;
};

/** Drop-in Link that prefixes `/kr` for ko-KR and keeps EN unprefixed. */
export default function LocaleLink({
  href,
  skipLocale = false,
  ...rest
}: Props) {
  const { href: localize } = useLocale();
  const resolved = skipLocale ? href : localize(href);
  return <NextLink href={resolved} {...rest} />;
}
