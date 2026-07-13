import Navbar from '../components/Navbar';
import NewsPanel from '../components/NewsPanel';
import ProjectsPanel from '../components/ProjectsPanel';
import BusinessValuePanel from '../components/BusinessValuePanel';
import SolutionSection from '../components/SolutionSection';
import Footer from '../components/Footer';
import ChatbotButton from '../components/ChatbotButton';

export default function Dashboard() {
    return (
        <div className="flex flex-col bg-gray-100" style={{ minHeight: '100vh' }}>

            {/* Fixed Navigation */}
            <Navbar />

            {/* Main Content */}
            <main className="pt-14 flex flex-col bg-gray-100" style={{ minHeight: 'calc(100vh - 56px)' }}>

                {/* ── ANALYTICS DASHBOARD SECTION ── */}
                <section className="px-6 pt-[20px] pb-[14px] bg-gray-100">
                    <div className="max-w-[1600px] w-full mx-auto">
                        <div
                            className="rounded-[20px] overflow-hidden px-[32px] pt-[22px] pb-[28px] shadow-sm"
                            style={{ background: 'linear-gradient(180deg, #15263C 0%, #1b3550 100%)' }}
                        >
                            <div className="flex items-center mb-[18px]">
                                <h1 className="text-[12px] font-bold text-[#8ba3c7] tracking-[0.15em] uppercase flex items-center gap-3">
                                    ANALYTICS DASHBOARD
                                    <span className="bg-white text-orange-500 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest border border-orange-100 shadow-sm">LIVE UPDATES</span>
                                </h1>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-[20px] h-[300px]">
                                <NewsPanel />
                                <ProjectsPanel />
                                <BusinessValuePanel />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── SOLUTION BY PROJECT SECTION ── */}
                <section className="flex-1 px-6 pb-[20px] bg-gray-100">
                    <div className="max-w-[1600px] w-full mx-auto h-full">
                        <div
                            className="rounded-[20px] overflow-hidden px-[32px] pt-[22px] pb-[28px] shadow-sm h-full"
                            style={{ background: 'linear-gradient(180deg, #15263C 0%, #1b3550 100%)' }}
                        >
                            <SolutionSection />
                        </div>
                    </div>
                </section>

            </main>

            <Footer />
            <ChatbotButton />
        </div>
    );
}


