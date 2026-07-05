import { PATTERN_BASE } from "@/lib/hardcoded/patternBaseData";

const PATTERN_BY_DOMAIN_AND_CODE = new Map<string, string>(
  PATTERN_BASE.map((row) => [
    `${row.domain}:${row.pattern.trim()}`,
    row.interpretation,
  ]),
);

export function getPatternInterpretation(
  domain: string,
  pattern: string,
): string | null {
  return PATTERN_BY_DOMAIN_AND_CODE.get(`${domain}:${pattern.trim()}`) ?? null;
}
