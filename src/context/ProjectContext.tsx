import React, { createContext, useState, useMemo, useCallback, useContext, useRef, useEffect, SetStateAction, ReactNode } from 'react';
import { MOCK_TASKS, MOCK_BUDGET_DATA } from '../data';
import {
  Task, View, FilterRule, HighlightRule, Priority, ColumnId, Status, DisplayDensity, Column, ViewMode, ViewCategory,
  ContractData, FinancialConfig, FinancialSetupStep, FinancialActivationState, ApprovalRequest, SOVMapping,
  BudgetScheduleLink, ScheduleTask, ScheduleAllocation, ScheduleDistributionMethod,
  PrimeContractState, PublishReadinessCheck, PrimeContractSetupPhase, BudgetSetupPhase,
} from '../types';
import {
  getBudgetRows, getBudgetSheet, getPrimeContractRows, getPrimeContractSheet, hasPcValue, hasCommittedLines,
  isBudgetFullyLocked, countLinesByState, committedLineCount, getPrimeContractState, createEmptyBudgetSheet,
  createEmptyPrimeContractSheet, createBudgetColumns, DEFAULT_PRIME_CONTRACT_COLUMNS, APPROVER_NAMES,
  rowMissingCostCode, rowMissingSubcontractor, createDraftSovMapping, syncDraftSovMappings, getBudgetLineAmount,
} from '../lib/financialWorkflow';
import {
  syncScheduleLinks, distributeByHours, distributeEqual, isLinkFullyAllocated,
  computeScheduleCoverage,
} from '../lib/scheduleLinking';
import { MOCK_SCHEDULE_TASKS } from '../data/scheduleTasks';
import { computePublishReadiness, allPublishChecksMet } from '../lib/financialGating';
import { loadFinancialState, saveFinancialState, reviveContractDates } from '../lib/financialPersistence';
import type { V3Row } from '../components/views/spreadsheetV4/types';
import { getDefaultTableColumns, getDefaultSpreadsheetColumns } from '../constants';

type SortConfig = {
  columnId: ColumnId;
  direction: 'asc' | 'desc';
} | null;

const getDefaultViewConfig = (viewMode: ViewMode): Omit<View, 'id' | 'name' | 'category' | 'isEnabled' | 'isActive' | 'isDefault' | 'metadata'> => {
  const baseConfig = {
    filters: [],
    highlights: [],
    sort: null,
    displayDensity: 'comfortable' as DisplayDensity,
    showGridLines: false,
    fontSize: 12,
    groupBy: [],
    showToolbarLabels: false,
  };

  switch (viewMode) {
    case 'spreadsheetV2':
      return {
        ...baseConfig,
        type: 'spreadsheetV2',
        displayDensity: 'compact' as DisplayDensity,
        columns: [],
        spreadsheetData: JSON.parse(JSON.stringify(MOCK_BUDGET_DATA)),
        spreadsheetColumns: getDefaultSpreadsheetColumns(),
      };
    case 'spreadsheetV4':
      return {
        ...baseConfig,
        type: 'spreadsheetV4',
        displayDensity: 'compact' as DisplayDensity,
        columns: [],
        v3Sheets: null,
        v3ActiveSheetId: null,
      };
    case 'table':
    default:
      return {
        ...baseConfig,
        type: 'table',
        displayDensity: 'standard' as DisplayDensity,
        columns: JSON.parse(JSON.stringify(getDefaultTableColumns())),
        spreadsheetData: [],
        spreadsheetColumns: [],
      };
  }
};

const createSystemView = (id: string, name: string, type: ViewMode, isDefault: boolean = false): View => ({
    id,
    name,
    type,
    category: ViewCategory.System,
    isEnabled: true,
    isActive: isDefault,
    isDefault,
    ...getDefaultViewConfig(type),
    metadata: {
        ownerId: 'system',
        ownerName: 'Project System',
        createdAt: new Date().toISOString(),
        isLocked: true
    }
} as View);

const INITIAL_SYSTEM_VIEWS: View[] = [
    {
        ...createSystemView('sys-completed-tasks', 'Completed Tasks', 'table'),
        filters: [{ columnId: 'status', operator: 'is', value: Status.Completed }],
        isEnabled: false,
    },
];


interface ProjectContextType {
  tasks: Task[];
  setTasks: React.Dispatch<SetStateAction<Task[]>>;
  views: View[];
  setViews: React.Dispatch<SetStateAction<View[]>>;
  activeViewId: string | null;
  handleSelectView: (viewId: string) => void;
  defaultViewId: string;
  setDefaultViewId: React.Dispatch<SetStateAction<string>>;
  activeViewMode: ViewMode;
  handleViewModeChange: (mode: ViewMode) => void;
  selectedTaskIds: Set<number>;
  setSelectedTaskIds: React.Dispatch<SetStateAction<Set<number>>>;
  editingCell: { taskId: number; column: string } | null;
  setEditingCell: React.Dispatch<SetStateAction<{ taskId: number; column: string } | null>>;
  detailedTaskId: number | null;
  setDetailedTaskId: React.Dispatch<SetStateAction<number | null>>;
  searchTerm: string;
  setSearchTerm: React.Dispatch<SetStateAction<string>>;
  modalState: { type: 'create' | 'rename'; view?: View } | null;
  setModalState: React.Dispatch<SetStateAction<{ type: 'create' | 'rename'; view?: View } | null>>;
  showFilterMenu: boolean;
  setShowFilterMenu: React.Dispatch<SetStateAction<boolean>>;
  showHighlightMenu: boolean;
  setShowHighlightMenu: React.Dispatch<SetStateAction<boolean>>;
  showGroupMenu: boolean;
  setShowGroupMenu: React.Dispatch<SetStateAction<boolean>>;
  showFieldsMenu: boolean;
  setShowFieldsMenu: React.Dispatch<SetStateAction<boolean>>;
  activeView: View;
  /** Highlights used for cell rendering; updates immediately when user changes color */
  displayHighlights: HighlightRule[];
  updateView: (updatedView: Partial<Omit<View, 'id' | 'name'>>) => void;
  setFilters: (filters: FilterRule[]) => void;
  setHighlights: (highlights: HighlightRule[]) => void;
  setGroupBy: (groupBy: string[] | null) => void;
  setSort: (sort: SortConfig) => void;
  setColumns: (updater: SetStateAction<Column[]>) => void;
  setDisplayDensity: (density: DisplayDensity) => void;
  setShowGridLines: (show: boolean) => void;
  setShowColoredRows: (show: boolean) => void;
  setFontSize: (size: number) => void;
  setShowToolbarLabels: (show: boolean) => void;
  handleSort: (columnId: ColumnId) => void;
  handleUpdateTask: (taskId: number, updatedValues: Partial<Omit<Task, 'id' | 'children'>>) => void;
  handlePriorityChange: (taskId: number, priority: Priority) => void;
  handleToggle: (taskId: number) => void;
  handleSaveView: (name: string) => void;
  handleDeleteView: (id: string) => void;
  detailedTask: Task | null;
  expansionCycle: number;
  handleCycleExpansion: () => void;
  isViewManagerOpen: boolean;
  setIsViewManagerOpen: (open: boolean) => void;
  toggleViewEnabled: (viewId: string, enabled: boolean) => void;
  userRole: 'admin' | 'standard';
  shareView: (viewId: string, sharedWith: 'everyone' | string[]) => void;
  reorderViews: (newViews: View[]) => void;
  viewManagerShareId: string | null;
  setViewManagerShareId: (id: string | null) => void;
  handleDuplicateView: (viewId: string) => void;
  handleRenameView: (viewId: string, newName: string) => void;
  saveSystemView: (view: Partial<View>) => void;
  deleteSystemView: (viewId: string) => void;
  handleSaveNewView: (view: Partial<View>) => void;
  isDownloadModalOpen: boolean;
  setIsDownloadModalOpen: (open: boolean) => void;
  isPDFModalOpen: boolean;
  setIsPDFModalOpen: (open: boolean) => void;
  contractData: ContractData | null;
  setContractData: React.Dispatch<SetStateAction<ContractData | null>>;
  isContractUploadOpen: boolean;
  setIsContractUploadOpen: (open: boolean) => void;
  isBudgetUploadOpen: boolean;
  setIsBudgetUploadOpen: (open: boolean) => void;
  contractLocked: boolean;
  setContractLocked: React.Dispatch<SetStateAction<boolean>>;
  financialConfig: FinancialConfig | null;
  setFinancialConfig: React.Dispatch<SetStateAction<FinancialConfig | null>>;
  financialSetupStep: FinancialSetupStep;
  setFinancialSetupStep: React.Dispatch<SetStateAction<FinancialSetupStep>>;
  activationState: FinancialActivationState;
  sovPublished: boolean;
  approvalQueue: ApprovalRequest[];
  sovMappings: SOVMapping[];
  budgetScheduleLinks: BudgetScheduleLink[];
  scheduleTasks: ScheduleTask[];
  hubCollapsed: boolean;
  primeContractSetupPhase: import('../types').PrimeContractSetupPhase;
  setPrimeContractSetupPhase: React.Dispatch<React.SetStateAction<import('../types').PrimeContractSetupPhase>>;
  budgetSetupPhase: BudgetSetupPhase;
  setBudgetSetupPhase: React.Dispatch<React.SetStateAction<BudgetSetupPhase>>;
  setHubCollapsed: React.Dispatch<SetStateAction<boolean>>;
  opsActiveTab: 'sov' | 'schedule';
  setOpsActiveTab: React.Dispatch<SetStateAction<'sov' | 'schedule'>>;
  activeFinancialSection: string;
  setActiveFinancialSection: React.Dispatch<SetStateAction<string>>;
  // Derived selectors
  hasPcValue: boolean;
  primeContractState: PrimeContractState;
  budgetRows: V3Row[];
  primeContractRows: V3Row[];
  lineCounts: ReturnType<typeof countLinesByState>;
  committedLineCount: number;
  canAccessBudget: boolean;
  canAccessOperations: boolean;
  budgetFullyLocked: boolean;
  financialSetupComplete: boolean;
  publishReadiness: PublishReadinessCheck[];
  canPublishSOV: boolean;
  // Actions
  updateBudgetRows: (rows: V3Row[]) => void;
  updatePrimeContractRows: (rows: V3Row[]) => void;
  initializeBlankBudget: () => void;
  commitLine: (rowId: string) => void;
  bulkCommitOpenLines: () => void;
  approveRequest: (requestId: string) => void;
  rejectRequest: (requestId: string, reason: string) => void;
  requestPcValueChange: (newValue: number) => boolean;
  applyPcValueChange: (newValue: number) => void;
  addSovMapping: (mapping: SOVMapping) => void;
  updateSovMapping: (rowId: string, patch: Partial<SOVMapping>) => void;
  confirmSovMapping: (rowId: string) => void;
  confirmAllSovDrafts: () => void;
  removeSovMapping: (rowId: string) => void;
  autoMatchSchedule: () => void;
  confirmScheduleLink: (rowId: string) => void;
  confirmAllScheduleDrafts: () => void;
  updateScheduleLink: (rowId: string, patch: Partial<BudgetScheduleLink>) => void;
  setScheduleLinkMethod: (rowId: string, method: ScheduleDistributionMethod) => void;
  setScheduleAllocations: (rowId: string, allocations: ScheduleAllocation[]) => void;
  removeScheduleLink: (rowId: string) => void;
  publishSOV: () => boolean;
  navigateToSetupStep: (step: FinancialSetupStep, tab?: 'sov' | 'schedule') => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [views, setViews] = useState<View[]>([]);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [defaultViewId, setDefaultViewId] = useState<string>('');
  // Default to the financial setup surface so the app opens on Step 1 (Preliminary Configuration).
  const [activeViewMode, setActiveViewMode] = useState<ViewMode>('spreadsheetV4');
  const [transientView, setTransientView] = useState<View | null>(null);
  
  const [viewManagerShareId, setViewManagerShareId] = useState<string | null>(null);

  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(new Set());
  const [editingCell, setEditingCell] = useState<{ taskId: number; column: string } | null>(null);
  const [detailedTaskId, setDetailedTaskId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [modalState, setModalState] = useState<{ type: 'create' | 'rename'; view?: View } | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [showFieldsMenu, setShowFieldsMenu] = useState(false);
  const [displayHighlights, setDisplayHighlights] = useState<HighlightRule[]>([]);
  const [expansionCycle, setExpansionCycle] = useState(2); // 0: Collapse All, 1: Expand First, 2: Expand All
  const [isViewManagerOpen, setIsViewManagerOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [isContractUploadOpen, setIsContractUploadOpen] = useState(false);
  const [isBudgetUploadOpen, setIsBudgetUploadOpen] = useState(false);
  const [contractLocked, setContractLocked] = useState(false);
  const [financialConfig, setFinancialConfig] = useState<FinancialConfig | null>(null);
  const [financialSetupStep, setFinancialSetupStep] = useState<FinancialSetupStep>(1);
  const [activationState, setActivationState] = useState<FinancialActivationState>('setup');
  const [sovPublished, setSovPublished] = useState(false);
  const [approvalQueue, setApprovalQueue] = useState<ApprovalRequest[]>([]);
  const [sovMappings, setSovMappings] = useState<SOVMapping[]>([]);
  const [budgetScheduleLinks, setBudgetScheduleLinks] = useState<BudgetScheduleLink[]>([]);
  const scheduleTasks = MOCK_SCHEDULE_TASKS;
  const [hubCollapsed, setHubCollapsed] = useState(false);
  const [primeContractSetupPhase, setPrimeContractSetupPhase] = useState<PrimeContractSetupPhase>('choose');
  const [budgetSetupPhase, setBudgetSetupPhase] = useState<BudgetSetupPhase>('choose');
  const [opsActiveTab, setOpsActiveTab] = useState<'sov' | 'schedule'>('sov');
  const [activeFinancialSection, setActiveFinancialSection] = useState<string>('primeContract');

  // Initialize with System Views
  useEffect(() => {
    if (views.length === 0) {
        setViews(INITIAL_SYSTEM_VIEWS);
        const defaultView = INITIAL_SYSTEM_VIEWS.find(v => v.isDefault);
        if (defaultView) {
            setActiveViewId(defaultView.id);
            setActiveViewMode(defaultView.type);
            setDefaultViewId(defaultView.id);
        }
    }
  }, []);

  // Restore persisted financial workflow state
  useEffect(() => {
    const saved = loadFinancialState();
    if (!saved) return;
    if (saved.financialConfig) setFinancialConfig(saved.financialConfig as FinancialConfig);
    if (saved.contractData) {
      setContractData(reviveContractDates(saved.contractData as Record<string, unknown>) as ContractData);
    }
    if (typeof saved.contractLocked === 'boolean') setContractLocked(saved.contractLocked);
    if (saved.financialSetupStep && saved.financialSetupStep >= 1 && saved.financialSetupStep <= 6) {
      setFinancialSetupStep(saved.financialSetupStep as FinancialSetupStep);
    }
    if (saved.activationState) setActivationState(saved.activationState as FinancialActivationState);
    if (typeof saved.sovPublished === 'boolean') setSovPublished(saved.sovPublished);
    if (saved.approvalQueue) setApprovalQueue(saved.approvalQueue as ApprovalRequest[]);
    if (saved.sovMappings) setSovMappings(saved.sovMappings as SOVMapping[]);
    if (saved.budgetScheduleLinks) setBudgetScheduleLinks(saved.budgetScheduleLinks as BudgetScheduleLink[]);
    if (typeof saved.hubCollapsed === 'boolean') setHubCollapsed(saved.hubCollapsed);
    if (saved.primeContractSetupPhase === 'choose' || saved.primeContractSetupPhase === 'review') {
      setPrimeContractSetupPhase(saved.primeContractSetupPhase);
    } else {
      setPrimeContractSetupPhase('choose');
    }
    if (saved.budgetSetupPhase === 'choose' || saved.budgetSetupPhase === 'grid') {
      setBudgetSetupPhase(saved.budgetSetupPhase);
    }
    if (saved.v3Sheets) {
      setTransientView((prev) => ({
        ...(prev ?? { id: 'transient-spreadsheetV4', name: 'Default View', ...getDefaultViewConfig('spreadsheetV4') }),
        v3Sheets: saved.v3Sheets as View['v3Sheets'],
        v3ActiveSheetId: saved.v3ActiveSheetId ?? 'sheet-budget',
        type: 'spreadsheetV4',
      } as View));
      setActiveViewMode('spreadsheetV4');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeView = useMemo<View>(() => {
    if (activeViewId !== null) {
      const foundView = views.find(v => v.id === activeViewId);
      if (foundView) return foundView;
    }
    
    // Fallback to transient view or a stable default
    if (transientView && transientView.type === activeViewMode) {
      return transientView;
    }
    
    return { 
      id: `transient-${activeViewMode}`, 
      name: `Default ${activeViewMode.charAt(0).toUpperCase() + activeViewMode.slice(1)}`, 
      ...getDefaultViewConfig(activeViewMode) 
    } as View;
  }, [views, activeViewId, activeViewMode, transientView]);

  const activeViewRef = useRef<View>(activeView);
  useEffect(() => {
    activeViewRef.current = activeView;
  }, [activeView]);

  // Sync displayHighlights only when switching views, so we don't overwrite
  // the value set by setHighlights when the user picks a color.
  useEffect(() => {
    setDisplayHighlights(activeView.highlights ?? []);
  }, [activeViewId, activeViewMode]);

  const handleSelectView = (viewId: string) => {
    setViews(prev => prev.map(v => ({
        ...v,
        isActive: v.id === viewId
    })));
    const selectedView = views.find(v => v.id === viewId);
    if (selectedView) {
      setActiveViewId(selectedView.id);
      setActiveViewMode(selectedView.type);
      setTransientView(null);
    }
    setDetailedTaskId(null);
  };

  const toggleViewEnabled = (viewId: string, enabled: boolean) => {
      // Safety check: If disabling the current active view, we'll need confirmation (Prompt 6)
      // For now, we just implement the state change stub.
      setViews(prev => prev.map(v => v.id === viewId ? { ...v, isEnabled: enabled } : v));
  };


  const updateView = useCallback((updatedProps: Partial<Omit<View, 'id' | 'name'>>) => {
    if (activeViewId === null) {
      setTransientView(prev => {
        const base = prev ?? activeViewRef.current;
        // Bail out if no properties actually changed
        const hasChanges = Object.entries(updatedProps).some(([key, value]) => (base as any)[key] !== value);
        if (!hasChanges) return prev;
        return { ...base, ...updatedProps };
      });
    } else {
      setViews(prev => prev.map(v => {
        if (v.id !== activeViewId) return v;
        const hasChanges = Object.entries(updatedProps).some(([key, value]) => (v as any)[key] !== value);
        if (!hasChanges) return v;
        return { ...v, ...updatedProps };
      }));
    }
  }, [activeViewId]);

  const setFilters = useCallback((filters: FilterRule[]) => updateView({ filters }), [updateView]);
  const setHighlights = useCallback((highlights: HighlightRule[]) => {
    const next = highlights.length ? [...highlights] : [];
    setDisplayHighlights(next);
    updateView({ highlights: next });
  }, [updateView]);
  const setGroupBy = useCallback((groupBy: string[] | null) => updateView({ groupBy }), [updateView]);
  const setSort = (sort: SortConfig) => updateView({ sort });
  const setColumns = (updater: SetStateAction<View['columns']>) => {
    const newColumns =
      typeof updater === 'function'
        ? updater(activeView.columns)
        : updater;
    updateView({ columns: newColumns });
  };
  const setDisplayDensity = (density: View['displayDensity']) => updateView({ displayDensity: density });
  const setShowGridLines = (show: boolean) => updateView({ showGridLines: show });
  const setShowColoredRows = (show: boolean) => updateView({ showColoredRows: show });
  const setFontSize = (size: number) => updateView({ fontSize: size });

  const handleSort = (columnId: ColumnId) => {
    const newSort: SortConfig = {
        columnId,
        direction: activeView.sort?.columnId === columnId && activeView.sort.direction === 'asc' ? 'desc' : 'asc',
    };
    setSort(newSort);
  };
  
  const handleViewModeChange = (mode: ViewMode) => {
      setActiveViewMode(mode);
      setActiveViewId(null);
      setTransientView({ 
          id: `transient-${Date.now()}`, 
          name: 'Default View', 
          ...getDefaultViewConfig(mode) 
      });
      setDetailedTaskId(null);
  };

  const handleUpdateTask = useCallback((taskId: number, updatedValues: Partial<Omit<Task, 'id' | 'children'>>) => {
      const updateRecursively = (taskItems: Task[]): Task[] => {
          return taskItems.map(task => {
              if (task.id === taskId) {
                  return { ...task, ...updatedValues };
              }
              if (task.children) {
                  return { ...task, children: updateRecursively(task.children) };
              }
              return task;
          });
      };
      setTasks(prev => updateRecursively(prev));
  }, []);

  const handlePriorityChange = useCallback((taskId: number, priority: Priority) => {
    handleUpdateTask(taskId, { priority });
  }, [handleUpdateTask]);

  const handleToggle = useCallback((taskId: number) => {
      const toggleRecursively = (taskItems: Task[]): Task[] => {
          return taskItems.map(task => {
              if (task.id === taskId) {
                  return { ...task, isExpanded: !task.isExpanded };
              }
              if (task.children) {
                  return { ...task, children: toggleRecursively(task.children) };
              }
              return task;
          });
      };
      setTasks(prev => toggleRecursively(prev));
  }, []);

  const handleCycleExpansion = useCallback(() => {
     setExpansionCycle(prev => (prev + 1) % 3);
  }, []);

  const handleSaveView = (name: string) => {
    if (modalState?.type === 'rename' && modalState.view) {
        setViews(views.map(v => v.id === modalState.view!.id ? { ...v, name } : v));
    } else {
        const newView: View = {
             ...activeView,
             id: `view_${Date.now()}`,
             name,
             category: ViewCategory.Personal,
             isEnabled: true,
             isActive: true,
             baseViewType: activeView.type,
             metadata: {
                 ownerId: 'current-user',
                 ownerName: 'You',
                 createdAt: new Date().toISOString()
             }
        };
        
        // Deactivate other views
        const updatedViews = views.map(v => ({ ...v, isActive: false }));
        const newViews = [...updatedViews, newView];
        
        setViews(newViews);
        setActiveViewId(newView.id);
        
        if (newViews.length === 1) {
            setDefaultViewId(newView.id);
        }
    }
    setModalState(null);
  };
  
  const handleDeleteView = (id: string) => {
    const viewToDelete = views.find(v => v.id === id);
    if (!viewToDelete) return;

    const newViews = views.filter(v => v.id !== id);
    setViews(newViews);

    if (defaultViewId === id) {
        setDefaultViewId(newViews.length > 0 ? newViews[0].id : '');
    }

    if (activeViewId === id) {
        const nextViewInMode = newViews.find(v => v.type === viewToDelete.type);
        if (nextViewInMode) {
            setActiveViewId(nextViewInMode.id);
        } else {
            setActiveViewId(null);
            setActiveViewMode(viewToDelete.type);
            setTransientView({ id: `transient-${Date.now()}`, name: `Default ${viewToDelete.type}`, ...getDefaultViewConfig(viewToDelete.type) });
        }
    }
  };

  const detailedTask = useMemo(() => {
    if (!detailedTaskId) return null;
    const findTask = (items: Task[]): Task | null => {
        for (const item of items) {
            if (item.id === detailedTaskId) return item;
            if (item.children) {
                const found = findTask(item.children);
                if (found) return found;
            }
        }
        return null;
    }
    return findTask(tasks);
  }, [tasks, detailedTaskId]);

  const shareView = (viewId: string, sharedWith: 'everyone' | string[]) => {
      setViews(prev => prev.map(v => {
          if (v.id === viewId) {
              return {
                  ...v,
                  metadata: {
                      ...v.metadata,
                      sharedWith,
                      sharedAt: new Date().toISOString()
                  }
              };
          }
          return v;
      }));
  };

  const handleDuplicateView = (viewId: string) => {
      const original = views.find(v => v.id === viewId);
      if (!original) return;

      const newView: View = {
          ...original,
          id: `${original.id}-copy-${Date.now()}`,
          name: `${original.name} (Copy)`,
          category: ViewCategory.Personal,
          baseViewType: original.baseViewType || original.type,
          isDefault: false,
          isActive: false,
          metadata: {
              ...original.metadata,
              createdAt: new Date().toISOString(),
              sharedWith: [], // Copy starts as private
              sharedAt: undefined
          }
      };

      setViews(prev => [...prev, newView]);
      handleSelectView(newView.id);
  };

  const handleRenameView = (viewId: string, newName: string) => {
      setViews(prev => prev.map(v => 
          v.id === viewId ? { ...v, name: newName } : v
      ));
  };

  const saveSystemView = (viewData: Partial<View>) => {
      const isNew = !viewData.id || !views.find(v => v.id === viewData.id);
      if (isNew) {
          const newSystemView: View = {
              id: `system-${Date.now()}`,
              name: viewData.name || 'Untitled System View',
              type: viewData.type || 'table',
              category: ViewCategory.System,
              isEnabled: false,
              isActive: false,
              filters: viewData.filters || [],
              columns: viewData.columns || [],
              groupBy: viewData.groupBy || [],
              sort: (viewData.sort as any) || null,
              isDefault: false,
              displayDensity: 'standard',
              showGridLines: true,
              fontSize: 12,
              showToolbarLabels: true,
              metadata: {
                  ownerName: 'System Admin',
                  createdAt: new Date().toISOString(),
                  sharedWith: 'everyone',
                  isDraft: viewData.metadata?.isDraft ?? false
              }
          };
          setViews(prev => [...prev, newSystemView]);
      } else {
          setViews(prev => prev.map(v => v.id === viewData.id ? { ...v, ...viewData } : v));
      }
  };

  const deleteSystemView = (viewId: string) => {
      setViews(prev => prev.filter(v => v.id !== viewId));
  };

  const handleSaveNewView = (viewData: Partial<View>) => {
      const isNew = !viewData.id || !views.find(v => v.id === viewData.id);
      if (isNew) {
          const newView: View = {
              id: `view-${Date.now()}`,
              name: viewData.name || 'Untitled View',
              type: viewData.type || 'table',
              category: viewData.category || ViewCategory.Personal,
              isEnabled: true,
              isActive: true,
              filters: viewData.filters || [],
              columns: viewData.columns || (activeView?.columns || []),
              groupBy: viewData.groupBy || [],
              sort: (viewData.sort as any) || null,
              isDefault: false,
              displayDensity: 'standard',
              showGridLines: true,
              fontSize: 12,
              showToolbarLabels: true,
              metadata: {
                  ownerId: 'current-user',
                  ownerName: 'You',
                  createdAt: new Date().toISOString(),
                  isDraft: false
              }
          };
          setViews(prev => [...prev.map(v => ({ ...v, isActive: false })), newView]);
          setActiveViewId(newView.id);
      } else {
          setViews(prev => prev.map(v => v.id === viewData.id ? { ...v, ...viewData } : v));
      }
  };

  const budgetRows = useMemo(() => getBudgetRows(activeView.v3Sheets), [activeView.v3Sheets]);
  const primeContractRows = useMemo(() => getPrimeContractRows(activeView.v3Sheets), [activeView.v3Sheets]);
  const lineCounts = useMemo(() => countLinesByState(budgetRows), [budgetRows]);
  const pcValueExists = useMemo(() => hasPcValue(contractData), [contractData]);
  const primeContractState = useMemo(
    () => getPrimeContractState(contractData, contractLocked),
    [contractData, contractLocked]
  );
  const committedCount = useMemo(() => committedLineCount(budgetRows), [budgetRows]);
  const canAccessBudgetFlag = pcValueExists;
  const canAccessOperationsFlag = useMemo(() => hasCommittedLines(budgetRows), [budgetRows]);
  const budgetFullyLocked = useMemo(() => isBudgetFullyLocked(budgetRows), [budgetRows]);
  const financialSetupComplete = activationState === 'activated';
  const publishReadiness = useMemo(
    () =>
      computePublishReadiness(budgetRows, sovMappings, budgetScheduleLinks, approvalQueue, {
        contractLocked,
      }),
    [budgetRows, sovMappings, budgetScheduleLinks, approvalQueue, contractLocked]
  );
  const canPublishSOV = useMemo(() => allPublishChecksMet(publishReadiness), [publishReadiness]);

  const updateBudgetRows = useCallback((rows: V3Row[]) => {
    const sheets = activeViewRef.current.v3Sheets ?? [];
    const budgetSheet = getBudgetSheet(sheets) ?? createEmptyBudgetSheet(financialConfig);
    const withColumns = { ...budgetSheet, columns: createBudgetColumns(financialConfig) };
    const updatedSheets = sheets.some((s) => s.id === withColumns.id)
      ? sheets.map((s) => (s.id === withColumns.id ? { ...withColumns, rows } : s))
      : [...sheets, { ...withColumns, rows }];
    updateView({ v3Sheets: updatedSheets, v3ActiveSheetId: withColumns.id });
  }, [updateView, financialConfig]);

  const updatePrimeContractRows = useCallback((rows: V3Row[]) => {
    const sheets = activeViewRef.current.v3Sheets ?? [];
    const pcSheet = getPrimeContractSheet(sheets) ?? createEmptyPrimeContractSheet();
    // Always normalize to the current column set so previously-persisted sheets
    // (which carried a Cost Code column) drop it — Prime Contract has no cost codes.
    const normalized = { ...pcSheet, columns: DEFAULT_PRIME_CONTRACT_COLUMNS };
    const updatedSheets = sheets.some((s) => s.id === pcSheet.id)
      ? sheets.map((s) => (s.id === pcSheet.id ? { ...normalized, rows } : s))
      : [...sheets, { ...normalized, rows }];
    updateView({ v3Sheets: updatedSheets, v3ActiveSheetId: pcSheet.id });
  }, [updateView]);

  const initializeBlankBudget = useCallback(() => {
    const blankRow: V3Row = { id: `row-${Date.now()}`, cells: {}, lineState: 'open' };
    const sheets = activeViewRef.current.v3Sheets ?? [];
    const budgetSheet = getBudgetSheet(sheets) ?? createEmptyBudgetSheet(financialConfig);
    const updatedSheet = {
      ...budgetSheet,
      columns: createBudgetColumns(financialConfig),
      rows: [blankRow],
    };
    const updatedSheets = sheets.some((s) => s.id === budgetSheet.id)
      ? sheets.map((s) => (s.id === budgetSheet.id ? updatedSheet : s))
      : [...sheets, updatedSheet];
    updateView({ v3Sheets: updatedSheets, v3ActiveSheetId: budgetSheet.id });
  }, [financialConfig, updateView]);

  const enqueueApproval = useCallback((
    type: ApprovalRequest['type'],
    rowIds: string[] | undefined,
    extra: Partial<ApprovalRequest> = {}
  ): ApprovalRequest => {
    const role = financialConfig?.approvalRouting.roles[0] ?? 'gc';
    const req: ApprovalRequest = {
      id: `apr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      rowIds,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      requestedBy: 'You',
      approverRole: role,
      approverName: APPROVER_NAMES[role] ?? role,
      ...extra,
    };
    setApprovalQueue((prev) => [...prev, req]);
    return req;
  }, [financialConfig]);

  const appendDraftSovForRows = useCallback((rowIds: string[]) => {
    if (rowIds.length === 0) return;
    setSovMappings((prev) => {
      const rows = getBudgetRows(activeViewRef.current.v3Sheets);
      let next = [...prev];
      rowIds.forEach((id) => {
        if (next.some((m) => m.rowId === id)) return;
        const row = rows.find((r) => r.id === id);
        if (!row) return;
        next.push(createDraftSovMapping({ ...row, lineState: 'locked' }, next.length + 1));
      });
      return next;
    });
  }, []);

  const commitLine = useCallback((rowId: string) => {
    const perLineApproval = financialConfig?.perLineApprovalEnabled ?? false;
    const rows = getBudgetRows(activeViewRef.current.v3Sheets);
    const target = rows.find((r) => r.id === rowId);
    if (!target || (target.lineState ?? 'open') !== 'open') return;
    if (rowMissingCostCode(target) || rowMissingSubcontractor(target)) return;

    if (perLineApproval) {
      const req = enqueueApproval('line_commit', [rowId], {
        lineDescription: String(target.cells['name'] ?? 'Line item'),
      });
      updateBudgetRows(
        rows.map((r) =>
          r.id === rowId
            ? { ...r, lineState: 'pending_approval' as const, approvalRequestId: req.id }
            : r
        )
      );
    } else {
      updateBudgetRows(
        rows.map((r) => (r.id === rowId ? { ...r, lineState: 'locked' as const } : r))
      );
      appendDraftSovForRows([rowId]);
    }
  }, [financialConfig, enqueueApproval, updateBudgetRows, appendDraftSovForRows]);

  const bulkCommitOpenLines = useCallback(() => {
    const perLineApproval = financialConfig?.perLineApprovalEnabled ?? false;
    const rows = getBudgetRows(activeViewRef.current.v3Sheets);
    const openRows = rows.filter((r) => (r.lineState ?? 'open') === 'open');
    if (openRows.length === 0) return;
    if (openRows.some(rowMissingCostCode) || openRows.some(rowMissingSubcontractor)) return;

    const openIds = openRows.map((r) => r.id);

    if (perLineApproval) {
      const req = enqueueApproval('bulk_line_commit', openIds);
      updateBudgetRows(
        rows.map((r) =>
          openIds.includes(r.id)
            ? { ...r, lineState: 'pending_approval' as const, approvalRequestId: req.id }
            : r
        )
      );
    } else {
      updateBudgetRows(
        rows.map((r) =>
          openIds.includes(r.id) ? { ...r, lineState: 'locked' as const } : r
        )
      );
      appendDraftSovForRows(openIds);
    }
  }, [financialConfig, enqueueApproval, updateBudgetRows, appendDraftSovForRows]);

  const approveRequest = useCallback((requestId: string) => {
    const req = approvalQueue.find((a) => a.id === requestId);
    if (!req || req.status !== 'pending') return;

    setApprovalQueue((prev) =>
      prev.map((a) => (a.id === requestId ? { ...a, status: 'approved' as const } : a))
    );

    if (req.type === 'pc_value_change' && req.proposedPcValue != null) {
      setContractData((prev) =>
        prev ? { ...prev, contractSum: req.proposedPcValue! } : prev
      );
    }

    if (req.type === 'line_commit' || req.type === 'bulk_line_commit') {
      const rowIds = req.rowIds ?? [];
      const rows = getBudgetRows(activeViewRef.current.v3Sheets);
      updateBudgetRows(
        rows.map((r) =>
          rowIds.includes(r.id) ? { ...r, lineState: 'locked' as const } : r
        )
      );
      appendDraftSovForRows(rowIds);
    }
  }, [approvalQueue, updateBudgetRows, appendDraftSovForRows]);

  const rejectRequest = useCallback((requestId: string, reason: string) => {
    const req = approvalQueue.find((a) => a.id === requestId);
    if (!req || req.status !== 'pending') return;

    setApprovalQueue((prev) =>
      prev.map((a) => (a.id === requestId ? { ...a, status: 'rejected' as const, reason } : a))
    );

    if (req.type === 'line_commit' || req.type === 'bulk_line_commit') {
      const rowIds = req.rowIds ?? [];
      const rows = getBudgetRows(activeViewRef.current.v3Sheets);
      updateBudgetRows(
        rows.map((r) =>
          rowIds.includes(r.id)
            ? { ...r, lineState: 'open' as const, approvalRequestId: undefined }
            : r
        )
      );
    }
  }, [approvalQueue, updateBudgetRows]);

  const requestPcValueChange = useCallback((newValue: number): boolean => {
    if (!contractData) return false;
    if (!hasCommittedLines(getBudgetRows(activeViewRef.current.v3Sheets))) {
      setContractData((prev) => (prev ? { ...prev, contractSum: newValue } : prev));
      return true;
    }
    enqueueApproval('pc_value_change', undefined, {
      currentPcValue: contractData.contractSum ?? 0,
      proposedPcValue: newValue,
    });
    return false;
  }, [contractData, enqueueApproval]);

  const applyPcValueChange = useCallback((newValue: number) => {
    setContractData((prev) => (prev ? { ...prev, contractSum: newValue } : prev));
  }, []);

  const addSovMapping = useCallback((mapping: SOVMapping) => {
    setSovMappings((prev) => [...prev.filter((m) => m.rowId !== mapping.rowId), mapping]);
  }, []);

  const updateSovMapping = useCallback((rowId: string, patch: Partial<SOVMapping>) => {
    setSovMappings((prev) =>
      prev.map((m) => (m.rowId === rowId ? { ...m, ...patch } : m))
    );
  }, []);

  const confirmSovMapping = useCallback((rowId: string) => {
    setSovMappings((prev) =>
      prev.map((m) =>
        m.rowId === rowId ? { ...m, status: 'confirmed' as const } : m
      )
    );
  }, []);

  const confirmAllSovDrafts = useCallback(() => {
    setSovMappings((prev) =>
      prev.map((m) =>
        (m.status ?? 'confirmed') === 'draft' ? { ...m, status: 'confirmed' as const } : m
      )
    );
  }, []);

  const removeSovMapping = useCallback((rowId: string) => {
    setSovMappings((prev) => prev.filter((m) => m.rowId !== rowId));
  }, []);

  // ── Budget → Schedule linking ─────────────────────────────────────────────
  const committedRows = useMemo(
    () => budgetRows.filter((r) => (r.lineState ?? 'open') === 'locked'),
    [budgetRows]
  );

  // Keep one link per committed line: auto-match new lines, preserve user edits, drop removed.
  useEffect(() => {
    setBudgetScheduleLinks((prev) => syncScheduleLinks(committedRows, scheduleTasks, prev));
  }, [committedRows, scheduleTasks]);

  const autoMatchSchedule = useCallback(() => {
    setBudgetScheduleLinks(() => syncScheduleLinks(committedRows, scheduleTasks, []));
  }, [committedRows, scheduleTasks]);

  const confirmScheduleLink = useCallback((rowId: string) => {
    setBudgetScheduleLinks((prev) =>
      prev.map((link) => {
        if (link.budgetRowId !== rowId) return link;
        const row = committedRows.find((r) => r.id === rowId);
        const amount = row ? getBudgetLineAmount(row) : 0;
        if (!isLinkFullyAllocated(link, amount)) return link;
        return { ...link, status: 'confirmed' as const };
      })
    );
  }, [committedRows]);

  const confirmAllScheduleDrafts = useCallback(() => {
    setBudgetScheduleLinks((prev) =>
      prev.map((link) => {
        if (link.status !== 'draft') return link;
        const row = committedRows.find((r) => r.id === link.budgetRowId);
        const amount = row ? getBudgetLineAmount(row) : 0;
        return isLinkFullyAllocated(link, amount) ? { ...link, status: 'confirmed' as const } : link;
      })
    );
  }, [committedRows]);

  const updateScheduleLink = useCallback((rowId: string, patch: Partial<BudgetScheduleLink>) => {
    setBudgetScheduleLinks((prev) =>
      prev.map((link) => (link.budgetRowId === rowId ? { ...link, ...patch } : link))
    );
  }, []);

  const setScheduleLinkMethod = useCallback((rowId: string, method: ScheduleDistributionMethod) => {
    setBudgetScheduleLinks((prev) =>
      prev.map((link) => {
        if (link.budgetRowId !== rowId) return link;
        const row = committedRows.find((r) => r.id === rowId);
        const amount = row ? getBudgetLineAmount(row) : 0;
        const groupTasks = scheduleTasks.filter(
          (t) => t.costCode.trim() === link.costCode && link.costCode !== ''
        );
        let allocations = link.allocations;
        if (method === 'by_hours') allocations = distributeByHours(amount, groupTasks);
        else if (method === 'equal') allocations = distributeEqual(amount, groupTasks);
        else if (method === 'level_of_effort') allocations = [];
        // 'manual' keeps existing allocations for hand-editing.
        return { ...link, method, allocations, status: 'draft' as const };
      })
    );
  }, [committedRows, scheduleTasks]);

  const setScheduleAllocations = useCallback((rowId: string, allocations: ScheduleAllocation[]) => {
    setBudgetScheduleLinks((prev) =>
      prev.map((link) =>
        link.budgetRowId === rowId
          ? { ...link, method: 'manual' as const, allocations, status: 'draft' as const }
          : link
      )
    );
  }, []);

  const removeScheduleLink = useCallback((rowId: string) => {
    setBudgetScheduleLinks((prev) => prev.filter((l) => l.budgetRowId !== rowId));
  }, []);

  useEffect(() => {
    setSovMappings((prev) => syncDraftSovMappings(committedRows, prev));
  }, [committedRows]);

  const publishSOV = useCallback((): boolean => {
    const rows = getBudgetRows(activeViewRef.current.v3Sheets);
    if (
      !contractLocked ||
      !isBudgetFullyLocked(rows) ||
      !allPublishChecksMet(
        computePublishReadiness(rows, sovMappings, budgetScheduleLinks, approvalQueue, { contractLocked })
      )
    ) {
      return false;
    }
    // Publishing finalizes the SOV — every draft line becomes confirmed.
    setSovMappings((prev) => prev.map((m) => ({ ...m, status: 'confirmed' as const })));
    setSovPublished(true);
    setActivationState('activated');
    setFinancialSetupStep(6);
    setHubCollapsed(true);
    return true;
  }, [contractLocked, sovMappings, budgetScheduleLinks, approvalQueue]);

  const navigateToSetupStep = useCallback((step: FinancialSetupStep, tab?: 'sov' | 'schedule') => {
    setFinancialSetupStep(step);
    if (tab) setOpsActiveTab(tab);
    setHubCollapsed(false);
  }, []);

  useEffect(() => {
    if (activationState === 'activated') return;
    if (sovPublished) {
      setActivationState('activated');
    } else if (hasCommittedLines(budgetRows) || pcValueExists) {
      setActivationState('operating');
    } else {
      setActivationState('setup');
    }
  }, [budgetRows, pcValueExists, sovPublished, activationState]);

  useEffect(() => {
    saveFinancialState({
      financialConfig,
      contractData,
      contractLocked,
      financialSetupStep,
      activationState,
      sovPublished,
      approvalQueue,
      sovMappings,
      budgetScheduleLinks,
      hubCollapsed,
      primeContractSetupPhase,
      budgetSetupPhase,
      v3Sheets: activeView.v3Sheets ?? null,
      v3ActiveSheetId: activeView.v3ActiveSheetId ?? null,
    });
  }, [
    financialConfig,
    contractData,
    contractLocked,
    financialSetupStep,
    activationState,
    sovPublished,
    approvalQueue,
    sovMappings,
    budgetScheduleLinks,
    hubCollapsed,
    primeContractSetupPhase,
    budgetSetupPhase,
    activeView.v3Sheets,
    activeView.v3ActiveSheetId,
  ]);

  const value: ProjectContextType = {
    tasks, setTasks,
    views, setViews,
    activeViewId,
    handleSelectView,
    defaultViewId, setDefaultViewId,
    activeViewMode, handleViewModeChange,
    selectedTaskIds, setSelectedTaskIds,
    editingCell, setEditingCell,
    detailedTaskId, setDetailedTaskId,
    searchTerm, setSearchTerm,
    modalState, setModalState,
    showFilterMenu, setShowFilterMenu,
    showHighlightMenu, setShowHighlightMenu,
    showGroupMenu, setShowGroupMenu,
    showFieldsMenu, setShowFieldsMenu,
    activeView,
    displayHighlights,
    updateView,
    setFilters,
    setHighlights,
    setGroupBy,
    setSort,
    setColumns,
    setDisplayDensity,
    setShowGridLines,
    setShowColoredRows,
    setFontSize,
    setShowToolbarLabels: (show: boolean) => updateView({ showToolbarLabels: show }),
    isPDFModalOpen,
    setIsPDFModalOpen,
    handleSort,
    handleUpdateTask,
    handlePriorityChange,
    handleToggle,
    handleSaveView,
    handleDeleteView,
    expansionCycle,
    handleCycleExpansion,
    detailedTask,
    isViewManagerOpen,
    setIsViewManagerOpen,
    toggleViewEnabled,
    userRole: 'admin', // Changed to admin for testing the new flow
    shareView,
    reorderViews: (newViews: View[]) => setViews(newViews),
    viewManagerShareId,
    setViewManagerShareId,
    handleDuplicateView,
    handleRenameView,
    saveSystemView,
    deleteSystemView,
    handleSaveNewView,
    isDownloadModalOpen,
    setIsDownloadModalOpen,
    contractData,
    setContractData,
    isContractUploadOpen,
    setIsContractUploadOpen,
    isBudgetUploadOpen,
    setIsBudgetUploadOpen,
    contractLocked,
    setContractLocked,
    financialConfig,
    setFinancialConfig,
    financialSetupStep,
    setFinancialSetupStep,
    activationState,
    sovPublished,
    approvalQueue,
    sovMappings,
    budgetScheduleLinks,
    scheduleTasks,
    hubCollapsed,
    setHubCollapsed,
    primeContractSetupPhase,
    setPrimeContractSetupPhase,
    budgetSetupPhase,
    setBudgetSetupPhase,
    opsActiveTab,
    setOpsActiveTab,
    activeFinancialSection,
    setActiveFinancialSection,
    hasPcValue: pcValueExists,
    primeContractState,
    budgetRows,
    primeContractRows,
    lineCounts,
    committedLineCount: committedCount,
    canAccessBudget: canAccessBudgetFlag,
    canAccessOperations: canAccessOperationsFlag,
    budgetFullyLocked,
    financialSetupComplete,
    publishReadiness,
    canPublishSOV,
    updateBudgetRows,
    updatePrimeContractRows,
    initializeBlankBudget,
    commitLine,
    bulkCommitOpenLines,
    approveRequest,
    rejectRequest,
    requestPcValueChange,
    applyPcValueChange,
    addSovMapping,
    updateSovMapping,
    confirmSovMapping,
    confirmAllSovDrafts,
    removeSovMapping,
    autoMatchSchedule,
    confirmScheduleLink,
    confirmAllScheduleDrafts,
    updateScheduleLink,
    setScheduleLinkMethod,
    setScheduleAllocations,
    removeScheduleLink,
    publishSOV,
    navigateToSetupStep,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

export const useProject = () => {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
};