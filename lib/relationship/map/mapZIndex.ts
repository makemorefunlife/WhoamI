/**
 * Shared stacking order for the map canvas. MUST stay in this relative
 * order: an unselected planet sits behind everything; the selected planet
 * is enlarged and glowing, but the scattered people around it must still
 * be clickable on top of it (a real bug this session: the planet's
 * enlarged hit area intercepted clicks meant for a chip near its edge);
 * the invite "+" button always floats above both.
 */
export const MAP_Z = {
  planetDefault: 1,
  planetSelected: 20,
  scatteredPerson: 25,
  addPersonButton: 30,
} as const;
