
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScissorsIcon, CopyIcon, TrashIcon, ClipboardIcon, FillColorIcon, BorderColorIcon, TextColorIcon, SettingsIcon, XIcon, DownloadIcon, PaperclipIcon } from '../../../common/Icons';
import { PDFIcon } from '../../../shared/PDFExportModal';
import { useProject } from '../../../../context/ProjectContext';
import ViewControls from '../../../layout/ViewControls';
import FieldsMenu from '../../../layout/FieldsMenu';
import { Popover } from '../../../common/ui/Popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../common/ui/Tooltip';
import ColorPicker from '../../../common/ui/ColorPicker';
import { BudgetLineItemStyle } from '../../../../types';
import { BACKGROUND_COLORS, TEXT_BORDER_COLORS } from '../../../../constants/designTokens';
import { SPREADSHEET_INDEX_COLUMN_WIDTH } from '../../../../constants/spreadsheetLayout';

interface SpreadsheetToolbarProps {
    isAllSelected: boolean;
    handleToggleAll: () => void;
    toolbarCheckboxRef: React.RefObject<HTMLInputElement>;
    hasRowSelection: boolean;
    selectedCount: number;
    onStyleUpdate: (style: Partial<BudgetLineItemStyle>) => void;
    onCut: () => void;
    onCopy: () => void;
    onPaste: () => void;
    onDelete: () => void;
    onDeselectAll: () => void;
}

const SpreadsheetToolbar: React.FC<SpreadsheetToolbarProps> = ({
    isAllSelected,
    handleToggleAll,
    toolbarCheckboxRef,
    hasRowSelection,
    selectedCount,
    onStyleUpdate,
    onCut,
    onCopy,
    onPaste,
    onDelete,
    onDeselectAll
}) => {
    const { setIsDownloadModalOpen, setIsPDFModalOpen, contractData, setIsContractUploadOpen } = useProject();
    return (
        <div className="flex items-center flex-1 transition-all z-40 relative gap-2">
            <AnimatePresence mode="wait">
            {hasRowSelection ? (
                <motion.div 
                    key="actions"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 flex items-center gap-4"
                >
                    <TooltipProvider>
                        <div className="flex items-center gap-1">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button 
                                        onClick={onCut}
                                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <ScissorsIcon className="w-5 h-5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>Cut</TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button 
                                        onClick={onCopy}
                                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <CopyIcon className="w-5 h-5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>Copy</TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button 
                                        onClick={onPaste}
                                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <ClipboardIcon className="w-5 h-5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>Paste</TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button 
                                        onClick={onDelete}
                                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-red-500"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                            
                            <div className="w-px h-6 bg-gray-300 mx-1"></div>
                            
                            <ColorPicker 
                                icon={<FillColorIcon className="w-5 h-5" />} 
                                label="Background" 
                                onColorSelect={(color) => onStyleUpdate({ backgroundColor: color })} 
                                presets={BACKGROUND_COLORS}
                            />
                            <ColorPicker 
                                icon={<BorderColorIcon className="w-5 h-5" />} 
                                label="Border" 
                                onColorSelect={(color) => onStyleUpdate({ borderColor: color })} 
                                presets={TEXT_BORDER_COLORS}
                            />
                            <ColorPicker 
                                icon={<TextColorIcon className="w-5 h-5" />} 
                                label="Text" 
                                onColorSelect={(color) => onStyleUpdate({ textColor: color })} 
                                presets={TEXT_BORDER_COLORS}
                            />
                        </div>
                    </TooltipProvider>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                            {selectedCount} selected
                        </span>
                        <button 
                            onClick={onDeselectAll}
                            className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-all active:scale-95"
                        >
                            <XIcon className="w-3.5 h-3.5" />
                            <span>Deselect</span>
                        </button>
                    </div>
                </motion.div>
            ) : (
                    <motion.div
                    key="controls"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-4 flex-1"
                    >
                    <ViewControls />
                    <div className="w-px h-6 bg-gray-300"></div>

                    {/* Settings Menu */}
                    <div className="ml-auto flex items-center gap-1.5">
                        <button 
                            onClick={() => setIsPDFModalOpen(true)}
                            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                            aria-label="Export as PDF"
                        >
                            <PDFIcon className="w-4 h-4" />
                        </button>

                        <button
                            onClick={() => setIsDownloadModalOpen(true)}
                            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                            aria-label="Download view"
                        >
                            <DownloadIcon className="w-4 h-4" />
                        </button>

                        <Popover
                            trigger={
                                <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                                    <SettingsIcon className="w-4 h-4" />
                                </button>
                            }
                            content={
                                <FieldsMenu onClose={() => {}} disableClickOutside className="right-0 mt-2" />
                            }
                            align="end"
                        />
                    </div>
                    </motion.div>
            )}
            </AnimatePresence>
        </div>
    );
};

export default SpreadsheetToolbar;
