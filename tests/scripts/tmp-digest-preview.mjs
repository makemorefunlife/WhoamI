import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { mapSajuBundleToMasterJson } from "../../lib/personCore/mappers/mapSajuMasterJson.ts";
import { buildRomanticPersonSignalsDigest } from "../../lib/relationship/romanticSajuPromptDigest.ts";

const bundle = calculateSajuBundle({ birthDate: "1990-05-15", birthTime: "14:30" });
const master = mapSajuBundleToMasterJson({
  bundle,
  birthDate: "1990-05-15",
  birthTime: "14:30",
  birthTimeUnknown: false,
});
const digest = buildRomanticPersonSignalsDigest({
  nickname: "테스트",
  birthDate: "1990-05-15",
  birthTime: "14:30",
  birthPlace: "서울",
  master,
});
console.log(digest);
