import React, { useRef, useEffect, useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import AppHeader from './AppHeader';
import MainContent from './MainContent';
import ItemDetailsPanel from '../shared/ItemDetailsPanel';
import CreateViewModal from '../shared/CreateViewModal';
import Header from '../../mainnav/new/v2/Header';
import Sidebar from '../../mainnav/new/v2/Sidebar';
import ViewManagerModal from '../shared/ViewManagerModal';
import DownloadModal from '../shared/DownloadModal';
import PDFExportModal from '../shared/PDFExportModal';
import ContractUploadModal from '../shared/ContractUploadModal';

/** Bookmarks data passed from Header (v2) for Sidebar integration */
type BookmarksData = {
    bookmarks: Array<{
        categoryKey: string;
        itemKey: string;
        label: string;
        description: string;
        icon: React.ReactNode;
        navIcon: React.ReactNode;
    }>;
    toggleBookmark: (categoryKey: string, itemKey: string) => void;
    handleSelect: (categoryKey: string, subcategoryKey: string) => void;
};

const AppLayout: React.FC = () => {
    const {
        modalState,
        setModalState,
        handleSaveView,
        detailedTask,
        setDetailedTaskId,
        handlePriorityChange,
        isViewManagerOpen,
        setIsViewManagerOpen,
        isDownloadModalOpen,
        setIsDownloadModalOpen,
        isPDFModalOpen,
        setIsPDFModalOpen,
        isContractUploadOpen,
        activeViewMode,
        financialSetupComplete,
    } = useProject();
    const mainContentRef = useRef<HTMLDivElement>(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [bookmarksData, setBookmarksData] = useState<BookmarksData | null>(null);
    const [activeTopNavCategory, setActiveTopNavCategory] = useState<string>('contract');

    useEffect(() => {
        const contentEl = mainContentRef.current;
        const handleScroll = () => setIsScrolled((contentEl?.scrollTop ?? 0) > 0);
        contentEl?.addEventListener('scroll', handleScroll);
        return () => contentEl?.removeEventListener('scroll', handleScroll);
    }, []);

    const isFinancialSetupFlow =
        activeViewMode === 'spreadsheetV4' && !financialSetupComplete;

    return (
        <div className="flex flex-col h-full bg-white font-sans text-gray-800 overflow-hidden">
            {modalState && (
                <CreateViewModal
                    title={modalState.type === 'rename' ? 'Rename View' : 'Create New View'}
                    initialName={modalState.view?.name}
                    onSave={handleSaveView}
                    onCancel={() => setModalState(null)}
                />
            )}

            {isViewManagerOpen && (
                <ViewManagerModal onClose={() => setIsViewManagerOpen(false)} />
            )}

            {isDownloadModalOpen && (
                <DownloadModal />
            )}

            {isPDFModalOpen && (
                <PDFExportModal />
            )}

            {isContractUploadOpen && (
                <ContractUploadModal />
            )}

            <Header
                onSelectionChange={(title) => {}}
                onBookmarksDataChange={setBookmarksData}
                onActiveCategoryChange={setActiveTopNavCategory}
            />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar
                    bookmarks={bookmarksData?.bookmarks ?? []}
                    onSelect={bookmarksData?.handleSelect}
                    onToggleBookmark={bookmarksData?.toggleBookmark}
                    activeTopNavCategory={activeTopNavCategory}
                />

                <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
                    {!isFinancialSetupFlow && <AppHeader />}
                    <div className="flex flex-1 overflow-hidden relative">
                        <main
                            ref={mainContentRef}
                            className={`flex-1 transition-all duration-300 ease-in-out ${
                                isFinancialSetupFlow ? 'overflow-hidden' : 'overflow-auto'
                            }`}
                        >
                            <MainContent isScrolled={isScrolled} />
                        </main>
                        <ItemDetailsPanel
                            task={detailedTask}
                            onClose={() => setDetailedTaskId(null)}
                            onPriorityChange={handlePriorityChange}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
export default AppLayout;