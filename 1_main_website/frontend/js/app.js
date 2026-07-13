const Icon = ({ path, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} dangerouslySetInnerHTML={{ __html: path }}></svg>
);

const icons = {
    trending: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline>',
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>',
    cpu: '<rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line>',
    barChart: '<path d="M3 3v18h18"></path><path d="M18 17V9"></path><path d="M13 17V5"></path><path d="M8 17v-3"></path>',
    chevronLeft: '<polyline points="15 18 9 12 15 6"></polyline>',
    chevronRight: '<polyline points="9 18 15 12 9 6"></polyline>',
    info: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>',
    mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline>',
    ticket: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"></path><line x1="13" y1="5" x2="13" y2="21"></line>',
    lightbulb: '<path d="M9 21h6"></path><path d="M9 18h6"></path><path d="M10 15H14C14.7956 15 15.5587 14.6839 16.1213 14.1213C16.6839 13.5587 17 12.7956 17 12C17 10.14 15.5 8.5 13.5 8C13.5 5.5 11.5 4 9.5 4C7.5 4 6 5.5 6 7.5C6 8.5 6.5 9.5 7.5 10C8.5 10.5 9 11.5 9 12.5V15Z"></path>',
    message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>',
    x: '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>',
    activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>',
    search: '<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>',
    server: '<rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>',
    fileText: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline>',

};

const NEWS_ITEMS = [
    { category: "AI NEWS", title: "GenAI 2.0 Deployment", desc: "Our internal LLM now supports multi-modal data processing for Supply Chain automation.", date: "Jan 10, 2026" },
    { category: "PROJECT NEWS", title: "Finance Dashboard Launch", desc: "Successful transition to the automated Spend Intelligence platform across all regions.", date: "Jan 08, 2026" },
    { category: "AI NEWS", title: "Predictive Logistics", desc: "New AI model reduces fuel costs by 12% using real-time traffic and weather telemetry.", date: "Jan 05, 2026" },
    { category: "PROJECT NEWS", title: "Data Lake Expansion", desc: "Marketing attribution data from APAC is now fully integrated into the global lake.", date: "Dec 28, 2025" },
    { category: "AI NEWS", title: "Agentic Workflows", desc: "Pilot program initiated for AI agents to automate routine IT helpdesk ticket resolutions.", date: "Dec 20, 2025" },
    { category: "AI NEWS", title: "Natural Language SQL", desc: "Business users can now query internal databases using plain English via the ADM Chatbot.", date: "Dec 10, 2025" }
];

const BU_DATA = {
    executive: { label: "Executive", projects: [{ name: "EXC_Global_KPI_Overview_US", dashboardId: "sales_global", source: "All Sources", owner: "Leadership", type: "Analytics" }, { name: "EXC_Global_Board_Report_US", dashboardId: "finance_pnl", source: "Manual", owner: "Leadership", type: "Analytics" }] },
    sales: { label: "Sales Commercial", projects: [{ name: "SAL_Global_EETC_US", dashboardId: "sales_global", source: "EDGE", owner: "Jeniffer", type: "Analytics" }, { name: "SAL_Global_Booking_Prediction_US", dashboardId: "sales_global", source: "EDGE", owner: "Jeniffer", type: "AI/ML" }] },
    finance: { label: "Finance", projects: [{ name: "FIN_Global_EH_Dashboard_US", dashboardId: "finance_pnl", source: "SAP", owner: "Venu", type: "Analytics" }, { name: "FIN_Global_PFO_Dashboard_US", dashboardId: "finance_pnl", source: "TED", owner: "Venu", type: "Analytics" }] },
    operations: { label: "Operations", projects: [{ name: "OPS_Global_Inventory_Optimizer_US", dashboardId: "hr_attrition", source: "SAP IBP", owner: "TBD", type: "AI/ML" }, { name: "OPS_Global_Route_Tracking_US", dashboardId: "hr_attrition", source: "IoT Sensors", owner: "TBD", type: "Image Analytics" }] },
    marketing: { label: "Marketing", projects: [{ name: "MKT_Global_Customer_LTV_US", dashboardId: "sales_global", source: "Salesforce", owner: "TDB", type: "AI/ML" }, { name: "MKT_Global_Attribution_US", dashboardId: "sales_global", source: "Google Ads", owner: "NA", type: "Analytics" }] },
    marine: { label: "Marine, Oil and Gas", projects: [{ name: "MAR_Global_Rig_Safety_US", dashboardId: "hr_attrition", source: "IoT", owner: "Safety Team", type: "Image Analytics" }, { name: "MAR_Global_Pipeline_Monitoring_US", dashboardId: "hr_attrition", source: "Sensors", owner: "Ops", type: "Analytics" }] },
    hr: { label: "Human Resources", projects: [{ name: "HR_Global_Talent_Attrition_US", dashboardId: "hr_attrition", source: "Workday", owner: "HR Team", type: "AI/ML" }, { name: "HR_Global_Headcount_US", dashboardId: "hr_attrition", source: "Workday", owner: "HR Team", type: "Analytics" }] },
    engineering: { label: "Engineering", projects: [{ name: "ENG_Global_RD_Spend_US", dashboardId: "finance_pnl", source: "SAP", owner: "Eng Leads", type: "Analytics" }, { name: "ENG_Global_Patent_Tracker_US", dashboardId: "finance_pnl", source: "Internal", owner: "Legal", type: "Analytics" }] }
};


const ChatBot = () => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [messages, setMessages] = React.useState([]);
    const [inputValue, setInputValue] = React.useState("");
    const [conversationState, setConversationState] = React.useState({
        mode: null, // 'dashboard', 'documentation', or null
        step: 0,
        data: {}
    });

    const projectOptions = [
        { category: "Finance", items: ["EH Dashboard", "PFO Dashboard"] },
        { category: "Supply Chain", items: ["Inventory Optimizer", "Route Tracking"] },
        { category: "Marketing", items: ["Customer LTV", "Attribution"] },
        { category: "Sales", items: ["EETC", "Booking Prediction"] }
    ];

    const toggleChat = () => {
        if (!isOpen) {
            setIsOpen(true);
            if (messages.length === 0) {
                setTimeout(() => {
                    setMessages([{
                        text: "👋 Hi! I'm your ADM Assistant. I can help you with:\n\n1️⃣ Request Dashboard Access\n2️⃣ General Questions\n\nWhat would you like to do?",
                        sender: "bot"
                    }]);
                }, 500);
            }
        } else {
            setIsOpen(false);
        }
    };

    const handleBotResponse = (userInput) => {
        const input = userInput.toLowerCase().trim();
        let botResponse = "";
        let newState = { ...conversationState };

        // Initial mode selection
        if (!conversationState.mode) {
            if (input.includes('dashboard') || input.includes('1')) {
                newState.mode = 'dashboard';
                newState.step = 1;
                botResponse = "Great! Let's request dashboard access. 📊\n\nFirst, please provide your TE User ID (e.g., TE123456):";
            } else if (input.includes('documentation') || input.includes('document') || input.includes('2')) {
                newState.mode = 'documentation';
                newState.step = 1;
                botResponse = "Perfect! Let's request documentation access. 📄\n\nFirst, please provide your TE User ID (e.g., TE123456):";
            } else if (input.includes('question') || input.includes('help') || input.includes('3')) {
                botResponse = "I'm here to help! You can ask me about:\n\n• How to access dashboards\n• Available projects\n• Data sources\n• Platform features\n\nWhat would you like to know?";
            } else {
                botResponse = "I can help you with:\n\n1️⃣ Request Dashboard Access\n2️⃣ Request Documentation\n3️⃣ General Questions\n\nPlease choose an option (1, 2, or 3).";
            }
        }
        // Dashboard/Documentation request flow
        else if (conversationState.mode === 'dashboard' || conversationState.mode === 'documentation') {
            switch (conversationState.step) {
                case 1: // TE ID received
                    newState.data.teId = userInput;
                    newState.step = 2;
                    botResponse = "Thanks! Now, please provide your location/site (e.g., Schaffhausen, CH):";
                    break;

                case 2: // Location received
                    newState.data.location = userInput;
                    newState.step = 3;
                    botResponse = "Got it! Please provide your corporate email (e.g., first.last@te.com):";
                    break;

                case 3: // Email received
                    newState.data.email = userInput;
                    newState.step = 4;
                    const resourceType = conversationState.mode === 'dashboard' ? 'dashboard' : 'documentation';
                    let optionsList = "";
                    projectOptions.forEach((cat, idx) => {
                        optionsList += `\n\n${cat.category}:\n`;
                        cat.items.forEach((item, itemIdx) => {
                            const num = idx * 10 + itemIdx + 1;
                            optionsList += `  ${num}. ${item}`;
                            if (itemIdx < cat.items.length - 1) optionsList += "\n";
                        });
                    });
                    botResponse = `Perfect! Now, which ${resourceType} do you need access to?${optionsList}\n\nPlease enter the number or name:`;
                    break;

                case 4: // Project selected
                    newState.data.project = userInput;
                    newState.step = 5;
                    botResponse = "Almost done! Please provide a brief reason for this request:";
                    break;

                case 5: // Reason received
                    newState.data.reason = userInput;
                    const resourceName = conversationState.mode === 'dashboard' ? 'Dashboard' : 'Documentation';
                    botResponse = `✅ Request Submitted Successfully!\n\n📋 Summary:\n• TE ID: ${newState.data.teId}\n• Location: ${newState.data.location}\n• Email: ${newState.data.email}\n• ${resourceName}: ${newState.data.project}\n• Reason: ${newState.data.reason}\n\nYour request has been sent to the admin team. You'll receive a confirmation email shortly!\n\nNeed anything else?`;
                    // Reset state
                    newState = { mode: null, step: 0, data: {} };
                    break;
            }
        }
        // General questions
        else {
            if (input.includes('dashboard') && input.includes('access')) {
                botResponse = "To access dashboards, you need to:\n\n1. Submit an access request\n2. Get approval from your manager\n3. Receive credentials via email\n\nWould you like me to help you submit a request now?";
            } else if (input.includes('project')) {
                botResponse = "We have projects across 4 functions:\n\n📊 Finance: EH Dashboard, PFO Dashboard\n📦 Supply Chain: Inventory Optimizer, Route Tracking\n📈 Marketing: Customer LTV, Attribution\n💼 Sales: EETC, Booking Prediction\n\nWant to request access to any of these?";
            } else if (input.includes('data source')) {
                botResponse = "Our platform integrates data from:\n\n• SAP (Finance & Supply Chain)\n• EDGE (Sales data)\n• TED (Financial reporting)\n• SAP IBP (Inventory planning)\n• Salesforce (Customer data)\n• Google Ads (Marketing attribution)\n\nAll data is updated in real-time!";
            } else {
                botResponse = "I'm not sure about that. Try asking about:\n\n• Dashboard access\n• Available projects\n• Data sources\n\nOr type 'menu' to see all options.";
            }
        }

        setConversationState(newState);
        return botResponse;
    };

    const handleSend = () => {
        if (!inputValue.trim()) return;

        const userMessage = { text: inputValue, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInputValue("");

        setTimeout(() => {
            const botResponse = handleBotResponse(inputValue);
            setMessages(prev => [...prev, { text: botResponse, sender: 'bot' }]);
        }, 800);
    };

    return (
        <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-6">
            {isOpen && (
                <div className="w-[22rem] h-[32rem] bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] border border-white/40 flex flex-col overflow-hidden animate-slideUp origin-bottom-right">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-adm to-adm-light p-6 rounded-t-[2rem] shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                        <div className="flex justify-between items-center relative z-10">
                            <div>
                                <h3 className="font-black text-white uppercase tracking-widest text-sm flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]"></div>
                                    ADM Assistant
                                </h3>
                                <p className="text-white/60 text-[10px] uppercase tracking-wider mt-1 font-medium">AI-Powered</p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                            >
                                <Icon path={icons.x} className="w-4 h-4 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-gray-50/50 scrollbar-hide">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.sender === 'bot' ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[85%] p-4 rounded-2xl text-xs font-bold leading-relaxed shadow-sm animate-fadeIn whitespace-pre-line ${msg.sender === 'bot'
                                    ? 'bg-white text-gray-700 rounded-tl-none border border-gray-100'
                                    : 'bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-tr-none shadow-orange-200'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-white/50 backdrop-blur-sm border-t border-white/20">
                        <div className="flex gap-2 bg-white p-1.5 pl-5 rounded-full border border-gray-100 shadow-sm focus-within:border-orange-500/50 focus-within:shadow-orange-100 transition-all">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Type your message..."
                                className="flex-1 text-xs font-semibold text-gray-700 outline-none bg-transparent placeholder:text-gray-400"
                            />
                            <button
                                onClick={handleSend}
                                className="w-9 h-9 bg-adm text-white rounded-full flex items-center justify-center hover:bg-orange-500 transition-colors shadow-md"
                            >
                                <Icon path={icons.chevronRight} className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <button
                onClick={toggleChat}
                className={`group relative w-16 h-16 rounded-full shadow-[0_10px_40px_-10px_rgba(249,115,22,0.6)] flex items-center justify-center text-white transition-all duration-300 hover:scale-110 z-[100] ${isOpen ? 'bg-adm rotate-90' : 'bg-gradient-to-br from-orange-400 to-orange-600'
                    }`}
            >
                {/* Pulse Ring */}
                {!isOpen && <div className="absolute inset-0 rounded-full bg-orange-500 animate-[ping_2s_ease-in-out_infinite] opacity-20"></div>}
                <Icon path={isOpen ? icons.x : icons.message} className="w-7 h-7" />
            </button>
        </div>
    );
};

const HeroSection = () => {
    const [currentNewsIndex, setCurrentNewsIndex] = React.useState(0);
    const [isPaused, setIsPaused] = React.useState(false);
    const [selectedNews, setSelectedNews] = React.useState(null);
    const [showModal, setShowModal] = React.useState(false);

    // Auto-change news every 3.5 seconds
    React.useEffect(() => {
        if (isPaused) return;

        const interval = setInterval(() => {
            setCurrentNewsIndex((prev) => (prev + 1) % NEWS_ITEMS.length);
        }, 3500);

        return () => clearInterval(interval);
    }, [isPaused]);

    const openNewsModal = (news) => {
        setSelectedNews(news);
        setShowModal(true);
    };

    const closeNewsModal = () => {
        setShowModal(false);
        setSelectedNews(null);
    };

    const currentNews = NEWS_ITEMS[currentNewsIndex];

    return (
        <div className="relative w-full mb-32 -mt-6" style={{ aspectRatio: '16/9', maxHeight: '80vh' }}>
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-adm via-adm to-adm-dark rounded-3xl mx-4 shadow-2xl"></div>

            {/* Content Container */}
            <div className="relative h-full flex flex-col p-3 lg:p-5">
                {/* Header */}
                <div className="text-center mb-3">
                    <h1 className="text-xl lg:text-2xl font-black text-white mb-1 tracking-tight" style={{ fontFamily: '"Segoe UI", "Segoe UI Web (West European)"' }}>
                        Analytics Dashboard
                    </h1>
                    <div className="w-14 h-0.5 bg-orange-500 mx-auto"></div>
                </div>

                {/* Cards Grid */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-5 overflow-hidden px-4">

                    {/* Card 1: Latest News - Slideshow Style */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col animate-slideInLeft hover:shadow-xl transition-all duration-300 max-h-[450px]">
                        {/* Transparent Blurred Header */}
                        <div className="bg-white/60 backdrop-blur-md p-2.5 border-b-2 border-orange-500">
                            <h3 className="text-center text-sm font-black text-gray-800" style={{ fontFamily: '"Segoe UI", "Segoe UI Web (West European)"' }}>Latest News</h3>
                        </div>

                        {/* Single News Display - Google News Style */}
                        <div
                            className="flex-1 bg-gray-50 flex flex-col overflow-hidden rounded-b-xl"
                            onMouseEnter={() => setIsPaused(true)}
                            onMouseLeave={() => setIsPaused(false)}
                        >
                            {/* News Card with Background Image */}
                            <div className="relative flex-1 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg overflow-hidden group cursor-pointer">
                                {/* Background Image Placeholder */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Icon path={icons.news} className="w-20 h-20 text-orange-300 opacity-50" />
                                </div>

                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

                                {/* Content Overlay at Bottom */}
                                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                    {/* Source/Publisher */}
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded flex items-center justify-center">
                                            <Icon path={icons.news} className="w-3 h-3 text-white" />
                                        </div>
                                        <span className="text-xs font-semibold">ADM News</span>
                                    </div>

                                    {/* Title */}
                                    <h4 className="text-base font-bold leading-tight mb-2 line-clamp-2">
                                        {currentNews.title}
                                    </h4>

                                    {/* Date and Button */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-xs text-white/80">
                                            <Icon path={icons.calendar} className="w-3 h-3" />
                                            <span>{currentNews.date}</span>
                                        </div>
                                        <button
                                            onClick={() => openNewsModal(currentNews)}
                                            className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded-full text-xs font-bold transition-all transform hover:scale-105"
                                        >
                                            more info
                                        </button>
                                    </div>
                                </div>

                                {/* Progress Indicators - Inside Card */}
                                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center justify-center gap-1">
                                    {NEWS_ITEMS.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`h-1 w-1 rounded-full transition-all duration-300 ${idx === currentNewsIndex
                                                ? 'bg-white w-4'
                                                : 'bg-white/40'
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>

                        </div>

                    </div>

                    {/* Card 2: Projects - Redesigned */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col animate-fadeInUp hover:shadow-xl transition-all duration-300 max-h-[450px]" style={{ animationDelay: '0.15s' }}>
                        {/* Transparent Blurred Header */}
                        <div className="bg-white/60 backdrop-blur-md p-2.5 border-b-2 border-blue-500">
                            <h3 className="text-center text-sm font-black text-gray-800" style={{ fontFamily: '"Segoe UI", "Segoe UI Web (West European)"' }}>Projects</h3>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-3 bg-gradient-to-br from-blue-50 to-white overflow-y-auto">
                            {/* Project Status Overview */}
                            <div className="grid grid-cols-2 gap-2 mb-3">
                                {(() => {
                                    // Calculate total projects from BU_DATA
                                    const totalProjects = Object.values(BU_DATA).reduce((sum, bu) => sum + bu.projects.length, 0);

                                    // For now, showing all projects as "In Progress" - you can modify this logic
                                    // to add status field to each project in BU_DATA
                                    return [
                                        { label: 'Delivered', count: 0, color: 'from-green-400 to-emerald-500', icon: icons.check },
                                        { label: 'In Progress', count: totalProjects, color: 'from-blue-400 to-blue-500', icon: icons.trending },
                                        { label: 'On Hold', count: 0, color: 'from-yellow-400 to-orange-500', icon: icons.pause },
                                        { label: 'Planned', count: 0, color: 'from-purple-400 to-purple-500', icon: icons.calendar }
                                    ].map((status, idx) => (
                                        <div key={idx} className="bg-white rounded-xl p-3 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group border border-gray-100 hover:border-blue-200 hover:-translate-y-1 flex flex-col items-center">
                                            {/* Solid Circle Icon */}
                                            <div className={`w-12 h-12 bg-gradient-to-br ${status.color} rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-lg`}>
                                                <Icon path={status.icon} className="w-5 h-5 text-white" />
                                            </div>

                                            {/* Count */}
                                            <div className="text-2xl font-black text-gray-800 mb-1">{status.count}</div>
                                            <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wide text-center">{status.label}</div>
                                        </div>
                                    ));
                                })()}
                            </div>

                            {/* Total Summary */}
                            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-3 flex items-center justify-between shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                                        <Icon path={icons.briefcase} className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-bold text-white/80 uppercase tracking-wide mb-0.5">Total Projects</div>
                                        <div className="text-3xl font-black text-white">
                                            {Object.values(BU_DATA).reduce((sum, bu) => sum + bu.projects.length, 0)}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-white/60">
                                    <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Value - Redesigned */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col animate-slideInRight hover:shadow-xl transition-all duration-300 max-h-[450px]" style={{ animationDelay: '0.3s' }}>
                        {/* Transparent Blurred Header */}
                        <div className="bg-white/60 backdrop-blur-md p-2.5 border-b-2 border-emerald-500">
                            <h3 className="text-center text-sm font-black text-gray-800" style={{ fontFamily: '"Segoe UI", "Segoe UI Web (West European)"' }}>Value</h3>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-3 bg-gradient-to-br from-gray-50 to-white flex flex-col items-center justify-center">
                            {/* ROI Dashboard Placeholder */}
                            <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl w-full flex-1 flex flex-col items-center justify-center p-6 hover:border-emerald-300 transition-all duration-300">
                                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
                                    <Icon path={icons.trending} className="w-8 h-8 text-white" />
                                </div>
                                <div className="text-center">
                                    <div className="text-base font-black text-gray-800 mb-1">ROI Dashboard</div>
                                    <div className="text-xs text-gray-500 mb-3">Track business impact and value</div>
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                        Coming Soon
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* News Detail Modal */}
            {showModal && selectedNews && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={closeNewsModal}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 flex items-center justify-between sticky top-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/25 backdrop-blur-sm rounded-lg flex items-center justify-center">
                                    <Icon path={icons.news} className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white" style={{ fontFamily: '"Segoe UI", "Segoe UI Web (West European)"' }}>News Details</h3>
                                    <p className="text-xs text-white/80">Full Information</p>
                                </div>
                            </div>
                            <button
                                onClick={closeNewsModal}
                                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                            >
                                <Icon path={icons.x} className="w-5 h-5 text-white" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
                            <div className="mb-4">
                                <h2 className="text-xl font-black text-gray-900 mb-2" style={{ fontFamily: '"Segoe UI", "Segoe UI Web (West European)"' }}>
                                    {selectedNews.title}
                                </h2>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Icon path={icons.calendar} className="w-4 h-4" />
                                    <span>{selectedNews.date}</span>
                                </div>
                            </div>

                            <div className="prose prose-sm max-w-none">
                                <p className="text-gray-700 leading-relaxed">
                                    {selectedNews.description || 'This is a detailed description of the news article. In a real application, this would contain the full content of the news item, including all relevant details, context, and information that users need to know about this update.'}
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={closeNewsModal}
                                    className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const BUSector = ({ setCurrentView, currentUser, setNotification }) => {
    const [selectedBU, setSelectedBU] = React.useState(null);
    const [expandedProj, setExpandedProj] = React.useState(null);
    const [searchQuery, setSearchQuery] = React.useState("");
    const containerRef = React.useRef(null);

    React.useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setSelectedBU(null);
                setExpandedProj(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleProject = (idx) => {
        setExpandedProj(expandedProj === idx ? null : idx);
    };

    const handleBUClick = (key) => {
        setSelectedBU(key);
        setExpandedProj(null);
        setSearchQuery(""); // Reset search
    };

    const handleOpenDashboard = async (project) => {
        setNotification({ type: 'info', message: 'Validating access permissions...' });
        try {
            // Real API call to Python Backend
            const response = await fetch(`/api/validate-access`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': 'my-secret-key' // As defined in backend_service.py
                },
                body: JSON.stringify({
                    user_id: currentUser.userId,
                    dashboard_id: project.dashboardId || 'unknown_dashboard'
                })
            });

            const data = await response.json();

            if (response.ok && data.status === 'ALLOW') {
                setNotification({ type: 'success', message: 'Access Granted. Loading Dashboard...' });
                // In a real app, you might redirect: window.location.href = data.redirect_url;
                setTimeout(() => alert(`Redirecting to: ${data.redirect_url}`), 500);
            } else {
                console.log("Access Denied:", data);
                setNotification({ type: 'error', message: data.message || 'Access Denied' });

                // If denied, maybe prompt to request access
                if (data.request_access_url) {
                    setTimeout(() => {
                        // Switch to IAM view and pre-fill if possible (would need state passing)
                        setCurrentView('iam');
                    }, 1500);
                }
            }

        } catch (error) {
            console.error("Access Validation Error", error);
            setNotification({ type: 'error', message: 'Could not connect to access server.' });
        }
    };

    // Filter projects logic
    const filteredProjects = selectedBU ? BU_DATA[selectedBU].projects.filter(proj => {
        const query = searchQuery.toLowerCase();
        return (
            proj.name.toLowerCase().includes(query) ||
            proj.source.toLowerCase().includes(query) ||
            proj.owner.toLowerCase().includes(query)
        );
    }) : [];

    return (
        <section id="discovery" className="pt-2 pb-24 bg-gray-50 scroll-mt-20">
            <div ref={containerRef} className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-black text-adm uppercase tracking-widest">Solve by Function</h2>
                    <div className="w-16 h-1 bg-orange-500 mx-auto mt-4 mb-4"></div>
                </div>

                {/* Modern Tabs */}
                {/* Premium Project Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12 max-w-7xl mx-auto">
                    {Object.entries(BU_DATA).map(([key, bu]) => (
                        <button
                            key={key}
                            onClick={() => handleBUClick(key)}
                            className={`group relative h-24 rounded-[1.5rem] border transition-all duration-500 flex flex-col items-center justify-center gap-2 overflow-hidden ${selectedBU === key
                                ? 'bg-adm border-orange-500 shadow-[0_20px_50px_-12px_rgba(23,37,84,0.5)] scale-105 z-10'
                                : 'bg-white border-gray-100 hover:border-orange-300 hover:shadow-xl hover:-translate-y-1'
                                }`}
                        >
                            {/* Decorative Background for Active */}
                            {selectedBU === key && (
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.15),transparent_60%)]"></div>
                            )}

                            {/* Label */}
                            <span className={`text-xs md:text-sm font-black uppercase tracking-[0.2em] z-10 transition-colors duration-300 ${selectedBU === key ? 'text-white' : 'text-gray-400 group-hover:text-adm'}`}>
                                {bu.label}
                            </span>

                            {/* Indicator Line */}
                            <div className={`h-1 rounded-full transition-all duration-500 z-10 ${selectedBU === key ? 'w-8 bg-orange-500' : 'w-2 bg-gray-200 group-hover:w-6 group-hover:bg-orange-300'
                                }`}></div>
                        </button>
                    ))}
                </div>

                {selectedBU && (
                    <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 max-w-4xl mx-auto animate-fadeIn border border-gray-100 relative z-40">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-10 border-b border-gray-100 pb-6 gap-6">
                            <h3 className="text-3xl font-black text-adm uppercase tracking-tight text-center md:text-left">{BU_DATA[selectedBU].label} Projects</h3>

                            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                                {/* Search Input */}
                                <div className="relative w-full md:w-64 group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Icon path={icons.search} className="w-4 h-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search projects..."
                                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
                                    />
                                </div>
                            </div>

                            <button onClick={() => { setSelectedBU(null); setExpandedProj(null); }} className="absolute top-8 right-8 text-gray-300 hover:text-orange-500 font-bold transition-colors md:relative md:top-auto md:right-auto">
                                <Icon path={icons.x} className="w-6 h-6" />
                            </button>
                        </div>

                        {filteredProjects.length > 0 ? (
                            <ul className="space-y-6">
                                {filteredProjects.map((proj, idx) => (
                                    <li key={idx} className={`rounded-2xl border transition-all duration-500 overflow-hidden ${expandedProj === idx ? 'bg-gray-50 border-orange-500/30 ring-4 ring-orange-500/5' : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-lg'}`}>
                                        <div
                                            className="flex items-center justify-between p-6 cursor-pointer"
                                            onClick={() => toggleProject(idx)}
                                        >
                                            <span
                                                className={`font-black uppercase tracking-tight transition-colors ${expandedProj === idx ? 'text-orange-500' : 'text-adm'}`}
                                                title={`TE_TS_ADM_${proj.name}`}
                                            >
                                                {proj.name}
                                            </span>
                                            <div className="flex items-center gap-4">
                                                <span className={`text-orange-500 font-black transform transition-transform duration-300 ${expandedProj === idx ? 'rotate-180' : ''}`}>▼</span>
                                            </div>
                                        </div>

                                        {expandedProj === idx && (
                                            <div className="px-6 pb-8 pt-2 animate-fadeIn">
                                                {/* Details Grid */}
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                                                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                                        <p className="text-[9px] font-black text-gray-400 uppercase mb-2 tracking-widest">Data Source</p>
                                                        <p className="text-sm font-bold text-adm">{proj.source}</p>
                                                    </div>
                                                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                                        <p className="text-[9px] font-black text-gray-400 uppercase mb-2 tracking-widest">Owner</p>
                                                        <p className="text-sm font-bold text-adm">{proj.owner}</p>
                                                    </div>
                                                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hidden md:block">
                                                        <p className="text-[9px] font-black text-gray-400 uppercase mb-2 tracking-widest">Status</p>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                            <span className="text-sm font-bold text-adm">Active</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex justify-end">
                                                    <button
                                                        onClick={() => handleOpenDashboard(proj)}
                                                        className="flex items-center gap-2 px-6 py-3 bg-adm text-white rounded-xl hover:bg-orange-500 transition-colors group shadow-lg shadow-adm/20 hover:shadow-orange-500/20"
                                                    >
                                                        <span className="text-xs font-black uppercase tracking-widest">Open Dashboard</span>
                                                        <Icon path={icons.chevronRight} className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Icon path={icons.search} className="w-8 h-8 text-gray-300" />
                                </div>
                                <h3 className="text-lg font-black text-gray-900 mb-2">No projects found</h3>
                                <p className="text-sm text-gray-500">Try adjusting your search terms</p>
                            </div>
                        )}
                    </div>
                )}
            </div >
        </section >
    );
};

const IAMRequestPage = ({ setCurrentView, currentUser, setNotification }) => {
    const [formData, setFormData] = React.useState({
        userId: currentUser?.userId || '',
        email: currentUser?.email || '',
        project: '',
        resourceType: 'Dashboard Access', // Default
        justification: '',
        location: currentUser?.location || ''
    });

    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/iam/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: formData.userId,
                    resource_type: formData.resourceType,
                    project_name: formData.project,
                    justification: formData.justification
                })
            });

            const data = await response.json();

            if (response.ok) {
                setNotification({ type: 'success', message: `Request submitted! ID: ${data.request_id}` });
                // Reset form or redirect
                setTimeout(() => setCurrentView('home'), 2000);
            } else {
                setNotification({ type: 'error', message: data.error || 'Failed to submit request' });
            }
        } catch (error) {
            console.error('IAM Request Error:', error);
            setNotification({ type: 'error', message: 'Network error. Ensure backend is running.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="min-h-screen pt-20 pb-20 bg-gray-50 flex items-center justify-center relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-adm to-transparent pointer-events-none"></div>

            {/* Back Button */}
            <button
                onClick={() => setCurrentView('home')}
                className="fixed top-8 left-8 z-50 flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-full hover:bg-gray-700 transition-all shadow-lg border border-gray-700"
            >
                <Icon path={icons.chevronLeft} className="w-4 h-4" />
                <span className="font-black text-xs uppercase tracking-widest">Back to Home</span>
            </button>

            <div className="max-w-4xl w-full mx-6 relative z-10">
                <div className="text-center mb-12">
                    <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">IAM Access Request</h2>
                    <p className="text-white/60 text-lg tracking-widest uppercase font-medium">Secure Access Management</p>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border border-gray-100 animate-slideUp">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Section 1: User Details */}
                        <div className="space-y-6">
                            <h3 className="flex items-center gap-3 text-xl font-black text-adm uppercase tracking-widest border-b border-gray-100 pb-4">
                                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white"><Icon path={icons.user} className="w-4 h-4" /></div>
                                User Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">User ID</label>
                                    <div className="flex items-center gap-3 px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl">
                                        <Icon path={icons.user} className="w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            name="userId"
                                            value={formData.userId}
                                            readOnly
                                            className="bg-transparent border-none focus:ring-0 text-gray-600 font-bold w-full cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                                    <div className="flex items-center gap-3 px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl">
                                        <Icon path={icons.mail} className="w-5 h-5 text-gray-400" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            readOnly
                                            className="bg-transparent border-none focus:ring-0 text-gray-600 font-bold w-full cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Location / Site</label>
                                    <div className="flex items-center gap-3 px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl">
                                        <Icon path={icons.users} className="w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            name="location"
                                            value={formData.location}
                                            readOnly
                                            className="bg-transparent border-none focus:ring-0 text-gray-600 font-bold w-full cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Request Details */}
                        <div className="space-y-6">
                            <h3 className="flex items-center gap-3 text-xl font-black text-adm uppercase tracking-widest border-b border-gray-100 pb-4">
                                <div className="w-8 h-8 rounded-full bg-adm flex items-center justify-center text-white"><Icon path={icons.ticket} className="w-4 h-4" /></div>
                                Access Requirements
                            </h3>
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Resource Type</label>
                                    <div className="relative">
                                        <select
                                            name="resourceType"
                                            value={formData.resourceType}
                                            onChange={handleChange}
                                            className="w-full appearance-none px-5 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-bold text-gray-800"
                                        >
                                            <option>Dashboard Access</option>
                                            <option>Data Extract</option>
                                            <option>Documentation</option>
                                        </select>
                                        <Icon path={icons.chevronRight} className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Target Project / Dashboard</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            name="project"
                                            value={formData.project}
                                            onChange={handleChange}
                                            required
                                            placeholder="e.g. Sales Analytics, Finance Overview..."
                                            className="w-full px-5 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-bold text-gray-800 placeholder-gray-300 group-hover:border-orange-300"
                                        />
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center pointer-events-none">
                                            <Icon path={icons.barChart} className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Business Justification</label>
                                    <textarea
                                        name="justification"
                                        value={formData.justification}
                                        onChange={handleChange}
                                        required
                                        rows="4"
                                        placeholder="Please explain why you need access to this resource..."
                                        className="w-full px-5 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium text-gray-700 placeholder-gray-300 resize-none"
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Submit Action */}
                        <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => setCurrentView('home')}
                                className="px-8 py-4 rounded-xl font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all text-xs"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`bg-gradient-to-r from-orange-500 to-orange-600 text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest shadow-lg hover:shadow-orange-500/30 hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 ${isSubmitting ? 'opacity-70 cursor-wait' : ''}`}
                            >
                                {isSubmitting ? 'Sending...' : 'Submit Request'}
                                {!isSubmitting && <Icon path={icons.chevronRight} className="w-4 h-4" />}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
};

const GuidelinesPage = ({ setCurrentView }) => {
    return (
        <section className="min-h-screen pt-20 pb-20 bg-gray-50 flex items-center justify-center relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-adm to-transparent pointer-events-none"></div>

            {/* Back Button */}
            <button
                onClick={() => setCurrentView('home')}
                className="fixed top-8 left-8 z-50 flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-full hover:bg-gray-700 transition-all shadow-lg border border-gray-700"
            >
                <Icon path={icons.chevronLeft} className="w-4 h-4" />
                <span className="font-black text-xs uppercase tracking-widest">Back to Home</span>
            </button>

            <div className="max-w-4xl w-full mx-6 relative z-10">
                <div className="text-center mb-12">
                    <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">Platform Guidelines</h2>
                    <p className="text-white/60 text-lg tracking-widest uppercase font-medium">Complete Guide to ADM Analytics</p>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border border-gray-100 animate-slideUp space-y-10">

                    {/* Section 1: Platform Overview */}
                    <div className="space-y-6">
                        <h3 className="flex items-center gap-3 text-xl font-black text-adm uppercase tracking-widest border-b border-gray-100 pb-4">
                            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white"><Icon path={icons.barChart} className="w-4 h-4" /></div>
                            Platform Overview
                        </h3>
                        <p className="text-gray-700 font-medium leading-relaxed">
                            The ADM Analytics platform provides real-time dashboards and data insights across all business functions. Our platform integrates data from SAP, EDGE, TED, and other enterprise systems to deliver actionable intelligence.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <p className="text-[9px] font-black text-gray-400 uppercase mb-2 tracking-widest">Data Sources</p>
                                <p className="text-sm font-bold text-adm">SAP, EDGE, TED</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <p className="text-[9px] font-black text-gray-400 uppercase mb-2 tracking-widest">Update Frequency</p>
                                <p className="text-sm font-bold text-adm">Real-time</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <p className="text-[9px] font-black text-gray-400 uppercase mb-2 tracking-widest">Access Control</p>
                                <p className="text-sm font-bold text-adm">Role-based</p>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Accessing Dashboards */}
                    <div className="space-y-6">
                        <h3 className="flex items-center gap-3 text-xl font-black text-adm uppercase tracking-widest border-b border-gray-100 pb-4">
                            <div className="w-8 h-8 rounded-full bg-adm flex items-center justify-center text-white"><Icon path={icons.activity} className="w-4 h-4" /></div>
                            How to Access Dashboards
                        </h3>
                        <div className="space-y-4">
                            <div className="bg-gradient-to-r from-orange-50 to-orange-50/50 p-6 rounded-xl border-l-4 border-orange-500">
                                <p className="text-xs font-black text-orange-600 uppercase tracking-widest mb-2">Step 1: Request Access</p>
                                <p className="font-bold text-adm mb-2">Submit IAM Request</p>
                                <p className="text-sm text-gray-600 font-medium">Click "IAM Access" in the footer and fill out the access request form with your TE User ID, location, and business justification.</p>
                            </div>
                            <div className="bg-gradient-to-r from-adm/5 to-adm/10 p-6 rounded-xl border-l-4 border-adm">
                                <p className="text-xs font-black text-adm uppercase tracking-widest mb-2">Step 2: Approval Process</p>
                                <p className="font-bold text-adm mb-2">Wait for Approval</p>
                                <p className="text-sm text-gray-600 font-medium">Your request will be reviewed by the ADM team. Approval typically takes 1-2 business days.</p>
                            </div>
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl border-l-4 border-gray-300">
                                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Step 3: Access Dashboard</p>
                                <p className="font-bold text-adm mb-2">Navigate to Your Dashboard</p>
                                <p className="text-sm text-gray-600 font-medium">Once approved, find your dashboard in the "Projects by Functions" section on the homepage.</p>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Accessing Data */}
                    <div className="space-y-6">
                        <h3 className="flex items-center gap-3 text-xl font-black text-adm uppercase tracking-widest border-b border-gray-100 pb-4">
                            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white"><Icon path={icons.database} className="w-4 h-4" /></div>
                            How to Access Data
                        </h3>
                        <ul className="space-y-3">
                            {[
                                { title: "Raise Request", desc: "Submit an IAM request for data access through the footer link" },
                                { title: "Wait for Approval", desc: "Your request will be reviewed by the ADM team (typically 1-2 business days)" },
                                { title: "Data Sent via Email", desc: "Once approved, the requested data will be sent directly to your email" },
                                { title: "Provide Details in Request", desc: "Include all necessary details about the data you need when submitting your request" }
                            ].map((item, idx) => (
                                <li key={idx} className="flex gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-orange-500/30 transition-all">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 shrink-0"></div>
                                    <div>
                                        <p className="font-black text-adm text-sm uppercase tracking-tight">{item.title}</p>
                                        <p className="text-gray-600 text-xs font-medium mt-1">{item.desc}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Section 4: Documentation & Resources */}
                    <div className="space-y-6">
                        <h3 className="flex items-center gap-3 text-xl font-black text-adm uppercase tracking-widest border-b border-gray-100 pb-4">
                            <div className="w-8 h-8 rounded-full bg-adm flex items-center justify-center text-white"><Icon path={icons.fileText} className="w-4 h-4" /></div>
                            Documentation & Resources
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { label: "Dashboard Explanations", icon: icons.fileText, desc: "Comprehensive explanations of each dashboard and its features" },
                                { label: "Developer Information", icon: icons.user, desc: "Details about who developed the dashboard and when" },
                                { label: "Data Storage Details", icon: icons.database, desc: "Information about where data is stored and how it's accessed" },
                                { label: "Feature Documentation", icon: icons.lightbulb, desc: "Complete list of features and capabilities available in each dashboard" }
                            ].map((resource, idx) => (
                                <div key={idx} className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-orange-500 hover:bg-orange-50 transition-all group">
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-orange-500 transition-colors shrink-0">
                                        <Icon path={resource.icon} className="w-5 h-5 text-adm group-hover:text-white transition-colors" />
                                    </div>
                                    <div>
                                        <p className="font-black text-sm uppercase tracking-wider text-adm group-hover:text-orange-500">{resource.label}</p>
                                        <p className="text-xs text-gray-600 mt-1">{resource.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 5: Support */}
                    <div className="space-y-6">
                        <h3 className="flex items-center gap-3 text-xl font-black text-adm uppercase tracking-widest border-b border-gray-100 pb-4">
                            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white"><Icon path={icons.mail} className="w-4 h-4" /></div>
                            Get Support
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <a href="mailto:support@adm-analytics.com" className="flex flex-col items-center gap-3 p-6 rounded-xl border border-gray-100 hover:border-orange-500 hover:bg-orange-50 transition-all group text-center">
                                <Icon path={icons.mail} className="w-8 h-8 text-orange-500 group-hover:scale-110 transition-transform" />
                                <div>
                                    <p className="font-black text-xs uppercase tracking-widest text-adm">Email Support</p>
                                    <p className="text-[10px] text-gray-600 mt-1">support@adm-analytics.com</p>
                                </div>
                            </a>
                            <button onClick={() => setCurrentView('iam')} className="flex flex-col items-center gap-3 p-6 rounded-xl border border-gray-100 hover:border-orange-500 hover:bg-orange-50 transition-all group text-center cursor-pointer">
                                <Icon path={icons.ticket} className="w-8 h-8 text-orange-500 group-hover:scale-110 transition-transform" />
                                <div>
                                    <p className="font-black text-xs uppercase tracking-widest text-adm">Create Ticket</p>
                                    <p className="text-[10px] text-gray-600 mt-1">Submit a support ticket</p>
                                </div>
                            </button>
                            <button onClick={() => { const chatButton = document.querySelector('[class*="chatbot"]'); if (chatButton) chatButton.click(); }} className="flex flex-col items-center gap-3 p-6 rounded-xl border border-gray-100 hover:border-orange-500 hover:bg-orange-50 transition-all group text-center cursor-pointer">
                                <Icon path={icons.message} className="w-8 h-8 text-orange-500 group-hover:scale-110 transition-transform" />
                                <div>
                                    <p className="font-black text-xs uppercase tracking-widest text-adm">Live Chat</p>
                                    <p className="text-[10px] text-gray-600 mt-1">Open the chatbot</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-center gap-4">
                        <button
                            onClick={() => setCurrentView('iam')}
                            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-full font-black uppercase tracking-widest shadow-lg hover:shadow-orange-500/30 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3"
                        >
                            Request Access <Icon path={icons.chevronRight} className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setCurrentView('home')}
                            className="bg-gray-100 text-adm px-8 py-4 rounded-full font-black uppercase tracking-widest hover:bg-gray-200 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3"
                        >
                            Back to Home
                        </button>
                    </div>

                </div>
            </div>
        </section>
    );
};


const SubmitRequestModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        alert("Request Submitted! We will get back to you shortly.");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-white/80 backdrop-blur-md transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className={`bg-white rounded-[1.5rem] w-full max-w-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] relative flex flex-col transform transition-all duration-300 ease-out border border-gray-100 ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4 pointer-events-none'}`}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Submit Request</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-400 hover:text-gray-900"
                    >
                        <Icon path={icons.x} className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Subject</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-medium text-gray-900 placeholder-gray-400"
                                placeholder="Brief summary of your request"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Description</label>
                            <textarea
                                required
                                rows="4"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-medium text-gray-900 placeholder-gray-400 resize-none"
                                placeholder="Describe your request or issue..."
                            ></textarea>
                        </div>
                        <div className="pt-2 flex justify-end">
                            <button
                                type="submit"
                                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-wider text-sm transition-all hover:shadow-lg hover:-translate-y-0.5"
                            >
                                Submit Request
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};


const TeamOrgChart = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    // Recursive Tree Renderer
    // Recursive Tree Renderer
    const renderTree = (node, level = 0) => (
        <div className="flex flex-col items-center">
            <div className="relative mb-8 z-10">
                <div className={`bg-white p-4 rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] border border-gray-100 w-64 flex items-center gap-4 transition-all hover:border-orange-300 hover:shadow-xl hover:-translate-y-1 relative group cursor-default ${level === 0 ? 'border-orange-500 ring-4 ring-orange-500/10' : ''}`}>
                    {/* Role Badge */}
                    <div className={`absolute -top-3 right-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${level === 0 ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors'}`}>
                        {node.role}
                    </div>

                    <div className="w-14 h-14 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden border-2 border-white shadow-md">
                        <img src={node.image} alt={node.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h4 className="font-black text-gray-900 text-base leading-tight mb-1">{node.name}</h4>
                        <p className="text-xs text-gray-500 font-bold">{node.title}</p>
                    </div>
                </div>
                {/* Vertical Connector to Children */}
                {node.children && node.children.length > 0 && (
                    <div className="absolute top-full left-1/2 w-0.5 h-8 bg-gray-200 -translate-x-1/2"></div>
                )}
            </div>

            {/* Children Container */}
            {node.children && node.children.length > 0 && (
                <div className="flex gap-8 relative pt-4">
                    {/* Horizontal Connector Line */}
                    {node.children.length > 1 && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[calc(100%-16rem)] h-0.5 bg-gray-200"></div>
                    )}

                    {/* Render Children */}
                    {node.children.map((child, idx) => (
                        <div key={idx} className="flex flex-col items-center relative">
                            {/* Vertical Connector from Parent Line */}
                            {node.children.length > 1 && (
                                <div className="absolute -top-4 left-1/2 w-0.5 h-4 bg-gray-200 -translate-x-1/2"></div>
                            )}
                            {renderTree(child, level + 1)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const teamData = {
        name: "Sarah Jenkins",
        title: "Director, ADM Analytics",
        role: "Leadership",
        image: "https://i.pravatar.cc/150?u=sarah",
        children: [
            {
                name: "Mike Chen",
                title: "Data Engineering Lead",
                role: "Engineering",
                image: "https://i.pravatar.cc/150?u=mike",
                children: [
                    { name: "David Kim", title: "Senior Data Engineer", role: "Member", image: "https://i.pravatar.cc/150?u=david" },
                    { name: "Elena Rodriguez", title: "Data Engineer", role: "Member", image: "https://i.pravatar.cc/150?u=elena" }
                ]
            },
            {
                name: "Jessica Wong",
                title: "Data Science Lead",
                role: "Data Science",
                image: "https://i.pravatar.cc/150?u=jessica",
                children: [
                    { name: "Tom Baker", title: "Data Scientist", role: "Member", image: "https://i.pravatar.cc/150?u=tom" },
                    { name: "Aisha Patel", title: "ML Engineer", role: "Member", image: "https://i.pravatar.cc/150?u=aisha" }
                ]
            }
        ]
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            ></div>

            {/* Centered Modal Popup */}
            <div className={`bg-white rounded-[2rem] w-full max-w-5xl max-h-[85vh] shadow-2xl relative flex flex-col transform transition-all duration-300 ease-out border border-white/20 ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4 pointer-events-none'}`}>
                {/* Minimal Header */}
                <div className="flex items-center justify-between p-8 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center shadow-sm">
                            <Icon path={icons.users} className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 leading-none">Team Structure</h2>
                            <p className="text-xs text-gray-500 mt-1.5 font-bold uppercase tracking-widest">Organization Chart</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-400 hover:text-gray-900"
                    >
                        <Icon path={icons.x} className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto bg-gray-50/50 p-12 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
                    <div className="min-w-max flex justify-center pb-20">
                        {renderTree(teamData)}
                    </div>
                </div>
            </div>
        </div>
    );
};


const App = () => {
    const [isScrolled, setIsScrolled] = React.useState(false);
    const [showTeamModal, setShowTeamModal] = React.useState(false);
    const [showSubmitRequestModal, setShowSubmitRequestModal] = React.useState(false);
    const [isConnectOpen, setIsConnectOpen] = React.useState(false);
    const [isCapabilitiesOpen, setIsCapabilitiesOpen] = React.useState(false);
    const [currentView, setCurrentView] = React.useState('home'); // 'home' | 'iam' | 'docs'
    const [activeNav, setActiveNav] = React.useState('VALUE/ROI'); // Track active navigation

    // MOCK USER STATE - Simulating a logged-in user
    const [currentUser, setCurrentUser] = React.useState({
        userId: "TE123456",
        name: "User Name",
        email: "user.name@te.com",
        location: "Schaffhausen, CH",
        roles: ["public"]
    });

    // Notification State
    const [notification, setNotification] = React.useState(null); // { type: 'success'|'error', message: '' }

    const connectRef = React.useRef(null);

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Auto-dismiss notification
    React.useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    React.useEffect(() => {
        const handleClickOutside = (e) => { if (connectRef.current && !connectRef.current.contains(e.target)) setIsConnectOpen(false); };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Scroll to top when view changes
    React.useEffect(() => {
        window.scrollTo(0, 0);
    }, [currentView]);

    return (
        <div className="min-h-screen">
            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-24 right-8 z-[200] px-6 py-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-slideInRight ${notification.type === 'success'
                    ? 'bg-white border-green-500 text-green-700'
                    : 'bg-white border-red-500 text-red-700'
                    }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${notification.type === 'success' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                        <Icon path={notification.type === 'success' ? icons.check : icons.x} className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-bold text-sm uppercase tracking-wide">{notification.type}</p>
                        <p className="text-xs font-medium text-gray-600">{notification.message}</p>
                    </div>
                    <button onClick={() => setNotification(null)} className="ml-4 text-gray-400 hover:text-gray-600">
                        <Icon path={icons.x} className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Dynamic Header - Hidden on IAM and Docs pages */}
            {currentView === 'home' && (
                <nav className={`fixed z-50 flex items-center justify-between transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) left-1/2 -translate-x-1/2
                    ${isScrolled
                        ? 'top-1 w-[95%] max-w-[1600px] h-20 rounded-full bg-adm/70 backdrop-blur-[40px] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] border border-white/20 px-20'
                        : 'top-0 w-full h-20 bg-adm border-b border-adm-light px-8'
                    }`}>


                    {/* Logo Section */}
                    <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('home'); }} className="flex items-center gap-4 group shrink-0 -ml-6">
                        <div className={`transition-all duration-500 ${isScrolled ? 'w-12 h-12' : 'w-16 h-16'}`}>
                            <img src="https://www.te.com/_TEincludes/ver/1691/v2/images/te-connectivity-logo.svg" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <span className={`font-black tracking-tighter uppercase transition-colors group-hover:text-orange-500 ${isScrolled ? 'text-2xl text-white' : 'text-3xl text-white'}`}>
                            ADM <span className="text-orange-500 font-light tracking-widest group-hover:text-white transition-colors">ANALYTICS</span>
                        </span>
                    </a>

                    {/* Center Navigation */}
                    <div className={`flex items-center gap-2 transition-all duration-500 ${isScrolled ? 'bg-white/5 p-1.5 rounded-full border border-white/5 backdrop-blur-md' : ''}`}>
                        {/* Navigation Links */}
                        <div className="relative">
                            <button
                                onClick={() => setIsCapabilitiesOpen(!isCapabilitiesOpen)}
                                className={`px-8 py-3 rounded-full text-[14px] font-bold uppercase tracking-[0.15em] transition-all duration-300 flex items-center gap-2 ${activeNav === 'CAPABILITIES' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
                                style={{ fontFamily: '"Segoe UI", "Segoe UI Web (West European)", "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif' }}
                            >
                                CAPABILITIES <span className={`transition-transform duration-300 text-orange-500 ${isCapabilitiesOpen ? 'rotate-180' : ''}`}>▼</span>
                            </button>
                            {isCapabilitiesOpen && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-64 bg-gray-800 rounded-2xl shadow-2xl py-2 border border-gray-700 overflow-hidden z-[60] animate-fadeIn">
                                    <a href="#" className="flex items-center gap-4 px-6 py-4 hover:bg-gray-700 border-b border-gray-700 group">
                                        <span className="font-bold text-xs uppercase tracking-widest text-gray-200 group-hover:text-orange-500 transition-colors">Analytics</span>
                                    </a>
                                    <a href="#" className="flex items-center gap-4 px-6 py-4 hover:bg-gray-700 border-b border-gray-700 group">
                                        <span className="font-bold text-xs uppercase tracking-widest text-gray-200 group-hover:text-orange-500 transition-colors">AI/ML</span>
                                    </a>
                                    <a href="#" className="flex items-center gap-4 px-6 py-4 hover:bg-gray-700 group">
                                        <span className="font-bold text-xs uppercase tracking-widest text-gray-200 group-hover:text-orange-500 transition-colors">Image Analytics</span>
                                    </a>
                                </div>
                            )}
                        </div>

                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                setShowTeamModal(true);
                                setActiveNav('TEAM');
                            }}
                            className={`px-8 py-3 rounded-full text-[14px] font-bold uppercase tracking-[0.15em] transition-all duration-300 ${activeNav === 'TEAM' ? 'bg-orange-500 text-white shadow-lg transform hover:scale-105' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
                            style={{ fontFamily: '"Segoe UI", "Segoe UI Web (West European)", "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif' }}
                        >
                            TEAM
                        </a>

                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                setCurrentView('home');
                                setActiveNav('VALUE/ROI');
                                window.scrollTo({ top: 0, behavior: 'auto' });
                            }}
                            className={`px-8 py-3 rounded-full text-[14px] font-bold uppercase tracking-[0.15em] transition-all duration-300 ${activeNav === 'VALUE/ROI' ? 'bg-orange-500 text-white shadow-lg transform hover:scale-105' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
                            style={{ fontFamily: '"Segoe UI", "Segoe UI Web (West European)", "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif' }}
                        >
                            VALUE/ROI
                        </a>

                        {/* Connect Dropdown */}
                        <div className="relative" ref={connectRef}>
                            <button
                                onClick={() => setIsConnectOpen(!isConnectOpen)}
                                className={`px-8 py-3 rounded-full text-[14px] font-bold uppercase tracking-[0.15em] transition-all duration-300 flex items-center gap-2 ${activeNav === 'CONNECT' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
                                style={{ fontFamily: '"Segoe UI", "Segoe UI Web (West European)", "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif' }}
                            >
                                CONNECT <span className={`transition-transform duration-300 text-orange-500 ${isConnectOpen ? 'rotate-180' : ''}`}>▼</span>
                            </button>
                            {isConnectOpen && (
                                <div className="absolute top-full right-0 mt-4 w-72 bg-gray-800 rounded-2xl shadow-2xl py-2 border border-gray-700 overflow-hidden z-[60] animate-fadeIn">
                                    <a href="#" onClick={(e) => { e.preventDefault(); setShowSubmitRequestModal(true); setIsConnectOpen(false); }} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-700 border-b border-gray-700 group"><Icon path={icons.ticket} className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" /><span className="font-bold text-xs uppercase tracking-widest text-gray-200">Submit Request</span></a>
                                    <a href="mailto:admanalytics@te.com" className="flex items-center gap-4 px-6 py-4 hover:bg-gray-700 group"><Icon path={icons.mail} className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" /><span className="font-bold text-xs uppercase tracking-widest text-gray-200">Email Us</span></a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Section - User Profile Only (No Search/System) */}
                    <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right hidden xl:block animate-fadeIn">
                            <div className="text-orange-400 text-xs font-black uppercase tracking-[0.2em] mb-0.5">Welcome</div>
                            <div className="text-white text-xl font-black leading-none uppercase tracking-widest">{currentUser.name.split(' ')[0]}</div>
                        </div>
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white/20 group cursor-pointer hover:scale-110 transition-transform" title={`ID: ${currentUser.userId}`}>
                            <Icon path={icons.user} className="w-6 h-6" />
                        </div>
                    </div>
                </nav>
            )}

            {/* View Rendering */}
            {currentView === 'home' ? (
                <>
                    {/* Spacer for fixed header overlap in Home view */}
                    <div className="h-32"></div>
                    <HeroSection />

                    <BUSector
                        setCurrentView={setCurrentView}
                        currentUser={currentUser}
                        setNotification={setNotification}
                    />
                    <section id="capabilities" className="py-24 bg-white">
                        <div className="max-w-7xl mx-auto px-6 text-center mb-16">
                            <h2 className="text-3xl font-black text-adm uppercase tracking-widest">Strategic Pillars</h2>
                            <div className="w-16 h-1 bg-orange-500 mx-auto mt-4"></div>
                        </div>
                        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                { title: "Forecasting", icon: icons.trending, desc: "Predictive ML models for high-accuracy demand planning." },
                                { title: "Architecture", icon: icons.database, desc: "Modern data fabric for seamless information flow." },
                                { title: "Automation", icon: icons.cpu, desc: "Intelligent agents streamlining internal ops." },
                                { title: "Insights", icon: icons.barChart, desc: "Executive dashboards with live KPI tracking." }
                            ].map((cap, i) => (
                                <div key={i} className="group relative bg-white rounded-[2.5rem] p-8 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-gray-100 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(249,115,22,0.15)] hover:border-orange-500/30 overflow-hidden cursor-default">
                                    {/* Hover Gradient Background */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                    {/* Icon Container */}
                                    <div className="relative w-16 h-16 rounded-2xl bg-gray-50 text-adm flex items-center justify-center mb-8 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500 shadow-sm group-hover:scale-110 group-hover:rotate-3">
                                        <Icon path={cap.icon} className="w-8 h-8" />
                                    </div>

                                    <h3 className="relative text-lg font-black text-adm uppercase tracking-widest mb-4 group-hover:text-orange-500 transition-colors duration-300">
                                        {cap.title}
                                    </h3>
                                    <p className="relative text-gray-500 text-sm font-medium leading-relaxed group-hover:text-gray-600">
                                        {cap.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                </>
            ) : currentView === 'iam' ? (
                <IAMRequestPage
                    setCurrentView={setCurrentView}
                    currentUser={currentUser}
                    setNotification={setNotification}
                />
            ) : currentView === 'guidelines' ? (
                <GuidelinesPage setCurrentView={setCurrentView} />
            ) : null}

            <footer className="relative bg-adm text-white py-24 overflow-hidden border-t-[12px] border-orange-500">
                {/* Background Depth Gradient */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.03),transparent_70%)] pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="text-center md:text-left">
                        <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('home'); }} className="group inline-block">
                            <span className="font-black text-3xl uppercase italic tracking-tighter group-hover:text-orange-500 transition-colors">ADM <span className="text-orange-500 font-light tracking-[0.2em] group-hover:text-white transition-colors">ANALYTICS</span></span>
                        </a>
                        <p className="text-gray-500 text-[10px] mt-4 font-bold tracking-[0.3em] uppercase">© 2026 Strategy & Innovation Portal</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-12">

                        <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('guidelines'); }} className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-orange-500 hover:-translate-y-1 transition-all duration-300">Guidelines</a>
                        <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('iam'); }} className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-orange-500 hover:-translate-y-1 transition-all duration-300">IAM Access</a>
                        <a href="#" className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-orange-500 hover:-translate-y-1 transition-all duration-300">Global Support</a>
                    </div>
                </div>
            </footer>
            <ChatBot />
            <TeamOrgChart isOpen={showTeamModal} onClose={() => setShowTeamModal(false)} />
            <SubmitRequestModal isOpen={showSubmitRequestModal} onClose={() => setShowSubmitRequestModal(false)} />
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
