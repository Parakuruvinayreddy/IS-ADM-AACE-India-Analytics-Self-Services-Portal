import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BU_DATA } from '../data/constants';
import Icon, { icons } from './Icon';
import { fetchPublishedProjects } from '../utils/fetchWithRetry';
import { formatProjectName } from '../utils/formatProjectName';

const ICON_MAP = [
    '/icons/trending.png',          // Executive
    '/icons/Customer_Service.png', // Customer Service
    '/icons/Finance.png',          // Finance
    '/icons/Engineering.png',      // Engineering
    '/icons/Human_Resources.png',  // Human Resources
    '/icons/Marine_Oil_Gas.png',   // Marine, Oil & Gas
    '/icons/Plants.png',           // Operations
    '/icons/Pricing.png',          // Pricing
    '/icons/Product_Management.png',// Product Management
    '/icons/Sales_Commercial.png', // Sales Commercial
    '/icons/Factory.png',          // Plants
];

const GET_ICON_STYLE = (path, isHovered = false) => {
    const baseFilter = isHovered 
        ? 'brightness(0) invert(1)' 
        : 'brightness(0) saturate(100%) invert(60%) sepia(90%) saturate(1000%) hue-rotate(350deg) brightness(100%) contrast(100%)';
    
    // Zoom in on the icons to make them clearly visible and well-proportioned
    let scale = 1.25;
    let translateY = 0;
    let translateX = 0;

    // Small manual adjustments for asymmetric source files or those with larger transparent margins
    if (path === '/icons/Pricing.png') {
        scale = 1.75;
        translateY = 4.0;
        translateX = -1.0;
    } else if (path === '/icons/Product_Management.png') {
        scale = 1.55;
        translateY = 1.5;
        translateX = -1.0;
    } else if (path === '/icons/Sales_Commercial.png') {
        scale = 1.55;
        translateY = -0.5;
        translateX = 1.0;
    } else if (path === '/icons/Marine_Oil_Gas.png') {
        scale = 1.85;
        translateY = 2.5;
        translateX = 1.5;
    } else if (path === '/icons/Plants.png') {
        scale = 1.45;
        translateY = 0.5;
        translateX = 1.0;
    } else if (path === '/icons/Engineering.png') {
        scale = 1.45;
        translateX = 1.0;
    } else if (path === '/icons/trending.png') {
        translateX = 0.5; 
    }

    const transformParts = [
        `scale(${scale})`,
        translateY ? `translateY(${translateY}px)` : '',
        translateX ? `translateX(${translateX}px)` : ''
    ].filter(Boolean).join(' ');

    return { 
        filter: baseFilter, 
        transform: transformParts
    };
};
const DETAIL_ICONS = {
    'Executive': '/icons/trending.png',
    'Customer Service': '/icons/Customer_Service.png',
    'Finance': '/icons/Finance.png',
    'Engineering': '/icons/Engineering.png',
    'Human Resources': '/icons/Human_Resources.png',
    'Marine, Oil & Gas': '/icons/Marine_Oil_Gas.png',
    'Operations': '/icons/Plants.png',
    'Pricing': '/icons/Pricing.png',
    'Product Management': '/icons/Product_Management.png',
    'Sales Commercial': '/icons/Sales_Commercial.png',
    'Plants': '/icons/Factory.png',
    
    // Legacy/Alternative names
    'Corporate Strategy': icons.trending,
    'Marine': icons.ship,
    'Supply Chain': icons.factory,
    'Sales': icons.handshake,
    
    'AI/ML': icons.cpu,
    'Analytics': icons.barChart,
    'Image Analytics': icons.activity,
};

const STATUS_DOT = {
    'Live':        { dot: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', label: 'Live' },
    'Completed':   { dot: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', label: 'Completed' },
    'In-Progress': { dot: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', label: 'In-Progress' },
    'In Progress': { dot: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', label: 'In Progress' },
    'On Hold':     { dot: '#f59e0b', bg: '#fffbeb', border: '#fde68a', text: '#d97706', label: 'On Hold' },
    'Hold':        { dot: '#f59e0b', bg: '#fffbeb', border: '#fde68a', text: '#d97706', label: 'On Hold' },
    'Planned':     { dot: '#a855f7', bg: '#faf5ff', border: '#e9d5ff', text: '#7e22ce', label: 'Planned' },
};

const PLANT_NAMES = [
    "Redwood City, CA (W&C)",
    "El Cajon, CA (MOG)",
    "Tecate, MX (CON)",
    "Hermosillo, MX (CON)",
    "Tijuana, MX (W&C)",
    "Tijuana, MX (MOG)",
    "Mt.Joy/Manheim, PA (CON)",
    "Fairview/Arden, NC (Relays)",
    "Mansfield, OH (Relays)",
    "Hauppauge, NY (Relays)",
    "Katy, TX (MOG)",
    "Evreux, FR (CON)",
    "Hastings, UK (CON)",
    "Swindon, UK (W&C)",
    "Great Yarmouth, UK (MOG)",
    "Evora, PORT (Relays)",
    "Bangalore, IN (Relays)",
    "Bangalore, IN (DRI)"
];

const MODAL_STYLES = `
    @keyframes _solBg   { from{opacity:0}                                            to{opacity:1} }
    @keyframes _solCard { from{opacity:0;transform:scale(0.95) translateY(16px)}    to{opacity:1;transform:scale(1) translateY(0)} }
    @keyframes _solRow  { from{opacity:0;transform:translateY(10px)}                to{opacity:1;transform:translateY(0)} }
`;

function ProjectDetailModal({ bu, onClose, initialSearchQuery = '', modalIconProp }) {
    const [expandedIdx, setExpandedIdx] = useState(initialSearchQuery ? 0 : null);
    const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedPlant, setSelectedPlant] = useState('');
    const [activeTooltip, setActiveTooltip] = useState(null);
    const navigate = useNavigate();

    const modalIcon = modalIconProp || icons.briefcase;

    function slugify(name) {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    useEffect(() => {
        const fn = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', fn);
        return () => document.removeEventListener('keydown', fn);
    }, [onClose]);

    useEffect(() => {
        window.__setActiveTooltip = setActiveTooltip;
        return () => { delete window.__setActiveTooltip; };
    }, []);

    const filteredProjects = bu.projects.filter(proj => {
        const matchesSearch = proj.name.toLowerCase().includes(searchQuery.toLowerCase());
        
        let matchesStatus = true;
        if (statusFilter) {
            const status = proj.dashboardStatus || '';
            const statusLower = status.toLowerCase();
            if (statusFilter === 'Live') {
                matchesStatus = (statusLower === 'live' || statusLower === 'completed');
            } else if (statusFilter === 'In Progress') {
                matchesStatus = (statusLower === 'in progress' || statusLower === 'in-progress');
            } else if (statusFilter === 'On Hold') {
                matchesStatus = (statusLower === 'on hold' || statusLower === 'hold');
            } else if (statusFilter === 'Planned') {
                matchesStatus = (statusLower === 'planned');
            }
        }
        
        return matchesSearch && matchesStatus;
    });

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-[8px]"
            style={{ animation: '_solBg 0.18s ease both' }}
        >
            <style>{MODAL_STYLES}</style>
            <div
                className="w-full max-w-2xl flex flex-col shadow-2xl relative"
                style={{ animation: '_solCard 0.24s cubic-bezier(0.25,0.46,0.45,0.94) both', borderRadius: '16px' }}
                onClick={e => e.stopPropagation()}
            >
                {/* ── Dark Navy Header ── */}
                <div className="flex items-center justify-between px-7 py-5 shrink-0 rounded-t-[16px]"
                    style={{ background: 'linear-gradient(135deg, #15263C 0%, #15263C 100%)' }}>
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: 'rgba(249,115,22,0.18)', border: '1px solid rgba(249,115,22,0.3)' }}>
                            {modalIcon?.endsWith?.('.png') ? (
                                <img src={modalIcon} className="w-6 h-6 object-contain" style={GET_ICON_STYLE(modalIcon)} alt="" />
                            ) : (
                                <Icon path={modalIcon} className="w-5 h-5 text-orange-400" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="text-[17px] font-bold text-white tracking-tight">{bu.label}</h3>
                                {bu.label === "Plants" && (
                                    <div className="relative">
                                        <select
                                            value={selectedPlant}
                                            onChange={(e) => setSelectedPlant(e.target.value)}
                                            className="appearance-none pl-3 pr-8 py-1 text-[11px] font-bold bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-400 transition-all cursor-pointer tracking-wide"
                                            style={{ minWidth: '160px' }}
                                        >
                                            <option value="" className="bg-[#15263C] text-white">Select Plant Location</option>
                                            {PLANT_NAMES.map(p => (
                                                <option key={p} value={p} className="bg-[#15263C] text-white">{p}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white/60">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                                {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} · Solve Architecture by Function
                            </p>
                        </div>
                    </div>
                    {/* Search input inside header — next to × */}
                    <div className="flex items-center gap-3 ml-auto">
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); setExpandedIdx(null); }}
                                className="appearance-none pl-3 pr-8 py-1.5 text-[11px] rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all cursor-pointer font-bold tracking-wide"
                                style={{ minWidth: '110px' }}
                            >
                                <option value="" className="bg-[#15263C] text-white">All Statuses</option>
                                <option value="Planned" className="bg-[#15263C] text-white">Planned</option>
                                <option value="In Progress" className="bg-[#15263C] text-white">In Progress</option>
                                <option value="Live" className="bg-[#15263C] text-white">Live</option>
                                <option value="On Hold" className="bg-[#15263C] text-white">On Hold</option>
                            </select>
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/60">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>
                        <div className="relative">
                            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: 'rgba(255,255,255,0.45)' }}>
                                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search projects..."
                                value={searchQuery}
                                onChange={e => { setSearchQuery(e.target.value); setExpandedIdx(null); }}
                                className="pl-8 pr-8 py-1.5 text-[11px] rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all w-[180px]"
                                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
                            />
                            {searchQuery && (
                                <button onClick={() => { setSearchQuery(''); setExpandedIdx(null); }} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
                                </button>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0"
                            style={{ background: 'rgba(255,255,255,0.08)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.16)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                        >
                            <Icon path={icons.x} className="w-4 h-4 text-white" />
                        </button>
                    </div>
                </div>

                {/* ── Orange accent line ── */}
                <div className="h-[3px] w-full shrink-0" style={{ background: 'linear-gradient(90deg,#f97316,#fb923c,transparent)' }} />

                {/* ── Project List ── */}
                <div className="flex-1 bg-gray-50 px-5 py-4 pb-6 space-y-3" style={{ borderRadius: '0 0 16px 16px', overflow: 'visible', maxHeight: '70vh', overflowY: 'auto' }}>
                    {filteredProjects.length === 0 && (
                        <div className="text-center py-10 text-gray-400 text-[12px] italic">No projects match "{searchQuery}"{statusFilter ? ` with status "${statusFilter}"` : ''}</div>
                    )}
                    {filteredProjects.map((proj, idx) => (
                        <div
                            key={idx}
                            className={`group relative bg-white rounded-xl border transition-all duration-200 hover:shadow-md hover:z-50 cursor-pointer ${expandedIdx === idx ? 'z-40 border-orange-200 shadow-sm' : 'z-10 border-gray-100'}`}
                            style={{ animation: `_solRow 0.22s ease ${idx * 0.07}s both` }}
                            onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                        >
                            {/* Row */}
                            <div className="relative flex items-start gap-4 px-5 py-4 select-none">
                                {/* Type icon */}
                                <div className="w-9 h-9 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                                    <Icon path={DETAIL_ICONS[proj.type] || icons.barChart} className="w-4 h-4 text-orange-500" />
                                </div>

                                {/* Name + type + hover description */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-[13px] font-semibold text-gray-900 truncate" title={proj.name}>
                                            {formatProjectName(proj.name)}
                                        </p>
                                        {/* Status dot badge */}
                                        {proj.dashboardStatus && STATUS_DOT[proj.dashboardStatus] && (() => {
                                            const s = STATUS_DOT[proj.dashboardStatus];
                                            return (
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                    fontSize: '9px', fontWeight: 800, letterSpacing: '0.08em',
                                                    textTransform: 'uppercase', padding: '2px 7px 2px 5px',
                                                    borderRadius: '20px', border: `1px solid ${s.border}`,
                                                    background: s.bg, color: s.text, whiteSpace: 'nowrap', flexShrink: 0,
                                                }}>
                                                    <span style={{
                                                        width: '6px', height: '6px', borderRadius: '50%',
                                                        background: s.dot, display: 'inline-block', flexShrink: 0,
                                                        boxShadow: `0 0 5px ${s.dot}88`,
                                                    }} />
                                                    {s.label}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                    <span className="inline-block text-[9px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 mt-1 uppercase tracking-wider">
                                        {proj.type}
                                    </span>

                                    {/* Reveal on hover OR expanded */}
                                    <div className={`grid transition-[grid-template-rows,opacity,margin] duration-300 ease-in-out ${expandedIdx === idx ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 group-hover:grid-rows-[1fr] group-hover:opacity-100 group-hover:mt-2'}`}>
                                        <div className="overflow-hidden">
                                            <p className="text-[12px] text-gray-500 leading-relaxed pr-24 pb-1">
                                                {proj.shortDesc || `This ${proj.type.toLowerCase()} dashboard provides a centralized view of critical KPIs and performance metrics tailored for the ${bu.label} function, enabling faster, data-driven decisions.`}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Info icon + tooltip trigger */}
                                <div className="relative z-50 shrink-0 mt-0.5" onClick={e => e.stopPropagation()}>
                                    <div 
                                        className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shadow-sm cursor-pointer border border-gray-200 hover:bg-orange-50 hover:border-orange-200 transition-colors group/icon"
                                        onMouseEnter={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const spaceBelow = window.innerHeight - rect.bottom;
                                            const showAbove = spaceBelow < 220; 
                                            window.__setActiveTooltip({
                                                proj,
                                                top: showAbove ? rect.top - 8 : rect.bottom + 8,
                                                right: window.innerWidth - rect.right,
                                                showAbove
                                            });
                                        }}
                                        onMouseLeave={() => {
                                            window.__setActiveTooltip(null);
                                        }}
                                    >
                                        <Icon path={icons.info} className="w-4 h-4 text-gray-400 group-hover/icon:text-orange-500 transition-colors" />
                                    </div>
                                </div>

                                {/* Chevron */}
                                <div className="mt-1.5 shrink-0">
                                    <Icon
                                        path={icons.chevronDown}
                                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expandedIdx === idx ? 'rotate-180 text-orange-500' : ''}`}
                                    />
                                </div>

                                {/* Learn more button - absolute position bottom right of the row */}
                                <div className={`absolute bottom-4 right-5 transition-opacity duration-300 ${expandedIdx === idx ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} pointer-events-auto`}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onClose(); navigate(`/project/${slugify(proj.name)}`); }}
                                        className="text-[11px] font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-100 px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap shadow-sm"
                                    >
                                        Learn more &rarr;
                                    </button>
                                </div>
                            </div>

                            {/* Expanded detail (Buttons only, explanation moved up) */}
                            {expandedIdx === idx && (
                                <div className="px-5 pb-5 pt-0 border-t-0 bg-white rounded-b-xl" onClick={e => e.stopPropagation()}>
                                    {/* Buttons */}
                                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                                        <a href={proj.dashboardUrl || "#"} target={proj.dashboardUrl ? "_blank" : "_self"} rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-[#ff6b00] hover:bg-[#ff8533] text-white py-2.5 rounded-lg text-[13px] font-bold uppercase tracking-wider transition-colors shadow-sm">
                                            <Icon path={icons.barChart} className="w-4 h-4" /> DASHBOARD
                                        </a>
                                        <a href={proj.docPath || "#"} target={proj.docPath ? "_blank" : "_self"} rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-[#334155] py-2.5 rounded-lg text-[13px] font-bold uppercase tracking-wider transition-colors">
                                            <Icon path={icons.externalLink} className="w-4 h-4" /> DOCUMENTATION
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {/* End list */}
                </div>
            </div>

            {/* Float tooltips outside clipping wrapper */}
            {activeTooltip && (() => {
                const isPlanned = activeTooltip.proj.dashboardStatus?.toLowerCase() === 'planned' || activeTooltip.proj.dashboardStatus?.toLowerCase() === 'planning';
                const details = isPlanned
                    ? [
                        { label: 'Team Lead',           value: activeTooltip.proj.teamLead },
                        { label: 'Team Lead Email',     value: activeTooltip.proj.contactEmail },
                        { label: 'L1 Name',             value: activeTooltip.proj.escalation1Name },
                        { label: 'L1 Email',            value: activeTooltip.proj.escalation1Email },
                    ].filter(item => !!item.value)
                    : [
                        { label: 'Data Source',          value: activeTooltip.proj.source },
                        { label: 'Data Owner',           value: activeTooltip.proj.dataOwner },
                        { label: 'Data Developer',       value: activeTooltip.proj.dataDeveloper },
                        { label: 'Data Validated By',    value: activeTooltip.proj.lastValidateDeveloper },
                        { label: 'Dashboard Developer',  value: activeTooltip.proj.dashboardDeveloper },
                        { label: 'Dashboard Owner',      value: activeTooltip.proj.dashboardOwner },
                    ].filter(item => !!item.value);

                const lastValidatedVal = (() => {
                    if (isPlanned) return '';
                    if (!activeTooltip.proj.lastValidateDate) return '';
                    const d = new Date(activeTooltip.proj.lastValidateDate);
                    const dateStr = isNaN(d.getTime()) ? activeTooltip.proj.lastValidateDate : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    if (activeTooltip.proj.drillDown) {
                        return `${dateStr} (${activeTooltip.proj.drillDown} Validated)`;
                    }
                    return dateStr;
                })();

                return (
                    <div 
                        className="fixed z-[9999] w-[460px] rounded-xl overflow-hidden shadow-2xl pointer-events-none transition-all duration-300"
                        style={{ 
                            top: activeTooltip.showAbove ? 'auto' : activeTooltip.top,
                            bottom: activeTooltip.showAbove ? window.innerHeight - activeTooltip.top : 'auto',
                            right: activeTooltip.right,
                            boxShadow: '0 16px 48px -8px rgba(15,28,46,0.22), 0 0 0 1px rgba(0,0,0,0.07)' 
                        }}
                    >
                        {/* Full-width Header */}
                        <div className="flex items-center justify-between px-4 py-2.5" style={{ background: 'linear-gradient(135deg,#15263C,#1b3550)' }}>
                            <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-white">
                                {isPlanned ? 'Planned Project Details' : 'Project Details'}
                            </span>
                            <span className="text-[8px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(249,115,22,0.2)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)' }}>{activeTooltip.proj.type}</span>
                        </div>
                        <div className="h-[2px]" style={{ background: 'linear-gradient(90deg,#f97316,#fb923c,transparent)' }} />

                        {/* Grid */}
                        {details.length > 0 && (
                            <div className="grid grid-cols-2 gap-[1px] bg-slate-100" style={{ borderBottom: '1px solid #f1f5f9' }}>
                                {details.map(({ label, value }, index, arr) => {
                                    const isFullWidth = (arr.length % 2 !== 0 && index === arr.length - 1);
                                    return (
                                        <div 
                                            key={label} 
                                            className={`px-3 py-3 flex flex-col gap-1 bg-white ${isFullWidth ? 'col-span-2' : ''}`}
                                            style={{ borderRight: !isFullWidth && index % 2 === 0 ? '1px solid #f1f5f9' : 'none' }}
                                        >
                                            <span className="text-[8px] font-bold uppercase tracking-wider text-[#94a3b8]">{label}</span>
                                            <span className="text-[11px] font-bold text-slate-800 leading-snug">{value}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Bottom banner for Last Validated */}
                        {lastValidatedVal && (
                            <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: 'linear-gradient(90deg,#fff7ed,#ffedd5)' }}>
                                <div>
                                    <p className="text-[8px] font-extrabold uppercase tracking-[0.14em]" style={{ color: '#ea580c' }}>Last Validated</p>
                                    <p className="text-[12px] font-extrabold mt-0.5" style={{ color: '#9a3412' }}>{lastValidatedVal}</p>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })()}
        </div>
    );
}

const FUNCTION_TO_BU_KEY = {
    'Executive':             'executive',
    'Customer Service':      'customerService',
    'Finance':               'finance',
    'Engineering':           'engineering',
    'Human Resources':       'hr',
    'Marine, Oil & Gas':     'marineOilGas',
    'Operations':            'operations',
    'Pricing':               'pricing',
    'Product Management':    'productManagement',
    'Sales Commercial':      'sales',
    'Sales & Commercial':    'sales',
    'Plants':                'plant',
    'Plant':                 'plant',
    // legacy mappings
    'Technology':            'engineering',
    'Supply Chain':          'operations',
    'Legal & Compliance':    'executive',
    'Marketing':             'sales',
};

export default function SolutionSection() {
    const [selectedBU, setSelectedBU] = useState(null);
    const [buData, setBuData] = useState(BU_DATA);
    const [initialModalSearch, setInitialModalSearch] = useState('');
    const [hoveredCard, setHoveredCard] = useState(null);

    useEffect(() => {
        const handleEsc = (e) => { 
            if (e.key === 'Escape') {
                setSelectedBU(null); 
            }
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, []);

    const loadProjects = () => {
        fetchPublishedProjects()
            .then(projects => {
                if (!projects || projects.length === 0) {
                    setBuData(BU_DATA);
                    return;
                }
                // Deep-clone BU_DATA so we start fresh and avoid growing state with duplicates or retaining stale projects
                const next = {};
                for (const key of Object.keys(BU_DATA)) {
                    next[key] = { ...BU_DATA[key], projects: [...BU_DATA[key].projects] };
                }
                for (const pub of projects) {
                    const buKey = FUNCTION_TO_BU_KEY[pub.function];
                    if (!buKey || !next[buKey]) continue;

                    const alreadyExists = next[buKey].projects.some(p => p.name === pub.title);
                    if (alreadyExists) continue;

                    next[buKey].projects.push({
                        project_id:            pub.project_id,
                        name:                  pub.title,
                        shortDesc:             pub.description,
                        description:           pub.description,
                        owner:                 pub.team_name,
                        teamLead:              pub.team_lead || pub.contact_person || pub.team_name,
                        contactEmail:          pub.contact_email || '',
                        altContact:            pub.alt_contact || '',
                        contactPerson:         pub.contact_person || '',
                        whyWeUseIt:            pub.why_we_use_it || '',
                        whoManagesIt:          pub.who_manages_it || '',
                        escalation1Name:       pub.escalation1_name || '',
                        escalation1Email:      pub.escalation1_email || '',
                        escalation2Name:       pub.escalation2_name || '',
                        escalation2Email:      pub.escalation2_email || '',
                        date:                  pub.published_at,
                        dashboardStatus:       pub.project_status === 'Completed' || !pub.project_status ? 'Live' : pub.project_status,
                        type:                  pub.category || 'Analytics',
                        source:                pub.data_source || '',
                        progress:              100,
                        dashboardUrl:          pub.dashboard_link || '',
                        startDate:             pub.start_date || '',
                        endDate:               pub.end_date || '',
                        milestones:            pub.milestones ? JSON.parse(pub.milestones) : [],
                        docPath:               (pub.documents && pub.documents.length > 0) ? `/admin/uploads/documents/${pub.documents[0].file_path}` : '',
                        dashboardImage:        pub.image_path ? `/admin/uploads/images/${pub.image_path}` : null,
                        dashboardImages:       (pub.images || []).map(f => `/admin/uploads/images/${f.file_path}`),
                        uploadedDocs:          (pub.documents || []).map(f => ({
                            label: f.file_name,
                            href:  `/admin/uploads/documents/${f.file_path}`,
                            live:  true,
                        })),
                        lastValidateDate:      pub.last_validated || '',
                        lastValidateDeveloper: pub.data_validated_by || '',
                        drillDown:             pub.drill_down || '',
                        dashboardDeveloper:    pub.dashboard_developer || '',
                        dashboardOwner:        pub.dashboard_owner || '',
                        dataOwner:             pub.data_owner || '',
                        dataDeveloper:         pub.data_developer || '',
                        fieldsSelected:        pub.fields_selected || '',
                    });
                }
                setBuData(next);
            })
            .catch(err => console.warn('[SolutionSection] Failed to fetch projects:', err));
    };

    useEffect(() => {
        loadProjects();
        const interval = setInterval(loadProjects, 60000);
        return () => clearInterval(interval);
    }, []);

    // Filter logic
    const filteredBuData = buData;

    return (
        <div className="w-full">
            {/* Title */}
            <div className="mb-6 flex flex-row items-center justify-between gap-4">
                <h2 className="text-[12px] font-bold text-[#8ba3c7] tracking-[0.15em] uppercase">SOLVE ARCHITECTURE BY FUNCTION</h2>
            </div>

            {/* 11 items in a single non-scrolling row */}
            <div className="grid grid-cols-11 gap-[8px]">
                {Object.entries(filteredBuData).map(([key, bu], index) => (
                    <button
                        key={key}
                        onClick={() => { 
                            setInitialModalSearch(''); 
                            setSelectedBU(key); 
                        }}
                        onMouseEnter={() => setHoveredCard(index)}
                        onMouseLeave={() => setHoveredCard(null)}
                        className="group w-full h-[115px] bg-white rounded-[12px] p-2.5 flex flex-col items-start justify-start hover:bg-orange-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl text-left focus:outline-none relative z-10 overflow-hidden"
                    >
                        {/* Icon square */}
                        <div className="w-8 h-8 rounded-[8px] bg-orange-50 mb-2 flex items-center justify-center group-hover:bg-white/20 transition-colors duration-300 shrink-0">
                            {ICON_MAP[index % ICON_MAP.length]?.endsWith?.('.png') ? (
                                <img 
                                    src={ICON_MAP[index % ICON_MAP.length]} 
                                    alt="" 
                                    className="w-6 h-6 object-contain transition-all duration-300" 
                                    style={GET_ICON_STYLE(ICON_MAP[index % ICON_MAP.length], hoveredCard === index)} 
                                />
                            ) : (
                                <Icon
                                    path={ICON_MAP[index % ICON_MAP.length]}
                                    className="w-5 h-5 text-orange-500 group-hover:text-white transition-colors duration-300"
                                />
                            )}
                        </div>

                        {/* Bold Category Name */}
                        <span className="text-[11px] font-bold text-gray-900 group-hover:text-white mb-[4px] leading-tight transition-colors duration-300 line-clamp-2 w-full">
                            {bu.label}
                        </span>

                        {/* Small Gray Description */}
                        <span className="text-[8.5px] text-gray-500 group-hover:text-white/90 leading-snug line-clamp-2 w-full transition-colors duration-300">
                            {bu.desc}
                        </span>
                    </button>
                ))}
            </div>

            {/* Drill-down Modal */}
            {selectedBU && (
                <ProjectDetailModal
                    bu={filteredBuData[selectedBU]}
                    initialSearchQuery={initialModalSearch}
                    modalIconProp={ICON_MAP[Object.keys(filteredBuData).indexOf(selectedBU) % ICON_MAP.length]}
                    onClose={() => {
                        setSelectedBU(null);
                        setInitialModalSearch('');
                    }}
                />
            )}
        </div>
    );
}
