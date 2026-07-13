import Icon, { icons } from './Icon';

export default function BusinessValuePanel() {
    return (
        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col h-full overflow-hidden">
            {/* Teal top accent line */}
            <div className="h-[3px] w-full shrink-0" style={{ background: '#10b981' }} />
            {/* Card Header */}
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
                <h3 className="text-[15px] font-bold text-gray-900 tracking-tight">Business Value</h3>
                <span className="text-[11px] font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md">ROI Metrics</span>
            </div>

            {/* Content */}
            <div className="flex-1 p-3 flex items-center justify-center overflow-hidden">
                <div className="w-full h-full border-2 border-dashed border-gray-200 bg-gray-50/50 rounded-xl flex flex-col items-center justify-center p-4 hover:border-orange-300 hover:bg-orange-50/30 transition-all group cursor-pointer">
                    <div className="w-12 h-12 bg-white shadow-sm border border-gray-100 rounded-2xl flex items-center justify-center mb-3 group-hover:-translate-y-1 group-hover:shadow-md transition-all shrink-0">
                        <Icon path={icons.trending} className="w-6 h-6 text-emerald-500" />
                    </div>
                    <h4 className="text-[14px] font-bold text-gray-900 mb-1.5">ROI Dashboard</h4>
                    <p className="text-[11px] text-gray-500 text-center leading-relaxed max-w-[200px] mb-3">
                        Track business impact and value metrics globally across all your operational units.
                    </p>
                    <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-[11px] font-semibold border border-emerald-100 shrink-0">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        Coming Soon
                    </div>
                </div>
            </div>
        </div>
    );
}
