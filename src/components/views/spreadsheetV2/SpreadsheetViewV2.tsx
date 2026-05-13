import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { BudgetLineItem, BudgetLineItemStyle, SpreadsheetColumn } from '../../../types';
import { useProject } from '../../../context/ProjectContext';
import SpreadsheetToolbar from './components/SpreadsheetToolbar';
import SpreadsheetHeader from './components/SpreadsheetHeader';
import SpreadsheetRowV2 from './components/SpreadsheetRowV2';
import { ContextMenu, ContextMenuItem } from '../../common/ui/ContextMenu';
import { ScissorsIcon, CopyIcon, ClipboardIcon, TrashIcon, PlusIcon, FillColorIcon, BorderColorIcon, TextColorIcon } from '../../common/Icons';
import { SPREADSHEET_INDEX_COLUMN_WIDTH } from '../../../constants/spreadsheetLayout';
import { checkFilterMatch } from '../../../lib/utils';
import ColorPicker from '../../common/ui/ColorPicker';
import { BACKGROUND_COLORS, TEXT_BORDER_COLORS } from '../../../constants/designTokens';

const formatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return '';
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export type SpreadsheetRowType = 'parent' | 'child' | 'summary';

interface FlattenedRow {
    item: BudgetLineItem;
    level: number;
    type: SpreadsheetRowType;
    parentId?: string;
}

const SpreadsheetViewV2: React.FC = () => {
  const { activeView, displayHighlights, updateView, searchTerm, handleSort } = useProject();
  
  const rawBudgetData = useMemo(() => activeView.spreadsheetData || [], [activeView.spreadsheetData]);
  const columns = useMemo(() => {
      const cols = activeView.spreadsheetColumns || [];
      return cols.filter(c => c.visible !== false);
  }, [activeView.spreadsheetColumns]);
  const displayDensity = activeView.displayDensity;


  // Implement Sorting
  const sortedData = useMemo(() => {
      if (!activeView.sort) return rawBudgetData;
      
      const { columnId, direction } = activeView.sort;
      
      const sortRecursive = (items: BudgetLineItem[]): BudgetLineItem[] => {
          const sorted = [...items].sort((a, b) => {
              const valA = a[columnId as keyof BudgetLineItem];
              const valB = b[columnId as keyof BudgetLineItem];

              if (valA === valB) return 0;
              if (valA === null || valA === undefined) return 1;
              if (valB === null || valB === undefined) return -1;

              if (valA < valB) return direction === 'asc' ? -1 : 1;
              return direction === 'asc' ? 1 : -1;
          });
          
          return sorted.map(item => {
              if (item.children && item.children.length > 0) {
                  return { ...item, children: sortRecursive(item.children) };
              }
              return item;
          });
      };
      
      return sortRecursive(rawBudgetData);
  }, [rawBudgetData, activeView.sort]);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(
      rawBudgetData.filter(item => item.isExpanded).map(item => item.id)
  ));

  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [focusedCell, setFocusedCell] = useState<{ rowId: string; colId: string; type: SpreadsheetRowType } | null>(null);
  const [editingCell, setEditingCell] = useState<{ rowId: string; colId: string; initialValue?: string } | null>(null);
  const [scrollState, setScrollState] = useState({ isAtStart: true, isAtEnd: false, isScrolledTop: false });
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const toolbarCheckboxRef = useRef<HTMLInputElement>(null);
  const [resizingColumnId, setResizingColumnId] = useState<string | null>(null);
  const activeResizerId = useRef<string | null>(null);
  const { expansionCycle } = useProject();

  // Handle Expansion Cycle
  useEffect(() => {
      if (expansionCycle === 0) {
          setExpandedIds(new Set());
      } else if (expansionCycle === 1) {
          // Expand only the first level
          const firstLevelIds = visibleData.filter(d => d.level === 0 && d.item.children && d.item.children.length > 0).map(d => d.item.id);
          setExpandedIds(new Set(firstLevelIds));
      } else if (expansionCycle === 2) {
          // Expand all
          const allParentIds: string[] = [];
          const recurse = (items: BudgetLineItem[]) => {
              items.forEach(item => {
                  if (item.children && item.children.length > 0) {
                      allParentIds.push(item.id);
                      recurse(item.children);
                  }
              });
          };
          // We need to know ALL items, not just visible ones.
          // Actually, using the groupedTree if grouping is active, or sortedData if not.
          // This is a bit complex to do perfectly here without re-calculating everything.
          // For now, expand everything currently in the flattened list that has children.
          const currentVisibleParentIds = visibleData.filter(d => d.item.children && d.item.children.length > 0).map(d => d.item.id);
          setExpandedIds(new Set(currentVisibleParentIds));
          // Note: In Expand All, we might need multiple passes if expanding reveals more parents.
      }
  }, [expansionCycle]);

  const [contextMenu, setContextMenu] = useState<{
      visible: boolean;
      position: { x: number; y: number };
      type: 'row' | 'column' | 'cell';
      targetId: string;
      secondaryId?: string;
  } | null>(null);

  const [clipboard, setClipboard] = useState<BudgetLineItem[] | null>(null);

  // Flatten & Group logic
  const visibleData = useMemo(() => {
    const flattened: FlattenedRow[] = [];
    const groupByCols = activeView.groupBy || [];
    const filters = activeView.filters || [];
    
    // Normal non-grouped flattening
    if (groupByCols.length === 0) {
        const recurse = (items: BudgetLineItem[], level: number, parentId?: string) => {
            items.forEach(item => {
                const hasChildren = !!item.children && item.children.length > 0;
                const isExpanded = expandedIds.has(item.id);
                
                // Filtering
                const matchesFilters = filters.every(f => checkFilterMatch((item as any)[f.columnId], f.operator, f.value));
                const matchesSearch = !searchTerm || 
                    Object.values(item).some(v => v !== null && String(v).toLowerCase().includes(searchTerm.toLowerCase()));
                
                const isVisible = (matchesFilters && matchesSearch) || (hasChildren && item.children?.some(c => {
                    const cMatchesFilters = filters.every(f => checkFilterMatch((c as any)[f.columnId], f.operator, f.value));
                    const cMatchesSearch = !searchTerm || Object.values(c).some(v => v !== null && String(v).toLowerCase().includes(searchTerm.toLowerCase()));
                    return cMatchesFilters && cMatchesSearch;
                }));

                if (isVisible) {
                    flattened.push({ item, level, type: parentId ? 'child' : 'parent', parentId });
                    
                    if (hasChildren && isExpanded) {
                        recurse(item.children!, level + 1, item.id);
                        flattened.push({ 
                            item, 
                            level: level + 1, 
                            type: 'summary',
                            parentId: item.id
                        });
                    }
                }
            });
        };
        recurse(sortedData, 0);
        return flattened;
    }

    // Grouping active
    const allFilteredItems: BudgetLineItem[] = [];
    const extractAndFilterItems = (items: BudgetLineItem[]) => {
        items.forEach(item => {
            const matchesFilters = filters.every(f => checkFilterMatch((item as any)[f.columnId], f.operator, f.value));
            const matchesSearch = !searchTerm || 
                    Object.values(item).some(v => v !== null && String(v).toLowerCase().includes(searchTerm.toLowerCase()));
            
            if (matchesFilters && matchesSearch) {
                 allFilteredItems.push({ ...item, children: undefined });
            }
            if (item.children) extractAndFilterItems(item.children); // Flatten fully but filter individuals
        });
    };
    extractAndFilterItems(sortedData);

    const groupItemsRecursive = (items: BudgetLineItem[], groupColIndex: number, currentPath: string): BudgetLineItem[] => {
        if (groupColIndex >= groupByCols.length) return items;
        const groupRule = groupByCols[groupColIndex];
        const colId = groupRule.columnId;
        
        const groups = new Map<string, BudgetLineItem[]>();
        
        items.forEach(item => {
            let val = (item as any)[colId];
            const targetCol = columns.find(c => c.id === colId);
            const colLabel = targetCol?.label || colId;
            if (val === null || val === undefined || val === '') val = `No ${colLabel}`;
            const strVal = String(val);
            if (!groups.has(strVal)) groups.set(strVal, []);
            groups.get(strVal)!.push(item);
        });

        const sortedGroupKeys = Array.from(groups.keys()).sort((a, b) => {
            const numA = parseFloat(a.replace(/[^0-9.-]+/g, ""));
            const numB = parseFloat(b.replace(/[^0-9.-]+/g, ""));
            if (!isNaN(numA) && !isNaN(numB)) return groupRule.direction === 'asc' ? numA - numB : numB - numA;
            return groupRule.direction === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
        });

        const groupedResult: BudgetLineItem[] = [];
        let sNoCounter = 1;
        
        sortedGroupKeys.forEach((val) => {
            const itemsInGroup = groups.get(val)!;
            const groupId = `group-${currentPath}-${colId}-${val}`;
            const targetCol = columns.find(c => c.id === colId);
            
            // Sub-group items
            const childGroupsOrItems = groupItemsRecursive(itemsInGroup, groupColIndex + 1, `${currentPath}-${val}`);
            
            // Calculate totals for this group header
            const sums: any = { remainingContract: 0, effortHours: 0, totalBudget: 0, labor: 0, material: 0, equipment: 0, subcontractor: 0, others: 0, overhead: 0, profit: 0 };
            itemsInGroup.forEach((it: any) => {
                ['remainingContract', 'effortHours', 'totalBudget', 'labor', 'material', 'equipment', 'subcontractor', 'others', 'overhead', 'profit'].forEach(k => {
                    sums[k] += (it[k] || 0);
                });
            });

            const syntheticGroup: BudgetLineItem = {
                ...sums,
                id: groupId,
                sNo: sNoCounter++,
                name: `${targetCol?.label || colId}: ${val} (${itemsInGroup.length})`,
                quantity: null,
                unit: '',
                children: childGroupsOrItems
            };

            groupedResult.push(syntheticGroup);
        });

        return groupedResult;
    };

    const groupedTree = groupItemsRecursive(allFilteredItems, 0, 'root');

    const recurseGroups = (items: BudgetLineItem[], level: number, parentId?: string) => {
        items.forEach(item => {
            const hasChildren = !!item.children && item.children.length > 0;
            const isSyntheticGroup = item.id.startsWith('group-');
            const rowType = isSyntheticGroup ? 'parent' : 'child';
            const isExpanded = expandedIds.has(item.id);

            flattened.push({ item, level, type: rowType, parentId });
            
            if (hasChildren && isExpanded) {
                recurseGroups(item.children!, level + 1, item.id);
                if (isSyntheticGroup) {
                    flattened.push({ 
                        item, 
                        level: level + 1, 
                        type: 'summary',
                        parentId: item.id
                    });
                }
            }
        });
    };

    recurseGroups(groupedTree, 0);
    return flattened;
  }, [sortedData, expandedIds, searchTerm, activeView.groupBy, activeView.filters, columns]);

  // Selection Logic
  const selectableRows = useMemo(() => visibleData.filter(d => d.type !== 'summary'), [visibleData]);
  const isAllSelected = selectableRows.length > 0 && selectableRows.every(d => selectedRowIds.has(d.item.id));
  const isSomeSelected = !isAllSelected && selectableRows.some(d => selectedRowIds.has(d.item.id));

  useEffect(() => {
    if (!editingCell && containerRef.current) {
        containerRef.current.focus({ preventScroll: true });
    }
  }, [editingCell]);

  useEffect(() => {
    if (toolbarCheckboxRef.current) toolbarCheckboxRef.current.indeterminate = isSomeSelected;
  }, [isSomeSelected]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    const handleScroll = () => {
        if (container) {
            setScrollState({ 
                isAtStart: container.scrollLeft <= 2, 
                isAtEnd: container.scrollLeft + container.clientWidth >= container.scrollWidth - 2,
                isScrolledTop: container.scrollTop > 0
            });
        }
    };
    container?.addEventListener('scroll', handleScroll);
    setTimeout(handleScroll, 100); 
    return () => container?.removeEventListener('scroll', handleScroll);
  }, [visibleData, columns]);

  const handleToggleAll = () => {
    if (isAllSelected) setSelectedRowIds(new Set());
    else setSelectedRowIds(new Set(selectableRows.map(d => d.item.id)));
  };

  const handleToggleRow = (id: string) => {
    setSelectedRowIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        return newSet;
    });
  };

  const handleToggleExpand = (id: string) => {
      setExpandedIds(prev => {
          const newSet = new Set(prev);
          if (newSet.has(id)) newSet.delete(id);
          else newSet.add(id);
          return newSet;
      });
  };

  const handleRowHeaderClick = (id: string, multiSelect: boolean) => {
    setFocusedCell(null);
    setSelectedRowIds(prev => {
      const newSet = multiSelect ? new Set(prev) : new Set<string>();
      if (prev.has(id) && multiSelect) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleCellClick = (rowId: string, colId: string, type: SpreadsheetRowType) => {
      setFocusedCell({ rowId, colId, type });
      setSelectedRowIds(new Set()); 
      containerRef.current?.focus();
  };

  const moveFocus = useCallback((currentRowId: string, currentColId: string, currentType: SpreadsheetRowType, direction: 'up' | 'down' | 'left' | 'right') => {
      const rowIndex = visibleData.findIndex(d => d.item.id === currentRowId && d.type === currentType);
      const colIndex = columns.findIndex(c => c.id === currentColId);
      if (rowIndex === -1 || colIndex === -1) return;

      let nextRowIndex = rowIndex;
      let nextColIndex = colIndex;

      switch (direction) {
          case 'up': nextRowIndex = Math.max(0, rowIndex - 1); break;
          case 'down': nextRowIndex = Math.min(visibleData.length - 1, rowIndex + 1); break;
          case 'left': nextColIndex = Math.max(0, colIndex - 1); break;
          case 'right': nextColIndex = Math.min(columns.length - 1, colIndex + 1); break;
      }

      const nextRow = visibleData[nextRowIndex];
      setFocusedCell({ rowId: nextRow.item.id, colId: columns[nextColIndex].id, type: nextRow.type });
  }, [visibleData, columns]);

  const handleUpdateCellValue = (rowId: string, colId: string, value: any, direction?: 'up' | 'down' | 'left' | 'right') => {
      const costComponents = ['labor', 'material', 'equipment', 'subcontractor', 'others', 'overhead', 'profit'];
      
      const updateRecursively = (items: BudgetLineItem[]): BudgetLineItem[] => {
          return items.map(item => {
              // If this is the parent or a parent containing the child being edited
              const isTargetRow = item.id === rowId;
              const hasTargetChild = item.children?.some(c => c.id === rowId);

              if (isTargetRow) {
                  // Direct update of parent fields or child fields (if child edited)
                  if (costComponents.includes(colId)) {
                      const oldValue = parseFloat(String((item as any)[colId] || 0).replace(/,/g, ''));
                      const newValue = value === null || value === '' ? 0 : parseFloat(String(value).replace(/,/g, ''));
                      const diff = newValue - oldValue;
                      
                      // If it's a root parent being edited directly
                      const updatedItem = { 
                          ...item, 
                          [colId]: newValue,
                          totalBudget: (item.totalBudget || 0) + diff,
                          remainingContract: (item.remainingContract || 0) - diff
                      };
                      return updatedItem;
                  }
                  return { ...item, [colId]: value };
              }

              if (hasTargetChild && costComponents.includes(colId)) {
                  // Handle child update within this parent
                  const updatedChildren = item.children!.map(child => {
                      if (child.id === rowId) {
                          const oldValue = parseFloat(String((child as any)[colId] || 0).replace(/,/g, ''));
                          const newValue = value === null || value === '' ? 0 : parseFloat(String(value).replace(/,/g, ''));
                          const diff = newValue - oldValue;

                          return { 
                              ...child, 
                              [colId]: newValue,
                              totalBudget: (child.totalBudget || 0) + diff,
                              // Child row's remainingContract is ignored in logic
                              diffForParent: diff 
                          };
                      }
                      return child;
                  });

                  const totalDiff = updatedChildren.reduce((sum, c) => sum + ((c as any).diffForParent || 0), 0);
                  
                  // Clean up temporary field
                  updatedChildren.forEach(c => delete (c as any).diffForParent);

                  return {
                      ...item,
                      children: updatedChildren,
                      remainingContract: (item.remainingContract || 0) - totalDiff
                  };
              }

              if (item.children) {
                  return { ...item, children: updateRecursively(item.children) };
              }
              return item;
          });
      };
      
      updateView({ spreadsheetData: updateRecursively(rawBudgetData) });

      if (direction && focusedCell) {
          moveFocus(rowId, colId, focusedCell.type, direction);
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (editingCell) return; 
      if (!focusedCell) return;

      const rowIndex = visibleData.findIndex(d => d.item.id === focusedCell.rowId && d.type === focusedCell.type);
      const colIndex = columns.findIndex(c => c.id === focusedCell.colId);
      if (rowIndex === -1 || colIndex === -1) return;

      const move = (rDir: number, cDir: number) => {
          e.preventDefault();
          let nextRowIndex = rowIndex + rDir;
          let nextColIndex = colIndex + cDir;

          if (e.key === 'Tab') {
              if (!e.shiftKey) {
                  if (nextColIndex >= columns.length) {
                      nextColIndex = 0;
                      nextRowIndex++;
                  }
              } else {
                  if (nextColIndex < 0) {
                      nextColIndex = columns.length - 1;
                      nextRowIndex--;
                  }
              }
          }

          nextRowIndex = Math.max(0, Math.min(visibleData.length - 1, nextRowIndex));
          nextColIndex = Math.max(0, Math.min(columns.length - 1, nextColIndex));

          const nextRow = visibleData[nextRowIndex];
          setFocusedCell({ rowId: nextRow.item.id, colId: columns[nextColIndex].id, type: nextRow.type });
      };

      switch (e.key) {
          case 'ArrowUp': move(-1, 0); break;
          case 'ArrowDown': move(1, 0); break;
          case 'ArrowLeft': move(0, -1); break;
          case 'ArrowRight': move(0, 1); break;
          case 'Tab': move(0, e.shiftKey ? -1 : 1); break;
          case 'Enter': 
              e.preventDefault();
              const col = columns[colIndex];
              const row = visibleData[rowIndex];
              if (row.type !== 'summary' && col.editable) {
                  setEditingCell({ rowId: row.item.id, colId: col.id });
              }
              break;
          case 'Delete':
          case 'Backspace':
              const targetRow = visibleData[rowIndex];
              if (targetRow.type !== 'summary' && columns[colIndex].editable) {
                handleUpdateCellValue(targetRow.item.id, columns[colIndex].id, columns[colIndex].align === 'right' ? null : '');
              }
              break;
          default:
              if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                  const targetRow = visibleData[rowIndex];
                  if (targetRow.type !== 'summary' && columns[colIndex].editable) {
                      setEditingCell({ rowId: targetRow.item.id, colId: columns[colIndex].id, initialValue: e.key });
                  }
              }
              break;
      }
  };

  const handleContextMenu = useCallback((e: React.MouseEvent, type: 'row' | 'column' | 'cell', targetId: string, secondaryId?: string) => {
      e.preventDefault();
      if (type === 'row' && !selectedRowIds.has(targetId)) handleRowHeaderClick(targetId, false);
      else if (type === 'cell' && secondaryId) handleCellClick(targetId, secondaryId, 'child'); 
      setContextMenu({ visible: true, position: { x: e.clientX, y: e.clientY }, type, targetId, secondaryId });
  }, [selectedRowIds]);

  const handleBulkStyleUpdate = (newStyle: Partial<BudgetLineItemStyle>, targetIds?: Set<string>) => {
    const idsToUpdate = targetIds || selectedRowIds;
    const updateRecursive = (items: BudgetLineItem[]): BudgetLineItem[] => items.map(item => {
        let newItem = item;
        if (idsToUpdate.has(item.id)) {
            const mergedStyle = { ...(item.style || {}), ...newStyle };
            Object.keys(newStyle).forEach(key => {
                if ((newStyle as any)[key] === undefined) delete (mergedStyle as any)[key];
            });
            newItem = { ...item, style: mergedStyle };
        }
        if (newItem.children) newItem = { ...newItem, children: updateRecursive(newItem.children) };
        return newItem;
    });
    updateView({ spreadsheetData: updateRecursive(rawBudgetData) });
  };

  const handleCellStyleUpdate = (rowId: string, colId: string, newStyle: Partial<BudgetLineItemStyle>) => {
      // Create a deep copy to avoid any potential memoization/reference issues
      const clonedData = JSON.parse(JSON.stringify(rawBudgetData));
      
      const updateRecursive = (items: BudgetLineItem[]): BudgetLineItem[] => items.map(item => {
          if (item.id === rowId) {
              const currentCellStyles = item.cellStyles || {};
              const currentCellStyle = currentCellStyles[colId] || {};
              const mergedStyle = { ...currentCellStyle, ...newStyle };
              
              // Filter out undefined if we want to remove styles
              const finalMergedStyle: any = { ...mergedStyle };
              Object.keys(newStyle).forEach(key => {
                  if ((newStyle as any)[key] === undefined) delete finalMergedStyle[key];
              });

              return {
                  ...item,
                  cellStyles: {
                      ...currentCellStyles,
                      [colId]: finalMergedStyle
                  }
              };
          }
          if (item.children && item.children.length > 0) {
              return { 
                  ...item, 
                  children: updateRecursive(item.children) 
              };
          }
          return item;
      });

      const newData = updateRecursive(clonedData);
      updateView({ spreadsheetData: newData });
  };

  const handleAddSubRow = (parentId: string) => {
    const parentRow = rawBudgetData.find(r => r.id === parentId);
    if (parentRow) {
        const newSubRow: BudgetLineItem = {
            id: `subrow-${Date.now()}`,
            sNo: parentRow.children ? parentRow.children.length + 1 : 1,
            name: 'New Sub-item',
            quantity: 0,
            unit: 'EA',
            effortHours: 0,
            totalBudget: 0,
            labor: 0,
            equipment: 0,
            subcontractor: 0,
            material: 0,
            others: 0,
            remainingContract: 0,
            style: {},
            cellStyles: {}
        };
        
        const updateRecursive = (items: BudgetLineItem[]): BudgetLineItem[] => items.map(item => {
            if (item.id === parentId) {
                return { 
                    ...item, 
                    children: [...(item.children || []), newSubRow],
                    isExpanded: true 
                };
            }
            if (item.children) return { ...item, children: updateRecursive(item.children) };
            return item;
        });

        updateView({ spreadsheetData: updateRecursive(rawBudgetData) });
        setExpandedIds(prev => new Set([...prev, parentId]));
    }
  };

  const handleDeleteRow = (targetIds?: Set<string>) => {
      const idsToDelete = targetIds || selectedRowIds;
      if (idsToDelete.size === 0 && contextMenu?.targetId) {
          idsToDelete.add(contextMenu.targetId);
      }
      
      const filterRecursive = (items: BudgetLineItem[]): BudgetLineItem[] => {
          return items.filter(item => !idsToDelete.has(item.id)).map(item => ({
              ...item,
              children: item.children ? filterRecursive(item.children) : undefined
          }));
      };
      
      updateView({ spreadsheetData: filterRecursive(rawBudgetData) });
      setSelectedRowIds(new Set());
      setContextMenu(null);
  };

  const handleCut = (targetIds?: Set<string>) => {
      const idsToCut = targetIds || selectedRowIds;
      if (idsToCut.size === 0 && contextMenu?.targetId) {
          idsToCut.add(contextMenu.targetId);
      }
      
      // Find items to cut
      const itemsToCut: BudgetLineItem[] = [];
      const findRecursive = (items: BudgetLineItem[]) => {
          items.forEach(item => {
              if (idsToCut.has(item.id)) itemsToCut.push(item);
              if (item.children) findRecursive(item.children);
          });
      };
      findRecursive(rawBudgetData);
      
      if (itemsToCut.length > 0) {
          setClipboard(itemsToCut);
          handleDeleteRow(idsToCut);
      }
  };

  const handleCopy = (targetIds?: Set<string>) => {
      const idsToCopy = targetIds || selectedRowIds;
      if (idsToCopy.size === 0 && contextMenu?.targetId) {
          idsToCopy.add(contextMenu.targetId);
      }

      const itemsToCopy: BudgetLineItem[] = [];
      const findRecursive = (items: BudgetLineItem[]) => {
          items.forEach(item => {
              if (idsToCopy.has(item.id)) itemsToCopy.push(JSON.parse(JSON.stringify(item)));
              if (item.children) findRecursive(item.children);
          });
      };
      findRecursive(rawBudgetData);
      
      if (itemsToCopy.length > 0) {
          setClipboard(itemsToCopy);
      }
  };

  const handlePaste = (targetId?: string) => {
      if (!clipboard || clipboard.length === 0) return;
      
      // If targetId is provided (context menu), paste after that row
      // If no targetId, paste at the end of the list or selected location
      // For simplicity in this v2, let's paste at the end if no target, or as sibling if target
      
      const newItems = clipboard.map(item => ({
          ...item,
          id: `pasted-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: `${item.name} (Copy)`
      }));

      if (targetId) {
          const insertRecursive = (items: BudgetLineItem[]): BudgetLineItem[] => {
               const targetIndex = items.findIndex(i => i.id === targetId);
               if (targetIndex !== -1) {
                   const newArr = [...items];
                   newItems.forEach((newItem, i) => {
                       newArr.splice(targetIndex + 1 + i, 0, newItem);
                   });
                   return newArr;
               }
               return items.map(item => ({
                   ...item,
                   children: item.children ? insertRecursive(item.children) : undefined
               }));
          };
          updateView({ spreadsheetData: insertRecursive(rawBudgetData) });
      } else {
          updateView({ spreadsheetData: [...rawBudgetData, ...newItems] });
      }
  };

  const getContextMenuItems = (): ContextMenuItem[] => {
      if (!contextMenu) return [];
      const { targetId, secondaryId, type } = contextMenu;
      const isSyntheticGroup = targetId.startsWith('group-');
      
      const baseItems: ContextMenuItem[] = [
          { 
              label: 'Add Sub-row', 
              icon: <PlusIcon className="w-4 h-4"/>, 
              onClick: () => handleAddSubRow(targetId),
              disabled: isSyntheticGroup
          },
          { separator: true } as any,
          { 
              label: 'Cut', 
              icon: <ScissorsIcon className="w-4 h-4"/>, 
              shortcut: 'Ctrl+X', 
              onClick: () => handleCut(new Set([targetId])) 
          },
          { 
              label: 'Copy', 
              icon: <CopyIcon className="w-4 h-4"/>, 
              shortcut: 'Ctrl+C', 
              onClick: () => handleCopy(new Set([targetId])) 
          },
          { 
              label: 'Paste', 
              icon: <ClipboardIcon className="w-4 h-4"/>, 
              shortcut: 'Ctrl+V', 
              disabled: !clipboard,
              onClick: () => handlePaste(targetId) 
          },
          { separator: true } as any,
          { 
              label: 'Delete Row', 
              icon: <TrashIcon className="w-4 h-4 text-red-500"/>, 
              danger: true, 
              onClick: () => handleDeleteRow(new Set([targetId])) 
          },
      ];

      if (type === 'cell' && secondaryId) {
          const stylingItems: ContextMenuItem[] = [
              { separator: true } as any,
              {
                  label: 'Cell Background Color',
                  icon: <FillColorIcon className="w-4 h-4 text-zinc-400" />,
                  render: (onClose) => (
                      <div 
                        className="flex items-center px-3 py-1.5 hover:bg-zinc-100 transition-colors cursor-default group" 
                        onClick={e => e.stopPropagation()}
                        onMouseDown={e => e.stopPropagation()}
                      >
                          <span className="mr-2 text-zinc-400 group-hover:text-zinc-600"><FillColorIcon className="w-4 h-4" /></span>
                          <span className="flex-grow text-xs font-medium text-zinc-700">Cell Background</span>
                          <div className="ml-2">
                             <ColorPicker 
                                icon={<div className="w-3.5 h-3.5 rounded-full border border-zinc-300" />}
                                label="Pick color"
                                onColorSelect={(color) => {
                                    handleCellStyleUpdate(targetId, secondaryId, { backgroundColor: color });
                                    onClose();
                                }}
                                presets={BACKGROUND_COLORS}
                             />
                          </div>
                      </div>
                  )
              } as any,
              {
                label: 'Cell Text Color',
                icon: <TextColorIcon className="w-4 h-4 text-zinc-400" />,
                render: (onClose) => (
                    <div 
                        className="flex items-center px-3 py-1.5 hover:bg-zinc-100 transition-colors cursor-default group" 
                        onClick={e => e.stopPropagation()}
                        onMouseDown={e => e.stopPropagation()}
                    >
                        <span className="mr-2 text-zinc-400 group-hover:text-zinc-600"><TextColorIcon className="w-4 h-4" /></span>
                        <span className="flex-grow text-xs font-medium text-zinc-700">Cell Text Color</span>
                        <div className="ml-2">
                           <ColorPicker 
                              icon={<div className="w-3.5 h-3.5 rounded-full border border-zinc-300" />}
                              label="Pick color"
                              onColorSelect={(color) => {
                                  handleCellStyleUpdate(targetId, secondaryId, { textColor: color });
                                  onClose();
                              }}
                              presets={TEXT_BORDER_COLORS}
                           />
                        </div>
                    </div>
                )
            } as any,
            {
                label: 'Cell Border Color',
                icon: <BorderColorIcon className="w-4 h-4 text-zinc-400" />,
                render: (onClose) => (
                    <div 
                        className="flex items-center px-3 py-1.5 hover:bg-zinc-100 transition-colors cursor-default group" 
                        onClick={e => e.stopPropagation()}
                        onMouseDown={e => e.stopPropagation()}
                    >
                        <span className="mr-2 text-zinc-400 group-hover:text-zinc-600"><BorderColorIcon className="w-4 h-4" /></span>
                        <span className="flex-grow text-xs font-medium text-zinc-700">Cell Border Color</span>
                        <div className="ml-2">
                           <ColorPicker 
                              icon={<div className="w-3.5 h-3.5 rounded-full border border-zinc-300" />}
                              label="Pick color"
                              onColorSelect={(color) => {
                                  handleCellStyleUpdate(targetId, secondaryId, { borderColor: color });
                                  onClose();
                              }}
                              presets={TEXT_BORDER_COLORS}
                           />
                        </div>
                    </div>
                )
            } as any,
          ];
          return [...baseItems, ...stylingItems];
      }

      return baseItems;
  };

  const handleResize = (columnId: string, newWidth: number) => {
    updateView({ spreadsheetColumns: columns.map(c => c.id === columnId ? { ...c, width: Math.max(newWidth, 60) } : c) });
  };

  const onMouseDown = (columnId: string) => (e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault();
    activeResizerId.current = columnId; setResizingColumnId(columnId);
    
    const col = columns.find(c => c.id === columnId);
    if (!col) return;
    
    const startX = e.clientX; 
    const startWidth = col.width;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (activeResizerId.current === columnId) {
          handleResize(columnId, startWidth + (moveEvent.clientX - startX));
      }
    };
    const onMouseUp = () => {
      activeResizerId.current = null; setResizingColumnId(null);
      window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp);
      document.body.classList.remove('grabbing');
    };
    window.addEventListener('mousemove', onMouseMove); window.addEventListener('mouseup', onMouseUp);
    document.body.classList.add('grabbing');
  };

  const handleColumnMove = (fromId: string, toId: string, position: 'left' | 'right') => {
      const newCols = [...columns];
      const sIndex = newCols.findIndex(c => c.id === fromId);
      let tIndex = newCols.findIndex(c => c.id === toId);
      if (sIndex === -1 || tIndex === -1) return;
      if (position === 'right') tIndex++;
      if (sIndex < tIndex) tIndex--;
      const [moved] = newCols.splice(sIndex, 1);
      newCols.splice(tIndex, 0, moved);
      updateView({ spreadsheetColumns: newCols });
  };

  const handleAddRow = () => {
    const newRow: BudgetLineItem = {
        id: `row-${Date.now()}`,
        sNo: (rawBudgetData.length + 1), 
        name: 'New Item',
        quantity: 0,
        unit: 'EA',
        effortHours: 0,
        totalBudget: 0,
        labor: 0,
        equipment: 0,
        subcontractor: 0,
        material: 0,
        others: 0,
        remainingContract: 0,
        style: {}
    };
    updateView({ spreadsheetData: [...rawBudgetData, newRow] });
    
    // Scroll to bottom
    setTimeout(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    }, 50);
  };

  // Aggregated totals
  const totals = useMemo(() => {
    const sumRecursive = (items: BudgetLineItem[]) => items.reduce((acc, item) => ({
      remainingContract: acc.remainingContract + (item.remainingContract || 0),
      effortHours: acc.effortHours + (item.effortHours || 0),
      totalBudget: acc.totalBudget + (item.totalBudget || 0),
      labor: acc.labor + (item.labor || 0),
      equipment: acc.equipment + (item.equipment || 0),
      subcontractor: acc.subcontractor + (item.subcontractor || 0),
      material: acc.material + (item.material || 0),
      others: acc.others + (item.others || 0),
      overhead: acc.overhead + (item.overhead || 0),
      profit: acc.profit + (item.profit || 0),
    }), { remainingContract: 0, effortHours: 0, totalBudget: 0, labor: 0, equipment: 0, subcontractor: 0, material: 0, others: 0, overhead: 0, profit: 0 });
    
    return sumRecursive(rawBudgetData);
  }, [rawBudgetData]);

  return (
    <div 
        ref={containerRef}
        className="flex flex-col h-full px-4 pt-[7px] pb-[7px] outline-none focus:ring-0 overflow-hidden gap-[7px]" 
        onKeyDown={handleKeyDown} 
        tabIndex={0}
    >
        {/* Floating Toolbar */}
        <div className="flex items-center gap-2">
            <SpreadsheetToolbar
                isAllSelected={isAllSelected}
                handleToggleAll={handleToggleAll}
                toolbarCheckboxRef={toolbarCheckboxRef}
                hasRowSelection={selectedRowIds.size > 0}
                selectedCount={selectedRowIds.size}
                onStyleUpdate={(style) => handleBulkStyleUpdate(style)}
                onCut={() => handleCut()}
                onCopy={() => handleCopy()}
                onPaste={() => handlePaste()}
                onDelete={() => handleDeleteRow()}
                onDeselectAll={() => setSelectedRowIds(new Set())}
            />
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden relative flex flex-col focus:outline-none max-h-full min-h-0 flex-grow">
            <div className="overflow-auto relative select-none focus:outline-none min-h-0 flex-grow" ref={scrollContainerRef}>
            <table className="border-collapse min-w-full table-fixed" style={{ fontSize: activeView.fontSize }}>
                <SpreadsheetHeader
                    columns={columns}
                    focusedCell={focusedCell}
                    resizingColumnId={resizingColumnId}
                    isScrolled={!scrollState.isAtStart}
                    isAtEnd={scrollState.isAtEnd}
                    isVerticalScrolled={scrollState.isScrolledTop}
                    fontSize={activeView.fontSize}
                    displayDensity={displayDensity}
                    sort={activeView.sort || null}
                    onSort={handleSort}
                    onColumnMove={handleColumnMove}
                    onMouseDown={onMouseDown}
                    onContextMenu={(e, colId) => handleContextMenu(e, 'column', colId)}
                    isAllSelected={isAllSelected}
                    onToggleAll={handleToggleAll}
                    toolbarCheckboxRef={toolbarCheckboxRef}
                />
                <tbody>
                {visibleData.map(({ item, level, type }) => (
                    <SpreadsheetRowV2
                        key={`${item.id}-${type}`} 
                        row={item} 
                        level={level} 
                        columns={columns} 
                        isSelected={selectedRowIds.has(item.id)}
                        isExpanded={expandedIds.has(item.id)} 
                        onToggleExpand={() => handleToggleExpand(item.id)}
                        focusedCell={focusedCell} 
                        editingCell={editingCell}
                        onStopEdit={() => setEditingCell(null)}
                        isScrolled={!scrollState.isAtStart} 
                        isAtEnd={scrollState.isAtEnd}
                        fontSize={activeView.fontSize} 
                        displayDensity={displayDensity}
                        rowType={type}
                        onRowHeaderClick={handleRowHeaderClick} 
                        onToggleRow={handleToggleRow}
                        onCellClick={(r, c) => handleCellClick(r, c, type)}
                        onStartEdit={(rowId, colId) => setEditingCell({ rowId, colId })}
                        onUpdateCell={handleUpdateCellValue}
                        onContextMenu={handleContextMenu}
                        filters={activeView.filters}
                        highlights={displayHighlights}
                        showColoredRows={activeView.showColoredRows ?? true}
                    />
                ))}
                </tbody>
                <tfoot className="bg-gray-100 text-gray-900 border-t-2 border-gray-300 sticky bottom-0 z-30 font-bold shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <tr className="h-9">
                        <td className={`sticky left-0 z-40 w-14 border-r border-gray-300 p-0 text-center bg-gray-100 ${!scrollState.isAtStart ? 'shadow-[4px_0_8px_-4px_rgba(0,0,0,0.3)]' : ''}`}
                        style={{
                            width: SPREADSHEET_INDEX_COLUMN_WIDTH,
                            minWidth: SPREADSHEET_INDEX_COLUMN_WIDTH,
                            maxWidth: SPREADSHEET_INDEX_COLUMN_WIDTH,
                        }}>
                            <div className="flex items-center justify-center h-full font-bold" style={{ fontSize: activeView.fontSize }}>Total</div>
                        </td>
                        {columns.map((col) => {
                             const totalVal = totals[col.id as keyof typeof totals];
                             let footerColorClass = '';
                             
                             if (col.id === 'remainingContract') {
                                 const val = totalVal as number;
                                 if (val < 0) footerColorClass = 'text-red-600';
                                 else if (val === 0) footerColorClass = 'text-green-600';
                             }

                             return (
                                <td key={col.id} className={`bg-gray-100 border-r border-gray-300 px-2 whitespace-nowrap ${col.align === 'right' ? 'text-right' : 'text-left'} ${footerColorClass}`}>
                                    {col.isTotal ? (col.id === 'effortHours' ? totalVal : formatCurrency(totalVal as number)) : ''}
                                </td>
                             );
                        })}
                        <td className={`sticky right-0 z-40 border-l border-gray-200 bg-gray-100 w-20 ${!scrollState.isAtEnd ? 'shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.3)]' : ''}`}></td>
                    </tr>
                </tfoot>
            </table>
            </div>
            {/* Add Row Button */}
            <div className="p-3 border-t border-gray-200 bg-gray-50 flex justify-start">
                 <button 
                    onClick={handleAddRow}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                >
                    <div className="w-5 h-5 rounded-full border border-blue-600 flex items-center justify-center">
                        <PlusIcon className="w-3 h-3" />
                    </div>
                    Add row
                </button>
            </div>
        </div>
        {contextMenu && contextMenu.visible && (
            <ContextMenu position={contextMenu.position} items={getContextMenuItems()} onClose={() => setContextMenu(null)} />
        )}
    </div>
  );
};

export default SpreadsheetViewV2;