import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  polishKoTableCell,
  polishKoTone,
} from "../../lib/i18n/koToneGuards.ts";

describe("koToneGuards — legacy cached romantic cells", () => {
  it("converts plain endings and strips dash macro residue", () => {
    const { text } = polishKoTableCell(
      "감정 표현이 균형 잡혀 있으며, 동글에게 자신의 감정을 잘 전달하는 편이다 — 편으로 보일 수 있으며, 실제 관계에서 확인해 볼 부분이다.",
    );
    assert.match(text, /편이에요/);
    assert.doesNotMatch(text, /편이다/);
    assert.doesNotMatch(text, /[—–ㅡ]/);
    assert.doesNotMatch(text, /편으로\s*보일\s*수\s*있으며/);
  });

  it("converts 경향이 있다 to haeyo-che", () => {
    const { text } = polishKoTone(
      "감정 표현이 다 내성적이며 신중하게 접근하는 경향이 있다.",
    );
    assert.match(text, /경향이 있어요/);
    assert.doesNotMatch(text, /경향이 있다/);
  });

  it("leaves empty-cell dash placeholders alone", () => {
    const { text, fixed } = polishKoTableCell("—");
    assert.equal(text, "—");
    assert.equal(fixed, false);
  });
});
