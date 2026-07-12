export const stemMap: Record<string, string> = {
  갑: "gap",
  을: "eul",
  병: "byeong",
  정: "jeong",
  무: "mu",
  기: "gi",
  경: "gyeong",
  신: "sin",
  임: "im",
  계: "gye",
};

export const branchMap: Record<string, string> = {
  자: "ja",
  축: "chuk",
  인: "in",
  묘: "myo",
  진: "jin",
  사: "sa",
  오: "o",
  미: "mi",
  신: "sin",
  유: "yu",
  술: "sul",
  해: "hae",
};

export const getStem = (pillar: string | null | undefined) =>
  pillar?.charAt(0) || "";
export const getBranch = (pillar: string | null | undefined) =>
  pillar?.charAt(1) || "";

/** 한글·한자 천간 1자 → ref_* DB code */
export function korOrHanjaStemToCode(stemChar: string): string {
  const ch = stemChar.trim().charAt(0);
  if (!ch) return "";
  return stemMap[ch] || hanjaStemToCode[ch] || ch;
}

/** 한글·한자 지지 1자 → ref_* DB code */
export function korOrHanjaBranchToCode(branchChar: string): string {
  const ch = branchChar.trim().charAt(0);
  if (!ch) return "";
  return branchMap[ch] || hanjaBranchToCode[ch] || ch;
}

/** 한글 간지 1자 또는 기둥 문자열 → ref_* DB code */
export function toStemCode(pillarOrHangul: string): string {
  const stem =
    pillarOrHangul.length <= 1 ? pillarOrHangul : getStem(pillarOrHangul);
  return korOrHanjaStemToCode(stem);
}

export function toBranchCode(pillarOrHangul: string): string {
  const branch =
    pillarOrHangul.length <= 1 ? pillarOrHangul : getBranch(pillarOrHangul);
  return korOrHanjaBranchToCode(branch);
}

export const hanjaStemToCode: Record<string, string> = {
  甲: "gap",
  乙: "eul",
  丙: "byeong",
  丁: "jeong",
  戊: "mu",
  己: "gi",
  庚: "gyeong",
  辛: "sin",
  壬: "im",
  癸: "gye",
};

export const hanjaBranchToCode: Record<string, string> = {
  子: "ja",
  丑: "chuk",
  寅: "in",
  卯: "myo",
  辰: "jin",
  巳: "sa",
  午: "o",
  未: "mi",
  申: "sin",
  酉: "yu",
  戌: "sul",
  亥: "hae",
};

export const codeToHangulStem: Record<string, string> = Object.fromEntries(
  Object.entries(stemMap).map(([hangul, code]) => [code, hangul]),
);

export const codeToHangulBranch: Record<string, string> = Object.fromEntries(
  Object.entries(branchMap).map(([hangul, code]) => [code, hangul]),
);

export function hanjaBranchesToCodes(hanja: string): string[] {
  return [...hanja].map((ch) => hanjaBranchToCode[ch]).filter(Boolean);
}

export function hanjaStemsToCodes(hanja: string): string[] {
  return [...hanja].map((ch) => hanjaStemToCode[ch]).filter(Boolean);
}

export function codesToHangulPillar(stemCode: string, branchCode: string): string {
  const s = codeToHangulStem[stemCode] ?? stemCode;
  const b = codeToHangulBranch[branchCode] ?? branchCode;
  return `${s}${b}`;
}
