import SpaceBackground from "@/components/space/SpaceBackground";
import GlassCard from "@/components/space/GlassCard";
import { getRequestLocale } from "@/lib/i18n/serverLocale";
import { getMessages } from "@/lib/i18n/messages";

export default async function ContactPage() {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  return (
    <SpaceBackground>
      <div className="relative z-10 mx-auto max-w-lg px-4 py-24">
        <GlassCard className="text-center">
          <h1 className="text-lg font-semibold text-[var(--space-text)]">
            {messages.contact.title}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--space-text-muted)]">
            {messages.contact.body}
          </p>
        </GlassCard>
      </div>
    </SpaceBackground>
  );
}
