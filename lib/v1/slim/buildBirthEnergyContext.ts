import { fetchBirthAstrologyText } from "@/lib/v1/slim/fetchBirthAstrology";

export type BirthEnergyParts = {
  astrology: string;
  coord_source: "explicit" | "place_lookup" | "default_seoul" | "unknown";
  birth_place_used: string | null;
};

/** 나에 대한 심화 분석용 — 출생 에너지(점성)만. 관계 맥락은 별도 관계 리포트에서. */
export async function buildBirthEnergyContext(input: {
  birthDate: string;
  birthTime?: string | null;
  birthTimeUnknown?: boolean;
  birthPlace?: string | null;
}): Promise<BirthEnergyParts> {
  const result = await fetchBirthAstrologyText({
    birthDate: input.birthDate,
    birthTime: input.birthTime,
    birthTimeUnknown: input.birthTimeUnknown,
    birthPlace: input.birthPlace,
  });

  return {
    astrology: result.text,
    coord_source: result.coord_source,
    birth_place_used: result.birth_place_used,
  };
}
