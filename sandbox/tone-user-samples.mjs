import { polishKoTableCell } from "../lib/i18n/koToneGuards.ts";

const samples = [
  "감정 표현이 다 내성적이며 신중하게 접근하는 경향이 있다.",
  "감정 표현이 균형 잡혀 있으며, 동글에게 자신의 감정을 잘 전달하는 편이다 — 편으로 보일 수 있으며, 실제 관계에서 확인해 볼 부분이다.",
  "갈등 상황에서 원칙을 고수하려는 태도를 보이며, 감정적인 반응보다 이성적인 접근을 선호한다 — 편으로 보일 수 있으며, 실제 관계에서 확인해 볼 부분이다.",
];

for (const s of samples) {
  const r = polishKoTableCell(s);
  console.log("IN :", s);
  console.log("OUT:", r.text);
  console.log("fixed:", r.fixed);
  console.log("---");
}
