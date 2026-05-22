import React, { createContext, useState, useMemo, useCallback, useContext, useRef, useEffect, SetStateAction, ReactNode } from 'react';
import { MOCK_TASKS, MOCK_BUDGET_DATA } from '../data';
import { Task, View, FilterRule, HighlightRule, Priority, ColumnId, Status, DisplayDensity, Column, ViewMode, ViewCategory, ContractData, FinancialConfig, FinancialSetupStep } from '../types';
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
  contractConfirmed: boolean;
  setContractConfirmed: (confirmed: boolean) => void;
  contractLocked: boolean;
  setContractLocked: React.Dispatch<SetStateAction<boolean>>;
  financialConfig: FinancialConfig | null;
  setFinancialConfig: React.Dispatch<SetStateAction<FinancialConfig | null>>;
  financialSetupStep: FinancialSetupStep;
  setFinancialSetupStep: React.Dispatch<SetStateAction<FinancialSetupStep>>;
  budgetLocked: boolean;
  setBudgetLocked: React.Dispatch<SetStateAction<boolean>>;
  isManualEntryOpen: boolean;
  setIsManualEntryOpen: (open: boolean) => void;
  financialSetupComplete: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [views, setViews] = useState<View[]>([]);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [defaultViewId, setDefaultViewId] = useState<string>('');
  const [activeViewMode, setActiveViewMode] = useState<ViewMode>('table');
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
  const [contractConfirmed, setContractConfirmed] = useState(false);
  const [contractLocked, setContractLocked] = useState(false);
  const [financialConfig, setFinancialConfig] = useState<FinancialConfig | null>(null);
  const [financialSetupStep, setFinancialSetupStep] = useState<FinancialSetupStep>(0);
  const [budgetLocked, setBudgetLocked] = useState(false);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);

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
    contractConfirmed,
    setContractConfirmed,
    contractLocked,
    setContractLocked,
    financialConfig,
    setFinancialConfig,
    financialSetupStep,
    setFinancialSetupStep,
    budgetLocked,
    setBudgetLocked,
    isManualEntryOpen,
    setIsManualEntryOpen,
    get financialSetupComplete() { return this.financialSetupStep === 6; }
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