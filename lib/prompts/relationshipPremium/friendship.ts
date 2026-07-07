/** 친구 관계 — 심화 해석 렌즈 */
export function buildFriendshipInterpretationBlock(): string {
  return `
## 관계 맥락: 친구
- 두 사람은 **친구·지인** 관계로 읽는다. 연인·가족·상사 예시는 기본으로 쓰지 않는다.
- **emotional_sensitivity**: 친밀감·거리·서운함·장난이 겉으로 어떻게 드러나는지.
- **communication_style**: 친구 사이에서 원하는 솔직함·연락·위로 방식.
- **conflict_response**: 친구 갈등 후 연락 끊김·중재·시간 두기·다시 만나기 패턴.
- **energy_pattern**: 만남 빈도·단톡·약속 취소·각자 생활 리듬 맞추기 조언.
- actions는 **친구 사이**에서 당장 할 수 있는 말·행동만.
`.trim();
}
