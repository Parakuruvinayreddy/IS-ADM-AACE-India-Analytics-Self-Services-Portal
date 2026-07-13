import { useState, useEffect } from 'react';
import Icon, { icons } from './Icon';
import { PROJECT_STATS, PROJECT_LIST } from '../data/constants';
import { useNavigate } from 'react-router-dom';
import { fetchPublishedProjects } from '../utils/fetchWithRetry';
import { formatProjectName } from '../utils/formatProjectName';

// Computed once from static data; we'll override 'delivered' dynamically
const BASE_TOTAL = PROJECT_STATS.delivered + PROJECT_STATS.inProgress + PROJECT_STATS.onHold + PROJECT_STATS.planned;


const MODAL_STYLES = `
    @keyframes _bgIn   { from { opacity:0 }                                         to { opacity:1 } }
    @keyframes _cardIn { from { opacity:0; transform:scale(0.96) translateY(14px) } to { opacity:1; transform:scale(1) translateY(0) } }
    @keyframes _rowIn  { from { opacity:0; transform:translateX(-8px) }             to { opacity:1; transform:translateX(0) } }
    @keyframes _expand { from { opacity:0; transform:translateY(-4px) }             to { opacity:1; transform:translateY(0) } }
`;

function ProgressBar({ value, color }) {
    return (
        <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{
                height: '100%', borderRadius: '6px',
                width: `${value}%`,
                background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: `0 0 8px ${color}55`,
            }} />
        </div>
    );
}

/* ─── Expanded progress detail row ─── */
function ExpandedDetail({ p, barColor }) {
    const isLive = (p.progress ?? 0) >= 100;
    return (
        <div style={{ padding: '12px 20px 14px', background: '#f8fafc', borderTop: '1px dashed #e9edf3', animation: '_expand 0.18s ease both' }}>
            {/* Progress bar row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Progress</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: barColor }}>{p.progress ?? 0}%</span>
            </div>
            <ProgressBar value={p.progress ?? 0} color={barColor} />

            {/* Expected Completion Date */}
            {p.expectedDate && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', padding: '7px 10px', borderRadius: '8px', background: isLive ? '#f0fdf4' : '#fffbeb', border: `1px solid ${isLive ? '#bbf7d0' : '#fde68a'}` }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isLive ? '#16a34a' : '#d97706'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: isLive ? '#15803d' : '#92400e' }}>
                        {isLive ? 'Live on:' : 'Expected Completion:'}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: isLive ? '#166534' : '#78350f' }}>
                        {p.expectedDate}
                    </span>
                </div>
            )}

            {/* Latest update */}
            <p style={{ fontSize: '11px', color: '#64748b', margin: '8px 0 0', lineHeight: 1.5 }}>
                <span style={{ fontWeight: 700, color: '#475569' }}>Latest: </span>
                {p.latestUpdate || 'No updates yet.'}
            </p>
        </div>
    );
}


/* ─── Modal ─── */
function ProjectModal({ config, projects, onClose }) {
    const navigate = useNavigate();
    const [expanded, setExpanded] = useState(null);

    useEffect(() => {
        const fn = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', fn);
        return () => document.removeEventListener('keydown', fn);
    }, [onClose]);

    function slugify(name) {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    return (
        <div
            className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[6px]"
            style={{ animation: '_bgIn 0.18s ease both' }}
            onClick={onClose}
        >
            <style>{MODAL_STYLES}</style>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden border border-gray-100"
                style={{ animation: '_cardIn 0.22s cubic-bezier(0.25,0.46,0.45,0.94) both', maxHeight: '85vh' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`px-6 py-4 ${config.badgeBg} flex items-center justify-between shrink-0`}>
                    <div className="flex items-center gap-3">
                        <span className={`w-3 h-3 rounded-full ${config.badgeDot} shadow-sm`} />
                        <div>
                            <h3 className="text-[16px] font-bold text-gray-900">{config.label} Projects</h3>
                            <p className="text-[11px] text-gray-500 mt-0.5">{projects.length} project{projects.length !== 1 ? 's' : ''} total — click a row to see progress</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors shadow-sm">
                        <Icon path={icons.x} className="w-4 h-4" />
                    </button>
                </div>

                {/* Project list */}
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                    {projects.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 text-[13px] italic">No projects in this category</div>
                    ) : projects.map((p, i) => {
                        const isOpen = expanded === i;
                        const shortName = formatProjectName(p.name);
                        return (
                            <div key={i} style={{ animation: `_rowIn 0.2s ease ${i * 0.06}s both` }}>
                                {/* Row */}
                                <div
                                    className={`flex items-center justify-between px-6 py-4 cursor-pointer transition-colors ${isOpen ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                                    onClick={() => setExpanded(isOpen ? null : i)}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-semibold text-gray-900 truncate" title={p.name}>{shortName}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-gray-500">{p.bu}</span>
                                            <span className="text-gray-300">·</span>
                                            <span className="text-[10px] text-gray-400 truncate max-w-[160px]">{p.owner}</span>
                                            <span className="text-gray-300">·</span>
                                            <span className="text-[10px] text-gray-400">{p.date}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-3 shrink-0">
                                        {/* Mini progress pill */}
                                        <span style={{ fontSize: '10px', fontWeight: 700, color: config.barColor, background: config.badgeBg, padding: '2px 7px', borderRadius: '12px', border: `1px solid ${config.barColor}33` }}>
                                            {p.progress ?? 0}%
                                        </span>
                                        <button
                                            className={`text-[10px] font-bold text-white px-3 py-1.5 rounded-lg ${config.btnColor} transition-colors uppercase tracking-wider shadow-sm`}
                                            onClick={e => { e.stopPropagation(); onClose(); navigate(`/project/${slugify(p.name)}`); }}
                                        >
                                            View
                                        </button>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Expandable progress section */}
                                {isOpen && <ExpandedDetail p={p} barColor={config.barColor} />}
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-gray-100 flex justify-end shrink-0">
                    <button onClick={onClose} className="text-[12px] font-semibold text-gray-400 hover:text-gray-700 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── Stat Cell ─── */
function StatCell({ s, onClick }) {
    const [hovered, setHovered] = useState(false);
    return (
        <button
            className={`relative bg-white border border-gray-200 border-l-[4px] ${s.borderColor} rounded-xl px-4 py-3 flex flex-col items-start justify-center overflow-hidden cursor-pointer transition-all duration-200 focus:outline-none text-left w-full h-full ${hovered ? 'shadow-md' : ''}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => onClick(s.key)}
        >
            <div className={`text-[30px] font-bold text-gray-900 leading-none mb-1 transition-opacity duration-200 ${hovered ? 'opacity-20' : 'opacity-100'}`}>{s.count}</div>
            <div className={`text-[9px] font-bold ${s.labelColor} uppercase tracking-[0.12em] transition-opacity duration-200 ${hovered ? 'opacity-20' : 'opacity-100'}`}>{s.label}</div>

            {/* Centered hover overlay */}
            <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
                <span className={`${s.overlayColor} text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-md`}>
                    View →
                </span>
            </div>
        </button>
    );
}

/* ─── Main Panel ─── */
export default function ProjectsPanel() {
    const [projectList, setProjectList] = useState(PROJECT_LIST);
    const [deliveredCount, setDeliveredCount] = useState(PROJECT_STATS.delivered);
    const [inProgressCount, setInProgressCount] = useState(PROJECT_STATS.inProgress);
    const [onHoldCount, setOnHoldCount] = useState(PROJECT_STATS.onHold);
    const [plannedCount, setPlannedCount] = useState(PROJECT_STATS.planned);
    const [modalStatus, setModalStatus] = useState(null);

    const loadProjects = () => {
        fetchPublishedProjects()
            .then(projects => {
                if (!projects || projects.length === 0) {
                    setProjectList(PROJECT_LIST);
                    setDeliveredCount(PROJECT_STATS.delivered);
                    setInProgressCount(PROJECT_STATS.inProgress);
                    setOnHoldCount(PROJECT_STATS.onHold);
                    setPlannedCount(PROJECT_STATS.planned);
                    return;
                }
                
                const next = [...PROJECT_LIST];
                let dAdded = 0, ipAdded = 0, ohAdded = 0, pAdded = 0;
                for (const pub of projects) {
                    const alreadyExists = next.some(p => p.name === pub.title);
                    if (alreadyExists) continue;
                    
                    let assignedStatus = pub.project_status;
                    if (assignedStatus) {
                        const normalized = assignedStatus.trim().toLowerCase();
                        if (normalized === 'completed' || normalized === 'live') {
                            assignedStatus = 'Live';
                        } else if (normalized === 'in progress') {
                            assignedStatus = 'In Progress';
                        } else if (normalized === 'on hold') {
                            assignedStatus = 'On Hold';
                        } else if (normalized === 'planned' || normalized === 'planning') {
                            assignedStatus = 'Planned';
                        }
                    } else {
                        assignedStatus = 'Live';
                    }
                    
                    if (assignedStatus === 'Live') dAdded++;
                    else if (assignedStatus === 'In Progress') ipAdded++;
                    else if (assignedStatus === 'On Hold') ohAdded++;
                    else if (assignedStatus === 'Planned') pAdded++;
                    
                    next.push({
                        name:         pub.title,
                        bu:           pub.function,
                        status:       assignedStatus,
                        owner:        pub.team_name,
                        date:         pub.published_at,
                        expectedDate: pub.published_at,
                        progress:     assignedStatus === 'Live' ? 100 : (assignedStatus === 'In Progress' ? 50 : 0),
                        latestUpdate: 'Published via ADM Platform.',
                    });
                }
                setProjectList(next);
                setDeliveredCount(PROJECT_STATS.delivered + dAdded);
                setInProgressCount(PROJECT_STATS.inProgress + ipAdded);
                setOnHoldCount(PROJECT_STATS.onHold + ohAdded);
                setPlannedCount(PROJECT_STATS.planned + pAdded);
            })
            .catch(err => console.warn('[ProjectsPanel] Failed to fetch projects:', err));
    };

    useEffect(() => {
        loadProjects();
        const interval = setInterval(loadProjects, 60000);
        return () => clearInterval(interval);
    }, []);

    // Build STATUS_CONFIG with live delivered count
    const statusConfig = [
        { key: 'Live',        label: 'Live',        count: deliveredCount,   labelColor: 'text-emerald-600', borderColor: 'border-l-emerald-500', overlayColor: 'bg-emerald-500', badgeBg: 'bg-emerald-50', badgeDot: 'bg-emerald-500', btnColor: 'bg-emerald-500 hover:bg-emerald-600', barColor: '#22c55e' },
        { key: 'In Progress', label: 'In Progress', count: inProgressCount,  labelColor: 'text-blue-600',    borderColor: 'border-l-blue-500',    overlayColor: 'bg-blue-500',    badgeBg: 'bg-blue-50',    badgeDot: 'bg-blue-500',    btnColor: 'bg-blue-500 hover:bg-blue-600',    barColor: '#3b82f6' },
        { key: 'On Hold',     label: 'On Hold',     count: onHoldCount,      labelColor: 'text-amber-600',   borderColor: 'border-l-amber-500',   overlayColor: 'bg-amber-500',   badgeBg: 'bg-amber-50',   badgeDot: 'bg-amber-500',   btnColor: 'bg-amber-500 hover:bg-amber-600',  barColor: '#f59e0b' },
        { key: 'Planned',     label: 'Planned',     count: plannedCount,     labelColor: 'text-purple-600',  borderColor: 'border-l-purple-500',  overlayColor: 'bg-purple-500',  badgeBg: 'bg-purple-50',  badgeDot: 'bg-purple-500',  btnColor: 'bg-purple-500 hover:bg-purple-600', barColor: '#a855f7' },
    ];

    const total = deliveredCount + inProgressCount + onHoldCount + plannedCount;
    const modalConfig = statusConfig.find(s => s.key === modalStatus);
    const modalProjects = modalStatus ? projectList.filter(p => p.status === modalStatus) : [];

    return (
        <>
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col h-full overflow-hidden">
                <div className="h-[3px] w-full shrink-0" style={{ background: '#3b82f6' }} />

                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <h3 className="text-[14px] font-bold text-gray-900 tracking-tight">Projects Summary</h3>
                    <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">ADM BU</span>
                </div>

                <div className="flex-1 p-3 overflow-hidden">
                    <div className="grid grid-cols-2 gap-[10px] h-full">
                        {statusConfig.map((s) => (
                            <StatCell key={s.key} s={s} onClick={setModalStatus} />
                        ))}
                    </div>
                </div>

                <div
                    className="mx-3 mb-3 px-4 py-2.5 flex items-center justify-between rounded-xl shrink-0"
                    style={{ background: 'linear-gradient(135deg, #4361ee 0%, #3a56d4 50%, #2f4bbf 100%)' }}
                >
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.18)' }}>
                            <Icon path={icons.briefcase} className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div>
                            <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>Total Projects</p>
                            <p className="text-[22px] font-bold text-white leading-none">{total}</p>
                        </div>
                    </div>
                    <Icon path={icons.calendar} className="w-4 h-4 text-white opacity-70" />
                </div>
            </div>

            {modalStatus && modalConfig && (
                <ProjectModal config={modalConfig} projects={modalProjects} onClose={() => setModalStatus(null)} />
            )}
        </>
    );
}
