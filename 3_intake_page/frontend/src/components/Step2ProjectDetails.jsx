import { useState, useEffect } from 'react';
import { Info, ChevronDown, Lock } from 'lucide-react';
import { useWatch, useFieldArray } from 'react-hook-form';

const STATUSES = ['Planning', 'In Progress', 'Live', 'On Hold'];

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

export default function Step2ProjectDetails({ register, errors, control, watch, setValue, getValues, mode, isFieldLocked, editProjectId }) {
  const category = useWatch({ control, name: 'category' });
  const projectStatus = useWatch({ control, name: 'projectStatus' });
  const startDate = useWatch({ control, name: 'startDate' });
  const endDate = useWatch({ control, name: 'endDate' });
  const projectTitle = useWatch({ control, name: 'projectTitle' }) || '';
  const plantName = useWatch({ control, name: 'plantName' }) || '';
  const functionCategory = useWatch({ control, name: 'functionCategory' }) || '';

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'milestones'
  });

  const isProjLocked = isFieldLocked('projectDetails');
  const isEscalationLocked = isFieldLocked('escalations');

  const [titleStatus, setTitleStatus] = useState(''); // '', 'checking', 'duplicate', 'ok'

  const drillDownVal = useWatch({ control, name: 'drillDown' }) || '';
  const [isCustomSelected, setIsCustomSelected] = useState(false);

  const getStdOptions = () => {
    const list = ['Data'];
    if (projectStatus === 'Live' || projectStatus === 'Completed') {
      if (category === 'Dashboard') list.push('Dashboard');
      if (category === 'AI Solution') list.push('AI Solution');
      if (category === 'Data Product') list.push('Data Product');
      if (category === 'Plants') list.push('Plant');
    }
    return list;
  };
  const stdOptions = getStdOptions();

  useEffect(() => {
    const std = getStdOptions();
    if (drillDownVal && !std.includes(drillDownVal)) {
      setIsCustomSelected(true);
    } else if (!drillDownVal) {
      // Keep isCustomSelected if it was already selected but is empty
    } else {
      setIsCustomSelected(false);
    }
  }, [drillDownVal, projectStatus, category]);

  const handleSelectChange = (e) => {
    const val = e.target.value;
    if (val === 'custom') {
      setIsCustomSelected(true);
      setValue('drillDown', '');
    } else {
      setIsCustomSelected(false);
      setValue('drillDown', val);
    }
  };

  const handleTextChange = (e) => {
    setValue('drillDown', e.target.value);
  };

  // Suggestions hook
  useEffect(() => {
    const codeList = getExpectedPrefixes(category, functionCategory, plantName);
    if (codeList.length === 0) return;
    
    const trimmed = projectTitle.trim();
    const matchesAny = codeList.some(p => trimmed.toUpperCase().startsWith(p));
    
    if (!trimmed || !matchesAny) {
      const defaultCode = codeList[0];
      if (defaultCode) {
        let catSuffix = '';
        if (category === 'AI Solution') catSuffix = 'AI_SOLUTION';
        else if (category === 'Data Product') catSuffix = 'DATA_PRODUCT';
        else if (category === 'Dashboard') catSuffix = 'DASHBOARD';
        else if (category === 'Plants') catSuffix = 'PLANT';
        
        if ((mode === 'edit' || mode === 'team_lead') && trimmed) {
          const rest = trimmed.replace(/^(TE_TS_ADM_[A-Z0-9_]+?_|TE_IS_ADM_[A-Z0-9_]+?_)/i, '');
          setValue('projectTitle', `${defaultCode}${rest}`);
        } else {
          setValue('projectTitle', `${defaultCode}GLOBAL_${catSuffix}`);
        }
      }
    }
  }, [category, functionCategory, plantName, mode, setValue]);

  useEffect(() => {
    const trimmed = projectTitle.trim();
    if (!trimmed || (!trimmed.toUpperCase().startsWith('TE_TS_ADM_') && !trimmed.toUpperCase().startsWith('TE_IS_ADM_'))) {
      setTitleStatus('');
      return;
    }

    if (isProjLocked) {
      setTitleStatus('');
      return;
    }

    setTitleStatus('checking');
    const timer = setTimeout(() => {
      const idToExclude = editProjectId || getValues('project_id');
      let url = `/intake/api/projects/check-title?title=${encodeURIComponent(trimmed)}`;
      if (idToExclude) {
        url += `&exclude_id=${idToExclude}`;
      }
      fetch(url)
        .then(r => {
          if (!r.ok) throw new Error('Response not ok');
          return r.json();
        })
        .then(data => {
          if (data.exists) {
            setTitleStatus('duplicate');
          } else {
            setTitleStatus('ok');
          }
        })
        .catch(() => {
          setTitleStatus('');
        });
    }, 500);

    return () => clearTimeout(timer);
  }, [projectTitle, mode, isProjLocked, editProjectId]);

  const formatDateForInput = (dateStr) => {
    if (!dateStr) return undefined;
    if (dateStr.length > 10) {
      return dateStr.substring(0, 10);
    }
    return dateStr;
  };

  const minEndDate = formatDateForInput(startDate);
  const maxStartDate = formatDateForInput(endDate);

  const showDates = projectStatus && projectStatus !== 'Live' && projectStatus !== 'Completed';
  const showOnHoldReason = projectStatus === 'On Hold';

  const isDashboard = category === 'Dashboard';
  const linkLabel = isDashboard ? 'DASHBOARD LINK' : 'APPLICATION LINK';
  const developerLabel = isDashboard ? 'DASHBOARD DEVELOPER' : 'APPLICATION DEVELOPER';
  const ownerLabel = isDashboard ? 'DASHBOARD OWNER' : 'APPLICATION OWNER';
  const validatedByLabel = isDashboard ? 'DATA VALIDATED BY' : 'APPLICATION VALIDATED';

  const expectedPrefixes = getExpectedPrefixes(category, functionCategory, plantName);
  const isTitlePrefixValid = expectedPrefixes.length === 0 || expectedPrefixes.some(p => projectTitle.trim().toUpperCase().startsWith(p));

  return (
    <div className="animate-fadeIn space-y-6">
      <div>
        <h2 className="font-sora font-bold text-2xl text-white">Project Details</h2>
        <p className="text-gray-400 text-sm mt-1">Provide complete information about your project.</p>
      </div>

      {/* Category Selection - VERY TOP */}
      <div className="card p-6">
        <label className="label text-base font-bold mb-3" style={{ color: 'black' }}>
          Project / Product / Report Category <span className="text-red-500">*</span> {isProjLocked && <Lock size={12} className="inline text-slate-400 ml-1" />}
        </label>
        <div className={`flex flex-wrap gap-5 mt-2 ${isProjLocked ? 'opacity-70 pointer-events-none' : ''}`}>
          {['AI Solution', 'Data Product', 'Dashboard', 'Plants'].map(cat => (
            <label key={cat} className={`flex items-center gap-3 p-3 rounded-xl border border-navy-border bg-[#101E35] hover:bg-[#1a2d4c] transition-all cursor-pointer select-none flex-1 min-w-[140px] justify-center ${category === cat ? 'border-orange shadow-md' : ''}`}>
              <input
                type="radio"
                value={cat}
                {...register('category')}
                className="w-4 h-4 text-orange border-gray-300 focus:ring-orange"
                disabled={isProjLocked}
              />
              <span className="text-sm text-slate-100 font-semibold">{cat}</span>
            </label>
          ))}
        </div>
      </div>

      {/* The rest of the fields - only rendered when Category is selected */}
      {category ? (
        <div className="animate-fadeIn space-y-6">
          <div className="card p-6 space-y-5">
            {/* Title + Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Plant selection (Only for Plants) */}
              {category === 'Plants' && (
                <div className="sm:col-span-2">
                  <label className="label">Select Plant <span className="text-red-500">*</span> {isProjLocked && <Lock size={12} className="inline text-slate-400 ml-1" />}</label>
                  <div className="relative">
                    <select
                      {...register('plantName')}
                      className={`input-field appearance-none cursor-pointer ${isProjLocked ? 'bg-slate-100 cursor-not-allowed text-slate-500 opacity-70 pointer-events-none' : ''}`}
                    >
                      <option value="">Select a plant</option>
                      <option value="A">Redwood City, CA (W&C)</option>
                      <option value="B">El Cajon, CA (MOG)</option>
                      <option value="C">Tecate, MX (CON)</option>
                      <option value="D">Hermosillo, MX (CON)</option>
                      <option value="E">Tijuana, MX (W&C)</option>
                      <option value="F">Tijuana, MX (MOG)</option>
                      <option value="G">Mt.Joy/Manheim, PA (CON)</option>
                      <option value="H">Fairview/Arden, NC (Relays)</option>
                      <option value="I">Mansfield, OH (Relays)</option>
                      <option value="J">Hauppauge, NY (Relays)</option>
                      <option value="K">Katy, TX (MOG)</option>
                      <option value="L">Evreux, FR (CON)</option>
                      <option value="M">Hastings, UK (CON)</option>
                      <option value="N">Swindon, UK (W&C)</option>
                      <option value="O">Great Yarmouth, UK (MOG)</option>
                      <option value="P">Evora, PORT (Relays)</option>
                      <option value="Q">Bangalore, IN (Relays)</option>
                      <option value="R">Bangalore, IN (DRI)</option>
                    </select>
                    {isProjLocked ? (
                      <Lock size={15} className="absolute right-3.5 top-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown size={15} className="absolute right-3.5 top-3.5 text-slate-400 pointer-events-none" />
                    )}
                  </div>
                </div>
              )}

              {/* Function category selection (Only for AI, Data Product, Dashboard) */}
              {['AI Solution', 'Data Product', 'Dashboard'].includes(category) && (
                <div className="sm:col-span-2">
                  <label className="label">Select Function <span className="text-red-500">*</span> {isProjLocked && <Lock size={12} className="inline text-slate-400 ml-1" />}</label>
                  <div className="relative">
                    <select
                      {...register('functionCategory')}
                      className={`input-field appearance-none cursor-pointer ${isProjLocked ? 'bg-slate-100 cursor-not-allowed text-slate-500 opacity-70 pointer-events-none' : ''}`}
                    >
                      <option value="">Select Function</option>
                      <option value="Executive">Executive</option>
                      <option value="Customer Service">Customer Service</option>
                      <option value="Finance">Finance</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Marine, Oil & Gas">Marine, Oil &amp; Gas</option>
                      <option value="Operations">Operations</option>
                      <option value="Pricing">Pricing</option>
                      <option value="Product Management">Product Management</option>
                      <option value="Sales Commercial">Sales Commercial</option>
                      <option value="Plants">Plants</option>
                    </select>
                    {isProjLocked ? (
                      <Lock size={15} className="absolute right-3.5 top-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown size={15} className="absolute right-3.5 top-3.5 text-slate-400 pointer-events-none" />
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="label">Project Title <span className="text-red-500">*</span> {isProjLocked && <Lock size={12} className="inline text-slate-400 ml-1" />}</label>
                <input
                  {...register('projectTitle')}
                  className={`input-field ${isProjLocked ? 'bg-slate-100 cursor-not-allowed text-slate-500 opacity-70' : ''}`}
                  placeholder="e.g. TE_IS_ADM_SALE_Global_Dashboard"
                  readOnly={isProjLocked}
                />
                {!isTitlePrefixValid && projectTitle.trim() && (
                  <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1 animate-fadeIn">
                    ⚠️ Title must match the selected function/plant (starts with {expectedPrefixes[0] || ''})
                  </p>
                )}
                {titleStatus === 'checking' && (
                  <p className="text-slate-400 text-xs font-semibold mt-1.5 animate-pulse">Checking project title database...</p>
                )}
                {titleStatus === 'duplicate' && (
                  <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1 animate-fadeIn">
                    ⚠️ A project with this title has already been submitted.
                  </p>
                )}
                {titleStatus === 'ok' && (
                  <p className="text-green-500 text-xs font-semibold mt-1.5 flex items-center gap-1 animate-fadeIn">
                    ✓ Title is unique and available.
                  </p>
                )}
              </div>

              {/* Project Status */}
              <div>
                <label className="label">Project Status <span className="text-red-500">*</span> {isProjLocked && <Lock size={12} className="inline text-slate-400 ml-1" />}</label>
                <div className="relative">
                  <select
                    {...register('projectStatus', {
                      onChange: (e) => {
                        const status = e.target.value;
                        if (status === 'Live' || status === 'Completed') {
                          setValue('startDate', '');
                          setValue('endDate', '');
                        }
                      }
                    })}
                    className={`input-field appearance-none cursor-pointer ${isProjLocked ? 'bg-slate-100 cursor-not-allowed text-slate-500 opacity-70 pointer-events-none' : ''}`}
                  >
                    <option value="">Select Status</option>
                    {STATUSES.map(s => (
                      <option key={s} value={s} className="bg-white text-slate-900">{s === 'Live' ? 'Live / Completed' : s}</option>
                    ))}
                  </select>
                  {isProjLocked ? (
                    <Lock size={15} className="absolute right-3.5 top-3.5 text-slate-400" />
                  ) : (
                    <ChevronDown size={15} className="absolute right-3.5 top-3.5 text-slate-400 pointer-events-none" />
                  )}
                </div>

                {projectStatus && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${projectStatus === 'Planning' ? 'bg-blue-500' :
                        projectStatus === 'In Progress' ? 'bg-orange' :
                          projectStatus === 'Live' || projectStatus === 'Completed' ? 'bg-green-500' :
                            'bg-yellow-500'
                      }`} />
                    <span className={`text-xs font-semibold ${projectStatus === 'Planning' ? 'text-blue-500' :
                        projectStatus === 'In Progress' ? 'text-orange' :
                          projectStatus === 'Live' || projectStatus === 'Completed' ? 'text-green-600' :
                            'text-yellow-600'
                      }`}>{projectStatus === 'Live' ? 'Live / Completed' : projectStatus}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Dates — only for Planning, In Progress & On Hold */}
            {showDates && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="label">Start Date <span className="text-red-500">*</span> {isProjLocked && <Lock size={12} className="inline text-slate-400 ml-1" />}</label>
                  <input
                    {...register('startDate')}
                    type="date"
                    max={maxStartDate}
                    className={`input-field ${isProjLocked ? 'bg-slate-100 cursor-not-allowed text-slate-500 opacity-70' : ''}`}
                    readOnly={isProjLocked}
                  />
                </div>
                <div>
                  <label className="label">Expected End Date <span className="text-red-500">*</span> {isProjLocked && <Lock size={12} className="inline text-slate-400 ml-1" />}</label>
                  <input
                    {...register('endDate')}
                    type="date"
                    min={minEndDate}
                    className={`input-field ${isProjLocked ? 'bg-slate-100 cursor-not-allowed text-slate-500 opacity-70' : ''}`}
                    readOnly={isProjLocked}
                  />
                </div>
              </div>
            )}

            {/* Project Overview */}
            <div className="space-y-4">
              <div>
                <label className="label">Description (What is it?) <span className="text-red-500">*</span> {isProjLocked && <Lock size={12} className="inline text-slate-400 ml-1" />}</label>
                <textarea
                  {...register('whatIsIt')}
                  className={`input-field min-h-[80px] resize-y ${isProjLocked ? 'bg-slate-100 cursor-not-allowed text-slate-500 opacity-70' : ''}`}
                  readOnly={isProjLocked}
                  placeholder="Describe what the project / dashboard is..."
                />
              </div>

              {showOnHoldReason && (
                <div>
                  <label className="label">Why is it On Hold? {isProjLocked && <Lock size={12} className="inline text-slate-400 ml-1" />}</label>
                  <textarea
                    {...register('onHoldReason')}
                    className={`input-field min-h-[80px] resize-y ${isProjLocked ? 'bg-slate-100 cursor-not-allowed text-slate-500 opacity-70' : ''}`}
                    readOnly={isProjLocked}
                    placeholder="Describe the reason the project is currently on hold..."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Category-Specific Custom Details */}
          {category === 'AI Solution' && (
            <div className="card p-6 animate-fadeIn">
              <h3 className="section-title mb-4">
                <span className="w-1 h-5 bg-orange rounded-full inline-block mr-2 align-middle"></span>
                🧠 AI Solution Information {isProjLocked && <Lock size={15} className="inline text-slate-400 ml-1" />}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="label">AI Model Use Case & Business Case <span className="text-red-500">*</span></label>
                  <textarea
                    {...register('businessCase')}
                    className={`input-field min-h-[85px] resize-y ${isProjLocked ? 'bg-slate-100 cursor-not-allowed text-slate-500 opacity-70' : ''}`}
                    readOnly={isProjLocked}
                    placeholder="Describe the business problem, value proposition, and the AI model's use case..."
                  />
                </div>
              </div>
            </div>
          )}

          {category === 'Data Product' && (
            <div className="card p-6 animate-fadeIn">
              <h3 className="section-title mb-4">
                <span className="w-1 h-5 bg-orange rounded-full inline-block mr-2 align-middle"></span>
                📦 Data Product Information {isProjLocked && <Lock size={15} className="inline text-slate-400 ml-1" />}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="label">Data Product Value Proposition & Business Case <span className="text-red-500">*</span></label>
                  <textarea
                    {...register('businessCase')}
                    className={`input-field min-h-[85px] resize-y ${isProjLocked ? 'bg-slate-100 cursor-not-allowed text-slate-500 opacity-70' : ''}`}
                    readOnly={isProjLocked}
                    placeholder="Describe the data product's value, who uses it, and the business benefit..."
                  />
                </div>
              </div>
            </div>
          )}

          {category === 'Plants' && (
            <div className="card p-6 animate-fadeIn">
              <h3 className="section-title mb-4">
                <span className="w-1 h-5 bg-orange rounded-full inline-block mr-2 align-middle"></span>
                🏭 Plant Operational Details {isProjLocked && <Lock size={15} className="inline text-slate-400 ml-1" />}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="label">Operational Impact & Business Case <span className="text-red-500">*</span></label>
                  <textarea
                    {...register('businessCase')}
                    className={`input-field min-h-[85px] resize-y ${isProjLocked ? 'bg-slate-100 cursor-not-allowed text-slate-500 opacity-70' : ''}`}
                    readOnly={isProjLocked}
                    placeholder="Describe how this project impacts plant operations, efficiency gains, and costs..."
                  />
                </div>
                <div>
                  <label className="label">Systems & Machinery Tech Stack <span className="text-red-500">*</span></label>
                  <input
                    {...register('techStack')}
                    className={`input-field ${isProjLocked ? 'bg-slate-100 cursor-not-allowed text-slate-500 opacity-70' : ''}`}
                    readOnly={isProjLocked}
                    placeholder="e.g. SCADA, OPC-UA, Rockwell PLC, Ignition"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Escalation Matrix */}
          <div className="card p-6">
            <h3 className="section-title mb-4">
              <span className="w-1 h-5 bg-orange rounded-full inline-block mr-2 align-middle"></span>
              Escalation Matrix {isEscalationLocked && <Lock size={15} className="inline text-slate-400 ml-1" />}
            </h3>
            <p className="text-gray-400 text-xs mb-4">Provide two-level escalation contacts for this project.</p>

            {/* Level 1 */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-orange/10 text-orange text-xs font-bold flex items-center justify-center border border-orange/30">1</span>
                <span className="text-sm font-semibold text-slate-300">Level 1 — First Point of Escalation</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-8">
                <div>
                  <label className="label">Name <span className="text-red-500">*</span></label>
                  <input
                    {...register('escalation1Name')}
                    className={`input-field ${isEscalationLocked ? 'bg-slate-100 cursor-not-allowed text-slate-500 opacity-70' : ''}`}
                    readOnly={isEscalationLocked}
                    placeholder="e.g. John Smith"
                  />
                </div>
                <div>
                  <label className="label">Email ID <span className="text-xs text-orange font-normal ml-1">(@te.com only)</span> <span className="text-red-500">*</span></label>
                  <input
                    {...register('escalation1Email', {
                      pattern: {
                        value: /^[a-zA-Z0-9._%+-]+@te\.com$/i,
                        message: 'Must be a valid @te.com email'
                      }
                    })}
                    type="email"
                    className={`input-field ${isEscalationLocked ? 'bg-slate-100 cursor-not-allowed text-slate-500 opacity-70' : ''}`}
                    readOnly={isEscalationLocked}
                    placeholder="john@te.com"
                  />
                  {errors.escalation1Email && (
                    <p className="text-red-500 text-xs font-semibold mt-1">{errors.escalation1Email.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-700 my-4" />

            {/* Level 2 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center border border-slate-700">2</span>
                <span className="text-sm font-semibold text-slate-300">Level 2 — Second Point of Escalation</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-8">
                <div>
                  <label className="label">Name</label>
                  <input
                    {...register('escalation2Name')}
                    className={`input-field ${isEscalationLocked ? 'bg-slate-100 cursor-not-allowed text-slate-500 opacity-70' : ''}`}
                    readOnly={isEscalationLocked}
                    placeholder="e.g. Sarah Williams"
                  />
                </div>
                <div>
                  <label className="label">Email ID <span className="text-xs text-orange font-normal ml-1">(@te.com only)</span></label>
                  <input
                    {...register('escalation2Email', {
                      pattern: {
                        value: /^[a-zA-Z0-9._%+-]+@te\.com$/i,
                        message: 'Must be a valid @te.com email'
                      }
                    })}
                    type="email"
                    className={`input-field ${isEscalationLocked ? 'bg-slate-100 cursor-not-allowed text-slate-500 opacity-70' : ''}`}
                    readOnly={isEscalationLocked}
                    placeholder="sarah@te.com"
                  />
                  {errors.escalation2Email && (
                    <p className="text-red-500 text-xs font-semibold mt-1">{errors.escalation2Email.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Data Information - Only for Dashboard, AI Solution, and Data Product categories and not Planning status */}
          {['Dashboard', 'AI Solution', 'Data Product', 'Plants'].includes(category) && projectStatus && projectStatus !== 'Planning' && (
            <div className="card p-6 animate-fadeIn">
              <h3 className="section-title">
                <span className="w-1 h-5 bg-orange rounded-full inline-block mr-2 align-middle"></span>
                Data Information {isProjLocked && <Lock size={15} className="inline text-slate-400 ml-1" />}
              </h3>
              <div className="grid grid-cols-1 gap-4 mt-4">
                
                {/* Link - For Live & In Progress */}
                {(projectStatus === 'Live' || projectStatus === 'In Progress') && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="w-full sm:w-1/3 text-sm font-bold text-slate-400 uppercase">
                      {linkLabel} {projectStatus === 'Live' && <span className="text-red-500">*</span>}
                    </label>
                    <div className="flex-1">
                      <input
                        {...register('dashboardLink')}
                        className={`input-field ${isProjLocked ? 'bg-slate-100 cursor-not-allowed text-slate-500 opacity-70' : ''}`}
                        readOnly={isProjLocked}
                        placeholder="https://"
                        type="url"
                      />
                    </div>
                  </div>
                )}

                {/* Data Source - For In Progress & Live */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <label className="w-full sm:w-1/3 text-sm font-bold text-slate-400 uppercase">DATA SOURCE <span className="text-red-500">*</span></label>
                  <div className="flex-1">
                    <input
                      {...register('dataSource')}
                      className={`input-field ${isProjLocked ? 'bg-slate-100 cursor-not-allowed text-slate-500 opacity-70' : ''}`}
                      readOnly={isProjLocked}
                      placeholder="Enter data source (e.g. SAP, SQL Server)"
                    />
                  </div>
                </div>

                {/* Data Owner - For In Progress & Live */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <label className="w-full sm:w-1/3 text-sm font-bold text-slate-400 uppercase">DATA OWNER <span className="text-red-500">*</span></label>
                  <div className="flex-1">
                    <input
                      {...register('dataOwner')}
                      className={`input-field ${isProjLocked ? 'bg-slate-100 cursor-not-allowed text-slate-500 opacity-70' : ''}`}
                      readOnly={isProjLocked}
                      placeholder="Enter data owner"
                    />
                  </div>
                </div>

                {/* Data Developer - For In Progress & Live */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <label className="w-full sm:w-1/3 text-sm font-bold text-slate-400 uppercase">DATA DEVELOPER <span className="text-red-500">*</span></label>
                  <div className="flex-1">
                    <input
                      {...register('dataDeveloper')}
                      className={`input-field ${isProjLocked ? 'bg-slate-100 cursor-not-allowed text-slate-500 opacity-70' : ''}`}
                      readOnly={isProjLocked}
                      placeholder="Enter data developer"
                    />
                  </div>
                </div>

                {/* Developer - For In Progress & Live */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <label className="w-full sm:w-1/3 text-sm font-bold text-slate-400 uppercase">{developerLabel} <span className="text-red-500">*</span></label>
                  <div className="flex-1">
                    <input
                      {...register('dashboardDeveloper')}
                      className={`input-field ${isProjLocked ? 'bg-slate-100 cursor-not-allowed text-slate-500 opacity-70' : ''}`}
                      readOnly={isProjLocked}
                      placeholder={isDashboard ? "Enter dashboard developer" : "Enter application developer"}
                    />
                  </div>
                </div>

                {/* Data Validated By - For Live & In Progress */}
                {(projectStatus === 'Live' || projectStatus === 'In Progress') && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="w-full sm:w-1/3 text-sm font-bold text-slate-400 uppercase">{validatedByLabel} {projectStatus === 'Live' && <span className="text-red-500">*</span>}</label>
                    <div className="flex-1">
                      <input
                        {...register('dataValidatedBy')}
                        className={`input-field ${isProjLocked ? 'bg-slate-100 cursor-not-allowed text-slate-500 opacity-70' : ''}`}
                        readOnly={isProjLocked}
                        placeholder="Enter validated by"
                      />
                    </div>
                  </div>
                )}

                {/* Owner - For Live & In Progress */}
                {(projectStatus === 'Live' || projectStatus === 'In Progress') && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="w-full sm:w-1/3 text-sm font-bold text-slate-400 uppercase">
                      {ownerLabel} {projectStatus === 'Live' && <span className="text-red-500">*</span>}
                    </label>
                    <div className="flex-1">
                      <input
                        {...register('dashboardOwner')}
                        className={`input-field ${isProjLocked ? 'bg-slate-100 cursor-not-allowed text-slate-500 opacity-70' : ''}`}
                        readOnly={isProjLocked}
                        placeholder={isDashboard ? "Enter dashboard owner" : "Enter application owner"}
                      />
                    </div>
                  </div>
                )}

                {/* Last Validated & Drill Down - For Live & In Progress */}
                {(projectStatus === 'Live' || projectStatus === 'In Progress') && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="w-full sm:w-1/3 text-sm font-bold text-slate-400 uppercase">LAST VALIDATED {projectStatus === 'Live' && <span className="text-red-500">*</span>}</label>
                    <div className="flex-1 flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <input
                          {...register('lastValidated')}
                          type="date"
                          className={`input-field ${isProjLocked ? 'bg-slate-100 cursor-not-allowed text-slate-500 opacity-70' : ''}`}
                          readOnly={isProjLocked}
                        />
                      </div>
                      <div className="w-full sm:w-1/2 flex flex-col gap-2">
                        <select
                          value={isCustomSelected ? 'custom' : (stdOptions.includes(drillDownVal) ? drillDownVal : '')}
                          onChange={handleSelectChange}
                          className={`input-field cursor-pointer appearance-none ${isProjLocked ? 'bg-slate-100 cursor-not-allowed text-slate-500 opacity-70 pointer-events-none' : ''}`}
                          style={{
                            background: '#fafafa url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2364748b\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'/%3E%3C/svg%3E") no-repeat right 12px center',
                            paddingRight: '36px'
                          }}
                          disabled={isProjLocked}
                        >
                          <option value="">Select Drill Down {projectStatus === 'Live' && '*'}</option>
                          <option value="Data">Data</option>
                          {(projectStatus === 'Live' || projectStatus === 'Completed') && (
                            <>
                              {category === 'Dashboard' && <option value="Dashboard">Dashboard</option>}
                              {category === 'AI Solution' && <option value="AI Solution">AI Solution</option>}
                              {category === 'Data Product' && <option value="Data Product">Data Product</option>}
                              {category === 'Plants' && <option value="Plant">Plant</option>}
                            </>
                          )}
                          <option value="custom">Other (Add Custom...)</option>
                        </select>
                        {isCustomSelected && (
                          <input
                            type="text"
                            value={drillDownVal}
                            onChange={handleTextChange}
                            placeholder="Enter custom drill down"
                            className={`input-field ${isProjLocked ? 'bg-slate-100 cursor-not-allowed text-slate-500 opacity-70' : ''}`}
                            readOnly={isProjLocked}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Milestones Checklist for In Progress (Optional) */}
          {projectStatus === 'In Progress' && (
            <div className="card p-6 animate-fadeIn">
              <h3 className="section-title flex items-center justify-between">
                <span className="flex items-center">
                  <span className="w-1 h-5 bg-orange rounded-full inline-block mr-2 align-middle"></span>
                  🏁 Milestones (Optional)
                </span>
                {!isProjLocked && (
                  <button
                    type="button"
                    onClick={() => append({ name: '', targetDate: '' })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-orange hover:bg-orange/80 transition-all cursor-pointer"
                  >
                    + Add Milestone
                  </button>
                )}
              </h3>
              <p className="text-gray-400 text-xs mt-1 mb-4">Define milestones and target dates for this project.</p>

              {fields.length > 0 ? (
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex flex-col sm:flex-row gap-3 items-end sm:items-center bg-slate-50 p-3.5 rounded-xl border border-gray-200">
                      <div className="flex-grow w-full">
                        <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Milestone Name</label>
                        <input
                          {...register(`milestones.${index}.name`)}
                          className={`input-field ${isProjLocked ? 'bg-slate-100 cursor-not-allowed text-slate-500 opacity-70' : ''}`}
                          placeholder="e.g. Requirements Gathering, Database Setup"
                          readOnly={isProjLocked}
                        />
                      </div>
                      <div className="w-full sm:w-[180px]">
                        <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Target Date</label>
                        <input
                          type="date"
                          {...register(`milestones.${index}.targetDate`)}
                          className={`input-field ${isProjLocked ? 'bg-slate-100 cursor-not-allowed text-slate-500 opacity-70' : ''}`}
                          readOnly={isProjLocked}
                        />
                      </div>
                      {!isProjLocked && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-2 px-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                          title="Remove milestone"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 font-semibold border border-dashed border-gray-300 rounded-xl bg-slate-50/50">
                  No milestones added yet. Click "+ Add Milestone" to track progress steps.
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="card p-8 text-center text-slate-400 font-semibold border border-dashed border-navy-border bg-[#101E35]">
          Please select a Category above to load the submission form fields.
        </div>
      )}
    </div>
  );
}
