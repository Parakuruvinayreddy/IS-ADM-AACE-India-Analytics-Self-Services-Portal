import { useState } from 'react';
import { Check, FileText, AlertTriangle, Send, X } from 'lucide-react';
import toast from 'react-hot-toast';


const USER_CHECKLIST = [
  'All project details are accurate',
  'All required files have been uploaded',
  'I confirm this data is ready for team lead review',
];

const TEAM_LEAD_CHECKLIST = [
  'I have reviewed the project details and confirm they are accurate',
  'I approve this submission and confirm it is ready for ADM Admin review',
];

function ReviewSection({ title, children }) {
  return (
    <div className="card p-5 h-full">
      <h4 className="font-sora font-bold text-sm text-orange uppercase tracking-wider mb-4 flex items-center gap-2">
        <span className="w-1.5 h-4 bg-orange rounded-full" />
        {title}
      </h4>
      <div className="divide-y divide-gray-100">
        {children}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="review-item">
      <span className="review-label">{label}</span>
      <span className="review-value">{value || <span className="text-slate-400 italic">Not provided</span>}</span>
    </div>
  );
}

const PLANT_MAP = {
  'A': 'Redwood City, CA (W&C)',
  'B': 'El Cajon, CA (MOG)',
  'C': 'Tecate, MX (CON)',
  'D': 'Hermosillo, MX (CON)',
  'E': 'Tijuana, MX (W&C)',
  'F': 'Tijuana, MX (MOG)',
  'G': 'Mt.Joy/Manheim, PA (CON)',
  'H': 'Fairview/Arden, NC (Relays)',
  'I': 'Mansfield, OH (Relays)',
  'J': 'Hauppauge, NY (Relays)',
  'K': 'Katy, TX (MOG)',
  'L': 'Evreux, FR (CON)',
  'M': 'Hastings, UK (CON)',
  'N': 'Swindon, UK (W&C)',
  'O': 'Great Yarmouth, UK (MOG)',
  'P': 'Evora, PORT (Relays)',
  'Q': 'Bangalore, IN (Relays)',
  'R': 'Bangalore, IN (DRI)',
};

export default function Step4ReviewSubmit({ watch, setValue, setHasExistingImages, setHasExistingDocs, onSubmit, isSubmitting, mode }) {
  const checklistItems = mode === 'team_lead' ? TEAM_LEAD_CHECKLIST : USER_CHECKLIST;
  const [checklist, setChecklist] = useState(() => Array(checklistItems.length).fill(false));

  const allChecked = true; // mandatory removed for showcase

  const toggleCheck = (i) => {
    setChecklist(prev => prev.map((v, idx) => idx === i ? !v : v));
  };

  const data = watch();
  const uploadedFiles = data.uploaded_files || [];

  const handleDeleteExisting = async (file) => {
    const projectId = data.project_id;
    if (!projectId) return;

    if (!confirm(`Are you sure you want to delete ${file.file_name} permanently?`)) {
      return;
    }

    try {
      const params = new URLSearchParams(window.location.search);
      const tok = params.get('token') || '';
      
      const res = await fetch(`/intake/api/projects/${projectId}/files/${encodeURIComponent(file.file_name)}?token=${encodeURIComponent(tok)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete file');

      toast.success(`${file.file_name} deleted successfully!`);

      // Update form state
      const updated = uploadedFiles.filter(f => f.file_name !== file.file_name);
      setValue('uploaded_files', updated);

      // Update indicators
      const hasImg = updated.some(f => f.file_type === 'image');
      const hasDoc = updated.some(f => f.file_type === 'document');
      setHasExistingImages(hasImg);
      setHasExistingDocs(hasDoc);
    } catch (e) {
      console.error(e);
      toast.error('Could not delete file');
    }
  };
  const category = data.category || '';
  const isDashboard = category === 'Dashboard';
  const isPlants = category === 'Plants';
  const showDates = data.projectStatus === 'Planning' || data.projectStatus === 'In Progress';
  const showOnHold = data.projectStatus === 'On Hold';

  const validatedByLabel = isDashboard ? 'Data Validated By' : 'Application Validated';
  const developerLabel = isDashboard ? 'Dashboard Developer' : 'Application Developer';
  const ownerLabel = isDashboard ? 'Dashboard Owner' : 'Application Owner';
  const imageLabel = isDashboard ? 'Dashboard Images' : (isPlants ? 'Plant Images' : 'Application Images');

  // Dynamically resolve function / plant name
  let resolvedFunction = '';
  let functionLabel = 'Function';
  if (category === 'Plants') {
    functionLabel = 'Plant';
    const plantKey = data.plantName || '';
    resolvedFunction = PLANT_MAP[plantKey] || plantKey || '';
  } else if (['AI Solution', 'Data Product', 'Dashboard'].includes(category)) {
    functionLabel = 'Function';
    resolvedFunction = data.functionCategory || '';
  }

  // Display status label
  const displayStatus = data.projectStatus === 'Live' ? 'Live / Completed' : (data.projectStatus || '');

  return (
    <div className="animate-fadeIn space-y-6">
      <div>
        <h2 className="font-sora font-bold text-2xl text-white">Review & Submit</h2>
        <p className="text-gray-400 text-sm mt-1">Review your submission carefully before sending it for admin review.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <ReviewSection title="Team Information">
          <ReviewRow label="Team Name" value={data.teamName} />
          <ReviewRow label="Team Lead" value={data.teamLead} />
          <ReviewRow label="Contact Email" value={data.contactEmail} />
        </ReviewSection>

        <ReviewSection title="Project Details">
          <ReviewRow label="Category" value={category} />
          <ReviewRow label="Project Title" value={data.projectTitle} />
          <ReviewRow label={functionLabel} value={resolvedFunction} />
          <ReviewRow label="Status" value={displayStatus} />
          {showDates && (
            <>
              <ReviewRow label="Start Date" value={data.startDate} />
              <ReviewRow label="End Date" value={data.endDate} />
            </>
          )}
          {showOnHold && (
            <ReviewRow label="On Hold Reason" value={data.onHoldReason} />
          )}
        </ReviewSection>

        <ReviewSection title="Project Overview">
          <div className="py-2">
            <p className="review-label mb-1">What is it?</p>
            <p className="text-sm text-slate-700 font-medium mb-3">{data.whatIsIt || <span className="text-slate-400 italic">Not provided</span>}</p>
          </div>
        </ReviewSection>

        {/* Category-Specific Details */}
        {['AI Solution', 'Data Product', 'Plants'].includes(category) && (
          <ReviewSection title={`${category} Details`}>
            {category === 'Plants' && (
              <ReviewRow label="Systems & Tech Stack" value={data.techStack} />
            )}
            <div className="py-2">
              <p className="review-label mb-1">
                {category === 'Plants' ? 'Operational Impact & Business Case' :
                 category === 'AI Solution' ? 'AI Use Case & Business Case' :
                 'Value Proposition & Business Case'}
              </p>
              <p className="text-sm text-slate-700 font-medium leading-relaxed mt-1">
                {data.businessCase || <span className="text-slate-400 italic">Not provided</span>}
              </p>
            </div>
          </ReviewSection>
        )}



        {/* Escalation Matrix */}
        <ReviewSection title="Escalation Matrix">
          <div className="py-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Level 1</p>
            <ReviewRow label="Name" value={data.escalation1Name} />
            <ReviewRow label="Email" value={data.escalation1Email} />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-3 mb-2">Level 2</p>
            <ReviewRow label="Name" value={data.escalation2Name} />
            <ReviewRow label="Email" value={data.escalation2Email} />
          </div>
        </ReviewSection>

        {['Dashboard', 'AI Solution', 'Data Product', 'Plants'].includes(category) && data.projectStatus && data.projectStatus !== 'Planning' && (
          <ReviewSection title="Data Information">
            <ReviewRow label="Data Source" value={data.dataSource} />
            <ReviewRow label="Data Owner" value={data.dataOwner} />
            <ReviewRow label="Data Developer" value={data.dataDeveloper} />
            <ReviewRow label={developerLabel} value={data.dashboardDeveloper} />
            {(data.projectStatus === 'Live' || data.projectStatus === 'In Progress') && (
              <>
                <ReviewRow label={isDashboard ? 'Dashboard Link' : 'Application Link'} value={data.dashboardLink} />
                <ReviewRow label={validatedByLabel} value={data.dataValidatedBy} />
                <ReviewRow label={ownerLabel} value={data.dashboardOwner} />
                <ReviewRow label="Last Validated" value={data.lastValidated ? `${data.lastValidated}${data.drillDown ? ` (${data.drillDown} Validated)` : ''}` : ''} />
              </>
            )}
          </ReviewSection>
        )}



        <div className="sm:col-span-2">
          <ReviewSection title="Uploaded Files">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3">
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-gray-100">
                <div className={`p-2 rounded-lg ${(data.dashboardImages || []).length > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-slate-400'}`}>
                  <FileText size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">{imageLabel}</p>
                  <p className="text-sm text-slate-900 font-bold truncate">
                    {(data.dashboardImages || []).length} file(s)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-gray-100">
                <div className={`p-2 rounded-lg ${(data.documents || []).length > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-slate-400'}`}>
                  <FileText size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Documents</p>
                  <p className="text-sm text-slate-900 font-bold">
                    {(data.documents || []).length} file(s)
                  </p>
                </div>
              </div>
            </div>

            {/* Already Uploaded Files list for Team Lead / edit review */}
            {data.uploaded_files && data.uploaded_files.length > 0 && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Already Uploaded Files:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.uploaded_files.map((file, idx) => {
                    const isImg = file.file_type === 'image';
                    const fileUrl = isImg 
                      ? `/intake/uploads/images/${file.file_path}`
                      : `/intake/uploads/documents/${file.file_path}`;
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm justify-between"
                      >
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 min-w-0 flex-1 hover:text-orange text-slate-700 font-semibold text-sm transition-all"
                        >
                          <FileText size={18} className="text-orange flex-shrink-0" />
                          <span className="truncate flex-1 text-left">{file.file_name}</span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 flex-shrink-0">
                            {file.file_type}
                          </span>
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteExisting(file)}
                          className="text-slate-400 hover:text-red-500 transition-colors ml-2 p-1"
                          title="Delete file permanently"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </ReviewSection>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={!allChecked || isSubmitting}
        className={`w-full py-4 rounded-2xl font-sora font-bold text-base flex items-center justify-center gap-3 transition-all duration-300 ${
          allChecked && !isSubmitting
            ? 'bg-orange hover:bg-orange-dark text-white shadow-xl shadow-orange/30 active:scale-95'
            : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
        }`}
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Submitting...
          </>
        ) : (
          <>
            <Send size={18} />
            SUBMIT FOR REVIEW
          </>
        )}
      </button>
    </div>
  );
}
