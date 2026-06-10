# Writing Formulas in Linarc Spreadsheet

## 1. Overview
The spreadsheet supports a powerful formula engine that allows you to automate calculations across your data. Formulas always start with an equals sign (`=`).

## 2. Creating a Custom Formula Column
You can create your own calculated columns that apply to every row in a sheet.

### Step-by-Step Example:
1. Click the **"+"** button in the header or the **"Add Column"** icon in the toolbar.
2. In the **"Add Column"** modal:
   - **Name**: Give it a name (e.g., "Margin").
   - **Type**: Select the **Formula (=)** type.
   - **Formula**: Enter your calculation using column names or cell references (e.g., `=Budget - Cost`).
3. Click **"Add Column"**.

> [!TIP]
> **Column Identifiers** are flexible! You can use the **exact column name** (e.g., `Labor`), the **column letter** (e.g., `A`, `B`), or the auto-generated ID (e.g., `col-a`). Formulas are **case-insensitive**, so `=budget-cost` works the same as `=Budget-Cost`.

## 3. Writing Manual Formulas in Cells
You don't always need a specific formula column; you can enter a formula into any editable cell.

### How to use:
1. Select a cell and type **`=`** to start a formula.
2. Use arithmetic operators: **`+`**, **`-`**, **`*`**, **`/`**, and **`(`**, **`)`**.
3. **Reference other columns**: Reference columns in the same row by their names or letters (e.g., `=Labor * 1.1`).
4. **Reference specific cells**: Use standard spreadsheet notation like **`A1`**, **`B2`**, etc.
5. **Cross-Row references**: Use a column name followed by a row number (e.g., `=Labor1 + Labor2`).
6. **Multi-word Names**: For columns with spaces, you can type the name normally (e.g., `=Total Labor + Material`). You can also wrap them in brackets for clarity (e.g., `=[Total Labor]`).
7. **Special Functions**: Use **`SUM(col1, col2, ...)`** for easy addition.

### Example:
- Type **`=Labor * 1.1`** in a cell to calculate labor with a 10% markup for that specific row.
- Type **`=A1 + B1`** to add the first two cells of the first row.
- Type **`=SUM(A1, A2, A3)`** to sum the first three cells of column A.
