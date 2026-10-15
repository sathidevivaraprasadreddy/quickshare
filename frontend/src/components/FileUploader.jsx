import React, { useRef, useState } from 'react';
import { UploadCloud, FolderPlus, AlertCircle, FilePlus2 } from 'lucide-react';

const MAX_FILE_SIZE_MB = 50;
const MAX_FILES_COUNT = 10;

export default function FileUploader({ onFilesSelected, onError }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateAndAddFiles = (incomingFiles) => {
    if (!incomingFiles || incomingFiles.length === 0) return;

    const fileList = Array.from(incomingFiles);

    if (fileList.length > MAX_FILES_COUNT) {
      onError(`You can only upload up to ${MAX_FILES_COUNT} files per session.`);
      return;
    }

    const oversized = fileList.filter(
      (f) => f.size > MAX_FILE_SIZE_MB * 1024 * 1024
    );

    if (oversized.length > 0) {
      onError(
        `File "${oversized[0].name}" exceeds the ${MAX_FILE_SIZE_MB}MB size limit.`
      );
      return;
    }

    onFilesSelected(fileList);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    validateAndAddFiles(e.dataTransfer.files);
  };

  const handleFileInputChange = (e) => {
    validateAndAddFiles(e.target.files);
    // Reset file input value so selecting the same file again triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 select-none ${
        isDragging
          ? 'border-rose-500 bg-rose-50/50 scale-[1.01]'
          : 'border-slate-300 hover:border-rose-400 bg-white hover:bg-slate-50/50 shadow-sm'
      }`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        multiple
        className="hidden"
      />

      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 shadow-sm group-hover:scale-110 transition-transform">
        <UploadCloud className="w-8 h-8" />
      </div>

      <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-1">
        Drag & drop your files here
      </h3>
      <p className="text-sm text-slate-500 mb-5">
        or <span className="text-rose-600 font-medium hover:underline">browse files</span> from your computer or phone
      </p>

      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100/90 text-xs font-medium text-slate-600">
        <span>Up to {MAX_FILES_COUNT} files</span>
        <span>•</span>
        <span>Max {MAX_FILE_SIZE_MB}MB per file</span>
      </div>
    </div>
  );
}
