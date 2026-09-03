import { isoTimestampMs } from "@/lib/relationship/sortByIsoTimestampDesc";

export type DirectoryPerson = { key: string; addedAt: string | null };

export type DirectoryPage<T extends DirectoryPerson> = {
  total: number;
  people: T[];
  nextOffset: number | null;
};

/**
 * The complete, paginated role membership list — separate from the map's
 * visual scatter cap (selectDisplayedPeople). The directory shows
 * *everyone*, newest-added first, in pages; it never trims by favorite
 * status the way the scatter view does (spec sections 16-18: "Map =
 * emotional discovery, Directory = practical lookup").
 */
export function paginateRoleDirectory<T extends DirectoryPerson>(
  all: readonly T[],
  offset: number,
  limit: number,
): DirectoryPage<T> {
  const sorted = [...all].sort((a, b) => isoTimestampMs(b.addedAt) - isoTimestampMs(a.addedAt));
  const page = sorted.slice(offset, offset + limit);
  return {
    total: sorted.length,
    people: page,
    nextOffset: offset + limit < sorted.length ? offset + limit : null,
  };
}
