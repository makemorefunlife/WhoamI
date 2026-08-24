import fs from "fs";
import path from "path";

const filePath = path.resolve("lib/relationship/familyParent/familySajuCompareTable.ts");
let content = fs.readFileSync(filePath, "utf-8");

const cleanGuidanceFitMeaning = `const GUIDANCE_FIT_MEANING: Record<
  Locale,
  Record<FamilyRoleLensKey, Record<GuidanceFit, string>>
> = {
  "ko-KR": {
    neutral: {
      aligned: "가정 내에서 조언이나 훈육이 필요한 순간에 서로 선호하는 소통 채널이 잘 맞물립니다. 부모가 전달하려는 핵심과 아이가 수용하는 방식이 같은 언어로 소통되어 오해 없이 뜻이 잘 전달됩니다.",
      partial: "돌봄과 지도 순간에 한쪽이 상황에 따라 수용과 기준을 번갈아 쓰는 유연한 타입이라, 일상적인 대화 톤이나 개입 강도를 상황별로 자유롭게 조율할 수 있는 구조입니다.",
      mismatch: "훈육이나 조언 시 한쪽은 따뜻한 정서적 수용을 먼저 바라는 반면, 다른 쪽은 구체적인 기준과 규칙 제시를 우선시하여 엇갈리기 쉽습니다. 대화 시작 전 '지금은 마음을 들을 타이밍인지, 기준을 잡을 타이밍인지' 한 줄로 선을 맞추면 훨씬 편안해집니다.",
    },
    mother: {
      aligned: "돌봄 장면에서 걱정과 챙김이 같은 언어로 전달되는 이상적인 구도입니다. 아이의 마음 상태를 살피고 보듬어주는 템포가 조화로워 억압이나 단절 없이 정서적 안정이 유지됩니다.",
      partial: "돌봄 장면에서 한쪽이 혼합형이라, 일상적인 관심과 개인 공간의 균형을 상황에 맞춰 부드럽게 조율할 수 있는 여지가 많은 구조입니다.",
      mismatch: "아이의 서운함을 보듬어주는 수용과 잘못을 바로잡는 기준 제시가 엇갈리기 쉬운 구도입니다. 먼저 감정을 받아줄지, 기준을 제시할지 사전에 가볍게 맞춰두는 노력이 필요합니다.",
    },
    father: {
      aligned: "지도와 조언이 오가는 대화에서 기대와 이유 설명의 리듬이 잘 맞물립니다. 책임과 자율의 기준이 명확하게 전달되어 서로 오해 없이 소통하기 편안합니다.",
      partial: "지도 장면에서 한쪽이 융통성 있게 수용과 기준을 취하는 타입이라, 책임 대화의 톤을 아이의 성장 단계에 따라 부드럽게 맞춰갈 수 있습니다.",
      mismatch: "조언 시 훈육의 이유부터 듣고 싶어 하는 방식과 명확한 원칙을 먼저 제시하려는 방식이 부딪히기 쉽습니다. 이유 설명부터 할지, 기준부터 짚을지 순서를 먼저 맞추는 대화 기술이 도움이 됩니다.",
    },
  },
  "en-US": {
    neutral: {
      aligned: "Your care/guidance channels line up — easy to give and receive on the same wavelength.",
      partial: "One of you mixes modes — room to tune channel by situation.",
      mismatch: "One leans accept/explain while the other leans standards — name the channel you need first.",
    },
    mother: {
      aligned: "Care moments line up — worry and tending travel in the same language.",
      partial: "One of you mixes modes in care moments — tune everyday involvement by situation.",
      mismatch: "Acceptance and standards can cross wires in care moments — align in one line first: feel or frame.",
    },
    father: {
      aligned: "Guidance moments line up — expectation and explanation share a rhythm.",
      partial: "One of you mixes modes in guidance — tune the tone of responsibility talks by situation.",
      mismatch: "Explanation and standards can cross wires — align first: reason, or the standard.",
    },
  },
};`;

const cleanHomeClimateMeaning = `const HOME_CLIMATE_MEANING: Record<
  Locale,
  Record<FamilyRoleLensKey, Record<string, string>>
> = {
  "ko-KR": {
    neutral: {
      "high|high": "집안에서 작은 서운함이나 마찰이 생겼을 때 둘 다 긴장 기류를 민감하게 감지하고 마음에 품는 구조입니다. 정서적 앙금이 집 전체 분위기로 오랫동안 번지기 쉽기 때문에, 작은 불편이 생겼을 때 묵혀두지 않고 가벼운 대화로 즉시 풀어주는 노력이 필요합니다.",
      "low|low": "집안에서 의견이 충돌하거나 긴장 상황이 생겨도 문제를 즉시 털어내거나 담담하게 넘어가는 템포가 빠른 조합입니다. 앙금을 마음에 오랫동안 품고 분위기를 무겁게 끌고 가지 않기 때문에, 집에서의 긴장 상태가 오래 지속되지 않고 금방 밝은 일상으로 회복됩니다.",
      "medium|medium": "집 안의 미묘한 분위기 변화나 걱정을 적절한 수준에서 감지하고 정리하는 안정적인 구조입니다. 서운함이 너무 오래 누적되거나 성급하게 묻히지 않도록 그때그때 가볍게 주고받는 대화가 유지될 때 가장 편안합니다.",
      "high|low": "한쪽은 집 안의 작은 분위기 변화도 깊이 마음에 품는 반면, 다른 쪽은 금방 털어내고 아무렇지 않게 일상으로 복귀하는 편입니다. 긴장을 민감하게 느끼는 쪽의 신호를 무관심하게 지나치지 않고 다정하게 짚어줄 때 안정을 찾습니다.",
      "high|medium": "한쪽은 집 안의 분위기 긴장을 오랫동안 품는 편이고, 다른 쪽은 중간 정도의 템포입니다. 무거운 정적이 길어지기 전에 '마음에 걸리는 게 있어?'라고 짧게 확인해 주는 다정한 관심이 효과적입니다.",
      "low|medium": "한쪽은 긴장을 빠르게 털어내고 담담하게 대하는 편이고, 다른 쪽은 상황을 차분히 정돈하는 편입니다. 털어내는 템포의 차이를 '상대방에게 성의가 없다'고 오해하지 않고 표현의 리듬을 인정해 주는 것이 좋습니다.",
    },
    mother: {
      "high|high": "가정 내에서 작은 서운함이나 불만이 생겼을 때 둘 다 바로 털어내지 못하고 분위기를 살피며 마음에 담아두기 쉬운 구조입니다. 집 안의 무거운 공기가 오랫동안 맴돌 수 있으므로, 앙금이 쌓이기 전에 '지금 어떤 마음인지' 가벼운 안부 대화로 풀어주는 것이 중요합니다.",
      "low|low": "집안에서 오해나 마찰이 생기더라도 한쪽이 마음에 담아두고 분위기를 어둡게 끌고 가기보다, 상황을 담담하게 넘기거나 빠르게 풀어내는 성향입니다. 앙금이 정서적 상처로 오래 남아 집 전체를 누르지 않고 쾌적하게 회복되는 좋은 조합입니다.",
      "medium|medium": "집 안의 걱정과 분위기 변화를 적절한 강도로 감지하고 수습하는 구조입니다. 서운함이 분위기로 오랫동안 누적되지 않도록 한 줄 대화로 마음 상태를 주고받으면 매우 조화롭게 유지됩니다.",
      "high|low": "한쪽은 집 안의 미묘한 걱정이나 긴장을 오래 품고, 다른 쪽은 금방 털어내고 잊어버리는 조합입니다. 긴장을 민감하게 품는 쪽의 마음을 '별일 아닌 것'으로 치부하지 않고 다정하게 수용해 줄 때 안정을 찾습니다.",
      "high|medium": "걱정이 집 안 분위기로 번지기 쉬운 쪽과 중간 템포의 조합입니다. 정적이나 어두운 기류가 느껴질 때 침묵을 길게 끌지 말고 가벼운 대화로 풀어주는 것이 좋습니다.",
      "low|medium": "한쪽은 긴장을 빠르게 털어내고 담담히 대하는 반면, 다른 쪽은 차분히 마음을 정리하는 편입니다. 털어내는 온도 차이를 무관심으로 읽지 말고 각자의 표현 방식을 인정해 주세요.",
    },
    father: {
      "high|high": "대화나 기준 설정 시 긴장감이 생기면 분위기를 조용히 관조하며 침묵을 유지하는 경향이 둘 다 큽니다. 집 안의 정적이나 중압감이 오래 이어질 수 있으므로 분위기가 가라앉기 전에 가벼운 주제로 먼저 물꼬를 터주는 출구 전략이 필요합니다.",
      "low|low": "기준이나 대화에서 긴장이 발생해도 이를 집안 분위기로 오래 품지 않고 담담하게 털어내는 조합입니다. 불필요한 서운함이나 침묵이 길어지지 않고 빠르게 가벼운 일상으로 회복되는 특징을 보입니다.",
      "medium|medium": "기준과 침묵이 집 안 분위기에 중간 정도로 영향을 미치는 안정적인 구도입니다. 미묘한 중압감이 쌓이기 전에 한 줄 요청으로 편안하게 대화를 이어가면 좋습니다.",
      "high|low": "한쪽은 집 안 분위기의 긴장감을 깊이 알아채고 품는 반면, 다른 쪽은 빠르게 넘기는 편입니다. 침묵 속에 숨은 민감한 신호를 놓치지 않고 가볍게 물어봐 주는 태도가 도움이 됩니다.",
      "high|medium": "긴장이 분위기로 남기 쉬운 쪽과 중간 템포의 조합입니다. 집 안 공기가 가라앉을 때 긴 대화보다 가벼운 질문으로 물꼬를 터주세요.",
      "low|medium": "한쪽은 긴장을 덜 붙잡고 담담히 넘기는 반면, 다른 쪽은 분위기를 중간 정도로 감지합니다. 반응 템포의 차이를 오해하지 않고 상대의 공간을 존중해 주면 편안해집니다.",
    },
  },
  "en-US": {
    neutral: {
      "high|high": "Both of you tend to sense and accumulate household tension — friction can spread into the whole mood, so naming a small discomfort early helps.",
      "low|low": "Neither of you tends to hold household tension long — discomfort rarely settles into the room's mood.",
      "medium|medium": "You both notice household pressure at a moderate level — say one line before it stacks.",
      "high|low": "One of you senses and carries household tension; the other doesn't hold it long — don't ignore the sensitive signal.",
      "high|medium": "One carries tension longer; the other is moderate — a short check-in when the mood shifts helps.",
      "low|medium": "One holds tension lightly; the other is moderate — don't read the gap as indifference.",
    },
    mother: {
      "high|high": "Worry and household tension can stack for both of you — a short check-in before the mood gets heavy helps.",
      "low|low": "Worry doesn't tend to linger as a heavy mood in the household.",
      "medium|medium": "Worry and pressure are felt at moderate strength — say one line before it stacks.",
      "high|low": "One carries worry and tension longer; the other holds it lightly — accept the sensitive signal first.",
      "high|medium": "One tends to let worry spread to the mood; the other is moderate — check in briefly when you feel a shift.",
      "low|medium": "One holds tension lightly; the other is moderate — don't read the gap as indifference.",
    },
    father: {
      "high|high": "Standards, talk, and silence tend to stay in the air — leave one clear standard and clear the room.",
      "low|low": "Talk about standards doesn't tend to linger as long-lasting tension.",
      "medium|medium": "Standards and silence affect the mood at a moderate level — align in one line before it stacks.",
      "high|low": "One senses mood tension longer; the other holds it lightly — don't ignore silence from the sensitive side.",
      "high|medium": "Tension tends to stay in the air for one side; the other is moderate — check in briefly when you feel a shift.",
      "low|medium": "One holds tension lightly; the other is moderate — don't read the gap as indifference.",
    },
  },
};`;

// Replace from const GUIDANCE_FIT_MEANING down to HOME_CLIMATE_MEANING end
const guidanceIdx = content.indexOf("const GUIDANCE_FIT_MEANING");
const homeClimateEndIdx = content.indexOf("const GATHERING_RECOVERY_LABEL");

if (guidanceIdx !== -1 && homeClimateEndIdx !== -1) {
  content = content.slice(0, guidanceIdx) + cleanGuidanceFitMeaning + "\n\n" + content.slice(homeClimateEndIdx);
  fs.writeFileSync(filePath, content, "utf-8");
  console.log("Successfully cleaned up familySajuCompareTable.ts!");
} else {
  console.log("Indices not found:", { guidanceIdx, homeClimateEndIdx });
}
