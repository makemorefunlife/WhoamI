import fs from "node:fs";

const md = fs.readFileSync("C:/Users/tehch/.gemini/antigravity/brain/019d25ec-8986-4caf-bda6-3b3834453124/scratch/real_db_couple_sera_donggle_full.md", "utf-8");

const forbiddenTerms = ["하루", "내일", "분", "주", "개월", "년 뒤"];

const termMatches: Record<string, string[]> = {};

for (const term of forbiddenTerms) {
  const matches: string[] = [];
  const lines = md.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes(term)) {
      // Exclude legitimate timing analysis like 2026년 / 2031년 / 시기
      // Check if it's unsupported recommendation precision
      matches.push(`Line ${i + 1}: ${line.trim()}`);
    }
  }
  termMatches[term] = matches;
}

const particlesToScan = [
  "Sera과", "Sera이/가", "동글이/가", "파트너과", "Sera와 동글는", "Sera와 동글은/는", "은/는", "이/가"
];
const particleMatches = particlesToScan.filter(p => md.includes(p));

console.log("=== GLOBAL SCAN RESULTS ===");
console.log("Particle matches (must be 0):", particleMatches.length, particleMatches);
for (const [term, matches] of Object.entries(termMatches)) {
  console.log(`\n--- Term: "${term}" (${matches.length} lines found) ---`);
  for (const m of matches) {
    console.log("  ", m);
  }
}
