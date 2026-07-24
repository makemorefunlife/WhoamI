/** Self-Refine — 2차 품질 검토 프롬프트 */

import {
  buildEssenceJournalSelfDedupChecklist,
} from "./essenceJournalWritingRules";
import { buildEssenceActionSelfDedupChecklist } from "./essenceActionWritingRules";
import { buildConflictSituationSelfDedupChecklist } from "./conflictSituationWritingRules";



const ROMANTIC_SAJU_DEEP_SELF_REFINE_BASE = `# 분석 결과 검토



아래 JSON을 검토하고, **입력 데이터 기반으로 다시 작성한 JSON 전체**만 출력하세요.



## 1. 데이터 조합 3단계 검토 (가장 중요!)

- [ ] 각 해석이 (1) 데이터 확인 → (2) 조합·이미지 → (3) 관계적 해석 순서를 거쳤나요?

- [ ] "그래서 예민해요"처럼 결론만 있고 조합이 없는 문장은 없나요?

- [ ] data_combination_note / image_metaphor에 1~2단계가 드러나나요?



## 2. 예시 복사·중복 검토

- [ ] "촛불", "해결책만 주니까", "오늘 진짜 힘들었어" 등 **템플릿 예시 문장**을 그대로 쓰지 않았나요?

- [ ] 모든 커플에 똑같이 나올 법한 일반론이 아닌, **이 두 사람 데이터에서만** 나올 해석인가요?

- [ ] **주어만 바꾼 미러링 문장**이 있으면 해당 필드를 파기하고 새 어휘로 재작성했나요?

- [ ] a_gives_b / b_gives_a / only_together / why_special이 **서로 다른 역할**을 수행하나요?



## 3. 전문 용어 검토

- [ ] 오행·일간·십신·용신·기신·정화·무토·화생토·원국·격국·충·합·원진·식신·편인·한자 등이 본문에 **0개**인가요?



## 4. 1인칭 대화체·화자 바인딩 검토

- [ ] first_person_voice / voice가 "사실 나는..."으로 시작하나요?
- [ ] 구체적이고 날것 같은 표현인가요?
- [ ] \`a_*\` 1인칭에서 "나" = 슬롯 A display name, 상대 = 슬롯 B만인가요? (자기 이름을 3인칭으로 부르지 않음)
- [ ] \`b_*\` 1인칭에서 "나" = 슬롯 B display name, 상대 = 슬롯 A만인가요?
- [ ] \`나님\` / \`저님\` / 이중 존칭 **0개**인가요?
- [ ] 제공된 display name을 **그대로** 썼나요? (임의로 님/씨 추가 금지)



## 5. 대화·성향 표 검토

- [ ] comparison_table이 **6개 항목**(감정 표현·갈등 반응·애정 언어·스트레스 패턴·의사결정·소통 방식) 모두 채워졌나요?

- [ ] comparison_table 각 셀에 **이름·주어가 반복되지 않았나요?** (표 열에 이름이 있으므로 "OO는~", "OO을~" 금지)

- [ ] comparison_table \`a\`열은 A 성향만, \`b\`열은 B 성향만인가요? (서로 바뀌지 않았나요?)

- [ ] 상대를 가리킬 때 이름 대신 **"상대에게"**, **"상대를"** 를 썼나요?

- [ ] conflict는 dialogue_table **2행**(A·B 각 1)만 있고, 50:50 쌍방 고충인가요?
- [ ] good_line이 모범답안·상담사 톤이 아닌가요?
- [ ] hidden_psychology·positive_situation은 없나요?



## 6. Essence 행동 가이드 검토

- [ ] advice_for_a / advice_for_b **각 3개** — action_title + saju_reason(3문장+) + real_speech_tip 필수?
- [ ] 모든 \`real_life_example\`이 **\`""\`** 인가요?
- [ ] "이런 순간에" 등 기획 메모식 문구 **0개**?
- [ ] 6개 팁이 **서로 다른 행동 강령**인가요? ("감정을 드러내라" 복제 없음)
- [ ] **Digest-backed advice**: 각 \`saju_reason\`이 구체 \`dynamics_digest\` 신호(compare_* / 일치 / expression_speed / recovery / residual)를 가리키나요? (아무 커플에나 통하는 일반론 0개)
- [ ] \`together\`가 에센스 다이어리 **3문장+** 인가요?
- [ ] \`together_starter\`가 대화 시작 실전 대사인가요?



## 7. PDF 스타일 변환 검토

- [ ] section_4 bond: a_gives_b·b_gives_a에 **headline+본문** 분리, 필수 역동(변화 자극·결정 지원 / 부담 경감·새 시각) 포함?

- [ ] bond 본문에 **자연물 비유**(산·불꽃·촛불·물·바위 등) **0개**?

- [ ] why_special이 bond 칭찬 **재탕 없이** 갈등 패턴·실전 팁인가요?

- [ ] section_4 hidden: special_bond **칭찬·보완 미반복**, 무의식·속마음만인가요?

- [ ] a_hidden / b_hidden / mutual_gift가 **서로 다른 통찰**인가요?

- [ ] hidden 금지 미사여구("깊은 정서적 교감", "솔직한 대화", "서로 존중") **0개**?

- [ ] special_bond / frames / hidden / mutual / action이 **서로 다른 서술 역할**인가요? (같은 "서로 안아주는 안정감" 테제 재탕 금지)

- [ ] section_3: 갈등이 **양쪽 기질의 힘듦**으로 50:50 서술됐나요? (한쪽만 잘못 프레이밍 없음)

- [ ] section_5: action_title + saju_reason(3문장+) + real_speech_tip. real_life_example **""**. 자연물 비유·"이런 순간에" **0개**?



## 8. Epistemic · Canonical · Same-lean · Mismatch (Patch 1 / 1.5)

- [ ] \`confidence=low\` 또는 \`align=caution\` 행을 **단정 사실**로 쓰지 않았나요? (제안·검증 톤만)
- [ ] \`confidence=high\` / confirms 행은 불필요한 헤지 없이 직접적으로 썼나요?
- [ ] Canonical digest 값(lean/band/일치/direction/align/confidence)과 **모순되는 문장**이 있으면 산문을 고쳤나요? (판정을 바꾸지 않음)
- [ ] Same lean (incl. balanced/balanced): **유사성**으로만 서술했나요? (가짜 대비·유연 vs 신중 발명 금지)
- [ ] \`일치:false\` / mismatch를 **상호 안심·서로 잘 맞춰줌**으로 soft-wash하지 않았나요? (갭을 먼저 명명)



## 9. 은유 & 깊이

- [ ] 관계 이름·방정식에 구체적 이미지?

- [ ] 각 섹션이 "요약의 요약"이 아닌 5문장+ 수준?



## 10. 말투·균형

- [ ] 고신뢰 행에서 불필요한 "~것 같아요" 남발 없음? A/B 비중 균형?

- [ ] "깊은 교감", "깊은 신뢰", "특별한 에너지" 등 **금지 미사여구 0개**?



부족하거나 예시 복사·중복·canonical 모순·same-lean 가짜 대비·mismatch soft-wash·self-name·나님·일반론 advice 흔적이 있으면 **해당 필드를 입력 데이터 기반으로 전면 재작성**하세요.

markdown·코드펜스 없이 유효한 JSON 한 덩어리만 출력하세요.

`;



/** @deprecated — buildRomanticSajuDeepSelfRefinePrompt 사용 권장 */

export const ROMANTIC_SAJU_DEEP_SELF_REFINE_PROMPT =

  ROMANTIC_SAJU_DEEP_SELF_REFINE_BASE;



export function buildRomanticSajuDeepSelfRefinePrompt(

  nicknameA: string,

  nicknameB: string,

): string {

  return `${ROMANTIC_SAJU_DEEP_SELF_REFINE_BASE}



## Speaker names for this report
- \`a_*\` 1st-person: "나" = **${nicknameA}**; partner refs = **${nicknameB}** only
- \`b_*\` 1st-person: "나" = **${nicknameB}**; partner refs = **${nicknameA}** only
- Ban self-reference as "${nicknameA}님" / "${nicknameB}님" inside own 1st-person fields; ban 나님/저님

${buildEssenceJournalSelfDedupChecklist(nicknameA, nicknameB)}

${buildEssenceActionSelfDedupChecklist(nicknameA, nicknameB)}

${buildConflictSituationSelfDedupChecklist(nicknameA, nicknameB)}



# 1차 분석 결과

`;

}


