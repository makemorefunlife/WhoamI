import { Archive, Compass, Flame, Heart, Mic, Sofa, Star, Telescope, Users } from "lucide-react";
import type { RelationshipRoleIcon } from "@/lib/relationship/map/relationshipRoleSsot";

/**
 * Simple line-only icon per role, reusing lucide-react (already the app's
 * icon set) wherever a close match exists. "push_button" has no lucide
 * equivalent, so it's hand-drawn here as a bezel + inset cap — an emergency
 * push switch, never a clothing button (see growth_button role copy).
 */
export default function RolePlanetIcon({
  icon,
  className,
}: {
  icon: RelationshipRoleIcon;
  className?: string;
}) {
  switch (icon) {
    case "heart_outline":
      return <Heart className={className} strokeWidth={1.75} />;
    case "star_outline":
      return <Star className={className} strokeWidth={1.75} />;
    case "compass_outline":
      return <Compass className={className} strokeWidth={1.75} />;
    case "couch_outline":
      return <Sofa className={className} strokeWidth={1.75} />;
    case "microphone_outline":
      return <Mic className={className} strokeWidth={1.75} />;
    case "treasure_chest_outline":
      return <Archive className={className} strokeWidth={1.75} />;
    case "telescope_outline":
      return <Telescope className={className} strokeWidth={1.75} />;
    case "twin_outline":
      return <Users className={className} strokeWidth={1.75} />;
    case "flame_outline":
      return <Flame className={className} strokeWidth={1.75} />;
    case "push_button":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="4.5" fill="currentColor" stroke="none" opacity={0.28} />
          <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2" />
        </svg>
      );
    default:
      return null;
  }
}
