# Linarc Financials — Quick Start

## Access

| Environment | How |
|-------------|-----|
| **Local** | `npm install` → `npm run dev` → open **http://localhost:3001** (falls back from 3000) |
| **Vercel** | Deploy from GitHub; open your `*.vercel.app` URL |

**Note:** Workflow state does **not** persist — a browser refresh starts over.

---

## Get to the financial workflow

1. Open the **grid menu** (top-left).
2. Go to **Finance & Cost Control → Contract** (or **Configure**).
3. You land on the **6-step setup** in the left rail.

Use the **left sidebar** to jump between tools once they unlock:
- Prime Contract · Budget · Allocate · SOV

---

## The 6 steps (happy path)

### 1 — Preliminary Config
Set retainage, overhead, billing day, and approval toggles → **Continue to Prime Contract**.

### 2 — Prime Contract
**Upload** (PDF/DOCX/TXT/MD) or **Enter Manually** → review metadata + line table (Contract Line + Contract Value only).

Enter a **Contract Sum** to unlock Budget. Optional: **Lock Prime Contract**.

### 3 — Budget Setup
**Upload** (Excel/CSV/PDF), **Enter Manually**, or **From Prime Contract** (testing shortcut).

Fill each line, then **commit** individually (or **Lock Budget** for all open lines). Before commit you need:
- **Cost code**
- **Subcontractor** (dropdown)

Committed lines unlock Steps 4–6.

### 4 — Schedule Linking & Allocation
Link committed budget lines to schedule tasks. Use **Link all** or allocate per line.

### 5 — Schedule of Values
Draft owner-facing SOV lines from committed budget. Use **Map all** or edit manually.

### 6 — Publish SOV
Complete the readiness checklist → **Publish SOV**.

---

## After publish

You hit the **Financial Operations Hub** (activation screen). Sidebar tools open as **read-only** views:
- Prime Contract (LOCKED) · Budget · Allocate · SOV

---

## Tips

- **Blue banner** at the top explains what to do next on each step.
- **Locked sidebar items** show a tooltip — finish the prior step first.
- **Uploads are mocked** for demo: contract/budget files use regex extraction with fallback demo data.
- **Fastest demo path:** Step 1 → manual Prime Contract → **From Prime Contract** budget → fill Subcontractor → commit one line → Link/Map → Publish.
