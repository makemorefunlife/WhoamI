import { Star } from "lucide-react";
import { useMessages } from "@/lib/i18n/LocaleProvider";

type DisplayProps = {
  rating: number;
  max?: number;
  className?: string;
};

const STAR_FILLED = "fill-[#e0b040] text-[#e0b040]";
const STAR_EMPTY = "fill-transparent text-outline-variant/55";

export function StarRatingDisplay({
  rating,
  max = 5,
  className = "",
}: DisplayProps) {
  const messages = useMessages();
  const value = Math.min(max, Math.max(0, Math.round(rating)));
  return (
    <div
      className={`flex items-center gap-0.5 ${className}`}
      aria-label={messages.decision.starRatingAria(value, max)}
    >
      {Array.from({ length: max }, (_, i) => {
        const filled = i < value;
        return (
          <Star
            key={i}
            className={`h-4 w-4 ${filled ? STAR_FILLED : STAR_EMPTY}`}
            strokeWidth={filled ? 0 : 1.5}
            aria-hidden
          />
        );
      })}
    </div>
  );
}

type InputProps = {
  value: number;
  onChange: (rating: number) => void;
  max?: number;
};

export function StarRatingInput({ value, onChange, max = 5 }: InputProps) {
  const messages = useMessages();
  return (
    <div
      className="flex items-center gap-1"
      role="radiogroup"
      aria-label={messages.decision.ratingLabel}
    >
      {Array.from({ length: max }, (_, i) => {
        const star = i + 1;
        const filled = star <= value;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            onClick={() => onChange(star)}
            className="rounded p-0.5 transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
          >
            <Star
              className={`h-7 w-7 ${
                filled ? STAR_FILLED : "fill-transparent text-outline-variant"
              }`}
              strokeWidth={filled ? 0 : 1.5}
              aria-hidden
            />
          </button>
        );
      })}
    </div>
  );
}
