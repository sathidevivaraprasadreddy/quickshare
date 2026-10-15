import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import FileUploader from './components/FileUploader';
import FileList from './components/FileList';
import ShareResult from './components/ShareResult';
import DownloadView from './components/DownloadView';
import QRCodeModal from './components/QRCodeModal';
import { uploadFiles, revokeSession, checkHealth } from './services/api';
import { AlertCircle, CheckCircle, ShieldCheck, Zap, Lock, RefreshCw } from 'lucide-react';

export default function App() {
  const [tokenParam, setTokenParam] = useState(null);
  const [files, setFiles] = useState([]);
  const [expiryHours, setExpiryHours] = useState(24);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [shareResult, setShareResult] = useState(null);
  const [qrModalUrl, setQrModalUrl] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successNotification, setSuccessNotification] = useState(null);
  const [serverHealthy, setServerHealthy] = useState(null);

  // Check URL query parameters for token (e.g. ?token=abc)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setTokenParam(token);
    }

    // Health check
    async function verifyBackend() {
      try {
        const res = await checkHealth();
        if (res.status === 'ok') {
          setServerHealthy(true);
        } else {
          setServerHealthy(false);
        }
      } catch (err) {
        setServerHealthy(false);
      }
    }
    verifyBackend();
  }, []);

  // Clear notifications after timeout
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  useEffect(() => {
    if (successNotification) {
      const timer = setTimeout(() => setSuccessNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successNotification]);

  const handleFilesSelected = (newFiles) => {
    setErrorMessage(null);
    setFiles((prev) => {
      // Append without duplicate filenames
      const existingNames = new Set(prev.map((f) => f.name));
      const filtered = newFiles.filter((f) => !existingNames.has(f.name));
      return [...prev, ...filtered];
    });
  };

  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearFiles = () => {
    setFiles([]);
    setErrorMessage(null);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setUploadProgress(0);
    setErrorMessage(null);

    try {
      const result = await uploadFiles(files, expiryHours, (progress) => {
        setUploadProgress(progress);
      });

      if (result.success) {
        setShareResult(result);
        setFiles([]);
      } else {
        setErrorMessage(result.error || 'Failed to upload files.');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Error uploading files.';
      setErrorMessage(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleRevoke = async (shareToken, revokeToken) => {
    try {
      const res = await revokeSession(shareToken, revokeToken);
      if (res.success) {
        setSuccessNotification('Sharing session has been revoked and files deleted.');
        setShareResult(null);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.error || 'Failed to revoke session.');
    }
  };

  const handleResetToUpload = () => {
    // Clear URL query param if present
    const url = new URL(window.location.href);
    url.searchParams.delete('token');
    window.history.pushState({}, '', url.pathname);

    setTokenParam(null);
    setShareResult(null);
    setFiles([]);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100">
      {/* Navigation */}
      <Navbar onReset={handleResetToUpload} serverHealthy={serverHealthy} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center">
        {/* Alerts / Notifications */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200/90 text-rose-700 flex items-start gap-3 shadow-sm animate-fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
            <div className="text-xs sm:text-sm font-medium flex-1">{errorMessage}</div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-700 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {successNotification && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3 shadow-sm animate-fade-in">
            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
            <div className="text-xs sm:text-sm font-medium flex-1">{successNotification}</div>
          </div>
        )}

        {/* View Switch: Receiver (DownloadView) vs Sender (Upload/ShareResult) */}
        {tokenParam ? (
          <DownloadView
            token={tokenParam}
            onBackToUpload={handleResetToUpload}
          />
        ) : shareResult ? (
          <ShareResult
            result={shareResult}
            onReset={handleResetToUpload}
            onShowQR={(url) => setQrModalUrl(url)}
            onRevoke={handleRevoke}
          />
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Header intro */}
            <div className="text-center space-y-2 mb-2">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Send files instantly.
              </h1>
              <p className="text-sm sm:text-base text-slate-500 max-w-md mx-auto">
                No account required. Auto-expires automatically. ₹0 free ephemeral file sharing.
              </p>
            </div>

            {/* Drag & drop upload area */}
            <FileUploader
              onFilesSelected={handleFilesSelected}
              onError={(msg) => setErrorMessage(msg)}
            />

            {/* Selected files list & controls */}
            {files.length > 0 && (
              <FileList
                files={files}
                onRemoveFile={handleRemoveFile}
                onClearFiles={handleClearFiles}
                onUpload={handleUpload}
                uploading={uploading}
                uploadProgress={uploadProgress}
                expiryHours={expiryHours}
                setExpiryHours={setExpiryHours}
              />
            )}

            {/* Feature Highlights */}
            {files.length === 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6">
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800">Lightning Fast</h5>
                    <p className="text-[11px] text-slate-500">Direct streaming transfer</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800">Private & Secure</h5>
                    <p className="text-[11px] text-slate-500">Cryptographic tokens</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800">Auto Cleanup</h5>
                    <p className="text-[11px] text-slate-500">Deletes after expiration</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* QR Code Modal */}
      {qrModalUrl && (
        <QRCodeModal
          url={qrModalUrl}
          onClose={() => setQrModalUrl(null)}
        />
      )}

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200/80 bg-white/60 text-center text-xs text-slate-400">
        <p>QuickShare • Free & Open Source Ephemeral File Sharing</p>
      </footer>
    </div>
  );
}
