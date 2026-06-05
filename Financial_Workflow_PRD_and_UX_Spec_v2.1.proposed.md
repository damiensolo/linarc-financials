**

# PRD & UX Spec: Progressive Financial Workflow (v2.3)

Revision Note (v2): This revision replaces the rigid lock-everything-before-you-move-forward model with a progressive, draft-friendly workflow. Budget work can now begin as soon as a Prime Contract Value exists (uploaded or manually entered), and commitment happens at the line-item level rather than at the budget level. This matches how General Contractors actually work during buyout — building budget detail in parallel with vendor negotiation, partial information, and pending confirmations.

Revision Note (v2.1 — prototype alignment): This revision documents the implemented prototype behavior as of May 2026, including: separate Prime Contract and Budget data stores, a unified Prime Contract line-item table (upload and manual entry), the full budget column set with formula-driven Overhead/Profit, contract-sum reconciliation warnings, and Step 4 tab naming (SOV Mapping / Schedule Linking).

Revision Note (v2.2 — Prime Contract without cost codes; Budget dual-mode upload): Two product changes supersede earlier v2.1 behavior:

1. **Prime Contract line items carry no cost code.** The Prime Contract is the owner-facing baseline and is not the place to capture the GC's internal CSI cost structure. The Prime Contract table is now two columns — Contract Line and Contract Value. Cost codes remain a Budget-only concept (enforced on budget lines, the connector to the schedule).

2. **Budget Setup is dual-mode (Upload or Manual), mirroring Prime Contract Setup.** A budget can be built by uploading an **Excel (.xlsx), CSV, or PDF** file (parsed into reviewable line items) or by entering lines manually. Budgets are **not automatically** seeded from the Prime Contract (the old auto-seed prompt is removed), but a third **"From Prime Contract"** option is offered on the choice screen as a manual, testing convenience — it copies Prime Contract line items into budget rows and auto-derives cost codes (CSI) since the contract carries none.

3. **Schedule of Values now comes after Schedule Linking & Allocation.** In the implemented stepper, Continuous Operations is split into sequential steps; the order is **Schedule Linking & Allocation (Step 4) → Schedule of Values (Step 5) → Publish SOV (Step 6)**. Lines are first allocated across the schedule, then drafted into the owner-facing SOV.

4. **A Subcontractor is required to commit a budget line.** The budget grid has a new **Subcontractor** dropdown column populated from the project's invited subcontractors. A line cannot be committed — per-line or via bulk Lock Budget — until a subcontractor is selected. This is separate from the cost-breakdown amount column, now relabeled **Sub Cost**.

Revision Note (v2.3 — operations, read-only views & nav alignment): Documents the implemented prototype as of June 2026:

1. **Six-step stepper.** The implemented setup tracker has six steps: 1 Preliminary Config · 2 Prime Contract · 3 Budget Setup · 4 Schedule Linking & Allocation · 5 Schedule of Values · 6 Publish SOV. (The earlier "five-step / Continuous Operations with tabs" framing is realized as sequential, non-gated steps 4–5.)

2. **Subcontractor column placement.** The required **Subcontractor** dropdown sits immediately to the right of **Description**. The cost-breakdown currency amount is a distinct column, **Sub Cost** (id `subCost`); the Profit formula references `subCost` so it never collides with the Subcontractor select.

3. **Committed lines are read-only.** There is no per-row Change Order control in the budget table; change orders are handled in a later (post-setup) phase.

4. **Schedule Linking & Allocation shows the assigned subcontractor** on each committed line.

5. **SOV table trimmed.** The Schedule of Values shows: SOV Line Item · Budget Line Item · Quantity · UOM · Total Budget · Status. (Cost Code and Location removed.)

6. **Post-activation operations.** After Publish SOV, each finance section is reachable from the sidebar as a read-only/operational view: **Prime Contract** (read-only baseline table, LOCKED badge in the header), **Budget** (read-only actual budget), **SOV** (published, read-only), **Allocate** (Schedule Linking & Allocation). The **Financial Operations Hub** is a lightweight confirmation/waypoint screen — activation message + Budget / SOV / Schedule cards that deep-link into each tool; it shows no tool header and highlights no sidebar tool.

7. **Navigation entry points.** The Finance mega-menu **Contract** and **Configure** links jump straight to Step 1. The left sidebar has an **Allocate** item (directly below Budget) that opens Schedule Linking & Allocation; it stays disabled until at least one line is committed, matching the other tool gates. All financial tables render inside the standard bordered card container used by the rest of the app.

Implementation status: SpreadsheetV4 is the canonical financial setup surface. Steps 1–5, cross-cutting approval/change-order stubs, localStorage persistence, and readiness gating are implemented as a frontend prototype (mock extraction for both contract and budget uploads, mock approvals). Budget upload parses CSV by header for real; Excel/PDF and unparseable files fall back to a demo budget.

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

Solution (v2.1 / v2.2 additions):

6. Prime Contract line items and Budget line items are stored separately. Step 2 maintains a simple contract baseline table (Contract Line + Contract Value, **no cost code**); Step 3 maintains the full project budget grid (cost codes enforced).
    
7. Budget Setup is dual-mode like Prime Contract Setup: the user either **uploads a budget file (Excel, CSV, or PDF)** that is parsed into reviewable line items, or **enters lines manually**. There is no path that creates a budget from the Prime Contract.
    

---

## 2. Product Requirements (PRD)

### 2.0 Progressive Six-Step Workflow

  

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

STEP 3: Progressive Budget Setup  (DUAL MODE)               

         Available the moment a PC Value exists                               

         On entry (empty budget): Upload / Enter Manually / From Prime Contract

           Mode A — Upload: Excel (.xlsx) / CSV / PDF → review → import lines  

           Mode B — Manual: enter budget lines directly in the grid           

           Mode C — From Prime Contract (testing): copy PC lines → budget,     

                    cost codes auto-derived (shown only when PC lines exist)   

         Cost codes required per line when enforcement is confirmed in Step 1

         Per-line states:  OPEN  >  [PENDING APPROVAL]  >  COMMITTED (Locked) 

         Optional "Lock Budget" bulk action commits all open lines at once    

            ↓ AS LINES ARE COMMITTED ↓          

STEP 4: Schedule Linking & Allocation  (per committed line, no phase gate)

         Only committed lines are eligible (open/pending shown as not ready)  

         Allocate each committed line across schedule tasks by cost code      

         Each line shows its assigned Subcontractor                           

         Bulk "Link all" (cost-code suggestions) + per-line manual splits     

            ↓ AS LINES ARE LINKED ↓                                          

STEP 5: Schedule of Values  (owner-facing billing schedule, draft)    

         Draft SOV line per committed budget line (stays draft until publish) 

         Columns: SOV Line Item · Budget Line Item · Quantity · UOM ·         

                  Total Budget · Status  (no Cost Code / Location)            

         Bulk "Map all" + manual SOV lines                                    

            ↓ READINESS CHECK PASSES ↓                                        

STEP 6: Publish SOV  (formal owner-facing handover)                  

         Readiness checklist must be satisfied                                

         Unmet checks link back to Step 4 (Schedule) or Step 5 (SOV)          

         Publishes finalized SOV to Owner                                     

            ↓ PUBLISH ↓                                                       

OUTCOME: Project "Financially Activated" → Financial Operations Hub         

         (waypoint: activation message + Budget / SOV / Schedule cards;       

          each finance section then viewable read-only via the sidebar)      

  
  

CROSS-CUTTING WORKFLOWS:

  ▸ Change to PC Value (after any line committed) → GC/PE/Owner Approval flow

  ▸ Committed Line → read-only (no direct edit; no Change Order control in the budget table)

  ▸ Per-Line Approval enabled? → Fires on Commit action, before lock takes effect

  ▸ Prime Contract line total ≠ Contract Sum metadata → inline warning (Step 2)

  ▸ Budget total ≠ Prime Contract Value → inline warning (Step 3)

  ▸ Budget upload (Excel/CSV/PDF) → parse → review → import as Open lines (Step 3)

  

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
|Budget Line|Locked / Committed|Locked at line level, fully operational for subs / SOV / invoicing / schedule. UI badge: "Committed".|No — read-only. Change orders are handled outside Budget Setup (no in-table control).|No (already through)|
|Budget (Whole)|Mixed State|Default; mixed state of open and committed lines|Per line|Per line|
|Budget (Whole)|Locked|Bulk action committed all remaining draft lines|No — committed lines read-only; change orders handled post-setup.|Already through|

Data stores (v2.1):

| Store|Sheet ID|Purpose|
|---|---|---|
|Prime Contract lines|`sheet-prime-contract`|Step 2 baseline — Contract Line + Contract Value only (**no cost code**)|
|Project Budget lines|`sheet-budget`|Step 3 full budget grid with cost codes, cost breakdown, and formulas|

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
    

Unified Prime Contract line-item table (v2.2 — both modes):

Both upload and manual entry use the **same table structure** on the Review & Edit screen. The Prime Contract baseline is owner-facing and intentionally simple — **two data columns, no cost code:**

| Column | Field | Notes |
|---|---|---|
| *(index)* | Row number | Sticky index column; shows row number, reveals checkbox on hover (same pattern as main spreadsheet) |
| Contract Line | `name` | Text, editable while contract is open |
| Contract Value | `contractValue` | Currency, right-aligned; footer shows whole-dollar total |

- **No cost code.** Cost codes are a Budget-side concept (the connector to the schedule) and are captured in Step 3, not on the contract baseline. Upload extraction does **not** assign cost codes to Prime Contract lines.
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
    

Budget entry — dual mode (v2.2):

When the user navigates to Step 3 with an **empty budget**, they are presented with a **choice screen** (mirroring Prime Contract Setup), not a grid:

- **Upload Budget** — opens the Budget Upload modal accepting **Excel (.xlsx), CSV, or PDF**. The file is parsed into line items, the user reviews them, then imports. Imported lines arrive in Open state. (See Budget Upload flow below.)
- **Enter Manually** — initializes the budget with one blank Open row and drops the user straight into the grid.
- **From Prime Contract** *(testing convenience; shown only when Prime Contract line items exist)* — copies Prime Contract line items into budget rows: Contract Line → Description, Contract Value → Budget (and Revised Budget), cost categories → 0, and a **cost code auto-derived (CSI)** from the line description (since the Prime Contract carries no cost code). Lines arrive Open and the user lands on the grid.

Once a budget exists, Step 3 shows the full budget grid directly; the choice screen does not reappear unless the budget is emptied. A "Continue editing current budget" affordance is available on the choice screen when budget data already exists.

> The budget is **not automatically** seeded from the Prime Contract — there is no auto-prompt. The "From Prime Contract" choice is an explicit, optional starting point (primarily for testing); the budget is otherwise the GC's independently-built cost plan.

Budget Upload flow (Mode A):

1. **Upload** — drag/drop or browse for an `.xlsx`, `.csv`, or `.pdf` file. An "Enter Budget Lines Manually" option is also offered here.
2. **Processing** — animated scan (mock extraction in prototype).
3. **Review** — extracted lines are shown in a Cost Code / Description / Budget summary with a footer total. CSV files are parsed by header (description, cost code, budget, labor, material, equipment, subcontractor, others, quantity, UOM, location); Excel/PDF and unparseable files fall back to a demo budget with an amber notice. Cost codes are auto-derived (CSI MasterFormat) for any line missing one. The user clicks **Import** to write the lines into the budget grid (all Open).

Populating the budget (manual entry):

- Users click into a spreadsheet-style grid and fill in line items inline. Single-click-to-type.
- Add row / delete selected rows available. Uploaded lines and manual lines coexist; the Upload affordance remains in the grid toolbar to append more lines.
- Primavera P6 and Microsoft Project (.mpp) formats remain reserved for schedule imports only.
    

Budget grid columns (v2.1 — implemented):

| Column | Type | Editable | Notes |
|---|---|---|---|
| *(index)* | — | — | Row number + hover checkbox |
| Status | badge | — | Open / Pending / Committed |
| Cost Code | text | Yes | Required when cost code enforcement confirmed; auto-derived on upload when missing |
| Description | text | Yes | From upload or manual entry |
| **Subcontractor** | **select** | Yes | **Required to commit** — sits immediately right of Description. Dropdown of subcontractors invited to the project; no free text. A line cannot be committed (or bulk-locked) until one is selected. Stored as `subcontractorName` |
| Location | text | Yes | |
| Quantity | number | Yes | Right-aligned |
| UOM | text | Yes | |
| Effort hours | number | Yes | Right-aligned; summed in footer |
| Budget | currency | Yes | Primary line total (from upload or entered) |
| Revised Budget | currency | Yes | |
| Labor | currency | Yes | From upload (CSV column) or entered; 0 otherwise |
| Material | currency | Yes | From upload (CSV column) or entered; 0 otherwise |
| Equipment | currency | Yes | From upload (CSV column) or entered; 0 otherwise |
| Sub Cost | currency | Yes | Subcontractor cost **amount** (cost breakdown), id `subCost`. From upload (CSV column) or entered; 0 otherwise |
| Others | currency | Yes | From upload (CSV column) or entered; 0 otherwise |
| Overhead | formula | No | `= budget × default overhead %` from Step 1 |
| Profit | formula | No | `= budget − labor − material − equipment − subCost − others − overhead` |

Header context (v2.1):

- Display **Prime Contract Value** from metadata in the budget toolbar/header.
- When budget rows exist, also show **Budget total** (sum of Budget column).
- If both totals are non-zero and differ, show an amber reconciliation warning.

Required fields per line item (Open state):

- Description (Contract Line label in prime contract; "Description" in budget)
    
- Cost Code (required when cost code enforcement is confirmed in Step 1)
    
- **Subcontractor (required to commit)** — a dropdown selection from the project's invited subcontractors. A budget line cannot be committed (per-line or via bulk Lock Budget) without a subcontractor selected. Distinct from the **Sub Cost** currency column (the cost-breakdown amount).
    
- Budget (primary line amount — not auto-calculated from cost categories)
    
- Quantity, UOM, Effort hours, Location — optional in open/draft posture
    
- Labor, Material, Equipment, Sub Cost, Others — cost breakdown; populated from a CSV upload's columns or entered manually, default 0
    
- Overhead, Profit — formula-driven from Budget and breakdown
    
- For line items assigned to a Trade (not the GC), entry is restricted to Sub-contract & Material amounts only. *(Reserved — not enforced in prototype)*
    

The "Commit Line Item" action:

This is the central new control. Each row in the budget grid has a per-row commit action.

- What committing a line does:
    

- If per-line approval is disabled (default): the line is locked immediately. State becomes Committed (Locked).
    
- If per-line approval is enabled: state becomes Pending Approval; routing fires to the configured approval chain. On approval, state becomes Committed. On rejection, state returns to Open with a reason captured.
    
- Once Committed, the line is locked and read-only. The user cannot edit the line directly. **Change orders are not requested from the budget table** — committed lines have no per-row change-order control; change-order handling occurs outside Budget Setup (a later phase).
    

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
    
- Committed lines are shown as read-only ("Committed") with no per-row change-order control.
    
- Bulk progress indicator at top of grid: "12 of 18 lines committed. 4 open, 2 pending approval."
    

#### Requirement 4: Steps 4 & 5 — Schedule Linking & Allocation, then Schedule of Values (replaces v1 Steps 4 & 5)

In v1, SOV Review and Schedule Linking were a parallel "phase" gated by full budget lock. In v2, these activities flow as line items are committed and are realized as two sequential, non-gated steps: **Step 4 Schedule Linking & Allocation**, then **Step 5 Schedule of Values**.

Behavior:

- Both steps become available once at least one budget line is committed. Only Committed budget lines are eligible; Open and Pending lines are shown as "not yet available."
    
- **Step 4 — Schedule Linking & Allocation:** each committed line is matched to schedule tasks by cost code and its budget allocated across them. Each line displays its **assigned Subcontractor** (chip) alongside the description and cost code. Methods: split by planned hours / split equally / manual split editor; a "Link all" bulk action applies cost-code suggestions. A Lines / Forecast toggle shows the cost-loaded forecast (CashFlowPreview).
    
- **Step 5 — Schedule of Values:** a draft SOV line is generated per committed budget line and stays draft until Publish. Columns: **SOV Line Item · Budget Line Item · Quantity · UOM · Total Budget · Status** (Cost Code and Location are intentionally not shown). "Map all" bulk action; manual SOV lines can be added.
    
- Users move freely between budget work (Step 3) and Steps 4–5 — they are not hard-gated phases.
    
- Step 6 (Publish) readiness items and the Blockers Rail link to Step 4 (Schedule) or Step 5 (SOV) as appropriate.
    

Cross-Impact Alerts (preserved from v1):

- "4 committed lines are not yet mapped to SOV."
    
- "6 committed lines have no WBS link — milestone billing not configured for these lines."
    
- "Subcontract issued against Line 12 — readiness for SOV mapping recommended."
    

Cost Code Auto-Allocation (v2 addition):

- Because cost codes are now mandatory on both budget lines and schedule activities, the system pre-suggests budget-to-schedule mappings based on matching cost codes.
    
- Users can accept, override, or refine the suggested links.
    

#### Requirement 5: Step 6 — Publish SOV (Owner Handover Anchor)

This step is preserved from v1 in spirit but is no longer the gate for downstream operations. Subcontracts, invoicing, and schedule linking can already be active. Publish SOV is specifically the act of finalizing the owner-facing billing schedule.

Readiness checklist (must all pass):

- A minimum threshold of budget lines committed (configurable; default 100%, but project-specific overrides allowed).
    
- All committed lines have at least one SOV mapping.
    
- All committed lines have a WBS link (if milestone billing is in use).
    
- No outstanding Pending Approval lines.
    
- No outstanding PC Value change approvals.
    

Each unmet check is clickable — navigates to Step 4 (Schedule Linking & Allocation), Step 5 (Schedule of Values), or the relevant setup step.

Action:

- "Publish SOV" finalizes the owner-facing document (all draft SOV lines become confirmed).
    
- Triggers project state change to "Financially Activated."
    
- The setup tracker collapses and the user lands on the Financial Operations Hub waypoint (see Requirement 6).
    

#### Requirement 6: Post-Activation Financial Operations (v2.3)

Once the project is Financially Activated, the setup tracker is no longer the primary surface. The finance module is driven by the left sidebar, and each section is a read-only or operational view of the work finalized during setup.

Financial Operations Hub (waypoint / confirmation):

- Shown when the hub is collapsed immediately after activation. It is intentionally lightweight: a green activation check, the "Project is financially activated" message, and three cards — **Budget**, **SOV**, **Schedule**.
    
- Each card is a deep link into its tool (Budget → read-only budget, SOV → published SOV, Schedule → Schedule Linking & Allocation). Clicking a card opens that tool.
    
- This screen shows **no tool header** and highlights **no sidebar tool** — it is a waypoint, not a tool. There is no "Reopen Setup Tracker" link.
    

Read-only section views (via sidebar):

| Sidebar item | Post-activation view | Notes |
|---|---|---|
| Prime Contract | Read-only Prime Contract baseline (metadata bar + Contract Line / Contract Value table + total) | Same table built in Step 2, fully read-only; **LOCKED** badge shown in the header in line with the title; no Add Row, no editing, no row checkboxes |
| Budget | Read-only "actual budget" grid | All committed lines, read-only; no commit/import/add/delete |
| Allocate | Schedule Linking & Allocation | The live allocation workspace (Lines / Forecast) |
| SOV | Published SOV | Owner-facing schedule of values, read-only |

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

#### Workflow B: Committed Line Items are Read-Only

Trigger: User attempts to alter any field on a Committed budget line item.

Behavior:

- Direct edit is blocked; the line is read-only.
    
- **Change orders are not initiated from the budget table.** There is no per-row "Request Change Order" control during Budget Setup; the committed line simply shows as read-only. Change-order handling occurs outside Budget Setup (a later phase).

#### Workflow C: Per-Line Approval (optional)

Trigger: User commits an Open budget line item when the Per-Line-Item Approval Workflow setting is enabled.

Flow:

1. User clicks "Commit" on an Open line.
    
2. Line enters Pending Approval state.
    
3. Approvers receive notification with line details (cost code, value, allocations).
    
4. On approval: line becomes Committed, downstream capabilities unlock.
    
5. On rejection: line returns to Open, with reason visible in line history.
    

Why optional: Smaller GCs may not need per-line approval; enterprise GCs may require it for audit / financial control reasons.

#### Workflow D: Budget Setup — Upload or Manual (v2.2)

Trigger: User enters Step 3 with an empty budget.

Behavior: User chooses **Upload Budget** (Excel/CSV/PDF → parse → review → import as Open lines), **Enter Manually** (one blank Open row, edit in grid), or **From Prime Contract** (testing convenience, shown only when PC lines exist — copies PC lines with auto-derived cost codes). See Requirement 3 for details. There is no automatic seed prompt.

Validation (independent of how the budget was built):

- Step 2 warns when sum(Contract Value lines) ≠ Contract Sum metadata.
- Step 3 warns when sum(Budget column) ≠ Prime Contract Value metadata. Because the budget is no longer derived from the contract, this reconciliation is the primary signal that the GC's cost plan aligns with the contract baseline.

---

## 3. UX Specification

### 3.1 Core Design Principles

1. Progressive Trust: Every action should feel reversible until explicitly committed. Saving, editing, and uploading do not commit users to anything legally or financially. Commit is always explicit and clearly framed.
    
2. State Transparency: The UI must, at every moment, make clear what is Draft, what is Pending, and what is Committed/Locked. Users should never wonder "is this safe to change?"
    
3. Granular Commitment: Commit at the smallest meaningful unit — the budget line. Avoid forcing users to commit larger objects (whole budget, whole contract) when their work is genuinely partial.
    
4. Actionable Blockers (preserved from v1): Never show a grayed-out button without an explanation and a path forward. Every disabled action must include a "Blocker Panel" explaining what's missing and how to resolve it.
    
5. Role-Awareness (preserved from v1): Display "Owned By" badges and surface approval roles where relevant. Multi-role enterprise workflows must be supported throughout.
    

### 3.2 Information Architecture & Layouts

#### Screen A: Financial Setup Hub (Steps 1, 2, 3, 6 in the center; Steps 4–5 in Screen B)

The default workspace until Publish SOV activates the project.

- Left Panel — Persistent Setup Tracker Widget (collapsible)  
      
    

- Six steps shown vertically with explicit state indicators.
    
- State icons: Complete (green check), In Progress (blue dot), Available (white circle), Blocked (gray padlock with reason on hover).
    
- Step 3 (Budget) shows progress sub-text: "12 of 18 lines committed."
    
- Step 4 is shown but framed as continuous: "Operations available — 12 lines live."
    

- Center Workspace — Active Step Detail Card  
      
    

- Step 1 (Preliminary Config): Global financial settings form including the three new v2 toggles.
    
- Step 2 (Prime Contract):
  - **Choose phase:** Upload Document | Enter Manually cards; option to continue editing saved contract.
  - **Review phase:** Contract metadata bar + unified 2-column Prime Contract table (Contract Line, Contract Value — **no cost code**) with index/hover-checkbox column. Metadata bar field order: Executed Date · Construction Start · Substantial Completion · Owner · Contractor · **Contract Sum (far right)**. Step header actions: optional "Lock Prime Contract" + primary "Continue to Budget Setup" (requires PC Value > 0).
    
- Step 3 (Budget Setup):
  - **Choice phase (empty budget):** Upload Budget | Enter Manually | From Prime Contract (testing, shown only when PC lines exist) cards (mirrors Prime Contract choose screen); "Continue editing current budget" if data already exists.
  - **Grid phase:** Full budget grid (see §2.3 Req 3 columns) with index/hover-checkbox, status badges, per-row Commit, footer totals.
  - Toolbar shows Prime Contract Value, budget total, commit progress, and an **Upload** button (Excel/CSV/PDF) to append lines; amber warning if totals diverge.
  - Bulk "Lock Budget" as secondary action.
    
- Publish SOV (Step 6): Final readiness summary card listing all checks. Each unmet check is a hyperlink back to the source (e.g., WBS/allocation failures → Schedule Linking & Allocation (Step 4); "lines not mapped" → Schedule of Values (Step 5)).
    

- Right Panel — Blockers & Readiness Rail (collapsible)  
      
    

- Live-updating list of unmet dependencies.
    
- Now state-aware: "Subcontract issuance for Line 7 is blocked because Line 7 is in Open. Commit Line 7 to enable."
    
- Includes pending approvals: "Line 12 awaiting approval from Jane Doe (Project Executive)."
    
- Publish readiness checks include actionable hints (e.g., "Step 4 → Schedule Linking tab, then Link all or link each line").
    

#### Screen B: Operations Workspace (Steps 4–5)

Available as soon as any budget line is Committed. Realized as two sequential steps in the tracker.

- **Step 4 — Schedule Linking & Allocation:** Per-line allocation of committed rows across cost-code-matched schedule tasks; each line shows its assigned Subcontractor. Bulk "Link all"; Lines / Forecast toggle.
    
- **Step 5 — Schedule of Values:** Draft SOV lines (SOV Line Item · Budget Line Item · Quantity · UOM · Total Budget · Status); bulk "Map all"; manual SOV lines.
    
- Open/Pending lines shown as not yet eligible.
    
- The Publish step (Step 6) is reached from the tracker / readiness rail. No master "Lock & Publish" button is required to do daily work here.
    

#### Screen C: Post-Activation Finance Module (v2.3)

After Publish SOV, the finance module is navigated via the left sidebar; the center shows the relevant read-only/operational view (see Requirement 6).

- **Financial Operations Hub (waypoint):** activation message + Budget / SOV / Schedule cards that deep-link into each tool. No tool header; no sidebar tool highlighted; no Reopen link.
    
- **Prime Contract:** read-only baseline table; **LOCKED** badge in the header in line with the title; no Add Row / editing / checkboxes; footer total uses the same text size as the rows.
    
- **Budget:** read-only actual budget grid.
    
- **Allocate / SOV:** Schedule Linking & Allocation and Published SOV, respectively.
    
- All of the above render inside the standard bordered card container used by the rest of the app.
    

### 3.3 Micro-Interactions & System Feedback

- Budget Upload Modal (v2.2): Mirrors the Prime Contract upload — drag/drop or browse an Excel/CSV/PDF file → animated scan → review extracted lines (Cost Code / Description / Budget + total) → Import. An "Enter Budget Lines Manually" option is offered on the upload step, and an amber notice appears when the file falls back to a demo budget. Reachable from the Step 3 choice screen and from the budget grid toolbar.
    
- Subcontractor Select (v2.3): The Subcontractor column renders an inline dropdown on open rows (options = invited subcontractors). The header shows a required `*`; an empty cell is highlighted when the line is open. Attempting to commit without one opens a **"Subcontractor Required"** modal (same component as the missing-cost-code modal, generalized by field label). Bulk **Lock Budget** is disabled with an explanatory tooltip until every open line has both a cost code and a subcontractor.
    
- Commit Confirmation Dialog: Clicking "Commit" opens a confirmation modal: "Committing Line 12 ($45,000) will lock it for direct edits…" and also displays the selected **Subcontractor**.
    
- Per-Line Approval Indicator (new): Lines in Pending Approval show an inline badge with the approver's name and a "View Request" affordance.
    
- Committed Line (read-only): A Committed line is not editable and shows a "Committed" indicator. There is no change-order control in the budget table.
    
- Schedule Linking subcontractor (v2.3): Each committed line in Schedule Linking & Allocation shows its assigned subcontractor as a chip (with a people icon) next to the description and cost code.
    
- Read-only Prime Contract LOCKED badge (v2.3): Post-activation, the Prime Contract view shows a **LOCKED** pill on the right of the section header, in line with the "Prime Contract" title; the in-table OPEN/LOCKED status pill is suppressed in this state to avoid duplication.
    
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
|Step 3 — Budget unlocked, no lines yet|"Budget is in open. Upload a budget file (Excel, CSV, or PDF) or add line items manually to get started."|
|Step 3 — Budget upload fell back to demo|"We couldn't read structured budget lines from this file, so a sample budget is shown. Adjust the lines after importing, or cancel and upload a CSV/Excel with a header row."|
|Step 3 — Budget total ≠ PC Value|"Budget total ($X) does not match the Prime Contract Value ($Y)."|
|Step 3 — Mix of Open and Committed lines|"{X} of {Y} lines committed. Committed lines are now live for subcontracts, SOV, invoicing, and schedule linking. Open lines are still editable."|
|Step 3 — Per-line approval enabled|"Per-line approval is on for this project. Each commit will be routed to your approval chain before it locks."|
|Step 3 — Attempting to edit Committed line|"This line is committed and read-only."|
|Step 3 — Commit blocked, no subcontractor|"Subcontractor Required — you cannot commit this budget line until a Subcontractor is associated with it."|
|Step 4 — Schedule Linking, mixed state|"Showing {N} committed lines available for schedule linking & allocation. Open lines will appear here when committed."|
|Step 5 — Schedule of Values|"{N} committed lines are drafted into the Schedule of Values. They stay in draft until you publish."|
|Step 6 — Readiness unmet (WBS / allocation)|"{N} committed line(s) not yet allocated to the schedule — click to open Schedule Linking & Allocation"|
|Step 6 — Readiness unmet (SOV)|"{N} committed line(s) missing an SOV entry — click to open Schedule of Values"|
|Step 6 — Ready|"All readiness checks passed. Publishing the SOV will finalize the owner-facing billing schedule and activate the project."|

---

## 4. What Changed from v1 (Summary)

For engineering and design reviewing the diff:

|   |   |   |
|---|---|---|
|Area|v1|v2 / v2.1 / v2.2 / v2.3|
|Step count|6 (Steps 0–6)|6 (Steps 1–6): Config · Prime Contract · Budget · Schedule Linking & Allocation · Schedule of Values · Publish SOV|
|Budget unlock trigger|Prime Contract must be locked|Prime Contract Value must be entered (lock optional)|
|Prime Contract entry|Upload only (Mode A)|Upload or manual value entry (Modes A & B)|
|Prime Contract line items|Mixed with budget / inconsistent by path|Separate store; **2-column** table (Contract Line, Contract Value) — **no cost code** (v2.2)|
|Budget creation|Auto-populated from contract on upload|**Dual mode: Upload (Excel/CSV/PDF) or Manual** — never seeded from the Prime Contract (v2.2)|
|Budget columns|Total Budget auto-sum of categories|Budget is primary line total; Overhead/Profit formulas; full column set incl. Location, Revised Budget|
|Budget commit model|Whole budget locked at once|Per-line commit; optional bulk "Lock Budget" preserved|
|Line edit after commit|Direct edits allowed before lock; blocked after|Direct edits blocked once committed; line is read-only (no change-order control in the budget table) (v2.2)|
|SOV & Schedule|Phase-gated; required full budget lock|Per committed line; sequential **Step 4 Schedule Linking & Allocation → Step 5 Schedule of Values**. SOV columns trimmed (no Cost Code / Location); Schedule Linking shows assigned subcontractor (v2.3)|
|Subcontractor on commit|n/a|Required **Subcontractor** dropdown (invited subs) right of Description; blocks per-line commit and bulk Lock Budget until set (v2.3)|
|Publish SOV|Final step gate for activation|Preserved as final handover anchor (Step 6); checks link to Steps 4/5|
|Post-activation|Single locked spreadsheet|Read-only section views (Prime Contract / Budget / SOV) + Allocate workspace via sidebar; Financial Operations Hub is a waypoint with cards that deep-link to tools (v2.3)|
|Approval workflows|None at line level|New: PC Value change approval; optional per-line approval|
|Cost codes|Configurable|**Budget-only**, enforced when confirmed in Step 1 (inline flag on missing codes); auto-derived on budget upload. Prime Contract carries none (v2.2)|
|Import support|Not specified|Budget upload: Excel/CSV/PDF → review → import (CSV parsed for real; Excel/PDF demo fallback). P6/MPP reserved for schedule|
|Reconciliation|Not specified|PC line total vs Contract Sum; Budget total vs PC Value|
|State vocabulary|Implicit (locked/unlocked)|Explicit (Open / Pending Approval / Committed / Locked)|
|Row selection UI|Separate checkbox column|Index column with hover checkbox (spreadsheet pattern)|

  
  
