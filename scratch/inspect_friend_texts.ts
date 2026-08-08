import * as fs from "node:fs";

const raw = fs.readFileSync("scratch/friend_review_output.json", "utf-8");
const pkg = JSON.parse(raw);

console.log("=== CURRENT CE REPORT KEYS ===");
console.log(Object.keys(pkg.current.report));
console.log("=== CURRENT FRIEND KEYS ===");
console.log(Object.keys(pkg.current.report.friend));

console.log("\n=== DEV 7 SCENES ===");
if (pkg.dev?.storyPlan?.scenes) {
  pkg.dev.storyPlan.scenes.forEach((s: any) => {
    console.log(`Scene ${s.scene_number}: ${s.title_ko} (${s.scene_id}) - ${s.narrative_role}`);
  });
}

console.log("\n=== DEV NARRATIVE BEATS ===");
if (pkg.dev?.narrative?.scenes) {
  pkg.dev.narrative.scenes.forEach((s: any) => {
    console.log(`\n--- SCENE ${s.scene_number}: ${s.title} ---`);
    s.beats.forEach((b: any) => {
      console.log(`[${b.beat_id}] ${b.lead_ko ?? b.lead}`);
      console.log(`  Body: ${b.body_ko ?? b.body}`);
    });
  });
}
