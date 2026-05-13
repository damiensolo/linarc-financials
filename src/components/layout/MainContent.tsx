
import React from 'react';
import { useProject } from '../../context/ProjectContext';
import TableView from '../views/table/TableView';
import SpreadsheetViewV2 from '../views/spreadsheetV2/SpreadsheetViewV2';
import SpreadsheetViewV4 from '../views/spreadsheetV4/SpreadsheetViewV4';

const MainContent: React.FC<{ isScrolled: boolean }> = ({ isScrolled }) => {
    const { activeViewMode, activeView } = useProject();

    const renderView = () => {
        switch(activeViewMode) {
          case 'table':
            return <TableView key={activeView.id} isScrolled={isScrolled} />;
          case 'spreadsheetV2':
            return <SpreadsheetViewV2 key={activeView.id} />;
          case 'spreadsheetV4':
            return <SpreadsheetViewV4 key={activeView.id} />;
          default:
            return null;
        }
    }

    return <>{renderView()}</>;
};

export default MainContent;
