import type { PrototypeLocale } from "./types";
import type { RomanticCompareRowKey } from "../romanticComparisonTableCanonical";
import { josaGwaWa, josaEunNeun, josaRo } from "./romanticLanguage";

export function getRomanticV4CompareProse(
  rowKey: RomanticCompareRowKey,
  locale: PrototypeLocale,
  nameA: string,
  nameB: string,
  leanALabel: string,
  leanBLabel: string,
  sameLean: boolean
): { manifestation: string; understanding: string } {
  const isEn = locale === "en-US";

  if (sameLean) {
    switch (rowKey) {
      case "conflict":
        return {
          manifestation: isEn
            ? `${nameA} and ${nameB} both tend toward ${leanALabel} in conflicts. Since you approach disagreements similarly, timing is less of an issue.`
            : `갈등 상황에서 ${josaGwaWa(nameA)} ${nameB} 모두 ${leanALabel} 성향에 가까워요. 문제를 풀어가는 기본 호흡이 비슷해서, 서로의 대처 방식을 오해하는 일이 적습니다.`,
          understanding: isEn
            ? "Keep using your shared conflict style to navigate issues comfortably."
            : "지금처럼 서로 익숙한 호흡으로 갈등을 풀어가면 충분해요.",
        };
      case "stress":
        return {
          manifestation: isEn
            ? `Under stress, both of you lean toward ${leanALabel}. You process pressure in similar ways.`
            : `스트레스를 받을 때 두 사람 모두 ${leanALabel} 성향을 보여요. 압박감을 다루는 방식이 비슷해서, 상대방의 반응을 쉽게 이해할 수 있어요.`,
          understanding: isEn
            ? "Recognize that your partner needs the same kind of space or support that you do when stressed."
            : "내가 힘들 때 필요한 위로나 시간이 상대방에게도 똑같이 필요하다는 점을 기억하면 도움이 됩니다.",
        };
      case "communication":
        return {
          manifestation: isEn
            ? `In communication, you both prefer ${leanALabel}. Your conversational rhythms naturally align.`
            : `대화할 때 두 사람 모두 ${leanALabel} 쪽에 가까워요. 소통하는 어조나 방식이 비슷해서, 말의 숨은 의도를 넘겨짚을 일이 적습니다.`,
          understanding: isEn
            ? "Your matching communication styles make it easy to understand each other's intent."
            : "대화 코드가 잘 맞으니, 지금처럼 편안하게 이야기를 주고받으면 충분합니다.",
        };
      case "affection":
        return {
          manifestation: isEn
            ? `You both express affection through ${leanALabel}. You speak the same love language.`
            : `애정을 표현할 때 ${josaGwaWa(nameA)} ${nameB} 모두 ${leanALabel} 방식을 선호해요. 사랑을 주고받는 언어가 같아서, 마음이 엇갈리는 느낌이 잘 들지 않아요.`,
          understanding: isEn
            ? "Keep expressing your feelings exactly as you do—it translates perfectly to your partner."
            : "서로 사랑을 느끼는 포인트가 비슷하니, 지금처럼 마음을 표현해 주면 확실하게 전달됩니다.",
        };
      case "expression":
        return {
          manifestation: isEn
            ? `When expressing emotions, you both lean toward ${leanALabel}. You process and share feelings at a similar pace.`
            : `감정을 표현하는 속도와 밀도에서 두 사람 모두 ${leanALabel} 성향을 보여요. 마음을 꺼내놓는 타이밍이 비슷해서 대화가 끊기지 않습니다.`,
          understanding: isEn
            ? "Your emotional pacing matches, reducing the chance of feeling rushed or ignored."
            : "표현의 타이밍이 잘 맞으니, 지금의 대화 템포를 자연스럽게 유지해 주세요.",
        };
      case "decision":
        return {
          manifestation: isEn
            ? `In decision making, both of you prefer ${leanALabel}. You reach conclusions at a similar cadence.`
            : `결정을 내릴 때 두 사람 모두 ${leanALabel} 쪽에 가까워요. 선택을 내리는 기준과 속도가 비슷해서, 일정이나 계획을 정할 때 마찰이 적습니다.`,
          understanding: isEn
            ? "Your shared decision-making style minimizes friction during planning."
            : "함께 무언가를 결정할 때 서로 답답함을 느끼는 일이 적으니, 이대로 편하게 합의를 이뤄가면 됩니다.",
        };
      default:
        return { manifestation: "", understanding: "" };
    }
  }

  // Different leans
  switch (rowKey) {
    case "conflict":
      return {
        manifestation: isEn
          ? `In conflicts, ${nameA} leans toward ${leanALabel} while ${nameB} leans toward ${leanBLabel}. This difference in timing can make one of you feel pushed or ignored.`
          : `갈등 상황에서 "${josaEunNeun(leanALabel)}" ${josaGwaWa(nameA)} "${josaEunNeun(leanBLabel)}" ${josaRo(nameB)} 갈리는 편이에요. 문제를 풀어가는 기본 호흡이 달라서, 서로의 대처 방식을 무관심이나 고집으로 오해하기 쉬워요.`,
        understanding: isEn
          ? "Focus on agreeing to a shared sequence for resolving arguments rather than matching emotional intensity."
          : "감정을 얼마나 강하게 표현하느냐보다, 어떤 순서로 풀어갈지를 먼저 맞춰두면 같은 문제도 덜 다치면서 다룰 수 있습니다.",
      };
    case "stress":
      return {
        manifestation: isEn
          ? `Under stress, ${nameA} leans toward ${leanALabel} while ${nameB} leans toward ${leanBLabel}. You process pressure differently, which can look like rejection to each other.`
          : `스트레스를 받을 때 "${josaEunNeun(leanALabel)}" ${josaGwaWa(nameA)} "${josaEunNeun(leanBLabel)}" ${josaRo(nameB)} 갈려요. 압박감을 다루는 방식이 달라서, 힘든 순간의 행동이 상대방에게는 거절이나 예민함으로 보일 수 있어요.`,
        understanding: isEn
          ? "Recognize that creating distance or seeking comfort is about managing overload, not rejecting the relationship."
          : "혼자만의 시간을 갖는 건 회피가 아니라 과부하를 막으려는 신호로 봐 주고, 언제 다시 대화할지 말로 약속해 두면 서운함이 사라져요.",
      };
    case "communication":
      return {
        manifestation: isEn
          ? `In conversation, ${nameA} prefers ${leanALabel} and ${nameB} prefers ${leanBLabel}. This can cause arguments about tone rather than the actual topic.`
          : `대화할 때 "${josaEunNeun(leanALabel)}" ${josaGwaWa(nameA)} "${josaEunNeun(leanBLabel)}" ${josaRo(nameB)} 나뉘어요. 소통 방식이 달라서, 정작 하려던 말의 내용보다 어조나 타이밍이 먼저 다툼의 원인이 되곤 합니다.`,
        understanding: isEn
          ? "Try stating the core message simply first, before worrying about how it's delivered."
          : "하고 싶은 말의 핵심을 한 줄로 먼저 전하고, 표현 방식을 다듬는 건 그다음으로 미루면 서로의 의도를 곡해하는 일이 줄어듭니다.",
      };
    case "affection":
      return {
        manifestation: isEn
          ? `${nameA} expresses love through ${leanALabel} while ${nameB} uses ${leanBLabel}. You might miss each other's signals of appreciation.`
          : `애정 표현에서 "${josaEunNeun(leanALabel)}" ${josaGwaWa(nameA)} "${josaEunNeun(leanBLabel)}" ${josaRo(nameB)} 갈리는 편이에요. 사랑을 주고받는 언어가 달라서, 마음은 크지만 서로에게 잘 가닿지 않을 때가 있어요.`,
        understanding: isEn
          ? "Translate your partner's actions into your love language to fully appreciate their intent."
          : "말로 느끼는 안심과 행동으로 느끼는 안심을 서로 번역해 주면, 엇갈리던 애정 표현이 꽉 찬 만족감으로 바뀌게 됩니다.",
      };
    case "expression":
      return {
        manifestation: isEn
          ? `When sharing emotions, ${nameA} leans toward ${leanALabel} and ${nameB} leans toward ${leanBLabel}. This pace difference can cause misunderstandings.`
          : `감정 표현에서 "${josaEunNeun(leanALabel)}" ${josaGwaWa(nameA)} "${josaEunNeun(leanBLabel)}" ${josaRo(nameB)} 갈려요. 마음을 꺼내놓는 속도와 밀도가 달라서, 한 사람은 조급함을 느끼고 다른 사람은 부담을 느끼기 쉽습니다.`,
        understanding: isEn
          ? "Understand that slower processing doesn't mean less care, and faster expression doesn't mean pressure."
          : "표현이 빠르다고 마음이 더 크거나, 느리다고 마음이 없는 게 아니라는 걸 먼저 인정하면, 다르게 전달되는 방식을 존중할 수 있습니다.",
      };
    case "decision":
      return {
        manifestation: isEn
          ? `In making choices, ${nameA} leans toward ${leanALabel} while ${nameB} favors ${leanBLabel}. This creates friction in planning and schedules.`
          : `결정을 내릴 때 "${josaEunNeun(leanALabel)}" ${josaGwaWa(nameA)} "${josaEunNeun(leanBLabel)}" ${josaRo(nameB)} 갈려요. 속도 중심과 합의 중심, 서로 기준이 달라서 일정이나 계획을 정할 때마다 작은 마찰이 생기곤 합니다.`,
        understanding: isEn
          ? "Set clear boundaries on what can be decided alone versus what needs joint agreement."
          : "혼자 빠르게 정해도 되는 것과 함께 확인해야 하는 것의 경계를 미리 정해두면, 결정할 때마다 서로 지치는 일이 줄어듭니다.",
      };
    default:
      return { manifestation: "", understanding: "" };
  }
}
