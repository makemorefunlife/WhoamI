/**
 * English (en-US) equivalents of the Korean deterministic evidence strings in
 * formatPart01EvidenceForPrompt.ts. These strings are fed to the LLM prompt
 * (and, for fit plans, can reach users), so en-US generation must never see
 * the Korean originals. Keys/structure mirror the Korean tables 1:1.
 */
import type {
  ActionCandidateFamily,
  ActionClosingFrame,
  EnergyMechanismKey,
  EnergyMechanismSpec,
  FitCategoryKey,
  FitCategorySpec,
} from "@/lib/report/formatPart01EvidenceForPrompt";

export const ENERGY_MECHANISM_SPECS_EN: Record<EnergyMechanismKey, EnergyMechanismSpec> = {
  DECISION_LOAD: {
    key: "DECISION_LOAD",
    label: "Decision fatigue and judgment backlog",
    description:
      "Mental backlog and decision fatigue that build when you must weigh many variables and other people's views before deciding, or carry the responsibility for a decision alone",
    fuelExample:
      "Time to make independent choices: you set the scope and priorities yourself and act without waiting for outside approval",
    drainExample:
      "Situations where the responsibility is yours, but you keep having to negotiate and get sign-off from others before you can decide",
  },
  CONTROL_LOAD: {
    key: "CONTROL_LOAD",
    label: "Holding control and the lead",
    description:
      "The strain of needing to hold the flow of a situation and the responsibility for it in your own hands before you can relax",
    fuelExample:
      "An environment where you can focus independently within your own control, without outside interference or surprise variables",
    drainExample:
      "Situations where outside pressure or other people's inconsistent behavior pushes things outside your control and shakes your sense of responsibility",
  },
  STRUCTURE_MAINTENANCE: {
    key: "STRUCTURE_MAINTENANCE",
    label: "Rebuilding systems and structure",
    description:
      "The strain of setting clear principles, systems and order, then repeatedly maintaining or revising them",
    fuelExample:
      "A stable environment where rules and roles are clear, so you don't have to re-judge things or rebuild the plan each time",
    drainExample:
      "An environment where standards and principles keep changing, forcing you to rework finished plans and structures from scratch",
  },
  UNCERTAINTY_MONITORING: {
    key: "UNCERTAINTY_MONITORING",
    label: "Watching for uncertainty and risk",
    description:
      "The strain of sensing unpredictable variables and risks in advance and continually calculating how to handle them",
    fuelExample:
      "A steady state with predictable schedules and transparent information, so you don't have to keep calculating future variables",
    drainExample:
      "An environment of ambiguity and constant surprises, where it is hard to predict your next move",
  },
  ADAPTATION_SWITCHING: {
    key: "ADAPTATION_SWITCHING",
    label: "Context switching and constant adapting",
    description:
      "The load of quickly changing your approach, role and perspective to match situations and environments that keep shifting",
    fuelExample:
      "A flow where you can stay absorbed in one important task or deep topic for a long stretch without interruption",
    drainExample:
      "A scattered environment where you keep bouncing between very different demands and tasks in a short time",
  },
  SOCIAL_MONITORING: {
    key: "SOCIAL_MONITORING",
    label: "Reading the room and managing mood",
    description:
      "The load of continually watching the mood, emotional shifts and reactions of the people around you and adjusting your own behavior to match",
    fuelExample:
      "A comfortable relationship where your intent comes across as it is, without having to monitor the other person's reactions",
    drainExample:
      "Gatherings or meetings where you must track several people's conflicting reactions and expectations at once",
  },
  RECOVERY_ISOLATION_NEED: {
    key: "RECOVERY_ISOLATION_NEED",
    label: "Need for solitude to recover",
    description:
      "A state where, after interacting with others, you need complete solitude and time to sort things out on your own to reset your inner bearings",
    fuelExample:
      "Time fully alone, with no obligation to respond or explain, to recharge and regroup",
    drainExample:
      "An environment with back-to-back public or social contact that leaves no room to think things through alone",
  },
  RELATIONAL_REPAIR_LOAD: {
    key: "RELATIONAL_REPAIR_LOAD",
    label: "Repairing conflict and smoothing feelings",
    description:
      "The inner tension of restoring the atmosphere and mending the relationship after conflict or emotional discord",
    fuelExample:
      "A relationship with emotional steadiness and no conflict or misunderstanding, so no energy goes into repair",
    drainExample:
      "Situations where lingering resentment or unresolved tension with someone keeps drawing your attention",
  },
};

export const FIT_CATEGORY_SPECS_EN: Record<FitCategoryKey, FitCategorySpec> = {
  AUTONOMY: {
    key: "AUTONOMY",
    label: "Room for autonomy and independent judgment",
    peopleFitDirection:
      "People who give you the space and time to judge and act on your own, rather than deciding for you or pushing you to negotiate",
    frictionDirection:
      "Being handed responsibility but then asked for approval and agreement on every detail of how you carry it out",
    communicationTrigger: "Why did you decide that on your own? / Don't try to decide everything by yourself.",
    communicationBetter:
      "Let's agree up front on the priorities and the scope of judgment for the part you own.",
    environmentFitDirection:
      "Roles and goals are clear, but you have independent control over methods and how you use your time",
  },
  STRUCTURE: {
    key: "STRUCTURE",
    label: "Clear principles and order",
    peopleFitDirection:
      "People who don't keep changing plans and steps, and who keep rules and role divisions clear",
    frictionDirection:
      "Conversations where a standard is agreed and then the premise or the words are reversed midway, forcing you to redo the plan",
    communicationTrigger: "Just don't worry about the rules, wing it as things come.",
    communicationBetter: "Let's write down the revised principles and criteria first, then line up the steps.",
    environmentFitDirection:
      "Procedures and ownership are clear, so you don't have to reinterpret the situation every time",
  },
  PREDICTABILITY: {
    key: "PREDICTABILITY",
    label: "Predictability and fewer surprises",
    peopleFitDirection:
      "People with steady moods and consistent behavior, so you can anticipate the next step",
    frictionDirection:
      "Vague intentions or sudden changes that get in the way of preparing and make things feel unstable",
    communicationTrigger: "I don't know how it'll turn out, so just wait and see.",
    communicationBetter:
      "I'll share what's confirmed and what might change ahead of time so you can prepare.",
    environmentFitDirection:
      "Few abrupt changes of direction or surprises, so you can carry out the plan as intended",
  },
  STIMULATION: {
    key: "STIMULATION",
    label: "Dynamism and trying new things",
    peopleFitDirection:
      "Flexible people who spark new perspectives and ideas and enjoy growing alongside you",
    frictionDirection:
      "A rigid relationship that insists on the old way and shuts down any chance of trying something new",
    communicationTrigger: "Just do it the way we always do. Don't try anything new.",
    communicationBetter: "Tell me what new idea or experiment you'd like to try this time.",
    environmentFitDirection:
      "A dynamic setting with a steady supply of new problems and stimulation, not locked into fixed routines",
  },
  RELATIONAL_DEPTH: {
    key: "RELATIONAL_DEPTH",
    label: "Authentic relational depth",
    peopleFitDirection:
      "Sincere people who would rather share real feelings and inner values than keep up social formalities",
    frictionDirection:
      "Communication that seems friendly on the surface but keeps its distance, without real responsibility, when it matters",
    communicationTrigger: "Let's just go along and smooth it over.",
    communicationBetter: "I want to hear what you really care about and what you honestly think.",
    environmentFitDirection:
      "Relationships where you can build deep trust with a few people, not shallow social circles",
  },
  EMOTIONAL_EXPLICITNESS: {
    key: "EMOTIONAL_EXPLICITNESS",
    label: "Clear emotional expression and intent",
    peopleFitDirection:
      "People who state their mood and needs clearly and openly instead of hinting",
    frictionDirection:
      "Showing displeasure without saying why, and expecting the other person to pick up on it",
    communicationTrigger: "Do you really not know why I'm upset?",
    communicationBetter: "Let me tell you clearly what part left me disappointed just now.",
    environmentFitDirection:
      "A team that communicates directly and openly, without making you scan the room for unspoken cues",
  },
  DECISION_CLARITY: {
    key: "DECISION_CLARITY",
    label: "Clear ownership of decisions",
    peopleFitDirection:
      "People who make the scope and responsibility of a decision clear and steady the center when needed",
    frictionDirection:
      "Withholding decision-making power while pushing the problems and blame onto you, or delaying decisions indefinitely",
    communicationTrigger: "Decide it yourself, but it's on you if it goes wrong.",
    communicationBetter: "I'll leave this decision to your judgment and back you up once you make it.",
    environmentFitDirection:
      "It's clear who makes the final call, and items get closed efficiently without a backlog of judgment",
  },
  FEEDBACK_DIRECTNESS: {
    key: "FEEDBACK_DIRECTNESS",
    label: "Clear, plain feedback",
    peopleFitDirection:
      "People who give facts and a direction for improvement plainly, without emotional blame or inflated praise",
    frictionDirection:
      "Vague hinting or personal jabs that scatter the real problem instead of solving it",
    communicationTrigger: "Is this really how you usually do your work?",
    communicationBetter:
      "Let me say specifically, based on facts, what would strengthen this result.",
    environmentFitDirection:
      "A culture that grows through objective data and specific feedback, without personal friction",
  },
  PROCESSING_TIME: {
    key: "PROCESSING_TIME",
    label: "Respect for time to process",
    peopleFitDirection:
      "People who don't rush an immediate answer after new information or conflict, and give you time to think",
    frictionDirection:
      "Communication that rushes you for an answer, insisting everything be solved right now, with no time to think",
    communicationTrigger: "Answer me right now. Why aren't you saying anything?",
    communicationBetter:
      "You probably need time to sort this out. Talk to me whenever you're ready, no rush.",
    environmentFitDirection:
      "Work and relationship spaces that don't pressure instant reactions and protect time for independent thinking",
  },
  BOUNDARY_RESPECT: {
    key: "BOUNDARY_RESPECT",
    label: "Respect for boundaries and personal space",
    peopleFitDirection:
      "People who keep an appropriate distance and don't intrude on your privacy or territory in the name of closeness",
    frictionDirection:
      "Needless meddling or over-involvement that breaks down personal boundaries and forces one-sided intimacy",
    communicationTrigger: "What could you possibly be hiding from me? Tell me everything.",
    communicationBetter:
      "Share only as much as you want to. I'll always respect your personal space.",
    environmentFitDirection:
      "A culture that thoroughly respects each person's independent space and time and rules out intrusion",
  },
  COLLABORATION: {
    key: "COLLABORATION",
    label: "Mutual-respect teamwork",
    peopleFitDirection:
      "People who recognize each other's strengths and build bigger results together instead of leading unilaterally",
    frictionDirection:
      "A dominating dynamic of one-way orders where one person's push ignores everyone else's input and contribution",
    communicationTrigger: "Just do what I tell you. No arguing.",
    communicationBetter:
      "How can we use each of our strengths to tackle this task together?",
    environmentFitDirection:
      "A collaborative team where people listen to each other as equals and build on each other's ideas",
  },
  GROWTH_VARIETY: {
    key: "GROWTH_VARIETY",
    label: "Room to grow and openness to variety",
    peopleFitDirection:
      "Curious people who treat mistakes as chances to grow and accept more than one good answer",
    frictionDirection:
      "A stifling attitude that insists on a single correct answer and labels other approaches or challenges as failure",
    communicationTrigger: "Why can't you just do it the standard way like everyone else?",
    communicationBetter:
      "Tell me why you want to change the current approach and what risks you expect. Once I understand, let's decide how far to let you try something new.",
    environmentFitDirection:
      "A challenging environment that encourages learning through trial and error and respects varied experiments",
  },
};

export const ACTION_FALLBACK_EN = {
  doDirections: [
    "Before a big decision, write your own inner priority in one line before reading anyone else's reaction",
    "Test the direction you chose for a set period and review the results as data",
    "Prioritize relationships that respect your autonomy and give you time to judge independently",
  ],
  dontDirections: [
    "Don't delay a decision or keep rechecking until everyone is fully satisfied",
    "Don't hand over decision power in your own area just to meet someone's expectations",
    "Don't reopen a decision every time a small variable appears and shake the whole plan",
  ],
  decisionRuleDirections: [
    "Tell apart whether you truly want this choice or are accepting it to avoid conflict",
    "Tell apart whether you need more information or already have enough and are only waiting for certainty",
    "Check whether you could keep this approach going for a long time without draining your energy",
  ],
  closingFrame: {
    primaryFamily: "DECISION",
    strengthTruth: "The strength of independent judgment and setting your own inner standard",
    overuseTruth:
      "The burden of waiting for everyone's agreement or trying to carry every outcome alone",
    distinctionTruth: "The difference between careful inner judgment and needing unanimous confirmation",
  } as ActionClosingFrame,
};

export function buildActionDirectionsEn(
  primaryFamily: ActionCandidateFamily,
  secondaryFamily: ActionCandidateFamily,
): { doDirections: string[]; dontDirections: string[]; decisionRuleDirections: string[] } {
  const doD: string[] = [];
  const dontD: string[] = [];
  const rule: string[] = [];

  if (primaryFamily === "DECISION") {
    doD.push("When making an important decision, sum up your own criteria in one sentence before hearing others' positions");
    dontD.push("Don't delay judgment on the belief that you can't decide until you've confirmed others' reactions or agreement");
    rule.push("Tell apart whether this choice fits your own standard and sense of agency, or is an attempt to meet others' expectations");
  } else if (primaryFamily === "STRUCTURE") {
    doD.push("Lay out the working steps and key rules in advance so structural predictability comes first");
    dontD.push("Don't try to control every exception up front and miss the moment to act or sink into perfectionism");
    rule.push("Tell apart whether you need a better process or plan, or are polishing an already sufficient plan to postpone commitment");
  } else if (primaryFamily === "GROWTH") {
    doD.push("Favor choices that offer new attempts and learning, and keep a regular routine of small experiments");
    dontD.push("Don't abandon your own core direction and keep bending to others just because you adapt well");
    rule.push("Tell apart whether this change is new learning that helps you grow, or just you changing direction to fit your surroundings");
  } else if (primaryFamily === "ADAPTABILITY") {
    doD.push("Respond flexibly to varied circumstances, but first decide the one core standard you will hold through this change");
    dontD.push("Don't take on all the burden of every change and the role of sole coordinator just because you fit in easily");
    rule.push("Tell apart whether you accept this because you truly want to, or because the habit of always adjusting has made you go along");
  } else {
    doD.push("Work while keeping clear boundaries that protect independent space for judgment and autonomy");
    dontD.push("Don't let a long stretch of putting your own priorities aside to keep the peace turn into a pattern");
    rule.push("Tell apart whether you accept this because you truly agree, or to avoid conflict and friction");
  }

  if (secondaryFamily === "STRUCTURE" && primaryFamily !== "STRUCTURE") {
    doD.push("Turn frequently repeated decisions into templates to cut down on energy spent");
    dontD.push("Don't believe you can only start once everything is perfectly prepared, or fear stopping at good enough");
    rule.push("Consider whether this needs to be done perfectly, or whether finishing at a good-enough level and moving on serves you better");
  } else if (secondaryFamily === "GROWTH" && primaryFamily !== "GROWTH") {
    doD.push("Keep your current way of working while making room for regular small experiments");
    dontD.push("Don't get stuck in a routine that has drained all learning and curiosity in the name of stability");
    rule.push("Consider whether keeping this choice long-term expands your abilities or makes you shrink defensively");
  } else if (secondaryFamily === "ADAPTABILITY" && primaryFamily !== "ADAPTABILITY") {
    doD.push("When something unexpected comes up, prepare a flexible alternative without losing your own standard");
    dontD.push("Don't reverse your original plan without any criteria just because you can adapt to change");
    rule.push("Tell apart whether this alternative serves your goal, or is just a compromise to wrap things up quickly");
  } else if (secondaryFamily === "BOUNDARY" && primaryFamily !== "BOUNDARY") {
    doD.push("Regardless of others' requests or empathy, state clearly the limits of the resources you can actually handle");
    dontD.push("Don't carry the burden of being solely responsible for other people's feelings or the whole team's mood");
    rule.push("Tell apart whether this is an area you can help with, or a responsibility the other person has to work through themselves");
  } else {
    doD.push("Before acting on a judgment, take time to check that it matches your core values");
    dontD.push("Don't easily reverse a decision already made because of momentary impatience or outside pressure");
    rule.push("Tell apart whether this decision serves your long-term goals or is a stopgap to relieve short-term pressure");
  }

  if (primaryFamily === "STRUCTURE") {
    doD.push("Protect a predictable, regular rest routine to restore your structural energy");
    dontD.push("Don't fill even your rest time with a tight plan in the name of keeping to the schedule");
    rule.push("Consider whether you could keep this approach going without draining your mental and physical energy");
  } else if (primaryFamily === "GROWTH" || primaryFamily === "ADAPTABILITY") {
    doD.push("Build a recovery routine to settle and sort yourself after exploring and trying new things");
    dontD.push("Don't keep curiosity and flexibility running until you are worn out just because they are working");
    rule.push("Tell apart whether this change or experiment supports your long-term growth or leads to burnout");
  } else {
    doD.push("Secure a space for independent inner recovery and protect that time first");
    dontD.push("Don't isolate yourself or let friction drag on in the name of protecting your independence and decision power");
    rule.push("Consider whether you could keep this decision going for a long time without draining your energy");
  }

  return { doDirections: doD, dontDirections: dontD, decisionRuleDirections: rule };
}

export const FAMILY_CLOSING_FRAMES_EN: Record<ActionCandidateFamily, ActionClosingFrame> = {
  DECISION: {
    primaryFamily: "DECISION",
    strengthTruth: "The power of independent choice: judging for yourself and setting your own inner standard",
    overuseTruth: "The excessive burden of seeking everyone's certainty or carrying every outcome alone",
    distinctionTruth: "Judging carefully for yourself versus believing you can only decide with everyone's agreement",
  },
  STRUCTURE: {
    primaryFamily: "STRUCTURE",
    strengthTruth: "The strength to organize complex situations and set predictable steps and principles",
    overuseTruth: "A perfectionist control mode that believes you can move only once every exception is handled",
    distinctionTruth: "Building a useful system that brings stability versus delaying action until certainty is perfect",
  },
  GROWTH: {
    primaryFamily: "GROWTH",
    strengthTruth: "The strength to explore new possibilities and widen the range of your experience and learning",
    overuseTruth: "A tendency to lose your own direction and lean only on adapting to circumstances and others' expectations",
    distinctionTruth: "Change that expands you versus adapting in a way that erases your own agency",
  },
  ADAPTABILITY: {
    primaryFamily: "ADAPTABILITY",
    strengthTruth: "The strength to respond flexibly to change and coordinate many variables",
    overuseTruth: "The burden of absorbing and accommodating every demand and change alone, with no center of your own",
    distinctionTruth: "Responding flexibly to a situation versus wavering every time because you have no standard of your own",
  },
  BOUNDARY: {
    primaryFamily: "BOUNDARY",
    strengthTruth: "The strength to recognize your own limits and keep clear boundaries",
    overuseTruth: "An excessive sense of shared responsibility for others' feelings and the whole team's mood",
    distinctionTruth: "Caring for and helping someone versus taking on what is theirs to carry",
  },
  COMMUNICATION: {
    primaryFamily: "COMMUNICATION",
    strengthTruth: "The strength to express intent and feelings clearly and build bridges",
    overuseTruth: "The urgency to clear up every misunderstanding immediately",
    distinctionTruth: "Honestly conveying intent versus over-explaining and delaying",
  },
  RELATIONAL: {
    primaryFamily: "RELATIONAL",
    strengthTruth: "The strength to build deep trust and share what is inside",
    overuseTruth: "The burden of checking the temperature of the relationship and the other person's reaction every time",
    distinctionTruth: "Authentic connection versus trying to manage the other person's feelings for them",
  },
  ENERGY: {
    primaryFamily: "ENERGY",
    strengthTruth: "The strength to read your own energy flow and protect your recovery routine first",
    overuseTruth: "Overusing a strength by running nonstop because your energy is working well",
    distinctionTruth: "Keeping to sustainable principles versus wringing out your energy",
  },
};

export function sajuBehavioralNoteEn(starNames: string[]): string | undefined {
  if (starNames.some((n) => n.includes("도화"))) {
    return "Use your strength in connecting with people and setting the mood, but don't try to be solely responsible for the temperature of every relationship and everyone's reactions";
  }
  if (starNames.some((n) => n.includes("현침"))) {
    return "Keep the precise eye that pinpoints what is essential, and the more right you are, the more you should adjust the timing and intensity of how you say it";
  }
  if (starNames.some((n) => n.includes("천을귀인"))) {
    return "Don't treat handling everything perfectly alone as the only form of independence; actively connect with people and resources for help when you need it";
  }
  return undefined;
}
