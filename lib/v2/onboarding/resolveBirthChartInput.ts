/** 사주·점성 차트 공통 — 출생 시각 해석 */
export function resolveBirthTimeForCharts(input: {
  birthTime?: string | null;
  birthTimeUnknown?: boolean;
}): { chartTime: string; birthTimeUnknown: boolean } {
  const birthTimeUnknown =
    input.birthTimeUnknown === true || !input.birthTime?.trim();
  return {
    birthTimeUnknown,
    chartTime: birthTimeUnknown ? "12:00" : input.birthTime!.trim(),
  };
}

export function hasBirthPlaceForAstrology(
  birthPlace?: string | null,
): boolean {
  return Boolean(birthPlace?.trim());
}
