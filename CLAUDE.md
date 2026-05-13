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

**Last updated:** 2026-05-12  
**Updated by:** Claude Code cleanup
