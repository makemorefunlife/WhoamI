import test from "node:test";
import assert from "node:assert/strict";

import {
  topicParticle,
  subjectParticle,
  objectParticle,
  withParticle,
  sanitizeKoreanParticles,
} from "../../lib/relationship/koreanParticles.ts";
import {
  resolveBilateralPartnerPreferenceMatchFromCe,
} from "../../lib/relationship/romantic/prototypeV4/spousePalaceMatcher.ts";
import {
  composeCanonicalSectionNarratives,
} from "../../lib/relationship/romantic/prototypeV4/composeCanonicalSectionNarratives.ts";
import { getTenGodRomanticProfile } from "../../lib/relationship/romantic/tenGodRomanticProfiles.ts";

test("Korean Particle Helpers and Sanitizer", () => {
  // Test topic particle (은/는)
  assert.equal(topicParticle("지민"), "지민은");
  assert.equal(topicParticle("정우"), "정우는");

  // Test subject particle (이/가)
  assert.equal(subjectParticle("지민"), "지민이");
  assert.equal(subjectParticle("정우"), "정우가");

  // Test object particle (을/를)
  assert.equal(objectParticle("지민"), "지민을");
  assert.equal(objectParticle("정우"), "정우를");

  // Test with particle (과/와)
  assert.equal(withParticle("지민"), "지민과");
  assert.equal(withParticle("정우"), "정우와");

  // Test sanitizer replacements
  const dirty1 = "지민는 정우을 만났습니다.";
  const cleaned1 = sanitizeKoreanParticles(dirty1, ["지민", "정우"]);
  assert.equal(cleaned1, "지민은 정우를 만났습니다.");

  const dirty2 = "정우이 지민과 함께 결정을 내렸습니다.";
  const cleaned2 = sanitizeKoreanParticles(dirty2, ["지민", "정우"]);
  assert.equal(cleaned2, "정우가 지민과 함께 결정을 내렸습니다.");
});

test("Bilateral Partner Preference Match & Attraction Narrative Unit Generation", () => {
  const matchAtoB = resolveBilateralPartnerPreferenceMatchFromCe({
    seekerCe: {
      personId: "a",
      name: "지민",
      dayMaster: { stemCode: "gap", stemElement: "wood", dayBranchCode: "jin" },
      fiveElementStructure: { dominantElement: "wood" },
      spousePalaceProfile: {
        personId: "a",
        personName: "지민",
        dayBranchCode: "jin",
        dayBranchElement: "earth",
        tenGodCode: "siksin",
        tenGodName: "식신",
        tenGodFamily: "식상 (표현·창작)",
        profile: getTenGodRomanticProfile("siksin"),
        partnerExpectation: "자신의 부드러운 호의와 유머를 편안하게 받아주고, 소소한 일상을 함께 즐길 수 있는 여유롭고 다정한 파트너",
        intimateNeed: "통제나 강요 없이 스스로의 온전한 속도대로 쉬고 표현할 수 있는 심리적 자유로움",
        distortionWhenStressed: "갈등 상황에서 즉각 대면하기보다 편안함에 안주하거나 문제를 뒤로 미루며 회피할 수 있음",
        provenance: {
          evidenceId: "chart.a.pillars.day.branch_ten_god",
          source: "personal_saju_chart",
          sourcePath: "pillars.day.branch_ten_god.siksin",
          confidence: "deterministic",
        },
      },
    },
    partnerCe: {
      personId: "b",
      name: "정우",
      dayMaster: { stemCode: "geng", stemElement: "metal", dayBranchCode: "zi" },
      fiveElementStructure: { dominantElement: "water" },
    },
    seekerId: "a",
    partnerId: "b",
    seekerName: "지민",
    partnerName: "정우",
  });

  assert.ok(matchAtoB);
  assert.equal(matchAtoB.seekerSpousePalace.tenGodCode, "siksin");
  assert.equal(matchAtoB.matchStrength, "strong");

  // Check narrativeUnit
  const unit = matchAtoB.narrativeUnit;
  assert.ok(unit);
  assert.equal(unit.subject, "a_to_b");
  assert.ok(unit.recognition.length > 0);
  assert.ok(unit.emotionalMeaning.length > 0);
  assert.ok(unit.partnerEvidence.length > 0);
  assert.ok(unit.scene.length > 0);
  assert.ok(unit.pairSpecificEffect.length > 0);
  assert.ok(unit.tensionBridge.length > 0);

  // Jargon ban check: No fortune telling keywords in user-facing unit fields
  const forbiddenKeywords = ["배우자궁", "십성", "육합", "합충", "사주팔자", "살이 끼어", "운명적으로"];
  const combinedText = [
    unit.recognition,
    unit.emotionalMeaning,
    ...unit.partnerEvidence,
    unit.scene,
    unit.pairSpecificEffect,
    unit.tensionBridge,
  ].join(" ");

  for (const kw of forbiddenKeywords) {
    assert.equal(
      combinedText.includes(kw),
      false,
      `User-facing attraction narrative contains forbidden jargon: ${kw}`,
    );
  }
});

test("Section Narrative Composition for Attraction Chapter", () => {
  const dummyPlan = {
    schemaVersion: "romantic_story_plan_v1",
    locale: "ko-KR",
    reportYear: 2026,
    names: { a: "지민", b: "정우" },
    relationshipDefinition: "서로에게 깊은 영감을 주는 관계",
    bondMode: "상호 보완적 결합",
    growthOrStability: "안정과 성장",
    primaryTension: "속도 차이",
    specialCodePreview: "",
    connectedEvidenceIds: ["attr.a", "attr.b"],
    attraction: {
      aSeeks: {
        seeker: "a",
        seeksInPartner: "지민은 일상의 편안함을 바랍니다.",
        partnerMatchPoint: "정우의 든든한 안정감이 지민을 편안하게 만듭니다.",
        provenance: [{ evidenceId: "ev_a", source: "saju", sourcePath: "a", target: "a", confidence: "high", reasonType: "direct_evidence" }],
      },
      bSeeks: {
        seeker: "b",
        seeksInPartner: "정우는 서로를 존중하는 관계를 바랍니다.",
        partnerMatchPoint: "지민의 다정한 배려가 정우에게 큰 신뢰를 줍니다.",
        provenance: [{ evidenceId: "ev_b", source: "saju", sourcePath: "b", target: "b", confidence: "high", reasonType: "direct_evidence" }],
      },
      uniqueCombination: "두 사람이 함께할 때 일상의 안정감이 극대화됩니다.",
      flipsToConflictWhen: "서로의 기대치가 어긋날 때 침묵으로 이어질 수 있습니다.",
      units: {
        aToB: {
          subject: "a_to_b",
          recognition: "지민은 정우의 묵묵한 태도에서 깊은 안도감을 느낍니다.",
          emotionalMeaning: "언제나 한결같이 자리를 지켜주는 든든함을 발견하기 때문입니다.",
          partnerEvidence: ["정우가 보여주는 든든한 보호와 명확한 방향 제시"],
          scene: "복잡한 하루 끝에 정우와 마주 앉아 조용히 대화를 나눌 때",
          pairSpecificEffect: "불안을 내려놓고 온전한 쉼을 얻을 수 있는 심리적 안전지대를 형성합니다.",
          tensionBridge: "지민의 편안한 속도감이 정우의 빠른 결정 요구와 엇갈릴 때 답답함으로 바뀔 수 있습니다.",
          evidenceIds: ["ev_a"],
          confidence: "high",
          usedClaims: [],
        },
        bToA: {
          subject: "b_to_a",
          recognition: "정우는 지민의 다정하고 유연한 표현에 마음이 누그러집니다.",
          emotionalMeaning: "스스로 엄격해지기 쉬운 일상에 따뜻한 여유를 불어넣어 주기 때문입니다.",
          partnerEvidence: ["지민이 보여주는 따뜻한 배려와 긍정적인 안정감"],
          scene: "정우가 긴장해 있을 때 지민이 가벼운 농담과 따뜻한 미소로 분위기를 풀어주는 순간",
          pairSpecificEffect: "경직된 원칙에서 벗어나 서로에게 한층 부드럽게 다가갈 수 있는 유연성을 제공합니다.",
          tensionBridge: "지민의 여유로운 태도가 정우에게 진지함의 결여로 비춰질 때 오해가 생길 수 있습니다.",
          evidenceIds: ["ev_b"],
          confidence: "high",
          usedClaims: [],
        },
        mutual: {
          subject: "mutual",
          recognition: "지민과 정우가 마주할 때 비로소 만들어지는 특별한 정서적 공명과 몰입감이 존재합니다.",
          emotionalMeaning: "혼자 있을 때는 경험하기 힘든 깊은 안도감과 정서적 활력이 두 사람의 만남을 통해 하나의 온전한 흐름으로 완성됩니다.",
          partnerEvidence: ["바깥에서보다 둘만 있는 사적 공간에서 훨씬 큰 안정감을 느낍니다."],
          scene: "세상의 분주함을 뒤로하고 둘만의 공간에서 대화를 시작할 때 서로의 생각이 자연스럽게 포개어지는 순간",
          pairSpecificEffect: "서로의 빈틈을 감싸 안으며, 어떤 어려움 앞에서도 둘만의 깊은 결속을 유지하는 회복 탄력성을 만들어냅니다.",
          tensionBridge: "처음의 편안함이 익숙해질수록 사소한 생활 습관의 차이가 서운함으로 번질 수 있습니다.",
          evidenceIds: ["ev_mutual"],
          confidence: "high",
          usedClaims: [],
        },
      },
      provenance: [{ evidenceId: "ev_attr", source: "saju", sourcePath: "pair", target: "pair", confidence: "high", reasonType: "direct_evidence" }],
    },
    faces: [],
    recurringLoop: {
      triggerScene: "중요한 일정 조율",
      steps: ["의견 차이 발생", "서로 침묵"],
      residue: "",
      provenance: [{ evidenceId: "ev_loop", source: "saju", sourcePath: "pair", target: "pair", confidence: "high", reasonType: "direct_evidence" }],
    },
    topDifferences: [],
    stabilizingSimilarities: [],
    allAxes: [],
    bilateralChanges: [],
    sharedStrength: "",
    sharedVulnerability: "",
    pairChemistry: {
      combinationLabel: "",
      intimacyFeel: "",
      socialOrPracticalFeel: "",
      flipsWhenExcess: "",
      healthyCondition: "",
      provenance: [],
      available: false,
    },
    misreads: [],
    hiddenHearts: [],
    repair: {
      sequence: [],
      helpsA: [],
      helpsB: [],
      provenance: [],
    },
    horizon: [],
    takeaways: { forA: "", forB: "", question: "" },
    choiceCommitments: { microHabitA: "", microHabitB: "", sharedAgreement: "" },
  };

  const sections = composeCanonicalSectionNarratives(dummyPlan);
  const attractionSection = sections.find((s) => s.chapterId === "c2_attraction");
  assert.ok(attractionSection);
  assert.equal(attractionSection.blocks.length, 3);

  const blockA = attractionSection.blocks.find((b) => b.blockId === "attr.a");
  const blockB = attractionSection.blocks.find((b) => b.blockId === "attr.b");
  const blockUnique = attractionSection.blocks.find((b) => b.blockId === "attr.unique");

  assert.ok(blockA);
  assert.ok(blockB);
  assert.ok(blockUnique);

  assert.equal(blockA.title, "지민이 끌리는 지점");
  assert.equal(blockB.title, "정우가 끌리는 지점");
  assert.equal(blockUnique.title, "둘 사이에서만 나타나는 특별한 시너지");

  assert.ok(blockA.body.includes("대표적인 순간:"));
  assert.ok(blockA.body.includes("주의할 지점:"));
  assert.ok(blockB.body.includes("대표적인 순간:"));
  assert.ok(blockB.body.includes("주의할 지점:"));
  assert.ok(blockUnique.body.includes("가장 강했던 끌림이 긴장으로 바뀔 때:"));
});

test("Canonical Meaning Survival & Non-Destructive Provenance Trace", () => {
  const tenGodList = [
    "bigyeon",
    "geopjae",
    "siksin",
    "sanggwan",
    "pyeonjae",
    "jeongjae",
    "pyeongwan",
    "jeonggwan",
    "pyeonin",
    "jeongin",
  ];

  // 1. All 10 Ten Gods generate distinct, non-overlapping partner expectations & scenes
  const descriptions = new Set();
  for (const code of tenGodList) {
    const match = resolveBilateralPartnerPreferenceMatchFromCe({
      seekerCe: {
        personId: "a",
        name: "지민",
        dayMaster: { stemCode: "gap", stemElement: "wood", dayBranchCode: "in" },
        fiveElementStructure: { dominantElement: "wood" },
        spousePalaceProfile: {
          personId: "a",
          personName: "지민",
          dayBranchCode: "in",
          dayBranchElement: "wood",
          tenGodCode: code,
          tenGodName: code,
          tenGodFamily: "ten_god",
          profile: getTenGodRomanticProfile(code),
          partnerExpectation: `Expectation for ${code}`,
          intimateNeed: `Need for ${code}`,
          distortionWhenStressed: `Stress for ${code}`,
          provenance: {
            evidenceId: `chart.a.pillars.day.branch_ten_god.${code}`,
            source: "personal_saju_chart",
            sourcePath: `pillars.day.branch_ten_god.${code}`,
            confidence: "deterministic",
          },
        },
      },
      partnerCe: {
        personId: "b",
        name: "정우",
        dayMaster: { stemCode: "geng", stemElement: "metal", dayBranchCode: "zi" },
        fiveElementStructure: { dominantElement: "metal" },
      },
      seekerId: "a",
      partnerId: "b",
      seekerName: "지민",
      partnerName: "정우",
    });

    assert.ok(match.narrativeUnit.recognition);
    assert.ok(match.narrativeUnit.emotionalMeaning);
    assert.ok(match.narrativeUnit.scene);
    assert.ok(match.narrativeUnit.pairSpecificEffect);
    assert.ok(match.narrativeUnit.tensionBridge);
    assert.ok(match.canonicalEvidences && match.canonicalEvidences.length > 0);
    assert.ok(match.lensInterpretations && match.lensInterpretations.length > 0);

    // Verify uniqueness
    descriptions.add(match.narrativeUnit.recognition);
  }
  assert.equal(descriptions.size, 10, "All 10 Ten Gods must produce distinct recognition statements.");

  // 2. Prohibition of unsupported time, biography, certainty, or fate
  const forbiddenPhrases = [
    "처음 만날 때부터",
    "첫눈에",
    "반드시",
    "운명적으로",
    "평생",
    "혼자서는 절대",
    "반드시 관계가 오래간다",
  ];

  for (const code of tenGodList) {
    const match = resolveBilateralPartnerPreferenceMatchFromCe({
      seekerCe: {
        personId: "a",
        name: "지민",
        dayMaster: { stemCode: "gap", stemElement: "wood", dayBranchCode: "in" },
        fiveElementStructure: { dominantElement: "wood" },
        spousePalaceProfile: {
          personId: "a",
          personName: "지민",
          dayBranchCode: "in",
          dayBranchElement: "wood",
          tenGodCode: code,
          tenGodName: code,
          tenGodFamily: "ten_god",
          profile: getTenGodRomanticProfile(code),
          partnerExpectation: `Expectation for ${code}`,
          intimateNeed: `Need for ${code}`,
          distortionWhenStressed: `Stress for ${code}`,
          provenance: {
            evidenceId: `chart.a.pillars.day.branch_ten_god.${code}`,
            source: "personal_saju_chart",
            sourcePath: `pillars.day.branch_ten_god.${code}`,
            confidence: "deterministic",
          },
        },
      },
      partnerCe: {
        personId: "b",
        name: "정우",
        dayMaster: { stemCode: "geng", stemElement: "metal", dayBranchCode: "zi" },
        fiveElementStructure: { dominantElement: "metal" },
      },
      seekerId: "a",
      partnerId: "b",
      seekerName: "지민",
      partnerName: "정우",
    });

    const fullProse = `${match.synthesisNarrative} ${match.narrativeUnit.recognition} ${match.narrativeUnit.emotionalMeaning} ${match.narrativeUnit.pairSpecificEffect}`;
    for (const phrase of forbiddenPhrases) {
      assert.equal(
        fullProse.includes(phrase),
        false,
        `Prose for ${code} contains unsupported phrase: ${phrase}`,
      );
    }
  }
});
