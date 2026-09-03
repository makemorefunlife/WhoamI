import { RELATIONSHIP_KINDS, type RelationshipKind } from "./relationshipKind";

/** The other valid analysis lenses for a report-end "explore another side" CTA — excludes the one already open. */
export function otherRelationshipKinds(currentKind: RelationshipKind): RelationshipKind[] {
  return RELATIONSHIP_KINDS.filter((kind) => kind !== currentKind);
}
