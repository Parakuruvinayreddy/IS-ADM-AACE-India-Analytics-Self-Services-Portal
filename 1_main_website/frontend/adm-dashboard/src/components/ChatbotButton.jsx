import { useState, useRef, useEffect } from 'react';
import Icon, { icons } from './Icon';

const PROJECT_OPTIONS = [
    { category: 'Finance', items: ['EH Dashboard', 'PFO Dashboard'] },
    { category: 'Supply Chain', items: ['Inventory Optimizer', 'Route Tracking'] },
    { category: 'Marketing', items: ['Customer LTV', 'Attribution'] },
    { category: 'Sales', items: ['EETC', 'Booking Prediction'] },
];

const WELCOME_MSG = {
    text: "👋 Hi! I'm your ADM AI Assistant.\n\nI can help you with:\n1️⃣  Request Dashboard Access\n2️⃣  General Questions\n📎  Upload a document — then ask me anything about it!\n\nWhat would you like to do?",
    sender: 'bot',
};

export default function ChatbotButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [fabOpen, setFabOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [convState, setConvState] = useState({ mode: null, step: 0, data: {} });
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const leaveTimer = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isLoading, isUploading, isOpen]);

    // ─── Open / close ────────────────────────────────────────────
    const openChat = () => {
        if (!isOpen) {
            setIsOpen(true);
            if (messages.length === 0) {
                setTimeout(() => setMessages([WELCOME_MSG]), 400);
            }
        } else {
            setIsOpen(false);
        }
    };

    // ─── New chat (+ / refresh) ───────────────────────────────────
    const startNewChat = () => {
        setMessages([]);
        setInputValue('');
        setConvState({ mode: null, step: 0, data: {} });
        setIsLoading(false);
        setIsUploading(false);
        setTimeout(() => setMessages([WELCOME_MSG]), 300);
    };

    // ─── File Upload ──────────────────────────────────────────────
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset input so same file can be re-uploaded
        e.target.value = '';

        const userMsg = { text: `📎 Uploading: ${file.name}`, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('http://127.0.0.1:8000/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            let botText = '';
            if (data.status === 'success') {
                botText = `✅ "${file.name}" has been uploaded & indexed!\n\n📚 ${data.chunks_indexed} knowledge chunks added.\n\nYou can now ask me anything about this document!`;
                // Switch to chat mode automatically
                setConvState({ mode: 'chat', step: 0, data: {} });
            } else if (data.status === 'warning') {
                botText = `⚠️ "${file.name}" was saved but no readable content was found. Try a different file.`;
            } else {
                botText = `❌ Upload failed.\n${data.message || 'Please try again.'}`;
            }

            setMessages(prev => [...prev, { text: botText, sender: 'bot' }]);
        } catch (err) {
            setMessages(prev => [...prev, {
                text: '⚠️ Could not reach the AI backend. Make sure the FastAPI server is running on port 8000.',
                sender: 'bot',
            }]);
        } finally {
            setIsUploading(false);
        }
    };

    // ─── Send message ─────────────────────────────────────────────
    const handleSend = async () => {
        if (!inputValue.trim() || isLoading || isUploading) return;
        const userMsg = { text: inputValue, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        const input = inputValue;
        setInputValue('');

        const lowerInput = input.toLowerCase().trim();
        let botResponse = '';
        let newState = { ...convState };
        let isAsyncMode = false;

        if (!convState.mode) {
            if (lowerInput.includes('dashboard') || lowerInput === '1') {
                newState = { mode: 'dashboard', step: 1, data: {} };
                botResponse = "Great! Let's request dashboard access. 📊\n\nFirst, please provide your TE User ID (e.g. TE123456):";
            } else if (lowerInput.includes('general') || lowerInput === '2') {
                newState = { mode: 'chat', step: 0, data: {} };
                botResponse = "What's your question? I can search our enterprise knowledge base for you.";
            } else {
                // Default — pass to RAG
                newState = { mode: 'chat', step: 0, data: {} };
                isAsyncMode = true;
                setConvState(newState);
                setIsLoading(true);
                try {
                    const res = await fetch('http://127.0.0.1:8000/query', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ question: input }),
                    });
                    if (!res.ok) throw new Error('Network error');
                    const data = await res.json();
                    botResponse = data.answer || "Sorry, I couldn't find an answer.";
                    if (data.sources?.length > 0) {
                        botResponse += '\n\n📄 Sources:\n' + data.sources.map(s => `  • ${s}`).join('\n');
                    }
                } catch {
                    botResponse = '⚠️ Error connecting to AI backend. Make sure the FastAPI server is running.';
                } finally {
                    setIsLoading(false);
                    setMessages(prev => [...prev, { text: botResponse, sender: 'bot' }]);
                }
            }
        } else if (convState.mode === 'dashboard') {
            switch (convState.step) {
                case 1: newState.data.teId = input; newState.step = 2; botResponse = 'Thanks! Please provide your location/site (e.g. Schaffhausen, CH):'; break;
                case 2: newState.data.location = input; newState.step = 3; botResponse = 'Got it! Please provide your corporate email:'; break;
                case 3: {
                    newState.data.email = input; newState.step = 4;
                    let opts = '';
                    PROJECT_OPTIONS.forEach((c, i) => { opts += `\n\n${c.category}:\n`; c.items.forEach((it, j) => { opts += `  ${i * 10 + j + 1}. ${it}\n`; }); });
                    botResponse = `Which dashboard do you need access to?${opts}\nPlease enter the number or name:`;
                    break;
                }
                case 4: newState.data.project = input; newState.step = 5; botResponse = 'Almost done! Please provide a brief reason for this request:'; break;
                case 5: {
                    botResponse = `✅ Request Submitted!\n\n📋 Summary:\n• TE ID: ${newState.data.teId}\n• Location: ${newState.data.location}\n• Email: ${newState.data.email}\n• Dashboard: ${newState.data.project}\n• Reason: ${input}\n\nYou'll receive a confirmation email shortly!`;
                    newState = { mode: null, step: 0, data: {} };
                    break;
                }
                default: botResponse = 'Please start a new request by typing 1.';
            }
        } else if (convState.mode === 'chat') {
            if (lowerInput === 'exit' || lowerInput === 'quit' || lowerInput === 'clear') {
                newState = { mode: null, step: 0, data: {} };
                botResponse = 'Okay! What would you like to do?\n\n1️⃣  Request Dashboard Access\n2️⃣  General Questions';
            } else {
                isAsyncMode = true;
                setConvState(newState);
                setIsLoading(true);
                try {
                    const res = await fetch('http://127.0.0.1:8000/query', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ question: input }),
                    });
                    if (!res.ok) throw new Error('Network error');
                    const data = await res.json();
                    botResponse = data.answer || "Sorry, I couldn't find an answer.";
                    if (data.sources?.length > 0) {
                        botResponse += '\n\n📄 Sources:\n' + data.sources.map(s => `  • ${s}`).join('\n');
                    }
                } catch {
                    botResponse = '⚠️ Error connecting to AI backend. Make sure the FastAPI server is running.';
                } finally {
                    setIsLoading(false);
                    setMessages(prev => [...prev, { text: botResponse, sender: 'bot' }]);
                }
            }
        }

        if (!isAsyncMode) {
            setConvState(newState);
            setTimeout(() => setMessages(prev => [...prev, { text: botResponse, sender: 'bot' }]), 400);
        }
    };

    // ─── Render ───────────────────────────────────────────────────
    return (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 100, height: '240px', width: '56px' }}>

            {/* Chat Window — absolutely positioned above the main button */}
            {isOpen && (
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-slideUp" style={{ position: 'absolute', bottom: '72px', right: 0, width: '384px', height: '500px' }}>

                    {/* ── Header ── */}
                    <div className="bg-adm px-4 py-3 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shrink-0" />
                            <span className="font-bold text-xs uppercase tracking-widest">ADM AI Support</span>
                        </div>

                        {/* Header action buttons */}
                        <div className="flex items-center gap-1">
                            {/* Refresh */}
                            <button
                                onClick={startNewChat}
                                title="Refresh chat"
                                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                                    <polyline points="23 4 23 10 17 10" />
                                    <polyline points="1 20 1 14 7 14" />
                                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                </svg>
                            </button>

                            {/* New Chat */}
                            <button
                                onClick={startNewChat}
                                title="New chat"
                                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                            </button>

                            {/* Close */}
                            <button
                                onClick={() => setIsOpen(false)}
                                title="Close"
                                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                            >
                                <Icon path={icons.x} className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* ── Messages ── */}
                    <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-gray-50 flex flex-col scrollbar-hide">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`max-w-[85%] p-3 rounded-2xl text-xs font-medium shadow-sm animate-fadeIn whitespace-pre-wrap ${
                                    msg.sender === 'bot'
                                        ? 'bg-adm text-white rounded-bl-none self-start'
                                        : 'bg-orange-500 text-white rounded-br-none self-end'
                                }`}
                            >
                                {msg.text}
                            </div>
                        ))}

                        {/* Typing indicator (query) */}
                        {isLoading && (
                            <div className="max-w-[85%] p-3 rounded-2xl text-xs shadow-sm animate-fadeIn bg-adm text-white rounded-bl-none self-start flex gap-1 items-center h-10 w-16 justify-center">
                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                            </div>
                        )}

                        {/* Upload indicator */}
                        {isUploading && (
                            <div className="max-w-[85%] p-3 rounded-2xl text-xs shadow-sm animate-fadeIn bg-adm text-white rounded-bl-none self-start flex items-center gap-2">
                                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                                    <path d="M12 2a10 10 0 0 1 10 10" />
                                </svg>
                                Processing document…
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* ── Input Bar ── */}
                    <div className="p-3 border-t border-gray-100 flex items-center gap-2 bg-white shrink-0">

                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept=".pdf,.csv,.xlsx,.xls,.png,.jpg,.jpeg"
                            onChange={handleFileUpload}
                        />

                        {/* Upload button */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading || isUploading}
                            title="Upload document"
                            className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                            </svg>
                        </button>

                        {/* Text input */}
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Type a message..."
                            disabled={isLoading || isUploading}
                            className="flex-1 text-xs border border-gray-200 rounded-full px-4 py-2 outline-none focus:border-orange-500 transition-colors disabled:opacity-50"
                        />

                        {/* Send button */}
                        <button
                            onClick={handleSend}
                            disabled={isLoading || isUploading || !inputValue.trim()}
                            className="w-8 h-8 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white flex items-center justify-center rounded-full transition-colors shrink-0"
                        >
                            <Icon path={icons.chevronRight} className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* ── Floating Launcher Group ── */}
            <style>{`
                .fab-group { position: relative; }
                .fab-option {
                    position: absolute;
                    right: 0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    opacity: 0;
                    pointer-events: none;
                    transform: translateY(8px);
                    transition: opacity 0.25s ease, transform 0.25s ease;
                }
                .fab-option .fab-label {
                    background: rgba(30,30,30,0.85);
                    color: #fff;
                    font-size: 11px;
                    font-weight: 600;
                    white-space: nowrap;
                    padding: 4px 10px;
                    border-radius: 20px;
                    letter-spacing: 0.4px;
                    backdrop-filter: blur(4px);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.18);
                }
                .fab-option.opt-chatbot  { bottom: 72px; }
                .fab-option.opt-tellme   { bottom: 136px; }
                .fab-option.fab-expanded {
                    opacity: 1;
                    pointer-events: auto;
                    transform: translateY(0);
                }
                .fab-btn {
                    width: 48px; height: 48px;
                    border-radius: 50%;
                    border: 3px solid #fff;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                    flex-shrink: 0;
                }
                .fab-btn:hover { transform: scale(1.12); }
                .fab-btn.chatbot-btn {
                    background: #f97316;
                    box-shadow: 0 6px 20px rgba(249,115,22,0.45);
                }
                .fab-btn.tellme-btn {
                    background: #fff;
                    box-shadow: 0 6px 20px rgba(249,115,22,0.3);
                    padding: 6px;
                }
                .fab-main {
                    width: 56px; height: 56px;
                    background: #f97316;
                    border-radius: 50%;
                    border: 4px solid #fff;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 8px 32px rgba(249,115,22,0.38);
                    transition: background 0.2s ease, transform 0.2s ease;
                    color: #fff;
                    flex-shrink: 0;
                }
                .fab-main:hover { background: #ea6c0a; transform: scale(1.08); }
            `}</style>

            {/*
              IMPORTANT: height must cover the tallest option.
              opt-tellme is at bottom:136px with 48px height → 184px above container bottom.
              Add main button height (56px) = 240px total.
              Main button is pinned at bottom:0 via absolute positioning.
            */}
            <div
                className="fab-group"
                style={{ position: 'relative', height: '240px', width: '56px' }}
                onMouseEnter={() => {
                    if (leaveTimer.current) clearTimeout(leaveTimer.current);
                    setFabOpen(true);
                }}
                onMouseLeave={() => {
                    leaveTimer.current = setTimeout(() => setFabOpen(false), 150);
                }}
            >

                {/* Option 2 — Tell Me (top) */}
                <div className={`fab-option opt-tellme${fabOpen ? ' fab-expanded' : ''}`}>
                    <span className="fab-label">Tell Me</span>
                    <a
                        href="https://telme.connect.te.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="fab-btn tellme-btn"
                        title="Tell Me"
                        onClick={() => setFabOpen(false)}
                    >
                        {/* Orange fan / swirl SVG matching the Tell Me brand icon */}
                        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                            <g transform="translate(50,50)">
                                <path d="M0,-38 C10,-38 20,-30 22,-18 L10,-10 C10,-20 6,-28 0,-28 Z" fill="#f97316" transform="rotate(0)"/>
                                <path d="M0,-38 C10,-38 20,-30 22,-18 L10,-10 C10,-20 6,-28 0,-28 Z" fill="#f97316" transform="rotate(72)"/>
                                <path d="M0,-38 C10,-38 20,-30 22,-18 L10,-10 C10,-20 6,-28 0,-28 Z" fill="#f97316" transform="rotate(144)"/>
                                <path d="M0,-38 C10,-38 20,-30 22,-18 L10,-10 C10,-20 6,-28 0,-28 Z" fill="#f97316" transform="rotate(216)"/>
                                <path d="M0,-38 C10,-38 20,-30 22,-18 L10,-10 C10,-20 6,-28 0,-28 Z" fill="#f97316" transform="rotate(288)"/>
                            </g>
                        </svg>
                    </a>
                </div>

                {/* Option 1 — ADM Chatbot (bottom) */}
                <div className={`fab-option opt-chatbot${fabOpen ? ' fab-expanded' : ''}`}>
                    <span className="fab-label">ADM ChatBot</span>
                    <button
                        onClick={() => { openChat(); setFabOpen(false); }}
                        className="fab-btn chatbot-btn"
                        title="ADM AI ChatBot"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px', color: '#fff' }}>
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                    </button>
                </div>

                {/* Main launcher button — pinned to bottom of the tall container */}
                <button
                    className="fab-main"
                    title="ADM AI ChatBot"
                    style={{ position: 'absolute', bottom: 0, right: 0 }}
                    onClick={() => {
                        openChat();
                        setFabOpen(false);
                    }}
                >
                    {isOpen ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '22px', height: '22px' }}>
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    ) : (
                        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ width: '28px', height: '28px' }}>
                            <g transform="translate(50,50)">
                                <path d="M0,-38 C10,-38 20,-30 22,-18 L10,-10 C10,-20 6,-28 0,-28 Z" fill="#fff" transform="rotate(0)"/>
                                <path d="M0,-38 C10,-38 20,-30 22,-18 L10,-10 C10,-20 6,-28 0,-28 Z" fill="#fff" transform="rotate(72)"/>
                                <path d="M0,-38 C10,-38 20,-30 22,-18 L10,-10 C10,-20 6,-28 0,-28 Z" fill="#fff" transform="rotate(144)"/>
                                <path d="M0,-38 C10,-38 20,-30 22,-18 L10,-10 C10,-20 6,-28 0,-28 Z" fill="#fff" transform="rotate(216)"/>
                                <path d="M0,-38 C10,-38 20,-30 22,-18 L10,-10 C10,-20 6,-28 0,-28 Z" fill="#fff" transform="rotate(288)"/>
                            </g>
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );
}
