export function buildAstrologyContextForLlm(astro: {
  sun: string;
  moon: string;
  rising: string;
}) {
  return `[출생 시점 도식에서 읽히는 세 축 — 최종 글에는 아래 라벨·별자리명을 그대로 쓰지 말 것]
1) 삶에서 자기를 드러내고 추구하는 톤: "${astro.sun}" 계열 기질
2) 안식·감정 반응의 리듬: "${astro.moon}" 계열 기질
3) 낯선 사람에게 먼저 비치는 인상·접근 방식: "${astro.rising}" 계열 기질`;
}
