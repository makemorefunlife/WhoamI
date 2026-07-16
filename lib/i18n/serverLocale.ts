import { headers, cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_HEADER,
  normalizeLocale,
  type Locale,
} from "@/lib/i18n/locale";

/** Resolve locale in Server Components / layouts (middleware sets header + cookie). */
export async function getRequestLocale(): Promise<Locale> {
  const h = await headers();
  const fromHeader = h.get(LOCALE_HEADER);
  if (fromHeader) return normalizeLocale(fromHeader);

  const jar = await cookies();
  const fromCookie = jar.get(LOCALE_COOKIE)?.value;
  if (fromCookie) return normalizeLocale(fromCookie);

  return DEFAULT_LOCALE;
}
