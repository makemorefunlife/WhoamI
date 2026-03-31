export function generateCombinedReport(
  survey: any,
  sajuInterpretation: string,
) {
  // 1️⃣ 지금 너는 (설문 기반)
  let now = "";

  if (survey?.q6 === "매일 힘들었어") {
    now = "지금은 많이 지치고 버거운 상태에 가까워 보여.";
  } else if (survey?.q6 === "자주 우울하고 무기력") {
    now = "요즘은 조금씩 에너지가 빠지고 있는 시기일 수도 있어.";
  } else if (survey?.q6 === "가끔 피곤하고 짜증") {
    now = "조금 예민해진 상태일 수 있지만, 그래도 잘 버티고 있는 흐름이야.";
  } else {
    now = "지금은 비교적 안정적인 흐름 안에 있는 것처럼 보여.";
  }

  // 2️⃣ 그런데 (사주)
  const sajuView = sajuInterpretation;

  // 3️⃣ 그래서 (간단 제안)
  let suggestion = "";

  if (survey?.q2 === "앞장서는 타입") {
    suggestion =
      "지금은 혼자 끌고 가려고 하기보다, 한 번만 주변에 기대보는 것도 좋아.";
  } else if (survey?.q2 === "규칙대로 체계적으로 하는 타입") {
    suggestion =
      "지금은 너무 완벽하게 하려고 하기보다, 일부러 조금 느슨하게 가보는 것도 방법이야.";
  } else {
    suggestion = "이번 주에는 딱 하나만 가볍게 바꿔보는 걸 추천해.";
  }

  return {
    now,
    sajuView,
    suggestion,
  };
}
