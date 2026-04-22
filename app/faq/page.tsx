import SpaceBackground from "@/components/space/SpaceBackground";
import GlassCard from "@/components/space/GlassCard";

export default function FaqPage() {
  return (
    <SpaceBackground>
      <div className="relative z-10 mx-auto max-w-lg px-4 py-24">
        <GlassCard className="text-center">
          <h1 className="text-lg font-semibold text-[var(--space-text)]">
            자주 묻는 질문
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--space-text-muted)]">
            FAQ 내용을 준비 중이에요.
          </p>
        </GlassCard>
      </div>
    </SpaceBackground>
  );
}
