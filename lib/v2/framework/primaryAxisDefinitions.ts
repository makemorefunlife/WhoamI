import type { PrimaryAxisKey } from "@/lib/v2/survey/types";

export type PrimaryAxisDefinition = {
  label: string;
  koLabel: string;
  description: string;
};

/** Product-wide SSOT for Primary Axis labels and meanings */
export const PRIMARY_AXIS_DEFINITIONS: Record<
  PrimaryAxisKey,
  PrimaryAxisDefinition
> = {
  autonomy: {
    label: "Autonomy",
    koLabel: "자율성",
    description:
      "Your tendency to make decisions independently and trust your own judgment.",
  },
  connection: {
    label: "Connection",
    koLabel: "관계지향성",
    description:
      "How much emotional connection, closeness, and meaningful relationships matter to you.",
  },
  stability: {
    label: "Stability",
    koLabel: "안정지향성",
    description:
      "How much you value security, consistency, and predictability.",
  },
  growth: {
    label: "Growth",
    koLabel: "성장지향성",
    description:
      "How strongly you seek learning, improvement, and new possibilities.",
  },
  structure: {
    label: "Structure",
    koLabel: "체계성",
    description:
      "How much you prefer planning, organization, clear routines, and a sense of order.",
  },
  adaptability: {
    label: "Adaptability",
    koLabel: "적응성",
    description:
      "How easily you adjust your thinking and behavior when situations change.",
  },
} as const;

/** LLM prompt reference — canonical English meanings */
export const PRIMARY_AXIS_LLM_GUIDE = `Primary Axis definitions (use these exact names in reports):
- Autonomy: independent decision-making and self-direction
- Connection: emotional closeness and relationship orientation
- Stability: need for security, consistency, and predictability
- Growth: desire for learning, improvement, and possibility
- Structure: preference for planning, organization, and clear routines
- Adaptability: ability to adjust to change and uncertainty`;
