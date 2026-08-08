import * as fs from "node:fs";

const raw = fs.readFileSync("scratch/friend_review_output.json", "utf-8");
const pkg = JSON.parse(raw);

console.log("DEV keys:", Object.keys(pkg.dev || {}));
if (pkg.dev?.narrative) {
  console.log("DEV narrative keys:", Object.keys(pkg.dev.narrative));
  console.log("DEV narrative sample:", JSON.stringify(pkg.dev.narrative, null, 2).slice(0, 1000));
}
if (pkg.dev?.storyPlan) {
  console.log("DEV storyPlan keys:", Object.keys(pkg.dev.storyPlan));
  console.log("DEV storyPlan sample:", JSON.stringify(pkg.dev.storyPlan, null, 2).slice(0, 1000));
}
