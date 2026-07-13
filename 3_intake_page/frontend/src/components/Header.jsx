import { User } from 'lucide-react';

export default function Header({ teamName = 'Team Alpha' }) {
  return (
    <header className="sticky top-0 z-50 bg-[#15263C] shadow-sm">
      <div className="w-full px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        
        {/* Logo */}
        <div className="flex items-center gap-3 flex-shrink-0 group">
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="TE Logo"
            className="h-8 w-auto object-contain transition-all group-hover:scale-105"
          />
          <span className="hidden sm:block font-sora font-bold text-white text-sm tracking-wide">
            ADM <span className="text-orange font-normal tracking-[0.2em] ml-1">A N A L Y T I C S</span>
          </span>
        </div>

        {/* Center Title */}
        <div className="text-center flex-1">
          <h1 className="font-sora font-bold text-white text-base sm:text-lg leading-tight">
            Project Submission Portal
          </h1>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Team Badge */}
          <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-full px-3 py-1.5 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <User size={12} className="text-green-600" />
            <span className="text-green-700 text-xs font-semibold hidden sm:block">
              Team: <span className="font-bold">{teamName}</span>
            </span>
            <span className="text-green-700 text-xs font-bold sm:hidden">{teamName}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

