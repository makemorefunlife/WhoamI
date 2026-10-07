import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDiscoveryRoleText,
  discoveryRoleTextToBody,
} from "../../lib/relationship/map/discoveryRoleText.ts";
import { RELATIONSHIP_ROLES } from "../../lib/relationship/map/relationshipRoleSsot.ts";

const en = {
  discoveryOtherRoleSentence: (n, r) => `${n} is your ${r}.`,
  discoveryViewerRoleSentence: (n, r) => `You are ${n}'s ${r}.`,
};
const ko = {
  discoveryOtherRoleSentence: (n, r) => `${n}님은 당신에게 ${r} 같은 사람이에요.`,
  discoveryViewerRoleSentence: (n, r) => `당신은 ${n}님에게 ${r} 같은 사람이에요.`,
};
const a = RELATIONSHIP_ROLES[0];
const b = RELATIONSHIP_ROLES[1];

test("both directions: sentence + meaning from the SSOT (en-US)", () => {
  const t = buildDiscoveryRoleText({
    locale: "en-US", partnerName: "Mina", roleId: a.roleId, reciprocalRoleId: b.roleId, messages: en,
  });
  assert.equal(t.other.sentence, `Mina is your ${a.labelEn}.`);
  assert.equal(t.other.meaning, a.descriptionEn);
  assert.equal(t.viewer.sentence, `You are Mina's ${b.labelEn}.`);
  assert.equal(t.viewer.meaning, b.descriptionEn);
  const body = discoveryRoleTextToBody(t);
  assert.ok(body.includes(a.descriptionEn) && body.includes(b.descriptionEn));
});

test("ko-KR uses Korean labels and meanings", () => {
  const t = buildDiscoveryRoleText({
    locale: "ko-KR", partnerName: "민아", roleId: a.roleId, reciprocalRoleId: b.roleId, messages: ko,
  });
  assert.equal(t.other.sentence, `민아님은 당신에게 ${a.labelKo} 같은 사람이에요.`);
  assert.equal(t.viewer.meaning, b.descriptionKo);
});

test("one direction missing keeps the other; none -> null; unknown id ignored", () => {
  const only = buildDiscoveryRoleText({
    locale: "en-US", partnerName: "Mina", roleId: a.roleId, reciprocalRoleId: null, messages: en,
  });
  assert.equal(only.viewer, null);
  assert.ok(only.other);
  assert.equal(
    buildDiscoveryRoleText({ locale: "en-US", partnerName: "M", roleId: "nope", reciprocalRoleId: undefined, messages: en }),
    null,
  );
});
