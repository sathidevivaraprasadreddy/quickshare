import React, { useEffect, useState } from 'react';
import {
  Download,
  FolderArchive,
  Clock,
  Layers,
  HardDrive,
  AlertTriangle,
  FileQuestion,
  Loader2,
  FileText,
  Image,
  Film,
  Music,
  Archive,
  File,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import {
  getSession,
  getSingleFileDownloadUrl,
  getZipDownloadUrl
} from '../services/api';
import { formatFileSize, formatTimeRemaining } from '../utils/formatters';

function getFileIcon(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
    return <Image className="w-5 h-5 text-purple-500" />;
  }
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
    return <Film className="w-5 h-5 text-blue-500" />;
  }
  if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) {
    return <Music className="w-5 h-5 text-amber-500" />;
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return <Archive className="w-5 h-5 text-yellow-600" />;
  }
  if (['pdf', 'doc', 'docx', 'txt', 'md', 'csv', 'xlsx'].includes(ext)) {
    return <FileText className="w-5 h-5 text-rose-500" />;
  }
  return <File className="w-5 h-5 text-slate-400" />;
}

export default function DownloadView({ token, onBackToUpload }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [files, setFiles] = useState([]);
  const [errorStatus, setErrorStatus] = useState(null); // 'expired' | 'revoked' | 'notfound' | message
  const [downloadingFileId, setDownloadingFileId] = useState(null);

  useEffect(() => {
    async function fetchSession() {
      if (!token) return;
      setLoading(true);
      setErrorStatus(null);
      try {
        const data = await getSession(token);
        if (data.success) {
          setSession(data.session);
          setFiles(data.files);
        } else {
          setErrorStatus('notfound');
        }
      } catch (err) {
        if (err.response) {
          if (err.response.data?.isRevoked) {
            setErrorStatus('revoked');
          } else if (err.response.data?.isExpired) {
            setErrorStatus('expired');
          } else if (err.response.status === 404) {
            setErrorStatus('notfound');
          } else {
            setErrorStatus(err.response.data?.error || 'Failed to load file session.');
          }
        } else {
          setErrorStatus('Network error connecting to QuickShare server.');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
  }, [token]);

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-12 text-center animate-fade-in">
        <Loader2 className="w-10 h-10 text-rose-600 animate-spin mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-800">
          Fetching shared files...
        </h3>
        <p className="text-xs text-slate-400 mt-1">Please wait a moment</p>
      </div>
    );
  }

  // Error: Expired or Revoked or Not Found
  if (errorStatus) {
    let title = 'File Unavailable';
    let description = 'This sharing session could not be found.';
    let icon = <FileQuestion className="w-8 h-8 text-slate-400" />;
    let iconBg = 'bg-slate-100';

    if (errorStatus === 'revoked') {
      title = 'Link Revoked';
      description = 'The owner of these files has cancelled the sharing link and deleted the files.';
      icon = <AlertTriangle className="w-8 h-8 text-amber-500" />;
      iconBg = 'bg-amber-50';
    } else if (errorStatus === 'expired') {
      title = 'Link Expired';
      description = 'This sharing link has passed its expiration time and files were safely removed.';
      icon = <Clock className="w-8 h-8 text-rose-500" />;
      iconBg = 'bg-rose-50';
    } else if (typeof errorStatus === 'string' && errorStatus !== 'notfound') {
      description = errorStatus;
    }

    return (
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-8 sm:p-10 text-center animate-fade-in max-w-md mx-auto">
        <div className={`w-16 h-16 ${iconBg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
          {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-6">{description}</p>
        <button
          onClick={onBackToUpload}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Upload your own files</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 animate-fade-in space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100 mb-2 inline-block">
            QuickShare Transfer
          </span>
          <h2 className="text-2xl font-bold text-slate-900">
            {files.length === 1 ? '1 File Ready to Download' : `${files.length} Files Ready to Download`}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Available until {new Date(session.expiresAt).toLocaleDateString()} ({formatTimeRemaining(session.expiresAt)})
          </p>
        </div>

        {/* Primary Download All Action if multiple files */}
        {files.length > 1 && (
          <a
            href={getZipDownloadUrl(token)}
            download
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white font-medium text-sm px-5 py-2.5 rounded-xl shadow-md shadow-rose-500/20 hover:shadow-lg transition-all active:scale-[0.99]"
          >
            <FolderArchive className="w-4 h-4" />
            <span>Download All as ZIP</span>
          </a>
        )}
      </div>

      {/* Summary statistics */}
      <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
        <div className="text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-1 text-[11px] font-medium text-slate-500 mb-1">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Files</span>
          </div>
          <p className="text-sm sm:text-base font-bold text-slate-800">
            {files.length}
          </p>
        </div>

        <div className="text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-1 text-[11px] font-medium text-slate-500 mb-1">
            <HardDrive className="w-3.5 h-3.5 text-slate-400" />
            <span>Total Size</span>
          </div>
          <p className="text-sm sm:text-base font-bold text-slate-800">
            {formatFileSize(session.totalSizeBytes)}
          </p>
        </div>

        <div className="text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-1 text-[11px] font-medium text-slate-500 mb-1">
            <Clock className="w-3.5 h-3.5 text-rose-500" />
            <span>Expires</span>
          </div>
          <p className="text-sm sm:text-base font-bold text-slate-800 truncate">
            {formatTimeRemaining(session.expiresAt)}
          </p>
        </div>
      </div>

      {/* Files List */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Files in this session
        </h4>
        <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden">
          {files.map((file) => (
            <div
              key={file.id}
              className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0 pr-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  {getFileIcon(file.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>

              <a
                href={getSingleFileDownloadUrl(token, file.id)}
                download={file.name}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 text-xs font-semibold transition-colors shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Link to Send files */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <button
          onClick={onBackToUpload}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Upload files</span>
        </button>

        <span className="text-xs text-slate-400">
          Powered by QuickShare
        </span>
      </div>
    </div>
  );
}
