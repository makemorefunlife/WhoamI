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

export const getStem = (pillar: any) => pillar?.charAt(0) || "";
export const getBranch = (pillar: any) => pillar?.charAt(1) || "";
