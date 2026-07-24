/**
 * Korean tone guards shared by all relationshipPremium postValidate passes.
 *
 * 1) repairBrokenKoFragments — 기계적 파편 수리:
 *    - "… — 편으로 보일 수 있으며," 대시 매크로 잔재 제거
 *    - "단정하지 고" / "신중하게 통하는" 등 알려진 텍스트 파손 복구
 * 2) normalizeSpeechLevelKo — 문어체/해라체 종결을 해요체로 정규화.
 *    합쇼체(~입니다/~합니다)는 허용 문체이므로 건드리지 않는다.
 *    보수적 화이트리스트만 변환 — 문장 중간(관형/인용) "~다"는 손대지 않는다.
 */

function hasBatchim(ch: string): boolean {
  const code = ch.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

/** 문장 종결 위치에서만 매칭 — 뒤가 문장부호/쉼표/닫는 괄호이거나 문자열 끝. */
const END = "(?=[.。!?…,)]|$)";

export function repairBrokenKoFragments(text: string): {
  text: string;
  fixed: boolean;
} {
  let out = text;

  // 대시 매크로 파편: "…다 — 편으로 보일 수 있으며, 실제 …" → 머리 없는 절 제거
  out = out.replace(/\s*[—–-]\s*편으로\s*보일\s*수\s*있으며[,，]?\s*/g, ". ");
  // 남은 고아 대시 연결(" — 실제 관계에서…") 문장 경계로 정리
  out = out.replace(/([가-힣])\s+[—–]\s+(실제|다만)/g, "$1. $2");

  // 알려진 텍스트 파손
  out = out.replace(/단정하지\s+고(?=[\s,.)]|$)/g, "단정하지 말고");
  out = out.replace(/신중하게\s+통하는/g, "신중하게 소통하는");

  // 위 수리가 실제로 일어난 경우에만 문장부호 뒷정리
  if (out !== text) {
    out = out
      .replace(/\.\s*\./g, ".")
      .replace(/\s{2,}/g, " ")
      .replace(/\s+\./g, ".")
      .trim();
  }

  return { text: out, fixed: out !== text };
}

export function normalizeSpeechLevelKo(text: string): {
  text: string;
  fixed: boolean;
} {
  let out = text;

  // 문어체 연결어미 완화
  out = out.replace(/있으며(?=[,\s])/g, "있고");

  // 종결어미 화이트리스트 (구체적 → 일반 순서)
  out = out.replace(new RegExp(`것이다${END}`, "g"), "거예요");
  out = out.replace(new RegExp(`보인다${END}`, "g"), "보여요");
  out = out.replace(new RegExp(`했다${END}`, "g"), "했어요");
  out = out.replace(new RegExp(`([가-힣])었다${END}`, "g"), "$1었어요");
  out = out.replace(new RegExp(`([가-힣])았다${END}`, "g"), "$1았어요");
  out = out.replace(new RegExp(`있다${END}`, "g"), "있어요");
  out = out.replace(new RegExp(`없다${END}`, "g"), "없어요");
  out = out.replace(new RegExp(`된다${END}`, "g"), "돼요");
  out = out.replace(new RegExp(`한다${END}`, "g"), "해요");
  out = out.replace(new RegExp(`하다${END}`, "g"), "해요");
  out = out.replace(
    new RegExp(`([가-힣])이다${END}`, "g"),
    (_m, prev: string) => (hasBatchim(prev) ? `${prev}이에요` : `${prev}예요`),
  );

  return { text: out, fixed: out !== text };
}

/** repair → normalize 순서로 한 번에 적용. */
export function polishKoTone(text: string): { text: string; fixed: boolean } {
  const repaired = repairBrokenKoFragments(text);
  const normalized = normalizeSpeechLevelKo(repaired.text);
  return {
    text: normalized.text,
    fixed: repaired.fixed || normalized.fixed,
  };
}
