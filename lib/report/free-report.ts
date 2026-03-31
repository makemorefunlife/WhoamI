export function generateFreeReport(survey: any) {
  let nowYouAre = "";

  if (survey.q6 === "매일 힘들었어") {
    nowYouAre = "요즘 많이 지치고 버거운 상태에 가까워 보여.";
  } else if (survey.q6 === "자주 우울하고 무기력") {
    nowYouAre = "조금씩 힘이 빠지고 있는 시기일 수도 있어.";
  } else if (survey.q6 === "가끔 피곤하고 짜증") {
    nowYouAre = "조금 예민해진 상태일 수도 있지만, 잘 버티고 있는 중이야.";
  } else {
    nowYouAre = "지금 꽤 안정적인 흐름 안에 있는 것처럼 보여.";
  }

  let anotherView = "";

  if (survey.q2 === "앞장서는 타입") {
    anotherView =
      "한편으로는 생각보다 더 앞에서 끌고 가는 힘이 있는 사람일 수도 있어.";
  } else if (survey.q2 === "규칙대로 체계적으로 하는 타입") {
    anotherView =
      "다른 관점에서는 이미 충분히 단단한 기준을 가진 사람일 수도 있어.";
  } else {
    anotherView =
      "다른 관점에서는 아직 드러나지 않은 가능성이 더 있을 수도 있어.";
  }

  let soWhat = "이번 주에는 딱 하나만 가볍게 바꿔보는 건 어때?";

  return {
    nowYouAre,
    anotherView,
    soWhat,
  };
}
 
