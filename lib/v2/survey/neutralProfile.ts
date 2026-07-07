import type { CurrentSelfProfile } from "@/lib/v2/survey/types";
import {
  PRIMARY_AXIS_KEYS,
  SECONDARY_AXIS_KEYS,
} from "@/lib/v2/survey/types";

/** 설문 생략 시 관계 분석용 중립 프로필 */
export function buildNeutralV2Profile(): CurrentSelfProfile {
  const primary_axes = Object.fromEntries(
    PRIMARY_AXIS_KEYS.map((k) => [k, 50]),
  ) as CurrentSelfProfile["primary_axes"];
  const secondary_axes = Object.fromEntries(
    SECONDARY_AXIS_KEYS.map((k) => [k, 50]),
  ) as CurrentSelfProfile["secondary_axes"];

  return {
    profile_type: "current_self",
    primary_axes,
    secondary_axes,
    personalization: { primary_concern: null },
    meta: {
      survey_version: "v2",
      completed_at: new Date().toISOString(),
      completion_time_seconds: null,
    },
  };
}
