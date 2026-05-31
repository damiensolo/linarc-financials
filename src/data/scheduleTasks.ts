import type { ScheduleTask } from '../types';

/**
 * Desert Vista Apartments construction schedule (64 tasks, 6 phases).
 * Cost codes are CSI MasterFormat and are the connector to budget/SOV lines.
 * Tasks with an empty costCode (e.g. Mobilization, Change Order) are intentionally uncosted.
 */
export const MOCK_SCHEDULE_TASKS: ScheduleTask[] = [
  // ── Phase 1 — Mobilization / Admin ──────────────────────────────────────
  { id: 'U3UGJ4', wbs: '1.0', name: 'Sleeving', costCode: '01 71 13', phase: 'Mobilization / Admin', plannedHours: 0, planStart: '2026-04-15', planEnd: '2026-04-15' },
  { id: 'X4QWE7', wbs: '1.1', name: 'Mobilization', costCode: '', phase: 'Mobilization / Admin', plannedHours: 120, planStart: '2026-04-03', planEnd: '2026-04-16' },
  { id: 'JN4E4K', wbs: '1.2', name: 'Demobilization', costCode: 'DMOB-01', phase: 'Mobilization / Admin', plannedHours: 120, planStart: '2026-04-03', planEnd: '2026-04-16' },
  { id: 'K7RYN7', wbs: '1.3', name: 'Shop Drawings, Product Data, & Samples', costCode: '01 33 23', phase: 'Mobilization / Admin', plannedHours: 90, planStart: '2026-04-03', planEnd: '2026-04-16' },
  { id: '7KKF3U', wbs: '1.4', name: 'Temporary Water', costCode: '01 51 36', phase: 'Mobilization / Admin', plannedHours: 10, planStart: '2026-04-03', planEnd: '2026-04-03' },
  { id: 'C7RA3D', wbs: '1.5', name: 'Warranties', costCode: '01 78 36', phase: 'Mobilization / Admin', plannedHours: 8, planStart: '2026-04-03', planEnd: '2026-04-03' },
  { id: '6XH6CT', wbs: '1.6', name: 'Bond Forms', costCode: '00 61 00', phase: 'Mobilization / Admin', plannedHours: 8, planStart: '2026-04-03', planEnd: '2026-04-03' },
  { id: '4HECG8', wbs: '1.7', name: 'Insurance Requirements', costCode: '00 73 16', phase: 'Mobilization / Admin', plannedHours: 8, planStart: '2026-04-03', planEnd: '2026-04-03' },

  // ── Phase 2 — Site Preparation ──────────────────────────────────────────
  { id: 'T3YAA7', wbs: '2.0', name: 'Basement Underground Piping – Materials', costCode: '05 52 13', phase: 'Site Preparation', plannedHours: 8, planStart: '2026-04-20', planEnd: '2026-04-20' },
  { id: 'V7KPA6', wbs: '2.1', name: 'Basement Underground Piping – Labor', costCode: '05 52 13', phase: 'Site Preparation', plannedHours: 100, planStart: '2026-04-21', planEnd: '2026-04-21' },
  { id: 'WG6X8Q', wbs: '2.2', name: 'Contingency Allowances', costCode: '01 21 16', phase: 'Site Preparation', plannedHours: 0, planStart: '2026-04-15', planEnd: '2026-04-15' },
  { id: '4NX4RG', wbs: '2.3', name: 'Change Order', costCode: '', phase: 'Site Preparation', plannedHours: 9, planStart: '2026-04-29', planEnd: '2026-04-29' },

  // ── Phase 3 — Building & Common Area ────────────────────────────────────
  { id: 'B1CA01', wbs: '3.0', name: 'Corridor/Stairwell Drywall Repair & Paint', costCode: '09 29 00', phase: 'Building & Common Area', plannedHours: 120, planStart: '2026-06-10', planEnd: '2026-06-30' },
  { id: 'B1CA02', wbs: '3.1', name: 'Corridor & Exterior Lighting Upgrades', costCode: '26 51 00', phase: 'Building & Common Area', plannedHours: 80, planStart: '2026-06-15', planEnd: '2026-06-26' },
  { id: 'B1CA03', wbs: '3.2', name: 'Exterior Trim Repair & Targeted Paint', costCode: '09 91 00', phase: 'Building & Common Area', plannedHours: 96, planStart: '2026-06-10', planEnd: '2026-06-25' },
  { id: 'B1CA04', wbs: '3.3', name: 'Minor Concrete & Entry Repairs', costCode: '03 30 00', phase: 'Building & Common Area', plannedHours: 40, planStart: '2026-06-10', planEnd: '2026-06-16' },
  { id: 'B1CA05', wbs: '3.4', name: 'Signage & Mail Area Upgrades', costCode: '10 14 00', phase: 'Building & Common Area', plannedHours: 32, planStart: '2026-06-17', planEnd: '2026-06-22' },

  // ── Phase 4 — Unit Interiors: Phase 1 (Units 101–104) ───────────────────
  { id: 'U1D101', wbs: '4.0', name: 'Unit 101 – Demo & Floor Prep', costCode: '02 41 00', phase: 'Unit Interiors: Phase 1', plannedHours: 24, planStart: '2026-06-10', planEnd: '2026-06-12' },
  { id: 'U1F101', wbs: '4.1', name: 'Unit 101 – LVP & Carpet Install', costCode: '09 65 13', phase: 'Unit Interiors: Phase 1', plannedHours: 32, planStart: '2026-06-13', planEnd: '2026-06-18' },
  { id: 'U1P101', wbs: '4.2', name: 'Unit 101 – Paint', costCode: '09 91 00', phase: 'Unit Interiors: Phase 1', plannedHours: 24, planStart: '2026-06-19', planEnd: '2026-06-23' },
  { id: 'U1K101', wbs: '4.3', name: 'Unit 101 – Kitchen Updates', costCode: '11 31 00', phase: 'Unit Interiors: Phase 1', plannedHours: 40, planStart: '2026-06-24', planEnd: '2026-06-30' },
  { id: 'U1B101', wbs: '4.4', name: 'Unit 101 – Bathroom Updates', costCode: '22 40 00', phase: 'Unit Interiors: Phase 1', plannedHours: 32, planStart: '2026-07-01', planEnd: '2026-07-06' },
  { id: 'U1D102', wbs: '4.5', name: 'Unit 102 – Demo & Floor Prep', costCode: '02 41 00', phase: 'Unit Interiors: Phase 1', plannedHours: 24, planStart: '2026-06-13', planEnd: '2026-06-17' },
  { id: 'U1F102', wbs: '4.6', name: 'Unit 102 – LVP & Carpet Install', costCode: '09 65 13', phase: 'Unit Interiors: Phase 1', plannedHours: 32, planStart: '2026-06-18', planEnd: '2026-06-23' },
  { id: 'U1P102', wbs: '4.7', name: 'Unit 102 – Paint', costCode: '09 91 00', phase: 'Unit Interiors: Phase 1', plannedHours: 24, planStart: '2026-06-24', planEnd: '2026-06-26' },
  { id: 'U1K102', wbs: '4.8', name: 'Unit 102 – Kitchen Updates', costCode: '11 31 00', phase: 'Unit Interiors: Phase 1', plannedHours: 40, planStart: '2026-06-27', planEnd: '2026-07-03' },
  { id: 'U1B102', wbs: '4.9', name: 'Unit 102 – Bathroom Updates', costCode: '22 40 00', phase: 'Unit Interiors: Phase 1', plannedHours: 32, planStart: '2026-07-06', planEnd: '2026-07-09' },
  { id: 'U1D103', wbs: '4.10', name: 'Unit 103 – Demo & Floor Prep', costCode: '02 41 00', phase: 'Unit Interiors: Phase 1', plannedHours: 24, planStart: '2026-06-17', planEnd: '2026-06-19' },
  { id: 'U1F103', wbs: '4.11', name: 'Unit 103 – LVP & Carpet Install', costCode: '09 65 13', phase: 'Unit Interiors: Phase 1', plannedHours: 32, planStart: '2026-06-22', planEnd: '2026-06-25' },
  { id: 'U1P103', wbs: '4.12', name: 'Unit 103 – Paint', costCode: '09 91 00', phase: 'Unit Interiors: Phase 1', plannedHours: 24, planStart: '2026-06-26', planEnd: '2026-06-30' },
  { id: 'U1K103', wbs: '4.13', name: 'Unit 103 – Kitchen Updates', costCode: '11 31 00', phase: 'Unit Interiors: Phase 1', plannedHours: 40, planStart: '2026-07-01', planEnd: '2026-07-07' },
  { id: 'U1B103', wbs: '4.14', name: 'Unit 103 – Bathroom Updates', costCode: '22 40 00', phase: 'Unit Interiors: Phase 1', plannedHours: 32, planStart: '2026-07-08', planEnd: '2026-07-13' },
  { id: 'U1D104', wbs: '4.15', name: 'Unit 104 – Demo & Floor Prep', costCode: '02 41 00', phase: 'Unit Interiors: Phase 1', plannedHours: 24, planStart: '2026-06-20', planEnd: '2026-06-24' },
  { id: 'U1F104', wbs: '4.16', name: 'Unit 104 – LVP & Carpet Install', costCode: '09 65 13', phase: 'Unit Interiors: Phase 1', plannedHours: 32, planStart: '2026-06-25', planEnd: '2026-06-30' },
  { id: 'U1P104', wbs: '4.17', name: 'Unit 104 – Paint', costCode: '09 91 00', phase: 'Unit Interiors: Phase 1', plannedHours: 24, planStart: '2026-07-01', planEnd: '2026-07-03' },
  { id: 'U1K104', wbs: '4.18', name: 'Unit 104 – Kitchen Updates', costCode: '11 31 00', phase: 'Unit Interiors: Phase 1', plannedHours: 40, planStart: '2026-07-06', planEnd: '2026-07-10' },
  { id: 'U1B104', wbs: '4.19', name: 'Unit 104 – Bathroom Updates', costCode: '22 40 00', phase: 'Unit Interiors: Phase 1', plannedHours: 32, planStart: '2026-07-13', planEnd: '2026-07-16' },

  // ── Phase 5 — Unit Interiors: Phase 2 (Units 201–204) ───────────────────
  { id: 'U2D201', wbs: '5.0', name: 'Unit 201 – Demo & Floor Prep', costCode: '02 41 00', phase: 'Unit Interiors: Phase 2', plannedHours: 24, planStart: '2026-07-13', planEnd: '2026-07-15' },
  { id: 'U2F201', wbs: '5.1', name: 'Unit 201 – LVP & Carpet Install', costCode: '09 65 13', phase: 'Unit Interiors: Phase 2', plannedHours: 32, planStart: '2026-07-16', planEnd: '2026-07-21' },
  { id: 'U2P201', wbs: '5.2', name: 'Unit 201 – Paint', costCode: '09 91 00', phase: 'Unit Interiors: Phase 2', plannedHours: 24, planStart: '2026-07-22', planEnd: '2026-07-24' },
  { id: 'U2K201', wbs: '5.3', name: 'Unit 201 – Kitchen Updates', costCode: '11 31 00', phase: 'Unit Interiors: Phase 2', plannedHours: 40, planStart: '2026-07-27', planEnd: '2026-07-31' },
  { id: 'U2B201', wbs: '5.4', name: 'Unit 201 – Bathroom Updates', costCode: '22 40 00', phase: 'Unit Interiors: Phase 2', plannedHours: 32, planStart: '2026-08-03', planEnd: '2026-08-06' },
  { id: 'U2D202', wbs: '5.5', name: 'Unit 202 – Demo & Floor Prep', costCode: '02 41 00', phase: 'Unit Interiors: Phase 2', plannedHours: 24, planStart: '2026-07-16', planEnd: '2026-07-18' },
  { id: 'U2F202', wbs: '5.6', name: 'Unit 202 – LVP & Carpet Install', costCode: '09 65 13', phase: 'Unit Interiors: Phase 2', plannedHours: 32, planStart: '2026-07-19', planEnd: '2026-07-24' },
  { id: 'U2P202', wbs: '5.7', name: 'Unit 202 – Paint', costCode: '09 91 00', phase: 'Unit Interiors: Phase 2', plannedHours: 24, planStart: '2026-07-27', planEnd: '2026-07-29' },
  { id: 'U2K202', wbs: '5.8', name: 'Unit 202 – Kitchen Updates', costCode: '11 31 00', phase: 'Unit Interiors: Phase 2', plannedHours: 40, planStart: '2026-07-30', planEnd: '2026-08-05' },
  { id: 'U2B202', wbs: '5.9', name: 'Unit 202 – Bathroom Updates', costCode: '22 40 00', phase: 'Unit Interiors: Phase 2', plannedHours: 32, planStart: '2026-08-06', planEnd: '2026-08-11' },
  { id: 'U2D203', wbs: '5.10', name: 'Unit 203 – Demo & Floor Prep', costCode: '02 41 00', phase: 'Unit Interiors: Phase 2', plannedHours: 24, planStart: '2026-07-20', planEnd: '2026-07-22' },
  { id: 'U2F203', wbs: '5.11', name: 'Unit 203 – LVP & Carpet Install', costCode: '09 65 13', phase: 'Unit Interiors: Phase 2', plannedHours: 32, planStart: '2026-07-23', planEnd: '2026-07-28' },
  { id: 'U2P203', wbs: '5.12', name: 'Unit 203 – Paint', costCode: '09 91 00', phase: 'Unit Interiors: Phase 2', plannedHours: 24, planStart: '2026-07-29', planEnd: '2026-07-31' },
  { id: 'U2K203', wbs: '5.13', name: 'Unit 203 – Kitchen Updates', costCode: '11 31 00', phase: 'Unit Interiors: Phase 2', plannedHours: 40, planStart: '2026-08-03', planEnd: '2026-08-07' },
  { id: 'U2B203', wbs: '5.14', name: 'Unit 203 – Bathroom Updates', costCode: '22 40 00', phase: 'Unit Interiors: Phase 2', plannedHours: 32, planStart: '2026-08-10', planEnd: '2026-08-13' },
  { id: 'U2D204', wbs: '5.15', name: 'Unit 204 – Demo & Floor Prep', costCode: '02 41 00', phase: 'Unit Interiors: Phase 2', plannedHours: 24, planStart: '2026-07-24', planEnd: '2026-07-28' },
  { id: 'U2F204', wbs: '5.16', name: 'Unit 204 – LVP & Carpet Install', costCode: '09 65 13', phase: 'Unit Interiors: Phase 2', plannedHours: 32, planStart: '2026-07-29', planEnd: '2026-08-03' },
  { id: 'U2P204', wbs: '5.17', name: 'Unit 204 – Paint', costCode: '09 91 00', phase: 'Unit Interiors: Phase 2', plannedHours: 24, planStart: '2026-08-04', planEnd: '2026-08-06' },
  { id: 'U2K204', wbs: '5.18', name: 'Unit 204 – Kitchen Updates', costCode: '11 31 00', phase: 'Unit Interiors: Phase 2', plannedHours: 40, planStart: '2026-08-07', planEnd: '2026-08-13' },
  { id: 'U2B204', wbs: '5.19', name: 'Unit 204 – Bathroom Updates', costCode: '22 40 00', phase: 'Unit Interiors: Phase 2', plannedHours: 32, planStart: '2026-08-14', planEnd: '2026-08-19' },

  // ── Phase 6 — Final & Closeout ──────────────────────────────────────────
  { id: 'FC001', wbs: '6.0', name: 'Substantial Completion – All 8 Units', costCode: '01 77 00', phase: 'Final & Closeout', plannedHours: 24, planStart: '2026-09-21', planEnd: '2026-09-25' },
  { id: 'FC002', wbs: '6.1', name: 'Punch List – Units 101–104', costCode: '01 77 00', phase: 'Final & Closeout', plannedHours: 40, planStart: '2026-09-21', planEnd: '2026-09-25' },
  { id: 'FC003', wbs: '6.2', name: 'Punch List – Units 201–204', costCode: '01 77 00', phase: 'Final & Closeout', plannedHours: 40, planStart: '2026-09-21', planEnd: '2026-09-25' },
  { id: 'FC004', wbs: '6.3', name: 'Punch List – Common Areas', costCode: '01 77 00', phase: 'Final & Closeout', plannedHours: 24, planStart: '2026-09-21', planEnd: '2026-09-23' },
  { id: 'FC005', wbs: '6.4', name: 'Warranty & Closeout Documentation', costCode: '01 78 00', phase: 'Final & Closeout', plannedHours: 16, planStart: '2026-09-28', planEnd: '2026-09-29' },
  { id: 'FC006', wbs: '6.5', name: 'Final Unconditional Lien Waivers', costCode: '01 26 00', phase: 'Final & Closeout', plannedHours: 8, planStart: '2026-09-30', planEnd: '2026-09-30' },
  { id: 'FC007', wbs: '6.6', name: 'Final Completion & Retainage Release', costCode: '01 29 00', phase: 'Final & Closeout', plannedHours: 8, planStart: '2026-10-14', planEnd: '2026-10-14' },
];
