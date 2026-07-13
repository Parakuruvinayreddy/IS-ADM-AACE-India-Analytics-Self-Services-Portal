import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon, { icons } from '../components/Icon';

export default function GuidelinesPage() {
    const navigate = useNavigate();
    useEffect(() => { window.scrollTo(0, 0); }, []);

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-orange-500 selection:text-white">

            {/* ── Hero Section ── */}
            <div className="relative bg-[#15263C] overflow-hidden">
                {/* Background glow effects */}
                <div className="absolute top-[-50%] left-[-10%] w-[60%] h-[200%] bg-blue-500/10 blur-[120px] rounded-full point-events-none" />
                <div className="absolute bottom-[-50%] right-[-10%] w-[50%] h-[150%] bg-orange-500/10 blur-[120px] rounded-full point-events-none" />

                <div className="max-w-6xl mx-auto px-6 pt-12 pb-32 relative z-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="group mb-8 inline-flex items-center gap-2 text-[13px] font-semibold text-gray-400 hover:text-white transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all">
                            <Icon path={icons.chevronLeft} className="w-4 h-4" />
                        </div>
                        Back to Dashboard
                    </button>

                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 mb-6">
                            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                            <span className="text-[11px] font-bold text-orange-400 uppercase tracking-widest">Complete Guide to ADM Analytics</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-6">
                            Platform <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Guidelines</span>.
                        </h1>
                        <p className="text-lg text-slate-400 leading-relaxed font-medium">
                            Everything you need to know about accessing, using, and managing data within the ADM Analytics ecosystem.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Main Content Area ── */}
            <div className="max-w-6xl mx-auto px-6 -mt-20 relative z-20 pb-24 space-y-8">

                {/* ── Overview Stats ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { title: 'Data Sources', icon: icons.database, value: 'SAP, EDGE, TED', desc: 'Secure enterprise connections' },
                        { title: 'Data Lags', icon: icons.activity, value: 'Real-time', desc: 'Continuous pipelining' },
                        { title: 'Access Model', icon: icons.lock, value: 'Role-based', desc: 'Strict IAM governance' },
                    ].map((s, i) => (
                        <div key={i} className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6">
                                <Icon path={s.icon} className="w-5 h-5 text-slate-700" />
                            </div>
                            <h3 className="text-slate-500 text-[12px] font-bold uppercase tracking-widest mb-2">{s.title}</h3>
                            <p className="text-2xl font-bold text-slate-900 mb-1">{s.value}</p>
                            <p className="text-[13px] text-slate-500 font-medium">{s.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column (Wider for processes) */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* ── How to Access Dashboards ── */}
                        <section className="bg-white rounded-3xl p-8 lg:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                            <div className="flex items-center gap-3 mb-8">
                                <span className="w-1.5 h-6 bg-orange-500 rounded-full" />
                                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">How to Access Dashboards</h2>
                            </div>

                            <div className="relative pl-6">
                                {/* Vertical connecting line */}
                                <div className="absolute top-4 bottom-4 left-[3px] w-0.5 bg-slate-100" />

                                <div className="space-y-8">
                                    {[
                                        { step: '1', title: 'Request Access', desc: 'Email support@adm-analytics.com with your TE User ID, location, and business justification.', color: 'orange' },
                                        { step: '2', title: 'Wait for Approval', desc: 'Your request will be reviewed by the ADM team. Approval typically takes 1-2 business days.', color: 'blue' },
                                        { step: '3', title: 'Navigate to Dashboard', desc: 'Once approved, find your dashboard in the "Projects by Functions" section on the homepage.', color: 'emerald' },
                                    ].map((item, i) => (
                                        <div key={i} className="relative">
                                            {/* Circle indicator */}
                                            <div className="absolute -left-10 w-8 h-8 rounded-full bg-slate-50 border-4 border-white flex items-center justify-center shadow-sm">
                                                <div className={`w-3 h-3 rounded-full bg-${item.color}-500`} />
                                            </div>
                                            <div className="pt-1">
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Step {item.step}</p>
                                                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                                                <p className="text-[14px] text-slate-600 leading-relaxed font-medium">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* ── How to Access Data ── */}
                        <section className="bg-white rounded-3xl p-8 lg:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                            <div className="flex items-center gap-3 mb-8">
                                <span className="w-1.5 h-6 bg-blue-500 rounded-full" />
                                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">How to Access Raw Data</h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { icon: icons.ticket, title: 'Raise Request', desc: 'Submit data request via email to support' },
                                    { icon: icons.calendar, title: 'Approval Review', desc: 'Reviewed by ADM team (1-2 days)' },
                                    { icon: icons.mail, title: 'Data Delivery', desc: 'Sent directly to your secure email' },
                                    { icon: icons.info, title: 'Context Matters', desc: 'Provide detailed justifications' },
                                ].map((item, i) => (
                                    <div key={i} className="group p-5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all flex gap-4 items-start">
                                        <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                            <Icon path={item.icon} className="w-4 h-4 text-slate-600" />
                                        </div>
                                        <div>
                                            <h4 className="text-[13px] font-bold text-slate-900 mb-1">{item.title}</h4>
                                            <p className="text-[12px] text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                    </div>

                    {/* Right Column (Sidebar style tools) */}
                    <div className="space-y-8">

                        {/* ── Documentation ── */}
                        <section className="bg-[#15263C] rounded-3xl p-8 shadow-xl relative overflow-hidden">
                            {/* Decorative background element */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />

                            <h2 className="text-xl font-bold text-white tracking-tight mb-8 relative z-10">Resources & Docs</h2>
                            <div className="space-y-4 relative z-10">
                                {[
                                    { icon: icons.fileText, title: 'Dashboard Explanations', desc: 'Features & metrics guide' },
                                    { icon: icons.user, title: 'Developer Info', desc: 'Ownership & build dates' },
                                    { icon: icons.database, title: 'Data Storage', desc: 'Architecture overviews' },
                                    { icon: icons.lightbulb, title: 'Feature Catalog', desc: 'Complete capability lists' },
                                ].map((doc, i) => (
                                    <a href="#" key={i} className="group flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                            <Icon path={doc.icon} className="w-4 h-4 text-slate-300 group-hover:text-white transition-colors" />
                                        </div>
                                        <div>
                                            <h4 className="text-[13px] font-bold text-white mb-0.5">{doc.title}</h4>
                                            <p className="text-[11px] text-slate-400 font-medium">{doc.desc}</p>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </section>

                        {/* ── Support ── */}
                        <section className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                            <div className="flex items-center gap-3 mb-8">
                                <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Need Support?</h2>
                            </div>

                            <div className="space-y-3">
                                <a href="mailto:support@adm-analytics.com" className="group flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-orange-200 hover:bg-orange-50 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-white flex items-center justify-center transition-colors">
                                            <Icon path={icons.mail} className="w-4 h-4 text-slate-600 group-hover:text-orange-500" />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-bold text-slate-900 group-hover:text-orange-900 transition-colors">Email Support</p>
                                            <p className="text-[11px] text-slate-500 font-medium">For general inquiries</p>
                                        </div>
                                    </div>
                                    <Icon path={icons.externalLink} className="w-4 h-4 text-slate-300 group-hover:text-orange-500 transition-colors" />
                                </a>

                                <a href="#" className="group flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-white flex items-center justify-center transition-colors">
                                            <Icon path={icons.ticket} className="w-4 h-4 text-slate-600 group-hover:text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-bold text-slate-900 group-hover:text-blue-900 transition-colors">Create Ticket</p>
                                            <p className="text-[11px] text-slate-500 font-medium">For technical issues</p>
                                        </div>
                                    </div>
                                    <Icon path={icons.externalLink} className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                </a>

                                <a href="#" className="group flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-white flex items-center justify-center transition-colors">
                                            <Icon path={icons.message} className="w-4 h-4 text-slate-600 group-hover:text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-bold text-slate-900 group-hover:text-emerald-900 transition-colors">Live Chat</p>
                                            <p className="text-[11px] text-slate-500 font-medium">Instant help via bot</p>
                                        </div>
                                    </div>
                                    <Icon path={icons.externalLink} className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                                </a>
                            </div>
                        </section>
                    </div>

                </div>
            </div>

            {/* ── Footer Link/Copyright ── */}
            <div className="text-center pb-12">
                <p className="text-[12px] font-medium text-slate-400">
                    © 2026 ADM Analytics · <a href="/" className="hover:text-orange-500 transition-colors">Strategy & Innovation Portal</a>
                </p>
            </div>

        </div>
    );
}
