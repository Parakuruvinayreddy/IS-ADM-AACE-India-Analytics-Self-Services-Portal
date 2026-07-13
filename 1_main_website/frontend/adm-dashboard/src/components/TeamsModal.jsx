import { useState, useEffect, useRef } from 'react';

const TEAM = {
    name: 'ADM Analytics Team',
    icon: '📊',
    color: '#f97316', // Orange
    description: 'Data pipelines, BI & dashboard development',
    leader: { name: 'Member 1', role: 'Lead Engineer', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Member1&backgroundColor=f97316', projects: ['Data Lake Architecture', 'Sales Dashboard'] },
    members: [
        { name: 'Member 2', role: 'Senior Analyst', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Member2&backgroundColor=f97316', projects: ['Q3 Revenue Forecast', 'Customer Churn Model'] },
        { name: 'Member 3', role: 'BI Developer', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Member3&backgroundColor=f97316', projects: ['HR Analytics Dashboard', 'Daily Metrics Report'] },
        { name: 'Member 4', role: 'Data Engineer', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Member4&backgroundColor=f97316', projects: ['ETL Pipeline V2', 'Data Warehouse Migration'] },
    ],
};

function Avatar({ src, size = 40 }) {
    return (
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            <img
                src={src}
                alt="Avatar"
                style={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    objectFit: 'cover',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                }}
            />
        </div>
    );
}

export default function TeamsModal({ isOpen, onClose }) {
    const modalRef = useRef(null);
    const [tooltipProps, setTooltipProps] = useState({ visible: false, member: null, x: 0, y: 0 });

    const handleNodeEnter = (e, member) => {
        const rect = e.currentTarget.getBoundingClientRect();
        let x = rect.right + 20;
        let y = rect.top - 10;
        
        // If tooltip runs past the right edge, spawn to the left instead
        if (x + 300 > window.innerWidth) {
            x = rect.left - 290;
        }

        setTooltipProps({ visible: true, member, x, y });
    };

    const handleNodeLeave = () => {
        setTooltipProps(prev => ({ ...prev, visible: false }));
    };

    const OrgNode = ({ member, color }) => (
        <div
            className="org-node-card"
            style={{
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '24px 32px',
                borderRadius: 16,
                background: '#ffffff',
                border: `2px solid ${color}40`,
                boxShadow: `0 10px 25px -5px ${color}20`,
                minWidth: 200,
                transition: 'all 0.3s ease',
                cursor: 'default',
                position: 'relative',
                zIndex: 2,
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = `0 20px 25px -5px ${color}40`;
                e.currentTarget.style.borderColor = color;
                handleNodeEnter(e, member);
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = `0 10px 25px -5px ${color}20`;
                e.currentTarget.style.borderColor = `${color}40`;
                handleNodeLeave();
            }}
        >
            <Avatar src={member.avatar} size={72} />
            <div style={{ fontWeight: 800, fontSize: 18, color: '#0f172a', marginTop: 16 }}>{member.name}</div>
            <div style={{ fontSize: 13, color: color, marginTop: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{member.role}</div>
        </div>
    );

    // Close on ESC
    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    // Lock body scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(15, 23, 42, 0.5)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 9998,
                    animation: 'fadeInBackdrop 0.3s ease',
                }}
            />

            {/* Modal */}
            <div
                ref={modalRef}
                style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '95vw',
                    maxWidth: 1200,
                    height: '90vh',
                    maxHeight: 800,
                    background: '#f8fafc',
                    borderRadius: 24,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    animation: 'teamsSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    fontFamily: 'Inter, Segoe UI, sans-serif',
                }}
            >
                {/* Header Bar */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        padding: '20px 32px',
                        background: '#ffffff',
                        borderBottom: '1px solid #e2e8f0',
                        flexShrink: 0,
                    }}
                >
                    {/* ADM Logo/Icon */}
                    <div
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background: `linear-gradient(135deg, ${TEAM.color}, #ea580c)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 22,
                            boxShadow: `0 6px 15px ${TEAM.color}40`,
                        }}
                    >
                        👥
                    </div>
                    <div>
                        <div style={{ fontWeight: 900, fontSize: 20, color: '#0f172a', letterSpacing: '-0.02em' }}>
                            Organization Chart
                        </div>
                        <div style={{ fontSize: 13, color: TEAM.color, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>
                            {TEAM.name}
                        </div>
                    </div>

                    <div style={{ marginLeft: 'auto' }} />

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            border: '1px solid #e2e8f0',
                            background: '#ffffff',
                            color: '#64748b',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 24,
                            lineHeight: 1,
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#fca5a5'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                    >
                        ×
                    </button>
                </div>

                {/* Left Panel styling / Missing Team Banner restored! */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#ffffff' }}>
                        
                    {/* Team Banner */}
                    <div
                        style={{
                            padding: '24px 32px 20px',
                            background: `linear-gradient(120deg, ${TEAM.color}0a 0%, rgba(255,255,255,1) 80%)`,
                            borderBottom: '1px solid #f1f5f9',
                            flexShrink: 0,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div
                                style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 14,
                                    background: `linear-gradient(135deg, ${TEAM.color}1a, ${TEAM.color}0d)`,
                                    border: `1.5px solid ${TEAM.color}40`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 28,
                                }}
                            >
                                {TEAM.icon}
                            </div>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: 22, color: '#0f172a', letterSpacing: '-0.02em' }}>
                                    {TEAM.name}
                                </div>
                                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                                    {TEAM.description}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Body Content - Flow Chart */}
                    <div style={{ flex: 1, overflow: 'auto', padding: '40px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
                        <div className="org-tree">
                            <ul>
                                <li>
                                    <OrgNode member={TEAM.leader} color={TEAM.color} />
                                    <ul>
                                        {TEAM.members.map((member, idx) => (
                                            <li key={idx}>
                                                <OrgNode member={member} color={TEAM.color} />
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                            </ul>
                        </div>
                    </div>

                </div>
            </div>

            {/* Smart Floating Tooltip Rendered at Root */}
            <div
                style={{
                    position: 'fixed',
                    left: tooltipProps.x,
                    top: tooltipProps.y,
                    background: 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: 'blur(10px)',
                    color: '#ffffff',
                    padding: '18px 22px',
                    borderRadius: 14,
                    width: 270,
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
                    zIndex: 100000,
                    pointerEvents: 'none',
                    opacity: tooltipProps.visible ? 1 : 0,
                    visibility: tooltipProps.visible ? 'visible' : 'hidden',
                    transform: tooltipProps.visible ? 'translateX(0) scale(1)' : 'translateX(-10px) scale(0.95)',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    textAlign: 'left',
                }}
            >
                {tooltipProps.member && (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                           <Avatar src={tooltipProps.member.avatar} size={44} />
                           <div>
                               <div style={{ fontWeight: 700, fontSize: 15, color: '#f8fafc' }}>{tooltipProps.member.name}</div>
                               <div style={{ fontSize: 11, color: TEAM.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{tooltipProps.member.role}</div>
                           </div>
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.08em' }}>
                            Current Projects
                        </div>
                        <ul style={{ margin: 0, padding: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 6, color: '#e2e8f0' }}>
                            {tooltipProps.member.projects?.map((proj, idx) => (
                                <li key={idx} style={{ paddingLeft: 4 }}>{proj}</li>
                            ))}
                        </ul>
                    </>
                )}
            </div>

            <style>{`
                @keyframes teamsSlideUp {
                    from { opacity: 0; transform: translate(-50%, -46%) scale(0.96); }
                    to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
                @keyframes fadeInBackdrop {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                
                /* Org Chart CSS */
                .org-tree {
                    display: inline-flex;
                    justify-content: center;
                }
                .org-tree ul {
                    padding-top: 40px; 
                    position: relative;
                    display: flex;
                    justify-content: center;
                    padding-left: 0;
                    margin: 0;
                }
                .org-tree li {
                    float: left; 
                    text-align: center;
                    list-style-type: none;
                    position: relative;
                    padding: 40px 20px 0 20px;
                }
                
                /* Connectors */
                .org-tree li::before, .org-tree li::after {
                    content: '';
                    position: absolute; 
                    top: 0; 
                    right: 50%;
                    border-top: 3px solid #cbd5e1;
                    width: 50%; 
                    height: 40px;
                }
                .org-tree li::after {
                    right: auto; 
                    left: 50%;
                    border-left: 3px solid #cbd5e1;
                }
                
                /* Clean up lines for only children */
                .org-tree li:only-child::after, .org-tree li:only-child::before {
                    display: none;
                }
                .org-tree li:only-child {
                    padding-top: 0;
                }
                
                /* First and Last Child logic */
                .org-tree li:first-child::before, .org-tree li:last-child::after {
                    border: 0 none;
                }
                .org-tree li:last-child::before {
                    border-right: 3px solid #cbd5e1;
                    border-radius: 0 12px 0 0;
                }
                .org-tree li:first-child::after {
                    border-radius: 12px 0 0 0;
                }
                
                /* Downward connectors from parents */
                .org-tree ul::before {
                    content: '';
                    position: absolute; 
                    top: 0; 
                    left: 50%;
                    border-left: 3px solid #cbd5e1;
                    width: 0; 
                    height: 40px;
                    transform: translateX(-50%);
                }
            `}</style>
        </>
    );
}
