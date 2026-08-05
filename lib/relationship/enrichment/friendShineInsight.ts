/**
 * Friend research gap: "When does this friendship work at its best?"
 * Folds into existing snapshot — does not add a new section.
 */
import type { Locale } from "@/lib/i18n/locale";
import { pick, LEGACY_FALLBACK_LOCALE } from "@/lib/relationship/friend/friendCopy";

export function buildFriendShineInsight(params: {
  connectionPct: number;
  banterPct: number;
  riskPct: number;
  hangoutHint?: string | null;
  travelLeadNickname?: string | null;
  locale?: Locale;
}): string {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const { connectionPct, banterPct, riskPct } = params;

  let core: string;
  if (banterPct >= 65 && connectionPct >= 55) {
    core = pick(
      locale,
      "This friendship shines most when you are playing, teasing, or exploring something new together — not when you force a heavy talk.",
      "이 우정은 무거운 대화보다, 같이 놀거나 장난치거나 새로운 걸 탐험할 때 가장 빛나요.",
    );
  } else if (connectionPct >= 65 && banterPct < 50) {
    core = pick(
      locale,
      "This friendship shines in quiet loyalty — being present without performance, especially when one of you is drained.",
      "이 우정은 분위기 메이킹보다, 지쳤을 때 말없이 곁을 지켜주는 순간에 가장 빛나요.",
    );
  } else if (riskPct >= 55) {
    core = pick(
      locale,
      "This friendship works best with clear recovery space after friction — short, concrete check-ins beat long post-mortems.",
      "이 우정은 마찰 뒤 회복 공간을 짧게 확보할 때 가장 잘 작동해요. 긴 사후 분석보다 짧은 확인이 낫습니다.",
    );
  } else {
    core = pick(
      locale,
      "This friendship works best in low-pressure shared time — a walk, a meal, a small plan — rather than constant messaging.",
      "이 우정은 끊임없는 메시지보다, 산책·식사·작은 약속처럼 부담 낮은 함께 있는 시간에 가장 잘 작동해요.",
    );
  }

  const extras: string[] = [];
  if (params.hangoutHint) extras.push(params.hangoutHint);
  if (params.travelLeadNickname) {
    extras.push(
      pick(
        locale,
        `On trips, let ${params.travelLeadNickname} set the route.`,
        `여행·동선은 ${params.travelLeadNickname}이(가) 리드할 때 더 편해져요.`,
      ),
    );
  }

  return extras.length ? `${core} ${extras.join(" ")}` : core;
}
