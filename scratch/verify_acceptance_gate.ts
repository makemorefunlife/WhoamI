import fs from "node:fs";

const md = fs.readFileSync("C:/Users/tehch/.gemini/antigravity/brain/019d25ec-8986-4caf-bda6-3b3834453124/scratch/real_db_couple_sera_donggle_full.md", "utf-8");

const malformedParticles = [
  "Sera과", "Sera이/가", "동글이/가", "파트너과", "Sera와 동글는", "Sera와 동글은/는", "은/는", "이/가"
].filter(p => md.includes(p));

const inventedDurations = [
  "10분", "20분", "30분", "40분", "6시간", "반나절"
].filter(d => md.includes(d));

const pseudoPrecision = [
  "당일 저녁"
].filter(p => md.includes(p));

const seraSection = md.slice(md.indexOf("Sera에게 도움이 되는 것"), md.indexOf("동글에게 도움이 되는 것"));
const donggleSection = md.slice(md.indexOf("동글에게 도움이 되는 것"), md.indexOf("CHAPTER 08"));

// Ch03-Ch06 consistent story: Sera = Expresser, Donggle = Withdrawer
const seraIsExpressiveRecovery = seraSection.includes("명확한 사과나 확답") || seraSection.includes("안심의 신호");
const donggleIsSolitudeRecovery = donggleSection.includes("혼자만의 시간") || donggleSection.includes("동굴 시간");
const directionalConsistencyPassed = seraIsExpressiveRecovery && donggleIsSolitudeRecovery;

const ch09Section = md.slice(md.indexOf("현실에서 마주하는 장면들"), md.indexOf("올해 우리 관계의 흐름"));
const badCh09Particle = ch09Section.includes("입니다'과") || ch09Section.includes("합니다'이");

const ch10Section = md.slice(md.indexOf("올해 우리 관계의 흐름"), md.indexOf("관계를 통해 배우는 것"));
const hasCurrentYearGuidance = ch10Section.includes("2026년(올해)");
const hasContradictoryTheme = ch10Section.includes("밀어붙이기") && ch10Section.includes("성급한 변화보다");

console.log("=== FINAL P0 CONSISTENCY VERIFICATION ===");
console.log("1. Malformed particles found:", malformedParticles.length === 0 ? "PASSED (0)" : `FAILED (${malformedParticles.join(", ")})`);
console.log("2. Invented durations found:", inventedDurations.length === 0 ? "PASSED (0)" : `FAILED (${inventedDurations.join(", ")})`);
console.log("3. Pseudo-precision timing found:", pseudoPrecision.length === 0 ? "PASSED (0)" : `FAILED (${pseudoPrecision.join(", ")})`);
console.log("4. Directional story consistency (Ch03-Ch07):", directionalConsistencyPassed ? "PASSED (Sera=Expressive recovery, Donggle=Solitude recovery)" : "FAILED");
console.log("5. Ch09 predicate particle composition:", !badCh09Particle ? "PASSED (No predicate sentence attached to particle)" : "FAILED");
console.log("6. Ch10 2026 guidance reconciliation:", (hasCurrentYearGuidance && !hasContradictoryTheme) ? "PASSED (Single coherent 2026 recommendation)" : "FAILED");
