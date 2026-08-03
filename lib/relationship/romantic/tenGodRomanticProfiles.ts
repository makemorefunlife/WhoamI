/**
 * Authoritative Ten Gods Romantic Interpretation Profiles.
 * Preserves exact distinction across all 10 Ten Gods without grouping or loss of nuance.
 */

export type TenGodCode =
  | "siksin"
  | "sanggwan"
  | "jeongjae"
  | "pyeonjae"
  | "jeonggwan"
  | "pyeongwan"
  | "jeongin"
  | "pyeonin"
  | "bigyeon"
  | "geopjae";

export type TenGodFamily = "output" | "wealth" | "power" | "resource" | "self";

export type TenGodRomanticProfile = {
  code: TenGodCode;
  korName: string;
  hanja: string;
  family: TenGodFamily;
  familyKorName: string;
  core: string;
  behavior: string;
  relationshipTendency: string;
  relationshipNeed: string;
  relationshipGift: string;
  stressResponse: string;
  shadow: string;
  recognitionNeed: string;
  expressionStyle: string;
  decisionStyle: string;
  repairNeed: string;
  trustSignal: string;
  intimateNeed: string;
  partnerExpectation: string;
  attractionRelevance: string;
  /** What a date together tends to feel like — surfaced in the Attraction
   * chapter of the romantic report. Positive-framed by design (no shadow
   * content here; excessRisk already carries that). */
  datingVibe: string;
  excessRisk: string;
  allowedInference: string[];
  forbiddenInference: string[];
  forbiddenExtensions: string[];
};

export const TEN_GOD_ROMANTIC_PROFILES: Record<TenGodCode, TenGodRomanticProfile> = {
  siksin: {
    code: "siksin",
    korName: "식신",
    hanja: "食神",
    family: "output",
    familyKorName: "식상 (표현·창작)",
    core: "자연스러운 일상의 편안함과 여유로운 보살핌의 에너지",
    behavior: "상대를 통제하려 하지 않고 온전한 템포를 인정하며, 부드러운 유머와 소소한 일상 나눔으로 편안한 분위기를 조성합니다.",
    relationshipTendency: "자연스럽고 편안한 일상을 함께 나누며, 부담 없는 다정함과 여유로움으로 상대를 보살피는 성향",
    relationshipNeed: "조급한 다그침이나 엄격한 평가 없이 자신의 온전한 속도대로 쉴 수 있는 편안한 정서적 안전감",
    relationshipGift: "상대방의 긴장과 불안을 무장해제시키는 부드러운 온기와 일상의 소소한 기쁨을 함께 누리는 여유",
    stressResponse: "갈등이나 압박이 가해지면 즉시 맞서기보다 대화를 미루며 자신의 편안한 공간으로 물러서 침묵합니다.",
    shadow: "편안함에 안주하여 현실적인 결정이나 깊은 갈등의 해결을 지연시키며 회피할 위험",
    recognitionNeed: "자신의 소박한 배려와 다정한 표현이 당연시되지 않고 따뜻하게 웃음으로 화답 받는 것",
    expressionStyle: "부드럽고 자연스러우며, 부담 주지 않는 다정한 배려와 가벼운 유머로 마음을 전달",
    decisionStyle: "상대의 의사를 폭넓게 수용하며, 무리한 강행보다 자연스러운 흐름과 합의를 선호",
    repairNeed: "잘잘못을 따지는 즉각적 추궁 대신, 마음이 가라앉을 수 있는 짧은 시간과 다정한 미소의 신호",
    trustSignal: "자신의 표현과 돌봄이 기쁘게 수용되고, 조급한 다그침 없이 일상의 편안한 여유가 존중받을 때",
    intimateNeed: "통제나 강요 없이 스스로의 온전한 속도대로 쉬고 표현할 수 있는 심리적 자유로움",
    partnerExpectation: "자신의 부드러운 호의와 유머를 편안하게 받아주고, 소소한 일상을 함께 즐길 수 있는 여유롭고 다정한 파트너",
    attractionRelevance: "상대에게 무리한 긴장을 주지 않고, 함께 있는 것만으로도 마음이 누그러지는 온기와 안도감",
    datingVibe: "맛집 탐방과 다정함. 맛있는 것을 먹이고 챙겨주는 것에 진심이며, 상대를 편안하게 보살펴주는 힐링 데이트.",
    excessRisk: "갈등 상황에서 즉각 대면하기보다 편안함에 안주하거나 문제를 뒤로 미루며 회피할 수 있음",
    allowedInference: ["일상 공유 선호", "부드럽고 자연스러운 애정 표현", "갈등 시 완충 시간 필요"],
    forbiddenInference: ["결단력이 전혀 없다는 단정", "모든 상황에서 수동적이라는 단정"],
    forbiddenExtensions: ["처음 만날 때부터 모든 것을 베풀었다는 단정", "어떤 갈등도 절대 해결하지 못한다는 과장"],
  },
  sanggwan: {
    code: "sanggwan",
    korName: "상관",
    hanja: "傷官",
    family: "output",
    familyKorName: "식상 (표현·창작)",
    core: "기민한 직관과 재치 있는 감각으로 틀을 깨는 자극과 소통의 에너지",
    behavior: "틀에 갇히지 않은 독창적인 대화와 솔직한 피드백을 주고받으며, 관계에 단조로움이 끼어들 틈을 주지 않습니다.",
    relationshipTendency: "감각적이고 위트 있는 언어로 특별한 자극을 주며, 기민하고 솔직한 피드백을 주고받는 성향",
    relationshipNeed: "자신의 번뜩이는 감각과 솔직한 생각을 억압받지 않고 지적으로 교감하며 티키타카를 나눌 수 있는 파트너십",
    relationshipGift: "상대방의 시야를 넓혀주는 신선한 영감과 단조로운 일상을 특별하게 바꾸는 경쾌한 생동감",
    stressResponse: "이해받지 못하거나 부당한 틀에 갇힌다고 느끼면 날카로운 비판과 직설적인 언어로 방어막을 칩니다.",
    shadow: "순간적인 직설과 비판적 언어가 상대방의 자존감에 상처를 입히고 불필요한 감정 충돌을 촉발할 위험",
    recognitionNeed: "자신의 특별한 감각과 독창적인 관점이 핀잔 대신 매력과 총명함으로 인정받는 것",
    expressionStyle: "직관적이고 위트 있으며, 감정의 뉘앙스를 솔직하고 거침없이 피드백",
    decisionStyle: "기존의 관습이나 틀에 얽매이지 않고 창의적이고 즉각적인 해결책을 주도",
    repairNeed: "자신의 직설 이면에 있는 서운함을 먼저 알아채고, 비난 대신 재치 있는 유머나 지적 존중으로 응수해 주기",
    trustSignal: "자신의 번뜩이는 통찰과 독창적인 관점이 핀잔 대신 매력과 특별함으로 인정받을 때",
    intimateNeed: "지적·감성적 교감과 대화의 핑퐁, 상호 간의 가식 없는 솔직한 피드백",
    partnerExpectation: "자신의 지적 호기심과 날카로운 감각을 받아쳐 주고, 단조롭지 않게 상호 자극을 주고받을 수 있는 센스 있는 파트너",
    attractionRelevance: "지루할 틈 없는 매력적인 대화와 감각적인 유머, 상대를 꿰뚫어 보는 듯한 기민함",
    datingVibe: "트렌디와 센스. 남들 다 아는 곳은 거부하며, 가장 힙하고 감각적이고 이색적인 데이트 코스를 리드함.",
    excessRisk: "순간적으로 튀어나오는 날카로운 직설이나 지적질이 상대에게 상처나 통제로 느껴질 수 있음",
    allowedInference: ["감각적이고 재치 있는 대화 선호", "기민한 피드백 교환", "단조로운 관계에 대한 피로"],
    forbiddenInference: ["항상 공격적이라는 단정", "진심이 가볍다는 단정"],
    forbiddenExtensions: ["첫눈에 상대를 꿰뚫어 보았다는 운명론", "반드시 상대에게 반항한다는 단정"],
  },
  jeongjae: {
    code: "jeongjae",
    korName: "정재",
    hanja: "正財",
    family: "wealth",
    familyKorName: "재성 (현실·관리)",
    core: "성실한 일상 관리와 예측 가능한 책임감으로 다지는 신뢰의 에너지",
    behavior: "약속을 철저히 지키고 사소한 일상의 디테일까지 꼼꼼하게 챙기며, 투명하고 일관된 태도로 관계의 기반을 다집니다.",
    relationshipTendency: "성실하고 치밀하게 일상의 현실을 챙기며, 약속 이행과 투명한 계획을 통해 흔들림 없는 신뢰를 쌓는 성향",
    relationshipNeed: "예측 가능한 생활 리듬과 투명한 정보 공유, 사소한 약속도 소중히 지켜지는 현실적 안정감",
    relationshipGift: "관계의 실질적 디테일을 빈틈없이 지탱하며, 혼란 속에서도 명확한 현실적 기준과 안도감을 제공하는 든든함",
    stressResponse: "일정이나 계획에 예기치 못한 차질이 생기면 디테일을 따지며 원칙과 규칙을 엄격하게 고수합니다.",
    shadow: "사소한 변동에 지나치게 경직되어 파트너에게 숨 막히는 통제감이나 답답함을 줄 위험",
    recognitionNeed: "보이지 않는 곳에서 관계의 현실을 챙긴 자신의 성실함과 노고가 정당하게 평가받는 것",
    expressionStyle: "차분하고 구체적이며, 감상적인 수사보다 실질적인 행동과 꼼꼼한 배려로 신뢰를 표현",
    decisionStyle: "철저한 현실 검토와 실리적 득실 분석을 바탕으로 단계적이고 안정적인 선택을 견지",
    repairNeed: "말뿐인 사과보다 구체적인 개선 계획과 약속 이행의 의지를 명확하게 보여주기",
    trustSignal: "말뿐인 위로보다 약속의 이행과 구체적인 현실적 배려가 행동으로 증명될 때",
    intimateNeed: "예측 가능한 일상과 투명한 소통, 함께 구체적이고 든든한 미래를 그려가는 안정감",
    partnerExpectation: "말뿐인 다정함보다 약속을 성실히 지키고, 일상의 현실적인 디테일을 투명하게 공유하는 확실하고 믿음직한 파트너",
    attractionRelevance: "책임감 있는 현실 감각과 사소한 생활 디테일까지 살뜰하게 챙겨주는 든든함",
    datingVibe: "안정감과 계획성. 무리하지 않고 가성비와 효율을 따지며, 미리 예약해 두는 완벽하고 깔끔한 정석 데이트.",
    excessRisk: "사소한 원칙이나 계획의 변동에 민감하게 반응하여 상대에게 지나친 통제감이나 답답함을 줄 수 있음",
    allowedInference: ["계획적 일상 공유", "구체적 행동을 통한 신뢰 형성", "안정된 미래 지향"],
    forbiddenInference: ["낭만이 전혀 없다는 단정", "계산적으로만 행동한다는 단정"],
    forbiddenExtensions: ["평생 돈만 따진다는 단정", "단 한 번의 변수도 용납하지 못한다는 과장"],
  },
  pyeonjae: {
    code: "pyeonjae",
    korName: "편재",
    hanja: "偏財",
    family: "wealth",
    familyKorName: "재성 (현실·관리)",
    core: "넓은 시야와 유연한 기동력으로 관계의 무대를 확장하는 역동적 에너지",
    behavior: "단조로운 일상에 갇히지 않고 새로운 기회와 경험을 제안하며, 융통성 있는 태도로 분위기를 유쾌하게 전환합니다.",
    relationshipTendency: "넓은 시야와 활동력으로 관계에 생동감을 불어넣으며, 함께 다채로운 경험과 확장을 즐기는 성향",
    relationshipNeed: "관계 안에서도 개인의 자율적인 활동 공간이 존중되고, 함께 새로운 세상을 호기심 있게 탐색하는 자유",
    relationshipGift: "정체된 분위기를 단숨에 활기차게 바꾸는 낙천성과 관계의 현실적 지평을 넓혀주는 과감한 추진력",
    stressResponse: "관계가 빡빡하게 조여오거나 구속받는다고 느끼면 외부 활동이나 다른 관심사로 시선을 돌리며 거리를 둡니다.",
    shadow: "세밀한 감정선의 변화를 놓치거나 약속의 디테일을 성글게 다루어 상대에게 서운함을 안길 위험",
    recognitionNeed: "자신의 통 큰 배려와 유연한 추진력이 제멋대로라는 오해 대신 든든한 활력으로 인정받는 것",
    expressionStyle: "시원시원하고 호탕하며, 유쾌한 농담과 아낌없는 서포트로 친밀감을 형성",
    decisionStyle: "거시적 안목과 빠른 상황 판단을 통해 과감하게 기회를 포착하고 유연하게 대안을 선택",
    repairNeed: "꼬치꼬치 따지며 구속하기보다 큰 틀의 신뢰를 재확인하고 가벼운 기분 전환의 자리를 마련하기",
    trustSignal: "자신의 유연한 활동 반경을 인정해주고, 함께 새로운 세상을 호기심 있게 탐색할 때",
    intimateNeed: "구속 없는 자율성과 일상 속의 재미, 활력 넘치는 다양한 경험의 공유",
    partnerExpectation: "자신의 활동적인 에너지를 억압하지 않고, 함께 새로운 경험과 도전을 즐겁게 나눌 수 있는 융통성 있고 유쾌한 파트너",
    attractionRelevance: "통 큰 배려와 유쾌한 추진력, 일상의 단조로움을 깨뜨리는 역동적이고 경쾌한 에너지",
    datingVibe: "스케일과 서프라이즈. 통 크게 쏘거나 갑자기 훌쩍 여행을 떠나는 등, 화려하고 스케일 큰 이벤트로 감동을 줌.",
    excessRisk: "세심한 감정선 케어가 다소 성글거나 약속의 디테일에서 예기치 못한 변동이 생길 수 있음",
    allowedInference: ["새로운 경험 제안", "유연한 관계 확장 선호", "자율적 공간 존중"],
    forbiddenInference: ["진지한 책임감이 없다는 단정", "마음이 쉽게 흔들린다는 단정"],
    forbiddenExtensions: ["운명적으로 밖으로만 나돈다는 과장", "감정적인 깊이가 전혀 없다는 편견"],
  },
  jeonggwan: {
    code: "jeonggwan",
    korName: "정관",
    hanja: "正官",
    family: "power",
    familyKorName: "관성 (원칙·규율)",
    core: "품격 있는 예의와 반듯한 원칙으로 관계의 질서를 세우는 에너지",
    behavior: "서로에 대한 존중과 도리를 엄격하게 지키며, 어디서나 떳떳하고 사회적으로도 안정된 관계의 틀을 유지합니다.",
    relationshipTendency: "예의와 상호 존중을 바탕으로 올바른 질서를 지키며, 사회적으로 떳떳하고 품격 있는 관계를 지향하는 성향",
    relationshipNeed: "서로를 깎아내리지 않는 깍듯한 존중, 명확한 관계의 확신과 사회적 인정",
    relationshipGift: "어떤 상황에서도 관계의 품위와 신뢰를 지켜내며, 바깥의 풍파로부터 둘만의 도리와 기준을 든든히 수호하는 신의",
    stressResponse: "상대가 원칙을 어기거나 무례하게 군다고 느끼면 표정을 굳히고 엄격한 도덕적 잣대로 거리를 둡니다.",
    shadow: "지나치게 체면과 원칙에 얽매여 감정의 자연스러운 취약성을 드러내지 못하고 경직될 위험",
    recognitionNeed: "관계의 도리를 다하고 품격을 지키기 위해 애쓴 자신의 반듯한 노력이 깊이 존중받는 것",
    expressionStyle: "정중하고 절제되어 있으며, 감정의 굴곡을 함부로 드러내지 않고 예의를 지켜 표현",
    decisionStyle: "상호 간의 도리와 장기적인 안정성을 우선하여 공정하고 원칙적인 기준에서 결정",
    repairNeed: "감정적 떼쓰기 대신 서로의 입장을 존중하는 단정한 태도와 진심 어린 신뢰의 재확인",
    trustSignal: "상호 간의 도리와 원칙이 성실하게 지켜지고, 서로에게 확고한 신의와 예의를 보일 때",
    intimateNeed: "안정되고 공인된 관계의 확신, 서로의 명예와 자존감을 높여주는 상호 존중",
    partnerExpectation: "명확한 도덕적 기준과 예의를 갖추고, 매사에 정직하고 성실하게 중심을 잡아주는 반듯한 파트너",
    attractionRelevance: "단정하고 정직한 품격, 매사에 중심을 잡고 신뢰를 지켜내는 듬직한 태도",
    datingVibe: "매너와 젠틀함. 예의가 몸에 배어 있어 부모님께 소개해주고 싶을 만큼 반듯하고 존중받는 느낌을 주는 데이트.",
    excessRisk: "지나치게 규율과 형식에 얽매여 감정의 부드러운 흐름을 억압하거나 경직될 수 있음",
    allowedInference: ["원칙 기반 신뢰", "상호 존중 태도 중시", "공적인 안정감 선호"],
    forbiddenInference: ["융통성 없는 꼰대라는 단정", "감정이 메말랐다는 단정"],
    forbiddenExtensions: ["평생 틀에만 갇혀 산다는 단정", "반드시 상대를 억압한다는 왜곡"],
  },
  pyeongwan: {
    code: "pyeongwan",
    korName: "편관",
    hanja: "偏官",
    family: "power",
    familyKorName: "관성 (원칙·규율)",
    core: "위기 앞에서도 물러서지 않고 무게를 감당하는 결단과 수호의 에너지",
    behavior: "어려운 상황이 닥쳤을 때 피하지 않고 스스로 책임을 짊어지며, 묵직한 카리스마로 파트너의 방패가 되어줍니다.",
    relationshipTendency: "위기 상황에서 앞장서서 상대를 지키고 책임을 감당하며, 깊은 헌신과 카리스마로 관계의 방패가 되어주는 성향",
    relationshipNeed: "자신의 무거운 헌신과 책임감을 진심으로 알아주고, 위기 속에서도 흔들림 없이 등을 맞대어주는 신뢰",
    relationshipGift: "예상치 못한 위기와 고난 앞에서도 굴하지 않고 관계를 지켜내는 압도적인 결단력과 보호 본능",
    stressResponse: "상황이 통제를 벗어나거나 위험하다고 느끼면 스스로를 혹독하게 다그치며 강박적인 통제력을 발휘합니다.",
    shadow: "내면의 무거운 긴장과 부담감이 상대에게 무언의 위압감이나 숨 막히는 압박으로 전이될 위험",
    recognitionNeed: "혼자 짊어진 무거운 짐을 알아채고 '당신의 노력이 우리를 지켰다'고 진심으로 인정해 주는 것",
    expressionStyle: "말은 아끼되 행동으로 무게를 증명하며, 결단력 있는 태도로 명확한 보호의 경계를 설정",
    decisionStyle: "위기 요소를 최소화하기 위해 앞장서서 결단을 내리고 자신이 결과에 대한 책임을 전적으로 부담",
    repairNeed: "지적이나 불평 대신 상대의 무거운 어깨를 다정하게 감싸주고 편안하게 숨 쉴 수 있는 쉼터가 되어주기",
    trustSignal: "어려운 순간에도 도망치지 않고 함께 버텨주며, 자신의 헌신과 무게를 진심으로 인정해줄 때",
    intimateNeed: "자신의 보호와 헌신에 대한 파트너의 확고한 신뢰와 진심 어린 존중",
    partnerExpectation: "어려운 순간에 함께 버텨줄 수 있는 내면의 단단함을 지니고, 자신의 헌신을 신뢰하고 존중해 주는 듬직한 파트너",
    attractionRelevance: "강인한 결단력과 듬직한 보호 본능, 어떤 난관도 함께 뚫고 나갈 것 같은 든든한 카리스마",
    datingVibe: "카리스마와 리드. 결단력이 있어 코스를 확고하게 리드하며, 기댈 수 있는 강한 책임감과 보호 본능을 자극함.",
    excessRisk: "과도한 긴장감과 엄격한 책임감으로 인해 상대에게 무언의 압박이나 통제감을 줄 수 있음",
    allowedInference: ["위기 극복 리더십", "강한 보호 본능", "헌신적 결단력"],
    forbiddenInference: ["강압적이거나 독선적이라는 단정", "권력욕만 있다는 단정"],
    forbiddenExtensions: ["태생적으로 폭력적이거나 강압적이라는 왜곡", "평생 상대를 지배하려 한다는 비약"],
  },
  jeongin: {
    code: "jeongin",
    korName: "정인",
    hanja: "正印",
    family: "resource",
    familyKorName: "인성 (수용·성찰)",
    core: "무조건적인 온기와 깊은 정서적 안식으로 품어주는 수용의 에너지",
    behavior: "상대의 연약한 면모까지 너그럽게 품어주며, 지친 하루 끝에 언제든 돌아와 쉴 수 있는 따뜻한 정서적 안식처를 제공합니다.",
    relationshipTendency: "무조건적인 다정함과 포용력으로 상대를 온전히 수용하며, 깊은 정서적 안식처가 되어주는 성향",
    relationshipNeed: "자신의 따뜻한 온기가 온전히 수용되고, 연약한 속마음을 꺼내도 안전하다는 무조건적인 정서적 지지",
    relationshipGift: "상처 입은 마음을 어루만져 주는 깊은 포용력과 불안을 잠재우는 변함없는 정서적 안정감",
    stressResponse: "상대의 태도가 차갑거나 거절당했다고 느끼면 서운함을 겉으로 드러내지 않고 속으로 삭이며 수동적으로 침묵합니다.",
    shadow: "상대에게 지나치게 의존하거나 말없이 알아서 채워주기만을 기다리며 감정의 골을 깊게 만들 위험",
    recognitionNeed: "자신의 묵묵한 배려와 헌신이 당연시되지 않고 다정한 눈빛과 따뜻한 감사로 화답 받는 것",
    expressionStyle: "온화하고 다정하며, 상대의 감정선을 살피며 조심스럽고 배려 깊은 언어로 소통",
    decisionStyle: "상호 간의 정서적 편안함과 관계의 조화를 최우선으로 고려하여 부드럽게 조율",
    repairNeed: "냉랭한 논리적 공방 대신 따뜻하게 안아주며 '여전히 너를 아끼고 사랑한다'는 정서적 확신 주기",
    trustSignal: "자신의 따뜻한 배려와 헌신이 변함없는 신뢰와 사랑으로 화답 받을 때",
    intimateNeed: "무조건적인 정서적 수용과 다정한 눈빛, 안전하게 기댈 수 있는 따뜻한 품",
    partnerExpectation: "자신의 따뜻한 마음에 다정하게 반응해주고, 언제든 마음 편히 기댈 수 있는 배려 깊고 온화한 파트너",
    attractionRelevance: "상처를 보듬어주는 깊은 포용력과 곁에 있는 것만으로도 마음이 편안해지는 따뜻한 온기",
    datingVibe: "따뜻한 감성과 정서적 교감. 예쁜 카페나 전시회에서 조용히 감성을 나누며, 끊임없이 사랑받고 있음을 확인시켜 줌.",
    excessRisk: "상대에게 지나치게 의존하거나 서운함을 속으로 삭이며 수동적인 기대감에 갇힐 수 있음",
    allowedInference: ["정서적 수용력", "다정한 보살핌", "무조건적 지지 선호"],
    forbiddenInference: ["스스로 자립하지 못한다는 단정", "어리광만 부린다는 단정"],
    forbiddenExtensions: ["모성애적 헌신만 요구한다는 편견", "독립적인 판단력이 아예 없다는 단정"],
  },
  pyeonin: {
    code: "pyeonin",
    korName: "편인",
    hanja: "偏印",
    family: "resource",
    familyKorName: "인성 (수용·성찰)",
    core: "깊은 직관과 통찰력으로 이면의 본질을 헤아리는 사색의 에너지",
    behavior: "상대의 말 뒤에 숨은 미묘한 뉘앙스를 간파하며, 사색의 여백 속에서 독창적이고 깊이 있는 정신적 교감을 나눕니다.",
    relationshipTendency: "깊은 통찰력과 직관으로 상대의 복잡한 내면을 헤아리며, 독창적이고 특별한 정신적 유대를 맺는 성향",
    relationshipNeed: "자신의 고독과 복잡한 내면세계를 섣불리 재단하지 않고, 혼자만의 사색 공간을 존중해 주는 정서적 여백",
    relationshipGift: "상대방조차 미처 알아채지 못한 깊은 상처나 진심을 꿰뚫어 보고 보듬어주는 섬세한 통찰력",
    stressResponse: "과도한 간섭이나 감정적 압박이 들어오면 마음의 문을 닫고 혼자만의 동굴로 들어가 냉소적으로 단절합니다.",
    shadow: "상대의 의도를 지나치게 의심하거나 혼자만의 생각에 갇혀 오해를 키우며 관계의 거리를 벌릴 위험",
    recognitionNeed: "자신의 독특한 세계관과 깊은 사유가 이상한 것이 아니라 특별한 지혜로 온전히 인정받는 것",
    expressionStyle: "은유적이고 깊이 있으며, 많은 말 대신 핵심을 찌르는 직관적인 언어로 소통",
    decisionStyle: "표면적 조건보다 숨겨진 변수와 장기적인 맥락을 심층적으로 검토한 뒤 신중하게 결정",
    repairNeed: "동굴에서 억지로 끌어내려 다그치지 않고, 혼자 정리할 시간을 준 뒤 조용히 곁을 지켜주기",
    trustSignal: "말하지 않아도 자신의 고독과 독특한 내면세계를 섣불리 재단하지 않고 깊이 인정해줄 때",
    intimateNeed: "혼자만의 사색 공간과 사생활 존중, 간섭받지 않고 안전하게 사유할 수 있는 정서적 여백",
    partnerExpectation: "자신의 복잡한 내면과 고독을 섣불리 재단하지 않고 묵묵히 품어주는 통찰력 있고 너그러운 파트너",
    attractionRelevance: "신비롭고 깊이 있는 대화, 상대의 숨겨진 상처나 미묘한 뉘앙스를 간파하는 깊은 직관력",
    datingVibe: "마이너 감성과 딥토크. 남들은 모르는 둘만의 아지트에서 철학이나 삶의 의미 등 영혼의 교감을 나누는 깊은 데이트.",
    excessRisk: "마음의 문을 갑자기 닫고 동굴로 들어가 의심하거나 냉소적으로 거리를 둘 수 있음",
    allowedInference: ["정신적 교감 중시", "사색을 위한 독립 공간 필요", "직관적 통찰력"],
    forbiddenInference: ["냉혈한이라는 단정", "마음이 완전히 닫혔다는 단정"],
    forbiddenExtensions: ["늘 상대를 의심만 한다는 과장", "평생 세상과 단절되어 산다는 비약"],
  },
  bigyeon: {
    code: "bigyeon",
    korName: "비견",
    hanja: "比肩",
    family: "self",
    familyKorName: "비겁 (주체·자율)",
    core: "대등한 눈높이와 자립적인 중심을 지키는 건강한 동반자적 에너지",
    behavior: "서로의 독립된 영역을 침범하지 않고 존중하며, 담백하고 솔직한 태도로 나란히 서서 함께 길을 걸어갑니다.",
    relationshipTendency: "대등한 눈높이에서 서로의 자율성과 독립성을 온전히 존중하며, 든든한 동반자로 함께 걸어가는 성향",
    relationshipNeed: "일방적인 종속이나 희생 없이, 서로의 자율성과 동등한 권리가 온전히 보장되는 대등한 파트너십",
    relationshipGift: "상대에게 의존하거나 짐이 되지 않고, 각자의 삶을 건강하게 지탱하며 서로의 성장을 묵묵히 응원하는 단단함",
    stressResponse: "자존심이 상하거나 일방적인 양보를 강요당한다고 느끼면 한 치의 물러섬 없이 팽팽하게 대치합니다.",
    shadow: "타협을 굴복으로 여겨 작은 이견 앞에서도 고집을 꺾지 않고 갈등을 평행선으로 끌고 갈 위험",
    recognitionNeed: "자신의 자립적인 기준과 주체성이 무시당하지 않고 동등한 인격체로서 존중받는 것",
    expressionStyle: "솔직담백하고 명확하며, 돌려 말하지 않고 자신의 생각과 기준을 대등하게 제시",
    decisionStyle: "상호 독립성을 침해하지 않는 범위 내에서 각자의 책임을 명확히 구분하고 합의",
    repairNeed: "자존심을 꺾으려 들지 않고, 동등한 눈높이에서 서로의 영역과 입장을 인정하는 담백한 대화",
    trustSignal: "일방적인 희생이나 강요 없이 서로의 독립적인 영역과 선택권이 대등하게 존중될 때",
    intimateNeed: "구속 없는 자율성, 대등한 동반자적 존중, 건강한 개인 공간의 보장",
    partnerExpectation: "자신의 독립적인 영역을 온전히 존중해주면서도 대등한 눈높이에서 나란히 걸어갈 수 있는 자립적이고 든든한 파트너",
    attractionRelevance: "자립심 강하고 담백한 태도, 서로에게 짐이 되지 않고 든든하게 나란히 서는 건강한 안정감",
    datingVibe: "베프 같은 편안함. 평등하고 친구처럼 티키타카가 잘 맞으며 취미를 공유하는 데이트.",
    excessRisk: "자존심을 굽히지 않고 팽팽하게 맞서며 작은 타협조차 양보나 굴복으로 여길 수 있음",
    allowedInference: ["동등한 파트너십", "개인 경계 존중", "담백한 자립성"],
    forbiddenInference: ["연애에 관심이 없다는 단정", "이기적이라는 단정"],
    forbiddenExtensions: ["서로 똑같은 삶만 강요한다는 왜곡", "어떤 양보도 절대 하지 않는다는 과장"],
  },
  geopjae: {
    code: "geopjae",
    korName: "겁재",
    hanja: "劫財",
    family: "self",
    familyKorName: "비겁 (주체·자율)",
    core: "뜨거운 몰입과 독점적 신뢰로 내 사람을 결속하는 강력한 연대의 에너지",
    behavior: "내 사람이라는 확신이 들면 아낌없이 모든 것을 걸고 지지하며, 외부의 어떤 도전 앞에서도 확실한 내 편이 되어줍니다.",
    relationshipTendency: "순발력과 뜨거운 열정으로 관계에 강하게 몰입하며, 내 사람에 대한 확고한 편들기와 독점적 유대를 형성하는 성향",
    relationshipNeed: "어떤 상황에서도 나를 최우선으로 선택해 주고, 세상 누구보다 내 편이라는 확고하고 배타적인 신뢰",
    relationshipGift: "세상의 평가나 위기 속에서도 흔들리지 않고 파트너의 든든한 아군이 되어주는 전폭적인 지지와 승부욕",
    stressResponse: "신뢰가 흔들리거나 경쟁자/외부 요소에 시선이 분산된다고 느끼면 강한 질투와 불안으로 통제하려 듭니다.",
    shadow: "지나친 소유욕과 승부욕으로 인해 사소한 비교에도 예민해지며 상대를 구속할 위험",
    recognitionNeed: "파트너의 인생에서 자신이 가장 특별하고 대체 불가능한 1순위라는 확신을 얻는 것",
    expressionStyle: "열정적이고 직관적이며, 강한 애착과 확실한 편들기로 친밀감을 과시",
    decisionStyle: "순발력과 승부수를 던지는 과감함으로 빠르게 기선을 제압하고 결단을 촉진",
    repairNeed: "주변과의 비교나 애매한 태도를 멈추고, 오직 상대방만을 향한 확실한 애정과 우선순위를 분명히 표현하기",
    trustSignal: "어떤 상황에서도 나만을 최우선으로 선택해주는 확실한 내 편이라는 흔들림 없는 확신",
    intimateNeed: "흔들리지 않는 독점적 신뢰, 세상 누구보다 내 편이라는 확고한 지지",
    partnerExpectation: "자신의 열정적인 몰입에 확실한 내 편이라는 확신을 주고, 위기 상황에서도 주저 없이 힘을 실어주는 열정적인 파트너",
    attractionRelevance: "강렬한 카리스마와 승부욕 있는 헌신, 나를 위해 모든 것을 걸어줄 것 같은 뜨거운 열정",
    datingVibe: "짜릿한 텐션과 밀당. 게임이나 스포츠, 내기 등 액티비티를 즐기며 승부욕을 자극하는 스릴 있는 데이트.",
    excessRisk: "질투심과 소유욕이 강해져 상대의 사소한 시선이나 주변 관계에도 예민하게 반응할 수 있음",
    allowedInference: ["열정적 몰입", "내 편에 대한 절대적 지지", "강렬한 유대감"],
    forbiddenInference: ["폭력적 소유욕이라는 단정", "항상 불안정하다는 단정"],
    forbiddenExtensions: ["반드시 상대를 파멸로 이끈다는 저주성 단정", "평생 질투에만 눈이 멀어 산다는 왜곡"],
  },
};

export function getTenGodRomanticProfile(code: string): TenGodRomanticProfile {
  const normalized = code.toLowerCase().trim();
  if (normalized in TEN_GOD_ROMANTIC_PROFILES) {
    return TEN_GOD_ROMANTIC_PROFILES[normalized as TenGodCode];
  }
  // Fallbacks for common variations or substrings
  if (normalized.includes("siksin") || normalized === "식신") return TEN_GOD_ROMANTIC_PROFILES.siksin;
  if (normalized.includes("sanggwan") || normalized === "상관") return TEN_GOD_ROMANTIC_PROFILES.sanggwan;
  if (normalized.includes("jeongjae") || normalized === "정재") return TEN_GOD_ROMANTIC_PROFILES.jeongjae;
  if (normalized.includes("pyeonjae") || normalized === "편재") return TEN_GOD_ROMANTIC_PROFILES.pyeonjae;
  if (normalized.includes("jeonggwan") || normalized === "정관") return TEN_GOD_ROMANTIC_PROFILES.jeonggwan;
  if (normalized.includes("pyeongwan") || normalized === "편관") return TEN_GOD_ROMANTIC_PROFILES.pyeongwan;
  if (normalized.includes("jeongin") || normalized === "정인") return TEN_GOD_ROMANTIC_PROFILES.jeongin;
  if (normalized.includes("pyeonin") || normalized === "편인") return TEN_GOD_ROMANTIC_PROFILES.pyeonin;
  if (normalized.includes("bigyeon") || normalized === "비견") return TEN_GOD_ROMANTIC_PROFILES.bigyeon;
  if (normalized.includes("geopjae") || normalized === "겁재") return TEN_GOD_ROMANTIC_PROFILES.geopjae;

  // Default to bigyeon if unrecognized
  return TEN_GOD_ROMANTIC_PROFILES.bigyeon;
}
