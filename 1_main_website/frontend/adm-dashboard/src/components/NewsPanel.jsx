import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { NEWS_ITEMS } from '../data/constants';
import Icon, { icons } from './Icon';
import { fetchPublishedProjects } from '../utils/fetchWithRetry';
import { formatProjectName } from '../utils/formatProjectName';

function slugify(name) {
    return (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

const BADGE_COLORS = {
    'AI NEWS': 'bg-blue-100 text-blue-700',
    'PROJECT NEWS': 'bg-orange-100 text-orange-700',
    'ANALYTICS DASHBOARD': 'bg-purple-100 text-purple-700',
};


/* ── News Detail Modal ── */
function NewsModal({ item, onClose, onView }) {
    // Close on Escape key
    useEffect(() => {
        const fn = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', fn);
        return () => document.removeEventListener('keydown', fn);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={onClose}  /* click backdrop → close */
        >
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-slideUp"
                onClick={(e) => e.stopPropagation()}  /* prevent bubble */
            >
                {/* Modal Header */}
                <div className="flex items-start justify-between px-7 pt-6 pb-4 border-b border-gray-100">
                    <div className="flex-1 pr-4">
                        <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-2 tracking-wider uppercase ${BADGE_COLORS[item.category] || 'bg-gray-100 text-gray-600'}`}>
                            {item.category}
                        </span>
                        <h3 className="text-[17px] font-bold text-gray-900 leading-snug">{item.title}</h3>
                        <div className="flex items-center gap-1.5 mt-2">
                            <Icon path={icons.calendar} className="w-3 h-3 text-gray-400" />
                            <span className="text-[11px] text-gray-400">{item.date}</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors shrink-0"
                    >
                        <Icon path={icons.x} className="w-4 h-4" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="px-7 py-5">
                    <p className="text-[13px] text-gray-600 leading-relaxed">
                        {item.desc || 'This update reflects ongoing strategic initiatives across the analytics platform, enabling cross-functional teams to gain deeper visibility into operational performance metrics.'}
                    </p>

                    {/* Meta Info */}
                    <div className="mt-5 grid grid-cols-2 gap-3">
                        {[
                            { label: 'Category', value: item.category },
                            { label: 'Published', value: item.date },
                            { label: 'Source', value: 'ADM Analytics' },
                            { label: 'Status', value: item.status || 'Published' },
                        ].map((d) => (
                            <div key={d.label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{d.label}</p>
                                <p className="text-[12px] font-semibold text-gray-800">{d.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="px-7 pb-6 flex items-center justify-between">
                    {item.isProject ? (
                        <button
                            onClick={() => { onClose(); onView(item.title); }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-orange-200 hover:shadow-lg"
                        >
                            <Icon path={icons.chevronRight} className="w-3 h-3" />
                            View Project
                        </button>
                    ) : (
                        <span />
                    )}
                    <button
                        onClick={onClose}
                        className="text-[12px] font-semibold text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Main News Panel ── */
export default function NewsPanel() {
    const navigate = useNavigate();
    const [hoveredIdx, setHoveredIdx] = useState(null);
    const [modalItem, setModalItem] = useState(null);
    const [isPaused, setIsPaused] = useState(false);
    const [allNewsItems, setAllNewsItems] = useState(NEWS_ITEMS);
    const listRef = useRef(null);
    const offsetRef = useRef(0);
    const animRef = useRef(null);

    const loadProjects = () => {
        fetchPublishedProjects()
            .then(projects => {
                if (!Array.isArray(projects) || projects.length === 0) {
                    setAllNewsItems(NEWS_ITEMS);
                    return;
                }
                
                const dashboardProjects = projects.filter(p => {
                    const ps = (p.project_status || '').trim().toLowerCase();
                    return ps === 'planning' || ps === 'planned' || ps === 'in progress';
                });
                
                const projectNews = dashboardProjects.map(p => ({
                    category: 'ANALYTICS DASHBOARD',
                    title: formatProjectName(p.title || 'Untitled Project'),
                    desc: p.description || `${p.title} is currently ${p.project_status}. Stay tuned for updates.`,
                    date: p.published_at ? new Date(p.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent',
                    status: p.project_status,
                    isProject: true,
                }));
                
                const combined = [...projectNews, ...NEWS_ITEMS];
                const unique = [];
                const seen = new Set();
                for (const item of combined) {
                    const titleKey = item.title.toLowerCase().trim();
                    if (!seen.has(titleKey)) {
                        seen.add(titleKey);
                        unique.push(item);
                    }
                }
                setAllNewsItems(unique);
            })
            .catch(err => console.warn('[NewsPanel] Failed to fetch projects:', err));
    };

    useEffect(() => {
        loadProjects();
        const interval = setInterval(loadProjects, 60000);
        return () => clearInterval(interval);
    }, []);

    const directionRef = useRef(1); // 1 = down, -1 = up

    useEffect(() => {
        const el = listRef.current;
        if (!el) return;
        const SPEED = 0.25;
        const step = () => {
            if (!isPaused) {
                // Check if bottom reached
                if (directionRef.current === 1 && el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
                    directionRef.current = -1;
                }
                // Check if top reached
                else if (directionRef.current === -1 && el.scrollTop <= 0) {
                    directionRef.current = 1;
                }
                offsetRef.current += SPEED * directionRef.current;
                el.scrollTop = offsetRef.current;
            }
            animRef.current = requestAnimationFrame(step);
        };
        animRef.current = requestAnimationFrame(step);
        return () => cancelAnimationFrame(animRef.current);
    }, [isPaused, allNewsItems]);

    return (
        <>
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col h-full overflow-hidden">
                {/* Orange top accent line */}
                <div className="h-[3px] w-full shrink-0" style={{ background: '#f97316' }} />

                {/* Card Header */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <h3 className="text-[13px] font-bold text-gray-900 tracking-tight">Latest News</h3>
                    <span className="flex items-center gap-1.5 text-[9px] font-semibold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live Updates
                    </span>
                </div>

                {/* Scrolling list */}
                <div
                    ref={listRef}
                    className={`flex-1 ${isPaused ? 'overflow-y-auto' : 'overflow-y-hidden'} scrollbar-hide`}
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => {
                        setIsPaused(false);
                        setHoveredIdx(null);
                        if (listRef.current) {
                            offsetRef.current = listRef.current.scrollTop;
                        }
                    }}
                >
                    {allNewsItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-400">
                            <Icon path={icons.info} className="w-8 h-8 opacity-40 mb-2" />
                            <p className="text-[12px] font-semibold">No recent updates</p>
                        </div>
                    ) : (
                        allNewsItems.map((item, idx) => {
                            const isExpanded = hoveredIdx === idx;
                            const num = idx + 1;
                            return (
                                <div
                                    key={idx}
                                    onMouseEnter={() => setHoveredIdx(idx)}
                                    onMouseLeave={() => setHoveredIdx(null)}
                                    className={`px-4 py-3 border-b border-gray-50 transition-colors cursor-pointer ${isExpanded ? 'bg-gray-50' : 'hover:bg-gray-50/60'}`}
                                >
                                <div className="flex items-start gap-3">
                                    {/* Number badge */}
                                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-all duration-300 ${isExpanded ? 'bg-orange-500' : 'bg-gray-100'}`}>
                                        <span className={`text-[10px] font-bold transition-colors ${isExpanded ? 'text-white' : 'text-gray-500'}`}>{num}</span>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mb-1 tracking-wider uppercase ${BADGE_COLORS[item.category] || 'bg-gray-100 text-gray-600'}`}>
                                            {item.category}
                                        </span>
                                        <p className="text-[12px] font-semibold text-gray-800 leading-snug truncate">{item.title}</p>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <Icon path={icons.calendar} className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                                            <span className="text-[10px] text-gray-400">{item.date}</span>
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    <Icon
                                        path={isExpanded ? icons.chevronDown : icons.chevronRight}
                                        className={`w-3.5 h-3.5 shrink-0 mt-1 transition-colors duration-200 ${isExpanded ? 'text-orange-500' : 'text-gray-300'}`}
                                    />
                                </div>

                                {/* Expanded description */}
                                {isExpanded && (
                                    <div className="mt-2 pl-[40px]">
                                        <p className="text-[11px] text-gray-600 leading-relaxed">
                                            {item.desc || 'Explore this update from the analytics initiative across global regions.'}
                                        </p>
                                        <div className="mt-2 flex justify-end">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setModalItem(item); }}
                                                className="text-[10px] font-extrabold text-orange-600 uppercase tracking-widest flex items-center gap-1 hover:text-orange-500 transition-colors"
                                            >
                                                READ MORE <Icon path={icons.chevronRight} className="w-2.5 h-2.5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    }))}
                </div>
            </div>

            {/* Detail Popup Modal */}
            {modalItem && (
                <NewsModal
                    item={modalItem}
                    onClose={() => setModalItem(null)}
                    onView={(title) => navigate(`/project/${slugify(title)}`)}
                />
            )}
        </>
    );
}
