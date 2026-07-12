/** 5대 관계 탭 — UI 액센트 컬러 SSOT */
export type RelationshipTabKind =
  | "romantic"
  | "work"
  | "cohabitation"
  | "family"
  | "friendship";

export type RelationshipTabTheme = {
  accent: string;
  accentMuted: string;
  gradientFrom: string;
  borderClass: string;
  glowClass: string;
};

export const RELATIONSHIP_TAB_THEME: Record<
  RelationshipTabKind,
  RelationshipTabTheme
> = {
  romantic: {
    accent: "#ffd6a5",
    accentMuted: "#ffd6a5b3",
    gradientFrom: "from-[#ffd6a5]/18",
    borderClass: "border-[#ffd6a5]/30",
    glowClass: "shadow-[0_0_48px_-12px_rgba(255,214,165,0.35)]",
  },
  work: {
    accent: "#67b7ff",
    accentMuted: "#67b7ffb3",
    gradientFrom: "from-[#67b7ff]/16",
    borderClass: "border-[#67b7ff]/28",
    glowClass: "shadow-[0_0_48px_-12px_rgba(103,183,255,0.35)]",
  },
  cohabitation: {
    accent: "#d4a5e8",
    accentMuted: "#d4a5e8b3",
    gradientFrom: "from-[#d4a5e8]/16",
    borderClass: "border-[#d4a5e8]/30",
    glowClass: "shadow-[0_0_48px_-12px_rgba(212,165,232,0.35)]",
  },
  family: {
    accent: "#9ed4b8",
    accentMuted: "#9ed4b8b3",
    gradientFrom: "from-[#9ed4b8]/16",
    borderClass: "border-[#9ed4b8]/30",
    glowClass: "shadow-[0_0_48px_-12px_rgba(158,212,184,0.35)]",
  },
  friendship: {
    accent: "#7ec8ff",
    accentMuted: "#7ec8ffb3",
    gradientFrom: "from-[#7ec8ff]/16",
    borderClass: "border-[#7ec8ff]/28",
    glowClass: "shadow-[0_0_48px_-12px_rgba(126,200,255,0.35)]",
  },
};

export function getStitchTabTheme(
  kind: RelationshipTabKind,
): RelationshipTabTheme {
  const base = RELATIONSHIP_TAB_THEME[kind];
  if (kind === "romantic") {
    return {
      accent: "#3a8f6e",
      accentMuted: "rgba(58, 143, 110, 0.72)",
      gradientFrom: "from-secondary/10",
      borderClass: "border-outline-variant/30",
      glowClass: "",
    };
  }
  return {
    ...base,
    gradientFrom: "from-secondary/10",
    borderClass: "border-outline-variant/30",
    glowClass: "",
  };
}

export function getTabTheme(kind: RelationshipTabKind): RelationshipTabTheme {
  return RELATIONSHIP_TAB_THEME[kind];
}
