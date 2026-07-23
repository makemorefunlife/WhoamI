export {
  buildRomanticContextInput,
  collectRomanticDynamicsTypedSnapshot,
  collectRomanticAxisNotes,
  ROMANTIC_CONTEXT_INPUT_SCHEMA_VERSION,
} from "./romanticContextInput";
export type {
  RomanticContextInput,
  RomanticDynamicsTypedSnapshot,
  BuildRomanticContextInputParams,
} from "./romanticContextInput";
export {
  stripRomanticContextInputForClient,
  omitRomanticContextInputFromReport,
} from "./stripRomanticContextInputForClient";
export {
  buildRomanticBalanceOfPowerCanonical,
  buildRomanticBalanceClientProjection,
  injectRomanticBalanceClientProjection,
  balanceOfPowerValueFromDominantCategories,
  balanceOfPowerValueFromDynamicsSnapshot,
  balanceOfPowerJudgmentFields,
  readRomanticBalanceCanonicalProjection,
  formatRomanticBalanceCanonicalLabel,
  ROMANTIC_BALANCE_OF_POWER_CLIENT_PATH,
  ROMANTIC_BALANCE_OF_POWER_PERSISTENCE_PATH,
} from "./romanticBalanceOfPowerCanonical";
export type {
  RomanticBalanceOfPowerValue,
  RomanticBalanceOfPowerCanonical,
} from "./romanticBalanceOfPowerCanonical";
export {
  buildRomanticRecoverySpeedCanonical,
  buildRomanticRecoveryClientProjection,
  injectRomanticRecoveryClientProjection,
  recoverySpeedValueFromDominantCategories,
  recoverySpeedValueFromDynamicsSnapshot,
  recoverySpeedJudgmentFields,
  readRomanticRecoveryCanonicalProjection,
  formatRomanticRecoveryCanonicalLabel,
  ROMANTIC_RECOVERY_SPEED_CLIENT_PATH,
  ROMANTIC_RECOVERY_SPEED_PERSISTENCE_PATH,
} from "./romanticRecoverySpeedCanonical";
export type {
  RomanticRecoverySpeedValue,
  RomanticRecoverySpeedCanonical,
} from "./romanticRecoverySpeedCanonical";
export {
  buildRomanticReassuranceCanonical,
  buildRomanticReassuranceClientProjection,
  injectRomanticReassuranceClientProjection,
  reassuranceValueFromDominantCategories,
  reassuranceValueFromDynamicsSnapshot,
  reassuranceJudgmentFields,
  readRomanticReassuranceCanonicalProjection,
  formatRomanticReassuranceCanonicalLabel,
  ROMANTIC_REASSURANCE_CLIENT_PATH,
  ROMANTIC_REASSURANCE_PERSISTENCE_PATH,
} from "./romanticReassuranceCanonical";
export type {
  RomanticReassuranceValue,
  RomanticReassuranceCanonical,
} from "./romanticReassuranceCanonical";
export {
  buildRomanticRolePlayCanonical,
  buildRomanticRolePlayClientProjection,
  injectRomanticRolePlayClientProjection,
  rolePlayValueFromDominantCategories,
  rolePlayValueFromDynamicsSnapshot,
  rolePlayJudgmentFields,
  readRomanticRolePlayCanonicalProjection,
  formatRomanticRolePlayCanonicalLabel,
  ROMANTIC_ROLE_PLAY_CLIENT_PATH,
  ROMANTIC_ROLE_PLAY_PERSISTENCE_PATH,
} from "./romanticRolePlayCanonical";
export type {
  RomanticRolePlayValue,
  RomanticRolePlayCanonical,
} from "./romanticRolePlayCanonical";
export {
  buildRomanticResidualCanonical,
  buildRomanticResidualClientProjection,
  injectRomanticResidualClientProjection,
  residualValueFromDominantCategories,
  residualValueFromDynamicsSnapshot,
  residualJudgmentFields,
  readRomanticResidualCanonicalProjection,
  formatRomanticResidualCanonicalLabel,
  ROMANTIC_RESIDUAL_CLIENT_PATH,
  ROMANTIC_RESIDUAL_PERSISTENCE_PATH,
} from "./romanticResidualCanonical";
export type {
  RomanticResidualValue,
  RomanticResidualCanonical,
} from "./romanticResidualCanonical";
export {
  buildRomanticExpressionSpeedCanonical,
  buildRomanticExpressionSpeedClientProjection,
  injectRomanticExpressionSpeedClientProjection,
  expressionSpeedValueFromDominantCategories,
  expressionSpeedValueFromFinalized,
  expressionSpeedJudgmentFields,
  readRomanticExpressionSpeedCanonicalProjection,
  formatRomanticExpressionSpeedCanonicalLabel,
  ROMANTIC_EXPRESSION_SPEED_CLIENT_PATH,
  ROMANTIC_EXPRESSION_SPEED_PERSISTENCE_PATH,
} from "./romanticExpressionSpeedCanonical";
export type {
  RomanticExpressionSpeedValue,
  RomanticExpressionSpeedCanonical,
} from "./romanticExpressionSpeedCanonical";
export { refineExpressionSpeedCorroboration } from "./expressionSpeedCorroboration";
export type {
  ExpressionSpeedAlign,
  ExpressionSpeedConfidence,
  ExpressionSpeedCorroboration,
} from "./expressionSpeedCorroboration";
export {
  buildRomanticComparisonTableCanonical,
  buildRomanticComparisonTableClientProjection,
  injectRomanticComparisonTableClientProjection,
  comparisonTableValueFromDominantCategories,
  comparisonTableJudgmentFields,
  readRomanticComparisonTableCanonicalProjection,
  formatRomanticCompareLeanLabel,
  romanticComparisonRowKeyForAspect,
  romanticCompareLeanForViewerColumn,
  ROMANTIC_COMPARISON_ASPECT_TO_ROW,
  ROMANTIC_COMPARISON_TABLE_CLIENT_PATH,
  ROMANTIC_COMPARISON_TABLE_PERSISTENCE_PATH,
} from "./romanticComparisonTableCanonical";
export type {
  RomanticComparisonTableValue,
  RomanticComparisonTableCanonical,
  RomanticCompareRowKey,
} from "./romanticComparisonTableCanonical";
export {
  buildRomanticSajuFrameDirectionCanonical,
  buildRomanticSajuFrameDirectionClientProjection,
  injectRomanticSajuFrameDirectionClientProjection,
  sajuFrameDirectionValueFromDominantCategories,
  sajuFrameDirectionValueFromFinalized,
  sajuFrameDirectionJudgmentFields,
  readRomanticSajuFrameDirectionCanonicalProjection,
  formatRomanticSajuFrameDirectionCanonicalLabel,
  anchorIsAFromSajuFrameDirection,
  ROMANTIC_SAJU_FRAME_DIRECTION_CLIENT_PATH,
  ROMANTIC_SAJU_FRAME_DIRECTION_PERSISTENCE_PATH,
} from "./romanticSajuFrameDirectionCanonical";
export type {
  RomanticSajuFrameDirectionValue,
  RomanticSajuFrameDirectionCanonical,
} from "./romanticSajuFrameDirectionCanonical";
export { bindDialogueTableToExpressionSpeed } from "./romanticDialogueTableBinding";
export type { DialogueTableRowLike } from "./romanticDialogueTableBinding";
