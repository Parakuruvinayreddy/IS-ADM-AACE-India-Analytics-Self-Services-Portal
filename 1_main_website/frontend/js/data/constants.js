// Data constants
const NEWS_ITEMS = [
    { category: "AI NEWS", title: "GenAI 2.0 Deployment", desc: "Our internal LLM now supports multi-modal data processing for Supply Chain automation.", date: "Jan 10, 2026" },
    { category: "PROJECT NEWS", title: "Finance Dashboard Launch", desc: "Successful transition to the automated Spend Intelligence platform across all regions.", date: "Jan 08, 2026" },
    { category: "AI NEWS", title: "Predictive Logistics", desc: "New AI model reduces fuel costs by 12% using real-time traffic and weather telemetry.", date: "Jan 05, 2026" },
    { category: "PROJECT NEWS", title: "Data Lake Expansion", desc: "Marketing attribution data from APAC is now fully integrated into the global lake.", date: "Dec 28, 2025" },
    { category: "AI NEWS", title: "Agentic Workflows", desc: "Pilot program initiated for AI agents to automate routine IT helpdesk ticket resolutions.", date: "Dec 20, 2025" },
    { category: "AI NEWS", title: "Natural Language SQL", desc: "Business users can now query internal databases using plain English via the ADM Chatbot.", date: "Dec 10, 2025" }
];

const BU_DATA = {
    finance: { label: "Finance", projects: [{ name: "EH Dashboard", source: "SAP", owner: "Venu" }, { name: "PFO Dashboard", source: "TED", owner: "Venu" }] },
    supply_chain: { label: "Supply Chain", projects: [{ name: "Inventory Optimizer", source: "SAP IBP", owner: "TBD" }, { name: "Route Tracking", source: "IoT Sensors", owner: "TBD" }] },
    marketing: { label: "Marketing", projects: [{ name: "Customer LTV", source: "Salesforce", owner: "TDB" }, { name: "Attribution", source: "Google Ads", owner: "NA" }] },
    hr: { label: "Sales", projects: [{ name: "EETC", source: "EDGE", owner: "Jeniffer" }, { name: "Booking Prediction", source: "EDGE", owner: "Jeniffer" }] }
};
