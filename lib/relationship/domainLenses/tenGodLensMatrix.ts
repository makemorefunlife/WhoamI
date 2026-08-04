/**
 * Ten-God Domain Lens Translation Matrix
 *
 * Defines context-aware behavioral translations for all Ten Gods across
 * Partner, Family Parent-Child, Friend, and Cowork domains.
 *
 * Law: A single Ten God must NEVER dictate fixed behavior without
 * corroborating evidence (position, strength, direction, and psych context).
 */

import type { DomainPairLensId } from "@/lib/personCore/pairContextEngine/types";

export type TenGodCode =
  | "비견"
  | "겁재"
  | "식신"
  | "상관"
  | "편재"
  | "정재"
  | "편관"
  | "정관"
  | "편인"
  | "정인";

export type DomainTenGodExpression = {
  domain: DomainPairLensId;
  healthy_expression_ko: string;
  healthy_expression_en: string;
  tension_expression_ko: string;
  tension_expression_en: string;
  counterpart_experience_ko: string;
  counterpart_experience_en: string;
  corroborating_evidence_required: string[];
  prohibited_standalone_claims: string[];
};

export type TenGodMatrixEntry = {
  ten_god: TenGodCode;
  domain_expressions: Record<DomainPairLensId, DomainTenGodExpression>;
};

export const TEN_GOD_LENS_MATRIX: Record<TenGodCode, TenGodMatrixEntry> = {
  비견: {
    ten_god: "비견",
    domain_expressions: {
      partner: {
        domain: "partner",
        healthy_expression_ko: "동등한 동반자적 연대감과 자립적인 생활 분담",
        healthy_expression_en: "Equal partnership solidarity and independent division of household labor",
        tension_expression_ko: "양보 없는 자존심 대립 및 의사결정 시 주도권 평행선",
        tension_expression_en: "Uncompromising pride clash and parallel standoffs in decision making",
        counterpart_experience_ko: "친구나 동료처럼 든든하지만, 때로는 한 발도 물러서지 않는 완고함으로 느껴짐",
        counterpart_experience_en: "Feels like a reliable peer, but sometimes like an unyielding standoff",
        corroborating_evidence_required: ["day_stem_clash", "stem_combine", "power_balance_band"],
        prohibited_standalone_claims: ["비견이 있으면 반드시 배우자와 싸운다", "무조건 이혼수다"],
      },
      family: {
        domain: "family",
        healthy_expression_ko: "자녀의 인격과 주체성을 친구처럼 존중하는 수평적 소통",
        healthy_expression_en: "Horizontal communication respecting the child's autonomy like an equal",
        tension_expression_ko: "부모-자녀 간 권위 인정 부재 및 훈육 상황에서의 맞불 대립",
        tension_expression_en: "Erosion of parental boundary and head-on defiance during discipline",
        counterpart_experience_ko: "편안한 친구 같지만 부모로서의 든든한 울타리가 흔들릴 때 불안감을 느낌",
        counterpart_experience_en: "Comfortable like a friend, but uneasy when authoritative boundaries fade",
        corroborating_evidence_required: ["parent_authority_band", "stem_interactions"],
        prohibited_standalone_claims: ["자녀가 부모를 무시한다", "패륜적 성향이다"],
      },
      friend: {
        domain: "friend",
        healthy_expression_ko: "조건 없는 의리와 동등한 1/N 정산, 편안한 동질감",
        healthy_expression_en: "Unconditional loyalty, equal cost splitting, and natural peer resonance",
        tension_expression_ko: "사소한 자존심 경쟁 및 상대의 간섭에 대한 즉각적 방어",
        tension_expression_en: "Petty ego competition and instant defensiveness against unsolicited advice",
        counterpart_experience_ko: "가장 편안하고 뒤끝 없는 친구이지만, 한번 틀어지면 먼저 사과하지 않음",
        counterpart_experience_en: "Most effortless friend, but rarely apologizes first if offended",
        corroborating_evidence_required: ["treasurer_role_fit", "branch_interactions"],
        prohibited_standalone_claims: ["친구를 경쟁자로만 본다"],
      },
      work: {
        domain: "work",
        healthy_expression_ko: "자기 주도적 완결력과 동료에 대한 독립적 신뢰",
        healthy_expression_en: "Self-driven accountability and autonomous trust in teammates",
        tension_expression_ko: "간섭이나 마이크로매니징에 대한 거부감 및 협업 시 조율 지연",
        tension_expression_en: "Resistance to micromanagement and delay in team consensus alignment",
        counterpart_experience_ko: "혼자서도 일을 척척 해내지만, 업무 영역 침범에 매우 민감함",
        counterpart_experience_en: "Executes independently well, but highly sensitive to territory intrusion",
        corroborating_evidence_required: ["leadership_split", "task_execution_fit"],
        prohibited_standalone_claims: ["팀워크가 불가능하다"],
      },
      romantic: {
        domain: "romantic",
        healthy_expression_ko: "밀당 없는 솔직한 감정 교류와 상호 독립성 인정",
        healthy_expression_en: "Direct honesty without games and mutual respect for personal space",
        tension_expression_ko: "연인 간의 다정함보다 자존심이 앞서며 생기는 냉전",
        tension_expression_en: "Pride getting in the way of tenderness, creating cold war stalemates",
        counterpart_experience_ko: "꾸밈없이 편하지만 때때로 연인 특유의 특별한 대우가 아쉬움",
        counterpart_experience_en: "Comfortably honest, but sometimes misses romantic pampering",
        corroborating_evidence_required: ["attraction_band", "day_branch_combines"],
        prohibited_standalone_claims: ["연애 감정이 식는다"],
      },
    },
  },
  겁재: {
    ten_god: "겁재",
    domain_expressions: {
      partner: {
        domain: "partner",
        healthy_expression_ko: "가계 위기 시 승부사적 돌파력과 외부 경쟁에 맞서는 든든한 방패",
        healthy_expression_en: "Bold breakthrough spirit in family crisis and strong shield against outside pressures",
        tension_expression_ko: "공동 재정에서의 충동적 모험 및 가정 내 승패 논리 집착",
        tension_expression_en: "Impulsive risk in joint finances and obsessing over winning domestic arguments",
        counterpart_experience_ko: "위기엔 든든하지만, 일상적 갈등에서 이기려 드는 태도에 상처받음",
        counterpart_experience_en: "Reliable in a crisis, but hurt by their drive to win everyday arguments",
        corroborating_evidence_required: ["cfo_affinity_gap", "branch_clashes"],
        prohibited_standalone_claims: ["배우자의 재산을 탕진한다", "외도 성향이다"],
      },
      family: {
        domain: "family",
        healthy_expression_ko: "자녀의 야성과 승부욕을 격려하고 도전 기회를 열어줌",
        healthy_expression_en: "Encouraging the child's competitive drive and providing bold challenges",
        tension_expression_ko: "부모의 일방적 승부욕 강요 및 형제간/자녀와의 비교 의식",
        tension_expression_en: "Projecting competitive pressure and comparing with siblings/peers",
        counterpart_experience_ko: "자신을 강하게 키우려 하지만, 인정받지 못하면 쉽게 위축되거나 반발함",
        counterpart_experience_en: "Wants them to be tough, but causes rebellion when validation is missing",
        corroborating_evidence_required: ["discipline_friction_band", "praise_trigger"],
        prohibited_standalone_claims: ["자녀를 착취한다"],
      },
      friend: {
        domain: "friend",
        healthy_expression_ko: "친구를 위해 큰 판을 벌이고 위기 때 확실하게 편을 들어줌",
        healthy_expression_en: "Takes big initiatives for friends and fiercely backs them in trouble",
        tension_expression_ko: "미묘한 비교 심리와 서열 의식, 지출 시의 충동성",
        tension_expression_en: "Subtle rivalry, status consciousness, and impulsive spending spikes",
        counterpart_experience_ko: "화끈하고 멋있지만 은근히 기싸움이 느껴질 때 피로함",
        counterpart_experience_en: "Generous and bold, but tiring when subtle power dynamics emerge",
        corroborating_evidence_required: ["jealousy_guard_band", "treasurer_split"],
        prohibited_standalone_claims: ["친구의 것을 빼앗는다"],
      },
      work: {
        domain: "work",
        healthy_expression_ko: "압도적인 경쟁력과 난관 돌파, 공격적인 목표 달성력",
        healthy_expression_en: "Aggressive target execution, fierce drive, and overcoming bottlenecks",
        tension_expression_ko: "공을 독점하려는 경향 및 협업자를 잠재적 라이벌로 인식",
        tension_expression_en: "Tendency to claim credit and viewing teammates as potential competitors",
        counterpart_experience_ko: "성과의 견인차이지만, 함께 일할 때 정보 차단이나 견제가 우려됨",
        counterpart_experience_en: "Drives results, but concerns arise over gatekeeping or rivalry",
        corroborating_evidence_required: ["work_leadership_split", "micromanage_guard"],
        prohibited_standalone_claims: ["사내 정치를 일삼는다"],
      },
      romantic: {
        domain: "romantic",
        healthy_expression_ko: "강렬한 소유욕과 상대를 지키려는 열정적인 헌신",
        healthy_expression_en: "Intense passion, protective loyalty, and wholehearted commitment",
        tension_expression_ko: "불안에서 기인한 질투심과 통제 욕구, 감정의 기복",
        tension_expression_en: "Anxiety-driven jealousy, control impulses, and sharp emotional swings",
        counterpart_experience_ko: "뜨겁게 사랑받는 느낌이지만 때로는 숨이 막히거나 눈치를 보게 됨",
        counterpart_experience_en: "Deeply captivating love, but occasionally suffocating or volatile",
        corroborating_evidence_required: ["tension_packet_count", "wonjin_hits"],
        prohibited_standalone_claims: ["집착 광기 폭력성"],
      },
    },
  },
  식신: {
    ten_god: "식신",
    domain_expressions: {
      partner: {
        domain: "partner",
        healthy_expression_ko: "풍요로운 식생활과 일상의 소소한 행복, 다정한 생활 돌봄",
        healthy_expression_en: "Nourishing domestic warmth, enjoyment of daily meals, and gentle care",
        tension_expression_ko: "현실적 긴장감 부족, 가계 위기 시 안일한 낙관론",
        tension_expression_en: "Lack of urgency and complacent optimism during household financial crunches",
        counterpart_experience_ko: "함께 있으면 마음이 편안하고 힐링되지만, 현실적 문제 해결엔 답답함",
        counterpart_experience_en: "Peaceful and restorative presence, but sometimes sluggish in crisis solving",
        corroborating_evidence_required: ["household_rhythm_fit", "tempo_gap"],
        prohibited_standalone_claims: ["게으르고 무책임하다"],
      },
      family: {
        domain: "family",
        healthy_expression_ko: "자녀의 기질을 따뜻하게 수용하고 맛있는 음식과 정서적 안정 제공",
        healthy_expression_en: "Unconditional warmth, nourishing food, and emotional safety for the child",
        tension_expression_ko: "과도한 관대함으로 인한 기본 생활 규칙 훈육의 부재",
        tension_expression_en: "Excessive leniency leading to lack of structured boundaries and rules",
        counterpart_experience_ko: "세상에서 가장 따뜻한 품이지만 훈육의 일관성이 부족할 수 있음",
        counterpart_experience_en: "Deeply loving sanctuary, but may lack firm discipline structures",
        corroborating_evidence_required: ["discipline_friction_band"],
        prohibited_standalone_claims: ["자녀를 망친다"],
      },
      friend: {
        domain: "friend",
        healthy_expression_ko: "맛집 탐방과 취미 공유, 편안하고 부담 없는 만남의 장 제공",
        healthy_expression_en: "Exploring great food, shared hobbies, and effortless casual gatherings",
        tension_expression_ko: "갈등 상황을 회피하고 좋은 게 좋은 거라며 넘어가려는 태도",
        tension_expression_en: "Conflict avoidance and smoothing over deep issues superficially",
        counterpart_experience_ko: "만나면 언제나 즐겁고 힐링되는 0순위 밥친구",
        counterpart_experience_en: "The ultimate relaxing friend for great food and good vibes",
        corroborating_evidence_required: ["taste_shared_band"],
        prohibited_standalone_claims: ["진지한 관계 불가능"],
      },
      work: {
        domain: "work",
        healthy_expression_ko: "탁월한 전문성과 장인정신, 꾸준한 제품/서비스 퀄리티 향상",
        healthy_expression_en: "Deep craft mastery, steady quality enhancement, and dependable execution",
        tension_expression_ko: "납기나 비즈니스 마진보다 자기 만족적 완성도에 집착",
        tension_expression_en: "Prioritizing personal perfectionism over commercial deadlines and speed",
        counterpart_experience_ko: "결과물의 품질은 최고지만 속도전에서는 답답함을 느낄 수 있음",
        counterpart_experience_en: "Superb quality output, but can feel slow during urgent sprints",
        corroborating_evidence_required: ["task_execution_fit"],
        prohibited_standalone_claims: ["일머리가 없다"],
      },
      romantic: {
        domain: "romantic",
        healthy_expression_ko: "순수하고 다정한 애정 표현과 상대를 먹이고 돌보는 기쁨",
        healthy_expression_en: "Pure, tender affection and genuine joy in caring for the partner",
        tension_expression_ko: "부담 없는 관계에 머물려 하거나 진지한 책임 약속의 지연",
        tension_expression_en: "Lingering in comfort zones or delaying heavy relational commitments",
        counterpart_experience_ko: "사랑받는 포근함을 주지만 미래 계획에 대한 결단력이 필요함",
        counterpart_experience_en: "Gives comforting warmth, but needs push for long-term decisive steps",
        corroborating_evidence_required: ["reassurance_match"],
        prohibited_standalone_claims: ["책임 회피자"],
      },
    },
  },
  상관: {
    ten_god: "상관",
    domain_expressions: {
      partner: {
        domain: "partner",
        healthy_expression_ko: "뛰어난 위트와 표현력, 가계의 불합리한 구조를 개선하는 혁신성",
        healthy_expression_en: "Sharp wit, vibrant expression, and reforming outdated domestic conventions",
        tension_expression_ko: "날카로운 비판 언어와 상대의 단점에 대한 가차 없는 지적",
        tension_expression_en: "Sharp critical verbal barbs and relentless pointing out of partner's flaws",
        counterpart_experience_ko: "말이 잘 통하고 똑똑하지만, 말 한마디에 깊은 내상을 입기 쉬움",
        counterpart_experience_en: "Brilliant and communicative, but sharp words can leave deep wounds",
        corroborating_evidence_required: ["conflict_trigger_band", "stem_clashes"],
        prohibited_standalone_claims: ["남편/아내를 잡아먹는다", "상관견관 백호살 극단론"],
      },
      family: {
        domain: "family",
        healthy_expression_ko: "자녀의 창의력과 개성을 기민하게 캐치하고 재능을 발굴함",
        healthy_expression_en: "Quickly spotting child's unique talents and fostering creative genius",
        tension_expression_ko: "자녀의 실수에 대한 즉각적 지적과 잔소리, 말꼬리 잡기",
        tension_expression_en: "Immediate sharp critiques on mistakes, nagging, and verbal nitpicking",
        counterpart_experience_ko: "부모의 기대를 만족시키기 어렵고 지적받을까 봐 주눅 들거나 말문을 닫음",
        counterpart_experience_en: "Feels hard to satisfy expectations and may clam up to avoid criticism",
        corroborating_evidence_required: ["discipline_friction_band", "praise_trigger"],
        prohibited_standalone_claims: ["정서적 학대자"],
      },
      friend: {
        domain: "friend",
        healthy_expression_ko: "트렌드에 밝고 위트 넘치며 모임의 분위기를 주도하는 재미",
        healthy_expression_en: "Trend-savvy, hilarious banter, and enlivening the group atmosphere",
        tension_expression_ko: "뼈 때리는 농담이 선을 넘거나 상대의 약점을 유희화함",
        tension_expression_en: "Sarcastic jokes crossing the line or roasting sensitive vulnerabilities",
        counterpart_experience_ko: "가장 재미있지만 기분이 상했을 때 나오는 독설에 긴장하게 됨",
        counterpart_experience_en: "Most entertaining company, but tense around sharp tongues when moody",
        corroborating_evidence_required: ["emotional_vent_band"],
        prohibited_standalone_claims: ["이간질 전문가"],
      },
      work: {
        domain: "work",
        healthy_expression_ko: "탁월한 기획력, 프레젠테이션 스킬, 조직의 비효율 타파",
        healthy_expression_en: "Exceptional pitching, rapid problem identification, and breaking silos",
        tension_expression_ko: "피드백 시 쿠션어 부재, 상사나 규정에 대한 노골적 반발",
        tension_expression_en: "Lack of feedback cushioning and vocal clashes with legacy hierarchy",
        counterpart_experience_ko: "능력은 확실하지만 함께 보고할 때 살얼음판을 걷는 긴장감 유발",
        counterpart_experience_en: "Brilliant execution, but high stakes when navigating sensitive politics",
        corroborating_evidence_required: ["feedback_cushion_band", "work_special_weapon"],
        prohibited_standalone_claims: ["조직 부적응자"],
      },
      romantic: {
        domain: "romantic",
        healthy_expression_ko: "매력적인 언변과 센스, 상대를 사로잡는 로맨틱한 이벤트",
        healthy_expression_en: "Irresistible charm, verbal flirtation, and dazzling romantic gestures",
        tension_expression_ko: "싸울 때 논리적 말싸움으로 상대를 압도하려는 승부욕",
        tension_expression_en: "Obsessing over out-debating and overwhelming the partner in arguments",
        counterpart_experience_ko: "설레고 매력적이지만 다툴 때 진심 어린 사과를 듣기 어려움",
        counterpart_experience_en: "Thrilling charm, but hard to hear genuine humility during heated spats",
        corroborating_evidence_required: ["conflict_expression_speed"],
        prohibited_standalone_claims: ["바람둥이"],
      },
    },
  },
  편재: {
    ten_god: "편재",
    domain_expressions: {
      partner: {
        domain: "partner",
        healthy_expression_ko: "가계 자산의 스케일업과 재테크 투자 기회 포착, 시원시원한 결단",
        healthy_expression_en: "Scaling up household wealth, spotting investment upside, and bold decisiveness",
        tension_expression_ko: "고위험 투자 선호 및 생활비의 불규칙한 운용으로 인한 불안 유발",
        tension_expression_en: "High-risk speculative tendencies and volatility in household cashflow",
        counterpart_experience_ko: "통이 크고 미래 비전이 있지만, 가계부의 안정성을 위협할까 봐 불안함",
        counterpart_experience_en: "Visionary and generous, but creates anxiety regarding financial stability",
        corroborating_evidence_required: ["cfo_affinity_gap", "branch_pairs"],
        prohibited_standalone_claims: ["도박 파산수"],
      },
      family: {
        domain: "family",
        healthy_expression_ko: "자녀에게 다양한 세상 경험과 과감한 교육 기회 지원",
        healthy_expression_en: "Providing broad worldly exposure and bold developmental opportunities",
        tension_expression_ko: "정서적 교감보다 물질적 보상이나 조건부 보상으로 환원하려는 태도",
        tension_expression_en: "Replacing emotional empathy with material gifts or conditional rewards",
        counterpart_experience_ko: "물질적으로 든든하지만 가끔 부모의 진심 어린 속마음이 그립거나 거리감이 듦",
        counterpart_experience_en: "Well-provided materially, but occasionally longs for deeper heart-to-heart warmth",
        corroborating_evidence_required: ["hidden_needs_band"],
        prohibited_standalone_claims: ["자식을 돈으로만 본다"],
      },
      friend: {
        domain: "friend",
        healthy_expression_ko: "화끈하게 지갑을 열고 큰 스케일의 여행/이벤트를 기획하는 리더십",
        healthy_expression_en: "Generous host, willing spender, and organizing exciting trips and outings",
        tension_expression_ko: "돈 쓰는 방식에 대한 과시나 무리한 지출 요구로 인한 위화감",
        tension_expression_en: "Showy spending habits or setting an expensive pace that pressures others",
        counterpart_experience_ko: "함께 놀면 스케일이 크고 재미있지만 더치페이 시 계산이 엉성할 수 있음",
        counterpart_experience_en: "Thrilling and generous friend, though loose on exact 1/N accounting",
        corroborating_evidence_required: ["treasurer_role_fit", "travel_lead_band"],
        prohibited_standalone_claims: ["호구 또는 사기꾼"],
      },
      work: {
        domain: "work",
        healthy_expression_ko: "시장 기회 포착, 사업 개발(BD), 자원 동원력과 대외 협상력",
        healthy_expression_en: "Spotting market arbitrage, business development, and resource mobilization",
        tension_expression_ko: "디테일한 운영 관리 소홀 및 단기적 성과 집착으로 인한 리스크",
        tension_expression_en: "Neglecting operational hygiene in favor of chasing high-risk short gains",
        counterpart_experience_ko: "기회를 물어오는 능력은 탁월하나 뒷수습은 동료의 몫이 되기 쉬움",
        counterpart_experience_en: "Great rainmaker, but operational cleanup often falls on colleagues",
        corroborating_evidence_required: ["work_leadership_split", "task_execution_fit"],
        prohibited_standalone_claims: ["사기 기획자"],
      },
      romantic: {
        domain: "romantic",
        healthy_expression_ko: "아낌없이 베푸는 선물과 멋진 데이트 코스로 상대를 감동시킴",
        healthy_expression_en: "Lavish gifts, curated dates, and generous expressions of devotion",
        tension_expression_ko: "모든 것을 물질이나 이벤트로 해결하려 하며 감정의 섬세함을 간과",
        tension_expression_en: "Treating relationship issues transactionally or with grand surface gestures",
        counterpart_experience_ko: "공주/왕자처럼 대접받지만 진지한 갈등 상황에서 회피하는 느낌을 받음",
        counterpart_experience_en: "Treated royally, but senses emotional avoidance during deep conflicts",
        corroborating_evidence_required: ["affection_composite"],
        prohibited_standalone_claims: ["외도 확정"],
      },
    },
  },
  정재: {
    ten_god: "정재",
    domain_expressions: {
      partner: {
        domain: "partner",
        healthy_expression_ko: "철저한 가계부 관리와 예측 가능한 생활 리듬, 성실한 자산 축적",
        healthy_expression_en: "Meticulous budget management, predictable life rhythm, and steady asset building",
        tension_expression_ko: "사소한 지출에 대한 통제와 인색함, 융통성 없는 규칙 강요",
        tension_expression_en: "Micromanaging minor expenses, frugality anxiety, and rigid budgeting rules",
        counterpart_experience_ko: "가정을 지키는 가장 믿음직한 기둥이지만 숨 쉴 틈 없는 통제에 답답함",
        counterpart_experience_en: "Most reliable anchor for stability, but rigid control feels constricting",
        corroborating_evidence_required: ["cfo_affinity_gap", "household_chores_fit"],
        prohibited_standalone_claims: ["구두쇠"],
      },
      family: {
        domain: "family",
        healthy_expression_ko: "규칙적인 생활 습관과 성실함의 본보기를 보여주는 안정적 양육",
        healthy_expression_en: "Modeling steady diligence, punctuality, and structured daily routines",
        tension_expression_ko: "아이의 즉흥적 놀이나 낭비를 용납하지 못하는 결벽적 훈육",
        tension_expression_en: "Inability to tolerate playfulness or messiness, leading to rigid parenting",
        counterpart_experience_ko: "늘 믿음직하고 안전하지만 부모 앞에서는 긴장을 늦추기 어려움",
        counterpart_experience_en: "Always safe and reliable, but hard to fully relax under their watchful eye",
        corroborating_evidence_required: ["discipline_friction_band", "household_roles"],
        prohibited_standalone_claims: ["강박증 환자"],
      },
      friend: {
        domain: "friend",
        healthy_expression_ko: "정확한 1/N 정산, 약속 시간 엄수, 변함없는 꾸준한 관계 유지",
        healthy_expression_en: "Flawless bill splitting, prompt punctuality, and consistent long-term loyalty",
        tension_expression_ko: "10원 단위 정산에 대한 집착이나 예상 밖의 비용 지출에 대한 민감함",
        tension_expression_en: "Over-precision in bill splitting or visible stress over unplanned expenses",
        counterpart_experience_ko: "계산이 깔끔해서 믿음이 가지만 즉흥적인 번개 모임은 꺼려함",
        counterpart_experience_en: "Trustworthy and clean accounting, though hesitant with spontaneous plans",
        corroborating_evidence_required: ["treasurer_role_fit"],
        prohibited_standalone_claims: ["인간미 제로"],
      },
      work: {
        domain: "work",
        healthy_expression_ko: "오차 없는 회계/정산, 철저한 공정 관리, 안정적인 운영 리듬",
        healthy_expression_en: "Flawless financial accuracy, strict schedule control, and stable operations",
        tension_expression_ko: "혁신이나 변화에 대한 보수적 저항 및 프로세스 집착",
        tension_expression_en: "Resistance to novel experimentation and bureaucratic process defense",
        counterpart_experience_ko: "리스크를 막아주는 든든한 파트너지만 속도감 있는 혁신엔 브레이크가 됨",
        counterpart_experience_en: "Crucial safety buffer against errors, but acts as a brake on rapid agility",
        corroborating_evidence_required: ["work_decision_style", "task_execution_fit"],
        prohibited_standalone_claims: ["발전 없는 꼰대"],
      },
      romantic: {
        domain: "romantic",
        healthy_expression_ko: "변치 않는 일편단심과 일상 속에서 성실하게 표현하는 책임감",
        healthy_expression_en: "Steadfast devotion, unwavering reliability, and dedicated care",
        tension_expression_ko: "데이트 코스의 단조로움과 감정 표현의 서투름, 실리 위주 접근",
        tension_expression_en: "Repetitive dating routines and utilitarian approach to romantic gestures",
        counterpart_experience_ko: "신뢰도 100%의 배우자감이지만 가끔은 예측 불가능한 설렘을 원함",
        counterpart_experience_en: "100% trustworthy partner, though occasionally longs for spontaneous romance",
        corroborating_evidence_required: ["reassurance_match"],
        prohibited_standalone_claims: ["매력 없음"],
      },
    },
  },
  편관: {
    ten_god: "편관",
    domain_expressions: {
      partner: {
        domain: "partner",
        healthy_expression_ko: "외부의 풍파로부터 가정을 지키는 결기 있는 책임감과 위기 결단력",
        healthy_expression_en: "Steely responsibility in protecting household against adversity and decisive action",
        tension_expression_ko: "가정 내에서 군림하려는 권위주의와 스트레스 상황에서의 극단적 통제",
        tension_expression_en: "Authoritarian command inside the home and harsh control under high pressure",
        counterpart_experience_ko: "위기 시엔 가장 든든하지만 평소엔 지적이나 명령조의 말투에 위축됨",
        counterpart_experience_en: "Fiercely protective in crisis, but everyday commanding tone creates anxiety",
        corroborating_evidence_required: ["conflict_trigger_band", "stem_clashes"],
        prohibited_standalone_claims: ["가정폭력 사주", "배우자 살"],
      },
      family: {
        domain: "family",
        healthy_expression_ko: "엄격한 규율과 높은 도덕적 기준을 통해 아이의 인내심과 기개를 기름",
        healthy_expression_en: "Instilling resilience and high ethical discipline through firm standards",
        tension_expression_ko: "칼날 같은 훈육과 자녀의 감정을 무시하는 일방적 명령",
        tension_expression_en: "Draconian discipline and dismissing child's feelings under rigid mandates",
        counterpart_experience_ko: "부모를 존경하지만 무섭고 다가가기 어려워 속마음을 숨기게 됨",
        counterpart_experience_en: "Respects the parent deeply, but feels too intimidated to share true vulnerabilities",
        corroborating_evidence_required: ["discipline_friction_band", "safe_boundary_band"],
        prohibited_standalone_claims: ["학대하는 부모"],
      },
      friend: {
        domain: "friend",
        healthy_expression_ko: "불의를 보면 참지 않고 친구의 억울함을 앞장서서 해결해 주는 든든함",
        healthy_expression_en: "Zero tolerance for injustice, stepping forward to defend wronged friends",
        tension_expression_ko: "친구 모임에서도 주도권을 잡으려 하거나 통제하려는 압박",
        tension_expression_en: "Exerting heavy dominance and expecting compliance in social circles",
        counterpart_experience_ko: "믿음직한 큰형/누나 같지만 기분이 거슬리면 분위기를 얼어붙게 만듦",
        counterpart_experience_en: "Protective like a guardian, but moods can instantly chill the group dynamic",
        corroborating_evidence_required: ["jealousy_guard_band"],
        prohibited_standalone_claims: ["폭력배 성향"],
      },
      work: {
        domain: "work",
        healthy_expression_ko: "위기관리 총책임자, 극한의 압박 속에서도 프로젝트를 완수하는 돌파력",
        healthy_expression_en: "Crisis manager excellence, delivering critical missions under extreme pressure",
        tension_expression_ko: "팀원들을 한계까지 몰아붙이는 하드워킹 강요와 탑다운 독단",
        tension_expression_en: "Burnout-inducing demands and top-down unilateral decision making",
        counterpart_experience_ko: "성과는 확실히 내지만 함께 일하면 번아웃과 심리적 압박이 극에 달함",
        counterpart_experience_en: "Delivers under pressure, but causes high stress and burnout risk in teammates",
        corroborating_evidence_required: ["work_leadership_split", "work_stress_reaction"],
        prohibited_standalone_claims: ["악덕 상사"],
      },
      romantic: {
        domain: "romantic",
        healthy_expression_ko: "상대를 위해서라면 무엇이든 막아내는 헌신적인 카리스마",
        healthy_expression_en: "Fierce chivalry, magnetic charisma, and standing as a bulwark for love",
        tension_expression_ko: "내 뜻대로 연애를 리드하려는 압박과 취약성을 드러내지 않는 방어벽",
        tension_expression_en: "Imposing control over relationship pace and masking vulnerability behind armor",
        counterpart_experience_ko: "치명적인 매력에 끌리지만 동등한 대화보다 일방적 지시를 받는 느낌",
        counterpart_experience_en: "Magnetically attractive, but feels like an unequal hierarchy at times",
        corroborating_evidence_required: ["balance_of_power_band"],
        prohibited_standalone_claims: ["가스라이팅 범죄자"],
      },
    },
  },
  정관: {
    ten_god: "정관",
    domain_expressions: {
      partner: {
        domain: "partner",
        healthy_expression_ko: "사회적 신뢰와 예의, 합리적인 가사 역할 분담과 원만한 외가/친가 조율",
        healthy_expression_en: "Social integrity, mutual respect, structured domestic harmony, and in-law grace",
        tension_expression_ko: "남의 시선과 체면에 대한 지나친 집착, 가정 내 지나친 격식 강요",
        tension_expression_en: "Over-concern with social appearances and imposing stiff formalities at home",
        counterpart_experience_ko: "어디 내놓아도 자랑스러운 배우자지만 단둘이 있을 때 격식 없이 편하기 어려움",
        counterpart_experience_en: "A partner to be proud of in public, but hard to let down hair behind closed doors",
        corroborating_evidence_required: ["household_roles", "crisis_protector_band"],
        prohibited_standalone_claims: ["위선자"],
      },
      family: {
        domain: "family",
        healthy_expression_ko: "바른 사회인으로 성장할 수 있는 합리적인 규범과 예절의 모범 교육",
        healthy_expression_en: "Cultivating civic ethics, integrity, and good manners by steady example",
        tension_expression_ko: "체면 중심의 훈육과 아이의 자유로운 감정 표현 억압",
        tension_expression_en: "Repressing spontaneous emotional expression to maintain family prestige",
        counterpart_experience_ko: "올바른 부모님이지만 실수했을 때 실망을 안겨드릴까 봐 큰 죄책감을 느낌",
        counterpart_experience_en: "Exemplary parent, but instills fear of disappointing family expectations",
        corroborating_evidence_required: ["discipline_friction_band", "safe_boundary_band"],
        prohibited_standalone_claims: ["감정 없는 로봇 부모"],
      },
      friend: {
        domain: "friend",
        healthy_expression_ko: "예의 바르고 신뢰할 수 있는 친구, 사회적 네트워크의 든든한 조력자",
        healthy_expression_en: "Polite, dependable companion and honorable connector across social circles",
        tension_expression_ko: "사적인 자리에서도 흐트러지지 않는 경직성과 남들의 평가에 대한 민감함",
        tension_expression_en: "Excessive stiffness during casual hangouts and high sensitivity to reputations",
        counterpart_experience_ko: "늘 믿음직하고 깍듯하지만 깊은 속마음이나 치부를 터놓기는 조심스러움",
        counterpart_experience_en: "Eminently respectable, though cautious when sharing messy personal truths",
        corroborating_evidence_required: ["comfort_distance_band"],
        prohibited_standalone_claims: ["가식적인 관계"],
      },
      work: {
        domain: "work",
        healthy_expression_ko: "체계적인 조직 관리, 공정한 평가와 원칙 준수, 안정된 프로세스 수립",
        healthy_expression_en: "Systematic governance, fair appraisal, procedural compliance, and ethical leadership",
        tension_expression_ko: "규정과 선례에 갇혀 예외를 인정하지 않는 관료주의적 경직성",
        tension_expression_en: "Bureaucratic paralysis, refusing exceptions, and strict adherence to protocol",
        counterpart_experience_ko: "공정하고 원칙적이어서 깔끔하지만 융통성이 필요한 순간에 답답함",
        counterpart_experience_en: "Principled and fair, but frustratingly slow when flexible agility is needed",
        corroborating_evidence_required: ["work_leadership_split", "work_decision_style"],
        prohibited_standalone_claims: ["꼰대 관리자"],
      },
      romantic: {
        domain: "romantic",
        healthy_expression_ko: "예의 바르고 진중한 구애, 결혼을 전제로 한 성숙하고 안정된 관계 발전",
        healthy_expression_en: "Respectful courtship, mature accountability, and steady marriage-minded progress",
        tension_expression_ko: "연애에서도 정답만을 찾으려 하거나 감정적 돌발 상황에 서툰 태도",
        tension_expression_en: "Searching for 'textbook right answers' and awkward with raw emotional outbursts",
        counterpart_experience_ko: "신뢰할 수 있고 흠잡을 데 없지만 연애 초반의 아찔한 불꽃은 적음",
        counterpart_experience_en: "Impeccably reliable, though less prone to wild spontaneous thrills",
        corroborating_evidence_required: ["reassurance_match"],
        prohibited_standalone_claims: ["지루한 사람"],
      },
    },
  },
  편인: {
    ten_god: "편인",
    domain_expressions: {
      partner: {
        domain: "partner",
        healthy_expression_ko: "깊은 통찰력과 직관, 복잡한 문제의 본질을 꿰뚫어 보는 전략적 조언",
        healthy_expression_en: "Deep intuition, perceptive insight, and strategic troubleshooting for the family",
        tension_expression_ko: "의심과 피해의식, 혼자만의 동굴로 숨어버리는 소통 단절",
        tension_expression_en: "Suspicion, overthinking, and retreating into an isolated communication cave",
        counterpart_experience_ko: "생각이 깊고 지혜롭지만 기분이 상하면 문을 닫아버려 이유를 알기 어려움",
        counterpart_experience_en: "Wise and insightful, but stone-walls into a shell when upset without explanation",
        corroborating_evidence_required: ["private_sanctuary_band", "conflict_trigger_band"],
        prohibited_standalone_claims: ["의처증/의부증", "정신적 결함"],
      },
      family: {
        domain: "family",
        healthy_expression_ko: "아이의 남모르는 속마음과 특이한 관심사를 섬세하게 이해해 줌",
        healthy_expression_en: "Subtly understanding child's unspoken inner world and niche fascinations",
        tension_expression_ko: "부모의 변덕스러운 기분과 지나친 걱정, 지레짐작으로 인한 불안 전염",
        tension_expression_en: "Parental mood swings, excessive worrying, and projecting anxieties on the child",
        counterpart_experience_ko: "나를 꿰뚫어 보지만 부모님의 눈치를 보며 기분을 살펴야 하는 피로감",
        counterpart_experience_en: "Understands deeply, but walking on eggshells around unpredictable moods",
        corroborating_evidence_required: ["hidden_needs_band", "discipline_friction_band"],
        prohibited_standalone_claims: ["자녀에게 독이 되는 부모"],
      },
      friend: {
        domain: "friend",
        healthy_expression_ko: "남들과 다른 독특한 세계관, 철학적/예술적 대화가 통하는 특별한 친구",
        healthy_expression_en: "Distinct philosophical worldview and stimulating, esoteric conversations",
        tension_expression_ko: "갑작스러운 잠수와 연락 두절, 상대의 사소한 말에 대한 과대해석",
        tension_expression_en: "Sudden ghosting, long absences, and over-analyzing innocent comments",
        counterpart_experience_ko: "가장 깊은 대화가 통하지만 언제 잠수탈지 몰라 적당한 거리 유지가 필요함",
        counterpart_experience_en: "Deepest conversationalist, but need distance due to unpredictable hibernation",
        corroborating_evidence_required: ["comfort_distance_band"],
        prohibited_standalone_claims: ["배신자"],
      },
      work: {
        domain: "work",
        healthy_expression_ko: "남들이 보지 못하는 사각지대 발견, 특수 기술/R&D, 독창적 솔루션",
        healthy_expression_en: "Spotting blind spots, specialized R&D depth, and unconventional breakthroughs",
        tension_expression_ko: "표준 프로세스 무시, 동료들에 대한 불신, 독자적 단독 행동",
        tension_expression_en: "Disregarding team SOPs, skepticism of colleagues, and rogue solo executions",
        counterpart_experience_ko: "해결 못 하던 난제를 풀어내지만 협업 시 싱크 맞추기가 매우 까다로움",
        counterpart_experience_en: "Solves impossible riddles, but aligning workflow pacing requires effort",
        corroborating_evidence_required: ["work_special_weapon", "work_feedback_cushion"],
        prohibited_standalone_claims: ["협업 불가자"],
      },
      romantic: {
        domain: "romantic",
        healthy_expression_ko: "영혼의 교감과 신비로운 매력, 말하지 않아도 통하는 텔레파시적 공감",
        healthy_expression_en: "Soulmate resonance, enigmatic allure, and unspoken telepathic empathy",
        tension_expression_ko: "상대의 사랑을 끊임없이 시험하려 들거나 혼자만의 상상으로 오해 축적",
        tension_expression_en: "Testing partner's loyalty and brooding over self-constructed scenarios",
        counterpart_experience_ko: "신비롭고 매력적이지만 언제 마음의 문을 닫을지 몰라 불안감을 느낌",
        counterpart_experience_en: "Fascinating and profound, but anxiety lingers over unexpected withdrawal",
        corroborating_evidence_required: ["residual_band"],
        prohibited_standalone_claims: ["가스라이팅 가해자"],
      },
    },
  },
  정인: {
    ten_god: "정인",
    domain_expressions: {
      partner: {
        domain: "partner",
        healthy_expression_ko: "무조건적인 수용과 든든한 정서적 지지대, 가정을 평화롭게 품는 모성/부성애",
        healthy_expression_en: "Unconditional acceptance, emotional ballast, and nurturing protective shelter",
        tension_expression_ko: "상대에게 당연하게 의존하려는 수동성과 현실 문제 해결의 지연",
        tension_expression_en: "Passive entitlement, taking care for granted, and slow practical problem solving",
        counterpart_experience_ko: "세상에서 가장 편안한 안식처이지만 모든 뒷바라지를 혼자 짊어지게 될 수 있음",
        counterpart_experience_en: "Ultimate haven of comfort, but partner may end up carrying all logistic burdens",
        corroborating_evidence_required: ["crisis_protector_band", "household_chores_fit"],
        prohibited_standalone_claims: ["마마보이/마마걸"],
      },
      family: {
        domain: "family",
        healthy_expression_ko: "아이의 자존감을 무한히 지지하고 학업과 성장을 든든하게 뒷바라지함",
        healthy_expression_en: "Nurturing child's self-esteem and providing dedicated educational sponsorship",
        tension_expression_ko: "과잉보호(헬리콥터 양육)와 아이의 자립 기회 박탈",
        tension_expression_en: "Overprotective helicopter parenting, hindering autonomy and independence",
        counterpart_experience_ko: "부모님의 헌신에 감사하지만 나만의 방식으로 독립하려 할 때 죄책감이 듦",
        counterpart_experience_en: "Grateful for immense love, but feels guilty when seeking personal autonomy",
        corroborating_evidence_required: ["emotional_distance_band", "safe_boundary_band"],
        prohibited_standalone_claims: ["자식을 망치는 과잉보호"],
      },
      friend: {
        domain: "friend",
        healthy_expression_ko: "어떤 하소연도 다 들어주는 힐링 창구, 따뜻한 위로와 지혜로운 조언",
        healthy_expression_en: "Gentle listener, safe sounding board, and soothing empathetic comfort",
        tension_expression_ko: "자신은 주기만 하거나 반대로 일방적으로 받기만 바라는 의존적 불균형",
        tension_expression_en: "One-sided giving or passive expectation of being catered to by peers",
        counterpart_experience_ko: "마음이 힘들 때 제일 먼저 찾게 되지만 에너지가 고갈될 수 있음",
        counterpart_experience_en: "First person to call in sorrow, though caregiver fatigue can build over time",
        corroborating_evidence_required: ["emotional_vent_band"],
        prohibited_standalone_claims: ["감정 쓰레기통"],
      },
      work: {
        domain: "work",
        healthy_expression_ko: "신입 멘토링, 조직의 지식 자산화, 문서화와 안정적인 교육 체계 구축",
        healthy_expression_en: "Mentoring, institutional knowledge preservation, and structured onboarding",
        tension_expression_ko: "실전 실행보다 이론이나 정당성에 매몰되어 납기를 지연시킴",
        tension_expression_en: "Getting bogged down in theory and textbook justification at the cost of execution",
        counterpart_experience_ko: "배울 점이 많고 든든한 멘토이지만 속도감 있는 실전에서는 답답함",
        counterpart_experience_en: "Inspiring mentor, but pacing can be sluggish in fast-and-dirty execution",
        corroborating_evidence_required: ["work_leadership_split", "task_execution_fit"],
        prohibited_standalone_claims: ["탁상공론자"],
      },
      romantic: {
        domain: "romantic",
        healthy_expression_ko: "모든 것을 품어주는 따뜻한 온기와 깊은 신뢰, 한결같은 지지",
        healthy_expression_en: "All-embracing warmth, unconditional positive regard, and steady refuge",
        tension_expression_ko: "자신이 사랑받는 것에 익숙해져 상대의 수고와 희생을 당연시함",
        tension_expression_en: "Taking partner's affection and labor for granted without equal return",
        counterpart_experience_ko: "엄마/아빠 품처럼 포근하지만 연애의 상호 기브앤테이크가 아쉬울 때가 있음",
        counterpart_experience_en: "Deeply comforting shelter, but sometimes longs for reciprocal dynamic effort",
        corroborating_evidence_required: ["reassurance_match"],
        prohibited_standalone_claims: ["애정 결핍"],
      },
    },
  },
};

/**
 * Runtime query function for Ten-God domain-specific behavioral expressions.
 * Provides bounded healthy vs tension expressions, counterpart experience, positional nuance, and strict prohibited claims.
 */
export function resolveTenGodDomainExpression(params: {
  god: TenGodCode;
  domain: DomainPairLensId;
  isTension?: boolean;
  position?: "stem" | "branch" | "hidden";
  isRooted?: boolean;
  strength?: "dominant" | "balanced" | "constrained";
  partyRole?: "self" | "counterpart";
}): {
  expression: DomainTenGodExpression;
  selected_summary_ko: string;
  counterpart_experience_ko: string;
  position_nuance_ko?: string;
  prohibited_claims: string[];
} {
  const entry = TEN_GOD_LENS_MATRIX[params.god];
  if (!entry) {
    throw new Error(`Unknown TenGodCode: ${params.god}`);
  }
  const expr = entry.domain_expressions[params.domain];
  let position_nuance_ko: string | undefined;

  if (params.position === "stem") {
    position_nuance_ko = "대외적이고 명시적인 소통 방식으로 표출됨";
  } else if (params.position === "branch") {
    position_nuance_ko = params.isRooted
      ? "내면 깊이 확고하게 뿌리내린 핵심 본능으로 작용함"
      : "일상 생활과 사적인 공간에서 자연스럽게 드러남";
  } else if (params.position === "hidden") {
    position_nuance_ko = "겉으로는 잘 드러나지 않으나 결정적 순간에 은밀하게 발현됨";
  }

  const baseSummary = params.isTension ? expr.tension_expression_ko : expr.healthy_expression_ko;
  const fullSummary = position_nuance_ko ? `${baseSummary} (${position_nuance_ko})` : baseSummary;

  return {
    expression: expr,
    selected_summary_ko: fullSummary,
    counterpart_experience_ko: expr.counterpart_experience_ko,
    position_nuance_ko,
    prohibited_claims: expr.prohibited_standalone_claims,
  };
}

