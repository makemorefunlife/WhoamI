/** 연인 관계 — 심화 해석 렌즈 (프롬프트 본문은 여기서 확장) */
export function buildRomanticInterpretationBlock(): string {
  return `
## 관계 맥락: 연인
- 두 사람은 **연인·배우자·썸** 관계로 읽는다. 친구·직장·가족 역할 예시는 쓰지 않는다.
- **emotional_sensitivity**: 애정 표현·거리감·질투·확인 욕구가 겉으로 어떻게 드러나는지.
- **communication_style**: 사랑받고 싶은 방식, 거절·침묵에 대한 두려움, 기대하는 대화 톤.
- **conflict_response**: 싸운 뒤 화해·연락·스킨십·시간 두기 패턴.
- **energy_pattern**: 데이트·연락 빈도·혼자만의 시간·침실·일상 리듬 맞추기 조언.
- actions는 **오늘 당장 연인 사이에서** 할 수 있는 말·행동만 (업무·가족 행사 예시 금지).
`.trim();
}
