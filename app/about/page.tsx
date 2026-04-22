import SpaceBackground from "@/components/space/SpaceBackground";
import GlassCard from "@/components/space/GlassCard";

export default function AboutPage() {
  return (
    <SpaceBackground>
      <div className="relative z-10 mx-auto max-w-lg px-4 py-24">
        <GlassCard className="text-center">
          <h1 className="text-lg font-semibold text-[var(--space-text)]">
            서비스 소개
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--space-text-muted)]">
            이 페이지는 곧 채워질 예정이에요. 잠시만 기다려 주세요.
          </p>
        </GlassCard>
      </div>
    </SpaceBackground>
  );
}
