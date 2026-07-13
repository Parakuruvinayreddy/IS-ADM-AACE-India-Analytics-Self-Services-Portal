// =============================================================================
// 1_main_website/frontend/adm-dashboard/src/pages/LoginPage.jsx
// ADM SSO-Free Login Portal Page
// =============================================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon, { icons } from '../components/Icon';

export default function LoginPage() {
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    // Auto-redirect to dashboard if already authenticated
    useEffect(() => {
        const savedUser = localStorage.getItem('adm_user');
        if (savedUser) {
            navigate('/');
        }
    }, [navigate]);

    const handleLogin = async () => {
        setIsLoading(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        try {
            const idToken = 'mock-developer-token';

            // Submit token to backend for JIT provisioning/retrieval
            const response = await fetch(`/api/auth/aad-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: idToken }),
            });

            const data = await response.json();

            if (response.ok) {
                // Save user identity properties and roles in localStorage
                localStorage.setItem('adm_user', JSON.stringify(data.user));
                setSuccessMsg("Signed in successfully!");
                setTimeout(() => navigate('/'), 600);
            } else {
                setErrorMsg(data.error || "Authentication failed on backend.");
            }
        } catch (error) {
            console.error("Login failed:", error);
            setErrorMsg(error.message || "Failed to authenticate.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center font-sans relative overflow-hidden py-10 selection:bg-orange-500 selection:text-white">

            {/* Ambient Background Elements matching Dashboard */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[70%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[70%] bg-orange-500/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="w-full max-w-[420px] px-6 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Logo & Brand Header */}
                <div className="text-center mb-8">
                    <div className="mb-4 inline-block">
                        <img src="/logo.png" alt="ADM Logo" className="h-12 w-auto object-contain mx-auto" />
                    </div>
                    <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tight leading-none mb-1">
                        ADM <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600 font-light tracking-[0.2em]">ANALYTICS</span>
                    </h1>
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-2 bg-white/60 px-3 py-1 rounded-full border border-gray-300 inline-block">
                        Secure Access Portal
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-[#152336] rounded-[24px] p-8 md:p-10 border border-gray-800/50 shadow-[0_20px_50px_rgba(0,0,0,0.15)] relative">

                    {/* Top orange accent line */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 rounded-t-[24px]" />

                    {/* Messages */}
                    {errorMsg && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-[12px] flex items-center gap-3 animate-in fade-in">
                            <Icon path={icons.x} className="w-5 h-5 text-red-500 shrink-0" />
                            <p className="text-red-200 text-sm font-semibold">{errorMsg}</p>
                        </div>
                    )}

                    {successMsg && (
                        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-[12px] flex items-center gap-3 animate-in fade-in">
                            <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white shrink-0 text-xs shadow-[0_0_10px_rgba(34,197,94,0.4)]">✓</span>
                            <p className="text-green-200 text-sm font-semibold">{successMsg}</p>
                        </div>
                    )}

                    {/* Description Text */}
                    <div className="text-center mb-8">
                        <h2 className="text-lg font-bold text-white mb-2">Portal Authentication</h2>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            Sign in to access request listings, analytics metrics, and published project documents.
                        </p>
                    </div>

                    {/* Portal Login Action */}
                    <div className="space-y-4">
                        <button
                            type="button"
                            onClick={handleLogin}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-3 px-5 py-4 bg-white hover:bg-gray-100 text-gray-900 border border-gray-200 rounded-2xl text-sm font-bold transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 cursor-pointer"
                        >
                            {isLoading ? (
                                <svg className="animate-spin h-5 w-5 text-gray-900" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            ) : (
                                <Icon path={icons.lock} className="w-5 h-5 text-orange-500 shrink-0" />
                            )}
                            <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
                        </button>
                    </div>

                    {/* Footer Support Notice */}
                    <div className="text-center mt-8 text-[11px] text-gray-500">
                        <p>Need access? Contact your administrator to request registration in portal security groups.</p>
                    </div>

                </div>

            </div>

        </div>
    );
}
