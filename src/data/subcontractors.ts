import { ALL_SUBCONTRACTORS } from './trades';

/**
 * Subcontractors invited to the project, across every trade. In production this
 * list comes from the project's invited-vendor roster; for the prototype it's
 * derived from the trade → subcontractor map in `data/trades.ts`.
 *
 * The Budget grid narrows the Subcontractor dropdown to the vendors for the
 * line's selected Trade — this full list is the fallback used by any code that
 * needs the complete roster. A budget line must have a Subcontractor selected
 * before it can be committed.
 */
export const INVITED_SUBCONTRACTORS: string[] = ALL_SUBCONTRACTORS;
