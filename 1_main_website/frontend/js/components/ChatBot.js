// ChatBot Component with AI capabilities
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
                        text: "👋 Hi! I'm your ADM Assistant. I can help you with:\\n\\n1️⃣ Request Dashboard Access\\n2️⃣ Request Documentation\\n3️⃣ General Questions\\n\\nWhat would you like to do?",
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
                botResponse = "Great! Let's request dashboard access. 📊\\n\\nFirst, please provide your TE User ID (e.g., TE123456):";
            } else if (input.includes('documentation') || input.includes('document') || input.includes('2')) {
                newState.mode = 'documentation';
                newState.step = 1;
                botResponse = "Perfect! Let's request documentation access. 📄\\n\\nFirst, please provide your TE User ID (e.g., TE123456):";
            } else if (input.includes('question') || input.includes('help') || input.includes('3')) {
                botResponse = "I'm here to help! You can ask me about:\\n\\n• How to access dashboards\\n• Available projects\\n• Data sources\\n• Platform features\\n\\nWhat would you like to know?";
            } else {
                botResponse = "I can help you with:\\n\\n1️⃣ Request Dashboard Access\\n2️⃣ Request Documentation\\n3️⃣ General Questions\\n\\nPlease choose an option (1, 2, or 3).";
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
                        optionsList += `\\n\\n${cat.category}:\\n`;
                        cat.items.forEach((item, itemIdx) => {
                            const num = idx * 10 + itemIdx + 1;
                            optionsList += `  ${num}. ${item}`;
                            if (itemIdx < cat.items.length - 1) optionsList += "\\n";
                        });
                    });
                    botResponse = `Perfect! Now, which ${resourceType} do you need access to?${optionsList}\\n\\nPlease enter the number or name:`;
                    break;

                case 4: // Project selected
                    newState.data.project = userInput;
                    newState.step = 5;
                    botResponse = "Almost done! Please provide a brief reason for this request:";
                    break;

                case 5: // Reason received
                    newState.data.reason = userInput;
                    const resourceName = conversationState.mode === 'dashboard' ? 'Dashboard' : 'Documentation';
                    botResponse = `✅ Request Submitted Successfully!\\n\\n📋 Summary:\\n• TE ID: ${newState.data.teId}\\n• Location: ${newState.data.location}\\n• Email: ${newState.data.email}\\n• ${resourceName}: ${newState.data.project}\\n• Reason: ${newState.data.reason}\\n\\nYour request has been sent to the admin team. You'll receive a confirmation email shortly!\\n\\nNeed anything else?`;
                    // Reset state
                    newState = { mode: null, step: 0, data: {} };
                    break;
            }
        }
        // General questions
        else {
            if (input.includes('dashboard') && input.includes('access')) {
                botResponse = "To access dashboards, you need to:\\n\\n1. Submit an access request\\n2. Get approval from your manager\\n3. Receive credentials via email\\n\\nWould you like me to help you submit a request now?";
            } else if (input.includes('project')) {
                botResponse = "We have projects across 4 functions:\\n\\n📊 Finance: EH Dashboard, PFO Dashboard\\n📦 Supply Chain: Inventory Optimizer, Route Tracking\\n📈 Marketing: Customer LTV, Attribution\\n💼 Sales: EETC, Booking Prediction\\n\\nWant to request access to any of these?";
            } else if (input.includes('data source')) {
                botResponse = "Our platform integrates data from:\\n\\n• SAP (Finance & Supply Chain)\\n• EDGE (Sales data)\\n• TED (Financial reporting)\\n• SAP IBP (Inventory planning)\\n• Salesforce (Customer data)\\n• Google Ads (Marketing attribution)\\n\\nAll data is updated in real-time!";
            } else {
                botResponse = "I'm not sure about that. Try asking about:\\n\\n• Dashboard access\\n• Available projects\\n• Data sources\\n\\nOr type 'menu' to see all options.";
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
