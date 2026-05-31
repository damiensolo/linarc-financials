/** Desert Vista prime contract payment schedule (from the contract reference summary). */
export interface ContractDraw {
  id: string;
  label: string;
  basis: string;
  gross: number;
  retainage: number;
  net: number;
  /**
   * Work-complete % that triggers this draw. Used to project the eligible date by
   * finding where the cost-loaded S-curve crosses this percent of the total.
   * 0 = billed upfront (mobilization), not tied to progress.
   */
  triggerPct: number;
}

export const CONTRACT_DRAWS: ContractDraw[] = [
  { id: 'mob', label: 'Mobilization', basis: 'Upon contract execution', gross: 29600, retainage: 0, net: 29600, triggerPct: 0 },
  { id: 'draw1', label: 'Draw 1', basis: '~25% SOV complete (demo + early interiors)', gross: 59200, retainage: 5920, net: 53280, triggerPct: 25 },
  { id: 'draw2', label: 'Draw 2', basis: '~50% SOV complete (kitchen/bath midpoint)', gross: 88800, retainage: 8880, net: 79920, triggerPct: 50 },
  { id: 'draw3', label: 'Draw 3', basis: '~75% SOV complete (most interior work)', gross: 88800, retainage: 8880, net: 79920, triggerPct: 75 },
  { id: 'subcomp', label: 'Substantial Completion', basis: 'All 8 units + common corridors complete', gross: 20720, retainage: 2072, net: 18648, triggerPct: 97 },
  { id: 'final', label: 'Final Release', basis: 'Punch list complete, closeout delivered', gross: 8880, retainage: -8880, net: 8880, triggerPct: 100 },
];
