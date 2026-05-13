export enum Status {
  New = 'New',
  Planned = 'Planned',
  InProgress = 'In Progress',
  InReview = 'In Review',
  Completed = 'Completed',
}

export enum Priority {
  Urgent = 'Urgent',
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
  None = 'None',
}

export enum Impact {
    High = 'High',
    Medium = 'Medium',
    Low = 'Low',
}

export interface Assignee {
  id: number;
  name: string;
  initials: string;
  avatarColor: string;
}

export interface Progress {
    percentage: number;
    history?: number[];
}

export interface HealthItem {
    name: string;
    status: 'complete' | 'at_risk' | 'blocked';
    details: string;
}

export interface TaskStyle {
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
}

export interface Task {
  id: number | string;
  name: string;
  status: Status;
  assignees: Assignee[];
  startDate: string; // DD/MM/YYYY
  dueDate: string; // DD/MM/YYYY
  isExpanded?: boolean;
  isGroup?: boolean;
  children?: Task[];
  priority?: Priority;
  impact?: Impact;
  progress?: Progress;
  health?: HealthItem[];
  style?: TaskStyle;
}

export type ColumnId = string;

export interface Column {
  id: ColumnId;
  label: string;
  width?: string;
  visible: boolean;
  minWidth?: number;
}

export type DisplayDensity = 'compact' | 'standard' | 'comfortable';

export type FilterOperator = 'contains' | 'not_contains' | 'is' | 'is_not' | 'is_empty' | 'is_not_empty' | 'is_any_of' | 'is_none_of' | 'lt' | 'gt' | 'lte' | 'gte' | 'eq' | 'neq';

export interface HighlightRule {
    id: string;
    columnId: ColumnId;
    operator: FilterOperator;
    value?: string | string[];
    color?: string;
}

export interface FilterRule {
    columnId: ColumnId;
    operator: FilterOperator;
    value?: string | string[];
}

export interface GroupByRule {
    columnId: ColumnId;
    direction: 'asc' | 'desc';
}

// Spreadsheet Specific Types
export interface BudgetLineItemStyle {
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
}

export interface BudgetLineItem {
  id: string;
  sNo: number;
  costCode?: string;
  name: string;
  divisionCode?: string;
  divisionName?: string;
  type?: 'Original Bid' | 'Upcoming CO';
  quantity: number | null;
  unit: string;
  effortHours: number | null;
  calcType?: string;
  totalBudget: number;
  labor: number | null;
  equipment: number | null;
  subcontractor: number | null;
  material: number | null;
  others: number | null;
  overhead?: number | null;
  profit?: number | null;
  remainingContract?: number | null;
  hasWarning?: boolean;
  style?: BudgetLineItemStyle;
  cellStyles?: { [columnId: string]: BudgetLineItemStyle };
  children?: BudgetLineItem[];
  isExpanded?: boolean;
  isGroup?: boolean;
}

export interface SpreadsheetColumn {
    id: string;
    label: string;
    width: number;
    align?: 'left' | 'right';
    isTotal?: boolean;
    editable?: boolean;
    visible?: boolean;
}

export type ViewMode = 'table' | 'spreadsheetV2' | 'spreadsheetV4';

export enum ViewCategory {
  System = 'system',
  Personal = 'personal',
  Shared = 'shared'
}

export type SharedWith = 'everyone' | string[];

export interface ViewMetadata {
  ownerId?: string;
  ownerName: string;
  createdAt: string;
  sharedAt?: string;
  sharedWith?: SharedWith;
  isLocked?: boolean;
  isDraft?: boolean;
}

export interface View {
  id: string;
  name: string;
  type: ViewMode;
  category: ViewCategory;
  isEnabled: boolean; // Controls whether this view shows up in the tab bar
  isActive: boolean;  // Tracks currently active view
  isDefault: boolean;
  filters: FilterRule[];
  sort: { columnId: ColumnId; direction: 'asc' | 'desc' } | null;
  columns: Column[];
  displayDensity: DisplayDensity;
  showGridLines: boolean;
  showColoredRows?: boolean;

  spreadsheetData?: BudgetLineItem[];
  spreadsheetColumns?: SpreadsheetColumn[];
  taskStyles?: { [taskId: number]: TaskStyle };
  fontSize: number;
  highlights?: HighlightRule[];
  groupBy?: GroupByRule[] | null;
  baseViewType?: ViewMode;
  showToolbarLabels: boolean;
  metadata: ViewMetadata;
  v3Sheets?: import('../components/views/spreadsheetV3/types').V3Sheet[] | null;
  v3ActiveSheetId?: string | null;
}

export interface ContractData {
  executedDate:     Date | null;
  startDate:        Date | null;
  endDate:          Date | null;
  finalCompletion:  Date | null;
  contractSum:      number | null;
  owner:            string;
  contractor:       string;
  projectName:      string;
  fileName:         string;
  uploadedAt:       string;
  extractionMethod: 'parsed' | 'fallback';
}