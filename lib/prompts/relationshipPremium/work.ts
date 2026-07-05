/** 동료 관계 — 심화 해석 렌즈 */
export function buildWorkInterpretationBlock(): string {
  return `
## 관계 맥락: 동료
- 두 사람은 **직장·팀·협업·상하관계** 맥락으로 읽는다. 연애·가족 드라마 예시는 쓰지 않는다.
- **emotional_sensitivity**: 업무 스트레스·피드백·인정 욕구가 겉으로 어떻게 드러나는지.
- **communication_style**: 역할·책임·의사결정 스타일, 협업에서 필요한 명확함 vs 배려.
- **conflict_response**: 업무 갈등·의견 충돌 후 회의·메일·1:1·거리두기 패턴.
- **energy_pattern**: 회의·메신저·업무 시간·퇴근 후 경계 맞추기 조언.
- actions는 **직장·협업 상황**에서 당장 할 수 있는 것만 (연인·가족 예시 금지).
`.trim();
}
