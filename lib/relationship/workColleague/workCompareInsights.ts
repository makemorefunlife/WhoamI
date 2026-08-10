import type { Locale } from "@/lib/i18n/locale";
import type { WorkCompareRowId } from "./sajuCompareTable";

export function getWorkCompareProse(
  rowId: WorkCompareRowId,
  locale: Locale,
  nameA: string,
  nameB: string,
  leanALabel: string,
  leanBLabel: string,
  isSame: boolean,
): string {
  const isEn = locale === "en-US";

  switch (rowId) {
    case "boundary":
      if (isSame) {
        return isEn
          ? `Both ${nameA} and ${nameB} share the '${leanALabel}' approach. You both draw the line between work and personal life at a similar place. Because your boundaries align, you rarely drain each other with unwanted small talk, nor do you come off as too cold, creating a comfortable space to collaborate.`
          : `${nameA}님과 ${nameB}님 모두 '${leanALabel}' 성향이에요. 업무와 사적인 시간의 경계를 비슷한 곳에 긋기 때문에, 일하다가 불필요한 사담으로 피로해지거나 반대로 너무 정 없다고 느낄 일이 적어 편안하게 협업할 수 있습니다.`;
      }
      return isEn
        ? `You draw your work-life boundaries in different places. ${nameA} is more '${leanALabel}', while ${nameB} leans toward '${leanBLabel}'. One of you might use small talk to build momentum, while the other finds it distracting. Recognizing this difference early on prevents you from misreading each other as cold or unfocused.`
        : `두 사람은 일할 때의 공사 구분선이 확연히 달라요. ${nameA}님은 '${leanALabel}' 쪽이고, ${nameB}님은 '${leanBLabel}' 쪽이죠. 한쪽이 스몰토크를 통해 관계를 풀며 업무 텐션을 올리려 할 때, 다른 쪽은 방해받는다고 느낄 수 있습니다. 서로 냉정하거나 산만하다고 오해하지 않도록 각자의 템포 차이를 인정해 주는 게 좋아요.`;

    case "feedback":
      if (isSame) {
        return isEn
          ? `You both handle feedback with a '${leanALabel}' style. You process criticism in a similar way, meaning that when someone points out a mistake, it rarely spirals into emotional conflict. You can get straight to fixing the issue without walking on eggshells.`
          : `두 사람 모두 피드백을 수용할 때 '${leanALabel}' 스타일을 보여요. 지적이나 피드백을 받아들이는 방식이 비슷하기 때문에, 업무적인 수정 요청이 감정싸움으로 번지는 일이 드뭅니다. 서로 눈치 보지 않고 깔끔하게 일에만 집중할 수 있는 좋은 시너지예요.`;
      }
      return isEn
        ? `Your feedback styles are quite different—${nameA} is '${leanALabel}' and ${nameB} is '${leanBLabel}'. One of you might need reassurance alongside a correction, while the other just wants the facts stated plainly. Adjusting how you deliver feedback to match the other's style will save you a lot of friction.`
        : `피드백을 주고받을 때 ${nameA}님은 '${leanALabel}', ${nameB}님은 '${leanBLabel}' 성향으로 차이가 큽니다. 한쪽은 지적과 함께 수고에 대한 인정이 필요하고, 다른 쪽은 감정을 뺀 명확한 기준만을 원할 수 있어요. 서로가 가장 잘 소화할 수 있는 화법으로 피드백을 건네는 연습이 필요합니다.`;

    case "synergy_position":
      if (isSame) {
        return isEn
          ? `You share the same elemental lean, meaning your instinct toward new projects is similar. You both naturally gravitate toward the same type of work (whether pioneering or steady operations). To get the most out of this partnership, make sure to clearly divide your territories so you aren't competing for the exact same roles.`
          : `두 분은 업무를 대하는 기본 오행 결이 비슷해서, 새로운 프로젝트를 마주했을 때의 태도나 우선순위가 겹치는 편입니다. 같은 성향의 일을 두고 알게 모르게 경쟁할 수 있으니, 각자의 전문 영역을 명확히 나누고 시작하는 것이 장기적인 시너지에 유리합니다.`;
      }
      return isEn
        ? `${nameA} and ${nameB} have complementary elemental strengths. One of you excels at breaking ground on new projects, while the other is gifted at refining and maintaining existing systems. If you intentionally assign the pioneering work to one and the risk-checking to the other, you'll form an incredibly well-rounded team.`
        : `한쪽은 아무것도 없는 백지에서 새 판을 짜는 데 강하고, 다른 쪽은 이미 있는 룰을 정교하게 다듬고 유지하는 데 강합니다. 서로의 장점이 완벽히 엇갈리기 때문에, 신규 기획은 앞쪽에, 리스크 점검과 운영은 뒤쪽에 맡긴다면 어떤 프로젝트든 빈틈없이 굴러가는 팀워크를 발휘할 수 있어요.`;

    case "burnout":
      if (isSame) {
        return isEn
          ? `You both recharge with a '${leanALabel}' rhythm. Because you handle stress and burnout similarly, you easily understand when the other person needs space or support. There's very little room to misread each other during the hardest stretches of a project.`
          : `두 사람 모두 스트레스를 풀고 번아웃에 대처할 때 '${leanALabel}' 리듬을 탑니다. 내가 힘들 때 어떻게 회복하고 싶은지가 상대방과 비슷하기 때문에, 업무가 몰아칠 때 서로의 방식을 오해하거나 서운해할 일이 적습니다.`;
      }
      return isEn
        ? `You cope with burnout differently. ${nameA} is a '${leanALabel}', while ${nameB} is a '${leanBLabel}'. One of you might need to vent and talk it out, while the other needs quiet time to process alone. Remembering that a need for distance isn't a sign of disinterest will keep the partnership strong.`
        : `번아웃이 왔을 때 ${nameA}님은 '${leanALabel}', ${nameB}님은 '${leanBLabel}' 방식으로 대처합니다. 한쪽은 동료와 대화하며 스트레스를 풀고 싶어 하고, 다른 쪽은 혼자만의 조용한 동굴이 필요할 수 있어요. 상대가 힘들어 보일 때, 나와 다른 방식으로 회복하고 있다는 걸 이해해 주는 것이 중요합니다.`;

    case "risk_taking":
      if (isSame) {
        return isEn
          ? `You both share a '${leanALabel}' approach to risk. Because your appetite for deal-making and risk-taking is at a similar temperature, you rarely clash over the pace of big decisions. You can move forward confidently together.`
          : `두 사람 다 리스크를 감수하는 딜메이킹에 있어서 '${leanALabel}' 온도를 띠고 있습니다. 중요한 결정을 내릴 때 속도감이나 망설이는 지점이 비슷해서, 결정이 어긋나거나 답답함을 느낄 일이 적고 호흡이 잘 맞습니다.`;
      }
      return isEn
        ? `${nameA} is a '${leanALabel}' and ${nameB} is a '${leanBLabel}'. One of you is quick to open the door to new opportunities, while the other holds back to check the safety net. If you assign clear roles—one as the accelerator, one as the brakes—this difference becomes your biggest asset.`
        : `${nameA}님은 '${leanALabel}' 기질, ${nameB}님은 '${leanBLabel}' 기질로 리스크를 대하는 태도가 다릅니다. 한쪽이 기회를 좇아 먼저 문을 열고 나갈 때, 다른 쪽은 잠재적 위험을 꼼꼼히 점검합니다. 서로를 '답답하다'거나 '무모하다'고 탓하기보다 엑셀과 브레이크로 역할을 명확히 나누면 가장 완벽한 균형이 만들어집니다.`;

    case "reporting_rhythm":
      if (isSame) {
        return isEn
          ? `You both use a '${leanALabel}' communication rhythm. Because you share ideas and report progress at a similar pace, your work conversations sync up effortlessly. You naturally understand how the other person likes to be updated.`
          : `두 분은 협업할 때 생각을 전달하고 보고하는 리듬이 '${leanALabel}'(으)로 비슷합니다. 언제 어떻게 진행 상황을 공유할지에 대한 감각이 맞닿아 있어서, 대화의 템포가 어긋나지 않고 부드럽게 흘러갑니다.`;
      }
      return isEn
        ? `Your reporting rhythms contrast—${nameA} uses a '${leanALabel}' while ${nameB} relies on a '${leanBLabel}'. You push ideas forward in very different ways. Try to establish a habit of sharing a quick direction check first, then adjusting your pace for the details.`
        : `업무를 추진하고 소통하는 템포가 ${nameA}님은 '${leanALabel}', ${nameB}님은 '${leanBLabel}' 쪽에 가깝습니다. 한쪽은 핵심부터 먼저 밀어붙이려 하고, 다른 쪽은 상대의 반응을 보며 풀어가려 할 수 있어요. 한 사람의 방식에만 맞추기보다, 짧게 전체 방향을 먼저 공유한 뒤 세부적인 호흡을 맞추는 연습이 필요합니다.`;

    default:
      return isEn
        ? "Your astrological dynamics create an interesting professional chemistry."
        : "사주 구조상 두 사람은 매우 흥미로운 협업 시너지를 냅니다.";
  }
}
