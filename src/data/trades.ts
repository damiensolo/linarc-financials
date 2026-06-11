/**
 * Construction trades and the subcontractors that perform each one.
 *
 * In production this comes from the project's invited-vendor roster, scoped by
 * trade. For the prototype it's a fixed demo set: picking a Trade on a budget
 * line narrows the Subcontractor dropdown to the vendors that work that trade.
 *
 * A budget line must have a Trade selected before it can be locked, and a
 * Subcontractor (from that trade's list) before it can be committed.
 */
export const SUBCONTRACTORS_BY_TRADE: Record<string, string[]> = {
  Demolition: ['Sonoran Build & Repair LLC', 'Apache Demo & Hauling', 'Red Rock Site Demo'],
  'Sitework / Earthwork': [
    'Saguaro Earthworks',
    'Vista Grading & Excavation',
    'Sonoran Site Contractors',
  ],
  Concrete: ['Saguaro Concrete Works', 'Tucson Foundations & Flatwork', 'Pueblo Concrete Co.'],
  Masonry: ['Adobe Masonry Group', 'Catalina Block & Brick', 'Sonoran Stone Masons'],
  'Structural Steel': [
    'Ironwood Steel Erectors',
    'Desert Steel Fabricators',
    'Canyon Structural LLC',
  ],
  'Carpentry / Framing': [
    'Mesquite Framing Crew',
    'Sonoran Rough Carpentry',
    'Vista Wood & Trim',
  ],
  Roofing: ['Mesa Roofing & Exteriors', 'Sunbelt Commercial Roofing', 'Catalina Roof Systems'],
  'Doors & Windows': [
    'Desert Glass & Glazing',
    'Sonoran Door & Hardware',
    'Tucson Window Systems',
  ],
  Drywall: ['Catalina Drywall & Paint', 'Sonoran Wall & Ceiling', 'Pueblo Drywall Co.'],
  Painting: ['Catalina Drywall & Paint', 'Desert Hues Painting', 'Sonoran Finish Coatings'],
  Flooring: ['Rincon Flooring Specialists', 'Saguaro Tile & Stone', 'Vista Floor Coverings'],
  Tile: ['Saguaro Tile & Stone', 'Catalina Tile Works', 'Sonoran Surface Co.'],
  Plumbing: ['Cactus Plumbing & Drain', 'Desert Flow Plumbing', 'Tucson Pipe & Fixture'],
  'HVAC / Mechanical': [
    'Desert Mechanical HVAC Co.',
    'Sonoran Air & Comfort',
    'Catalina Mechanical Systems',
  ],
  Electrical: ['Tucson Electric Partners', 'Sonoran Power & Light', 'Vista Electrical Contractors'],
  'Fire Protection': ['Sentinel Fire Systems', 'Desert Fire Protection', 'Sonoran Sprinkler Co.'],
  Landscaping: [
    'Sonoran Desert Landscaping',
    'Saguaro Grounds & Irrigation',
    'Vista Hardscape & Greenery',
  ],
  'General Conditions': ['Sonoran Build & Repair LLC', 'Vista Project Services', 'Desert GC Support'],
};

/** Ordered list of trade names for the Trade select column. */
export const TRADES: string[] = Object.keys(SUBCONTRACTORS_BY_TRADE);

/** Subcontractors that perform a given trade (empty if the trade is unknown/blank). */
export function getSubcontractorsForTrade(trade: string | null | undefined): string[] {
  if (!trade) return [];
  return SUBCONTRACTORS_BY_TRADE[trade] ?? [];
}

/** Every invited subcontractor across all trades, de-duplicated and sorted. */
export const ALL_SUBCONTRACTORS: string[] = Array.from(
  new Set(Object.values(SUBCONTRACTORS_BY_TRADE).flat())
).sort((a, b) => a.localeCompare(b));
