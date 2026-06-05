import React, { useState, useRef, useEffect } from 'react';
import {
    Bookmark,
    FileText,
    DollarSign,
    Users,
    FileDiff,
    Clock,
    Briefcase,
    TrendingUp,
    Settings,
    CheckCircle,
    BarChart,
    Building2,
    User,
    Clock as ClockIcon,
    Package,
    Zap,
    Wrench,
    HandCoins
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BookmarksMenu from './FavoritesMenu';
import Tooltip from './Tooltip';
import { useProject } from '../../../context/ProjectContext';
import { useFinancialGating } from '../../../hooks/useFinancialGating';
import { getSidebarItemKeyForSetupStep } from '../../../lib/financialGating';
// import { QuickCreateMenu } from './QuickCreateMenu'; // Keep for future use

// --- Icon Definitions ---

const IconWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex items-center justify-center w-6 h-8 text-current">
        {children}
    </div>
);

// Finance Module Icons
const ContractIcon = () => <IconWrapper><FileText size={24} strokeWidth={1.5} /></IconWrapper>;
const BudgetIcon = () => <IconWrapper><DollarSign size={24} strokeWidth={1.5} /></IconWrapper>;
const SOVIcon = () => <IconWrapper><Briefcase size={24} strokeWidth={1.5} /></IconWrapper>;
const CommitmentIcon = () => <IconWrapper><CheckCircle size={24} strokeWidth={1.5} /></IconWrapper>;
const AdjustmentIcon = () => <IconWrapper><Wrench size={24} strokeWidth={1.5} /></IconWrapper>;
const AllocateIcon = () => <IconWrapper><HandCoins size={24} strokeWidth={1.5} /></IconWrapper>;
const CLSIcon = () => <IconWrapper><FileText size={24} strokeWidth={1.5} /></IconWrapper>;
const BillingIcon = () => <IconWrapper><DollarSign size={24} strokeWidth={1.5} /></IconWrapper>;

// Owner Billing Icons
const MyProgressIcon = () => <IconWrapper><TrendingUp size={24} strokeWidth={1.5} /></IconWrapper>;
const OpenIcon = () => <IconWrapper><FileText size={24} strokeWidth={1.5} /></IconWrapper>;
const PayAppsIcon = () => <IconWrapper><DollarSign size={24} strokeWidth={1.5} /></IconWrapper>;
const InvoiceIcon = () => <IconWrapper><FileText size={24} strokeWidth={1.5} /></IconWrapper>;

// Change Order Icons
const BoardsIcon = () => <IconWrapper><Briefcase size={24} strokeWidth={1.5} /></IconWrapper>;
const LogIcon = () => <IconWrapper><FileText size={24} strokeWidth={1.5} /></IconWrapper>;
const CompletedIcon = () => <IconWrapper><CheckCircle size={24} strokeWidth={1.5} /></IconWrapper>;
const CancelledIcon = () => <IconWrapper><Zap size={24} strokeWidth={1.5} /></IconWrapper>;
const BilledIcon = () => <IconWrapper><DollarSign size={24} strokeWidth={1.5} /></IconWrapper>;

// Costs Icons
const LaborIcon = () => <IconWrapper><User size={24} strokeWidth={1.5} /></IconWrapper>;
const OverheadIcon = () => <IconWrapper><Building2 size={24} strokeWidth={1.5} /></IconWrapper>;
const OthersIcon = () => <IconWrapper><Package size={24} strokeWidth={1.5} /></IconWrapper>;
const SubcontractorIcon = () => <IconWrapper><Users size={24} strokeWidth={1.5} /></IconWrapper>;
const EquipmentIcon = () => <IconWrapper><Wrench size={24} strokeWidth={1.5} /></IconWrapper>;

// Analytics Icons
const SummaryIcon = () => <IconWrapper><BarChart size={24} strokeWidth={1.5} /></IconWrapper>;
const JobCostIcon = () => <IconWrapper><DollarSign size={24} strokeWidth={1.5} /></IconWrapper>;
const ProfitIcon = () => <IconWrapper><TrendingUp size={24} strokeWidth={1.5} /></IconWrapper>;
const BudgetUtilIcon = () => <IconWrapper><Briefcase size={24} strokeWidth={1.5} /></IconWrapper>;

// Recurring Cost Icons
const ConfigIcon = () => <IconWrapper><Settings size={24} strokeWidth={1.5} /></IconWrapper>;
const RequestsIcon = () => <IconWrapper><FileText size={24} strokeWidth={1.5} /></IconWrapper>;
const UnapprovedIcon = () => <IconWrapper><Clock size={24} strokeWidth={1.5} /></IconWrapper>;
const HistoryIcon = () => <IconWrapper><FileText size={24} strokeWidth={1.5} /></IconWrapper>;

// Bookmarks Icon
const BookmarksIcon = () => (
    <IconWrapper>
        <Bookmark size={24} strokeWidth={1.5} />
    </IconWrapper>
);

const LinarcLogo = () => (
    <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
        <path fillRule="evenodd" clipRule="evenodd" d="M24.6239 7.72644V7.73027C24.5873 7.96942 24.5527 8.20666 24.518 8.44581L23.9966 11.9451L23.8677 12.8711C23.8465 13.0356 23.835 13.2078 23.8254 13.3781C23.8138 13.5465 23.8042 13.711 23.785 13.8622C23.7407 14.5547 23.7523 15.2473 23.8215 15.9323C23.8869 16.6784 24.0563 17.4093 24.3237 18.1038C24.6123 18.8959 25.076 19.6095 25.6821 20.1969C26.3151 20.7919 27.0963 21.2185 27.9602 21.4385C28.6952 21.6165 29.4591 21.6815 30.2249 21.6318C30.7559 21.5992 31.2543 21.5552 31.7353 21.5112C32.4761 21.4462 33.1783 21.3831 33.9114 21.3677C34.9543 21.3524 35.9914 21.4156 37.015 21.5591C37.0535 21.5667 37.0939 21.5591 37.1285 21.5419C37.1631 21.5246 37.192 21.494 37.2093 21.4596C37.2266 21.4251 37.2305 21.385 37.2228 21.3486C37.2132 21.3123 37.192 21.2797 37.1612 21.2568C36.3011 20.5833 35.3256 20.0591 34.2751 19.7013C33.6555 19.4851 33.0206 19.311 32.3722 19.1809L30.5423 18.8365C30.0613 18.7485 29.5976 18.5993 29.1647 18.3908C28.8588 18.2358 28.5971 18.01 28.4066 17.7326C27.991 17.0324 27.7697 16.2326 27.7601 15.408C27.7313 14.9106 27.7274 14.3845 27.7313 13.8488L27.8352 12.1326C27.9044 10.8775 27.8813 9.62436 27.762 8.38268C27.6562 7.12186 27.4292 5.88018 27.0828 4.67102C26.7846 3.59387 26.3344 2.56838 25.7456 1.62324C25.7244 1.59837 25.6956 1.57924 25.6629 1.56967C25.6302 1.56011 25.5955 1.56011 25.5609 1.56967C25.5282 1.57924 25.4974 1.59837 25.4724 1.62324C25.4493 1.64812 25.432 1.68064 25.4262 1.71317C25.2011 3.81198 24.9106 5.76921 24.6219 7.73218L24.6239 7.72644ZM44.0898 33.7061C42.3832 32.4683 40.8324 31.2457 39.2758 30.0194C39.0853 29.8701 38.8948 29.719 38.7043 29.5698L35.9317 27.381L35.1948 26.809C35.062 26.7095 34.9177 26.6138 34.7773 26.5201C34.6368 26.4282 34.5002 26.3364 34.379 26.2446C33.8017 25.8619 33.1957 25.529 32.5665 25.2459C31.8854 24.9302 31.1696 24.7121 30.4346 24.5973C29.6053 24.4519 28.7549 24.494 27.9429 24.7235C27.1117 24.9704 26.3517 25.4314 25.7302 26.0647C25.2088 26.6081 24.772 27.2318 24.4334 27.9167C24.1967 28.3893 23.987 28.8389 23.783 29.2751C23.4713 29.9447 23.1731 30.5799 22.821 31.217C22.315 32.1201 21.7416 32.981 21.1066 33.7903C21.0816 33.819 21.0662 33.8573 21.0643 33.8975C21.0624 33.9376 21.0739 33.9759 21.0951 34.0084C21.1163 34.041 21.149 34.0639 21.1855 34.0754C21.2221 34.0869 21.2606 34.0831 21.2952 34.0677C22.3073 33.6621 23.2501 33.0863 24.0851 32.3611C24.5815 31.9364 25.0491 31.4772 25.4859 30.9855L26.698 29.5851C27.0136 29.2158 27.3753 28.8925 27.7717 28.6227C28.0584 28.4352 28.3835 28.3242 28.7202 28.2975C29.5341 28.2898 30.3384 28.4964 31.058 28.8982C31.5044 29.1201 31.9604 29.3784 32.4241 29.6501L33.8595 30.5933C34.9119 31.2783 36.0106 31.8809 37.1458 32.3975C38.2906 32.9351 39.4817 33.3579 40.7015 33.6602C41.7848 33.9396 42.8969 34.062 44.0109 34.0276C44.0437 34.0218 44.0744 34.0065 44.0995 33.9836C44.1245 33.9606 44.1418 33.93 44.1495 33.8956C44.1572 33.8611 44.1572 33.8267 44.1476 33.7922C44.1379 33.7597 44.1187 33.7291 44.0918 33.7081L44.0898 33.7061ZM12.1423 31.5633C10.2875 32.2942 8.43845 33.0231 6.49898 33.8803C6.46627 33.8917 6.43163 33.8936 6.397 33.886C6.36237 33.8783 6.33158 33.8611 6.30657 33.8362C6.28156 33.8114 6.26424 33.7808 6.25462 33.7482C6.24692 33.7157 6.24885 33.6813 6.26039 33.6507C6.78951 32.6673 7.45525 31.7642 8.24412 30.9664C9.12151 30.0615 10.0893 29.2426 11.1341 28.5213C12.1558 27.7962 13.2352 27.1476 14.3627 26.5813L15.9097 25.8122C16.3792 25.5462 16.8352 25.2803 17.2527 25.0067C17.9665 24.5858 18.5514 23.9927 18.9536 23.2829C19.0998 22.9787 19.1652 22.64 19.146 22.2976C19.1114 21.8174 19.0094 21.3429 18.8439 20.8818L18.2263 19.1274C18.0146 18.5017 17.8472 17.8646 17.726 17.2218C17.5105 16.1332 17.4797 15.0273 17.6337 13.9463C17.6375 13.9081 17.6548 13.8736 17.6818 13.8469C17.7087 13.8201 17.7453 13.8048 17.7857 13.8028C17.8241 13.8009 17.8645 13.8105 17.8973 13.8315C17.93 13.8526 17.9569 13.8851 17.9704 13.9215C18.359 14.8781 18.8247 15.8079 19.3596 16.7014C19.7405 17.3289 20.1465 17.9048 20.5756 18.5132C20.8546 18.9073 21.1413 19.3168 21.4376 19.7587C21.8666 20.3958 22.1937 21.0903 22.4054 21.8154C22.6478 22.6707 22.669 23.5622 22.467 24.406C22.2592 25.2248 21.8705 25.9825 21.326 26.6291C20.8565 27.2069 20.3043 27.7197 19.6867 28.1501C19.1248 28.5519 18.5284 28.9097 17.903 29.2177C17.7606 29.277 17.6125 29.3497 17.4605 29.4243C17.3066 29.5009 17.1507 29.5774 16.9968 29.6405L16.1271 29.9926L12.8196 31.2936C12.5926 31.3835 12.3655 31.4715 12.1404 31.5614L12.1423 31.5633Z" fill="#F97316"/>
        <path d="M10.8135 47.0474V48.4375H6.25V40.9349H8.00699V47.0474H10.8143H10.8135Z" fill="#131313"/>
        <path d="M13.7681 48.4375H11.8887V40.9349H13.7681V48.4367V48.4375Z" fill="#131313"/>
        <path d="M21.4191 40.9349V48.4375H20.5094C20.3751 48.4375 20.2609 48.4168 20.1683 48.3754C20.0788 48.3309 19.9893 48.255 19.8998 48.1484L16.3473 43.6737C16.3612 43.8079 16.3697 43.9383 16.3728 44.0648C16.3797 44.1882 16.3828 44.3048 16.3828 44.4152V48.4367H14.8419V40.9349H15.7624C15.8381 40.9349 15.9021 40.938 15.9538 40.9449C16.0055 40.9518 16.0518 40.9656 16.0935 40.9863C16.1351 41.0032 16.1745 41.0292 16.2123 41.0637C16.2501 41.0983 16.2933 41.1443 16.3419 41.2025L19.9253 45.7079C19.9083 45.5637 19.8959 45.425 19.889 45.2908C19.8821 45.1535 19.879 45.0247 19.879 44.9043V40.9349H21.4199H21.4191Z" fill="#131313"/>
        <path d="M27.0036 45.5683L26.3148 43.5135C26.2638 43.3831 26.2097 43.2306 26.1519 43.055C26.0941 42.8763 26.0362 42.6839 25.9784 42.4784C25.9274 42.6877 25.8726 42.8817 25.8147 43.0603C25.7569 43.239 25.7028 43.3931 25.6518 43.5234L24.9683 45.5676H27.0036V45.5683ZM29.7421 48.4367H28.4056C28.2556 48.4367 28.1354 48.4022 28.0433 48.334C27.9512 48.2619 27.8819 48.1706 27.834 48.061L27.3956 46.7529H24.5703L24.1319 48.061C24.0946 48.1568 24.0268 48.245 23.9279 48.324C23.8327 48.3999 23.714 48.4375 23.5709 48.4375H22.2245L25.1008 40.9349H26.8651L29.7414 48.4375L29.7421 48.4367Z" fill="#131313"/>
        <path d="M33.0044 44.4623C33.2425 44.4623 33.445 44.4332 33.6104 44.3749C33.7797 44.3128 33.9181 44.2293 34.0248 44.1227C34.1322 44.0161 34.2096 43.8927 34.2583 43.7516C34.3062 43.6075 34.3309 43.4526 34.3309 43.2886C34.3309 42.9589 34.2219 42.7013 34.0047 42.5166C33.7906 42.331 33.4574 42.2383 33.0051 42.2383H32.3009V44.4623H33.0051H33.0044ZM36.7236 48.4375H35.138C34.8442 48.4375 34.634 48.3278 34.5064 48.1078L33.2525 45.9297C33.1938 45.837 33.128 45.7703 33.0554 45.7289C32.9827 45.6844 32.8791 45.6622 32.7446 45.6622H32.2993V48.4375H30.5483V40.9349H33.0036C33.5494 40.9349 34.014 40.9917 34.3974 41.1051C34.7839 41.2148 35.0986 41.3696 35.3405 41.5682C35.5856 41.7675 35.7634 42.0021 35.874 42.2735C35.9845 42.5449 36.0402 42.8401 36.0402 43.159C36.0402 43.4028 36.0077 43.6328 35.942 43.849C35.8763 44.0652 35.7796 44.2661 35.6521 44.4516C35.5245 44.6333 35.3653 44.7966 35.1751 44.9407C34.9888 45.0849 34.7731 45.2037 34.5273 45.2957C34.6409 45.354 34.7484 45.4276 34.8489 45.5173C34.9486 45.6031 35.039 45.7059 35.1179 45.8262L36.7236 48.4367V48.4375Z" fill="#131313"/>
        <path d="M42.9203 46.4561C42.9612 46.4561 43.0013 46.4643 43.0422 46.4816C43.083 46.4951 43.1216 46.5198 43.1587 46.5573L43.8385 47.2678C43.541 47.6542 43.1671 47.9461 42.7174 48.1449C42.2708 48.3399 41.7417 48.4375 41.13 48.4375C40.5691 48.4375 40.0649 48.3437 39.6183 48.1554C39.1755 47.9641 38.7985 47.7022 38.4874 47.3691C38.1793 47.033 37.9431 46.6369 37.7773 46.18C37.6116 45.7201 37.5291 45.2211 37.5291 44.6832C37.5291 44.1453 37.6184 43.6336 37.7978 43.1767C37.9772 42.7168 38.2293 42.3199 38.5532 41.9875C38.8772 41.6552 39.2671 41.3963 39.7198 41.2118C40.1732 41.0272 40.672 40.9349 41.2163 40.9349C41.4934 40.9349 41.7538 40.9604 41.9975 41.0107C42.2443 41.058 42.4744 41.1248 42.6871 41.2125C42.8998 41.2966 43.0959 41.3986 43.2753 41.5201C43.4547 41.6409 43.6137 41.7722 43.7522 41.9133L43.1739 42.6845C43.1368 42.7318 43.0929 42.7753 43.0422 42.8158C42.9914 42.8526 42.9203 42.8713 42.8287 42.8713C42.7681 42.8713 42.7106 42.8578 42.6561 42.8308C42.6016 42.8038 42.5448 42.7723 42.4835 42.7348C42.4229 42.6943 42.3548 42.6523 42.2806 42.6088C42.2095 42.5615 42.1232 42.5195 42.0217 42.4827C41.9233 42.4422 41.8068 42.4084 41.672 42.3822C41.5403 42.3552 41.3844 42.3417 41.2057 42.3417C40.9218 42.3417 40.6614 42.3934 40.4245 42.4977C40.1914 42.602 39.9885 42.7551 39.8159 42.9561C39.6471 43.1542 39.5146 43.3995 39.42 43.6921C39.3284 43.981 39.283 44.3118 39.283 44.6847C39.283 45.0576 39.3337 45.3952 39.4351 45.687C39.5396 45.9789 39.6804 46.2265 39.856 46.4275C40.0354 46.6256 40.2428 46.7772 40.4798 46.8807C40.7167 46.9842 40.9703 47.0367 41.2405 47.0367C41.3957 47.0367 41.538 47.03 41.6667 47.0165C41.7954 47 41.915 46.9745 42.027 46.9407C42.1383 46.904 42.2435 46.8567 42.3412 46.7997C42.4396 46.7389 42.5388 46.6639 42.6402 46.5731C42.6811 46.5393 42.725 46.5123 42.7719 46.4928C42.8196 46.4696 42.8681 46.4576 42.9188 46.4576L42.9203 46.4561Z" fill="#131313"/>
    </svg>
);


// --- Data for Sidebar ---
const sidebarItemsByCategory: { [key: string]: Array<{ key: string; label: string; icon: React.ReactNode }> } = {
    contract: [
        { key: 'primeContract', label: 'Prime Contract', icon: <ContractIcon /> },
        { key: 'budget', label: 'Budget', icon: <BudgetIcon /> },
        { key: 'allocate', label: 'Allocate', icon: <AllocateIcon /> },
        { key: 'sov', label: 'SOV', icon: <SOVIcon /> },
        { key: 'commitment', label: 'Commitment Release', icon: <CommitmentIcon /> },
        { key: 'adjustment', label: 'Adjustment History', icon: <AdjustmentIcon /> },
        { key: 'cls', label: 'CLS', icon: <CLSIcon /> },
        { key: 'billing', label: 'Planned Billing', icon: <BillingIcon /> },
    ],
    ownerBilling: [
        { key: 'progress', label: 'My Progress', icon: <MyProgressIcon /> },
        { key: 'open', label: 'Open', icon: <OpenIcon /> },
        { key: 'payApps', label: 'Pay Apps', icon: <PayAppsIcon /> },
        { key: 'invoice', label: 'Invoice', icon: <InvoiceIcon /> },
    ],
    subsBilling: [
        { key: 'subPayApps', label: 'Pay Apps', icon: <PayAppsIcon /> },
        { key: 'lienWaivers', label: 'Lien Waivers', icon: <FileText size={24} strokeWidth={1.5} /> },
        { key: 'certifications', label: 'Certifications', icon: <CheckCircle size={24} strokeWidth={1.5} /> },
        { key: 'subBillings', label: 'Billings', icon: <DollarSign size={24} strokeWidth={1.5} /> },
    ],
    changeOrder: [
        { key: 'boards', label: 'Boards', icon: <BoardsIcon /> },
        { key: 'log', label: 'Log', icon: <LogIcon /> },
        { key: 'completed', label: 'Completed', icon: <CompletedIcon /> },
        { key: 'cancelled', label: 'Cancelled', icon: <CancelledIcon /> },
        { key: 'billed', label: 'Billed', icon: <BilledIcon /> },
    ],
    recurringCost: [
        { key: 'configure', label: 'Configure', icon: <ConfigIcon /> },
        { key: 'requests', label: 'My Requests', icon: <RequestsIcon /> },
        { key: 'unapproved', label: 'Unapproved Costs', icon: <UnapprovedIcon /> },
        { key: 'history', label: 'History', icon: <HistoryIcon /> },
    ],
    costs: [
        { key: 'labor', label: 'Labor', icon: <LaborIcon /> },
        { key: 'overhead', label: 'Overhead', icon: <OverheadIcon /> },
        { key: 'others', label: 'Others', icon: <OthersIcon /> },
        { key: 'subcontractor', label: 'Subcontractor', icon: <SubcontractorIcon /> },
        { key: 'equipment', label: 'Equipment', icon: <EquipmentIcon /> },
    ],
    tm: [
        { key: 'timeTracking', label: 'Time Tracking', icon: <ClockIcon size={24} strokeWidth={1.5} /> },
        { key: 'materialLog', label: 'Material Log', icon: <Package size={24} strokeWidth={1.5} /> },
        { key: 'equipmentHours', label: 'Equipment Hours', icon: <Wrench size={24} strokeWidth={1.5} /> },
        { key: 'tmBilling', label: 'T&M Billing', icon: <DollarSign size={24} strokeWidth={1.5} /> },
    ],
    analytics: [
        { key: 'summary', label: 'Summary', icon: <SummaryIcon /> },
        { key: 'jobCost', label: 'Job Cost', icon: <JobCostIcon /> },
        { key: 'profitLoss', label: 'Profit and Loss', icon: <ProfitIcon /> },
        { key: 'budgetUtil', label: 'Budget Utilization', icon: <BudgetUtilIcon /> },
    ],
    configure: [
        { key: 'financeConfig', label: 'Finance Config', icon: <ConfigIcon /> },
    ],
};

interface SidebarItemProps {
    item: { key: string; label: string; icon: React.ReactNode };
    isActive: boolean;
    onClick: () => void;
    isLocked?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ item, isActive, onClick, isLocked = false }) => {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        if (!isLocked) {
            onClick();
        }
    };

    return (
        <a
            href="#"
            onClick={handleClick}
            className={`relative flex flex-col items-center justify-center gap-1.5 h-[80px] w-full text-xs font-medium transition-colors duration-200 ${
                isLocked
                    ? 'text-gray-400 opacity-40 cursor-not-allowed'
                    : isActive
                      ? 'text-gray-900'
                      : 'text-gray-500 hover:text-gray-800'
            }`}
        >
            {item.icon}
            <span className="text-center px-1">{item.label}</span>
            {isActive && !isLocked && (
                <div className="absolute right-[-2px] top-1/2 -translate-y-1/2 h-[16px] w-[4px] bg-orange-500 rounded-l-md" />
            )}
        </a>
    );
};

interface BookmarkItem {
    categoryKey: string;
    itemKey: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    navIcon: React.ReactNode;
}

interface SidebarProps {
    version?: 'v1' | 'v2';
    bookmarks?: BookmarkItem[];
    onSelect?: (categoryKey: string, subcategoryKey: string) => void;
    onToggleBookmark?: (categoryKey: string, itemKey: string) => void;
    activeTopNavCategory?: string;
}


const Sidebar: React.FC<SidebarProps> = ({ version = 'v1', bookmarks = [], onSelect, onToggleBookmark, activeTopNavCategory = 'contract' }) => {
    const {
        isSidebarLocked,
        sidebarTooltip,
        navigateSidebarItem,
    } = useFinancialGating();
    const {
        financialSetupStep,
        financialSetupComplete,
        activeViewMode,
        activeFinancialSection,
        hubCollapsed,
    } = useProject();
    const [activeItemKey, setActiveItemKey] = useState('');
    const [isBookmarksMenuVisible, setBookmarksMenuVisible] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const bookmarksMenuRef = useRef<HTMLDivElement>(null);
    const bookmarksButtonRef = useRef<HTMLButtonElement>(null);

    // Detect mobile device
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Keep sidebar highlight in sync with setup step / active tool
    useEffect(() => {
        const items = sidebarItemsByCategory[activeTopNavCategory];
        if (!items || items.length === 0) return;

        const isSetupFlow = activeViewMode === 'spreadsheetV4' && !financialSetupComplete;

        if (isSetupFlow && activeTopNavCategory === 'contract') {
            const key = getSidebarItemKeyForSetupStep(financialSetupStep);
            setActiveItemKey(items.some((item) => item.key === key) ? key : items[0].key);
            return;
        }

        if (isSetupFlow && activeTopNavCategory === 'configure' && financialSetupStep === 1) {
            setActiveItemKey('financeConfig');
            return;
        }

        if (financialSetupComplete && activeTopNavCategory === 'contract') {
            // The collapsed-hub waypoint screen is not a tool — highlight nothing.
            if (hubCollapsed) {
                setActiveItemKey('');
                return;
            }
            setActiveItemKey(
                items.some((item) => item.key === activeFinancialSection) ? activeFinancialSection : items[0].key
            );
            return;
        }

        setActiveItemKey(items[0].key);
    }, [
        activeTopNavCategory,
        financialSetupStep,
        financialSetupComplete,
        activeViewMode,
        activeFinancialSection,
        hubCollapsed,
    ]);

    // Close bookmarks menu on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (bookmarksMenuRef.current && !bookmarksMenuRef.current.contains(event.target as Node)) {
                setBookmarksMenuVisible(false);
            }
        };

        if (isBookmarksMenuVisible) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isBookmarksMenuVisible]);

    const handleSelect = (categoryKey: string, subcategoryKey: string) => {
        if (onSelect) {
            onSelect(categoryKey, subcategoryKey);
        }
        setBookmarksMenuVisible(false);
    };

    return (
        <aside className="w-[82px] bg-gray-50 border-r border-gray-200 flex flex-col shrink-0">
            <div className="flex-grow flex flex-col gap-1 pt-3">
                {/* QuickCreateMenu removed - keep code for future use */}
                {/* <QuickCreateMenu /> */}

                {/* Bookmarks Button - Removed but kept for future use */}
                {/* {version === 'v2' && (
                    <div
                        ref={bookmarksMenuRef}
                        className="relative w-full"
                    >
                        <button
                            ref={bookmarksButtonRef}
                            onClick={() => {
                                setBookmarksMenuVisible(!isBookmarksMenuVisible);
                            }}
                            className={`relative flex flex-col items-center justify-center gap-1.5 h-[80px] w-full text-xs font-medium transition-colors duration-200 ${
                                isBookmarksMenuVisible
                                    ? 'text-gray-900'
                                    : 'text-gray-500 hover:text-gray-800'
                            }`}
                            aria-label="Bookmarks menu"
                            aria-expanded={isBookmarksMenuVisible}
                        >
                            <BookmarksIcon />
                            <span>Bookmarks</span>
                            {isBookmarksMenuVisible && (
                                <div className="absolute right-[-2px] top-1/2 -translate-y-1/2 h-[16px] w-[4px] bg-orange-500 rounded-l-md"></div>
                            )}
                        </button>
                        <AnimatePresence>
                            {isBookmarksMenuVisible && bookmarks && onSelect && onToggleBookmark && (
                                <BookmarksMenu
                                    bookmarks={bookmarks}
                                    onSelect={handleSelect}
                                    onToggleBookmark={onToggleBookmark}
                                    position="right"
                                    triggerRef={bookmarksButtonRef}
                                />
                            )}
                        </AnimatePresence>
                    </div>
                )} */}
                
                {(sidebarItemsByCategory[activeTopNavCategory] || []).map((item) => {
                    const locked = isSidebarLocked(activeTopNavCategory, item.key);
                    const tip = sidebarTooltip(activeTopNavCategory, item.key);

                    const sidebarItemElement = (
                        <SidebarItem
                            item={item}
                            isActive={activeItemKey === item.key && !locked}
                            onClick={() => {
                                if (!locked) {
                                    setActiveItemKey(item.key);
                                    navigateSidebarItem(activeTopNavCategory, item.key);
                                }
                            }}
                            isLocked={locked}
                        />
                    );

                    return locked && tip ? (
                        <Tooltip key={item.key} content={tip} position="right" delay={300}>
                            {sidebarItemElement}
                        </Tooltip>
                    ) : (
                        <React.Fragment key={item.key}>{sidebarItemElement}</React.Fragment>
                    );
                })}
            </div>
            <div className="py-4 w-[82px]">
                <LinarcLogo />
            </div>
        </aside>
    );
};

export default Sidebar;