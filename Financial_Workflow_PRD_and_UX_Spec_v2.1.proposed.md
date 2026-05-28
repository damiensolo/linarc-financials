**

# PRD & UX Spec: Progressive Financial Workflow (v2.1)

Revision Note (v2): This revision replaces the rigid lock-everything-before-you-move-forward model with a progressive, draft-friendly workflow. Budget work can now begin as soon as a Prime Contract Value exists (uploaded or manually entered), and commitment happens at the line-item level rather than at the budget level. This matches how General Contractors actually work during buyout — building budget detail in parallel with vendor negotiation, partial information, and pending confirmations.

Revision Note (v2.1 — prototype alignment): This revision documents the implemented prototype behavior as of May 2026, including: separate Prime Contract and Budget data stores, a unified 3-column Prime Contract line-item table (upload and manual entry), an optional budget-seed prompt when entering Budget Setup, the full budget column set with formula-driven Overhead/Profit, contract-sum reconciliation warnings, and Step 4 tab naming (SOV Mapping / Schedule Linking).

Implementation status: SpreadsheetV4 is the canonical financial setup surface. Steps 1–5, cross-cutting approval/change-order stubs, localStorage persistence, and readiness gating are implemented as a frontend prototype (mock extraction, mock approvals, stub Excel import).

---

## 1. Summary

Objective: Evolve Linarc's Financial Setup Workflow from a hard-gated, lock-everything-to-proceed model into a progressive, state-aware setup experience that lets users make forward progress with partial information while preserving the financial controls and audit trail that real construction accounting requires.

Problem with v1: The current workflow forces users to fully lock the Prime Contract before they can touch the budget, and forces the entire budget to be locked before any downstream work (SOV, schedule, subcontract issuance) can begin. User research surfaced that:

- Users are afraid to lock — "what if I forgot something?" — and stall the setup.
    
- Real buyout workflows require working on a budget while still negotiating the contract value, awaiting insurance/W-9/bond documents, or waiting for owner confirmation on subs.
    
- A single hard gate blocks an entire team while one piece of information is outstanding.
    

Solution (v2): A progressive commitment model where:

1. Entering the Prime Contract Value (via upload or manual entry) — not locking the contract — unlocks the budget tool.
    
2. Budget line items can be committed individually, becoming legally and operationally "live" without requiring the entire budget to be finalized.
    
3. Committed line items unlock all four downstream activities for that line: subcontract issuance, SOV inclusion, invoicing/pay apps, and schedule linking.
    
4. A final Publish SOV step still anchors the formal owner-facing handover, preserving the ceremony that closes out setup.
    
5. Approval workflows — both an existing Prime Contract (PC) Value change workflow and a new optional per-line approval — protect the financial controls that progressive commitment would otherwise compromise.

Solution (v2.1 additions):

6. Prime Contract line items and Budget line items are stored separately. Step 2 maintains a simple contract baseline table; Step 3 maintains the full project budget grid.
    
7. When the user first enters Budget Setup (or returns with an empty budget), the system optionally offers to seed the budget from Prime Contract line items — only if Prime Contract rows contain data.
    

---

## 2. Product Requirements (PRD)

### 2.0 Progressive Five-Step Workflow

  

STEP 1: Preliminary Configuration                       

         Retainage, Overhead, Billing, "Allow Multiple Pay Apps" toggle       

         NEW: Per-Line Approval Workflow toggle                               

         NEW: Cost Code Enforcement (Budget & Schedule)                       

         NEW: Approval Routing (GC → PE → Owner) for PC Value changes         

            ↓ CONFIRM ↓                                                       

STEP 2: Prime Contract Setup  (DUAL MODE)                   

         Mode A — Automatic: Upload PDF/DOCX/TXT/MD → extract value + line items

         Mode B — Manual:    Enter PC Value + minimum metadata directly       

         Both modes land on the same Review & Edit screen with:

           • Contract metadata bar (dates, sum, owner, contractor)

           • Unified Prime Contract line-item table (see §2.3 Req 2)

         > Creates OPEN PRIME CONTRACT (editable, replaceable any time)      

         Optional explicit "Lock Prime Contract" action                       

            ↓ PC VALUE ENTERED ↓ (this is the budget unlock trigger)          

STEP 3: Progressive Budget Setup                    

         Available the moment a PC Value exists                               

         On first entry (or return with empty budget): optional seed prompt   

           if Prime Contract line items exist (see §2.3 Req 3)                

         Add line items manually OR import (Excel stub in prototype)          

         Cost codes required per line when enforcement is confirmed in Step 1

         Per-line states:  OPEN  >  [PENDING APPROVAL]  >  COMMITTED (Locked) 

         Optional "Lock Budget" bulk action commits all open lines at once    

            ↓ AS LINES ARE COMMITTED ↓          

STEP 4: Continuous Operations  (per committed line, no phase gate)    

         Tab 1: SOV Mapping  |  Tab 2: Schedule Linking                     

         Each committed line unlocks:                                           

           ▸ Subcontract / PO issuance against the line                       

           ▸ SOV inclusion for owner billing                                  

           ▸ Invoice & Pay App processing                                     

           ▸ Schedule WBS linking for milestone billing                       

         Bulk "Map all" / "Link all" actions available per tab (prototype)    

            ↓ READINESS CHECK PASSES ↓                                        

STEP 5: Publish SOV  (formal owner-facing handover)                  

         Readiness checklist must be satisfied                                

         Unmet checks link back to Step 4 with the relevant tab pre-selected  

         Publishes finalized SOV to Owner                                     

            ↓ PUBLISH ↓                                                       

OUTCOME: Project "Financially Activated" → Financial Operations Hub         

  
  

CROSS-CUTTING WORKFLOWS:

  ▸ Change to PC Value (after any line committed) → GC/PE/Owner Approval flow

  ▸ Edit to a Committed Line → Change Order required (no direct edit)

  ▸ Per-Line Approval enabled? → Fires on Commit action, before lock takes effect

  ▸ Prime Contract line total ≠ Contract Sum metadata → inline warning (Step 2)

  ▸ Budget total ≠ Prime Contract Value → inline warning (Step 3)

  

### 2.1 Target Audience

- General Contractors (GCs): Project Managers, Finance Admins, Project Executives.
    
- Subcontractors (SCs) & Owners: We start with GC & SC mapping; note that owners often use consultants whose flows also need mapping.
    
- New roles introduced by approval workflows: Project Executive (approver of PC Value changes), Owner (final approver where contractually required).
    

### 2.2 State Vocabulary (new — critical for v2)

The widget must consistently use and visually distinguish these states. All in-product copy, badges, and tracking logic depend on this vocabulary.

|   |   |   |   |   |
|---|---|---|---|---|
|Entity|State|Meaning|Editable?|Triggers Approval?|
|Prime Contract|Open|PC Value entered, contract not yet locked|Yes, freely|No|
|Prime Contract|Locked|Explicitly locked by user as baseline|No, only editable through a Change Order flow.|Yes, if committed lines exist|
|Budget Line|Open|Created or imported, not yet committed|Yes, freely|No|
|Budget Line|Pending Approval|Commit requested, awaiting approval (only if per-line approval is enabled)|No|Currently in flow|
|Budget Line|Locked / Committed|Locked at line level, fully operational for subs / SOV / invoicing / schedule. UI badge: "Committed".|No, changes require Change Order|No (already through)|
|Budget (Whole)|Mixed State|Default; mixed state of open and committed lines|Per line|Per line|
|Budget (Whole)|Locked|Bulk action committed all remaining draft lines|No, line-by-line Change Order required.|Already through|

Data stores (v2.1):

| Store|Sheet ID|Purpose|
|---|---|---|
|Prime Contract lines|`sheet-prime-contract`|Step 2 baseline — Cost Code, Contract Line, Contract Value only|
|Project Budget lines|`sheet-budget`|Step 3 full budget grid with cost breakdown and formulas|

### 2.3 Functional Requirements

#### Requirement 1: Step 1 — Preliminary Configuration

The workflow must capture global financial settings before any contract or budget work begins. v2 adds three new settings.

Existing fields (preserved):

- Default Retainage (e.g., 10%)
    
- Default Overhead (e.g., 5%) — also drives the Overhead formula column in the budget grid
    
- Billing Dates (cycle and cutoff)
    
- "Allow multiple pay apps for the same month" toggle
    

New fields (v2):

- Per-Line-Item Approval Workflow (toggle): When enabled, every budget line commit requires approval before it locks. When disabled (default), commits are immediate.
    
- Approval Routing (when per-line approval is enabled, and always for PC Value changes): Configure the approval chain — typically GC → Project Executive → Owner — including whether all are required or any single approver suffices.
    
- Cost Code Enforcement: Cost codes are mandatory on every budget line item. Enforcement for schedule activities will occur strictly for automation or when users manually allocate a budget line to a schedule activity. This is hardwired in v2 to enable budget-to-schedule auto-allocation. Surface as a confirmation rather than an optional toggle.
    

Why these matter: The existing system's hidden "multiple pay apps" setting permanently broke downstream flows. v2 surfaces all new control gates explicitly here so users never get stuck later.

#### Requirement 2: Step 2 — Prime Contract Setup (Dual Mode)

Goal: Get a usable Prime Contract Value into the system as quickly as possible, by whatever path matches the user's reality.

Entry sub-phases (v2.1):

1. **Choose** — User selects Upload Document or Enter Manually (or continues editing a saved contract).
2. **Review** — Contract metadata bar + Prime Contract line-item table. Primary CTA: "Continue to Budget Setup" (enabled when PC Value > 0). Secondary: optional "Lock Prime Contract".

Mode A — Automatic (Upload):

- User uploads PDF, DOCX, TXT, or MD.
    
- Extraction (regex/demo in prototype; AI-assisted in production target) pulls metadata (executed date, construction start, completion date, contract sum, owner, contractor, project name) and any extractable line items.
    
- User lands on the Review & Edit screen with extracted data ready to inspect and adjust.
    
- Extracted line items populate the **Prime Contract line-item table** (not the budget grid directly).
    

Mode B — Manual:

- User enters the Prime Contract Value (sum) plus the minimum required metadata fields (project name, contractor, owner, executed date — owner and contractor may be drawn from project setup if available).
    
- No document required. The system creates an Open Prime Contract record with this value.
    
- User lands on the same Review & Edit screen with an **empty Prime Contract line-item table** (one blank row).
    
- User can upload a contract document later from the choice screen, which re-enters Mode A flow (re-extracts, gives the user the option to merge or replace).
    

Unified Prime Contract line-item table (v2.1 — both modes):

Both upload and manual entry use the **same table structure** on the Review & Edit screen:

| Column | Field | Notes |
|---|---|---|
| *(index)* | Row number | Sticky index column; shows row number, reveals checkbox on hover (same pattern as main spreadsheet) |
| Cost Code | `costCode` | Text, editable while contract is open |
| Contract Line | `name` | Text, editable while contract is open |
| Contract Value | `contractValue` | Currency, right-aligned; footer shows whole-dollar total |

- Add row / delete selected rows available while contract is open.
- Footer total sums Contract Value column.
- **Contract sum reconciliation:** If the sum of line-item Contract Values differs from the Contract Sum in the metadata bar, show an amber warning banner. User should adjust lines or update the contract sum.

Open Prime Contract behavior:

- Editable freely: contract value, dates, metadata, prime contract line items.
    
- Replaceable: user can return to the Choose screen and upload a different contract file at any point before lock.
    
- Critically, entering a Prime Contract Value — in either mode — unlocks the Budget tool (Step 3). Locking is not required.
    

Optional Explicit Lock:

- User may choose to "Lock Prime Contract" when they're confident the baseline is final.
    
- Locked = no direct edits possible; the contract is the authoritative baseline.
    
- Once locked, only change orders can modify total PC value. No direct edits are allowed.
    
- Locking is not a gate for moving forward. It is a user-controlled hardening action.
    

Widget messaging requirements:

- When PC Value is entered but contract is unlocked: "Prime Contract is open. Refine line items or lock as baseline — budget setup is already available."
    
- When contract is locked: "Contract locked as baseline. Budget setup is available."
    

#### Requirement 3: Step 3 — Progressive Budget Setup

The core new mechanic of v2. The budget is no longer a single object that locks all at once. It is a collection of line items, each with its own state.

Entry to budget tool:

- Available as soon as a Prime Contract Value exists. No lock required.
    
- Widget surfaces: "Budget is in open. You can lock individual line items as they're finalized, or lock the whole budget when ready."
    

Budget seed prompt (v2.1):

When the user navigates to Step 3 — via "Continue to Budget Setup" or by selecting Budget Setup in the tracker — and **both** of the following are true:

1. The budget table has no meaningful data (empty or all-blank rows), and
2. The Prime Contract line-item table has at least one row with data,

Then show a modal:

> "Create budget from Prime Contract? Your budget table is empty. Would you like to use {N} Prime Contract line(s) as the starting point?"

- **Yes — use Prime Contract data:** Seed budget rows with the following mapping:
  - Prime `costCode` → Budget `costCode`
  - Prime `name` (Contract Line) → Budget `name` (Description column label)
  - Prime `contractValue` → Budget `budget` and `revisedBudget`
  - Labor, Material, Equipment, Subcontractor, Others → `0`
- **No — start with a blank row:** Initialize budget with one empty open row.

If the Prime Contract table has **no line data**, the prompt is **not shown**; the budget initializes with one blank row.

The prompt re-appears if the user returns to Step 3 later with an empty budget and populated prime contract lines (once per visit until answered).

Populating the budget (beyond seed):

- Manual entry: Users click into a spreadsheet-style grid and fill in line items inline. Single-click-to-type.
    
- Import: Excel (.xlsx) import affordance present in prototype as stub. PDF import planned for a later phase. Primavera P6 and Microsoft Project (.mpp) formats reserved for schedule imports only. Imported lines arrive in Open state.
    

Budget grid columns (v2.1 — implemented):

| Column | Type | Editable | Notes |
|---|---|---|---|
| *(index)* | — | — | Row number + hover checkbox |
| Status | badge | — | Open / Pending / Committed |
| Cost Code | text | Yes | Required when cost code enforcement confirmed |
| Description | text | Yes | Seeded from Prime Contract Line |
| Location | text | Yes | |
| Quantity | number | Yes | Right-aligned |
| UOM | text | Yes | |
| Effort hours | number | Yes | Right-aligned; summed in footer |
| Budget | currency | Yes | Primary line total; seeded from Contract Value |
| Revised Budget | currency | Yes | |
| Labor | currency | Yes | Starts at 0 when seeded |
| Material | currency | Yes | Starts at 0 when seeded |
| Equipment | currency | Yes | Starts at 0 when seeded |
| Subcontractor | currency | Yes | Starts at 0 when seeded |
| Others | currency | Yes | Starts at 0 when seeded |
| Overhead | formula | No | `= budget × default overhead %` from Step 1 |
| Profit | formula | No | `= budget − labor − material − equipment − subcontractor − others − overhead` |

Header context (v2.1):

- Display **Prime Contract Value** from metadata in the budget toolbar/header.
- When budget rows exist, also show **Budget total** (sum of Budget column).
- If both totals are non-zero and differ, show an amber reconciliation warning.

Required fields per line item (Open state):

- Description (Contract Line label in prime contract; "Description" in budget)
    
- Cost Code (required when cost code enforcement is confirmed in Step 1)
    
- Budget (primary line amount — not auto-calculated from cost categories)
    
- Quantity, UOM, Effort hours, Location — optional in open/draft posture
    
- Labor, Material, Equipment, Subcontractor, Others — cost breakdown; default 0 when seeded
    
- Overhead, Profit — formula-driven from Budget and breakdown
    
- For line items assigned to a Trade (not the GC), entry is restricted to Sub-contract & Material amounts only. *(Reserved — not enforced in prototype)*
    

The "Commit Line Item" action:

This is the central new control. Each row in the budget grid has a per-row commit action.

- What committing a line does:
    

- If per-line approval is disabled (default): the line is locked immediately. State becomes Committed (Locked).
    
- If per-line approval is enabled: state becomes Pending Approval; routing fires to the configured approval chain. On approval, state becomes Committed. On rejection, state returns to Open with a reason captured.
    
- Once Committed, the line is locked. The user cannot edit the line directly. Any subsequent change requires a Change Order (existing change order flow, now triggerable at line granularity).
    

- What committing a line unlocks for that line (and only that line):
    

- Commitment Contracts: subcontracts and POs can now be issued against this budget line.
    
- SOV Inclusion: this line can be mapped into the owner-facing SOV. Line items can be added to the SOV until it is formally issued; subsequent changes require a formal Revision process.
    
- Invoicing & Pay Apps: Subcontractor (SC) can issue a deposit pay application. However, General Contractor (GC) Pay Apps to the Owner are blocked until both the Prime Contract and the entire Budget are Locked and the SOV is Issued, ensuring financial control.
    
- Schedule Linking: this line can be linked to WBS activities for milestone-based billing.
    

Bulk "Lock Budget" action:

- Optional, user-initiated.
    
- Locking the budget commits all remaining Open line items at once.
    
- If per-line approval is enabled, this fires the approval workflow for every Open line in a single batch.
    
- Useful for teams that prefer the v1-style "finalize everything together" pattern.
    

Widget messaging requirements:

- Per-line status badges (Open / Pending Approval / Committed) must be visible at all times in the grid.
    
- A line-level Change Order indicator appears on Committed lines, with a "Request Change Order" affordance.
    
- Bulk progress indicator at top of grid: "12 of 18 lines committed. 4 open, 2 pending approval."
    

#### Requirement 4: Step 4 — Continuous Operations (replaces v1 Steps 4 & 5)

In v1, SOV Review and Schedule Linking were a parallel "phase" gated by full budget lock. In v2, these activities become continuous operations that flow as line items are committed.

Behavior:

- A dual-tab workspace: **Tab 1: SOV Mapping | Tab 2: Schedule Linking** — available once at least one budget line is committed.
    
- Only Committed budget lines appear as eligible for SOV mapping and schedule linking.
    
- Open and Pending lines are listed separately as "not yet available."
    
- Users move freely between budget work (Step 3) and operations (Step 4) — they are not sequential phases but parallel activities.
    
- **Bulk actions (prototype):** "Map all" on SOV Mapping tab; "Link all" on Schedule Linking tab (uses cost-code suggestions where available).
    
- Step 5 readiness items and Blockers Rail link to Step 4 with the correct tab pre-selected (SOV vs Schedule).
    

Cross-Impact Alerts (preserved from v1):

- "4 committed lines are not yet mapped to SOV."
    
- "6 committed lines have no WBS link — milestone billing not configured for these lines."
    
- "Subcontract issued against Line 12 — readiness for SOV mapping recommended."
    

Cost Code Auto-Allocation (v2 addition):

- Because cost codes are now mandatory on both budget lines and schedule activities, the system pre-suggests budget-to-schedule mappings based on matching cost codes.
    
- Users can accept, override, or refine the suggested links.
    

#### Requirement 5: Step 5 — Publish SOV (Owner Handover Anchor)

This step is preserved from v1 in spirit but is no longer the gate for downstream operations. Subcontracts, invoicing, and schedule linking can already be active. Publish SOV is specifically the act of finalizing the owner-facing billing schedule.

Readiness checklist (must all pass):

- A minimum threshold of budget lines committed (configurable; default 100%, but project-specific overrides allowed).
    
- All committed lines have at least one SOV mapping.
    
- All committed lines have a WBS link (if milestone billing is in use).
    
- No outstanding Pending Approval lines.
    
- No outstanding PC Value change approvals.
    

Each unmet check is clickable — navigates to Step 4 (SOV Mapping or Schedule Linking tab as appropriate) or the relevant setup step.

Action:

- "Publish SOV" finalizes the owner-facing document.
    
- Triggers project state change to "Financially Activated."
    
- Widget collapses, user is moved to the Financial Operations Hub for ongoing project life.
    

### 2.4 Cross-Cutting Workflows

#### Workflow A: Prime Contract Value Change Approval

Trigger: Any change to the Prime Contract Value after a commitment contract has been issued against at least one budget line.

Why: Once a budget line is committed, it is operationally live — subs may be contracted, invoices may be in flight. Changing the underlying PC Value at this point has downstream financial impact (cost variance, owner reporting, retainage calculations) and must be controlled.

Flow:

1. User attempts to change PC Value.
    
2. System detects committed lines exist; routes change to approval chain configured in Step 1 (typically GC → PE → Owner).
    
3. Once locked, changes to the PC Value must only be done via the Change Order flow.
    
4. Approvers receive notification with: proposed new value, delta from current, list of committed lines that may be affected.
    
5. On approval: new PC Value takes effect. System logs an audit entry.
    
6. On rejection: PC Value remains unchanged. Reason captured.
    

Edge case: If no budget lines are committed yet, PC Value changes happen without approval (the contract is still in draft posture relative to operations).

#### Workflow B: Change Order on Committed Line Items

Trigger: User wants to alter any field on a Committed budget line item.

Behavior:

- Direct edit is blocked. The "Request Change Order" affordance appears in place of the edit cursor.
    
- Existing Change Order flow is invoked at line granularity.
    
- Approved Change Orders update the line; the change is logged in the line's history.
    

Important: This is the same logical control as a Change Order at the contract level — it just operates at the line.

#### Workflow C: Per-Line Approval (optional)

Trigger: User commits an Open budget line item when the Per-Line-Item Approval Workflow setting is enabled.

Flow:

1. User clicks "Commit" on an Open line.
    
2. Line enters Pending Approval state.
    
3. Approvers receive notification with line details (cost code, value, allocations).
    
4. On approval: line becomes Committed, downstream capabilities unlock.
    
5. On rejection: line returns to Open, with reason visible in line history.
    

Why optional: Smaller GCs may not need per-line approval; enterprise GCs may require it for audit / financial control reasons.

#### Workflow D: Prime Contract → Budget Handoff (v2.1)

Trigger: User enters Step 3 with empty budget and populated Prime Contract lines.

Behavior: See Budget seed prompt in Requirement 3. This is optional — user may decline and build the budget manually or via import.

Validation:

- Step 2 warns when sum(Contract Value lines) ≠ Contract Sum metadata.
- Step 3 warns when sum(Budget column) ≠ Prime Contract Value metadata.

---

## 3. UX Specification

### 3.1 Core Design Principles

1. Progressive Trust: Every action should feel reversible until explicitly committed. Saving, editing, and uploading do not commit users to anything legally or financially. Commit is always explicit and clearly framed.
    
2. State Transparency: The UI must, at every moment, make clear what is Draft, what is Pending, and what is Committed/Locked. Users should never wonder "is this safe to change?"
    
3. Granular Commitment: Commit at the smallest meaningful unit — the budget line. Avoid forcing users to commit larger objects (whole budget, whole contract) when their work is genuinely partial.
    
4. Actionable Blockers (preserved from v1): Never show a grayed-out button without an explanation and a path forward. Every disabled action must include a "Blocker Panel" explaining what's missing and how to resolve it.
    
5. Role-Awareness (preserved from v1): Display "Owned By" badges and surface approval roles where relevant. Multi-role enterprise workflows must be supported throughout.
    

### 3.2 Information Architecture & Layouts

#### Screen A: Financial Setup Hub (Steps 1, 2, 3, 5)

The default workspace until Publish SOV activates the project.

- Left Panel — Persistent Setup Tracker Widget (collapsible)  
      
    

- Five steps shown vertically with explicit state indicators.
    
- State icons: Complete (green check), In Progress (blue dot), Available (white circle), Blocked (gray padlock with reason on hover).
    
- Step 3 (Budget) shows progress sub-text: "12 of 18 lines committed."
    
- Step 4 is shown but framed as continuous: "Operations available — 12 lines live."
    

- Center Workspace — Active Step Detail Card  
      
    

- Step 1 (Preliminary Config): Global financial settings form including the three new v2 toggles.
    
- Step 2 (Prime Contract):
  - **Choose phase:** Upload Document | Enter Manually cards; option to continue editing saved contract.
  - **Review phase:** Contract metadata bar + unified 3-column Prime Contract table (Cost Code, Contract Line, Contract Value) with index/hover-checkbox column. Step header actions: optional "Lock Prime Contract" + primary "Continue to Budget Setup" (requires PC Value > 0).
    
- Step 3 (Budget Setup):
  - Optional seed modal on entry when budget empty and prime lines exist.
  - Full budget grid (see §2.3 Req 3 columns) with index/hover-checkbox, status badges, per-row Commit, footer totals.
  - Toolbar shows Prime Contract Value, budget total, commit progress; amber warning if totals diverge.
  - Bulk "Lock Budget" as secondary action.
    
- Step 5 (Publish SOV): Final readiness summary card listing all checks. Each unmet check is a hyperlink back to the source (e.g., "4 lines not mapped" → opens Step 4 SOV Mapping tab; WBS failures → Schedule Linking tab).
    

- Right Panel — Blockers & Readiness Rail (collapsible)  
      
    

- Live-updating list of unmet dependencies.
    
- Now state-aware: "Subcontract issuance for Line 7 is blocked because Line 7 is in Open. Commit Line 7 to enable."
    
- Includes pending approvals: "Line 12 awaiting approval from Jane Doe (Project Executive)."
    
- Publish readiness checks include actionable hints (e.g., "Step 4 → Schedule Linking tab, then Link all or link each line").
    

#### Screen B: Continuous Operations Workspace (Step 4)

Available as soon as any budget line is Committed.

- Top Navigation: **Tab 1: SOV Mapping | Tab 2: Schedule Linking**
    
- Primary Work Area: Per-line Map/Link actions for committed rows; open rows shown as not yet eligible. Bulk Map all / Link all in tab header when unmapped/unlinked lines remain.
    
- Cross-Impact Alerts: Persistent, lightweight callouts showing readiness gaps.
    
- Sticky Footer: "Open Step 5 — Publish SOV" link, with a live readiness indicator. No master "Lock & Publish" button is required to do daily work here — that button is reserved for the Publish step.
    

### 3.3 Micro-Interactions & System Feedback

- Budget Seed Prompt (v2.1): Modal on Step 3 entry when budget is empty and prime contract lines exist. Two clear choices; no seed option if prime table is empty.
    
- Commit Confirmation Dialog (new): Clicking "Commit" on a budget line opens a confirmation modal: "Committing Line 12 ($45,000) will lock it for direct edits. Changes will require a Change Order. This will also enable subcontract issuance, SOV mapping, invoicing, and schedule linking for this line. Continue?"
    
- Per-Line Approval Indicator (new): Lines in Pending Approval show an inline badge with the approver's name and a "View Request" affordance.
    
- Change Order Trigger (new): Attempting to edit a Committed line surfaces an inline message: "This line is committed. To change it, request a Change Order." with a one-click "Request Change Order" button.
    
- PC Value Change Approval (new): Attempting to change a PC Value when committed lines exist surfaces a modal: "Changing the Prime Contract Value will require approval from [routing chain]. The current value remains in effect until approved. Continue?"
    
- Contract Sum Reconciliation (v2.1): Amber banner on Step 2 when line totals ≠ metadata Contract Sum.
    
- Budget vs PC Reconciliation (v2.1): Amber banner on Step 3 when budget total ≠ metadata Prime Contract Value.
    
- Auto-Save & Nav Warnings (preserved): Unsaved changes intercepted with confirmation on back-navigation. *(localStorage persistence in prototype)*
    
- Linking Feedback (preserved): Visual "Linked" badge appears instantly when budget allocates to schedule.
    
- System Notifications (preserved + extended): Approval flows trigger role-based email/in-app notifications. Locking a Prime Contract still notifies stakeholders. Per-line commits do not trigger broad notifications by default (would be noisy); approvers are notified individually.
    

### 3.4 Widget Messaging Map

The user explicitly called out that the widget must clearly communicate state and consequences at every step. The following messages are required copy that must appear in the appropriate context.

|   |   |
|---|---|
|Context|Message|
|Step 2 — PC Value entered, contract unlocked|"Prime Contract is open. Refine line items or lock as baseline — budget setup is already available."|
|Step 2 — Contract locked|"Contract locked as baseline. Budget setup is available."|
|Step 2 — Line total ≠ Contract Sum|"Line item total ($X) does not match the Contract Sum ($Y). Adjust line values or update the contract sum."|
|Step 3 — Budget seed prompt (prime lines exist)|"Create budget from Prime Contract? … Would you like to use {N} Prime Contract line(s) as the starting point?"|
|Step 3 — Budget unlocked, no lines yet|"Budget is in open. Add line items manually or import from Excel to get started."|
|Step 3 — Budget total ≠ PC Value|"Budget total ($X) does not match the Prime Contract Value ($Y)."|
|Step 3 — Mix of Open and Committed lines|"{X} of {Y} lines committed. Committed lines are now live for subcontracts, SOV, invoicing, and schedule linking. Open lines are still editable."|
|Step 3 — Per-line approval enabled|"Per-line approval is on for this project. Each commit will be routed to your approval chain before it locks."|
|Step 3 — Attempting to edit Committed line|"This line is committed. To change it, request a Change Order."|
|Step 4 — Operations workspace, mixed state|"Showing {N} committed lines available for SOV mapping and schedule linking. Open lines will appear here when committed."|
|Step 5 — Readiness unmet (SOV)|"{N} committed line(s) not mapped to SOV — click to open SOV Mapping"|
|Step 5 — Readiness unmet (WBS)|"{N} committed line(s) missing WBS links — click to open Schedule Linking"|
|Step 5 — Ready|"All readiness checks passed. Publishing the SOV will finalize the owner-facing billing schedule and activate the project."|

---

## 4. What Changed from v1 (Summary)

For engineering and design reviewing the diff:

|   |   |   |
|---|---|---|
|Area|v1|v2 / v2.1|
|Step count|6 (Steps 0–6)|5 (Steps 1–5)|
|Budget unlock trigger|Prime Contract must be locked|Prime Contract Value must be entered (lock optional)|
|Prime Contract entry|Upload only (Mode A)|Upload or manual value entry (Modes A & B)|
|Prime Contract line items|Mixed with budget / inconsistent by path|Separate store; unified 3-column table (Cost Code, Contract Line, Contract Value) for both modes|
|Budget seed from PC|Auto-populated on upload (implicit)|Optional prompt on Step 3 entry; maps to full budget grid; skippable|
|Budget columns|Total Budget auto-sum of categories|Budget is primary line total; Overhead/Profit formulas; full column set incl. Location, Revised Budget|
|Budget commit model|Whole budget locked at once|Per-line commit; optional bulk "Lock Budget" preserved|
|Line edit after commit|Direct edits allowed before lock; blocked after|Direct edits blocked once committed; Change Order required|
|SOV & Schedule|Phase-gated; required full budget lock|Continuous; available per committed line; tabs: SOV Mapping / Schedule Linking|
|Publish SOV|Final step gate for activation|Preserved as final handover anchor; checks link to Step 4 tabs|
|Approval workflows|None at line level|New: PC Value change approval; optional per-line approval|
|Cost codes|Configurable|Enforced when confirmed in Step 1 (inline flag on missing codes)|
|Import support|Not specified|Excel stub in prototype (P6/MPP reserved for schedule)|
|Reconciliation|Not specified|PC line total vs Contract Sum; Budget total vs PC Value|
|State vocabulary|Implicit (locked/unlocked)|Explicit (Open / Pending Approval / Committed / Locked)|
|Row selection UI|Separate checkbox column|Index column with hover checkbox (spreadsheet pattern)|

  
  
