# CLAUDE.md – Linarc Financials

**Project:** Linarc Financials – Project Budget & Schedule Management  
**Language/Stack:** TypeScript + React 19 + Tailwind CSS + Vite  
**Status:** Recently cleaned up; 3 core views (Table, SpreadsheetV2, SpreadsheetV4)

---

## Key Directories

```
src/
  ├── components/
  │   ├── views/          # Table, SpreadsheetV2, SpreadsheetV4
  │   ├── layout/         # AppLayout, ViewControls, AppHeader, etc.
  │   ├── shared/         # Modals, panels, reusable UI
  │   └── common/         # Icons, base UI components
  ├── context/            # ProjectContext (state management)
  ├── types/              # TypeScript interfaces
  ├── constants/          # Config, design tokens, columns
  ├── data/               # Mock data (MOCK_TASKS, MOCK_BUDGET_DATA)
  ├── hooks/              # Custom React hooks
  ├── lib/                # Utilities (checkFilterMatch, etc.)
  ├── mainnav/            # Header & Sidebar components
  └── App.tsx, index.tsx
```

---

## Context & Constraints

- **Working directory:** All paths relative to `c:\Users\damie\Projects\linarc-financials\`
- **Git strategy:** Create feature branches; no force-push to main
- **Node/npm:** Available; use `npm` for package commands
- **Active views:** `table` | `spreadsheetV2` | `spreadsheetV4` (removed: dashboard, lookahead, gantt, board, spreadsheetV3)
- **State:** React Context (ProjectContext.tsx) — single source of truth
- **Styling:** Tailwind CSS (v3.4) — no custom CSS unless necessary
- **Build:** Vite (v6.2) — `npm run build` for production, `npm run dev` for local
- **Dev server:** Port 3001 (3000 often in use)

---

## Model Recommendations for This Stack

- **Haiku:** File reads, Grep searches, checking imports, simple edits
- **Sonnet:** Most feature work, component refactors, state management changes (default)
- **Opus:** Architecture decisions, multi-file refactors, complex view logic

Default to Sonnet. Use `/model haiku` for quick file checks.

---

## Common Commands

| Task | Command |
|------|---------|
| Build & verify | `npm run build` |
| Start dev server | `npm run dev` (runs on :3001) |
| Lint code | `npm run lint` |
| Format code | `npm run format` |
| Check token usage | `/usage` |
| Clear session (keep memory) | `/clear` |
| Summarize changes | `/compact Keep implementations, error messages, final code` |

---

## Code Style & Conventions

- **Naming:** camelCase for functions/variables, PascalCase for components
- **Comments:** Only WHY (non-obvious), never WHAT. Well-named code is self-documenting
- **Imports:** Group by: React/libs, then local imports (types, components, utils)
- **Exports:** Default export for pages/views, named exports for utilities
- **Error handling:** Validate only at boundaries (user input, API calls), trust internal code
- **No:** Unnecessary abstractions, premature generalization, backwards-compat shims

**Example:**
```typescript
// Good: clear intent
const formatCurrency = (amount: number) => 
  amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Bad: over-commented, obvious
// Format the amount to currency string with 2 decimal places
const formatCurrency = (amount: number) => { ... }
```

---

## State Management (ProjectContext)

**Core state:**
- `tasks` — Task array (mock data)
- `views` — Saved views with filters, sort, display settings
- `activeViewMode` — Current view type: `table | spreadsheetV2 | spreadsheetV4`
- `activeView` — Active view object (fallback to transient if no saved view)
- `selectedTaskIds`, `editingCell`, `detailedTaskId` — Selection state
- `contractData` — Prime contract metadata (dates, owner, contractor, extraction method)
- `isContractUploadOpen` — Contract modal visibility flag

**Key actions:**
- `handleSelectView(viewId)` — Switch to a saved view
- `handleViewModeChange(mode)` — Switch view type
- `updateView(props)` — Update active view settings
- `setFilters()`, `setSort()`, `setHighlights()` — Quick setters

**Display settings (per view):**
- `displayDensity` — 'compact' | 'standard' | 'comfortable'
- `showToolbarLabels` — Boolean (default: **false** — icons only)
- `showGridLines` — Boolean
- `fontSize` — Number (pixels)
- `groupBy` — Column IDs to group by
- `sort` — { columnId, direction: 'asc' | 'desc' } | null

---

## Views & Components

### Table View (`src/components/views/table/`)
- Task list with columns, filters, sorting
- Supports grouping, highlighting, density control
- ItemDetailsPanel for task details on right

### SpreadsheetV2 (`src/components/views/spreadsheetV2/`)
- Budget line items (not tasks)
- Copy/paste rows, context menus
- Resizable columns, row/cell styling
- Uses `activeView.spreadsheetData` and `activeView.spreadsheetColumns`

### SpreadsheetV4 (`src/components/views/spreadsheetV4/`)
- Multi-sheet support (`v3Sheets`, `v3ActiveSheetId`)
- Formula bar, add columns, templates
- More feature-rich than V2
- Advanced budget/schedule tracking
- **NEW:** Prime contract upload integration with staged workflow:
  1. **Empty state:** No contract → shows upload encouragement screen
  2. **Contract form:** Contract uploaded → ContractDetailsForm with editable dates
  3. **Spreadsheet:** Contract confirmed → full spreadsheet with toolbar

### Prime Contract Upload Feature
**Files:**
- `src/components/shared/ContractUploadModal.tsx` — Main modal component
- `src/types/index.ts` — ContractData interface

**Flow:**
1. **Upload Step:** Drag/drop zone, accepts `.pdf`, `.docx`, `.xlsx`, `.txt`, `.md`
2. **Processing Step:** Animated typewriter effect showing scan progress (~1.8s)
3. **Review Step:** Read-only summary + 3 editable DatePickers (Executed, Start, Substantial Completion)

**Extraction Logic:**
- FileReader extracts text from uploaded files
- Regex patterns match dates, contract sum, owner, contractor, project name
- Fallback to demo values (Desert Vista / Sonoran Build) if no extraction matches
- Merge strategy: real extracted values win, demo fills gaps
- Tracks `extractionMethod: 'parsed' | 'fallback'` in ContractData

**State in ProjectContext:**
```typescript
contractData: ContractData | null
setContractData: (data: ContractData | null) => void
isContractUploadOpen: boolean
setIsContractUploadOpen: (open: boolean) => void
```

---

## Recent Changes (2026-06-11) — SOV moved up + publish-anytime

**Setup-step reorder (SOV is now Step 3, right after Budget):**
- ✅ New setup order: **1. Prime Contract → 2. Budget Setup → 3. Schedule of Values → 4. Schedule Linking & Allocation → 5. Publish SOV** (steps 3 ↔ 4 swapped from before). Touched: `SetupStepper` (STEPS), `StepDetailCard` (case 3 → `SOVMappingGrid`, case 4 → `BudgetScheduleLinker`), `FinancialSetupActionBar` (`isSov = step === 3`; step-3 continues to Linking, step-4 continues to Publish; step-2 "Continue to Schedule of Values"), `WorkflowMessageBanner` (step 3/4 messages swapped), `ReadinessSection` (`STEP_LABELS`).
- ✅ Sidebar order is now **Prime Contract · Budget · SOV · Allocate · …** — the `sov` icon moved above `allocate` in `Sidebar.tsx`. Step↔sidebar maps updated: `getSidebarItemKeyForSetupStep` (3→`sov`, 4→`allocate`, 5→`sov`) and `useFinancialGating` `stepMap` (`sov:3`, `allocate:4`, `commitment:4`).

**SOV publishes anytime — decoupled from PC lock and allocation/linking:**
- ✅ `computePublishReadiness(budgetRows, sovMappings, approvalQueue)` — **signature trimmed** (dropped `scheduleLinks` + `{ contractLocked }`). Removed the `prime-contract-locked`, `budget-locked` (fully-locked), and `wbs-linked` (allocation) checks. Remaining checks: `sov-mapped` (≥1 locked line, each with an SOV entry — `actionStep` is 2 when nothing's locked yet, else 3), `no-pending-approvals`, `no-pc-change-pending`.
- ✅ `publishSOV` no longer requires `contractLocked` or `isBudgetFullyLocked` — it publishes on `allPublishChecksMet` alone, so a **partial SOV can go out** while other budget lines stay open and before any allocation. (`PublishSOVStep` hint copy + `ReadinessSection` descriptions updated; removed the dead `prime-contract-locked`/`setPrimeContractSetupPhase` branch.)
- ⚠️ Owner-billing gating (`HEADER_CATEGORY_GATING.ownerBilling`) intentionally still wants a locked PC + fully-locked budget + published SOV — that's a downstream op, not SOV publish.

---

## Recent Changes (2026-06-11)

**Trade column + two-tier Lock → Commit budget workflow** (progressive, low-friction):
- ✅ `BudgetLineState` is now `'open' | 'locked' | 'pending_approval' | 'committed'` (was `open|pending_approval|locked` where `locked` meant committed).
- ✅ Added a required **Trade** select column (`TRADE_FIELD = 'trade'`, label "Trade") between Description and Subcontractor. Data: `data/trades.ts` (`TRADES`, `SUBCONTRACTORS_BY_TRADE`, `getSubcontractorsForTrade`, `ALL_SUBCONTRACTORS`). Picking a Trade scopes the Subcontractor dropdown to that trade's vendors and clears a now-invalid pick. `INVITED_SUBCONTRACTORS` now derives from `ALL_SUBCONTRACTORS`.
- ✅ Trade is **prepopulated on import** — `tradeForLineItem(name)` in `budgetLineExtraction.ts` (mirrors `csiCodeForLineItem`, threaded through the `trade` field on `ExtractedBudgetLine`) derives a trade from the line name for Prime-Contract / upload seeding. It has NO default — unmatched names land blank (e.g. demo "Kitchen updates") so the picker is demoable without filling every row.
- ✅ Action column = micro **pill buttons** (`PILL_BASE`/`PILL_ACTIVE`/`PILL_DIM` in `BudgetSetupGrid`). Lock & Commit share one shape; each dims when its required fields are unmet (still clickable → surfaces the missing-field modal). Sticky actions `<td>` carries a single OPAQUE bg per state (was a translucent `bg-*/30` tint that let horizontally-scrolled cells bleed through).
- ✅ **Lock** (`lockLine`, `bulkLockOpenLines`): open → `locked`. Requires Cost Code + Trade. Adds the line to the SOV (draft mapping) and Schedule Linking & Allocation (draft link). No subcontractor needed. Cost Code + Trade freeze on lock; amounts + subcontractor stay editable.
- ✅ **Commit** (`commitLine`): requires Cost Code + Trade + Subcontractor. Available from `open` (commits directly, also locking it into the SOV) or from `locked`. Sets `committed` (or `pending_approval` if per-line approval on; reject falls back to `locked`).
- ✅ "In the SOV" = `isLineInSov` (state !== 'open'). SOV/schedule sync, `canAccessOperations`, and the Step-3/4 gates key off locked-or-beyond lines (`hasSovLines`/`sovLineCount`); subcontract issuance & subs billing still need `hasCommittedLines` (a subcontractor). `isBudgetFullyLocked` = no open lines remain.
- ✅ Bulk actions on the Budget step: **"Lock All"** (`bulkLockOpenLines`, all-or-nothing — disabled until every open line has cost code + trade; `LockBudgetModal`) and **"Commit All"** (`bulkCommitLines`, commits every line ready to commit — open or locked with cost code + trade + subcontractor; leaves the rest untouched).
- ✅ Action cells render opaque (no translucent tint) to fix sticky-column bleed-through; the committed state shows no fill on the actions cell. A small Lock icon (tooltip) sits by the status badge for any non-open line (`LOCK_TOOLTIP`).

## Recent Changes (2026-06-01)

**Prime Contract without cost codes + Budget dual-mode upload** (see `Financial_Workflow_PRD_and_UX_Spec_v2.1.proposed.md` v2.2):
- ✅ Removed Cost Code from the Prime Contract table — now Contract Line + Contract Value only
- ✅ Moved CSI cost-code derivation from `contractLineExtraction.ts` to new `lib/budgetLineExtraction.ts`
- ✅ Budget Setup is now dual-mode: `BudgetChoiceStep` (Upload | Manual) + `BudgetUploadModal` (Excel/CSV/PDF, mirrors `ContractUploadModal`)
- ✅ Removed budget-seed-from-Prime-Contract (`BudgetSeedPromptModal`, `seedBudgetFromPrimeContract`, `seedBudgetRowsFromPrimeContract`)
- ✅ Added `budgetSetupPhase` ('choose' | 'grid') + `isBudgetUploadOpen` to ProjectContext

---

## Recent Changes (2026-05-12)

**Phase 1 — Cleanup completed:**
- ✅ Deleted 6 view directories (~8k lines removed)
- ✅ ViewMode type simplified: `'table' | 'spreadsheetV2' | 'spreadsheetV4'`
- ✅ MainContent: 8 imports → 3 imports, 9 cases → 3 cases
- ✅ AppLayout simplified (removed version switching)
- ✅ Toolbar labels default to OFF
- ✅ PDF/Download modals restored
- ✅ Deleted unused ViewModeSwitcher.tsx
- ✅ Cleaned up references in AppHeader, FieldsMenu, ViewManagerModal

**Phase 2 — Prime Contract Upload feature:**
- ✅ Added `ContractData` interface (src/types/index.ts)
- ✅ Extended ProjectContext with contract state (contractData, isContractUploadOpen)
- ✅ Created ContractUploadModal.tsx (425 lines, 3-step flow: upload → processing → review)
- ✅ Integrated modal in AppLayout.tsx (zero-prop portal pattern)
- ✅ Added "Attach Contract" button to SpreadsheetToolbar (conditional: dashed when empty, green badge when attached)
- ✅ Added empty-state banner to SpreadsheetViewV4 (blue callout encouraging upload)
- ✅ Contract extraction via regex pattern matching with fallback demo values

**Build status:** ✅ 709 kB uncompressed (199.04 kB gzipped), ~6.1s build time

---

## Tools & Efficiency

### Prefer These Tools
- `Read` — File reads (not `cat`)
- `Grep` — Text search (not `grep` or `rg`)
- `Glob` — File patterns (not `find`)
- `Edit` — Code changes (not `sed`)

### Batch Operations
- Combine independent Reads/Edits/Greps in one message
- Paste errors/logs directly instead of asking Claude to fetch them

### Skip These
- Running full test suite on every change (test incrementally)
- Broad `grep -r` searches (use Grep tool instead)
- Reading entire large logs (summarize manually or use subagent)

---

## Testing

**Status:** No explicit test framework configured yet.  
**When adding tests:** Use Jest + React Testing Library (standard for React)

**To add testing:**
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

**Incremental testing approach:**
- Test one component or view after changes
- Paste test failures directly into chat
- Fix incrementally, don't batch

---

## Subagent Usage

Spawn a subagent when:
- Parsing 1000+ line logs or output
- Broad searches across many files
- Summarizing API docs or specs
- Anything that would add 5k+ tokens to main context

**Example:**
```
Agent({
  description: "Grep for all remaining references to deleted views",
  subagent_type: explore,
  prompt: "Search src/ for any references to 'dashboard', 'lookahead', 'gantt', 'board', or 'spreadsheetV3' and report findings"
})
```

---

## Memory System

Memories are stored in `.claude/projects/linarc-financials/memory/`.

**Current memories:**
- (None yet — add as discovered)

**When to save a memory:**
- A non-obvious workaround or pattern discovered
- A decision that affects future choices
- A gotcha or constraint that's surprising
- User preferences or feedback

---

## Git Workflow

- **Feature branches:** `feature/short-description`
- **Main:** Protected; no direct commits
- **Merge conflicts:** Investigate and resolve; never force-push
- **Commit style:** Concise, imperative: `feat: Add X`, `fix: Correct Y`, `refactor: Simplify Z`
- **Pre-commit:** ESLint + Prettier (run `npm run lint && npm run format`)

---

## Known Gotchas

- **Import paths:** Use relative paths from root; `@` alias maps to src root
- **ViewMode type:** Only 3 types now; adding new views requires type update + MainContent switch case
- **ProjectContext:** Single context; be careful with cascading updates to avoid re-renders
- **Toolbar labels:** Off by default; users can toggle in view settings (don't hardcode on)
- **Dev server port:** 3000 often in use; falls back to 3001
- **Spreadsheet data:** V2 uses `spreadsheetData` + `spreadsheetColumns`; V4 uses `v3Sheets`
- **Contract workflow:** V4 has three states: no contract (empty screen) → contract attached (details form) → contract confirmed (spreadsheet table)
- **Contract state:** `contractData` holds extracted details; `contractConfirmed` gates visibility of spreadsheet
- **Prime Contract has NO cost codes:** The Prime Contract line table is two columns only — Contract Line + Contract Value (`DEFAULT_PRIME_CONTRACT_COLUMNS`). Cost codes are Budget-only (the connector to the schedule). CSI cost-code derivation lives in `lib/budgetLineExtraction.ts`, not contract extraction.
- **Lock vs Commit (two-tier, progressive):** A budget line is `open → locked → committed`. **Lock** (`lockLine`/`canLockBudgetLine`) needs Cost Code + **Trade** and drops the line into the SOV + Schedule Linking as drafts — no subcontractor required. **Commit** (`commitLine`/`canCommitBudgetLine`) needs Cost Code + Trade + **Subcontractor** and is callable from `open` (auto-locks) or `locked`. Locked lines freeze Cost Code + Trade but keep amounts + subcontractor editable; committed/pending lines are fully frozen. Don't gate SOV/schedule on `committed` — use `isLineInSov`/`hasSovLines` (state !== 'open'); reserve `hasCommittedLines` for subcontractor-dependent ops (subcontract issuance, subs billing).
- **Trade scopes the Subcontractor list:** `TRADE_FIELD='trade'` (required select, options `TRADES`) sits between Description and Subcontractor. The Subcontractor dropdown options come from `getSubcontractorsForTrade(row.cells.trade)` (computed in `BudgetSetupGrid`, NOT from the column's static `options`), and the select is disabled until a Trade is chosen. Changing Trade clears an out-of-list subcontractor. The currency "Sub Cost" column (`subCost`) still precedes the `subcontractorName` dropdown; `trade` doesn't collide with any formula token.
- **Budget Setup choice screen (Upload | Manual | From Prime Contract):** Step 2 shows `BudgetChoiceStep` when empty, then the grid (gated by `budgetSetupPhase`). `BudgetUploadModal` accepts Excel/CSV/PDF (CSV parsed by header; Excel/PDF demo fallback). "From Prime Contract" is a testing convenience (`createBudgetRowsFromPrimeContract` in `budgetLineExtraction.ts`, auto-derives CSI cost codes) shown only when PC lines exist — there is NO automatic seed prompt (the old `BudgetSeedPromptModal` auto-prompt was removed).
- **Setup step order (SOV before Allocate):** Steps are **1 PC → 2 Budget → 3 Schedule of Values → 4 Schedule Linking & Allocation → 5 Publish SOV**. Step 3↔4 components are `SOVMappingGrid` / `BudgetScheduleLinker` respectively (in `StepDetailCard`). Two maps must stay in sync with this order: `getSidebarItemKeyForSetupStep` (financialGating) and `useFinancialGating`'s `stepMap`. Sidebar `contract` items run PC · Budget · SOV · Allocate · …
- **Publishing the SOV is intentionally low-gate:** `computePublishReadiness` only checks that ≥1 locked line has an SOV entry + no pending approvals. It is NOT tied to a locked Prime Contract, a fully-locked budget, or schedule allocation/linking — a partial SOV can publish while other lines stay open. `publishSOV` mirrors this (no `contractLocked`/`isBudgetFullyLocked` guard). Don't re-add those couplings to publish; owner-billing (a downstream op) keeps the stricter gate.

---

## Links & References

- **GitHub repo:** [Add if applicable]
- **Linear/Issues:** [Add if applicable]
- **Design:** [Figma link if applicable]
- **Docs:** See README.md

---

## Rapid Prototyping Checklist

When adding a new feature:

- [ ] Sketch changes on paper or in chat first
- [ ] Identify which view(s) are affected
- [ ] Check if state changes are needed (ProjectContext)
- [ ] Test in one view before rolling to others
- [ ] Run `npm run build` to verify no TypeScript errors
- [ ] Format code: `npm run format`
- [ ] Commit with descriptive message

---

## Notes for Next Session

- App is in a clean, lean state after removing 6 views
- Ready for focused feature work on Table + Budget (V2) + Advanced Budget (V4)
- No test suite yet — consider adding when feature work demands it
- All builds passing; dev server on :3001

---

**Last updated:** 2026-06-11  
**Updated by:** Claude Code — SOV moved to Step 3 (after Budget) + publish-anytime (decoupled from PC lock & allocation)
