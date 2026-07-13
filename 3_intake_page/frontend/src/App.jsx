import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

import Header from './components/Header';
import ProgressStepper from './components/ProgressStepper';
import Step1TeamInfo from './components/Step1TeamInfo';
import Step2ProjectDetails from './components/Step2ProjectDetails';
import Step3UploadFiles from './components/Step3UploadFiles';
import Step4ReviewSubmit from './components/Step4ReviewSubmit';
import SuccessModal from './components/SuccessModal';

const BACKEND = `${window.location.protocol}//${window.location.host}/intake`;

const STEP_FIELDS = {
  1: ['teamLead', 'function', 'contactEmail'],
  2: ['projectTitle', 'projectStatus', 'category', 'whatIsIt', 'whyDoWeUseIt', 'whoManagesIt', 'onHoldReason', 'contactPersonName', 'contactPersonEmail', 'escalation1Name', 'escalation1Email', 'escalation2Name', 'escalation2Email', 'dashboardLink'],
  3: [],
};

// ── Access Denied screen ──────────────────────────────────────────────────────
function AccessDenied({ reason }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f8fafc', flexDirection: 'column', gap: 20, padding: 32,
    }}>
      <div style={{ fontSize: 64 }}>🔒</div>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: 0 }}>Access Denied</h2>
      <p style={{ fontSize: 15, color: '#64748b', maxWidth: 420, textAlign: 'center', lineHeight: 1.65, margin: 0 }}>
        {reason || 'Your access token is invalid or has expired. Please contact the ADM Analytics team for a new link.'}
      </p>
      <div style={{
        background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '14px 24px',
        fontSize: 13, color: '#94a3b8', fontFamily: 'monospace',
      }}>
        No valid <code>?token=</code> found in the URL.
      </div>
    </div>
  );
}

// ── Loading screen ────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f8fafc', flexDirection: 'column', gap: 16,
    }}>
      <div style={{
        width: 48, height: 48, border: '4px solid #e2e8f0',
        borderTop: '4px solid #f97316', borderRadius: '50%',
        animation: 'spin 0.9s linear infinite',
      }} />
      <p style={{ color: '#64748b', fontSize: 14 }}>Verifying your access token…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Project Status Page ──────────────────────────────────────────────────────
const STATUS_CONFIG = {
  submitted:         { icon: '📤', color: '#3b82f6', bg: '#eff6ff', label: 'Submitted',         msg: 'Your project has been submitted and is waiting for admin review.' },
  under_review:      { icon: '🔍', color: '#f59e0b', bg: '#fffbeb', label: 'Under Review',      msg: 'The ADM team is currently reviewing your project submission.' },
  changes_requested: { icon: '📝', color: '#ef4444', bg: '#fef2f2', label: 'Changes Requested',  msg: 'The admin has requested changes. A new edit link will be sent to your email.' },
  approved:          { icon: '✅', color: '#22c55e', bg: '#f0fdf4', label: 'Approved!',          msg: 'Your project has been approved by the ADM Analytics team.' },
  published:         { icon: '🚀', color: '#8b5cf6', bg: '#faf5ff', label: 'Published!',         msg: 'Your project is now live on the ADM Analytics platform.' },
  resubmitted:       { icon: '🔄', color: '#6366f1', bg: '#eef2ff', label: 'Changes Submitted',  msg: 'Your updated project has been resubmitted and is awaiting review.' },
};

function cleanProjectTitle(title) {
  if (!title) return '';
  return title
    .replace(/^(TE_TS_ADM_SALE_|TE_IS_ADM_SALE_|TE_TS_ADM_|TE_IS_ADM_|TE_TS_|TE_IS_)/i, '')
    .replace(/_/g, ' ');
}

const getExpectedPrefixes = (category, funcCategory, plantName) => {
  const prefixes = [];
  
  if (category === 'Plants') {
    if (!plantName) return [];
    const plantToCodes = {
      'A': ['redwood_city', 'wc', 'redwood'],
      'B': ['el_cajon', 'mog', 'cajon'],
      'C': ['tecate', 'con'],
      'D': ['hermosillo', 'con'],
      'E': ['tijuana', 'wc'],
      'F': ['tijuana', 'mog'],
      'G': ['manheim', 'con', 'mt_joy'],
      'H': ['fairview', 'relays', 'arden'],
      'I': ['mansfield', 'relays'],
      'J': ['hauppauge', 'relays'],
      'K': ['katy', 'mog'],
      'L': ['evreux', 'con'],
      'M': ['hastings', 'con'],
      'N': ['swindon', 'wc'],
      'O': ['great_yarmouth', 'mog', 'yarmouth'],
      'P': ['evora', 'relays'],
      'Q': ['bangalore', 'relays'],
      'R': ['bangalore', 'dri']
    };
    const codes = plantToCodes[plantName] || ['plant'];
    codes.forEach(code => {
      prefixes.push(`TE_IS_ADM_${code.toUpperCase()}_`);
      prefixes.push(`TE_TS_ADM_${code.toUpperCase()}_`);
    });
  } else if (['AI Solution', 'Data Product', 'Dashboard'].includes(category)) {
    if (!funcCategory) return [];
    const funcToCodes = {
      'Executive': ['executive', 'exec'],
      'Customer Service': ['customer_service', 'cs'],
      'Finance': ['finance', 'fin'],
      'Engineering': ['engineering', 'eng'],
      'Human Resources': ['human_resources', 'hr'],
      'Marine, Oil & Gas': ['mog', 'marine_oil_gas'],
      'Operations': ['operation', 'operations', 'ops'],
      'Pricing': ['pricing', 'price'],
      'Product Management': ['product_management', 'pm'],
      'Sales Commercial': ['sale', 'sales', 'sales_commercial'],
      'Plants': ['plant', 'plants']
    };
    const codes = funcToCodes[funcCategory] || [];
    codes.forEach(code => {
      prefixes.push(`TE_IS_ADM_${code.toUpperCase()}_`);
      prefixes.push(`TE_TS_ADM_${code.toUpperCase()}_`);
    });
  }
  
  return prefixes;
};

function ProjectStatusPage({ teamName, projectTitle, projectStatus, mode, adminComment, onStartEdit }) {
  const cfg = STATUS_CONFIG[projectStatus] || STATUS_CONFIG['submitted'];
  const steps = ['submitted', 'under_review', 'approved', 'published'];
  const currentIdx = steps.indexOf(projectStatus === 'resubmitted' ? 'under_review' : projectStatus);
  const canEdit = projectStatus === 'changes_requested' && onStartEdit;

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #0f1c2e 0%, #162d4a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } } @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }`}</style>
      <div style={{
        width: '100%', maxWidth: 540, background: '#fff', borderRadius: 24,
        boxShadow: '0 32px 80px rgba(0,0,0,0.4)', overflow: 'hidden',
        animation: 'fadeUp 0.4s cubic-bezier(0.25,0.46,0.45,0.94) both',
      }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#0f1c2e,#162d4a)', padding: '28px 32px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'rgba(249,115,22,0.18)', border: '1px solid rgba(249,115,22,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>📊</div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.14em', textTransform: 'uppercase', margin: 0 }}>Project Submission Portal</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', margin: '2px 0 0' }}>{teamName}</p>
            </div>
          </div>
        </div>
        <div style={{ height: 3, background: 'linear-gradient(90deg,#f97316,#fb923c,transparent)' }} />

        {/* Status Card */}
        <div style={{ padding: '32px 32px 28px' }}>
          <div style={{
            textAlign: 'center', padding: '28px 20px', background: cfg.bg,
            borderRadius: 18, border: `1.5px solid ${cfg.color}33`, marginBottom: 28,
          }}>
            <div style={{ fontSize: 52, marginBottom: 12, animation: 'pulse 2s ease-in-out infinite' }}>{cfg.icon}</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: '0 0 8px' }}>{cfg.label}</h2>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 14px', lineHeight: 1.6 }}>{cfg.msg}</p>
            <div style={{
              display: 'inline-block', padding: '6px 16px', borderRadius: 20,
              background: cfg.color, color: '#fff', fontWeight: 700, fontSize: 12, letterSpacing: '0.05em',
            }}>{cleanProjectTitle(projectTitle) || 'Your Project'}</div>
          </div>

          {/* Admin Comment (when changes_requested) */}
          {adminComment && projectStatus === 'changes_requested' && (
            <div style={{
              padding: '16px 18px', background: '#fef2f2', borderRadius: 14,
              border: '1.5px solid #fecaca', marginBottom: 20,
            }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>
                📋 Admin Feedback
              </p>
              <p style={{ fontSize: 13, color: '#991b1b', lineHeight: 1.65, margin: 0, fontWeight: 500 }}>
                {adminComment}
              </p>
            </div>
          )}

          {/* Edit Now button (when changes_requested) */}
          {canEdit && (
            <button
              onClick={onStartEdit}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #f97316, #ea580c)', color: '#fff',
                fontWeight: 800, fontSize: 14, cursor: 'pointer', marginBottom: 20,
                boxShadow: '0 4px 14px rgba(249,115,22,0.35)', letterSpacing: '0.03em',
              }}
            >
              ✏️ Edit & Resubmit Now
            </button>
          )}

          {/* Progress Timeline */}
          <p style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Submission Progress</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
            {steps.map((step, idx) => {
              const stepCfg = STATUS_CONFIG[step];
              const done = currentIdx >= idx;
              const active = currentIdx === idx;
              return (
                <div key={step} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <div style={{
                      width: active ? 34 : 28, height: active ? 34 : 28, borderRadius: '50%',
                      background: done ? stepCfg.color : '#f1f5f9',
                      border: `2px solid ${done ? stepCfg.color : '#e2e8f0'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: active ? 16 : 13, transition: 'all 0.3s',
                      boxShadow: active ? `0 0 0 4px ${stepCfg.color}22` : 'none',
                    }}>
                      {done ? <span style={{ fontSize: 12 }}>{stepCfg.icon}</span> : <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#cbd5e1', display: 'block' }} />}
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 700, color: done ? stepCfg.color : '#94a3b8', marginTop: 5, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stepCfg.label}</span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div style={{ height: 2, flex: 1, background: currentIdx > idx ? '#e2e8f0' : '#f1f5f9', margin: '0 2px', marginBottom: 18, transition: 'background 0.4s' }} />
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e9edf3', fontSize: 12, color: '#64748b', lineHeight: 1.6, textAlign: 'center' }}>
            📧 You will receive an email notification when your project status changes.
          </div>
        </div>

        <div style={{ padding: '0 32px 28px', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#94a3b8' }}>ADM Analytics · Internal Use Only</p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  // ── Token / auth state ──────────────────────────────────────────────────
  const [authState, setAuthState] = useState('loading'); // 'loading' | 'valid' | 'invalid'
  const [authReason, setAuthReason]  = useState('');
  const [token, setToken]          = useState('');
  const [teamName, setTeamName]    = useState('');
  const [mode, setMode]            = useState('new');   // 'new' | 'submitted' | 'edit' | 'status'
  const [editProjectId, setEditProjectId] = useState(null);
  const [editFeedbackId, setEditFeedbackId] = useState(null);
  const [editTicketId, setEditTicketId] = useState(null);
  const [projectStatus, setProjectStatus] = useState(null);
  const [projectTitle, setProjectTitle]   = useState(null);
  const [adminComment, setAdminComment]   = useState(null);
  const [hasExistingImages, setHasExistingImages] = useState(false);
  const [hasExistingDocs, setHasExistingDocs] = useState(false);
  const [allowedEdits, setAllowedEdits] = useState('');

  const isFieldLocked = (fieldName) => {
    // If allowedEdits is not set, or contains 'Complete', nothing is locked
    if (!allowedEdits || allowedEdits.toLowerCase().includes('complete')) {
      return false;
    }
    const edits = allowedEdits.split(',').map(s => s.trim().toLowerCase());
    
    if (fieldName === 'teamName') {
      return !edits.includes('team name');
    }
    if (fieldName === 'teamLead') {
      return !edits.includes('team lead');
    }
    if (fieldName === 'escalations') {
      return !edits.includes('escalation names');
    }
    if (fieldName === 'projectDetails') {
      return !edits.includes('project page update');
    }
    if (fieldName === 'image') {
      return !edits.includes('image');
    }
    if (fieldName === 'document') {
      return !edits.includes('document');
    }
    
    return false;
  };

  // ── Form state ──────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadErrors, setUploadErrors] = useState({ dashboardImages: '', documents: '' });

  const {
    register, handleSubmit, control, watch, setValue, getValues, trigger,
    formState: { errors },
  } = useForm({
    defaultValues: {
      project_id: null,
      teamName: '',
      teamLead: '',
      function: '',
      contactEmail: '',
      projectTitle: '',
      projectStatus: '',
      category: '',
      startDate: '',
      endDate: '',
      onHoldReason: '',
      whatIsIt: '',
      whyDoWeUseIt: '',
      whoManagesIt: '',
      dashboardLink: '',
      contactPersonName: '',
      contactPersonEmail: '',
      escalation1Name: '',
      escalation1Email: '',
      escalation2Name: '',
      escalation2Email: '',
      milestones: [],
      dataSource: '',
      dataOwner: '',
      dataValidatedBy: '',
      dashboardDeveloper: '',
      dashboardOwner: '',
      lastValidated: '',
      drillDown: '',
      bannerImage: null,
      documents: [],
      teamPhoto: null,
    },
  });

  // Reusable function to prefill form with project data
  const prefillFromProject = (projData) => {
    setValue('project_id', projData.project_id);
    const rawTeam = projData.team_name || '';
    const resolvedTeam = rawTeam.trim().toUpperCase() === 'MAIN WEBSITE' ? '' : rawTeam;
    setValue('teamName', resolvedTeam);
    if (resolvedTeam) {
      setTeamName(resolvedTeam);
    } else {
      setTeamName('New Project');
    }
    setValue('teamLead', projData.team_lead || '');
    // Pre-fill function fields based on category
    const cat = projData.category || '';
    let func = projData.function || '';
    if (func === 'Sales & Commercial') {
      func = 'Sales Commercial';
    }
    setValue('function', func);
    if (cat === 'Plants') {
        setValue('plantName', func);
    } else if (cat === 'AI Solution' || cat === 'Dashboard' || cat === 'Data Product') {
        setValue('functionCategory', func);
    }
    setValue('contactEmail', projData.contact_email || '');
    setValue('projectTitle', projData.title || '');
    setValue('projectStatus', projData.project_status || '');
    setValue('category', projData.category || '');
    setValue('startDate', projData.start_date || '');
    setValue('endDate', projData.end_date || '');
    setValue('whatIsIt', projData.description || '');
    setValue('whyDoWeUseIt', projData.why_we_use_it || '');
    setValue('whoManagesIt', projData.who_manages_it || '');
    setValue('contactPersonName', projData.contact_person || '');
    setValue('contactPersonEmail', projData.contact_email || '');
    setValue('escalation1Name', projData.escalation1_name || '');
    setValue('escalation1Email', projData.escalation1_email || '');
    setValue('escalation2Name', projData.escalation2_name || '');
    setValue('escalation2Email', projData.escalation2_email || '');
    setValue('dashboardLink', projData.dashboard_link || '');
    setValue('dataSource', projData.data_source || '');
    setValue('dataOwner', projData.data_owner || '');
    setValue('dataValidatedBy', projData.data_validated_by || '');
    setValue('dashboardDeveloper', projData.dashboard_developer || '');
    setValue('dashboardOwner', projData.dashboard_owner || '');
    setValue('lastValidated', projData.last_validated || '');
    setValue('drillDown', projData.drill_down || '');
    setValue('businessCase', projData.business_case || '');
    setValue('techStack', projData.tech_stack || '');
    setValue('dataDeveloper', projData.data_developer || '');
    setValue('uploaded_files', projData.uploaded_files || []);

    // Check existing files
    const fileNames = projData.files ? projData.files.split(',') : [];
    const hasImg = fileNames.some(f => f.toLowerCase().includes('image_') || f.toLowerCase().match(/\.(png|jpg|jpeg)$/));
    const hasDoc = fileNames.some(f => f.toLowerCase().includes('doc_') || f.toLowerCase().endsWith('.pdf'));
    setHasExistingImages(hasImg);
    setHasExistingDocs(hasDoc);
  };

  // Handler: user clicks "Edit & Resubmit Now" on status page
  const handleStartEdit = () => {
    if (!editProjectId) return;
    fetch(`${BACKEND}/api/projects/${editProjectId}`)
      .then(r => r.json())
      .then(projData => {
        prefillFromProject(projData);
        setMode('edit');
        setCurrentStep(1);
      })
      .catch(e => console.error('Error prefilling project:', e));
  };

  // ── Token verification on mount ─────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tok = params.get('token') || '';
    setToken(tok);

    if (!tok) {
      setAuthReason('No access token was provided in the URL.');
      setAuthState('invalid');
      return;
    }

    fetch(`${BACKEND}/api/auth/verify?token=${encodeURIComponent(tok)}`)
      .then(r => r.json())
      .then(data => {
        if (data.valid) {
          const rawTeam = data.team_name || '';
          const resolvedTeam = rawTeam.trim().toUpperCase() === 'MAIN WEBSITE' ? '' : rawTeam;
          setTeamName(resolvedTeam || 'New Project');
          setValue('teamName', resolvedTeam);
          // Store status info for the status page
          if (data.project_status) setProjectStatus(data.project_status);
          if (data.project_title)  setProjectTitle(data.project_title);
          if (data.admin_comment)  setAdminComment(data.admin_comment);
          if (data.ticket_id)      setEditTicketId(data.ticket_id);
          if (data.project_id)     setEditProjectId(data.project_id);
          if (data.feedback_id)    setEditFeedbackId(data.feedback_id);
          if (data.allowed_edits)  setAllowedEdits(data.allowed_edits);

          // Clean the URL — remove the token param so it's not visible in the address bar
          const cleanUrl = `${window.location.origin}${window.location.pathname}`;
          window.history.replaceState({}, '', cleanUrl);

          if (data.mode === 'submitted') {
            // Already submitted a new project — show status page
            setMode('status');
          } else if (data.mode === 'edit' && data.project_status === 'resubmitted') {
            // Already submitted the edit — show status page
            setMode('status');
          } else if (data.mode === 'edit' && data.project_status === 'submitted') {
            // Edit was submitted, pending review — show status page
            setMode('status');
          } else if (data.mode === 'edit' && data.project_status === 'changes_requested') {
            // Admin requested changes — show status page with "Edit Now" button
            setMode('status');
          } else if (data.mode === 'edit' && data.project_id) {
            // First time opening edit link — prefill and enter edit mode
            setMode('edit');
            fetch(`${BACKEND}/api/projects/${data.project_id}`)
              .then(r => r.json())
              .then(projData => prefillFromProject(projData))
              .catch(e => console.error('Error prefilling project:', e));
          } else if (data.mode === 'team_lead' && data.project_id) {
            // Team lead review link
            setMode('team_lead');
            setCurrentStep(4); // Start directly at Review & Submit (Step 4)
            fetch(`${BACKEND}/api/projects/${data.project_id}`)
              .then(r => r.json())
              .then(projData => prefillFromProject(projData))
              .catch(e => console.error('Error prefilling project for team lead:', e));
          }
          setAuthState('valid');
        } else {
          setAuthReason(data.detail || 'Token is invalid or expired. Please request a new submission link.');
          setAuthState('invalid');
        }
      })
      .catch(() => {
        // Backend unreachable — only allow demo mode in development
        if (import.meta.env.DEV) {
          console.warn('[Auth] Backend unreachable — running in demo mode (development only)');
          setTeamName('Demo Team');
          setValue('teamName', 'Demo Team');
          setAuthState('valid');
        } else {
          setAuthReason('Backend service is unreachable. Please contact the ADM Analytics team.');
          setAuthState('invalid');
        }
      });
  }, []);

  // ── Email validation regex ─────────────────────────────────────────────
  const TE_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@te\.com$/i;
  const NAME_REGEX = /^[a-zA-Z\s'.,-]+$/;

  // ── Step navigation ─────────────────────────────────────────────────────
  const goNext = async () => {
    // Validate email fields for the current step
    if (currentStep === 1) {
      const rawTeam = getValues('teamName') || '';
      const cleanedTeam = rawTeam.trim().replace(/\s+team$/i, '').toUpperCase();
      setValue('teamName', cleanedTeam);

      const teamLead = getValues('teamLead') || '';
      const contactEmail = getValues('contactEmail') || '';

      if (!cleanedTeam) {
        toast.error('Team Name is required', {
          style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
          duration: 4000,
        });
        return;
      }
      if (!teamLead.trim()) {
        toast.error('Team Lead is required', {
          style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
          duration: 4000,
        });
        return;
      }
      if (!NAME_REGEX.test(teamLead.trim())) {
        toast.error('Team Lead name must only contain letters, spaces, hyphens or apostrophes', {
          style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
          duration: 4000,
        });
        return;
      }
      if (!contactEmail.trim()) {
        toast.error('Contact Email is required', {
          style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
          duration: 4000,
        });
        return;
      }
      if (contactEmail && !TE_EMAIL_REGEX.test(contactEmail)) {
        toast.error('Contact Email must be a valid @te.com address', {
          style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
          duration: 4000,
        });
        return;
      }
    }
    if (currentStep === 2) {
      const projectTitle = getValues('projectTitle') || '';
      const projectStatus = getValues('projectStatus') || '';
      const category = getValues('category') || '';
      const whatIsIt = getValues('whatIsIt') || '';
      const escalation1Name = getValues('escalation1Name') || '';
      const escalation1Email = getValues('escalation1Email') || '';
      const escalation2Name = getValues('escalation2Name') || '';
      const contactPersonName = getValues('contactPersonName') || '';

      if (!projectTitle.trim()) {
        toast.error('Project Title is required', {
          style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
          duration: 4000,
        });
        return;
      }
      const plantName = getValues('plantName') || '';
      const functionCategory = getValues('functionCategory') || '';
      const expectedPrefixes = getExpectedPrefixes(category, functionCategory, plantName);

      if (!projectTitle.toUpperCase().startsWith('TE_TS_ADM_') && !projectTitle.toUpperCase().startsWith('TE_IS_ADM_')) {
        toast.error('Project Title must start with "TE_TS_ADM_" or "TE_IS_ADM_"', {
          style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
          duration: 4000,
        });
        return;
      }

      if (expectedPrefixes.length > 0 && !expectedPrefixes.some(p => projectTitle.trim().toUpperCase().startsWith(p))) {
        toast.error(`Project Title must start with ${expectedPrefixes.slice(0, 2).map(p => `"${p}"`).join(' or ')} for the selected function/plant`, {
          style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
          duration: 5000,
        });
        return;
      }
      try {
        let url = `${BACKEND}/api/projects/check-title?title=${encodeURIComponent(projectTitle.trim())}`;
        const idToExclude = editProjectId || getValues('project_id');
        if (idToExclude) {
          url += `&exclude_id=${idToExclude}`;
        }
        const checkRes = await fetch(url);
        const checkData = await checkRes.json();
        if (checkData.exists) {
          toast.error(`A project with the title "${projectTitle}" has already been submitted.`, {
            style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
            duration: 4000,
          });
          return;
        }
      } catch (e) {
        console.error('Error checking project title:', e);
      }
      if (!projectStatus.trim()) {
        toast.error('Project Status is required', {
          style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
          duration: 4000,
        });
        return;
      }
      if (!category.trim()) {
        toast.error('Category is required', {
          style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
          duration: 4000,
        });
        return;
      }

      // Check dates for non-live statuses
      const showDates = projectStatus !== 'Live' && projectStatus !== 'Completed';
      if (showDates) {
        const startDate = getValues('startDate') || '';
        const endDate = getValues('endDate') || '';
        if (!startDate) {
          toast.error('Start Date is required', {
            style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
            duration: 4000,
          });
          return;
        }
        if (!endDate) {
          toast.error('Expected End Date is required', {
            style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
            duration: 4000,
          });
          return;
        }
        if (new Date(startDate) > new Date(endDate)) {
          toast.error('Start Date cannot be after Expected End Date', {
            style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
            duration: 4000,
          });
          return;
        }
      } else {
        setValue('startDate', '');
        setValue('endDate', '');
      }

      if (!whatIsIt.trim()) {
        toast.error('Description (What is it?) is required', {
          style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
          duration: 4000,
        });
        return;
      }
      if (!escalation1Name.trim()) {
        toast.error('Level 1 Escalation Name is required', {
          style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
          duration: 4000,
        });
        return;
      }
      if (!NAME_REGEX.test(escalation1Name.trim())) {
        toast.error('Level 1 Escalation Name must only contain letters, spaces, hyphens or apostrophes', {
          style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
          duration: 4000,
        });
        return;
      }
      if (!escalation1Email.trim()) {
        toast.error('Level 1 Escalation Email is required', {
          style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
          duration: 4000,
        });
        return;
      }

      if (escalation2Name.trim() && !NAME_REGEX.test(escalation2Name.trim())) {
        toast.error('Level 2 Escalation Name must only contain letters, spaces, hyphens or apostrophes', {
          style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
          duration: 4000,
        });
        return;
      }
      if (escalation2Name.trim() && escalation2Name.trim().toLowerCase() === escalation1Name.trim().toLowerCase()) {
        toast.error('Level 2 Escalation Name cannot be the same as Level 1 Escalation Name', {
          style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
          duration: 4000,
        });
        return;
      }
      const escalation2Email = getValues('escalation2Email') || '';
      if (escalation2Email.trim() && escalation2Email.trim().toLowerCase() === escalation1Email.trim().toLowerCase()) {
        toast.error('Level 2 Escalation Email cannot be the same as Level 1 Escalation Email', {
          style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
          duration: 4000,
        });
        return;
      }
      if (contactPersonName.trim() && !NAME_REGEX.test(contactPersonName.trim())) {
        toast.error('Contact Person Name must only contain letters, spaces, hyphens or apostrophes', {
          style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
          duration: 4000,
        });
        return;
      }

      const emailFields = [
        { name: 'escalation1Email', label: 'Escalation 1 Email' },
        { name: 'escalation2Email', label: 'Escalation 2 Email' },
        { name: 'contactPersonEmail', label: 'Contact Person Email' },
      ];
      for (const field of emailFields) {
        const val = getValues(field.name);
        if (val && !TE_EMAIL_REGEX.test(val)) {
          toast.error(`${field.label} must be a valid @te.com address`, {
            style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
            duration: 4000,
          });
          return;
        }
      }

      // Validate Category-specific functional selections
      if (category === 'Plants') {
        const plantName = getValues('plantName') || '';
        if (!plantName.trim()) {
          toast.error('Plant selection is required', {
            style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
            duration: 4000,
          });
          return;
        }
      } else if (['AI Solution', 'Data Product', 'Dashboard'].includes(category)) {
        const functionCategory = getValues('functionCategory') || '';
        if (!functionCategory.trim()) {
          toast.error('Function selection is required', {
            style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
            duration: 4000,
          });
          return;
        }
      }

      // Validate AI / Data Product / Plants custom details
      if (['AI Solution', 'Data Product', 'Plants'].includes(category)) {
        const businessCase = getValues('businessCase') || '';
        if (!businessCase.trim()) {
          toast.error('Business Case / Value Proposition / Operational Impact is required', {
            style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
            duration: 4000,
          });
          return;
        }
      }
      if (category === 'Plants') {
        const techStack = getValues('techStack') || '';
        if (!techStack.trim()) {
          toast.error('Systems & Machinery Tech Stack is required', {
            style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
            duration: 4000,
          });
          return;
        }
      }

      // Validate Dashboard, AI Solution, and Data Product data info fields
      if (['Dashboard', 'AI Solution', 'Data Product'].includes(category) && projectStatus !== 'Planning') {
        const isDashboard = category === 'Dashboard';
        const dataSource = getValues('dataSource') || '';
        const dataOwner = getValues('dataOwner') || '';
        const dataDeveloper = getValues('dataDeveloper') || '';
        const dashboardDeveloper = getValues('dashboardDeveloper') || '';

        if (!dataSource.trim()) {
          toast.error('Data Source is required', {
            style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
            duration: 4000,
          });
          return;
        }
        if (!dataOwner.trim()) {
          toast.error('Data Owner is required', {
            style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
            duration: 4000,
          });
          return;
        }
        if (!dataDeveloper.trim()) {
          toast.error('Data Developer is required', {
            style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
            duration: 4000,
          });
          return;
        }
        if (!dashboardDeveloper.trim()) {
          toast.error(`${isDashboard ? 'Dashboard Developer' : 'Developer'} is required`, {
            style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
            duration: 4000,
          });
          return;
        }

        if (projectStatus === 'Live' || projectStatus === 'Completed') {
          const dashboardLink = getValues('dashboardLink') || '';
          const dataValidatedBy = getValues('dataValidatedBy') || '';
          const dashboardOwner = getValues('dashboardOwner') || '';
          const lastValidated = getValues('lastValidated') || '';

          if (!dashboardLink.trim()) {
            toast.error(`${isDashboard ? 'Dashboard Link' : 'Application Link'} is required`, {
              style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
              duration: 4000,
            });
            return;
          }
          if (!dataValidatedBy.trim()) {
            toast.error(`${isDashboard ? 'Data Validated By' : 'Application Validated'} is required`, {
              style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
              duration: 4000,
            });
            return;
          }
          if (!dashboardOwner.trim()) {
            toast.error(`${isDashboard ? 'Dashboard Owner' : 'Application Owner'} is required`, {
              style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
              duration: 4000,
            });
            return;
          }
          if (!lastValidated.trim()) {
            toast.error('Last Validated date is required', {
              style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
              duration: 4000,
            });
            return;
          }
          const drillDown = getValues('drillDown') || '';
          if (!drillDown.trim()) {
            toast.error('Drill Down is required', {
              style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
              duration: 4000,
            });
            return;
          }
        }
      }
    }
    if (currentStep === 3) {
      const dashboardImages = getValues('dashboardImages') || [];
      const documents = getValues('documents') || [];
      const category = getValues('category') || '';
      const imageLabel = category === 'Dashboard' ? 'Dashboard Image' : (category === 'Plants' ? 'Plant Image' : 'Application Image');

      const isEditMode = mode === 'edit' || mode === 'team_lead';
      const needsImage = isEditMode ? (dashboardImages.length === 0 && !hasExistingImages) : (dashboardImages.length === 0);
      const needsDoc = isEditMode ? (documents.length === 0 && !hasExistingDocs) : (documents.length === 0);

      const projectStatus = getValues('projectStatus');
      const isPlanned = projectStatus === 'Planning';

      if (!isPlanned) {
        if (needsImage) {
          toast.error(`${imageLabel} is required`, {
            style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
            duration: 4000,
          });
          setUploadErrors(prev => ({ ...prev, dashboardImages: `${imageLabel} is required` }));
          return;
        }
        if (needsDoc) {
          toast.error('Project Documents (PDF) are required', {
            style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
            duration: 4000,
          });
          setUploadErrors(prev => ({ ...prev, documents: 'Project Documents are required' }));
          return;
        }
      }
    }
    setCurrentStep(s => Math.min(s + 1, 4));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setCurrentStep(s => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Final submit — real multipart POST ─────────────────────────────────
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    const formData = getValues();

    const fd = new FormData();
    // Auth
    fd.append('token', token);

    const finalTeam = (formData.teamName || '').trim().replace(/\s+team$/i, '').toUpperCase();
    fd.append('team_name',            finalTeam || teamName || 'Unknown');
    fd.append('team_lead',            formData.teamLead || '');           // Team Lead individual name
    
    // Determine the specific function based on category selections in Step 2
    let finalFunction = formData.function || '';
    if (formData.category === 'Plants' && formData.plantName) {
        finalFunction = formData.plantName;
    } else if ((formData.category === 'AI Solution' || formData.category === 'Dashboard' || formData.category === 'Data Product') && formData.functionCategory) {
        finalFunction = formData.functionCategory;
    }
    fd.append('function_area',        finalFunction);                     // Function dropdown
    fd.append('contact_email',        formData.contactEmail || '');       // Step-1 email

    // ── Step 2 — Project Details ────────────────────────────────────────────
    fd.append('title',                formData.projectTitle || 'Untitled Project');
    fd.append('project_status',       formData.projectStatus || '');
    fd.append('category',             formData.category || '');
    fd.append('start_date',           formData.startDate || '');
    fd.append('end_date',             formData.endDate || '');
    fd.append('on_hold_reason',       formData.onHoldReason || '');
    fd.append('description',          formData.whatIsIt || '');           // What is it?
    fd.append('why_we_use_it',        formData.whyDoWeUseIt || '');       // Why do we use it?
    fd.append('who_manages_it',       formData.whoManagesIt || '');       // Who manages it?
    // Person to Contact (Step 2 contact section)
    fd.append('contact_person',       formData.contactPersonName || ''); // Name field in "Person to Contact"
    fd.append('contact_person_email', formData.contactPersonEmail || '');// Email field in "Person to Contact"
    // Escalation Matrix
    fd.append('escalation1_name',     formData.escalation1Name || '');
    fd.append('escalation1_email',    formData.escalation1Email || '');
    fd.append('escalation2_name',     formData.escalation2Name || '');
    fd.append('escalation2_email',    formData.escalation2Email || '');
    // Data Information
    fd.append('dashboard_link',       formData.dashboardLink || '');
    fd.append('data_source',          formData.dataSource || '');
    fd.append('data_owner',           formData.dataOwner || '');
    fd.append('data_validated_by',    formData.dataValidatedBy || '');
    fd.append('dashboard_developer',  formData.dashboardDeveloper || '');
    fd.append('dashboard_owner',      formData.dashboardOwner || '');
    fd.append('last_validated',       formData.lastValidated || '');
    fd.append('drill_down',           formData.drillDown || '');
    fd.append('business_case',        formData.businessCase || '');
    fd.append('tech_stack',           formData.techStack || '');
    fd.append('data_developer',       formData.dataDeveloper || '');
    fd.append('milestones',           JSON.stringify(formData.milestones || []));

    // ── Step 3 — Files ──────────────────────────────────────────────────────
    const images = formData.dashboardImages || [];
    images.forEach(f => fd.append('images', f));

    const docs = formData.documents || [];
    docs.forEach(f => fd.append('documents', f));

    if (formData.bannerImage) fd.append('banner', formData.bannerImage);
    if (formData.teamPhoto)   fd.append('team_photo', formData.teamPhoto);
    // Pass feedback_id so backend can update its status to 'resubmitted'
    if (editFeedbackId)       fd.append('feedback_id', String(editFeedbackId));

    try {
      const endpoint = (mode === 'edit' || mode === 'team_lead') ? `${BACKEND}/api/projects/${editProjectId}` : `${BACKEND}/api/projects/submit`;
      const method = (mode === 'edit' || mode === 'team_lead') ? 'PUT' : 'POST';
      const res = await fetch(endpoint, { method: method, body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.detail || `HTTP ${res.status}`);
      }
      toast.success('Project submitted successfully!', {
        style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
        iconTheme: { primary: '#FF6B2B', secondary: '#fff' },
      });
      setShowSuccess(true);
    } catch (err) {
      console.error('[Submit]', err.message);
      toast.error(`Project submission failed: ${err.message}. Please try again.`, {
        style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' },
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render guard ────────────────────────────────────────────────────────
  if (authState === 'loading') return <LoadingScreen />;
  if (authState === 'invalid') return <AccessDenied reason={authReason} />;
  if (mode === 'submitted' || mode === 'status') return (
    <ProjectStatusPage
      teamName={teamName}
      projectTitle={projectTitle}
      projectStatus={projectStatus || 'submitted'}
      mode={mode}
      adminComment={adminComment}
      onStartEdit={projectStatus === 'changes_requested' ? handleStartEdit : null}
    />
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Toaster position="top-right" />

      <Header teamName={teamName} />

      {mode === 'edit' && (
        <div style={{ background: '#eff6ff', color: '#1d4ed8', padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>
          ✏️ You are editing: {watch('projectTitle') || 'Project'} — Required Changes
        </div>
      )}

      {mode === 'team_lead' && (
        <div style={{ background: '#f0fdf4', color: '#15803d', padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>
          👀 Team Lead Review: {watch('projectTitle') || 'Project'} — Review, Edit & Approve
        </div>
      )}

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="panel mb-8">
          <ProgressStepper currentStep={currentStep} />

          <form className="form-container" onSubmit={(e) => e.preventDefault()}>
            {currentStep === 1 && (
              <Step1TeamInfo
                register={register}
                errors={errors}
                watch={watch}
                mode={mode}
                setValue={setValue}
                setTeamName={setTeamName}
                isFieldLocked={isFieldLocked}
              />
            )}
            {currentStep === 2 && (
              <Step2ProjectDetails
                register={register}
                errors={errors}
                control={control}
                watch={watch}
                setValue={setValue}
                getValues={getValues}
                mode={mode}
                isFieldLocked={isFieldLocked}
                editProjectId={editProjectId}
              />
            )}
            {currentStep === 3 && (
              <Step3UploadFiles
                watch={watch}
                setValue={setValue}
                uploadErrors={uploadErrors}
                setUploadErrors={setUploadErrors}
                hasExistingImages={hasExistingImages}
                hasExistingDocs={hasExistingDocs}
                setHasExistingImages={setHasExistingImages}
                setHasExistingDocs={setHasExistingDocs}
                isFieldLocked={isFieldLocked}
              />
            )}
            {currentStep === 4 && (
              <Step4ReviewSubmit
                watch={watch}
                setValue={setValue}
                setHasExistingImages={setHasExistingImages}
                setHasExistingDocs={setHasExistingDocs}
                onSubmit={handleFinalSubmit}
                isSubmitting={isSubmitting}
                mode={mode}
              />
            )}
          </form>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-navy-border">
            <button
              type="button"
              onClick={goBack}
              disabled={currentStep === 1}
              className="btn-panel-secondary disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <span className="text-gray-400 font-medium text-sm">
              Step {currentStep} of 4
            </span>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={goNext}
                className="btn-primary flex items-center gap-2 shadow-none"
              >
                Next
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <div className="w-[100px]" /> // spacer
            )}
          </div>
        </div>
      </main>

      <footer className="text-center py-6 text-sm text-slate-500 border-t border-gray-200 bg-white">
        <p>Project Automation Platform · Internal Use Only · © {new Date().getFullYear()}</p>
      </footer>

      {showSuccess && <SuccessModal onClose={() => setShowSuccess(false)} mode={mode} />}
    </div>
  );
}
