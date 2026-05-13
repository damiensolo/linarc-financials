import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useProject } from '../../context/ProjectContext';
import { View, ViewCategory, ViewMode, Column, FilterRule, GroupByRule, FilterOperator, ColumnId } from '../../types';
import {
    TableIcon,
    SpreadsheetIcon,
    GridPlusIcon,
    MoreVerticalIcon,
    ShareIcon,
    LockIcon,
    PlusIcon,
    GripVerticalIcon,
    TrashIcon,
    CopyIcon,
    SettingsIcon,
    FilterIcon,
    GroupIcon,
    ChevronDownIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    ViewManagerIcon,
} from '../common/Icons';
import { FILTERABLE_COLUMNS, TEXT_OPERATORS, ENUM_OPERATORS, NUMBER_OPERATORS, getEnumOptions } from '../../constants';
import { Reorder, useDragControls } from 'framer-motion';

interface ViewManagerModalProps {
  onClose: () => void;
}

const Toggle: React.FC<{ checked: boolean; onChange: (checked: boolean) => void }> = ({ checked, onChange }) => (
    <button
        onClick={(e) => {
            e.stopPropagation();
            onChange(!checked);
        }}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}
    >
        <span className="sr-only">Toggle view visibility</span>
        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
);

const ViewIcon: React.FC<{ type: ViewMode; className?: string }> = ({ type, className }) => {
    switch(type) {
        case 'table': return <TableIcon className={className} />;
        case 'spreadsheetV2': return <SpreadsheetIcon className={className} />;
        case 'spreadsheetV4': return <GridPlusIcon className={className} />;
        default: return <TableIcon className={className} />;
    }
}

const MOCK_USERS = [
    { id: 'u1', name: 'Damien Solo', email: 'damien@example.com' },
    { id: 'u2', name: 'Sarah Engineer', email: 'sarah@example.com' },
    { id: 'u3', name: 'John Architect', email: 'john@example.com' },
    { id: 't1', name: 'Engineering Team', email: 'eng@example.com', isTeam: true },
    { id: 't2', name: 'Field Operations', email: 'field@example.com', isTeam: true },
];

const EnumMultiSelect: React.FC<{ options: { id: string, label: string }[], selected: string[], onChange: (selected: string[]) => void }> = ({ options, selected, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const toggleOption = (id: string) => {
        const newSelected = selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id];
        onChange(newSelected);
    };
    
    const displayLabel = selected.length > 0 ? options.filter(o => selected.includes(o.id)).map(o => o.label).join(', ') : 'Select...';

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <button onClick={() => setIsOpen(p => !p)} className="w-full flex justify-between items-center px-2 py-1.5 text-[11px] border border-gray-300 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium">
                <span className="truncate">{displayLabel}</span>
                <ChevronDownIcon className="w-3.5 h-3.5 text-gray-400" />
            </button>
            {isOpen && (
                <div className="absolute top-full mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 z-[200] max-h-48 overflow-y-auto">
                    <ul>
                        {options.map(opt => (
                            <li key={opt.id} className="p-2 hover:bg-gray-100">
                                <label className="flex items-center text-[11px]">
                                    <input type="checkbox" checked={selected.includes(opt.id)} onChange={() => toggleOption(opt.id)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2" />
                                    {opt.label}
                                </label>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const CustomSelect: React.FC<{ options: { id: string, label: string }[], value: string, onChange: (value: string) => void, placeholder: string, className?: string }> = ({ options, value, onChange, placeholder, className }) => (
    <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`form-select w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium ${className}`}
    >
        <option value="" disabled>{placeholder}</option>
        {options.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
    </select>
);

const SharePanel: React.FC<{ 
    view: View; 
    onClose: () => void;
    onShare: (sharedWith: 'everyone' | string[]) => void;
}> = ({ view, onClose, onShare }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sharedWith, setSharedWith] = useState<'everyone' | string[]>(view.metadata.sharedWith || []);
    
    const isSharedWithEveryone = sharedWith === 'everyone';
    
    const filteredUsers = MOCK_USERS.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        (Array.isArray(sharedWith) ? !sharedWith.includes(u.id) : true)
    );

    const handleAddUser = (userId: string) => {
        if (Array.isArray(sharedWith)) {
            setSharedWith([...sharedWith, userId]);
        }
        setSearchTerm('');
    };

    const handleRemoveUser = (userId: string) => {
        if (Array.isArray(sharedWith)) {
            setSharedWith(sharedWith.filter(id => id !== userId));
        }
    };

    const handleToggleEveryone = () => {
        setSharedWith(isSharedWithEveryone ? [] : 'everyone');
    };

    return (
        <div className="absolute inset-y-0 right-0 w-80 bg-white border-l border-gray-200 shadow-2xl z-[150] flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded">
                        <ShareIcon className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">Share View</h3>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-white rounded-md">
                    <XIcon className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
                <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">View Title</label>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900 bg-gray-50 p-2 rounded border border-gray-100 italic truncate">
                        {view.name}
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Invite People</label>
                        <button 
                            onClick={handleToggleEveryone}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all ${isSharedWithEveryone ? 'bg-zinc-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                            Everyone
                        </button>
                    </div>
                    
                    {!isSharedWithEveryone ? (
                        <div className="relative">
                            <input 
                                type="text"
                                placeholder="Search by name or team..."
                                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && filteredUsers.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto overflow-x-hidden py-1">
                                    {filteredUsers.map(user => (
                                        <button 
                                            key={user.id}
                                            onClick={() => handleAddUser(user.id)}
                                            className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                                        >
                                            <div className="w-6 h-6 rounded-full bg-zinc-800 text-[10px] flex items-center justify-center text-white font-bold">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-xs font-semibold text-gray-900 truncate">{user.name}</div>
                                                <div className="text-[10px] text-gray-400 truncate">{user.isTeam ? 'Team' : user.email}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-md flex items-center gap-2">
                            <ShareIcon className="w-4 h-4 text-blue-600" />
                            <p className="text-xs text-blue-700 font-medium leading-tight">This view is now visible to everyone in the project.</p>
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-4 border-t border-gray-100">
                    <button 
                        onClick={() => onShare(sharedWith)}
                        className="w-full h-9 bg-zinc-800 text-white rounded-md text-sm font-medium shadow-sm hover:bg-zinc-700 transition-all"
                    >
                        Confirm Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

const ViewConfigPanel: React.FC<{
    initialView?: View;
    category: ViewCategory;
    onClose: () => void;
    onSave: (view: Partial<View>) => void;
}> = ({ initialView, category, onClose, onSave }) => {
    const isSystem = category === ViewCategory.System;
    const [name, setName] = useState(initialView?.name || '');
    const [type, setType] = useState<ViewMode>(initialView?.type || 'table');
    const [isDraft, setIsDraft] = useState(initialView?.metadata.isDraft ?? false);
    
    const [filters, setFilters] = useState<FilterRule[]>(initialView?.filters || []);
    const [groupBy, setGroupBy] = useState<GroupByRule[]>(initialView?.groupBy || []);

    const viewModes: { id: ViewMode; label: string; icon: any }[] = [
        { id: 'table', label: 'Standard Table', icon: TableIcon },
        { id: 'spreadsheetV2', label: 'Spreadsheet', icon: SpreadsheetIcon },
        { id: 'spreadsheetV4', label: 'Spreadsheet +', icon: GridPlusIcon }
    ];

    const handleSave = () => {
        onSave({
            id: initialView?.id,
            name,
            type,
            category,
            filters,
            groupBy,
            metadata: {
                ...(initialView?.metadata as any),
                isDraft
            }
        });
    };

    const addFilter = () => {
        const defaultCol = FILTERABLE_COLUMNS[0];
        setFilters([...filters, { 
            id: `filter_${Date.now()}`,
            columnId: defaultCol.id, 
            operator: 'is', 
            value: undefined 
        } as any]);
    };

    const updateFilter = (index: number, updates: Partial<FilterRule>) => {
        setFilters(prev => prev.map((f, i) => {
            if (i === index) {
                const updated = { ...f, ...updates };
                if (updates.columnId && updates.columnId !== f.columnId) {
                    const newCol = FILTERABLE_COLUMNS.find(c => c.id === updates.columnId);
                    const newOps = newCol?.type === 'text' ? TEXT_OPERATORS : 
                                   newCol?.type === 'number' ? NUMBER_OPERATORS :
                                   ENUM_OPERATORS;
                    updated.operator = newOps[0].id as FilterOperator;
                    updated.value = undefined;
                }
                return updated;
            }
            return f;
        }));
    };

    const addGrouping = () => {
        setGroupBy([...groupBy, { columnId: FILTERABLE_COLUMNS[0].id, direction: 'asc' }]);
    };

    const updateGrouping = (index: number, updates: Partial<GroupByRule>) => {
        setGroupBy(prev => prev.map((g, i) => i === index ? { ...g, ...updates } : g));
    };

    return (
        <div className="absolute inset-y-0 right-0 w-[420px] bg-white border-l border-gray-200 shadow-2xl z-[150] flex flex-col animate-in slide-in-from-right duration-300">
            <div className={`p-4 border-b border-gray-100 flex items-center justify-between ${isSystem ? 'bg-zinc-900 text-white' : 'bg-blue-600 text-white'}`}>
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded ${isSystem ? 'bg-zinc-800 text-blue-400' : 'bg-blue-500 text-white'}`}>
                        {isSystem ? <ViewManagerIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />}
                    </div>
                    <h3 className="text-sm font-semibold uppercase tracking-tight">
                        {initialView ? (isSystem ? 'Edit System' : 'Edit View') : (isSystem ? 'Publish System' : 'Create View')}
                    </h3>
                </div>
                <button onClick={onClose} className="text-white/60 hover:text-white p-1 hover:bg-white/10 rounded-md">
                    <XIcon className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
                <section className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">View Title</label>
                        <input 
                            type="text"
                            placeholder="e.g., Progress Update"
                            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-none font-medium"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Base View</label>
                        <div className="grid grid-cols-2 gap-2">
                            {viewModes.map(mode => (
                                <button 
                                    key={mode.id}
                                    disabled={!!initialView}
                                    onClick={() => setType(mode.id)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium border transition-all ${
                                        type === mode.id 
                                            ? (initialView ? 'bg-gray-100 text-gray-800 border-gray-300 shadow-none' : 'bg-zinc-900 text-white border-zinc-900 shadow-sm') 
                                            : (initialView ? 'bg-gray-50 text-gray-400 border-gray-100 opacity-60' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300')
                                    } ${initialView ? 'cursor-not-allowed' : ''}`}
                                >
                                    <ViewIcon type={mode.id} className={`w-3.5 h-3.5 ${type === mode.id ? (initialView ? 'text-gray-600' : 'text-white') : (initialView ? 'text-gray-300' : 'text-gray-400')}`} />
                                    {mode.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Rules</label>
                    </div>

                    <div className="space-y-3">
                        {filters.map((rule, i) => {
                            const selectedColumn = FILTERABLE_COLUMNS.find(c => c.id === rule.columnId);
                            const operators = selectedColumn?.type === 'text' ? TEXT_OPERATORS : 
                                              selectedColumn?.type === 'number' ? NUMBER_OPERATORS :
                                              ENUM_OPERATORS;
                            const requiresValue = rule.operator && !['is_empty', 'is_not_empty'].includes(rule.operator);

                            return (
                                <div key={i} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200 group animate-in slide-in-from-left-2 duration-200">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase w-10 shrink-0">{i === 0 ? 'Where' : 'And'}</span>
                                        <CustomSelect 
                                            options={FILTERABLE_COLUMNS.map(c => ({ id: c.id, label: c.label }))}
                                            value={rule.columnId}
                                            onChange={val => updateFilter(i, { columnId: val as ColumnId })}
                                            placeholder="Field"
                                            className="flex-1"
                                        />
                                        <CustomSelect
                                            options={operators}
                                            value={rule.operator}
                                            onChange={val => updateFilter(i, { operator: val as FilterOperator })}
                                            placeholder="Operator"
                                            className="w-28 text-blue-600"
                                        />
                                        <button onClick={() => setFilters(filters.filter((_, idx) => idx !== i))} className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all shrink-0">
                                            <XIcon className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    {requiresValue && (
                                        <div className="flex items-center gap-2 pl-12">
                                            {selectedColumn?.type === 'text' || selectedColumn?.type === 'number' ? (
                                                <input
                                                    type={selectedColumn?.type === 'number' ? 'number' : 'text'}
                                                    value={rule.value as string || ''}
                                                    onChange={e => updateFilter(i, { value: e.target.value })}
                                                    placeholder="Value..."
                                                    className="w-full px-2 py-1.5 text-[11px] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                                />
                                            ) : (
                                                <EnumMultiSelect
                                                    options={getEnumOptions(rule.columnId)}
                                                    selected={rule.value as string[] || []}
                                                    onChange={val => updateFilter(i, { value: val })}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        
                        <button 
                            onClick={addFilter}
                            className="w-full py-2 bg-white border border-dashed border-gray-300 rounded-lg text-[10px] font-bold text-gray-400 hover:text-blue-600 hover:border-blue-400 transition-all uppercase"
                        >
                            + Add Filter
                        </button>
                    </div>
                </section>

                <section className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Grouping</label>
                    <div className="space-y-2">
                        {groupBy.map((g, i) => (
                            <div key={i} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200 animate-in slide-in-from-left-2 duration-200">
                                <span className="text-[10px] font-bold text-gray-400 uppercase w-10 shrink-0">{i === 0 ? 'Group' : 'Then'}</span>
                                <CustomSelect 
                                    options={FILTERABLE_COLUMNS.map(c => ({ id: c.id, label: c.label }))}
                                    value={g.columnId}
                                    onChange={val => updateGrouping(i, { columnId: val as ColumnId })}
                                    placeholder="Field"
                                    className="flex-1"
                                />
                                <button 
                                    onClick={() => updateGrouping(i, { direction: g.direction === 'asc' ? 'desc' : 'asc' })}
                                    className="flex items-center gap-1.5 px-2 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-100 text-gray-700 transition-all font-bold min-w-[64px] justify-center"
                                >
                                    {g.direction === 'asc' ? <ArrowUpIcon className="w-3 h-3 text-blue-500" /> : <ArrowDownIcon className="w-3 h-3 text-blue-500" />}
                                    <span className="text-[9px] uppercase">{g.direction}</span>
                                </button>
                                <button onClick={() => setGroupBy(groupBy.filter((_, idx) => idx !== i))} className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all shrink-0">
                                    <XIcon className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}

                        <button onClick={addGrouping} className="w-full py-2 bg-white border border-dashed border-gray-300 rounded-lg text-[10px] font-bold text-gray-400 hover:text-purple-600 hover:border-purple-400 transition-all uppercase">
                            + Set Grouping
                        </button>
                    </div>
                </section>

                {isSystem && (
                    <section className="pt-2">
                        <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                            <div>
                                <p className="text-xs font-bold text-zinc-900">Publish Changes</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-[9px] font-black tracking-wider ${isDraft ? 'text-zinc-400' : 'text-green-600'}`}>{isDraft ? 'DRAFT' : 'PUBLISHED'}</span>
                                <Toggle checked={!isDraft} onChange={(checked) => setIsDraft(!checked)} />
                            </div>
                        </div>
                    </section>
                )}
            </div>

            <div className="mt-auto p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                <button 
                    onClick={onClose}
                    className="flex-1 h-10 border border-gray-300 text-gray-600 rounded-md text-sm font-medium hover:bg-white transition-all shadow-sm"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleSave}
                    disabled={!name}
                    className={`flex-1 h-10 text-white rounded-md text-sm font-bold shadow-md transition-all disabled:opacity-50 active:scale-[0.98] ${isSystem ? 'bg-zinc-900 hover:bg-zinc-800' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    {initialView ? 'Update' : 'Save'}
                </button>
            </div>
        </div>
    );
};

const ConfirmationDialog: React.FC<{ 
    viewName: string; 
    fallbackName: string; 
    onCancel: () => void; 
    onConfirm: () => void;
}> = ({ viewName, fallbackName, onCancel, onConfirm }) => (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-6 text-center">
        <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center mb-4">
                <div className="p-3 bg-red-50 text-red-600 rounded-full mb-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900 leading-tight">Disable Active View?</h3>
            </div>
            
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                You are about to hide <span className="font-semibold text-gray-900">'{viewName}'</span>. You will be moved to <span className="font-semibold text-blue-600">'{fallbackName}'</span>.
            </p>

            <div className="flex flex-col gap-2">
                <button 
                    onClick={onConfirm}
                    className="w-full py-2 bg-zinc-800 text-white rounded-lg font-bold text-sm hover:bg-zinc-700 transition-all shadow-md"
                >
                    Confirm
                </button>
                <button 
                    onClick={onCancel}
                    className="w-full py-2 text-gray-500 font-bold text-sm hover:bg-gray-100 rounded-lg transition-all"
                >
                    Cancel
                </button>
            </div>
        </div>
    </div>
);

const CardMenuPortal: React.FC<{
    anchor: { x: number; y: number; id: string };
    view: View;
    onClose: () => void;
    onShare: () => void;
    onDuplicate: () => void;
    onRename: () => void;
    onDelete: () => void;
    onEdit?: () => void;
    isAdmin?: boolean;
}> = ({ anchor, view, onClose, onShare, onDuplicate, onRename, onDelete, onEdit, isAdmin }) => {
    const isPersonal = view.category === ViewCategory.Personal;
    const isShared = view.category === ViewCategory.Shared;
    const isSystem = view.category === ViewCategory.System;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        const handleClickOutside = (e: MouseEvent) => {
            if (!(e.target as HTMLElement).closest('.menu-portal-content')) onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('mousedown', handleClickOutside);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    return createPortal(
        <div 
            className="fixed z-[9999] menu-portal-content bg-white border border-gray-200 rounded-lg shadow-2xl py-1.5 w-44 animate-in fade-in zoom-in-95 duration-100 overflow-hidden"
            style={{ 
                top: Math.min(anchor.y, window.innerHeight - 200), 
                left: anchor.x - 176 
            }}
        >
            {isPersonal && (
                <>
                    <button onClick={() => { onShare(); onClose(); }} className="w-full px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                        <ShareIcon className="w-3.5 h-3.5 text-blue-600" /> Share
                    </button>
                    <button onClick={() => { onEdit?.(); onClose(); }} className="w-full px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                        <SettingsIcon className="w-3.5 h-3.5 text-zinc-600" /> Edit View
                    </button>
                    <button onClick={() => { onRename(); onClose(); }} className="w-full px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Rename
                    </button>
                    <button onClick={() => { onDuplicate(); onClose(); }} className="w-full px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                        <CopyIcon className="w-3.5 h-3.5 text-gray-400" /> Duplicate
                    </button>
                    <div className="h-px bg-gray-100 my-1.5 mx-2" />
                    <button onClick={() => { onDelete(); onClose(); }} className="w-full px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors">
                        <TrashIcon className="w-3.5 h-3.5" /> Delete
                    </button>
                </>
            )}
            {isShared && (
                <button onClick={() => { onDuplicate(); onClose(); }} className="w-full px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                    <CopyIcon className="w-3.5 h-3.5 text-gray-400" /> Duplicate View
                </button>
            )}
            {isSystem && isAdmin && (
                <>
                    <button onClick={() => { onEdit?.(); onClose(); }} className="w-full px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                        <SettingsIcon className="w-3.5 h-3.5 text-zinc-600" /> Edit View
                    </button>
                    <button onClick={() => { onDuplicate(); onClose(); }} className="w-full px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                        <CopyIcon className="w-3.5 h-3.5 text-gray-400" /> Duplicate
                    </button>
                    <div className="h-px bg-gray-100 my-1.5 mx-2" />
                    <button onClick={() => { onDelete(); onClose(); }} className="w-full px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors">
                        <TrashIcon className="w-3.5 h-3.5" /> Delete View
                    </button>
                </>
            )}
            {!isAdmin && isSystem && (
                <button onClick={() => { onDuplicate(); onClose(); }} className="w-full px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                    <CopyIcon className="w-3.5 h-3.5 text-gray-400" /> Duplicate View
                </button>
            )}
        </div>,
        document.body
    );
};

const ViewCard: React.FC<{ 
    view: View; 
    onShare: () => void;
    onToggleIntercept: (view: View, enabled: boolean) => void;
    dragControls: any;
    onOpenMenu: (id: string, rect: DOMRect) => void;
    isRenaming?: boolean;
    onRenameCommit: (name: string) => void;
    onRenameCancel: () => void;
}> = ({ view, onShare, onToggleIntercept, dragControls, onOpenMenu, isRenaming, onRenameCommit, onRenameCancel }) => {
    const isSystem = view.category === ViewCategory.System;
    const isShared = view.category === ViewCategory.Shared;
    const isPersonal = view.category === ViewCategory.Personal;
    const isActivelyShared = view.metadata.sharedWith && (view.metadata.sharedWith === 'everyone' || (Array.isArray(view.metadata.sharedWith) && view.metadata.sharedWith.length > 0));

    const hiddenColumnsCount = view.columns?.filter(c => !c.visible).length || 0;
    const filtersCount = view.filters?.length || 0;
    const isGrouped = (view.groupBy?.length || 0) > 0;

    const [tempName, setTempName] = useState(view.name);
    useEffect(() => { if (isRenaming) setTempName(view.name); }, [isRenaming, view.name]);

    return (
        <div className={`group relative bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:border-blue-300 transition-all ${!view.isEnabled ? 'opacity-75' : ''} flex items-start gap-2`}>
            <div 
                className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-400 mt-1 shrink-0 px-0.5"
                onPointerDown={(e) => dragControls?.start(e)}
            >
                <GripVerticalIcon className="w-3 h-3" />
            </div>

            <div className="flex-1 min-w-0 text-left">
                {view.metadata.isDraft && isSystem && (
                    <div className="absolute -top-1 -right-1 z-10 bg-zinc-800 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-sm border border-zinc-700 uppercase tracking-tighter">
                        Draft
                    </div>
                )}
                
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className={`p-1.5 rounded shrink-0 ${isSystem ? 'bg-zinc-100 text-zinc-600' : isShared ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                            <ViewIcon type={view.type} className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 overflow-hidden">
                                 {isRenaming ? (
                                    <input 
                                        autoFocus
                                        className="text-sm font-semibold text-gray-900 w-full bg-blue-50 px-1 rounded outline-none border border-blue-200"
                                        value={tempName}
                                        onChange={e => setTempName(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') onRenameCommit(tempName);
                                            if (e.key === 'Escape') onRenameCancel();
                                        }}
                                        onBlur={() => onRenameCommit(tempName)}
                                    />
                                 ) : (
                                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                                        {view.name}
                                    </h4>
                                 )}
                                {isSystem && (
                                    <span className="bg-gray-100 text-gray-500 text-[10px] font-medium px-1.5 py-0.5 rounded leading-none shrink-0 border border-gray-200 uppercase tracking-tight">Core</span>
                                )}
                                {isPersonal && isActivelyShared && (
                                    <div className="p-1 bg-green-50 rounded-full border border-green-100 shrink-0" title="This view is shared">
                                        <ShareIcon className="w-2.5 h-2.5 text-green-600" />
                                    </div>
                                )}
                            </div>
                            
                            {isSystem && (view.filters.length > 0 || (view.groupBy?.length || 0) > 0) && (
                                <p className="text-[11px] text-gray-500 mt-1 font-medium bg-gray-100/60 px-2 py-0.5 rounded inline-block truncate max-w-full">
                                    {(view.groupBy?.length || 0) > 0 && `Grouped`}
                                    {(view.groupBy?.length || 0) > 0 && view.filters.length > 0 && ' · '}
                                    {view.filters.length > 0 && `Filtered: ${view.filters.length}`}
                                </p>
                            )}
                            
                            {isPersonal && (
                                <p className="text-[11px] text-gray-400 mt-0.5 font-medium truncate italic shrink-0">
                                    Based on: {view.baseViewType ? (view.baseViewType.charAt(0).toUpperCase() + view.baseViewType.slice(1).replace('V2', '')) : (view.type.charAt(0).toUpperCase() + view.type.slice(1).replace('V2', ''))}
                                </p>
                            )}
                            
                            {(isPersonal || isShared) && (
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
                                    {filtersCount > 0 && (
                                        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">
                                            {filtersCount} {filtersCount === 1 ? 'filter' : 'filters'}
                                        </span>
                                    )}
                                    {isGrouped && (
                                        <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full font-medium">Grouped</span>
                                    )}
                                    {hiddenColumnsCount > 0 && (
                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">
                                            {hiddenColumnsCount} hidden
                                        </span>
                                    )}
                                </div>
                            )}

                            {view.category === ViewCategory.Shared && (
                                <div className="flex items-center gap-1.5 mt-2">
                                    <div className="w-3.5 h-3.5 rounded-full bg-zinc-800 text-[8px] flex items-center justify-center text-white font-bold select-none">
                                        {view.metadata.ownerName.charAt(0)}
                                    </div>
                                    <span className="text-[11px] text-gray-500 truncate">
                                        Shared by <span className="font-semibold text-gray-900">{view.metadata.ownerName}</span>
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        <Toggle checked={view.isEnabled} onChange={(enabled) => onToggleIntercept(view, enabled)} />
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenMenu(view.id, (e.currentTarget as HTMLElement).getBoundingClientRect());
                            }}
                            className="text-gray-400 hover:text-gray-900 h-8 w-8 flex items-center justify-center hover:bg-gray-100 rounded-md transition-colors"
                        >
                            <MoreVerticalIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DraggableCard: React.FC<{
    view: View;
    onShare: () => void;
    onToggleIntercept: (view: View, enabled: boolean) => void;
    onOpenMenu: (id: string, rect: DOMRect) => void;
    isRenaming?: boolean;
    onRenameCommit: (name: string) => void;
    onRenameCancel: () => void;
}> = (props) => {
    const dragControls = useDragControls();
    return (
        <Reorder.Item 
            value={props.view} 
            dragListener={false} 
            dragControls={dragControls}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="list-none"
        >
            <ViewCard {...props} dragControls={dragControls} />
        </Reorder.Item>
    );
};

const ViewManagerModal: React.FC<ViewManagerModalProps> = ({ onClose }) => {
  const { 
      views, 
      userRole, 
      shareView, 
      toggleViewEnabled, 
      handleSelectView, 
      reorderViews,
      viewManagerShareId,
      setViewManagerShareId,
      handleDuplicateView,
      handleRenameView,
      handleDeleteView,
      saveSystemView,
      deleteSystemView,
      handleSaveNewView 
  } = useProject();
  
  const [sharingViewId, setSharingViewId] = useState<string | null>(null);
  const [configPanel, setConfigPanel] = useState<{ id: string | null | 'new'; category: ViewCategory } | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ id: string; x: number; y: number } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  
  const [confirmationTarget, setConfirmationTarget] = useState<{ view: View; fallback: View } | null>(null);

  useEffect(() => {
      if (viewManagerShareId) {
          setSharingViewId(viewManagerShareId);
      }
  }, [viewManagerShareId]);

  const isAdmin = userRole === 'admin';

  const systemViews = views.filter(v => 
      v.category === ViewCategory.System && 
      (isAdmin || !v.metadata.isDraft)
  );
  const personalViews = views.filter(v => v.category === ViewCategory.Personal);
  
  const sharedViews = views.filter(v => 
      v.category === ViewCategory.Shared || 
      (v.category === ViewCategory.Personal && v.metadata.sharedWith && (v.metadata.sharedWith === 'everyone' || (Array.isArray(v.metadata.sharedWith) && v.metadata.sharedWith.length > 0)))
  );

  const sharingView = views.find(v => v.id === sharingViewId);
  const editingView = configPanel?.id === 'new' ? undefined : views.find(v => v.id === configPanel?.id);

  const handleReorder = (newCategoryViews: View[], category: ViewCategory) => {
      const otherViews = views.filter(v => v.category !== category);
      let finalViews: View[] = [];
      if (category === ViewCategory.System) {
          finalViews = [...newCategoryViews, ...otherViews.filter(v => v.category === ViewCategory.Personal), ...otherViews.filter(v => v.category === ViewCategory.Shared)];
      } else if (category === ViewCategory.Personal) {
          finalViews = [...otherViews.filter(v => v.category === ViewCategory.System), ...newCategoryViews, ...otherViews.filter(v => v.category === ViewCategory.Shared)];
      } else if (category === ViewCategory.Shared) {
          finalViews = [...otherViews.filter(v => v.category === ViewCategory.System), ...otherViews.filter(v => v.category === ViewCategory.Personal), ...newCategoryViews];
      }
      reorderViews(finalViews);
  };

  const getFallbackView = (currentId: string) => {
      const otherEnabledViews = views.filter(v => v.isEnabled && v.id !== currentId);
      if (otherEnabledViews.length === 0) return null;
      return (
          otherEnabledViews.find(v => v.category === ViewCategory.System) ||
          otherEnabledViews.find(v => v.category === ViewCategory.Personal) ||
          otherEnabledViews.find(v => v.category === ViewCategory.Shared) ||
          otherEnabledViews[0]
      );
  };

  const handleToggleIntercept = (view: View, enabled: boolean) => {
      if (!enabled) {
          const fallback = getFallbackView(view.id);
          if (view.isActive) {
             if (fallback) {
                 setConfirmationTarget({ view, fallback });
             } else {
                 toggleViewEnabled(view.id, false);
                 handleSelectView(''); 
             }
             return;
          }
      }
      toggleViewEnabled(view.id, enabled);
  };

  const confirmToggle = () => {
      if (!confirmationTarget) return;
      handleSelectView(confirmationTarget.fallback.id);
      toggleViewEnabled(confirmationTarget.view.id, false);
      setConfirmationTarget(null);
  };

  const handleCloseModal = () => {
      setViewManagerShareId(null);
      onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[68vh] flex flex-col overflow-hidden relative animate-in zoom-in-95 duration-200 border border-gray-100">
        {/* Header */}
        <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <ViewManagerIcon className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight leading-none">View Manager</h2>
          </div>
          <button 
            onClick={handleCloseModal}
            className="text-gray-400 hover:text-gray-900 p-2 hover:bg-gray-100 rounded-full transition-all"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Columns */}
        <div className="flex flex-1 min-h-0 divide-x divide-gray-100 overflow-hidden bg-gray-50/30">
          {/* Column 1: System */}
          <section className="flex-1 flex flex-col min-w-0">
            <header className="px-6 py-4 border-b border-gray-100 bg-white/80 backdrop-blur flex items-center justify-between sticky top-0 z-10 h-14">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none">System</h3>
              {isAdmin && (
                  <button 
                    onClick={() => setConfigPanel({ id: 'new', category: ViewCategory.System })}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white rounded-md text-[10px] font-bold hover:bg-zinc-800 transition-all uppercase tracking-tight shadow-md active:scale-95"
                  >
                      <PlusIcon className="w-3 h-3" />
                      Publish
                  </button>
              )}
            </header>
            <Reorder.Group 
                axis="y" 
                values={systemViews} 
                onReorder={(newOrder) => handleReorder(newOrder, ViewCategory.System)}
                className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar list-none pb-20"
            >
              {systemViews.map((view) => (
                <DraggableCard 
                    key={view.id} 
                    view={view} 
                    onShare={() => {}} 
                    onToggleIntercept={handleToggleIntercept}
                    onOpenMenu={(id, rect) => setMenuAnchor({ id, x: rect.right, y: rect.top })}
                    onRenameCommit={(name) => handleRenameView(view.id, name)}
                    onRenameCancel={() => setRenamingId(null)}
                />
              ))}
            </Reorder.Group>
          </section>

          {/* Column 2: Personal */}
          <section className="flex-1 flex flex-col min-w-0">
            <header className="px-6 py-4 border-b border-gray-100 bg-white/80 backdrop-blur flex items-center justify-between sticky top-0 z-10 h-14">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none">My Views</h3>
              <button 
                onClick={() => setConfigPanel({ id: 'new', category: ViewCategory.Personal })}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-[10px] font-bold hover:bg-blue-700 transition-all uppercase tracking-tight shadow-md active:scale-95"
              >
                  <PlusIcon className="w-3 h-3" />
                  New View
              </button>
            </header>
            <Reorder.Group 
                axis="y" 
                values={personalViews} 
                onReorder={(newOrder) => handleReorder(newOrder, ViewCategory.Personal)}
                className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar list-none pb-20"
            >
              {personalViews.length > 0 ? (
                  personalViews.map((view) => (
                    <DraggableCard 
                        key={view.id} 
                        view={view} 
                        isRenaming={renamingId === view.id}
                        onRenameCommit={(name) => { handleRenameView(view.id, name); setRenamingId(null); }}
                        onRenameCancel={() => setRenamingId(null)}
                        onShare={() => setSharingViewId(view.id)} 
                        onToggleIntercept={handleToggleIntercept}
                        onOpenMenu={(id, rect) => setMenuAnchor({ id, x: rect.right, y: rect.top })}
                    />
                  ))
              ) : (
                <div className="border border-dashed border-gray-300 rounded-2xl p-10 flex flex-col items-center justify-center text-center mt-6 mx-4 bg-white/50 shadow-sm animate-in fade-in duration-500">
                    <div className="p-4 bg-white rounded-full shadow-md border border-gray-100 text-gray-200 mb-4">
                        <PlusIcon className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-tight">Create your first view</p>
                    <p className="text-[11px] text-gray-400 mt-2 max-w-[200px] font-medium leading-relaxed italic">Save specific filters and layouts as a unique view for your personal use.</p>
                </div>
              )}
            </Reorder.Group>
          </section>

          {/* Column 3: Shared */}
          <section className="flex-1 flex flex-col min-w-0">
            <header className="px-6 py-4 border-b border-gray-100 bg-white/80 backdrop-blur flex items-center justify-between sticky top-0 z-10 h-14">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none">Shared</h3>
            </header>
            <Reorder.Group 
                axis="y" 
                values={sharedViews} 
                onReorder={(newOrder) => handleReorder(newOrder, ViewCategory.Shared)}
                className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar list-none pb-20"
            >
               {sharedViews.length > 0 ? (
                   sharedViews.map((view) => (
                    <DraggableCard 
                        key={view.id} 
                        view={view} 
                        onShare={() => {}} 
                        onToggleIntercept={handleToggleIntercept}
                        onOpenMenu={(id, rect) => setMenuAnchor({ id, x: rect.right, y: rect.top })}
                        onRenameCommit={(name) => { handleRenameView(view.id, name); setRenamingId(null); }}
                        onRenameCancel={() => setRenamingId(null)}
                    />
                  ))
               ) : (
                 <div className="border border-dashed border-gray-300 rounded-2xl p-10 flex flex-col items-center justify-center text-center mt-6 mx-4 bg-white/50 shadow-sm animate-in fade-in duration-500">
                    <div className="p-4 bg-white rounded-full shadow-md border border-gray-100 text-gray-200 mb-4">
                        <ShareIcon className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-tight">No team views shared</p>
                    <p className="text-[11px] text-gray-400 mt-2 max-w-[200px] font-medium leading-relaxed italic">Collaborative views created by your team members will appear here.</p>
                </div>
               )}
            </Reorder.Group>
          </section>
        </div>

        {/* Drawers */}
        {sharingView && (
            <SharePanel 
                view={sharingView} 
                onClose={() => {
                    setSharingViewId(null);
                    setViewManagerShareId(null);
                }}
                onShare={(ids) => {
                    shareView(sharingView.id, ids);
                    setSharingViewId(null);
                    setViewManagerShareId(null);
                }}
            />
        )}

        {configPanel && (
            <ViewConfigPanel 
                initialView={editingView}
                category={configPanel.category}
                onClose={() => setConfigPanel(null)}
                onSave={(viewData) => {
                    if (configPanel.category === ViewCategory.System) {
                        saveSystemView(viewData);
                    } else {
                        handleSaveNewView(viewData);
                    }
                    setConfigPanel(null);
                }}
            />
        )}

        {confirmationTarget && (
            <ConfirmationDialog 
                viewName={confirmationTarget.view.name}
                fallbackName={confirmationTarget.fallback.name}
                onCancel={() => setConfirmationTarget(null)}
                onConfirm={confirmToggle}
            />
        )}

        {menuAnchor && (
            <CardMenuPortal 
                anchor={menuAnchor} 
                view={views.find(v => v.id === menuAnchor.id)!} 
                onClose={() => setMenuAnchor(null)}
                onShare={() => setSharingViewId(menuAnchor.id)}
                onDuplicate={() => handleDuplicateView(menuAnchor.id)}
                onRename={() => setRenamingId(menuAnchor.id)}
                onDelete={() => {
                    const view = views.find(v => v.id === menuAnchor.id);
                    if (view?.category === ViewCategory.System) {
                        deleteSystemView(view.id);
                    } else {
                        handleDeleteView(menuAnchor.id);
                    }
                }}
                onEdit={() => {
                    const view = views.find(v => v.id === menuAnchor.id);
                    if (view) setConfigPanel({ id: view.id, category: view.category });
                }}
                isAdmin={isAdmin}
            />
        )}

        {/* Footer */}
        <div className="px-8 py-4 bg-white border-t border-gray-100 flex justify-end items-center sticky bottom-0 z-20">
            <button 
                onClick={handleCloseModal}
                className="h-9 px-10 bg-zinc-900 text-white rounded-md font-bold text-sm hover:bg-zinc-800 transition-all shadow-md active:scale-[0.98]"
            >
                Done
            </button>
        </div>
      </div>
    </div>
  );
};

export default ViewManagerModal;
const XIcon = (props: any) => (<svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>);
