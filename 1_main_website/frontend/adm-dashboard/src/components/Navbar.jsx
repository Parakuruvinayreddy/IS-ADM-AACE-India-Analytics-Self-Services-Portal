import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon, { icons } from './Icon';
import TeamsModal from './TeamsModal';
import WebsiteFeedbackModal, { shouldShowWebsiteFeedback } from './WebsiteFeedbackModal';
import SubmitQueryModal from './SubmitQueryModal';
import SuggestModal from './SuggestModal';
import { BU_DATA } from '../data/constants';
import { fetchPublishedProjects } from '../utils/fetchWithRetry';
import { formatProjectName } from '../utils/formatProjectName';

const FUNCTION_TO_BU_KEY = {
    'Executive': 'executive',
    'Sales & Commercial': 'sales',
    'Sales Commercial': 'sales',
    'Finance': 'finance',
    'Operations': 'operations',
    'Human Resources': 'hr',
    'Engineering': 'engineering',
    'Technology': 'engineering',
    'Supply Chain': 'operations',
    'Legal & Compliance': 'executive',
    'Marketing': 'sales',
};

const DETAIL_ICONS = {
    'AI/ML': icons.cpu,
    'Analytics': icons.barChart,
    'Image Analytics': icons.activity,
};

function slugify(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}


const NAV_LINKS = [
    {
        label: 'Capabilities',
        href: '#capabilities',
        hasDropdown: true,
        dropdownItems: [
            { label: 'Data Integration and Preparation', href: '#' },
            { label: 'Data Visualization', href: '#' },
            { label: 'Advance Analytics - AI/ML', href: '#' },
            { label: 'Self Service AI', href: '#' }
        ]
    },
    { label: 'Team', href: '#team', hasDropdown: false },
    { label: 'Value/ROI', href: '#value', hasDropdown: false },
];

// Connect items — keep it to 3 lines; Suggest/Feedback expands inline
const CONNECT_ITEMS = [
    { icon: icons.ticket, label: 'Submit Query/Support', action: 'query' },
    { icon: icons.mail, label: 'Email Us', href: 'mailto:support@adm-analytics.com' },
    { icon: icons.lightbulb, label: 'Suggest / Feedback', action: 'suggestFeedback' },
];

export default function Navbar() {
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isConnectOpen, setIsConnectOpen] = useState(false);
    const [isCapabilitiesOpen, setIsCapabilitiesOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isTeamsOpen, setIsTeamsOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [showLogoutFeedback, setShowLogoutFeedback] = useState(false);
    const [showQueryModal, setShowQueryModal] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [showSuggestModal, setShowSuggestModal] = useState(false);
    const [suggestFeedbackExpanded, setSuggestFeedbackExpanded] = useState(false);

    // Global Search State
    const [globalSearch, setGlobalSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState('');
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const [allProjects, setAllProjects] = useState([]);
    const searchRef = useRef(null);

    const pendingLogout = useRef(false);
    const connectRef = useRef(null);
    const capabilitiesRef = useRef(null);
    const profileRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);

        // Check for logged-in user session
        const storedUser = localStorage.getItem('adm_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse user session", e);
            }
        }

        // Fetch projects for search (with retry)
        fetchPublishedProjects()
            .then(projects => {
                const flattened = projects.map(pub => {
                    const buKey = FUNCTION_TO_BU_KEY[pub.function];
                    const buLabel = buKey && BU_DATA[buKey] ? BU_DATA[buKey].label : pub.function;
                    return {
                        name: pub.title,
                        type: pub.category || 'Analytics',
                        buLabel: buLabel,
                        buKey: buKey,
                        function: pub.function
                    };
                });
                setAllProjects(flattened);
            });

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (connectRef.current && !connectRef.current.contains(e.target)) {
                setIsConnectOpen(false);
            }
            if (capabilitiesRef.current && !capabilitiesRef.current.contains(e.target)) {
                setIsCapabilitiesOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setIsProfileOpen(false);
            }
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowSearchDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const chevron = (
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
            <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );

    return (
        <>
            <nav
                className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
                style={{
                    height: '56px',
                    background: isScrolled ? 'rgba(21,38,60,0.97)' : 'rgba(21,38,60,1)',
                    boxShadow: isScrolled
                        ? '0 4px 24px rgba(0,0,0,0.45), 0 1px 0 rgba(255,165,0,0.18)'
                        : '0 2px 8px rgba(0,0,0,0.3)',
                    borderBottom: isScrolled
                        ? '1px solid rgba(255,165,0,0.2)'
                        : '1px solid rgba(255,255,255,0.06)',
                    backdropFilter: isScrolled ? 'blur(12px)' : 'none',
                }}
            >
                <div className="max-w-[1600px] mx-auto px-5 h-full flex items-center justify-between gap-4">

                    {/* Left — Logo */}
                    <div className="flex shrink-0 justify-start">
                        <a href="#" className="flex items-center gap-2.5 shrink-0 group">
                            <img
                                src="/logo.png"
                                alt="AD&M AACE Analytics Logo"
                                className="h-8 w-auto object-contain transition-all group-hover:scale-105"
                            />
                            <span className="font-extrabold text-[17px] tracking-tight text-white uppercase leading-none">
                                AD&M AACE <span className="text-orange-400 font-light tracking-[0.2em]">ANALYTICS</span>
                            </span>
                        </a>
                    </div>

                    {/* Center - Search Bar */}
                    <div className="flex-1 max-w-[650px] mx-4 relative" ref={searchRef}>
                        <div className="relative w-full h-9 flex items-center bg-white border border-gray-200 rounded-lg shadow-sm transition-all focus-within:border-[rgba(255,165,0,0.5)] focus-within:ring-2 focus-within:ring-[rgba(255,165,0,0.2)]">
                            {/* Category Dropdown (Left side) */}
                            <div className="relative h-full flex items-center border-r border-gray-200 shrink-0">
                                <select
                                    value={selectedCategory}
                                    onChange={e => { setSelectedCategory(e.target.value); setSelectedSubCategory(''); setShowSearchDropdown(true); }}
                                    className="appearance-none h-full pl-3 pr-8 bg-transparent text-[11px] font-bold text-gray-700 focus:outline-none cursor-pointer tracking-wider uppercase"
                                    style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                                >
                                    <option value="" className="text-gray-900 bg-white font-semibold">All Categories</option>
                                    <option value="AI Solution" className="text-gray-900 bg-white font-semibold">AI Solution</option>
                                    <option value="Data Product" className="text-gray-900 bg-white font-semibold">Data Product</option>
                                    <option value="Dashboard" className="text-gray-900 bg-white font-semibold">Dashboard</option>
                                    <option value="Plants" className="text-gray-900 bg-white font-semibold">Plants</option>
                                </select>
                                <div className="absolute right-2 pointer-events-none text-gray-400">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </div>
                            </div>

                            {selectedCategory === 'Plants' && (
                                <div className="relative h-full flex items-center border-r border-gray-200 shrink-0">
                                    <select
                                        value={selectedSubCategory}
                                        onChange={e => { setSelectedSubCategory(e.target.value); setShowSearchDropdown(true); }}
                                        className="appearance-none h-full pl-3 pr-8 bg-transparent text-[11px] font-bold text-gray-700 focus:outline-none cursor-pointer tracking-wider uppercase"
                                        style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                                    >
                                        <option value="" className="text-gray-900 bg-white font-semibold">Select Plant</option>
                                        <option value="A" className="text-gray-900 bg-white font-semibold">Redwood City, CA (W&C)</option>
                                        <option value="B" className="text-gray-900 bg-white font-semibold">El Cajon, CA (MOG)</option>
                                        <option value="C" className="text-gray-900 bg-white font-semibold">Tecate, MX (CON)</option>
                                        <option value="D" className="text-gray-900 bg-white font-semibold">Hermosillo, MX (CON)</option>
                                        <option value="E" className="text-gray-900 bg-white font-semibold">Tijuana, MX (W&C)</option>
                                        <option value="F" className="text-gray-900 bg-white font-semibold">Tijuana, MX (MOG)</option>
                                        <option value="G" className="text-gray-900 bg-white font-semibold">Mt.Joy/Manheim, PA (CON)</option>
                                        <option value="H" className="text-gray-900 bg-white font-semibold">Fairview/Arden, NC (Relays)</option>
                                        <option value="I" className="text-gray-900 bg-white font-semibold">Mansfield, OH (Relays)</option>
                                        <option value="J" className="text-gray-900 bg-white font-semibold">Hauppauge, NY (Relays)</option>
                                        <option value="K" className="text-gray-900 bg-white font-semibold">Katy, TX (MOG)</option>
                                        <option value="L" className="text-gray-900 bg-white font-semibold">Evreux, FR (CON)</option>
                                        <option value="M" className="text-gray-900 bg-white font-semibold">Hastings, UK (CON)</option>
                                        <option value="N" className="text-gray-900 bg-white font-semibold">Swindon, UK (W&C)</option>
                                        <option value="O" className="text-gray-900 bg-white font-semibold">Great Yarmouth, UK (MOG)</option>
                                        <option value="P" className="text-gray-900 bg-white font-semibold">Evora, PORT (Relays)</option>
                                        <option value="Q" className="text-gray-900 bg-white font-semibold">Bangalore, IN (Relays)</option>
                                        <option value="R" className="text-gray-900 bg-white font-semibold">Bangalore, IN (DRI)</option>
                                    </select>
                                    <div className="absolute right-2 pointer-events-none text-gray-400">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    </div>
                                </div>
                            )}

                            {['AI Solution', 'Data Product', 'Dashboard'].includes(selectedCategory) && (
                                <div className="relative h-full flex items-center border-r border-gray-200 shrink-0">
                                    <select
                                        value={selectedSubCategory}
                                        onChange={e => { setSelectedSubCategory(e.target.value); setShowSearchDropdown(true); }}
                                        className="appearance-none h-full pl-3 pr-8 bg-transparent text-[11px] font-bold text-gray-700 focus:outline-none cursor-pointer tracking-wider uppercase"
                                        style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                                    >
                                        <option value="" className="text-gray-900 bg-white font-semibold">Select Function</option>
                                        <option value="Executive" className="text-gray-900 bg-white font-semibold">Executive</option>
                                        <option value="Customer Service" className="text-gray-900 bg-white font-semibold">Customer Service</option>
                                        <option value="Finance" className="text-gray-900 bg-white font-semibold">Finance</option>
                                        <option value="Engineering" className="text-gray-900 bg-white font-semibold">Engineering</option>
                                        <option value="Human Resources" className="text-gray-900 bg-white font-semibold">Human Resources</option>
                                        <option value="Marine, Oil & Gas" className="text-gray-900 bg-white font-semibold">Marine, Oil &amp; Gas</option>
                                        <option value="Operations" className="text-gray-900 bg-white font-semibold">Operations</option>
                                        <option value="Pricing" className="text-gray-900 bg-white font-semibold">Pricing</option>
                                        <option value="Product Management" className="text-gray-900 bg-white font-semibold">Product Management</option>
                                        <option value="Sales Commercial" className="text-gray-900 bg-white font-semibold">Sales Commercial</option>
                                        <option value="Plants" className="text-gray-900 bg-white font-semibold">Plants</option>
                                    </select>
                                    <div className="absolute right-2 pointer-events-none text-gray-400">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    </div>
                                </div>
                            )}

                            {/* Search Input */}
                            <div className="flex-1 relative h-full flex items-center">
                                <svg className="absolute left-2.5 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Find a project..."
                                    value={globalSearch}
                                    onChange={e => { setGlobalSearch(e.target.value); setShowSearchDropdown(true); }}
                                    onFocus={() => setShowSearchDropdown(true)}
                                    className="w-full h-full pl-8 pr-8 bg-transparent text-[12px] text-gray-900 placeholder-gray-400 focus:outline-none"
                                />
                                {(globalSearch || selectedCategory || selectedSubCategory) && (
                                    <button
                                        onClick={() => { setGlobalSearch(''); setSelectedCategory(''); setSelectedSubCategory(''); setShowSearchDropdown(false); }}
                                        className="absolute right-2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Search Dropdown */}
                        {showSearchDropdown && (globalSearch.trim() !== '' || selectedCategory !== '' || selectedSubCategory !== '') && (
                            <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white rounded-xl shadow-[0_16px_48px_-8px_rgba(15,28,46,0.22),_0_0_0_1px_rgba(0,0,0,0.07)] overflow-hidden z-[200]">
                                {(() => {
                                    const results = allProjects.filter(p => {
                                        if (selectedCategory && selectedCategory !== 'Plants') {
                                            const t = (p.type || '').toLowerCase();
                                            const cat = selectedCategory.toLowerCase();
                                            if (cat === 'ai solution' && !(t.includes('ai') || t.includes('ml'))) return false;
                                            if (cat === 'dashboard' && !(t.includes('analytic') || t.includes('dashboard'))) return false;
                                            if (cat === 'data product' && !t.includes('data')) return false;
                                        }
                                        if (selectedCategory === 'Plants') {
                                            if (!['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R'].includes(p.function)) return false;
                                        }

                                        if (selectedSubCategory) {
                                            if (p.function !== selectedSubCategory) return false;
                                        }

                                        if (globalSearch.trim() !== '') {
                                            const searchLower = globalSearch.trim().toLowerCase();
                                            if (!p.name.toLowerCase().includes(searchLower) && !(p.buLabel || '').toLowerCase().includes(searchLower)) {
                                                return false;
                                            }
                                        }
                                        return true;
                                    }).slice(0, 10);

                                    if (results.length === 0) {
                                        return <div className="px-4 py-6 text-center text-gray-500 text-[12px] italic">No projects found.</div>;
                                    }

                                    return (
                                        <>
                                            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{results.length} result{results.length !== 1 ? 's' : ''} found</span>
                                                {selectedCategory && <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full uppercase border border-orange-100">{selectedCategory}</span>}
                                            </div>
                                            <ul className="max-h-[320px] overflow-y-auto divide-y divide-gray-50">
                                                {results.map((proj, idx) => (
                                                    <li
                                                        key={idx}
                                                        className="px-4 py-2.5 hover:bg-orange-50 cursor-pointer transition-colors flex items-center justify-between group/item"
                                                        onClick={() => {
                                                            setGlobalSearch('');
                                                            setSelectedCategory('');
                                                            setSelectedSubCategory('');
                                                            setShowSearchDropdown(false);
                                                            navigate(`/project/${slugify(proj.name)}`);
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0 pr-3">
                                                            <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0 group-hover/item:bg-white transition-colors">
                                                                <Icon path={DETAIL_ICONS[proj.type] || icons.barChart} className="w-4 h-4 text-orange-500" />
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-[13px] font-bold text-gray-900 truncate block group-hover/item:text-orange-600 transition-colors">
                                                                    {formatProjectName(proj.name)}
                                                                </span>
                                                                <span className="text-[10px] text-gray-500 truncate block">
                                                                    {proj.buLabel} · {proj.type}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="w-6 h-6 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0 group-hover/item:bg-orange-500 transition-colors">
                                                            <Icon path={icons.chevronRight} className="w-3 h-3 text-orange-500 group-hover/item:text-white transition-colors" />
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </>
                                    );
                                })()}
                            </div>
                        )}
                    </div>

                    {/* Right Side Wrapper */}
                    <div className="flex shrink-0 justify-end">
                        <div className="flex items-center gap-1 md:gap-4">
                            {/* Right group — Nav links */}
                            <div className="hidden md:flex items-center gap-0.5">

                                {/* Regular nav links */}
                                {NAV_LINKS.map((link) => (
                                    <div key={link.label} className="relative" ref={link.label === 'Capabilities' ? capabilitiesRef : null}>
                                        <a
                                            href={link.href}
                                            onClick={(e) => {
                                                if (link.label === 'Team') {
                                                    e.preventDefault();
                                                    setIsTeamsOpen(true);
                                                    return;
                                                }
                                                if (link.hasDropdown) {
                                                    e.preventDefault();
                                                    if (link.label === 'Capabilities') {
                                                        setIsCapabilitiesOpen(!isCapabilitiesOpen);
                                                    }
                                                }
                                            }}
                                            className={`flex items-center gap-1.5 text-[11px] font-bold tracking-[0.15em] uppercase px-3 py-1.5 rounded transition-all duration-200 hover:text-orange-400 ${link.label === 'Capabilities' && isCapabilitiesOpen ? 'text-orange-400' : 'text-gray-300'}`}
                                        >
                                            {link.label}
                                            {link.hasDropdown && (
                                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={`transition-transform duration-200 ${link.label === 'Capabilities' && isCapabilitiesOpen ? 'rotate-180 text-orange-500' : (link.label === 'Capabilities' ? 'text-orange-500' : '')}`}>
                                                    <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </a>

                                        {/* Dropdown Menu */}
                                        {link.hasDropdown && link.label === 'Capabilities' && isCapabilitiesOpen && (
                                            <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-[8px] shadow-2xl py-1 border border-gray-100 z-[60] animate-fadeIn">
                                                {link.dropdownItems.map((item) => (
                                                    <a
                                                        key={item.label}
                                                        href={item.href}
                                                        className="block px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-orange-50 transition-colors group/subitem"
                                                    >
                                                        <span className="font-bold text-[11px] tracking-widest uppercase text-gray-800 group-hover/subitem:text-orange-600 transition-colors">{item.label}</span>
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}


                                {/* Connect dropdown */}
                                <div className="relative" ref={connectRef}>
                                    <button
                                        onClick={() => setIsConnectOpen((v) => !v)}
                                        className="flex items-center gap-1 text-[11px] font-bold tracking-[0.15em] uppercase px-3 py-1.5 rounded transition-all duration-200 text-gray-300 hover:text-orange-400"
                                    >
                                        Connect
                                        <svg
                                            width="10" height="6" viewBox="0 0 10 6" fill="none"
                                            className={`transition-transform duration-200 ${isConnectOpen ? 'rotate-180' : ''}`}
                                        >
                                            <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                    {isConnectOpen && (
                                        <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', minWidth: '192px', background: '#fff', borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.14)', border: '1px solid #f1f5f9', zIndex: 60, overflow: 'hidden' }}>

                                            {/* Submit Query/Support */}
                                            <button
                                                onClick={() => { setIsConnectOpen(false); setShowQueryModal(true); }}
                                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 14px', background: 'none', border: 'none', borderBottom: '1px solid #f8fafc', cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s' }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#fff7ed'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                            >
                                                <Icon path={icons.ticket} className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>Submit Query/Support</span>
                                            </button>

                                            {/* Email Us */}
                                            <a
                                                href="mailto:support@adm-analytics.com"
                                                style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 14px', textDecoration: 'none', borderBottom: '1px solid #f8fafc', transition: 'background 0.12s' }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#fff7ed'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                            >
                                                <Icon path={icons.mail} className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>Email Us</span>
                                            </a>

                                            {/* Suggest / Feedback — expandable row */}
                                            <button
                                                onClick={() => setSuggestFeedbackExpanded(v => !v)}
                                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '9px', padding: '8px 14px', background: suggestFeedbackExpanded ? '#fff7ed' : 'none', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s' }}
                                                onMouseEnter={e => { if (!suggestFeedbackExpanded) e.currentTarget.style.background = '#fff7ed'; }}
                                                onMouseLeave={e => { if (!suggestFeedbackExpanded) e.currentTarget.style.background = 'none'; }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                                                    <Icon path={icons.lightbulb} className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>Suggest / Feedback</span>
                                                </div>
                                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ transition: 'transform 0.18s', transform: suggestFeedbackExpanded ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
                                                    <path d="M1 1l4 4 4-4" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </button>

                                            {/* Expanded sub-row: Suggest | Feedback */}
                                            {suggestFeedbackExpanded && (
                                                <div style={{ display: 'flex', borderTop: '1px solid #f1f5f9', background: '#fafafa' }}>
                                                    <button
                                                        onClick={() => { setIsConnectOpen(false); setSuggestFeedbackExpanded(false); setShowSuggestModal(true); }}
                                                        style={{ flex: 1, padding: '8px 10px', background: 'none', border: 'none', borderRight: '1px solid #f1f5f9', cursor: 'pointer', fontSize: '11px', fontWeight: 700, color: '#f97316', letterSpacing: '0.02em', transition: 'background 0.12s' }}
                                                        onMouseEnter={e => e.currentTarget.style.background = '#fff7ed'}
                                                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                                    >
                                                        💡 Suggest
                                                    </button>
                                                    <button
                                                        onClick={() => { setIsConnectOpen(false); setSuggestFeedbackExpanded(false); setShowFeedbackModal(true); }}
                                                        style={{ flex: 1, padding: '8px 10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700, color: '#f97316', letterSpacing: '0.02em', transition: 'background 0.12s' }}
                                                        onMouseEnter={e => e.currentTarget.style.background = '#fff7ed'}
                                                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                                    >
                                                        ⭐ Feedback
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Vertical divider */}
                                <div className="w-px h-5 bg-white/15 mx-2" />

                            </div>

                            {/* Welcome + Avatar — far right */}
                            <div className="hidden md:flex items-center gap-2">

                                {/* Welcome text */}
                                <div className="text-right hidden sm:block">
                                    <p className="text-[9px] font-extrabold text-orange-400 uppercase tracking-[0.22em] leading-none mb-0.5">WELCOME</p>
                                    <p className="text-[13px] font-extrabold text-white tracking-tight uppercase leading-none">{user ? user.name.split(' ')[0] : 'Guest'}</p>
                                </div>

                                {/* Avatar with Dropdown */}
                                <div className="relative" ref={profileRef}>
                                    <button
                                        onClick={() => setIsProfileOpen((v) => !v)}
                                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-105 shadow-lg border-2 ${user ? 'border-orange-400' : 'border-gray-500'}`}
                                        style={{ background: user ? 'linear-gradient(135deg,#f97316,#ea580c)' : 'linear-gradient(135deg,#475569,#334155)' }}
                                    >
                                        <Icon path={icons.user} className="w-4 h-4 text-white" />
                                    </button>

                                    {isProfileOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl py-1.5 border border-gray-100 z-[60]">
                                            {user ? (
                                                <>
                                                    <div className="px-4 py-3 border-b border-gray-100 flex flex-col">
                                                        <span className="text-xs font-bold text-gray-900">{user.name.split(' ')[0]}</span>
                                                        <span className="text-[10px] text-gray-500 truncate">{user.email}</span>
                                                    </div>

                                                    <button
                                                        onClick={() => {
                                                            setIsProfileOpen(false);
                                                            if (shouldShowWebsiteFeedback()) {
                                                                pendingLogout.current = true;
                                                                setShowLogoutFeedback(true);
                                                            } else {
                                                                localStorage.removeItem('adm_user');
                                                                setUser(null);
                                                                navigate('/login');
                                                            }
                                                        }}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-left"
                                                    >
                                                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                                                        <span className="font-semibold text-sm text-red-600">Logout</span>
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => navigate('/login')}
                                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-colors text-left group"
                                                >
                                                    <svg className="w-4 h-4 text-orange-500 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg>
                                                    <span className="font-semibold text-sm text-gray-800">Login</span>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </nav>

            <TeamsModal isOpen={isTeamsOpen} onClose={() => setIsTeamsOpen(false)} />

            {showQueryModal && <SubmitQueryModal onClose={() => setShowQueryModal(false)} />}

            {showFeedbackModal && (
                <WebsiteFeedbackModal trigger="exit" onClose={() => setShowFeedbackModal(false)} />
            )}

            {showSuggestModal && <SuggestModal onClose={() => setShowSuggestModal(false)} />}

            {showLogoutFeedback && (
                <WebsiteFeedbackModal
                    trigger="logout"
                    onClose={() => {
                        setShowLogoutFeedback(false);
                        if (pendingLogout.current) {
                            pendingLogout.current = false;
                            localStorage.removeItem('adm_user');
                            setUser(null);
                            navigate('/login');
                        }
                    }}
                />
            )}
        </>
    );
}
