/**
 * docs/v2/survey/02_Survey_Questions.md
 */
export type SurveyOption = {
  value: string;
  label: string;
};

export type SurveyQuestion = {
  id: string;
  prompt: string;
  options: SurveyOption[];
};

export const SURVEY_V2_QUESTIONS: SurveyQuestion[] = [
  {
    id: "q1",
    prompt:
      "갖고 싶던 물건을 발견했는데 생각보다 가격이 비싸다.\n\n나는 보통 어떻게 할까?",
    options: [
      { value: "A", label: "나중에도 계속 원할 것 같아서 결국 산다." },
      { value: "B", label: "최저가, 후기, 중고가까지 찾아본 뒤 결정한다." },
      { value: "C", label: "예산 안에서 비슷한 다른 선택지를 찾는다." },
      {
        value: "D",
        label: "일단 넘긴다. 며칠 뒤에도 계속 생각나면 다시 본다.",
      },
    ],
  },
  {
    id: "q2",
    prompt:
      "친한 친구와 의견이 크게 부딪혔다.\n\n나는 보통 어떻게 반응할까?",
    options: [
      {
        value: "A",
        label: "내가 먼저 맞춰주거나 사과한다. 관계가 편해지는 게 우선이다.",
      },
      { value: "B", label: "감정보다는 어떤 의견이 맞는지 이야기해 보고 싶다." },
      { value: "C", label: "적당히 동의하거나 화제를 돌리고 넘어간다." },
      {
        value: "D",
        label: "조금 거리를 둔다. 시간이 지나면 정리될 때가 많다.",
      },
    ],
  },
  {
    id: "q3",
    prompt:
      "오랫동안 준비한 일이 기대보다 좋지 않은 결과로 끝났다.\n\n그때 나는?",
    options: [
      {
        value: "A",
        label: "한동안 계속 생각난다. 다른 일도 잘 손에 안 잡힌다.",
      },
      { value: "B", label: "속상하지만 왜 이런 결과가 나왔는지부터 찾아본다." },
      { value: "C", label: "가까운 사람에게 털어놓고 위로받고 싶다." },
      {
        value: "D",
        label: "결과보다 내가 얼마나 진심으로 몰입했는지가 더 중요하다고 생각한다.",
      },
    ],
  },
  {
    id: "q4",
    prompt: "여행을 떠나기 직전에 숙소 예약이 취소됐다.\n\n나는?",
    options: [
      { value: "A", label: "기분이 확 가라앉는다. 계획이 망가진 느낌이다." },
      { value: "B", label: "오히려 새로운 곳을 가볼 기회라고 생각한다." },
      { value: "C", label: "당황하지만 바로 다른 숙소를 찾는다." },
      { value: "D", label: "여행 자체를 취소할까 고민한다." },
    ],
  },
  {
    id: "q5",
    prompt: "인생에서 딱 하나만 지킬 수 있다면 무엇을 선택할 것 같나요?",
    options: [
      { value: "A", label: "나다운 자유" },
      { value: "B", label: "경제적 안정" },
      { value: "C", label: "소중한 사람들" },
      { value: "D", label: "내 성장과 가능성" },
    ],
  },
  {
    id: "q6",
    prompt: "팀 프로젝트를 할 때 가장 피곤한 사람은?",
    options: [
      { value: "A", label: "말만 하고 실행하지 않는 사람" },
      { value: "B", label: "피드백을 개인적인 공격처럼 받아들이는 사람" },
      { value: "C", label: "의견이 없어서 내가 다 결정하게 만드는 사람" },
      { value: "D", label: "사소한 부분에 너무 집착해서 진행을 늦추는 사람" },
    ],
  },
  {
    id: "q7",
    prompt: "중요한 결정을 앞두고 있다.\n\n가장 먼저 확인하는 것은?",
    options: [
      { value: "A", label: "내가 진짜 원하는 것이 무엇인지" },
      { value: "B", label: "현실적으로 가능한 선택인지" },
      { value: "C", label: "주변 사람들에게 어떤 영향을 줄지" },
      { value: "D", label: "장기적으로 나에게 도움이 될지" },
    ],
  },
  {
    id: "q8",
    prompt: "요즘 밤에 잠들기 전 가장 자주 드는 생각은?",
    options: [
      {
        value: "A",
        label: "오늘도 꽤 괜찮았다. 내일도 잘 해낼 수 있을 것 같다.",
      },
      { value: "B", label: "드디어 쉬는구나. 아무 생각 없이 편안하다." },
      {
        value: "C",
        label: "내일이 벌써 부담된다. 모든 게 귀찮게 느껴진다.",
      },
      {
        value: "D",
        label: "오늘 있었던 일이나 앞으로의 걱정이 자꾸 떠오른다.",
      },
    ],
  },
  {
    id: "q9",
    prompt: "완전히 자유로운 휴일이 생겼다.\n\n요즘의 나는?",
    options: [
      { value: "A", label: "사람을 만나거나 밖에 나가야 에너지가 살아난다." },
      { value: "B", label: "혼자 쉬거나 취미를 즐기며 충전한다." },
      { value: "C", label: "자기개발을 하며 뒤처지지 않으려고 노력한다." },
      {
        value: "D",
        label: "뭔가는 해야지 하면서도 기운이 없어 대부분 누워 있게 된다.",
      },
    ],
  },
  {
    id: "q10",
    prompt: "지금 내 삶에서 가장 해결하고 싶은 고민은 무엇인가요?",
    options: [
      { value: "1", label: "돈" },
      { value: "2", label: "관계" },
      { value: "3", label: "건강" },
      { value: "4", label: "진로 및 커리어" },
      { value: "5", label: "기타" },
    ],
  },
];

export const SURVEY_V2_QUESTION_COUNT = SURVEY_V2_QUESTIONS.length;
