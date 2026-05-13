import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Plus,
    FileDiff,
    CheckSquare,
    Truck,
    CalendarDays,
    Package,
    Ticket,
    ClipboardList,
    FileQuestion,
    FileCheck,
    Search,
    MessageSquare,
    HelpCircle,
    Bell,
    Menu,
    X,
    ChevronDown,
    Check,
    MapPin,
    Building2,
    User,
    Phone,
    Briefcase,
    LayoutGrid,
    Calendar,
    Users,
    Contact,
    UserSquare,
    ListTodo,
    DollarSign,
    Receipt,
    FileText,
    HardHat,
    Activity,
    File,
    BookOpen,
    Map,
    Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import HoverMenu from './HoverMenu';
import ProjectDetailsCard from './ProjectDetailsCard';
import BookmarksMenu from './FavoritesMenu';
import Tooltip from './Tooltip';
import { useProject } from '../../../context/ProjectContext';
import { isHeaderCategoryLocked, getHeaderCategoryTooltip } from '../../../lib/financialGating';

// Custom CSS for responsive nav items 5+
const navResponsiveStyles = `
  @media (max-width: 1535px) {
    .nav-item-5 { display: none !important; }
    .nav-item-6 { display: none !important; }
    .nav-item-7 { display: none !important; }
    .nav-item-8 { display: none !important; }
  }
  @media (min-width: 1536px) {
    .nav-item-5 { display: block !important; }
  }
  @media (min-width: 1600px) {
    .nav-item-6 { display: block !important; }
  }
  @media (min-width: 1700px) {
    .nav-item-7 { display: block !important; }
  }
  @media (min-width: 1800px) {
    .nav-item-8 { display: block !important; }
  }
`;

// --- Icon Definitions ---

// Base wrapper for small nav icons (using Lucide)
const NavIconWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`flex items-center justify-center w-6 h-6 ${className}`}>
        {children}
    </div>
);

// Base wrapper for menu item icons (in hover menu)
const MenuIconWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${className}`}>
        {children}
    </div>
);

// Base wrapper for large main category icons
const MainIconWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className="relative w-[30.6px] h-[30.6px] flex items-center justify-center cursor-pointer">
        <div className={`absolute w-[34px] h-[34px] rounded-md transform -rotate-6 shadow-lg ${className} opacity-80`}></div>
        <div className={`absolute w-[34px] h-[34px] rounded-md transform rotate-6 shadow-lg ${className} opacity-90`}></div>
        <div className={`absolute w-[30.6px] h-[30.6px] rounded-md flex items-center justify-center shadow-2xl ${className}`}>
             <NavIconWrapper className="text-white">
                {children}
            </NavIconWrapper>
        </div>
    </div>
);


// --- All Icons (Lucide Mappings) ---

// Project Management
const ProjectIcon = () => <NavIconWrapper><Briefcase size={20} strokeWidth={1.5} /></NavIconWrapper>;
const PortfolioIcon = () => <NavIconWrapper><LayoutGrid size={20} strokeWidth={1.5} /></NavIconWrapper>;
const PlannerIcon = () => <NavIconWrapper><CalendarDays size={20} strokeWidth={1.5} /></NavIconWrapper>;
const ScheduleIcon = () => <NavIconWrapper><Calendar size={20} strokeWidth={1.5} /></NavIconWrapper>;

// Collaboration
const CommunicationIcon = () => <NavIconWrapper><MessageSquare size={20} strokeWidth={1.5} /></NavIconWrapper>;
const DirectoryIcon = () => <NavIconWrapper><Contact size={20} strokeWidth={1.5} /></NavIconWrapper>;
const MyTeamIcon = () => <NavIconWrapper><Users size={20} strokeWidth={1.5} /></NavIconWrapper>;

// Quality
const PunchlistIcon = () => <NavIconWrapper><ClipboardList size={20} strokeWidth={1.5} /></NavIconWrapper>;
const ChecklistIcon = () => <NavIconWrapper><CheckSquare size={20} strokeWidth={1.5} /></NavIconWrapper>;

// Finance
const ContractIcon = () => <NavIconWrapper><FileText size={20} strokeWidth={1.5} /></NavIconWrapper>;
const OwnerBillingIcon = () => <NavIconWrapper><DollarSign size={20} strokeWidth={1.5} /></NavIconWrapper>;
const SubsBillingIcon = () => <NavIconWrapper><Building2 size={20} strokeWidth={1.5} /></NavIconWrapper>;
const ChangeOrderIcon = () => <NavIconWrapper><FileDiff size={20} strokeWidth={1.5} /></NavIconWrapper>;
const RecurringCostIcon = () => <NavIconWrapper><Briefcase size={20} strokeWidth={1.5} /></NavIconWrapper>;
const CostsIcon = () => <NavIconWrapper><Receipt size={20} strokeWidth={1.5} /></NavIconWrapper>;
const TMIcon = () => <NavIconWrapper><Briefcase size={20} strokeWidth={1.5} /></NavIconWrapper>;
const AnalyticsFinanceIcon = () => <NavIconWrapper><Activity size={20} strokeWidth={1.5} /></NavIconWrapper>;
const ConfigureFinanceIcon = () => <NavIconWrapper><Settings size={24} strokeWidth={1.5} /></NavIconWrapper>;

// Field & Site
const SiteIcon = () => <NavIconWrapper><MapPin size={20} strokeWidth={1.5} /></NavIconWrapper>;
const FieldIcon = () => <NavIconWrapper><HardHat size={20} strokeWidth={1.5} /></NavIconWrapper>;
const EquipmentIcon = () => <NavIconWrapper><Truck size={20} strokeWidth={1.5} /></NavIconWrapper>;
const SafetyIcon = () => <NavIconWrapper><Activity size={20} strokeWidth={1.5} /></NavIconWrapper>;
const AnalyticsIcon = () => <NavIconWrapper><Activity size={20} strokeWidth={1.5} /></NavIconWrapper>; // Reusing Activity or could use BarChart
const FeedsIcon = () => <NavIconWrapper><Activity size={20} strokeWidth={1.5} /></NavIconWrapper>;

// Documentation
const DocumentIcon = () => <NavIconWrapper><File size={20} strokeWidth={1.5} /></NavIconWrapper>;
const PlansIcon = () => <NavIconWrapper><Map size={20} strokeWidth={1.5} /></NavIconWrapper>;
const RFIIcon = () => <NavIconWrapper><FileQuestion size={20} strokeWidth={1.5} /></NavIconWrapper>;
const SubmittalsIcon = () => <NavIconWrapper><FileCheck size={20} strokeWidth={1.5} /></NavIconWrapper>;
const SpecbookIcon = () => <NavIconWrapper><BookOpen size={20} strokeWidth={1.5} /></NavIconWrapper>;

// General Icons
const ReportsIcon = () => <NavIconWrapper><FileText size={20} strokeWidth={1.5} /></NavIconWrapper>;
const BookmarkNavIcon = () => <NavIconWrapper><BookOpen size={20} strokeWidth={1.5} /></NavIconWrapper>; // Or Bookmark icon
const SearchIcon = () => <Search size={20} strokeWidth={1.5} />;
const ChatIcon = () => <MessageSquare size={20} strokeWidth={1.5} />;
const HelpIcon = () => <HelpCircle size={20} strokeWidth={1.5} />;
const BellIcon = () => <Bell size={20} strokeWidth={1.5} />;
const MenuIcon = () => <Menu size={24} strokeWidth={1.5} />;
const XIcon = () => <X size={24} strokeWidth={1.5} />;


// --- Main Category Icons ---
const ProjectManagementMainIcon = () => <MainIconWrapper className="bg-orange-500"><Briefcase size={20} strokeWidth={1.5} /></MainIconWrapper>;
const CollaborationMainIcon = () => <MainIconWrapper className="bg-sky-500"><Users size={20} strokeWidth={1.5} /></MainIconWrapper>;
const QualityMainIcon = () => <MainIconWrapper className="bg-rose-500"><CheckSquare size={20} strokeWidth={1.5} /></MainIconWrapper>;
const FinanceMainIcon = () => <MainIconWrapper className="bg-green-500"><DollarSign size={20} strokeWidth={1.5} /></MainIconWrapper>;
const FieldOpsMainIcon = () => <MainIconWrapper className="bg-amber-500"><HardHat size={20} strokeWidth={1.5} /></MainIconWrapper>;
const DocumentationMainIcon = () => <MainIconWrapper className="bg-cyan-500"><FileText size={20} strokeWidth={1.5} /></MainIconWrapper>;
const BookmarksMainIcon = () => <MainIconWrapper className="bg-yellow-500"><BookOpen size={20} strokeWidth={1.5} /></MainIconWrapper>;

// --- Navigation Data Structure ---

// Fix: Add explicit type definitions for navigation data to resolve TypeScript error.
// These types match the props expected by HoverMenu.tsx.
interface PrimaryMenuItemData {
    key: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    navIcon: React.ReactNode;
}

interface MoreItem {
    key: 'more';
    title: 'More';
    items: string[];
}

interface StandardCategoryData {
    key: string;
    title: string;
    mainIcon: React.ReactNode;
    items: PrimaryMenuItemData[];
}

type CategoryData = StandardCategoryData | MoreItem;


const navigationData: { [key: string]: CategoryData } = {
    projectManagement: {
        key: 'projectManagement', title: 'Project Management', mainIcon: <ProjectManagementMainIcon/>,
        items: [
            { key: 'project', label: 'Project', description: 'Core project management', icon: <MenuIconWrapper className="bg-orange-100 text-orange-600"><ProjectIcon/></MenuIconWrapper>, navIcon: <ProjectIcon/> },
            { key: 'portfolio', label: 'Portfolio', description: 'Oversee multiple projects', icon: <MenuIconWrapper className="bg-gray-100 text-gray-600"><PortfolioIcon/></MenuIconWrapper>, navIcon: <PortfolioIcon/> },
            { key: 'planner', label: 'Planner', description: 'Task and milestone planning', icon: <MenuIconWrapper className="bg-blue-100 text-blue-600"><PlannerIcon/></MenuIconWrapper>, navIcon: <PlannerIcon/> },
            { key: 'schedule', label: 'Schedule', description: 'Detailed project timelines', icon: <MenuIconWrapper className="bg-purple-100 text-purple-600"><ScheduleIcon/></MenuIconWrapper>, navIcon: <ScheduleIcon/> },
        ]
    },
    collaboration: {
        key: 'collaboration', title: 'Collaboration', mainIcon: <CollaborationMainIcon/>,
        items: [
            { key: 'communication', label: 'Communication', description: 'Team messaging and updates', icon: <MenuIconWrapper className="bg-sky-100 text-sky-600"><CommunicationIcon/></MenuIconWrapper>, navIcon: <CommunicationIcon/> },
            { key: 'directory', label: 'Directory', description: 'Contact info for stakeholders', icon: <MenuIconWrapper className="bg-sky-100 text-sky-600"><DirectoryIcon/></MenuIconWrapper>, navIcon: <DirectoryIcon/> },
            { key: 'myTeam', label: 'My Team', description: 'Manage your direct team', icon: <MenuIconWrapper className="bg-sky-100 text-sky-600"><MyTeamIcon/></MenuIconWrapper>, navIcon: <MyTeamIcon/> },
        ]
    },
    quality: {
        key: 'quality', title: 'Quality', mainIcon: <QualityMainIcon/>,
        items: [
            { key: 'punchlist', label: 'Punchlist', description: 'Track and resolve issues', icon: <MenuIconWrapper className="bg-rose-100 text-rose-600"><PunchlistIcon/></MenuIconWrapper>, navIcon: <PunchlistIcon/> },
            { key: 'checklist', label: 'Checklist', description: 'Ensure standards are met', icon: <MenuIconWrapper className="bg-rose-100 text-rose-600"><ChecklistIcon/></MenuIconWrapper>, navIcon: <ChecklistIcon/> },
        ]
    },
    finance: {
        key: 'finance', title: 'Finance & Cost Control', mainIcon: <FinanceMainIcon/>,
        items: [
            { key: 'contract', label: 'Contract', description: 'Prime contract and budget management', icon: <MenuIconWrapper className="bg-green-100 text-green-600"><ContractIcon/></MenuIconWrapper>, navIcon: <ContractIcon/> },
            { key: 'ownerBilling', label: 'Owner Billing', description: 'Manage owner payment applications', icon: <MenuIconWrapper className="bg-green-100 text-green-600"><OwnerBillingIcon/></MenuIconWrapper>, navIcon: <OwnerBillingIcon/> },
            { key: 'subsBilling', label: 'Subs Billing', description: 'Subcontractor billing management', icon: <MenuIconWrapper className="bg-green-100 text-green-600"><SubsBillingIcon/></MenuIconWrapper>, navIcon: <SubsBillingIcon/> },
            { key: 'changeOrder', label: 'Change Order', description: 'Manage change orders and RFIs', icon: <MenuIconWrapper className="bg-teal-100 text-teal-600"><ChangeOrderIcon/></MenuIconWrapper>, navIcon: <ChangeOrderIcon/> },
            { key: 'recurringCost', label: 'Recurring Cost', description: 'Track recurring project costs', icon: <MenuIconWrapper className="bg-green-100 text-green-600"><RecurringCostIcon/></MenuIconWrapper>, navIcon: <RecurringCostIcon/> },
            { key: 'costs', label: 'Costs', description: 'Manage labor, materials, and equipment costs', icon: <MenuIconWrapper className="bg-green-100 text-green-600"><CostsIcon/></MenuIconWrapper>, navIcon: <CostsIcon/> },
            { key: 'tm', label: 'T&M', description: 'Time and materials tracking', icon: <MenuIconWrapper className="bg-green-100 text-green-600"><TMIcon/></MenuIconWrapper>, navIcon: <TMIcon/> },
            { key: 'analytics', label: 'Analytics', description: 'Financial reports and analytics', icon: <MenuIconWrapper className="bg-indigo-100 text-indigo-600"><AnalyticsFinanceIcon/></MenuIconWrapper>, navIcon: <AnalyticsFinanceIcon/> },
            { key: 'configure', label: 'Configure', description: 'Finance module settings', icon: <MenuIconWrapper className="bg-gray-100 text-gray-600"><ConfigureFinanceIcon/></MenuIconWrapper>, navIcon: <ConfigureFinanceIcon/> },
        ]
    },
    fieldOps: {
        key: 'fieldOps', title: 'Field & Site Operations', mainIcon: <FieldOpsMainIcon/>,
        items: [
            { key: 'site', label: 'Site', description: 'Daily site management tools', icon: <MenuIconWrapper className="bg-orange-100 text-orange-600"><SiteIcon/></MenuIconWrapper>, navIcon: <SiteIcon/> },
            { key: 'field', label: 'Field', description: 'Reports and data collection', icon: <MenuIconWrapper className="bg-amber-100 text-amber-600"><FieldIcon/></MenuIconWrapper>, navIcon: <FieldIcon/> },
            { key: 'equipment', label: 'Equipment', description: 'Track and manage equipment', icon: <MenuIconWrapper className="bg-amber-100 text-amber-600"><EquipmentIcon/></MenuIconWrapper>, navIcon: <EquipmentIcon/> },
            { key: 'safety', label: 'Safety', description: 'Compliance and reports', icon: <MenuIconWrapper className="bg-amber-100 text-amber-600"><SafetyIcon/></MenuIconWrapper>, navIcon: <SafetyIcon/> },
            { key: 'analytics', label: 'Analytics', description: 'Field data and insights', icon: <MenuIconWrapper className="bg-indigo-100 text-indigo-600"><AnalyticsIcon/></MenuIconWrapper>, navIcon: <AnalyticsIcon/> },
            { key: 'feeds', label: 'Feeds', description: 'Real-time project updates', icon: <MenuIconWrapper className="bg-yellow-100 text-yellow-600"><FeedsIcon/></MenuIconWrapper>, navIcon: <FeedsIcon/> },
        ]
    },
    documentation: {
        key: 'documentation', title: 'Documentation', mainIcon: <DocumentationMainIcon/>,
        items: [
            { key: 'document', label: 'Document', description: 'Central document repository', icon: <MenuIconWrapper className="bg-cyan-100 text-cyan-600"><DocumentIcon/></MenuIconWrapper>, navIcon: <DocumentIcon/> },
            { key: 'plans', label: 'Plans', description: 'View and manage blueprints', icon: <MenuIconWrapper className="bg-blue-100 text-blue-600"><PlansIcon/></MenuIconWrapper>, navIcon: <PlansIcon/> },
            { key: 'rfi', label: 'RFI', description: 'Manage requests for information', icon: <MenuIconWrapper className="bg-cyan-100 text-cyan-600"><RFIIcon/></MenuIconWrapper>, navIcon: <RFIIcon/> },
            { key: 'submittals', label: 'Submittals', description: 'Track and approve submittals', icon: <MenuIconWrapper className="bg-cyan-100 text-cyan-600"><SubmittalsIcon/></MenuIconWrapper>, navIcon: <SubmittalsIcon/> },
            { key: 'specbook', label: 'Specbook', description: 'Review project specifications', icon: <MenuIconWrapper className="bg-cyan-100 text-cyan-600"><SpecbookIcon/></MenuIconWrapper>, navIcon: <SpecbookIcon/> },
        ]
    },
    more: {
        key: 'more' as const, title: 'More',
        items: ['Reports', 'Configure']
    }
};

const menuLayout = {
    column1: ['projectManagement', 'collaboration', 'quality'],
    column2: ['finance', 'fieldOps'],
    column3: ['documentation', 'more'],
};

// --- Project Data ---
const projects = [
  {
    id: 'big-mall',
    name: 'Big Mall',
    details: [
      "4900 Moorpark Ave #326, San Jose, CA 95127, USA",
      "Owner - Build Enterprises",
      "GC - A to Z construction",
      "PM - Max Anderson",
      "+1 56535 - 7878"
    ]
  },
  {
    id: 'downtown-tower',
    name: 'Downtown Tower',
    details: [
      "123 Main St, San Francisco, CA 94105, USA",
      "Owner - Skyline Corp",
      "GC - Apex Builders",
      "PM - Jane Doe",
      "+1 415-555-1234"
    ]
  },
  {
    id: 'suburban-complex',
    name: 'Suburban Complex',
    details: [
      "789 Oak Rd, Palo Alto, CA 94301, USA",
      "Owner - Greenfield Dev",
      "GC - Summit Construction",
      "PM - John Smith",
      "+1 650-555-5678"
    ]
  }
];

type Project = typeof projects[0];


interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    isActive?: boolean;
    activeColor?: string;
    isLocked?: boolean;
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive = false, activeColor = 'text-white', isLocked = false, onClick }) => {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (isLocked) {
            e.preventDefault();
            return;
        }
        onClick(e);
    };

    return (
        <a
            href="#"
            onClick={handleClick}
            className={`flex flex-col items-center gap-2 transition-colors duration-200 pl-2 ${
                isLocked
                    ? 'text-gray-500 opacity-40 cursor-not-allowed'
                    : isActive
                      ? activeColor
                      : 'text-gray-300 hover:text-white'
            }`}
        >
            {icon}
            <span className={`text-[12px] ${isActive && !isLocked ? 'font-semibold' : 'font-medium'}`}>
                {label}
            </span>
        </a>
    );
};

// --- New ProjectSelector Component ---

const ChevronDownIcon = (props: React.ComponentProps<'svg'>) => (
    <ChevronDown size={16} strokeWidth={2} {...props} />
);

const CheckIcon = (props: React.ComponentProps<'svg'>) => (
    <Check size={16} strokeWidth={3} {...props} />
);


interface ProjectSelectorProps {
    projects: Project[];
    selectedProject: Project;
    onSelectProject: (project: Project) => void;
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({ projects, selectedProject, onSelectProject }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [selectorRef]);

    return (
        <Tooltip content={`Project: ${selectedProject.name}`} position="bottom" delay={400} disabled={isOpen}>
            <div className="relative" ref={selectorRef}>
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-1.5 px-2 py-1 text-[12.25px] bg-transparent hover:bg-gray-700/50 rounded-md transition-all border border-transparent hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 touch-manipulation group overflow-x-hidden"
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    aria-label="Select project"
                >
                    <span className="text-gray-300 text-[11.5px] font-medium uppercase tracking-wide whitespace-nowrap">Project:</span>
                    <span className="font-semibold text-white whitespace-nowrap">{selectedProject.name}</span>
                    <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDownIcon className="w-4 h-4 text-gray-300 group-hover:text-white transition-colors" />
                    </motion.div>
                </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 5 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute z-[100] left-0 md:left-auto right-0 md:right-auto w-full md:w-max md:min-w-full mt-1 bg-[#2a2a2a] border border-gray-600 rounded-md shadow-lg max-w-[280px] md:max-w-none"
                    >
                        <ul className="p-1" role="listbox">
                            {projects.map(project => (
                                <li 
                                    key={project.id}
                                    className="text-[12.25px] text-gray-200 rounded-sm hover:bg-cyan-600 hover:text-white cursor-pointer touch-manipulation min-h-[44px] flex items-center"
                                    onClick={() => {
                                        onSelectProject(project);
                                        setIsOpen(false);
                                    }}
                                    role="option"
                                    aria-selected={project.id === selectedProject.id}
                                >
                                    <div className="flex items-center justify-between px-3 py-2 md:px-2 md:py-1 w-full">
                                        <span>{project.name}</span>
                                        {project.id === selectedProject.id && <CheckIcon className="w-4 h-4"/>}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
            </div>
        </Tooltip>
    );
};


type StandardCategoryKey = Exclude<keyof typeof navigationData, 'more'>;
type CategoryKeyWithBookmarks = StandardCategoryKey | 'bookmarks';

const categoryAbbreviations: { [key in CategoryKeyWithBookmarks]: string } = {
    projectManagement: 'PM',
    collaboration: 'Team',
    quality: 'Quality',
    finance: 'Finance',
    fieldOps: 'Field',
    documentation: 'Docs',
    bookmarks: 'Bookmarks',
};

interface HeaderProps {
    onSelectionChange: (title: string) => void;
    version?: 'v1' | 'v2';
    onBookmarksDataChange?: (data: {
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
    }) => void;
    onActiveCategoryChange?: (categoryKey: string) => void;
}

// Bookmarks management with localStorage
const BOOKMARKS_STORAGE_KEY = 'linarc-bookmarks';

const useBookmarks = () => {
    const [bookmarks, setBookmarks] = useState<Set<string>>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
            return stored ? new Set(JSON.parse(stored)) : new Set();
        }
        return new Set();
    });

    const toggleBookmark = (categoryKey: string, itemKey: string) => {
        const bookmarkKey = `${categoryKey}:${itemKey}`;
        setBookmarks(prev => {
            const newBookmarks = new Set(prev);
            if (newBookmarks.has(bookmarkKey)) {
                newBookmarks.delete(bookmarkKey);
            } else {
                newBookmarks.add(bookmarkKey);
            }
            if (typeof window !== 'undefined') {
                localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(Array.from(newBookmarks)));
            }
            return newBookmarks;
        });
    };

    const getBookmarkItems = (navigationData: { [key: string]: CategoryData }): Array<{
        categoryKey: string;
        itemKey: string;
        label: string;
        description: string;
        icon: React.ReactNode;
        navIcon: React.ReactNode;
    }> => {
        const bookmarkItems: Array<{
            categoryKey: string;
            itemKey: string;
            label: string;
            description: string;
            icon: React.ReactNode;
            navIcon: React.ReactNode;
        }> = [];

        bookmarks.forEach(bookmarkKey => {
            const [categoryKey, itemKey] = bookmarkKey.split(':');
            const category = navigationData[categoryKey];
            if (category && 'items' in category && category.key !== 'more') {
                const standardCategory = category as StandardCategoryData;
                const item: PrimaryMenuItemData | undefined = standardCategory.items.find((i: PrimaryMenuItemData) => i.key === itemKey);
                if (item) {
                    bookmarkItems.push({
                        categoryKey,
                        itemKey,
                        label: item.label,
                        description: item.description,
                        icon: item.icon,
                        navIcon: item.navIcon,
                    });
                }
            }
        });

        return bookmarkItems;
    };

    return { bookmarks, toggleBookmark, getBookmarkItems };
};

const Header: React.FC<HeaderProps> = ({ onSelectionChange, version = 'v1', onBookmarksDataChange, onActiveCategoryChange }) => {
    const [isMenuVisible, setMenuVisible] = useState(false);
    const [isBookmarksMenuVisible, setBookmarksMenuVisible] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [activeCategoryKey, setActiveCategoryKey] = useState<StandardCategoryKey>('finance');
    const [activeSubcategoryKey, setActiveSubcategoryKey] = useState<string>('contract');
    const [selectedProject, setSelectedProject] = useState<Project>(projects[0]);
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const hoverMenuRef = useRef<HTMLDivElement>(null);
    const bookmarksMenuRef = useRef<HTMLDivElement>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { activeViewMode, activeView, financialSetupStep } = useProject();
    const { bookmarks, toggleBookmark, getBookmarkItems } = useBookmarks();

    const hoverCountRef = useRef(0);

    const handleMenuEnter = () => {
        if (isMobile) return;
        hoverCountRef.current++;
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        setMenuVisible(true);
        setBookmarksMenuVisible(false);
    };

    const handleMenuLeave = () => {
        if (isMobile) return;
        hoverCountRef.current--;
        if (hoverCountRef.current < 0) hoverCountRef.current = 0;

        if (hoverCountRef.current === 0) {
            hoverTimeoutRef.current = setTimeout(() => {
                setMenuVisible(false);
            }, 300);
        }
    };

    // Detect mobile device
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Notify parent of active category changes (for sidebar)
    useEffect(() => {
        if (onActiveCategoryChange && activeCategoryKey === 'finance') {
            onActiveCategoryChange(activeSubcategoryKey);
        }
    }, [activeCategoryKey, activeSubcategoryKey, onActiveCategoryChange]);

    // Synchronize Top Nav with view modes and Advanced Spreadsheet templates
    useEffect(() => {
        // Specific logic for Advanced Spreadsheet templates (V3/V4)
        if (activeViewMode === 'spreadsheetV3' || activeViewMode === 'spreadsheetV4') {
            if (activeView.v3ActiveSheetId === 'sheet-schedule') {
                setActiveCategoryKey('projectManagement');
                setActiveSubcategoryKey('planner');
                return;
            } else if (activeView.v3ActiveSheetId === 'sheet-budget') {
                setActiveCategoryKey('finance');
                setActiveSubcategoryKey('contract');
                return;
            }

            // Default for Spreadsheet + (V4) if no specific sheet match
            if (activeViewMode === 'spreadsheetV4') {
                setActiveCategoryKey('finance');
                setActiveSubcategoryKey('contract');
                return;
            }
        }

        if (activeViewMode === 'dashboard') {
            setActiveCategoryKey('projectManagement');
            setActiveSubcategoryKey('project');
        } else if (activeViewMode === 'table' || activeViewMode === 'board') {
            setActiveCategoryKey('documentation');
            setActiveSubcategoryKey('rfi');
        } else if (activeViewMode.startsWith('spreadsheet')) {
            setActiveCategoryKey('finance');
            setActiveSubcategoryKey('contract');
        } else if (activeViewMode === 'gantt') {
            setActiveCategoryKey('projectManagement');
            setActiveSubcategoryKey('schedule');
        } else if (activeViewMode === 'lookahead') {
            setActiveCategoryKey('projectManagement');
            setActiveSubcategoryKey('planner');
        }
    }, [activeViewMode, activeView]);

    const categoryColors: { [key: string]: string } = {
        projectManagement: 'text-orange-500',
        collaboration: 'text-sky-500',
        quality: 'text-rose-500',
        finance: 'text-green-500',
        fieldOps: 'text-amber-500',
        documentation: 'text-cyan-500',
        bookmarks: 'text-yellow-500',
    };

    const bookmarkItems = getBookmarkItems(navigationData);

    // FIX: Add type guard to safely access properties on `category`.
    // This ensures `category` is a `StandardCategoryData` before we try to find an item in its `items` array.
    const handleSelect = useCallback((categoryKey: string, subcategoryKey: string) => {
        if (isHeaderCategoryLocked(categoryKey, financialSetupStep)) return;
        if (categoryKey !== 'more') {
            const category = navigationData[categoryKey];
            if ('mainIcon' in category) { // Type guard
                const subcategory = category.items.find(item => item.key === subcategoryKey);

                if (subcategory) {
                    setActiveCategoryKey(categoryKey as StandardCategoryKey);
                    setActiveSubcategoryKey(subcategoryKey);
                    onSelectionChange(`${category.title} / ${subcategory.label}`);
                }
            }
        }
        setMenuVisible(false);
        setBookmarksMenuVisible(false);
    }, [navigationData, onSelectionChange, financialSetupStep]);

    // Expose bookmarks data to parent for v2 sidebar integration
    useEffect(() => {
        if (version === 'v2' && onBookmarksDataChange) {
            onBookmarksDataChange({
                bookmarks: bookmarkItems,
                toggleBookmark,
                handleSelect
            });
        }
    }, [version, bookmarkItems, toggleBookmark, onBookmarksDataChange, handleSelect]);

    const handleProjectSelect = (project: Project) => {
        setSelectedProject(project);
    };

    // Close mobile menu on outside click or ESC key
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
                setIsMobileMenuOpen(false);
            }
            // Close hover menu on mobile when clicking outside
            if (isMobile && hoverMenuRef.current && !hoverMenuRef.current.contains(event.target as Node)) {
                setMenuVisible(false);
            }
            // Close bookmarks menu when clicking outside
            if (bookmarksMenuRef.current && !bookmarksMenuRef.current.contains(event.target as Node)) {
                setBookmarksMenuVisible(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsMobileMenuOpen(false);
                if (isMobile) {
                    setMenuVisible(false);
                }
            }
        };

        if (isMobileMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
            if (isMobileMenuOpen) {
                document.body.style.overflow = 'hidden'; // Prevent body scroll when menu is open
            }
        } else if (isMobile && isMenuVisible) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
            if (isMobileMenuOpen) {
                document.body.style.overflow = '';
            }
        };
    }, [isMobileMenuOpen, isMobile, isMenuVisible, isBookmarksMenuVisible]);

    const activeCategory = navigationData[activeCategoryKey];

    // FIX: Add a type guard to ensure activeCategory is of type StandardCategoryData.
    // This resolves errors related to accessing properties like `mainIcon` and iterating over `items`
    // which are not guaranteed to exist on the general `CategoryData` type.
    if (!('mainIcon' in activeCategory)) {
        // This path should be unreachable given the state logic, but it's needed for type safety.
        return null;
    }

    const navItems = activeCategory.items;
    const activeColor = categoryColors[activeCategoryKey] || 'text-white';

    // Version-specific styling
    const headerClasses = version === 'v1' 
        ? "relative z-[100] bg-[#1e1e1e] text-white font-['Lato'] shadow-lg h-[72px] border-b-[2px] border-gray-600"
        : "relative z-[100] bg-[#1a1a1a] text-white font-['Lato'] shadow-xl min-h-[72px] lg:h-[72px] border-b-2 border-cyan-500/50";
    
    const hoverMenuClasses = version === 'v1'
        ? "bg-black -ml-2 -mt-3 -mb-[10px] self-stretch flex flex-col justify-center items-center rounded-none border-b-2 border-gray-600 pt-[7px]"
        : "hover:bg-zinc-900/30 px-2 py-2 rounded-md";
    
    const bookmarksMenuClasses = version === 'v1'
        ? ""
        : "hover:bg-zinc-900/30";
    
    const projectPanelClasses = version === 'v1'
        ? "bg-[#252525]/50 rounded-lg border border-gray-700/50"
        : "bg-[#252525]/70 rounded-lg border border-cyan-600/30";
    
    const chevronBgClasses = version === 'v1'
        ? "bg-[#1e1e1e]"
        : "bg-[#1a1a1a]";

    const containerPaddingClasses = "pl-2 pr-2 lg:pr-0 pt-3 pb-2";

    return (
        <header className={headerClasses}>
            <style>{navResponsiveStyles}</style>
            <div className={`${containerPaddingClasses} flex items-center h-full`}>
                {/* Left & Center Nav Items */}
                <div className="flex items-center gap-x-3 flex-1 min-w-0 h-full">
                    {/* Main Category Menu */}
                    <div 
                        ref={hoverMenuRef}
                        className={`relative flex flex-col items-center gap-1 ${hoverMenuClasses} transition-colors cursor-pointer group shrink-0`}
                        style={{ width: '82px' }}
                        onMouseEnter={handleMenuEnter}
                        onMouseLeave={handleMenuLeave}
                        onClick={() => {
                            if (isMobile) {
                                setMenuVisible(!isMenuVisible);
                                setBookmarksMenuVisible(false);
                            }
                        }}
                        role="button"
                        aria-haspopup="true"
                        aria-expanded={isMenuVisible}
                        aria-label={`${activeCategory.title} menu`}
                    >
                        <div className="relative flex items-center justify-center">
                            {activeCategory.mainIcon}
                            <motion.div
                                animate={{ rotate: isMenuVisible ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                                className={`absolute -bottom-1 ${chevronBgClasses} rounded-full p-0.5`}
                                style={{ right: '-14px' }}
                            >
                                <ChevronDownIcon className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" style={{ marginLeft: '0px', marginRight: '0px' }} />
                            </motion.div>
                        </div>
                        <span className="text-[12px] font-bold text-white whitespace-nowrap">{categoryAbbreviations[activeCategoryKey]}</span>
                        <div className="absolute top-full h-1 w-full" aria-hidden />
                        <AnimatePresence>
                            {isMenuVisible && 
                                <HoverMenu 
                                    navigationData={navigationData}
                                    menuLayout={menuLayout}
                                    onSelect={handleSelect}
                                    onClose={() => setMenuVisible(false)}
                                    bookmarks={bookmarks}
                                    onToggleBookmark={toggleBookmark}
                                    triggerRef={hoverMenuRef}
                                    onMouseEnter={handleMenuEnter}
                                    onMouseLeave={handleMenuLeave}
                                />
                            }
                        </AnimatePresence>
                    </div>
                    {/* Bookmarks Button - Removed but kept for future use */}
                    {/* {version === 'v1' && (
                    <div
                        ref={bookmarksMenuRef}
                        className={`relative flex flex-col items-center gap-2 pl-[15px] pr-2 py-2 rounded-md ${bookmarksMenuClasses} transition-colors cursor-pointer group shrink-0`}
                        onClick={() => {
                            setBookmarksMenuVisible(!isBookmarksMenuVisible);
                            if (!isBookmarksMenuVisible) {
                                setMenuVisible(false);
                            }
                        }}
                        role="button"
                        aria-haspopup="true"
                        aria-expanded={isBookmarksMenuVisible}
                        aria-label="Bookmarks menu"
                    >
                        <div className="relative flex items-center justify-center">
                            <BookmarkNavIcon />
                            <motion.div
                                animate={{ rotate: isBookmarksMenuVisible ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                                className={`absolute -bottom-1 -right-2 rounded-full p-0.5`}
                            >
                                <ChevronDownIcon className="w-[14px] h-[14px] text-gray-400 group-hover:text-white transition-colors flex flex-col gap-0 justify-center items-center p-0 -mx-[5px] -my-[9px]" />
                            </motion.div>
                        </div>
                        <span className="text-[12px] font-medium text-gray-300 group-hover:text-white whitespace-nowrap transition-colors">{categoryAbbreviations.bookmarks}</span>
                        <div className="absolute top-full h-4 w-full" />
                        <AnimatePresence>
                            {isBookmarksMenuVisible &&
                                <BookmarksMenu
                                    bookmarks={bookmarkItems}
                                    onSelect={handleSelect}
                                    onToggleBookmark={toggleBookmark}
                                    onClose={() => setBookmarksMenuVisible(false)}
                                    position="bottom"
                                    triggerRef={bookmarksMenuRef}
                                />
                            }
                        </AnimatePresence>
                    </div>
                    )} */}
                    <nav className="flex-1 min-w-0">
                        <ul className="flex items-center gap-x-[42px]">
                            {navItems.map((item, index) => {
                                // First 2 items always visible
                                // Subsequent items hide progressively as screen shrinks
                                let responsiveClass = "";
                                if (index === 2) responsiveClass = "hidden md:block";
                                else if (index === 3) responsiveClass = "hidden lg:block";
                                else if (index === 4) responsiveClass = "hidden xl:block";
                                else if (index === 5) responsiveClass = "nav-item-5";
                                else if (index === 6) responsiveClass = "nav-item-6";
                                else if (index === 7) responsiveClass = "nav-item-7";
                                else if (index === 8) responsiveClass = "nav-item-8";

                                const locked = isHeaderCategoryLocked(item.key, financialSetupStep);
                                const tip = getHeaderCategoryTooltip(item.key, financialSetupStep);

                                const navItemElement = (
                                    <NavItem
                                        icon={item.navIcon}
                                        label={item.label}
                                        isActive={item.key === activeSubcategoryKey}
                                        activeColor={activeColor}
                                        isLocked={locked}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (!locked) {
                                                setActiveSubcategoryKey(item.key);
                                                onSelectionChange(`${activeCategory.title} / ${item.label}`);
                                            }
                                        }}
                                    />
                                );

                                return (
                                    <li key={item.key} className={responsiveClass}>
                                        {locked && tip ? (
                                            <Tooltip content={tip} position="bottom" delay={300}>
                                                {navItemElement}
                                            </Tooltip>
                                        ) : (
                                            navItemElement
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>
                </div>


                <div className="hidden lg:flex items-center h-full shrink-0">
                    <div className="h-7 w-px bg-gray-700 ml-3 lg:ml-4 mr-3 lg:mr-4"></div>
                    {/* Project Panel */}
                    <div className={`flex items-center gap-2 pr-3 lg:pr-4 pl-2.5 ${projectPanelClasses} py-1.5`}>
                        <ProjectSelector
                            projects={projects}
                            selectedProject={selectedProject}
                            onSelectProject={handleProjectSelect}
                        />
                        <ProjectDetailsCard project={selectedProject} />
                    </div>
                </div>

                <div className="hidden xl:flex items-center h-full shrink-0">
                    {/* Vertical Divider */}
                    <div className="h-7 w-px bg-gray-700 ml-3 lg:ml-4 mr-3 lg:mr-4"></div>

                    {/* Action Icons */}
                    <div className="flex items-center gap-x-3 lg:gap-x-4 pr-3 lg:pr-4">
                        <Tooltip content="Search" position="bottom" delay={400}>
                            <button className="text-gray-300 hover:text-white transition-colors duration-200 touch-manipulation" aria-label="Search">
                                <SearchIcon />
                            </button>
                        </Tooltip>
                        <Tooltip content="Chat" position="bottom" delay={400}>
                            <button className="text-gray-300 hover:text-white transition-colors duration-200 touch-manipulation" aria-label="Chat">
                                <ChatIcon />
                            </button>
                        </Tooltip>
                        <Tooltip content="Help" position="bottom" delay={400}>
                            <button className="text-gray-300 hover:text-white transition-colors duration-200 touch-manipulation" aria-label="Help">
                                <HelpIcon />
                            </button>
                        </Tooltip>
                        <Tooltip content="Notifications" position="left" delay={400}>
                            <button className="text-gray-300 hover:text-white transition-colors duration-200 touch-manipulation" aria-label="Notifications">
                                <BellIcon />
                            </button>
                        </Tooltip>
                        <Tooltip content="User Profile" position="left" delay={400}>
                            <div className="w-9 h-9 rounded-full bg-black border border-gray-600 flex items-center justify-center cursor-pointer hover:border-gray-500 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>
                                </svg>
                            </div>
                        </Tooltip>
                    </div>
                </div>

                {/* Hamburger Menu Button - Always Rightmost when visible */}
                <button
                    onClick={() => {
                        setIsMobileMenuOpen(true);
                    }}
                    className="xl:hidden text-gray-300 hover:text-white transition-colors duration-200 touch-manipulation p-2 pr-4 focus:outline-none ml-auto xl:ml-0"
                    aria-label="Open menu"
                    aria-expanded={isMobileMenuOpen}
                >
                    <MenuIcon />
                </button>
            </div>

            {/* Mobile Menu Slide-Out Panel */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop/Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black/50 z-40 xl:hidden"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        
                        {/* Slide-Out Panel */}
                        <motion.div
                            ref={mobileMenuRef}
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-[280px] max-w-[85vw] bg-[#1e1e1e] shadow-2xl z-50 xl:hidden flex flex-col overflow-x-hidden"
                        >
                            {/* Header with Close Button */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-700">
                                <h2 className="text-lg font-semibold text-white">Menu</h2>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-gray-300 hover:text-white transition-colors duration-200 touch-manipulation p-2"
                                    aria-label="Close menu"
                                >
                                    <XIcon />
                                </button>
                            </div>

                            {/* Menu Items */}
                            <div className="flex-1 overflow-y-auto overflow-x-hidden py-4">
                                <div className="space-y-1 px-2">
                                    {/* Project Selector Section */}
                                    <div className="mb-4 pb-4 border-b border-gray-700">
                                        <div className="px-4 mb-2">
                                            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Project</div>
                                        </div>
                                        <div className="px-2">
                                            <ProjectSelector
                                                projects={projects}
                                                selectedProject={selectedProject}
                                                onSelectProject={(project) => {
                                                    handleProjectSelect(project);
                                                }}
                                            />
                                        </div>
                                        <div className="px-2 mt-2">
                                            <ProjectDetailsCard project={selectedProject} />
                                        </div>
                                    </div>
                                    
                                    {/* Active Category Tools Section */}
                                    <div className="mb-4 pb-4 border-b border-gray-700">
                                        <div className="px-4 mb-2 flex items-center justify-between">
                                            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">{activeCategory.title}</div>
                                            <div className={`w-1.5 h-1.5 rounded-full ${activeColor.replace('text-', 'bg-')}`}></div>
                                        </div>
                                        <div className="space-y-1 px-2">
                                            {navItems.map((item) => (
                                                <button
                                                    key={item.key}
                                                    onClick={() => {
                                                        setActiveSubcategoryKey(item.key);
                                                        onSelectionChange(`${activeCategory.title} / ${item.label}`);
                                                        setIsMobileMenuOpen(false);
                                                    }}
                                                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 touch-manipulation text-left group ${
                                                        item.key === activeSubcategoryKey 
                                                            ? `${activeColor} bg-white/5 font-semibold` 
                                                            : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                                                    }`}
                                                >
                                                    <div className={`transition-transform duration-200 group-active:scale-95 ${item.key === activeSubcategoryKey ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
                                                        {item.navIcon}
                                                    </div>
                                                    <span className="text-[14px]">{item.label}</span>
                                                    {item.key === activeSubcategoryKey && (
                                                        <div className="ml-auto">
                                                            <div className={`w-2 h-2 rounded-full ${activeColor.replace('text-', 'bg-')}`}></div>
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Actions Section */}
                                    <div className="px-4 mb-2">
                                        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Actions</div>
                                    </div>
                                    
                                    <button
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            // Add search functionality here
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors duration-200 touch-manipulation text-left"
                                        aria-label="Search"
                                    >
                                        <SearchIcon />
                                        <span className="text-sm font-medium">Search</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            // Add chat functionality here
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors duration-200 touch-manipulation text-left"
                                        aria-label="Chat"
                                    >
                                        <ChatIcon />
                                        <span className="text-sm font-medium">Chat</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            // Add help functionality here
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors duration-200 touch-manipulation text-left"
                                        aria-label="Help"
                                    >
                                        <HelpIcon />
                                        <span className="text-sm font-medium">Help</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            // Add notifications functionality here
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors duration-200 touch-manipulation text-left"
                                        aria-label="Notifications"
                                    >
                                        <BellIcon />
                                        <span className="text-sm font-medium">Notifications</span>
                                    </button>
                                </div>
                            </div>

                            {/* User Profile Section */}
                            <div className="border-t border-gray-700 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-black border border-gray-600 flex items-center justify-center shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-white truncate">User Profile</div>
                                        <div className="text-xs text-gray-400 truncate">user@example.com</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </header>
    );
};

export default Header;