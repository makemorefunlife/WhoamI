import type { PairWorkSignals } from "@/lib/personCore/sajuSignals/pairTypes";
import { pick, LEGACY_FALLBACK_LOCALE } from "./workColleagueCopy";
import { subjectParticle, topicParticle, withParticle } from "@/lib/relationship/koreanParticles";
import type { Locale } from "@/lib/i18n/locale";
import {
  WORK_PRESCRIPTION_VERSION,
  type WorkPrescriptionItem,
  type WorkPrescriptionPack,
} from "./workPrescriptionTypes";

function micromanagingSummary(
  pair: PairWorkSignals,
  nicknameA: string,
  nicknameB: string,
  locale: Locale,
): string {
  const notes = pair.drive_clash_notes;
  if (notes.includes("a_food_high_vs_b_self_low")) {
    return pick(
      locale,
      `${nicknameA}'s drive overlaps with ${nicknameB}'s strong sense of ownership, so if ${nicknameA} pushes one-sidedly with "do it this way," ${nicknameB} tends to go passive or push back. Micromanaging-poison index ${pair.micromanaging_poison_index} (${pair.micromanaging_band}).`,
      `${nicknameA}의 추진력(식상)이 ${nicknameB}의 업무 주체성(비겁) 영역과 겹쳐, ${subjectParticle(nicknameA)} 일방적으로 '이렇게 해'라고 밀어붙이면 ${topicParticle(nicknameB)} 수동적이거나 반발하기 쉽습니다. 마이크로 매니징 피독점 지수 ${pair.micromanaging_poison_index}(${pair.micromanaging_band}).`,
    );
  }
  if (notes.includes("b_food_high_vs_a_self_low")) {
    return pick(
      locale,
      `${nicknameB}'s drive overlaps with ${nicknameA}'s strong sense of ownership — the more detailed instructions ${nicknameB} gives, the more ${nicknameA} tends to lose energy or hold a grudge. Micromanaging-poison index ${pair.micromanaging_poison_index} (${pair.micromanaging_band}).`,
      `${nicknameB}의 추진력이 ${nicknameA}의 주체성 영역과 겹쳐, ${subjectParticle(nicknameB)} 세부 지시를 많이 할수록 ${topicParticle(nicknameA)} 에너지가 빠지거나 뒤끝이 남기 쉽습니다. 마이크로 매니징 피독점 지수 ${pair.micromanaging_poison_index}(${pair.micromanaging_band}).`,
    );
  }
  if (notes.includes("both_managerish")) {
    return pick(
      locale,
      `Both of you have a strong "my way is right" drive-and-manage streak, so fatigue builds fast when detailed instructions overlap in meetings and chats. Micromanaging-poison index ${pair.micromanaging_poison_index} (${pair.micromanaging_band}).`,
      `양쪽 모두 '내 방식이 맞다'는 추진·관리 성향이 강해, 회의·채팅에서 세부 지시가 겹치면 피로가 빠르게 누적됩니다. 마이크로 매니징 피독점 지수 ${pair.micromanaging_poison_index}(${pair.micromanaging_band}).`,
    );
  }
  return pick(
    locale,
    `The gap between drive and ownership-strength bands creates a risk of accumulating "nagging and re-instruction" during work. Micromanaging-poison index ${pair.micromanaging_poison_index} (${pair.micromanaging_band}).`,
    `식상(추진)과 비겁(주체성) 밴드 격차로 업무 중 '잔소리·재지시' 누적 위험이 있습니다. 마이크로 매니징 피독점 지수 ${pair.micromanaging_poison_index}(${pair.micromanaging_band}).`,
  );
}

function buildMicromanagingPrescription(
  pair: PairWorkSignals,
  nicknameA: string,
  nicknameB: string,
  locale: Locale,
): WorkPrescriptionItem | null {
  if (pair.micromanaging_band === "low" && pair.micromanaging_poison_index < 40) {
    return null;
  }

  return {
    topic: "micromanaging_coordination",
    headline: pick(
      locale,
      "Split Roles Instead of Nagging — Micromanaging Coordination",
      "잔소리 대신 역할 분리 — 마이크로 매니징 조율",
    ),
    evidence: {
      source: "pair_work_signals",
      signal_paths: [
        "micromanaging_poison_index",
        "micromanaging_band",
        "drive_clash_notes",
      ],
      summary: micromanagingSummary(pair, nicknameA, nicknameB, locale),
      snapshot: {
        micromanaging_poison_index: pair.micromanaging_poison_index,
        micromanaging_band: pair.micromanaging_band,
        drive_clash_notes: pair.drive_clash_notes,
      },
    },
    do_list: pick(
      locale,
      [
        "At project kickoff, write 3 lines on 'who decides, who executes' — e.g. A owns schedule/priority, B owns output quality/implementation detail.",
        `A weekly 15-minute 'no-instructions meeting' — ${nicknameA} and ${nicknameB} each share just 1 sticking point from the week, and the other proposes the first solution.`,
        "Any 'revision request' on Slack/messenger must include reason + deadline + priority — never send just 'redo this.'",
        "Instead of live-fixing things over screen share mid-meeting, open a separate 30-minute 'edit window' after the meeting — on-the-spot rework in the meeting room fuels micromanaging poison.",
      ],
      [
        "프로젝트 시작 시 '누가 결정권·누가 실행권'을 문서 3줄로 적기 — 예: A는 일정·우선순위, B는 산출물 품질·세부 구현.",
        `주 1회 15분 '지시 금지 미팅' — ${nicknameA}·${nicknameB} 각각 이번 주 막힌 점 1개만 공유하고, 해결책은 상대가 먼저 1안 제시.`,
        "Slack·메신저에서 '수정 요청'은 반드시 이유+기한+우선순위 3요소 포함 — '이거 다시'만 보내지 않기.",
        "회의 중 실시간 화면 공유로 고치기보다, 회의 후 30분 '수정 창'을 따로 열기 — 회의실에서 즉석 재작업은 매니징 독성을 키웁니다.",
      ],
    ),
    dont_list: pick(
      locale,
      [
        "Checking in every 10 minutes with 'how far along are you?' while they're working — chasing progress erodes trust and only breeds pushback.",
        "CC-ing a manager and calling them out publicly — 'embarrassment' at the office lingers 3x longer than the collaboration takes to recover.",
        "'I've got it handled' followed later by 'so why did you do it this way?' — don't hand off responsibility without also splitting the role clearly.",
        "Giving work instructions on weekends or after 9pm — pairs with a high poison index see a bigger backlash the following Monday.",
      ],
      [
        "상대가 작업 중일 때 10분마다 '어디까지 했어?' 체크 — 진행률 추궁은 신뢰를 깎고 반발만 키웁니다.",
        "CC에 상사를 넣고 공개적으로 지적하기 — 오피스에서 '망신'은 협업 회복보다 3배 오래 갑니다.",
        "'내가 다 알아서 할게' 뒤에 '그래서 왜 이렇게 했어?' 이중 메시지 — 역할 분리 없이 책임만 넘기지 마세요.",
        "주말·저녁 9시 이후 업무 지시 — 피독점 지수가 높은 페어일수록 다음 주 월요일 반동이 큽니다.",
      ],
    ),
  };
}

function buildLeadershipPrescription(
  pair: PairWorkSignals,
  nicknameA: string,
  nicknameB: string,
  locale: Locale,
): WorkPrescriptionItem | null {
  if (
    pair.leadership_conflict_band === "low" &&
    pair.leadership_conflict_index < 40
  ) {
    return null;
  }

  const dualStubborn = pair.drive_clash_notes.includes("dual_stubborn");
  const dualHighSelf = pair.drive_clash_notes.includes("dual_high_self");
  const summary = dualStubborn
    ? pick(
        locale,
        `Both ${nicknameA} and ${nicknameB} have a strong sense of ownership, so when opinions diverge, "who's right" fights tend to drag on. Leadership-conflict index ${pair.leadership_conflict_index} (${pair.leadership_conflict_band}).`,
        `${withParticle(nicknameA)} ${nicknameB} 모두 주체성 밴드가 강해, 의견이 갈리면 '누가 맞는지' 싸움이 길어지기 쉽습니다. 주도권 충돌 지수 ${pair.leadership_conflict_index}(${pair.leadership_conflict_band}).`,
      )
    : dualHighSelf
      ? pick(
          locale,
          `Both of you have a strong self-assertive streak, so subtle competition over speaking rights and final say tends to arise in meetings. Leadership-conflict index ${pair.leadership_conflict_index} (${pair.leadership_conflict_band}).`,
          `양쪽 비겁(자기 주장) 세력이 높아, 회의에서 발언권·최종 결정권을 두고 미세한 경쟁이 생기기 쉽습니다. 주도권 충돌 지수 ${pair.leadership_conflict_index}(${pair.leadership_conflict_band}).`,
        )
      : pick(
          locale,
          `The gap between drive and ownership-strength bands means "who leads" gets re-decided every single time. Leadership-conflict index ${pair.leadership_conflict_index} (${pair.leadership_conflict_band}).`,
          `추진 밴드와 주체성 밴드 격차로 '누가 리드할지'가 매번 새로 갈립니다. 주도권 충돌 지수 ${pair.leadership_conflict_index}(${pair.leadership_conflict_band}).`,
        );

  return {
    topic: "leadership_conflict",
    headline: pick(
      locale,
      "When Both Are Leaders, the Rules Lead — Resolving Office Power Struggles",
      "둘 다 리더면 규칙이 리더 — 오피스 주도권 갈등 해소",
    ),
    evidence: {
      source: "pair_work_signals",
      signal_paths: [
        "leadership_conflict_index",
        "leadership_conflict_band",
        "drive_clash_notes",
      ],
      summary,
      snapshot: {
        leadership_conflict_index: pair.leadership_conflict_index,
        leadership_conflict_band: pair.leadership_conflict_band,
        drive_clash_notes: pair.drive_clash_notes,
      },
    },
    do_list: pick(
      locale,
      [
        "Designate '1 decision-maker' per agenda item ahead of time — never let both of you hold final say on the same item.",
        `On disagreement, use a '2 min each speaks → 1 min silence → decision-maker states one line' protocol — so ${nicknameA} and ${nicknameB} don't both raise their voices at once.`,
        "Fix topics where power struggles arise (schedule, direction, external comms) as agenda item #1 in the weekly meeting — don't suddenly relitigate them in chat.",
        "A 24-hour 'no re-litigating' rule after a decision — don't reverse it hastily; only revise at the next regular meeting if the data changes.",
      ],
      [
        "안건당 '결정자 1명'을 미리 지정 — 같은 안건에서 둘 다 최종 결정권을 쥐지 않기.",
        `의견 충돌 시 '2분 각자 발언 → 1분 침묵 → 결정자 한 줄 선언' 프로토콜 — ${nicknameA}·${subjectParticle(nicknameB)} 동시에 말 높이지 않게.`,
        "주도권이 갈리는 주제(일정·방향·외부 커뮤니케이션)는 주간 회의 안건 1번으로 고정 — 갑자기 채팅방에서 재판하지 않기.",
        "결정 후 24시간 '재논의 유예' 규칙 — 급하게 뒤집지 않고, 데이터가 바뀌면 다음 정기 미팅에서만 수정.",
      ],
    ),
    dont_list: pick(
      locale,
      [
        "Cutting off the other's speech in a meeting and repeating 'hear me out' — a strong-ownership-vs-strong-ownership combo only ends in a volume contest.",
        "Venting complaints about a settled decision to another teammate behind the scenes — side channels only fuel the power struggle.",
        "Value judgments like 'your way is outdated' — discuss using facts, deadlines, and risk only.",
        "Using project results only for personal branding — a pair's power struggle never resolves without 'shared credit.'",
      ],
      [
        "회의 중 상대 발언을 끊고 '내 말 들어봐' 반복 — 주체성×주체성 조합은 음량 경쟁으로만 끝납니다.",
        "결정된 사항을 뒤에서 다른 팀원에게 먼저 불만 토로하기 — 사이드 채널은 주도권 전쟁의 연료입니다.",
        "'네 방식은 옛날 방식' 같은 가치 판단 — 사실·기한·리스크만으로 논의하세요.",
        "프로젝트 성과를 개인 브랜딩에만 쓰기 — 페어 주도권 갈등은 '공동 성과' 없이는 절대 안 풀립니다.",
      ],
    ),
  };
}

function buildOfficeBaseline(
  nicknameA: string,
  nicknameB: string,
  locale: Locale,
): WorkPrescriptionItem {
  return {
    topic: "office_baseline",
    headline: pick(locale, "10 Minutes a Week — Collaboration Check-In (Shared)", "매주 10분 — 협업 운영 점검 (공통)"),
    evidence: {
      source: "pair_work_signals",
      signal_paths: ["work_prescription.baseline"],
      summary: pick(
        locale,
        "Even when pair cross-signals don't spike on one topic, small handoff gaps compound in peer collaboration. Below is a preventive baseline — actions either person can take without assuming a reporting-line hierarchy.",
        "pair 교차 신호가 특정 주제에서 강하게 치솟지 않아도, 동료 협업에서는 작은 전달 누락이 복리로 커집니다. 아래는 예방용 기본 처방이며, 상하 관계를 전제하지 않습니다.",
      ),
      snapshot: {},
    },
    do_list: pick(
      locale,
      [
        `10 minutes every Friday (sync or async): '${nicknameA} / ${nicknameB} — 1 win this week · 1 friction to clear' — keep it peer-to-peer, not a performance review.`,
        "Any work ask names channel + deadline + done-when criteria (Slack/Teams/email — pick the team's normal channel).",
        "If conflict isn't closed same-day, park it as Monday's first agenda item — not a late-night chat spiral.",
      ],
      [
        `금요일 10분(대면·화상·비동기 메모 모두 가능): '${nicknameA}·${nicknameB} — 이번 주 고마웠던 점 1 · 아쉬웠던 점 1' — 평가가 아니라 운영 점검으로.`,
        "업무 요청은 채널·기한·완료 기준을 항상 명시 (팀에서 쓰는 메신저·메일 기준).",
        "갈등 당일 해결이 안 되면 '월요일 첫 미팅 안건'으로만 넘기기 — 밤늦은 장문 메시지로 이어가지 않기.",
      ],
    ),
    dont_list: pick(
      locale,
      [
        "Stacking long, heated messages in chat — keep it short, then book five minutes live if it's tangled.",
        "Correcting the other person's approach in front of the wider group — take disagreement private first.",
        "Dropping a scope change the night before a deadline without a clear owner and new done-when.",
      ],
      [
        "감정 섞인 장문 메신저 연타 — 짧게 쓰고, 복잡하면 5분 통화·짧은 미팅으로.",
        "상대 방식을 다른 동료 앞에서 바로 지적하거나 비꼬기 — 피드백은 되도록 따로.",
        "마감 전날 밤, 담당·완료 기준 없이 갑작스런 범위 변경 통보.",
      ],
    ),
  };
}

function resolveIntroLine(items: WorkPrescriptionItem[], locale: Locale): string {
  const topics = new Set(items.map((i) => i.topic));
  if (topics.has("micromanaging_coordination") && topics.has("leadership_conflict")) {
    return pick(
      locale,
      "This is an office pairing where drive and ownership are both strong at once. The Do/Don't below is pulled from your pair.work cross-signals, and is meant for action, separate from the existing office report narrative.",
      "추진력과 주체성이 동시에 강한 오피스 조합입니다. 아래 Do/Don't는 pair.work 교차 신호에서 뽑았고, 기존 오피스 리포트 서사와 별도로 실천용입니다.",
    );
  }
  if (topics.has("micromanaging_coordination")) {
    return pick(
      locale,
      "A risk of accumulating detailed instructions and re-instructions at work has been detected. Lower the poison level with role separation and instruction rules.",
      "업무 중 세부 지시·재지시 누적 위험이 감지됐습니다. 역할 분리와 지시 규칙으로 피독점을 낮추세요.",
    );
  }
  if (topics.has("leadership_conflict")) {
    return pick(
      locale,
      "There are signs of a power struggle. Decide 'who's the decision-maker for this agenda item' before debating 'who's right.'",
      "주도권 충돌 신호가 있습니다. '누가 맞는지'보다 '누가 이번 안건 결정자인지'를 먼저 정하세요.",
    );
  }
  return pick(
    locale,
    "A practical prescription based on your coworker-pair cross-signals. Keep reading the existing sections for the analysis narrative — check here for 'so what do I actually do?'",
    "동료 pair 교차 신호 기반 실행 처방입니다. 분석 서사는 기존 섹션을 그대로 보시고, '그래서 뭐 하라고?'는 여기서 확인하세요.",
  );
}

export function buildWorkPrescriptions(params: {
  pair: PairWorkSignals;
  nicknameA: string;
  nicknameB: string;
  locale?: Locale;
}): WorkPrescriptionPack {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const candidates = [
    buildMicromanagingPrescription(
      params.pair,
      params.nicknameA,
      params.nicknameB,
      locale,
    ),
    buildLeadershipPrescription(
      params.pair,
      params.nicknameA,
      params.nicknameB,
      locale,
    ),
  ].filter((item): item is WorkPrescriptionItem => item != null);

  const items =
    candidates.length > 0
      ? candidates
      : [buildOfficeBaseline(params.nicknameA, params.nicknameB, locale)];

  if (candidates.length > 0 && candidates.length < 2) {
    items.push(buildOfficeBaseline(params.nicknameA, params.nicknameB, locale));
  }

  const priority: Record<WorkPrescriptionItem["topic"], number> = {
    leadership_conflict: 100,
    micromanaging_coordination: 90,
    office_baseline: 10,
  };
  items.sort((a, b) => priority[b.topic] - priority[a.topic]);

  return {
    schema_version: WORK_PRESCRIPTION_VERSION,
    intro_line: resolveIntroLine(items, locale),
    items,
  };
}
