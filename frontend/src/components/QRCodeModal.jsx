import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Smartphone, ExternalLink } from 'lucide-react';

export default function QRCodeModal({ url, onClose }) {
  if (!url) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Smartphone className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-1">
          Scan to Download
        </h3>
        <p className="text-xs text-slate-500 mb-6 px-2">
          Point your phone camera at this QR code to open the download link instantly.
        </p>

        {/* QR Code Container */}
        <div className="bg-slate-50 p-5 rounded-2xl inline-block border border-slate-200/60 shadow-inner mb-6">
          <QRCodeSVG
            value={url}
            size={200}
            level="M"
            includeMargin={false}
          />
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between text-left">
          <p className="text-xs text-slate-600 truncate font-mono select-all pr-2">
            {url}
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-rose-600 hover:text-rose-700 p-1 rounded-md shrink-0"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
