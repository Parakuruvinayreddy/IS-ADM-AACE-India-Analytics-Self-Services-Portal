import { useState, useEffect } from 'react';
import { User, Mail, Lock, CheckCircle, HelpCircle } from 'lucide-react';

export default function Step1TeamInfo({ register, errors, watch, mode, setValue, setTeamName, isFieldLocked }) {
  const teamNameVal = watch('teamName') || '';
  const [teamStatus, setTeamStatus] = useState(''); // '', 'checking', 'exists', 'new'

  useEffect(() => {
    // Update the parent header's teamName in real time as the user types
    const trimmed = teamNameVal.trim();
    if (trimmed && trimmed.toUpperCase() !== 'MAIN WEBSITE') {
      setTeamName(trimmed);
    } else {
      setTeamName('New Project');
    }

    const normalized = trimmed.toUpperCase().replace(/\s+TEAM$/i, '');
    if (!normalized || normalized === 'MAIN WEBSITE') {
      setTeamStatus('');
      return;
    }

    setTeamStatus('checking');
    const timer = setTimeout(() => {
      fetch(`/intake/api/projects/check?name=${encodeURIComponent(normalized)}`)
        .then(r => r.json())
        .then(data => {
          if (data.exists) {
            setTeamStatus('exists');
            // Auto-fill Team Lead and Contact Email if currently empty
            if (!watch('teamLead')) {
              setValue('teamLead', data.team_lead || '');
            }
            if (!watch('contactEmail')) {
              setValue('contactEmail', data.contact_email || '');
            }
          } else {
            setTeamStatus('new');
          }
        })
        .catch(() => {
          setTeamStatus('');
        });
    }, 500);

    return () => clearTimeout(timer);
  }, [teamNameVal, setValue, setTeamName]);

  return (
    <div className="animate-fadeIn space-y-6">
      <div>
        <h2 className="font-sora font-bold text-2xl text-white">Team Information</h2>
        <p className="text-gray-400 text-sm mt-1">Pre-assigned fields are locked. Please complete the editable fields.</p>
      </div>

      <div className="card p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Team Name */}
        <div className="sm:col-span-2">
          <label className="label">Team Name <span className="text-red-500">*</span></label>
          <div className="relative">
            {(() => {
              const isTeamEditable = !isFieldLocked('teamName');
              return (
                <>
                  <input
                    {...register('teamName')}
                    className={`input-field pl-10 ${!isTeamEditable ? 'bg-slate-100 cursor-not-allowed text-slate-500 opacity-70' : ''}`}
                    readOnly={!isTeamEditable}
                    placeholder="e.g. Analytics Team"
                  />
                  {!isTeamEditable ? (
                    <Lock size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
                  ) : (
                    <User size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
                  )}
                </>
              );
            })()}
          </div>
          {teamStatus === 'checking' && (
            <p className="text-slate-400 text-xs font-semibold mt-1.5 animate-pulse">Checking team database...</p>
          )}
          {teamStatus === 'exists' && (
            <p className="text-green-500 text-xs font-semibold mt-1.5 flex items-center gap-1 animate-fadeIn">
              <CheckCircle size={12} className="text-green-500" /> ✓ Existing team detected. Contact details auto-filled.
            </p>
          )}
          {teamStatus === 'new' && (
            <p className="text-blue-400 text-xs font-semibold mt-1.5 flex items-center gap-1 animate-fadeIn">
              <HelpCircle size={12} className="text-blue-400" /> New team registration
            </p>
          )}
        </div>

        {/* Team Lead */}
        <div>
          <label className="label">Team Lead (Individual's Name) <span className="text-red-500">*</span></label>
          <div className="relative">
            <input
              {...register('teamLead')}
              className={`input-field pl-10 ${isFieldLocked('teamLead') ? 'bg-slate-100 cursor-not-allowed opacity-70 text-slate-500' : ''}`}
              placeholder="e.g. Alex Johnson"
              readOnly={isFieldLocked('teamLead')}
            />
            {isFieldLocked('teamLead') ? (
              <Lock size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
            ) : (
              <User size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
            )}
          </div>
        </div>

        {/* Contact Email */}
        <div>
          <label className="label">Contact Email <span className="text-xs text-orange font-normal ml-1">(@te.com only)</span> <span className="text-red-500">*</span></label>
          <div className="relative">
            <input
              {...register('contactEmail', {
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@te\.com$/i,
                  message: 'Must be a valid @te.com email'
                }
              })}
              type="email"
              className={`input-field pl-10 ${isFieldLocked('teamLead') ? 'bg-slate-100 cursor-not-allowed opacity-70 text-slate-500' : ''}`}
              placeholder="first.last@te.com"
              readOnly={isFieldLocked('teamLead')}
            />
            {isFieldLocked('teamLead') ? (
              <Lock size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
            ) : (
              <Mail size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
            )}
          </div>
          {errors.contactEmail && (
            <p className="text-red-500 text-xs font-semibold mt-1">{errors.contactEmail.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
