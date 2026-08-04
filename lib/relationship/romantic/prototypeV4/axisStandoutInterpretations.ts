export type AxisInterpretation = {
  plainLanguageDefinition: string;
  highBehavior: string;
  lowBehavior: string;
  sceneHint: string;
  tensionClash: string;
  tensionBenefit: string;
  practicalTranslation: string;
  misreadHighObservingLow: string;
  misreadLowObservingHigh: string;
};

export const AXIS_INTERPRETATIONS_EN: Record<string, AxisInterpretation> = {
  decision: {
    plainLanguageDefinition: "How you tend to act when making big or small decisions.",
    highBehavior: "You tend to reach conclusions quickly and want to settle things.",
    lowBehavior: "You tend to keep options open and need time to think things through.",
    sceneHint: "When setting weekend plans or making an important life choice",
    tensionClash: "One of you may feel frustrated that a decision is taking too long, while the other feels rushed or pushed.",
    tensionBenefit: "One of you moves a stalled situation forward, while the other catches risks the first might miss.",
    practicalTranslation: "Instead of deciding on the spot, try setting a specific time to revisit it — 'let's talk again tomorrow evening.'",
    misreadHighObservingLow: "Taking time to think carefully can be mistaken for indecision or stalling.",
    misreadLowObservingHigh: "Wanting to solve things quickly can be mistaken for being controlling or impatient.",
  },
  emotion: {
    plainLanguageDefinition: "How you express feelings like joy or hurt outwardly.",
    highBehavior: "You tend to express what you feel clearly and right away.",
    lowBehavior: "You tend to process feelings internally first, then express them calmly.",
    sceneHint: "When something upsetting or something wonderful happens",
    tensionClash: "One of you may feel hurt that the other's reaction seems too small, while the other feels overwhelmed by how intense the expression is.",
    tensionBenefit: "One person's vivid expression brings warmth to the relationship, while the other's calm keeps things from running too hot emotionally.",
    practicalTranslation: "The quicker-to-express partner can wait a beat; the calmer partner can share just their current state — 'I'm still thinking about this' — as a start.",
    misreadHighObservingLow: "Not showing emotion outwardly can be mistaken for indifference or not caring.",
    misreadLowObservingHigh: "Expressing emotion openly and strongly can be mistaken for being unstable or impulsive.",
  },
  recovery: {
    plainLanguageDefinition: "How quickly you bounce back after conflict or stress.",
    highBehavior: "You tend to shake off negative feelings fairly quickly and move on.",
    lowBehavior: "You tend to sit with what went wrong and take real time to process it.",
    sceneHint: "When trying to have a calm conversation again after a big fight",
    tensionClash: "One of you may want to just move past it, while the other still feels unresolved.",
    tensionBenefit: "One person's quick recovery lightens the relationship's load, while the other's thorough processing prevents the same mistake from repeating.",
    practicalTranslation: "Rather than forcing a conclusion right after a fight, agree on a specific time to talk again once both of you have calmed down.",
    misreadHighObservingLow: "Taking time to heal can be mistaken for stubbornness or holding a grudge.",
    misreadLowObservingHigh: "Letting go of feelings quickly can be mistaken for not taking the issue seriously or being indifferent.",
  },
  structure: {
    plainLanguageDefinition: "How much you value plans and structure.",
    highBehavior: "You feel secure when you've planned ahead and things go as scheduled.",
    lowBehavior: "You prefer to adapt flexibly to the situation and go with the flow.",
    sceneHint: "When planning a trip together or deciding a date itinerary",
    tensionClash: "One of you gets stressed when plans change, while the other feels stifled by a schedule that's too tight.",
    tensionBenefit: "Within a stable framework set in advance, you can still respond flexibly — creating a life that's neither monotonous nor anxious.",
    practicalTranslation: "Agree in advance only on the big items — travel time, lodging — and leave the rest open to how you both feel that day.",
    misreadHighObservingLow: "Adapting flexibly to the moment can be mistaken for being unplanned or careless.",
    misreadLowObservingHigh: "Sticking to a plan made in advance can be mistaken for being inflexible or controlling.",
  },
  intimacy: {
    plainLanguageDefinition: "How you regulate psychological and physical distance in the relationship.",
    highBehavior: "You feel secure when you closely share daily life and spend a lot of time together.",
    lowBehavior: "You feel comfortable in the relationship only when your own time and space are clearly guaranteed.",
    sceneHint: "When coordinating how often to check in during a busy day, or planning the weekend",
    tensionClash: "One of you wants to be in touch more often, while the other feels there isn't enough time alone to rest.",
    tensionBenefit: "One of you keeps the relationship from drifting too far apart, while the other makes sure it doesn't become suffocating.",
    practicalTranslation: "Instead of arguing over how often to check in, agree in advance on undisturbed personal time — like 'the hour right after work.'",
    misreadHighObservingLow: "Wanting alone time can be mistaken for cooling affection or pushing the other away.",
    misreadLowObservingHigh: "Wanting more time together can be mistaken for excessive intrusion on personal space.",
  },
  energy_style: {
    plainLanguageDefinition: "Whether you recharge by being out in the world or by being alone.",
    highBehavior: "You feel energized meeting people and being active out in the world.",
    lowBehavior: "You recharge by staying home quietly and spending time with yourself.",
    sceneHint: "When deciding how to spend a weekend or day off",
    tensionClash: "One of you keeps wanting to go out, while the other wants to fully rest at home.",
    tensionBenefit: "Thanks to the more active partner, you get new experiences; thanks to the quieter partner, you get calm, deep rest.",
    practicalTranslation: "Rather than matching one person's style, alternate — an outdoor date one weekend, staying in the next.",
    misreadHighObservingLow: "A request to rest at home can be mistaken for the date being boring or not wanting to be together.",
    misreadLowObservingHigh: "Repeatedly suggesting going out can be mistaken for an unreasonable demand that ignores the other's energy.",
  },
  focus: {
    plainLanguageDefinition: "Whether you tend to see the big picture or the specific details.",
    highBehavior: "You tend to look broadly at the overall flow or future possibilities.",
    lowBehavior: "You tend to focus on the concrete facts and details right in front of you.",
    sceneHint: "When having an important conversation or solving a complex problem together",
    tensionClash: "One of you feels the conversation is stuck on trivial details, while the other feels it's too vague and unrealistic.",
    tensionBenefit: "One of you sets the big-picture direction so you don't lose your way, while the other handles the concrete execution plan to get there.",
    practicalTranslation: "Before a conversation starts, say up front whether it's for 'empathy and imagining possibilities' or 'solving a specific problem.'",
    misreadHighObservingLow: "Checking concrete facts can be mistaken for being overly picky or nitpicking.",
    misreadLowObservingHigh: "Talking about the future or possibilities can be mistaken for escapism or vague talk.",
  },
  conflict_style: {
    plainLanguageDefinition: "How you approach and resolve problems when conflict arises.",
    highBehavior: "When opinions clash, you tend to want to talk it through to the end, right there.",
    lowBehavior: "In conflict, you tend to step back first to calm down and think.",
    sceneHint: "Right after opinions clash hard and the mood turns heavy",
    tensionClash: "One of you pushes to reach a conclusion right now, while the other feels suffocated and just wants to step away.",
    tensionBenefit: "Thanks to one of you, there's room for emotions to cool; thanks to the other, the issue gets resolved clearly instead of fading away unaddressed.",
    practicalTranslation: "When the conversation gets heated, try asking for a timeout — 'let's each take 30 minutes in our own space and talk again.'",
    misreadHighObservingLow: "Taking a moment to think can be mistaken for cutting off the conversation or giving up on the relationship.",
    misreadLowObservingHigh: "Trying to resolve things immediately can be mistaken for an attack or pressure directed at you.",
  },
  stimulation: {
    plainLanguageDefinition: "Whether you crave new experiences or familiar comfort.",
    highBehavior: "You feel energized by constant change, fresh events, and unfamiliar stimulation.",
    lowBehavior: "You prefer the steady comfort of a proven, familiar routine.",
    sceneHint: "When deciding whether to go to the usual restaurant or try somewhere brand new",
    tensionClash: "One of you finds daily life too monotonous and gets bored, while the other feels worn out by frequent change and new attempts.",
    tensionBenefit: "Thanks to one of you, daily life gets a pleasant spark; thanks to the other, there's a stable home base to return to when tired.",
    practicalTranslation: "Keep most dates at familiar, comfortable places, but plan one fully new outing once a month.",
    misreadHighObservingLow: "Seeking the familiar can be mistaken for the relationship losing its spark or not putting in effort.",
    misreadLowObservingHigh: "Chasing new experiences can be mistaken for disrupting the relationship's stability or being fickle.",
  },
  independence: {
    plainLanguageDefinition: "Whether you tend to solve problems on your own or want to talk them through together.",
    highBehavior: "You tend to want to work through hard things yourself, and protect your autonomy within the relationship.",
    lowBehavior: "When something is troubling you, you want to talk it through together and lean on each other emotionally.",
    sceneHint: "When something difficult happens at work, or you badly need someone's help",
    tensionClash: "One of you may feel hurt that the other draws too firm a line, while the other feels burdened by too much reliance on them.",
    tensionBenefit: "Thanks to one of you, each person's individual growth is supported; thanks to the other, there's a safety net to lean on deeply whenever needed.",
    practicalTranslation: "When you want to solve something alone, say so gently up front — 'I appreciate you wanting to help, but I want to try this one myself.'",
    misreadHighObservingLow: "Wanting to work through a difficulty together can be mistaken for being unable to stand on your own and offloading a burden.",
    misreadLowObservingHigh: "Quietly working through a problem alone can be mistaken for emotionally shutting the other person out.",
  },
  stability: {
    plainLanguageDefinition: "How sensitively you react to outside change or stress.",
    highBehavior: "Your emotional baseline stays fairly steady even amid outside change or stress.",
    lowBehavior: "You react sensitively to small changes or stimuli around you, moving through a range of feelings.",
    sceneHint: "When an unexpected crisis hits, or plans suddenly fall apart",
    tensionClash: "One of you may feel the other is being overly sensitive, while the other feels the first is too indifferent to the situation.",
    tensionBenefit: "One of you picks up on subtle shifts in mood that are easy to miss, while the other stays a steady anchor when things get shaky.",
    practicalTranslation: "When a sensitive reaction shows up, lead with naming the feeling — 'that must have really thrown you' — rather than assigning blame.",
    misreadHighObservingLow: "Reacting sensitively to a situation can be mistaken for being needlessly touchy or emotionally volatile.",
    misreadLowObservingHigh: "Staying unshaken can be mistaken for lacking empathy or being indifferent to your feelings.",
  },
};

export const AXIS_INTERPRETATIONS: Record<string, AxisInterpretation> = {
  decision: {
    plainLanguageDefinition: "크고 작은 결정을 내릴 때 나타나는 행동 방식이에요.",
    highBehavior: "빠르게 결론을 내리고 상황을 정리하려는 편이에요.",
    lowBehavior: "여러 가능성을 열어두고 신중하게 고민할 시간을 필요로 하는 편이에요.",
    sceneHint: "주말 일정을 정하거나 삶의 중요한 선택을 할 때",
    tensionClash: "한 사람은 결정이 너무 느리다며 답답해하고, 다른 사람은 상대가 너무 성급하게 밀어붙인다고 느낄 수 있어요.",
    tensionBenefit: "한 사람이 멈춰 있던 상황을 앞으로 끌고 가면, 다른 한 사람은 놓치기 쉬운 위험을 미리 막아주는 역할을 해요.",
    practicalTranslation: "당장 결론을 내리기보다 '내일 저녁에 다시 이야기하자'며 결정할 시점을 미리 정해 보세요.",
    misreadHighObservingLow: "시간을 들여 신중하게 고민하는 모습을 우유부단하거나 결정을 미루려는 것으로 잘못 볼 수 있어요.",
    misreadLowObservingHigh: "문제를 빨리 해결하려는 태도를 일방적으로 통제하려 하거나 성급한 것으로 잘못 볼 수 있어요."
  },
  emotion: {
    plainLanguageDefinition: "기쁨, 서운함 등의 감정을 밖으로 표현하는 방식이에요.",
    highBehavior: "느끼는 감정을 밖으로 선명하게 바로바로 표현하는 편이에요.",
    lowBehavior: "감정을 내면에서 먼저 소화한 뒤 차분하게 표현하는 편이에요.",
    sceneHint: "서운한 일이 생기거나 크게 기쁜 일이 있었을 때",
    tensionClash: "한 사람은 상대의 반응이 너무 작아 서운해하고, 다른 사람은 감정 표현의 온도가 너무 높아 버겁다고 느낄 수 있어요.",
    tensionBenefit: "한 사람의 선명한 표현이 관계에 온기를 불어넣고, 다른 사람의 차분함이 관계가 감정적으로 과열되지 않게 중심을 잡아줘요.",
    practicalTranslation: "표현이 빠른 사람은 잠시 기다려 주고, 차분한 사람은 '지금 조금 더 생각하고 있어'라고 현재 상태만이라도 먼저 말해 보세요.",
    misreadHighObservingLow: "감정을 밖으로 드러내지 않는 모습을 무관심하거나 나를 사랑하지 않는 것으로 잘못 볼 수 있어요.",
    misreadLowObservingHigh: "감정을 솔직하고 크게 표현하는 모습을 감정 기복이 심하거나 충동적인 것으로 잘못 볼 수 있어요."
  },
  recovery: {
    plainLanguageDefinition: "갈등이나 스트레스를 겪은 뒤 원래 상태로 돌아오는 속도예요.",
    highBehavior: "부정적인 감정을 비교적 빨리 환기하고 다음으로 쉽게 넘어가는 편이에요.",
    lowBehavior: "어려웠던 감정의 원인을 깊이 곱씹고 마음을 정리할 시간을 충분히 가지는 편이에요.",
    sceneHint: "크게 다투고 난 뒤 다시 평온한 대화를 시작하려 할 때",
    tensionClash: "한 사람은 이제 그만 덮고 넘어가자고 하고, 다른 사람은 아직 내 마음이 풀리지 않았다고 느낄 수 있어요.",
    tensionBenefit: "한 사람의 빠른 회복력이 관계의 무거움을 덜어주고, 다른 사람의 깊은 정리가 같은 실수의 반복을 막아줘요.",
    practicalTranslation: "다툰 직후 무리해서 결론을 내리기보다, 서로 감정이 가라앉은 뒤 다시 대화할 시간을 구체적으로 약속해 보세요.",
    misreadHighObservingLow: "상처를 회복하는 데 시간이 걸리는 모습을 고집이 세거나 뒤끝이 있는 것으로 잘못 볼 수 있어요.",
    misreadLowObservingHigh: "감정을 빨리 털어내는 모습을 문제가 심각한데 가볍게 여기거나 무심한 것으로 잘못 볼 수 있어요."
  },
  structure: {
    plainLanguageDefinition: "계획과 규칙을 얼마나 중요하게 생각하는지 보여주는 성향이에요.",
    highBehavior: "미리 계획을 세우고 정해진 일정대로 움직일 때 안정감을 느끼는 편이에요.",
    lowBehavior: "상황에 맞춰 유연하게 대처하며 즉흥적인 흐름에 맡기는 편이에요.",
    sceneHint: "함께 여행을 가거나 데이트 동선을 정할 때",
    tensionClash: "한 사람은 계획이 바뀌면 스트레스를 받고, 다른 사람은 일정이 너무 빡빡하면 답답함을 느낄 수 있어요.",
    tensionBenefit: "미리 세워둔 안정적인 뼈대 안에서 유연하게 대처하며, 단조롭지도 불안하지도 않은 일상을 만들 수 있어요.",
    practicalTranslation: "기본적인 이동 시간이나 숙소 같은 큰 일정만 미리 합의하고, 나머지 세부 일정은 그날의 기분에 따라 비워두세요.",
    misreadHighObservingLow: "상황에 맞춰 행동하는 유연한 태도를 무계획적이라거나 무성의하다고 잘못 볼 수 있어요.",
    misreadLowObservingHigh: "미리 정해둔 계획을 지키려는 태도를 융통성이 부족하거나 자신을 통제하려 한다고 잘못 볼 수 있어요."
  },
  intimacy: {
    plainLanguageDefinition: "관계 안에서 심리적, 물리적 거리를 조절하는 방식이에요.",
    highBehavior: "서로의 일상을 촘촘히 공유하고 많은 시간을 함께 보내야 안정감을 느끼는 편이에요.",
    lowBehavior: "각자의 개인적인 시공간과 경계가 확실히 보장되어야 관계에서도 편안함을 느끼는 편이에요.",
    sceneHint: "각자 바쁜 하루를 보내며 연락 빈도를 맞추거나 주말을 보낼 때",
    tensionClash: "한 사람은 더 자주 연락하고 싶어 하고, 다른 사람은 혼자만의 쉴 시간이 부족하다고 느낄 수 있어요.",
    tensionBenefit: "한 사람은 관계가 너무 멀어지지 않게 끈을 이어주고, 다른 사람은 관계가 서로를 옭아매지 않도록 적절한 숨구멍을 만들어줘요.",
    practicalTranslation: "연락 횟수를 놓고 다투기보다, '퇴근 직후 1시간'처럼 서로 방해받지 않을 개인 시간을 미리 합의해 보세요.",
    misreadHighObservingLow: "혼자만의 시간을 가지려는 모습을 나에 대한 애정이 식었거나 밀어내는 것으로 잘못 볼 수 있어요.",
    misreadLowObservingHigh: "더 많은 시간을 함께하려는 노력을 개인 영역에 대한 지나친 간섭으로 잘못 볼 수 있어요."
  },
  energy_style: {
    plainLanguageDefinition: "바깥에서 에너지를 쓰는 편인지, 안에서 충전하는 편인지 보여주는 성향이에요.",
    highBehavior: "사람들을 만나고 밖에서 활동적인 시간을 보낼 때 에너지가 채워지는 편이에요.",
    lowBehavior: "집에서 조용히 머무르며 스스로와 보내는 시간을 가질 때 에너지가 회복되는 편이에요.",
    sceneHint: "주말이나 쉬는 날을 어떻게 보낼지 결정할 때",
    tensionClash: "한 사람은 계속 밖으로 나가고 싶어 하고, 다른 사람은 집에서 온전히 쉬고 싶어 할 수 있어요.",
    tensionBenefit: "활동적인 사람 덕분에 새로운 경험을 하게 되고, 조용한 사람 덕분에 차분하고 깊이 있는 휴식을 취할 수 있어요.",
    practicalTranslation: "한 사람의 방식에 맞추기보다, 이번 주말은 야외 데이트를 하고 다음 주말은 집에서 쉬는 식으로 번갈아 계획해 보세요.",
    misreadHighObservingLow: "집에서 쉬고 싶다는 요청을 데이트가 지루하다거나 나와 함께하기 싫은 것으로 잘못 볼 수 있어요.",
    misreadLowObservingHigh: "자꾸 밖으로 나가자는 제안을 내 체력을 배려하지 않는 무리한 요구로 잘못 볼 수 있어요."
  },
  focus: {
    plainLanguageDefinition: "세상을 바라볼 때 큰 그림을 보는지, 세부적인 디테일을 보는지 나타내는 성향이에요.",
    highBehavior: "전체적인 흐름이나 미래의 가능성을 중심으로 넓게 상황을 바라보는 편이에요.",
    lowBehavior: "현재 눈앞에 있는 구체적인 사실이나 세부적인 디테일에 집중하는 편이에요.",
    sceneHint: "중요한 대화를 나누거나 함께 복잡한 문제를 해결할 때",
    tensionClash: "한 사람은 대화가 사소한 디테일에 갇혀 있다고 느끼고, 다른 사람은 이야기가 너무 현실성 없이 모호하다고 느낄 수 있어요.",
    tensionBenefit: "한 사람이 방향을 잃지 않게 큰 그림을 제시하면, 다른 한 사람은 그 방향으로 가기 위한 구체적인 실행 계획을 챙겨줘요.",
    practicalTranslation: "대화를 시작하기 전, 지금 나누는 이야기가 '공감과 상상'을 위한 것인지 '구체적인 문제 해결'을 위한 것인지 먼저 말해 보세요.",
    misreadHighObservingLow: "구체적인 사실을 확인하는 모습을 지나치게 깐깐하게 꼬투리를 잡는 것으로 잘못 볼 수 있어요.",
    misreadLowObservingHigh: "미래나 가능성을 이야기하는 모습을 현실 도피나 막연한 소리만 하는 것으로 잘못 볼 수 있어요."
  },
  conflict_style: {
    plainLanguageDefinition: "갈등이 생겼을 때 문제를 대하고 해결하는 방식이에요.",
    highBehavior: "의견이 부딪히면 곧바로 그 자리에서 끝까지 대화로 풀고 넘어가려는 편이에요.",
    lowBehavior: "갈등 상황에서는 일단 물러서서 감정을 가라앉히고 생각할 시간을 가지려는 편이에요.",
    sceneHint: "의견이 심하게 부딪혀 대화의 분위기가 무거워진 직후",
    tensionClash: "한 사람은 지금 당장 결론을 내리자고 다그치고, 다른 사람은 숨이 막혀 일단 자리를 피하고 싶어 할 수 있어요.",
    tensionBenefit: "한 사람 덕분에 감정이 식을 수 있는 여유가 생기고, 다른 사람 덕분에 문제가 흐지부지 묻히지 않고 명확히 해결돼요.",
    practicalTranslation: "대화가 격해지면 '우리 30분만 각자 방에서 쉬다가 다시 이야기하자'고 말하며 타임아웃을 요청해 보세요.",
    misreadHighObservingLow: "잠시 생각할 시간을 갖는 모습을 대화를 단절하거나 관계를 포기하는 것으로 잘못 볼 수 있어요.",
    misreadLowObservingHigh: "곧바로 문제를 풀려는 즉각적인 대화 시도를 나를 향한 공격이나 압박으로 잘못 볼 수 있어요."
  },
  stimulation: {
    plainLanguageDefinition: "새로운 경험을 원하는지, 익숙한 편안함을 원하는지 보여주는 성향이에요.",
    highBehavior: "늘 새로운 변화나 신선한 이벤트, 낯선 자극을 경험할 때 활력을 얻는 편이에요.",
    lowBehavior: "검증되고 익숙한 일상 속에서 변함없는 편안함을 누리는 것을 선호하는 편이에요.",
    sceneHint: "매번 가던 식당을 갈지, 처음 보는 새로운 식당에 도전할지 정할 때",
    tensionClash: "한 사람은 일상이 너무 단조롭다며 지루해하고, 다른 사람은 잦은 변화와 새로운 시도에 피로감을 느낄 수 있어요.",
    tensionBenefit: "한 사람 덕분에 일상에 기분 좋은 생기가 돌고, 다른 사람 덕분에 지칠 때 돌아올 수 있는 안정적인 안식처가 유지돼요.",
    practicalTranslation: "평소 데이트는 익숙하고 편안한 장소에서 하되, 한 달에 한 번은 온전히 새로운 장소로 떠나는 이벤트를 기획해 보세요.",
    misreadHighObservingLow: "익숙한 것을 찾는 태도를 관계에 권태기가 왔거나 노력하지 않는 것으로 잘못 볼 수 있어요.",
    misreadLowObservingHigh: "새로운 변화를 추구하는 모습을 관계의 안정을 깨뜨리거나 변덕스러운 것으로 잘못 볼 수 있어요."
  },
  independence: {
    plainLanguageDefinition: "문제를 스스로 해결하려 하는지, 함께 의논하려 하는지 보여주는 성향이에요.",
    highBehavior: "어려운 일이 생겨도 스스로 헤쳐 나가려 하고, 관계 안에서도 개인의 자율성을 지키려는 편이에요.",
    lowBehavior: "고민이 생기면 함께 의논하고 정서적으로 깊이 기대며 협력적으로 해결하기를 원하는 편이에요.",
    sceneHint: "일적으로 힘든 상황이 생기거나 누군가의 도움이 절실히 필요할 때",
    tensionClash: "한 사람은 상대가 너무 선을 긋는다며 서운해하고, 다른 사람은 상대가 내게 너무 의존한다며 부담을 느낄 수 있어요.",
    tensionBenefit: "한 사람 덕분에 각자의 성장이 지지받고, 다른 사람 덕분에 필요할 때는 언제든 깊이 기댈 수 있는 안전망이 만들어져요.",
    practicalTranslation: "혼자 해결하고 싶을 때는 '도와주려는 건 고맙지만 이번 일은 혼자 해보고 싶어'라고 부드럽게 먼저 말해 보세요.",
    misreadHighObservingLow: "어려움을 함께 해결하려는 모습을 스스로 자립하지 못하고 내게 짐을 떠넘기는 것으로 잘못 볼 수 있어요.",
    misreadLowObservingHigh: "문제를 혼자 묵묵히 해결하려는 모습을 정서적으로 벽을 치거나 나를 배제하는 것으로 잘못 볼 수 있어요."
  },
  stability: {
    plainLanguageDefinition: "외부 상황의 변화나 스트레스에 얼마나 섬세하게 반응하는지 보여주는 성향이에요.",
    highBehavior: "외부 변화나 스트레스에도 감정선이 크게 흔들리지 않고 무던함을 유지하는 편이에요.",
    lowBehavior: "주변의 미세한 변화나 작은 자극에도 섬세하게 반응하며 다양한 감정선을 겪는 편이에요.",
    sceneHint: "예기치 않은 위기 상황이 닥치거나 계획이 갑자기 틀어졌을 때",
    tensionClash: "한 사람은 상대가 너무 예민하게 군다고 느끼고, 다른 사람은 상대가 이 상황에 너무 무심하다고 느낄 수 있어요.",
    tensionBenefit: "한 사람이 놓치기 쉬운 미세한 분위기를 섬세하게 감지해 내면, 다른 사람은 상황이 크게 흔들리지 않도록 단단하게 닻을 내려줘요.",
    practicalTranslation: "예민한 반응을 보일 때는 잘잘못을 따지기보다 '지금 많이 당황스러웠구나'라며 현재 감정 자체를 먼저 읽어 주세요.",
    misreadHighObservingLow: "상황에 섬세하게 반응하는 모습을 불필요하게 예민하게 굴거나 감정 기복이 심한 것으로 잘못 볼 수 있어요.",
    misreadLowObservingHigh: "크게 동요하지 않는 모습을 공감 능력이 부족하거나 내 감정에 무관심한 것으로 잘못 볼 수 있어요."
  }
};

/** Locale-selecting accessor — real callers should use this instead of reading AXIS_INTERPRETATIONS directly. */
export function getAxisInterpretations(
  locale: "ko-KR" | "en-US",
): Record<string, AxisInterpretation> {
  return locale === "en-US" ? AXIS_INTERPRETATIONS_EN : AXIS_INTERPRETATIONS;
}
