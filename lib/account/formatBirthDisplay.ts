import { parseBirthDateParts } from "@/lib/report/reportBirthUtils";
import type { BirthV2Session } from "@/lib/v2/onboarding/birthSession";
import { isBirthPlaceFallback } from "@/lib/v2/onboarding/birthFallbackPolicy";
import { parse24hTo12h } from "@/lib/v2/onboarding/birthTime";
import type { Locale } from "@/lib/i18n/locale";
import type { MessageCatalog } from "@/lib/i18n/messages";

export function formatBirthDate(
  iso: string | null | undefined,
  locale: Locale,
  messages: MessageCatalog,
): string {
  const { y, mo, d } = parseBirthDateParts(iso);
  if (!y || !mo || !d) return messages.account.birthDisplayNotEntered;
  return locale === "ko-KR"
    ? `${y}년 ${Number(mo)}월 ${Number(d)}일`
    : `${new Date(Number(y), Number(mo) - 1, Number(d)).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`;
}

export function formatBirthTime(
  birth: BirthV2Session | null | undefined,
  locale: Locale,
  messages: MessageCatalog,
): string {
  if (!birth?.birthDate) return messages.account.birthDisplayNotEntered;
  if (birth.birthTimeUnknown || !birth.birthTime?.trim()) {
    return messages.account.birthDisplayTimeUnknown;
  }
  const parsed = parse24hTo12h(birth.birthTime);
  if (!parsed) return birth.birthTime;
  const period =
    parsed.period === "am" ? messages.birthForm.amLabel : messages.birthForm.pmLabel;
  return locale === "ko-KR"
    ? `${period} ${parsed.hour}:${parsed.minute}`
    : `${parsed.hour}:${parsed.minute} ${period}`;
}

export function formatBirthPlace(
  place: string | null | undefined,
  placeUnknown: boolean | undefined,
  messages: MessageCatalog,
): string {
  const trimmed = place?.trim();
  if (!trimmed) return messages.account.birthDisplayNotEntered;
  if (placeUnknown || isBirthPlaceFallback(trimmed)) {
    return `${trimmed}${messages.account.birthDisplayPlaceFallbackSuffix}`;
  }
  return trimmed;
}
