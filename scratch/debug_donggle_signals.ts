import { calculateSajuBundle } from "../lib/v2/saju/calculateSajuBundle";
import { buildPersonCoreBlueprint } from "../lib/personCore/services/buildPersonCoreBlueprint";

const bundleB = calculateSajuBundle({
  birthDate: "1987-10-26",
  birthTime: null,
  birthTimeUnknown: true,
});

const bpB = buildPersonCoreBlueprint({
  bundle: bundleB,
  birthDate: "1987-10-26",
  birthTime: null,
  birthTimeUnknown: true,
});

const masterB = bpB.saju_master_json;
console.log("Donggle Johu tempBand:", masterB.johu.temperature_band);
console.log("Donggle Romantic Signals:", JSON.stringify(masterB.domain_signals?.romantic_signals, null, 2));
