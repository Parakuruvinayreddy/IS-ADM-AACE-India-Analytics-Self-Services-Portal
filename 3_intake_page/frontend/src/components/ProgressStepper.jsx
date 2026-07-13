import { Check } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Team Info' },
  { id: 2, label: 'Project Details' },
  { id: 3, label: 'Upload Files' },
  { id: 4, label: 'Review & Submit' },
];

export default function ProgressStepper({ currentStep }) {
  return (
    <div className="card p-4 sm:p-6">
      <div className="flex items-start justify-between relative">

        {/* Background track line — centered on the circle (circle = 36px, so top = 18px) */}
        <div className="absolute left-0 right-0 h-0.5 bg-gray-200 hidden sm:block" style={{ top: '18px' }} />

        {/* Active fill line */}
        <div
          className="absolute left-0 h-0.5 bg-orange hidden sm:block transition-all duration-500 shadow-[0_0_6px_rgba(255,107,43,0.5)]"
          style={{
            top: '18px',
            width: `${(Math.max(0, currentStep - 1) / (STEPS.length - 1)) * 100}%`,
          }}
        />

        {STEPS.map((step) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;

          return (
            <div key={step.id} className="flex flex-col items-center gap-2 relative z-10 flex-1">
              {/* Circle */}
              <div
                className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all duration-300 ${
                  isCompleted
                    ? 'bg-orange border-orange text-white shadow-md shadow-orange/20'
                    : isActive
                    ? 'bg-orange/10 border-orange text-orange shadow-sm'
                    : 'bg-white border-gray-200 text-slate-400'
                }`}
              >
                {isCompleted ? (
                  <Check size={16} strokeWidth={3} />
                ) : (
                  <span>{step.id}</span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-xs font-bold text-center leading-tight transition-colors duration-300 ${
                  isActive ? 'text-orange-dark' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
