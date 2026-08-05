/**
 * stitchBirthTime24h must accept 1-digit minutes (pad to 2).
 * Run: node --experimental-strip-types tests/scripts/stitch-birth-time-minute-pad.mjs
 *   or: npx tsx tests/scripts/stitch-birth-time-minute-pad.mjs
 */
import assert from "node:assert/strict";
import { stitchBirthTime24h } from "../../components/onboarding/StitchBirthDateTimeFields.tsx";

assert.equal(stitchBirthTime24h("am", "7", "0", false), "07:00");
assert.equal(stitchBirthTime24h("am", "7", "5", false), "07:05");
assert.equal(stitchBirthTime24h("pm", "12", "00", false), "12:00");
assert.equal(stitchBirthTime24h("am", "7", "", false), null);
assert.equal(stitchBirthTime24h("am", "7", "0", true), null);
console.log("stitch-birth-time-minute-pad: ok");
