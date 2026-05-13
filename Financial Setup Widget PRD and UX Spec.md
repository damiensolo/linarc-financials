Here is the comprehensive Product Requirements Document (PRD) and UX Specification for the **Financial Setup Tracker Widget** (part of the Project Activation Hub), designed to seamlessly guide users through configuring financials in the Linarc platform.  
This document is synthesized from the "Journey-First" UX strategy, the business logic outlined in the RP-A-44 onboarding flow, and the usability findings from the system audit.

# PRD & UX Spec: Journey-First Financial Setup Widget

## 1\. Executive Summary

**Objective:** Transform Linarc’s currently fragmented, module-driven financial setup process into a unified, state-aware "Guided Setup Widget" (The Project Activation Hub).**Problem:** Currently, setting up a project requires a General Contractor (GC) to navigate through disparate apps (Finance, Schedule, SOV, Contracts) while memorizing a strict 8-step sequence of hard gates and dependencies 1-4. Hidden configurations (like the "allow multiple pay apps" setting) trap users in dead ends 5, 6\.**Solution:** A persistent, state-driven widget that stays on the screen, guiding users through the mandatory setup steps (Steps 1–5), explaining exact blockers, and keeping conceptually linked tasks in a unified workspace.

## 2\. Product Requirements (PRD)

### 2.0 Six-Step Financial Setup Workflow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ STEP 0: Preliminary Config    (Retainage, Overhead, Billing, Pay App Toggle) │
│            ↓ CONFIRM ↓                                                        │
│ STEP 1: Upload Prime Contract (PDF/DOCX/TXT → Auto-extract dates & line items)
│            ↓ UPLOAD & CONFIRM ↓                                              │
│ STEP 2: Edit Prime Contract   (Verify/adjust dates, line items, allocations)  │
│         └─→ Lock Prime Contract (freezes as baseline)                         │
│            ↓ LOCK ↓                                                          │
│ STEP 3: Budget Setup          (Auto-populated from locked contract)           │
│         └─→ Lock Budget (enables SOV & Schedule linking)                     │
│            ↓ LOCK ↓                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐      │
│ │ STEP 4: Draft SOV Review (Parallel)                                 │      │
│ │         + STEP 5: Schedule Linking (Parallel)                       │      │
│ │         Both run side-by-side in dual-tab workspace                 │      │
│ │         ↓ BOTH COMPLETE ↓                                           │      │
│ └─────────────────────────────────────────────────────────────────────┘      │
│ STEP 6: Lock & Publish SOV    (Final readiness check → Activate project)     │
│            ↓ PUBLISH ↓                                                       │
│ OUTCOME: Project "Financially Activated" → Financial Operations Hub           │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Target Audience

* **General Contractors (GCs):** Project Managers, Finance Admins, and Project Executives.

### 2.2 Functional Requirements

**Requirement 1: Preliminary Financial Configuration Gate**

* Before Step 1 begins, the widget must prompt users to confirm global financial variables.  
* **Fields:** Default Retainage (e.g., 10%), Default Overhead (e.g., 5%), Billing Dates, and the critical "Allow multiple pay apps for the same month" toggle.  
* *Why:* In the current system, missing the multiple pay app checkbox permanently breaks the financial flow later on.

**Requirement 2: Step 1 \- Upload Prime Contract**

* The widget directs the user to upload a contract file (PDF, DOCX, TXT, or MD).  
* *Feature:* AI-assisted document parsing automatically extracts contract metadata (executed date, construction start, substantial completion, contract sum, owner, contractor, project name) and line items with cost allocations.  
* Extraction uses regex pattern matching with fallback to demo data if parsing is incomplete.
* **Outcome:** Contract file is stored and extracted data (dates + line items) is displayed for review in Step 2.
* **Gate Rule:** Upload must complete successfully and user must confirm extracted data to unlock Step 2.

**Requirement 3: Step 2 \- Review & Edit Prime Contract (Editable Spreadsheet Table)**

* *Primary Task:* Users review the extracted contract data and make corrections/edits before locking.  
* **Contract Metadata Bar** (sticky header at top):
  - Displays: Project Name (with pin icon) | Executed Date | Construction Start | Substantial Completion | Contract Sum | Contract File (link)
  - All date fields are editable via date picker
  - Contract Sum is auto-calculated from line item totals but may be manually adjusted if extraction was incomplete
* **Prime Contract Table** (full editable spreadsheet):
  - **Columns (L→R):** S.No (auto) | CONTRACT LINE (editable text) | COST CODE (editable) | QTY (editable) | UOM (editable) | HOURS (editable) | LABOR (editable $) | MATERIAL (editable $) | EQUIPMENT (editable $) | SUB (editable $) | OTHERS (editable $) | TOTAL BUDGET (auto-calculated, highlighted blue) | ACTIONS (edit/delete)
  - **Editable fields:** Contract Line name, Cost Code, Qty, UOM, Hours, Labor, Material, Equipment, Sub, Others — users can update allocations and breakdown
  - **Auto-calculated:** TOTAL BUDGET per row = Labor + Material + Equipment + Sub + Others
  - **Totals row (sticky footer):** Dark background showing sums for each numeric/currency column; Grand Total shows across all line items
  - **Table toolbar (above header):** Search, Filter, Sort, Help icon, Visibility toggle, Grid view options (3 layouts), Add Row button (+)
  - **Locked state:** When locked, entire table becomes read-only; "LOCKED" badge appears in header; no further edits allowed
* **Gate Rule:** The Prime Contract must be strictly locked before the user can move to Step 3. Locking:
  - Freezes all contract dates and line items (read-only)
  - Establishes contract as the authoritative baseline for budget setup
  - Enables next step (Budget Setup) to auto-populate from locked data
  - Triggers system notification to project stakeholders

**Requirement 4: Step 3 \- Budget Setup & Lock**

* *Objective:* Once the Prime Contract is locked, refine the budget and establish cost controls.  
* *Auto-population:* Draft budget is pre-populated from locked Prime Contract line items (preventing double-entry).  
* Users verify cost codes, review allocations, add budget-specific categories if needed (e.g., contingency, allowances).  
* **Gate Rule:** Locking the budget is the primary control gate; it unlocks both SOV generation and Schedule linking.

**Requirement 5: Steps 4 & 5 \- Coordinated Parallel Workspace (SOV & Schedule)**

* The widget merges SOV Review and Schedule Linking into a single dual-tab workspace.  
* Users allocate budget funds to scheduled WBS tasks using quantity, percentage, or total amounts.  
* **Gate Rule:** Both steps run in parallel and *both* must be completed to unlock Step 6\.

**Requirement 6: Step 6 \- Lock & Publish SOV**

* Once readiness checks pass, the widget unlocks the master action to finalize the owner-facing billing schedule.  
* *Outcome:* The project is now "Financially Activated". The wizard disappears, shifting the user to the "Financial Operations Hub" for rolling subcontractor commitments.

## 3\. UX Specification

### 3.1 Core Design Principles

1. **Business-State-Driven UX:** Do not use a strict, screen-hijacking linear wizard. Because onboarding spans multiple days and roles, use a guided "operating system" widget that users can resume at any time.  
2. **Actionable Blockers (No Dead Ends):** Never show a grayed-out button without an explanation. Every locked step must include a "Blocker Panel" explaining exactly what is missing and how to fix it.  
3. **Role-Awareness:** Display "Owned By" badges (e.g., *Owned by: Finance Admin*) to accommodate multi-role enterprise workflows.

### 3.2 Information Architecture & Layouts

#### Screen A: The Financial Setup Hub (Steps 1–3, 6\)

This is the default view when configuring a new project's financials.

* **Left Panel: Persistent Setup Tracker Widget**.  
  - A vertical navigation tracker showing the 6 mandatory setup steps.  
  - States clearly indicated: *Complete* (Green Check), *Active* (Blue Highlight), *Locked* (Gray Padlock).  
* **Center Workspace: Active Step Detail Card**.  
  - **Step 1 (Upload):** File upload interface with drag-drop zone
  - **Step 2 (Review & Edit Prime Contract):** Editable contract table with metadata bar, toolbar, and Lock button
  - **Step 3 (Budget Setup):** Budget configuration interface, auto-populated from locked contract
  - **Step 6 (Final Publish):** Final readiness summary and "Publish SOV" CTA
  - Displays an auto-save timestamp to build trust against data loss.  
* **Right Panel: The Blockers & Readiness Rail**.  
  - A sticky panel summarizing unmet dependencies.  
  - *Copy Example:* "Generate SOV is locked. Blocked because Budget has 3 unmapped cost codes."

#### Screen B: Coordinated Workspace (Steps 4 & 5\)

This view activates once the budget is locked (Step 3), merging SOV Review and Schedule Linking into a unified workspace.

* **Top Navigation:** Tab 1 Draft SOV Review | Tab 2 Schedule Linking.  
* **Primary Work Area:**  
  - Standard spreadsheet-native grids. Users can single-click to type (eliminating double-click friction).  
  - Irrelevant columns (like Equipment/Material if none were budgeted) are visually locked to reduce clutter.  
* **Cross-Impact Alerts (Crucial UX Feature):** Lightweight alerts show how actions in one tab affect the other (e.g., *"4 SOV lines are missing WBS links"*), teaching the user the system's logic inline.  
* **Sticky Footer Action Bar:** A master \[Lock & Publish SOV\] button (Step 6 CTA). Above the button, a readiness checklist ensures users know exactly what is required before they attempt to publish.

### 3.3 Micro-Interactions & System Feedback

* **Auto-Save & Nav Warnings:** If a user accidentally swipes their trackpad to navigate back (a major issue causing data loss), the system must intercept with a "You have unsaved changes" warning.  
* **Linking Feedback:** When allocating a budget to the schedule, a clear visual "Linked" badge must appear instantly in the row so users don't have to manually check.  
* **System Notifications:** Locking a major baseline (like the Prime Contract) will trigger an automated, role-based email/notification to the project manager or admin, facilitating a smooth handoff for the next step.

