import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './index.css';
import Dashboard from './pages/Dashboard';
import GuidelinesPage from './pages/GuidelinesPage';
import LoginPage from './pages/LoginPage';
import ProjectAppPage from './pages/ProjectAppPage';

function AuthWrapper({ children }) {
  const [isChecking, setIsChecking] = useState(true);
  const [userExists, setUserExists] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('adm_user');
    if (savedUser) {
      setUserExists(true);
    }
    setIsChecking(false);
  }, []);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#152336] text-white font-sans">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-orange-500 mx-auto mb-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm font-semibold tracking-wider text-gray-300">Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!userExists) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthWrapper><Dashboard /></AuthWrapper>} />
        <Route path="/guidelines" element={<AuthWrapper><GuidelinesPage /></AuthWrapper>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/project/:slug" element={<AuthWrapper><ProjectAppPage /></AuthWrapper>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
