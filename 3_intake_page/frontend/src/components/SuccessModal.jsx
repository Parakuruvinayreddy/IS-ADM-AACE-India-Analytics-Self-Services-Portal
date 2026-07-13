import { X, CheckCircle, ExternalLink } from 'lucide-react';

export default function SuccessModal({ onClose, mode }) {
  const handleDone = () => {
    // Redirect to the main website home page
    window.location.href = '/home';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white border border-gray-200 rounded-3xl p-8 max-w-md w-full shadow-2xl shadow-slate-300/50 animate-scaleIn text-center">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <div className="absolute inset-0 rounded-full animate-ping bg-green-400/20" />
          </div>
        </div>

        <h2 className="font-sora font-bold text-2xl text-slate-900 mb-2">
          {mode === 'team_lead' ? 'Project Submitted!' : 'Draft Submitted!'}
        </h2>
        <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">
          {mode === 'team_lead'
            ? 'Thanks for the submission. The project is now under review.'
            : 'Your project draft has been successfully sent to your team lead. The team lead will review and submit it shortly.'}
        </p>

        {mode !== 'team_lead' && (
          <>
            {/* Status Info */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 shadow-sm">
              <p className="text-green-700 font-semibold text-sm">
                📋 Draft is now <span className="text-green-800 font-bold">pending team lead review</span>
              </p>
            </div>

            <div className="flex flex-col gap-2 text-xs font-semibold text-slate-400">
              <p>✓ Action logged at {new Date().toLocaleString()}</p>
              <p>✓ Email confirmation has been sent to you and your team lead</p>
            </div>
          </>
        )}

        <button
          onClick={handleDone}
          className="mt-6 w-full btn-primary py-3.5 font-sora font-bold shadow-md shadow-orange/30"
        >
          Done
        </button>
      </div>
    </div>
  );
}
