import { isoTimestampMs } from "@/lib/relationship/sortByIsoTimestampDesc";

export const MAX_DISPLAYED_PEOPLE_PER_ROLE = 30;

export type SelectablePerson = {
  isFavorite: boolean;
  addedAt: string | null;
};

/**
 * Which people to actually render for a role once it's opened. Favorited
 * people are always included (never trimmed to make room), the rest fill
 * the remaining slots up to the cap, newest-added first.
 */
export function selectDisplayedPeople<T extends SelectablePerson>(
  people: readonly T[],
  cap: number = MAX_DISPLAYED_PEOPLE_PER_ROLE,
): T[] {
  const favorites = people.filter((p) => p.isFavorite);
  const nonFavorites = people
    .filter((p) => !p.isFavorite)
    .slice()
    .sort((a, b) => isoTimestampMs(b.addedAt) - isoTimestampMs(a.addedAt));

  const remainingSlots = Math.max(0, cap - favorites.length);
  return [...favorites, ...nonFavorites.slice(0, remainingSlots)];
}
