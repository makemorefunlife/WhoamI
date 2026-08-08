import * as fs from "node:fs";

const raw = fs.readFileSync("scratch/partner_review_output.json", "utf-8");
const pkg = JSON.parse(raw);

let out = "";
out += "=====================================================\n";
out += "=== CURRENT PARTNER REPORT PROD/CE OUTPUT (KO-KR) ===\n";
out += "=====================================================\n";
const cPartner = pkg.ko.current.report.romantic ?? pkg.ko.current.report.partner ?? pkg.ko.current.report;
out += JSON.stringify(cPartner, null, 2) + "\n";

out += "\n==================================================\n";
out += "=== DEV NARRATIVE 7 SCENES (KO-KR) ===\n";
out += "==================================================\n";
if (pkg.ko.dev?.narrative?.scenes) {
  pkg.ko.dev.narrative.scenes.forEach((sc: any) => {
    out += `\n--- SCENE ${sc.scene_number}: ${sc.title_ko} (${sc.scene_id}) ---\n`;
    out += `Headline: ${sc.headline_ko}\n`;
    out += `[Beat 1 - Recognition]:\n${sc.recognition_ko}\n`;
    out += `[Beat 2 - Translation]:\n${sc.translation_ko}\n`;
    out += `[Beat 3 - Reframing]:\n${sc.reframing_ko}\n`;
    out += `[Beat 4 - Action Guidance]:\n${sc.action_guidance_ko}\n`;
    if (sc.scripts && sc.scripts.length > 0) {
      out += `[Scripts]:\n`;
      sc.scripts.forEach((s: any) => {
        out += `  - (${s.speaker}) [${s.title_ko}] ${s.dialogue_ko}\n`;
      });
    }
    if (sc.role_rules_ko && sc.role_rules_ko.length > 0) {
      out += `[Role Rules]:\n`;
      sc.role_rules_ko.forEach((r: any) => {
        out += `  - ${r}\n`;
      });
    }
  });
}

fs.writeFileSync("scratch/partner_texts_utf8.txt", out, "utf-8");
console.log("Written scratch/partner_texts_utf8.txt successfully");
