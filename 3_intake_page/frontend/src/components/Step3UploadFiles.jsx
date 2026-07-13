import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X, FileText, Image, Info, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Reusable info tooltip
function InfoTooltip({ lines }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex items-center ml-1">
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="cursor-pointer text-slate-400 hover:text-orange transition-colors"
      >
        <Info size={14} />
      </span>
      {show && (
        <span
          className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-slate-800 text-white text-xs font-medium rounded-xl px-3 py-2.5 shadow-xl pointer-events-none leading-relaxed"
          style={{ textTransform: 'none', letterSpacing: 'normal' }}
        >
          {lines.map((line, i) => (
            <span key={i} className="flex items-start gap-1.5 mb-1 last:mb-0">
              <span className="text-orange mt-0.5">•</span>
              <span>{line}</span>
            </span>
          ))}
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-800" />
        </span>
      )}
    </span>
  );
}

function MultiDocDropzone({ label, icon: Icon, tooltipLines, accept, maxSize, maxFiles, value, onChange, hint, showImagePreview, required, error, disabled }) {
  const onDrop = useCallback((accepted, rejected) => {
    if (rejected.length > 0) {
      toast.error(`${rejected[0].errors[0].message}`);
    }
    const total = [...(value || []), ...accepted];
    if (total.length > maxFiles) {
      toast.error(`Max ${maxFiles} files allowed`);
      onChange(total.slice(0, maxFiles));
    } else {
      onChange(total);
    }
  }, [value, onChange, maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept, maxSize, multiple: true,
    disabled: disabled,
  });

  const remove = (idx) => {
    onChange((value || []).filter((_, i) => i !== idx));
  };

  return (
    <div>
      {/* Label row — InfoTooltip is OUTSIDE label to avoid text-transform: uppercase */}
      <div className="flex items-center gap-1 mb-1.5">
        <label className="label mb-0 flex items-center gap-2">
          <Icon size={14} className="text-orange" />
          {label}
          {required && <span className="text-orange">*</span>}
          {disabled && <Lock size={12} className="text-slate-400 ml-1 inline" />}
        </label>
        <InfoTooltip lines={tooltipLines} />
      </div>

      <div {...getRootProps()} className={`dropzone-area ${isDragActive ? 'active' : ''} ${error ? 'border-red-400 bg-red-50' : ''} ${disabled ? 'bg-slate-800/40 border-navy-border cursor-not-allowed opacity-60 pointer-events-none' : ''}`}>
        <input {...getInputProps()} />
        {disabled ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center shadow-sm border border-navy-border">
              <Lock size={22} className="text-slate-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-bold">Upload Locked by Administrator</p>
              <p className="text-xs text-slate-500 font-medium mt-1">This section is not authorized for changes.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange/10 flex items-center justify-center shadow-sm">
              <UploadCloud size={22} className="text-orange" />
            </div>
            <div>
              <p className="text-sm text-slate-700 font-bold">
                {isDragActive ? 'Drop the files here!' : 'Drag & drop or click to upload'}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-1">{hint}</p>
            </div>
          </div>
        )}
      </div>

      {/* Uploaded file list */}
      {value && value.length > 0 && (
        <div className="mt-4 space-y-2">
          {value.map((file, i) => (
            <div key={i} className="flex items-center justify-between bg-white shadow-sm border border-gray-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Image thumbnail or PDF icon */}
                {showImagePreview ? (
                  <ImageThumb file={file} />
                ) : (
                  <div className="bg-red-50 p-2 rounded-lg flex-shrink-0">
                    <FileText size={16} className="text-red-500 flex-shrink-0" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-800 font-semibold truncate">{file.name}</p>
                  <p className="text-xs text-slate-500 font-medium">{formatBytes(file.size)}</p>
                </div>
              </div>
              {!disabled && (
                <button type="button" onClick={() => remove(i)} className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0 ml-3">
                  <X size={18} />
                </button>
              )}
            </div>
          ))}

          {/* Total size indicator for images */}
          {showImagePreview && value.length > 1 && (
            <div className="flex items-center justify-end gap-2 pt-1">
              <span className="text-xs text-slate-400 font-medium">Total:</span>
              <span className="text-xs font-bold text-orange">
                {formatBytes(value.reduce((sum, f) => sum + f.size, 0))}
              </span>
            </div>
          )}
        </div>
      )}
      {/* Required error */}
      {error && (
        <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1 font-medium">⚠ {error}</p>
      )}
    </div>
  );
}

// Tiny thumbnail for image files
function ImageThumb({ file }) {
  const url = useState(() => URL.createObjectURL(file))[0];
  return (
    <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 bg-slate-100">
      <img src={url} alt={file.name} className="w-full h-full object-cover" />
    </div>
  );
}

export default function Step3UploadFiles({ watch, setValue, uploadErrors, setUploadErrors, hasExistingImages, hasExistingDocs, setHasExistingImages, setHasExistingDocs, isFieldLocked }) {
  const dashboardImages = watch('dashboardImages') || [];
  const documents = watch('documents') || [];
  const dashboardImagesError = uploadErrors?.dashboardImages || '';
  const documentsError = uploadErrors?.documents || '';

  const category = watch('category') || '';
  const isDashboard = category === 'Dashboard';
  const isPlants = category === 'Plants';
  const imageLabel = isDashboard ? 'Dashboard Images' : (isPlants ? 'Plant Images' : 'Application Images');
  const coverLabelText = isDashboard ? 'dashboard cover' : (isPlants ? 'plant cover' : 'application cover');

  const uploadedFiles = watch('uploaded_files') || [];

  const isImageLocked = isFieldLocked('image');
  const isDocLocked = isFieldLocked('document');

  const handleDeleteExisting = async (file) => {
    const projectId = watch('project_id');
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

      // Update parent indicators
      const hasImg = updated.some(f => f.file_type === 'image');
      const hasDoc = updated.some(f => f.file_type === 'document');
      setHasExistingImages(hasImg);
      setHasExistingDocs(hasDoc);
    } catch (e) {
      console.error(e);
      toast.error('Could not delete file');
    }
  };

  return (
    <div className="animate-fadeIn space-y-6">
      <div>
        <h2 className="font-sora font-bold text-2xl text-white">Upload Files</h2>
        <p className="text-gray-400 text-sm mt-1">Upload your project assets. Ensure files meet the size and format requirements.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Dashboard/Application Images */}
        <div className="card p-5">
          <MultiDocDropzone
            label={imageLabel}
            icon={Image}
            required={true}
            error={dashboardImages.length === 0 && !hasExistingImages ? dashboardImagesError : null}
            tooltipLines={[
              'Accepted formats: JPG, JPEG, PNG',
              'Max file size: 5 MB per image',
              'Up to 2 images allowed',
              `First image used as the ${coverLabelText}`,
            ]}
            accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] }}
            maxSize={5 * 1024 * 1024}
            maxFiles={2}
            value={dashboardImages}
            onChange={v => { setValue('dashboardImages', v); setUploadErrors(e => ({ ...e, dashboardImages: '' })); }}
            hint={hasExistingImages ? "JPG / PNG · Max 5 MB · (Optional: Upload new files to replace existing)" : "JPG / PNG · Max 5 MB · Up to 2 images"}
            showImagePreview={true}
            disabled={isImageLocked}
          />
          {hasExistingImages && dashboardImages.length === 0 && (
            <p className="text-xs text-green-600 font-semibold mt-2 flex items-center gap-1">
              ✓ Using previously uploaded images.
            </p>
          )}

          {/* List of already uploaded images */}
          {hasExistingImages && (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Already Uploaded Images:</p>
              <div className="space-y-2">
                {uploadedFiles.filter(f => f.file_type === 'image').map((file, i) => (
                  <div key={i} className="flex items-center justify-between bg-[#15263c] border border-navy-border rounded-xl px-4 py-2.5">
                    <span className="text-xs text-slate-300 font-semibold truncate flex-1">{file.file_name}</span>
                    {!isImageLocked && (
                      <button
                        type="button"
                        onClick={() => handleDeleteExisting(file)}
                        className="text-slate-400 hover:text-red-500 transition-colors ml-2"
                        title="Delete file permanently"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Project Documents — PDF only */}
        <div className="card p-5">
          <MultiDocDropzone
            label="Project Documents"
            icon={FileText}
            required={true}
            error={documents.length === 0 && !hasExistingDocs ? documentsError : null}
            tooltipLines={[
              'Accepted format: PDF only',
              'Max file size: 10 MB per file',
              'Up to 3 PDF files allowed',
            ]}
            accept={{ 'application/pdf': ['.pdf'] }}
            maxSize={10 * 1024 * 1024}
            maxFiles={3}
            value={documents}
            onChange={v => { setValue('documents', v); setUploadErrors(e => ({ ...e, documents: '' })); }}
            hint={hasExistingDocs ? "PDF only · Max 10 MB · (Optional: Upload new files to replace existing)" : "PDF only · Max 10 MB · Up to 3 files"}
            showImagePreview={false}
            disabled={isDocLocked}
          />
          {hasExistingDocs && documents.length === 0 && (
            <p className="text-xs text-green-600 font-semibold mt-2 flex items-center gap-1">
              ✓ Using previously uploaded project documents.
            </p>
          )}

          {/* List of already uploaded documents */}
          {hasExistingDocs && (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Already Uploaded Documents:</p>
              <div className="space-y-2">
                {uploadedFiles.filter(f => f.file_type === 'document').map((file, i) => (
                  <div key={i} className="flex items-center justify-between bg-[#15263c] border border-navy-border rounded-xl px-4 py-2.5">
                    <span className="text-xs text-slate-300 font-semibold truncate flex-1">{file.file_name}</span>
                    {!isDocLocked && (
                      <button
                        type="button"
                        onClick={() => handleDeleteExisting(file)}
                        className="text-slate-400 hover:text-red-500 transition-colors ml-2"
                        title="Delete file permanently"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
