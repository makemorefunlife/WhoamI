/**
 * English copy for Stitch free survey (same option values as KO for scoring).
 */
import type { SurveyQuestion } from "@/lib/v2/survey/questions";

export const SURVEY_V2_QUESTIONS_EN: SurveyQuestion[] = [
  {
    id: "q1",
    prompt:
      "You found something you wanted, but it costs more than you expected.\n\nWhat do you usually do?",
    options: [
      { value: "A", label: "I buy it anyway — I'll probably keep wanting it." },
      { value: "B", label: "I compare prices, reviews, and even used options first." },
      { value: "C", label: "I look for a similar option within my budget." },
      {
        value: "D",
        label: "I pass for now. If I still want it in a few days, I'll revisit it.",
      },
    ],
  },
  {
    id: "q2",
    prompt:
      "You had a strong disagreement with a close friend.\n\nHow do you usually respond?",
    options: [
      {
        value: "A",
        label: "I try to meet them halfway or apologize first — keeping things smooth matters.",
      },
      { value: "B", label: "I want to talk through which view makes more sense." },
      { value: "C", label: "I agree partly or change the subject and move on." },
      {
        value: "D",
        label: "I take some distance. It often sorts itself out with time.",
      },
    ],
  },
  {
    id: "q3",
    prompt:
      "Something you prepared for a long time ended below your expectations.\n\nWhat happens next?",
    options: [
      {
        value: "A",
        label: "It stays on my mind for a while. Other tasks feel harder too.",
      },
      { value: "B", label: "I'm upset, but I start by figuring out why it turned out this way." },
      { value: "C", label: "I want to talk it through with someone close and feel supported." },
      {
        value: "D",
        label: "How sincerely I showed up matters more than the outcome.",
      },
    ],
  },
  {
    id: "q4",
    prompt: "Right before a trip, your accommodation booking gets canceled.\n\nYou:",
    options: [
      { value: "A", label: "Feel deflated — it feels like the plan fell apart." },
      { value: "B", label: "See it as a chance to try somewhere new." },
      { value: "C", label: "Feel thrown off, but immediately look for another place." },
      { value: "D", label: "Wonder whether to cancel the trip altogether." },
    ],
  },
  {
    id: "q5",
    prompt: "If you could protect only one thing in life, what would you choose?",
    options: [
      { value: "A", label: "Freedom to be myself" },
      { value: "B", label: "Financial stability" },
      { value: "C", label: "The people I care about" },
      { value: "D", label: "My growth and potential" },
    ],
  },
  {
    id: "q6",
    prompt: "On a team project, who drains you the most?",
    options: [
      { value: "A", label: "Someone who talks but doesn't follow through" },
      { value: "B", label: "Someone who takes feedback like a personal attack" },
      { value: "C", label: "Someone with no opinions who makes me decide everything" },
      { value: "D", label: "Someone who fixates on small details and slows progress" },
    ],
  },
  {
    id: "q7",
    prompt: "You're facing an important decision.\n\nWhat do you check first?",
    options: [
      { value: "A", label: "What I genuinely want" },
      { value: "B", label: "Whether it's realistic" },
      { value: "C", label: "How it will affect people around me" },
      { value: "D", label: "Whether it helps me long term" },
    ],
  },
  {
    id: "q8",
    prompt: "What thought shows up most often before you fall asleep lately?",
    options: [
      {
        value: "A",
        label: "Today was okay. I can handle tomorrow too.",
      },
      { value: "B", label: "Finally, rest. I feel calm with nothing on my mind." },
      {
        value: "C",
        label: "Tomorrow already feels heavy. Everything feels like a chore.",
      },
      {
        value: "D",
        label: "Today's events or worries about what's ahead keep looping.",
      },
    ],
  },
  {
    id: "q9",
    prompt: "You suddenly have a completely free day.\n\nLately, you:",
    options: [
      { value: "A", label: "Need people or going out to feel energized." },
      { value: "B", label: "Recharge alone or with a hobby." },
      { value: "C", label: "Try to keep growing so I don't fall behind." },
      {
        value: "D",
        label:
          "I tell myself I should do something, but I'm too tired and mostly just lie around.",
      },
    ],
  },
  {
    id: "q10",
    prompt: "What concern do you most want to solve in your life right now?",
    options: [
      { value: "1", label: "Money" },
      { value: "2", label: "Relationships" },
      { value: "3", label: "Health" },
      { value: "4", label: "Career & direction" },
      { value: "5", label: "Other" },
    ],
  },
];

export const SURVEY_V2_QUESTION_COUNT_EN = SURVEY_V2_QUESTIONS_EN.length;
