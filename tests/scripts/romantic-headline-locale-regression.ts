import {
  DAY_STEM_ROMANTIC_PROFILES,
  DAY_STEM_ROMANTIC_PROFILES_KO,
  formatRomanticEssencePair,
  romanticHeadlineFromProfiles,
} from "@/lib/relationship/dayStemRomanticProfile";
import { joinPersonalityHeadline } from "@/lib/relationship/romanticEverydayText";
import { joinHeadlineLabelsEn } from "@/lib/relationship/romanticHeadline/locale";

const pA = DAY_STEM_ROMANTIC_PROFILES_KO.jeong!;
const pB = DAY_STEM_ROMANTIC_PROFILES_KO.mu!;

const expectedHeadline = "따뜻한 촛불과 듬직한 산";
const expectedPair = "꾸준히 빛나고 따뜻한 A와 듬직하고 안정감 있는 B";
const expectedJoin = "듬직한 산과 따뜻한 촛불";

const h1 = romanticHeadlineFromProfiles(pA, pB);
const pair = formatRomanticEssencePair(pA, "A", pB, "B");
const join = joinPersonalityHeadline("듬직한 산", "따뜻한 촛불");

let ok = true;
function check(name: string, cond: boolean) {
  if (!cond) {
    console.error(`FAIL ${name}`);
    ok = false;
  } else {
    console.log(`OK ${name}`);
  }
}

check("profiles alias", DAY_STEM_ROMANTIC_PROFILES === DAY_STEM_ROMANTIC_PROFILES_KO);
check("headline ko", h1 === expectedHeadline);
check("essence pair ko", pair === expectedPair);
check("join personality ko", join === expectedJoin);

const hEn = romanticHeadlineFromProfiles(
  { ...pA, headlineLabel: "warm candle" },
  { ...pB, headlineLabel: "steadfast mountain" },
  "en",
);
check(
  "headline en",
  hEn === joinHeadlineLabelsEn("warm candle", "steadfast mountain"),
);

if (!ok) process.exit(1);
