import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { View, ViewMode, ViewCategory } from '../../types';
import { useProject } from '../../context/ProjectContext';
import FilterMenu from './FilterMenu';
import HighlightMenu from './HighlightMenu';
import GroupMenu from './GroupMenu';
import { PlusIcon, MoreHorizontalIcon, MoreVerticalIcon, TableIcon, SearchIcon, FilterIcon, SpreadsheetIcon, GridPlusIcon, ShareIcon, FillColorIcon, CopyIcon, GroupIcon, ChevronDownIcon, ChevronUpIcon, ChevronsDownIcon, XIcon, SettingsIcon, ViewManagerIcon } from '../common/Icons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../common/ui/Tooltip';

const modes: { id: ViewMode; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
  { id: 'table', label: 'Table', icon: TableIcon },
  { id: 'spreadsheetV2', label: 'Spreadsheet', icon: SpreadsheetIcon },
  { id: 'spreadsheetV4', label: 'Spreadsheet +', icon: GridPlusIcon },
];

const TabMenu: React.FC<{ view: View, isDefault: boolean, onRename: () => void, onDelete: () => void, onSetDefault: () => void, onShare: () => void, onClone: () => void, canDelete: boolean }> = 
({ view, isDefault, onRename, onDelete, onSetDefault, onShare, onClone, canDelete }) => {
  const { toggleViewEnabled, handleSelectView } = useProject();
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const menuWrapperRef = useRef<HTMLDivElement>(null);
  const menuContentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (isOpen && menuWrapperRef.current) {
      const rect = menuWrapperRef.current.getBoundingClientRect();
      const MENU_WIDTH = 160; 
      let left = rect.left;
      
      if (left + MENU_WIDTH > window.innerWidth) {
        left = rect.right - MENU_WIDTH;
      }

      setCoords({
        top: rect.bottom + 4,
        left: left,
      });
    }
  }, [isOpen]);
    
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuWrapperRef.current &&
        !menuWrapperRef.current.contains(event.target as Node) &&
        menuContentRef.current &&
        !menuContentRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => setIsOpen(false);
    const handleResize = () => setIsOpen(false);

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  return (
    <div ref={menuWrapperRef} className="relative flex items-center h-full">
      <button onClick={() => setIsOpen(prev => !prev)} className="rounded-md hover:bg-gray-200 flex items-center justify-center h-full px-1">
        <MoreVerticalIcon className="w-4 h-4 text-gray-500" />
      </button>
      {isOpen && createPortal(
        <div 
            ref={menuContentRef}
            className="fixed w-40 bg-white rounded-md shadow-lg border border-gray-200 z-[9999]"
            style={{ top: coords.top, left: coords.left }}
            onMouseDown={(e) => e.stopPropagation()}
        >
          <ul className="py-1">
            <li>
                <button 
                    onClick={() => { if(!isDefault) { onSetDefault(); setIsOpen(false); } }}
                    disabled={isDefault}
                    className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${isDefault ? 'text-gray-400 cursor-default' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                    {isDefault ? 'Default view' : 'Set as default'}
                </button>
            </li>
            <li>
                <button 
                    onClick={() => { onShare(); setIsOpen(false); }} 
                    className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                    <ShareIcon className="w-3.5 h-3.5" />
                    Share
                </button>
            </li>
            <li>
                <button 
                    onClick={() => { onRename(); setIsOpen(false); }} 
                    className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                    Rename
                </button>
            </li>
            <li>
                <button 
                    onClick={() => { onClone(); setIsOpen(false); }} 
                    className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                    <CopyIcon className="w-3.5 h-3.5 flex-shrink-0" />
                    Clone
                </button>
            </li>
            {canDelete && (
                <li>
                    <button 
                        onClick={() => { 
                            if (view.category === ViewCategory.System) {
                                // For system views, "Delete" is actually "Hide" (disable toggle)
                                toggleViewEnabled(view.id, false);
                            } else {
                                onDelete(); 
                            }
                            setIsOpen(false); 
                        }} 
                        className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                        {view.category === ViewCategory.System ? 'Hide' : 'Delete'}
                    </button>
                </li>
            )}
          </ul>
        </div>,
        document.body
      )}
    </div>
  );
};

function ResponsiveButtonGroup<T>({
    items,
    renderItem,
    renderDropdownItem,
    prefix,
    navProps,
    containerClassName = '',
    navClassName = '',
    gap = 4,
}: {
    items: T[];
    renderItem: (item: T, index: number) => React.ReactNode;
    renderDropdownItem: (item: T, index: number, closeDropdown: () => void) => React.ReactNode;
    prefix?: React.ReactNode;
    navProps?: React.HTMLAttributes<HTMLElement>;
    containerClassName?: string;
    navClassName?: string;
    gap?: number;
}) {
    const containerRef = useRef<HTMLElement>(null);
    const [overflowIndices, setOverflowIndices] = useState<number[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState({ top: 0, right: 0 });

    const checkOverflow = React.useCallback(() => {
        if (!containerRef.current) return;
        const children = Array.from(containerRef.current.children) as HTMLElement[];
        const newOverflows: number[] = [];
        children.forEach(child => {
            const indexStr = child.getAttribute('data-index');
            if (indexStr !== null) {
                if (child.offsetTop > 20) {
                    newOverflows.push(parseInt(indexStr, 10));
                }
            }
        });
        setOverflowIndices(prev => {
           if (prev.length === newOverflows.length && prev.every((v, i) => v === newOverflows[i])) return prev;
           return newOverflows;
        });
    }, []);

    useLayoutEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver(checkOverflow);
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [checkOverflow]);

    useLayoutEffect(() => { checkOverflow(); }, [items, checkOverflow]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (dropdownRef.current && !dropdownRef.current.contains(target)) {
                if (target.closest('.z-\\[9999\\]')) return;
                setIsDropdownOpen(false);
            }
        };
        if (isDropdownOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isDropdownOpen]);

    const hasOverflow = overflowIndices.length > 0;
    useEffect(() => { if (!hasOverflow) setIsDropdownOpen(false); }, [hasOverflow]);

    useLayoutEffect(() => {
        if (isDropdownOpen && dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            setCoords({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
        }
    }, [isDropdownOpen, overflowIndices]);

    return (
        <div className={`flex items-center flex-shrink min-w-0 max-w-full ${containerClassName} h-11`}>
            <nav 
                ref={containerRef} 
                className={`flex flex-wrap items-center overflow-hidden max-w-full relative ${navClassName}`}
                style={{ maxHeight: '44px', gap: '0px' }}
                {...navProps}
            >
                {prefix && (
                    <div className="flex-shrink-0 flex items-center">
                        {prefix}
                    </div>
                )}
                {items.map((item, i) => (
                    <div key={i} data-index={i} className="flex-shrink-0 flex items-center">
                        {renderItem(item, i)}
                    </div>
                ))}
            </nav>

            {hasOverflow && (
                <div className="relative flex items-center flex-shrink-0 h-[36px]" ref={dropdownRef}>
                   <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${isDropdownOpen ? 'bg-gray-300 text-gray-800' : 'hover:bg-gray-200 text-gray-500'}`}>
                     <MoreVerticalIcon className="w-5 h-5" />
                   </button>
                   {isDropdownOpen && createPortal(
                     <div className="fixed bg-gray-100 rounded-md shadow-lg border border-gray-200 p-1 flex flex-col z-[9999]" style={{ top: coords.top, right: coords.right, gap: `0px` }}>
                        {overflowIndices.map(i => (
                             <div key={i} className="flex-shrink-0 flex items-center">
                                 {renderDropdownItem(items[i], i, () => setIsDropdownOpen(false))}
                             </div>
                        ))}
                     </div>, document.body
                   )}
                </div>
            )}
        </div>
    );
}

const ViewControls: React.FC = () => {
  const {
    views, activeViewId, defaultViewId, handleSelectView, setModalState, handleDeleteView, setDefaultViewId, setViews,
    activeViewMode, handleViewModeChange,
    searchTerm, setSearchTerm, showFilterMenu, setShowFilterMenu, showHighlightMenu, setShowHighlightMenu, showGroupMenu, setShowGroupMenu,
    handleSort,
    updateView,
    activeView,
    setIsViewManagerOpen,
    setViewManagerShareId,
    handleDuplicateView,
  } = useProject();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const highlightButtonRef = useRef<HTMLButtonElement>(null);
  const groupButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchFocused) {
      // Small timeout to ensure input is ready for focus during/after animation
      const timer = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isSearchFocused]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && 
          document.activeElement?.tagName !== 'INPUT' && 
          document.activeElement?.tagName !== 'TEXTAREA' &&
          !isSearchFocused) {
        e.preventDefault();
        setIsSearchFocused(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isSearchFocused]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDropIndex(index);
  };
  
  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const newViews = [...views];
    const [draggedItem] = newViews.splice(draggedIndex, 1);
    newViews.splice(index, 0, draggedItem);
    setViews(newViews);
    
    setDraggedIndex(null);
    setDropIndex(null);
  };

  const handleCloneView = (viewId: string) => {
      handleDuplicateView(viewId);
  };

  const searchPlaceholder = activeViewMode === 'spreadsheetV2' || activeViewMode === 'spreadsheetV4' ? 'Search...' : 'Search tasks...';
  const showSearchAndFilter = true;

  type ToolbarItem = 
      | { type: 'mode'; mode: typeof modes[0]; isFirst: boolean; isLast: boolean }
      | { type: 'divider' }
      | { type: 'create'; isFirst: boolean; isLast: boolean }
      | { type: 'view'; view: View; index: number; isFirst: boolean; isLast: boolean };

  const sortedViews = React.useMemo(() => {
    const visible = views.filter(v => v.isEnabled);
    return [
      ...visible.filter(v => v.category === ViewCategory.System),
      ...visible.filter(v => v.category === ViewCategory.Personal),
      ...visible.filter(v => v.category === ViewCategory.Shared),
    ];
  }, [views]);

  const unifiedItems = React.useMemo((): ToolbarItem[] => [
      ...modes.map((mode, i) => ({ type: 'mode' as const, mode, isFirst: i === 0, isLast: i === modes.length - 1 })),
      ...(sortedViews.length > 0 ? [{ type: 'divider' as const }] : []),
      { type: 'create' as const, isFirst: true, isLast: sortedViews.length === 0 },
      ...sortedViews.map((view, index) => ({ type: 'view' as const, view, index, isFirst: false, isLast: index === sortedViews.length - 1 }))
  ], [sortedViews]);

  const renderViewModeItem = (mode: typeof modes[0], isFirst: boolean, isLast: boolean, isDropdown: boolean, closeDropdown?: () => void) => {
      const isActive = activeViewMode === mode.id && activeViewId === null;
      const Icon = mode.icon;
      return (
          <div className={`flex items-center ${isDropdown ? 'rounded-md p-0.5 w-full my-0 shadow-none bg-transparent hover:bg-gray-200' : 'bg-gray-100 py-1 shadow-sm'} ${!isDropdown && isFirst ? 'rounded-l-lg pl-1' : ''} ${!isDropdown && isLast ? 'rounded-r-lg pr-1' : ''}`}>
              <TooltipProvider key={mode.id}>
                  <Tooltip>
                      <TooltipTrigger asChild>
                          <button
                              onClick={() => { handleViewModeChange(mode.id); closeDropdown?.(); }}
                              className={`text-xs font-medium rounded-md transition-colors w-full flex items-center justify-start h-9 ${
                                  isActive ? 'bg-white shadow-sm border border-gray-200 text-blue-600' : isDropdown ? 'text-gray-700' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                              } ${!isDropdown ? 'px-2' : 'px-1.5'}`}
                              aria-label={`Switch to ${mode.label} view`}
                              aria-pressed={isActive}
                          >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          {isDropdown && <span className="ml-1.5 font-medium">{mode.label}</span>}
                          </button>
                      </TooltipTrigger>
                      {!isDropdown && <TooltipContent side="bottom">{mode.label}</TooltipContent>}
                  </Tooltip>
              </TooltipProvider>
          </div>
      );
  };

  const renderCustomViewTab = (view: View, index: number, isFirst: boolean, isLast: boolean, isDropdown: boolean, closeDropdown?: () => void) => {
      const isActive = view.id === activeViewId;
      const isDropTarget = dropIndex === index;
      const isBeingDragged = draggedIndex === index;
      const modeIcon = modes.find(m => m.id === view.type)?.icon;
      const IconComponent = modeIcon || TableIcon;

      return (
          <div className={`flex items-center ${isDropdown ? 'rounded-md p-0.5 w-full my-0 shadow-none bg-transparent hover:bg-gray-200' : 'bg-gray-100 py-1 shadow-sm'} ${!isDropdown && isFirst ? 'rounded-l-lg pl-1' : ''} ${!isDropdown && isLast ? 'rounded-r-lg pr-1' : ''}`}>
              <div
                key={view.id}
                draggable={!isDropdown}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={() => { setDraggedIndex(null); setDropIndex(null); }}
                className={`flex items-center rounded-md transition-all duration-150 flex-shrink-0 w-full h-9 ${ isBeingDragged ? 'opacity-50' : '' } ${ isDropTarget ? 'bg-gray-300' : '' } ${ isActive ? 'bg-white shadow-sm border border-gray-200' : isDropdown ? 'text-gray-700' : 'hover:bg-gray-200'}`}
              >
                  <button
                      onClick={() => { handleSelectView(view.id); closeDropdown?.(); }}
                      className={`pl-2 pr-2 py-1.5 text-xs font-medium ${isActive ? 'text-blue-600' : 'text-gray-800'} rounded-l-md flex items-center gap-1 whitespace-nowrap w-full h-full`}
                  >
                      <IconComponent className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-500'} flex-shrink-0`} />
                      {view.name}
                  </button>
                  <div className="pr-1 flex items-center h-full">
                      <TabMenu 
                          view={view}
                          isDefault={view.id === defaultViewId}
                          onRename={() => { setModalState({ type: 'rename', view }); closeDropdown?.(); }}
                          onDelete={() => { handleDeleteView(view.id); closeDropdown?.(); }}
                          onSetDefault={() => { setDefaultViewId(view.id); closeDropdown?.(); }}
                          onShare={() => { 
                              setViewManagerShareId(view.id);
                              setIsViewManagerOpen(true);
                              closeDropdown?.(); 
                          }}
                          onClone={() => { handleCloneView(view.id); closeDropdown?.(); }}
                          canDelete={true}
                      />
                  </div>
              </div>
          </div>
      );
  };

  return (
        <div className="flex items-center gap-3 relative z-[90] flex-1 min-w-0">
            {showSearchAndFilter && (
                <>
                    {/* Search */}
                    <div className="relative flex-shrink-0 flex items-center justify-end">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <motion.div 
                                        initial={false}
                                        animate={{ 
                                            width: (isSearchFocused || searchTerm) ? 260 : 40,
                                            backgroundColor: isSearchFocused ? '#ffffff' : (searchTerm ? '#ffffff' : '#ffffff'),
                                            borderColor: isSearchFocused ? '#3b82f6' : '#d1d5db',
                                            boxShadow: isSearchFocused ? '0 0 0 2px rgba(59, 130, 246, 0.1)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                                        }}
                                        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                                        className={`relative flex items-center h-9 rounded-md border group/search cursor-pointer ${ (isSearchFocused || searchTerm) ? '' : 'hover:bg-gray-50' }`}
                                        onClick={() => setIsSearchFocused(true)}
                                    >
                                        <div className={`absolute left-0 w-10 h-full flex items-center justify-center transition-colors ${ isSearchFocused ? 'text-blue-500' : 'text-gray-700 group-hover/search:text-gray-900' }`}>
                                            <SearchIcon className="w-4 h-4 transition-colors" />
                                        </div>
                                        <input 
                                            ref={searchInputRef}
                                            id="global-search-input"
                                            type="text" 
                                            placeholder={searchPlaceholder} 
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            onFocus={() => setIsSearchFocused(true)}
                                            onBlur={() => {
                                                // Slight delay to allow clicking the clear button
                                                setTimeout(() => setIsSearchFocused(false), 150);
                                            }}
                                            className={`w-full h-full bg-transparent border-none focus:ring-0 text-xs pl-10 pr-8 outline-none transition-opacity duration-200 font-medium text-gray-900 placeholder-gray-400 ${ (isSearchFocused || searchTerm) ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none' }`}
                                        />
                                        <AnimatePresence>
                                            {searchTerm && (
                                                <motion.button 
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    onClick={(e) => { 
                                                        e.stopPropagation();
                                                        setSearchTerm(''); 
                                                        searchInputRef.current?.focus(); 
                                                    }}
                                                    className="absolute right-2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                                                >
                                                    <XIcon className="w-3.5 h-3.5" />
                                                </motion.button>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                </TooltipTrigger>
                                {!(isSearchFocused || searchTerm) && <TooltipContent side="bottom">Search</TooltipContent>}
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    {/* Filter */}
                    <div className="relative flex-shrink-0">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button ref={filterButtonRef} onClick={() => setShowFilterMenu(p => !p)} className={`flex items-center ${activeView.showToolbarLabels ? 'gap-1.5 px-3' : 'w-9 justify-center p-0'} text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-sm h-9 flex-shrink-0 transition-all relative`} aria-label="Filter tasks">
                                        <FilterIcon className="w-4 h-4" />
                                        {activeView.showToolbarLabels && <span>Filter</span>}
                                        {activeView.filters.length > 0 && (
                                            <span className={activeView.showToolbarLabels 
                                                ? "flex items-center justify-center w-5 h-5 flex-shrink-0 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full leading-none" 
                                                : "absolute -top-1.5 -right-1.5 flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full border border-white shadow-sm leading-none"
                                            }>
                                                {activeView.filters.length}
                                            </span>
                                        )}
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>Filter</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        {showFilterMenu && <FilterMenu onClose={() => setShowFilterMenu(false)} triggerRef={filterButtonRef} />}
                    </div>

                    {/* Group By */}
                    <div className="relative flex-shrink-0">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button ref={groupButtonRef} onClick={() => setShowGroupMenu(p => !p)} className={`flex items-center ${activeView.showToolbarLabels ? 'gap-1.5 px-3' : 'w-9 justify-center p-0'} text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-sm h-9 flex-shrink-0 transition-all relative`} aria-label="Group tasks">
                                        <GroupIcon className="w-4 h-4" />
                                        {activeView.showToolbarLabels && <span>Group</span>}
                                        {(activeView.groupBy?.length || 0) > 0 && (
                                            <span className={activeView.showToolbarLabels 
                                                ? "flex items-center justify-center w-5 h-5 flex-shrink-0 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full leading-none" 
                                                : "absolute -top-1.5 -right-1.5 flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full border border-white shadow-sm leading-none"
                                            }>
                                                {activeView.groupBy!.length}
                                            </span>
                                        )}
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>Group By</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        {showGroupMenu && <GroupMenu onClose={() => setShowGroupMenu(false)} triggerRef={groupButtonRef} />}
                    </div>

                    {/* Highlight - Only show on Spreadsheet and Dashboard views as requested */}
                    {activeViewMode !== 'table' && activeViewMode !== 'board' && (
                        <div className="relative flex-shrink-0">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <button ref={highlightButtonRef} onClick={() => setShowHighlightMenu(p => !p)} className={`flex items-center ${activeView.showToolbarLabels ? 'gap-1.5 px-3' : 'w-9 justify-center p-0'} py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-sm h-9 flex-shrink-0 transition-all relative`} aria-label="Highlight cells">
                                            <FillColorIcon className="w-4 h-4" />
                                            {(activeView.highlights?.length || 0) > 0 && (
                                                <span className={activeView.showToolbarLabels 
                                                    ? "flex items-center justify-center w-5 h-5 flex-shrink-0 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full leading-none" 
                                                    : "absolute -top-1.5 -right-1.5 flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full border border-white shadow-sm leading-none"
                                                }>
                                                    {activeView.highlights?.length}
                                                </span>
                                            )}
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>Highlight</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            {showHighlightMenu && <HighlightMenu onClose={() => setShowHighlightMenu(false)} triggerRef={highlightButtonRef} />}
                        </div>
                    )}

                    {/* Manage Views */}
                    <div className="relative flex-shrink-0">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button 
                                        onClick={() => setIsViewManagerOpen(true)}
                                        className={`relative flex items-center ${activeView.showToolbarLabels ? 'gap-1.5 px-3' : 'w-9 justify-center p-0'} py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-sm h-9 flex-shrink-0 transition-all`}
                                        aria-label="Manage views"
                                    >
                                        <ViewManagerIcon className="w-4 h-4" />
                                        {activeView.showToolbarLabels && <span>Manage</span>}
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>Manage Views</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    <div className="h-6 w-px bg-gray-300 mx-1 flex-shrink-0"></div>
                </>
            )}

            <ResponsiveButtonGroup
                items={unifiedItems}
                gap={2}
                navClassName="flex items-center"
                navProps={{ onDragLeave: () => setDropIndex(null) }}
                renderItem={(item) => {
                    switch (item.type) {
                        case 'mode': return renderViewModeItem(item.mode, item.isFirst, item.isLast, false);
                        case 'divider': return <div className="h-6 w-px bg-gray-300 mx-2 flex-shrink-0"></div>;
                        case 'create': return (
                            <div className={`flex items-center bg-gray-100 py-1 shadow-sm ${item.isFirst ? 'rounded-l-lg pl-1' : ''} ${item.isLast ? 'rounded-r-lg pr-1' : ''}`}>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button onClick={() => setModalState({ type: 'create' })} className="px-2 flex items-center justify-center flex-shrink-0 rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-800 h-9 w-9">
                                                <PlusIcon className="w-4 h-4" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>Create New View</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        );
                        case 'view': return renderCustomViewTab(item.view, item.index, item.isFirst, item.isLast, false);
                        default: return null;
                    }
                }}
                renderDropdownItem={(item, index, closeDropdown) => {
                    switch (item.type) {
                        case 'mode': return renderViewModeItem(item.mode, item.isFirst, item.isLast, true, closeDropdown);
                        case 'divider': return <div className="w-full h-px bg-gray-300 my-1 flex-shrink-0"></div>;
                        case 'create': return (
                            <div className="w-full flex p-0.5">
                                <button onClick={() => { setModalState({ type: 'create' }); closeDropdown(); }} className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-md">
                                    <PlusIcon className="w-4 h-4" />
                                    Create New View
                                </button>
                            </div>
                        );
                        case 'view': return renderCustomViewTab(item.view, item.index, item.isFirst, item.isLast, true, closeDropdown);
                        default: return null;
                    }
                }}
            />
        </div>
  );
};

export default ViewControls;