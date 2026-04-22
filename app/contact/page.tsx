import SpaceBackground from "@/components/space/SpaceBackground";
import GlassCard from "@/components/space/GlassCard";

export default function ContactPage() {
  return (
    <SpaceBackground>
      <div className="relative z-10 mx-auto max-w-lg px-4 py-24">
        <GlassCard className="text-center">
          <h1 className="text-lg font-semibold text-[var(--space-text)]">
            문의하기
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--space-text-muted)]">
            문의 채널을 열 준비 중이에요.
          </p>
        </GlassCard>
      </div>
    </SpaceBackground>
  );
}
