// Shared SVG icon utility
const Icon = ({ path, className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        dangerouslySetInnerHTML={{ __html: path }}
    />
);

export const icons = {
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>',
    cpu: '<rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line>',
    chevronLeft: '<polyline points="15 18 9 12 15 6"></polyline>',
    chevronRight: '<polyline points="9 18 15 12 9 6"></polyline>',
    chevronDown: '<polyline points="6 9 12 15 18 9"></polyline>',
    info: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>',
    mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline>',
    ticket: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"></path><line x1="13" y1="5" x2="13" y2="21"></line>',
    x: '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>',
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>',
    externalLink: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>',
    
    // Exact Replicas from Image
    trending: '<path d="M4 20h16 M4 20V4" stroke-width="1.5"/><path d="M4 16l5-5 4 4 6-7" stroke-width="1.5"/><polyline points="15,8 19,8 19,12" stroke-width="1.5"/>',
    userCog: '<path d="M10 2h4v2h-4z" stroke-width="1.5"/><path d="M14 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke-width="1.5"/><circle cx="10" cy="10" r="2.5" stroke-width="1.5"/><path d="M6 16c0-2 2-3 4-3s4 1 4 3" stroke-width="1.5"/><path d="M13 18l5-5a1.5 1.5 0 0 1 2 2l-5 5a2 2 0 1 1-2-2z" stroke-width="1.5"/>',
    barChart: '<path d="M3 21h18 M3 21V3" stroke-width="1.5"/><path d="M3 15l4-4 4 3 3-4" stroke-width="1.5"/><circle cx="17" cy="8" r="4" stroke-width="1.5"/><path d="M17 8v-4a4 4 0 0 1 4 4z" stroke-width="1.5"/>',
    settings: '<g transform="translate(-3, -3) scale(0.8)"><circle cx="12" cy="12" r="3" stroke-width="1.5"></circle><path stroke-width="1.5" d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></g><g transform="translate(5, 5) scale(0.8)"><circle cx="12" cy="12" r="3" stroke-width="1.5"></circle><path stroke-width="1.5" d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></g>',
    users: '<path d="M7 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke-width="1.5"/><path d="M3 21v-2a3 3 0 0 1 3-3h2" stroke-width="1.5"/><path d="M17 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke-width="1.5"/><path d="M21 21v-2a3 3 0 0 0-3-3h-2" stroke-width="1.5"/><path fill="#fff" stroke="none" d="M12 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/><path fill="#fff" stroke="none" d="M6 23v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M12 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke-width="1.5"/><path d="M7 23v-2a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2" stroke-width="1.5"/>',
    ship: '<path d="M2 17h20" stroke-width="1.5"/><path d="M3 14h18l-2 3H5l-2-3z" stroke-width="1.5"/><path d="M5 14V8h4v6" stroke-width="1.5"/><path d="M11 14v-4h3v4" stroke-width="1.5"/><path d="M16 14v-3h2v3" stroke-width="1.5"/>',
    factory: '<path d="M2 22h20" stroke-width="1.5"/><path d="M4 22V10l4 4 4-4 4 4 4-4v12" stroke-width="1.5"/><path d="M6 10V5h2v7" stroke-width="1.5"/><path d="M10 12V7h2v7" stroke-width="1.5"/><path d="M14 10V5h2v7" stroke-width="1.5"/><rect x="6" y="16" width="3" height="3" stroke-width="1.5"/><rect x="11" y="16" width="3" height="3" stroke-width="1.5"/><rect x="16" y="16" width="3" height="3" stroke-width="1.5"/>',
    circleDollarSign: '<circle cx="12" cy="12" r="10" stroke-width="1.5"/><path d="M15 9h-4a1.5 1.5 0 1 0 0 3h2a1.5 1.5 0 1 1 0 3H9 M12 17V7" stroke-width="1.5"/>',
    clipboardCheck: '<g transform="translate(-2, -2) scale(0.9)"><circle cx="12" cy="12" r="3" stroke-width="1.5"></circle><path stroke-width="1.5" d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></g><path fill="#fff" stroke="none" d="M14 14 h10 v10 h-10 z" /><polyline points="15 19 18 22 23 15" stroke-width="2" stroke="#ea580c"/>',
    handshake: '<path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3-6 6"/><path d="m11 6 3.5 3.5a1 1 0 1 0 3-3L14 3.11"/><path d="m21 16-1.5-1.5a1.5 1.5 0 0 0-2.12 0l-4.5 4.5a1.5 1.5 0 0 0 0 2.12l1.5 1.5a1.5 1.5 0 0 0 2.12 0l4.5-4.5a1.5 1.5 0 0 0 0-2.12Z" stroke-width="1.5"/><path d="M3 13v-2c0-1.1.9-2 2-2h.5" stroke-width="1.5"/><path d="M3 13v2c0 1.1.9 2 2 2h.5" stroke-width="1.5"/><path d="m6 17-3 3" stroke-width="1.5"/><path d="m6 13-3-3" stroke-width="1.5"/>',
};

export default Icon;
