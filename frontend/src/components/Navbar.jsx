import React from 'react';
import { Send, Shield, Zap } from 'lucide-react';

export default function Navbar({ onReset, serverHealthy }) {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={onReset}
          className="flex items-center gap-2.5 text-left group transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
            <Send className="w-5 h-5 -rotate-12 translate-x-0.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-slate-900 tracking-tight">QuickShare</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200/60">
                ₹0 Free
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Fast, ephemeral & secure file sharing</p>
          </div>
        </button>

        {/* Right Info Badges */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100/80 px-2.5 py-1.5 rounded-full border border-slate-200/60">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>End-to-end Ephemeral</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border bg-slate-50 border-slate-200 text-slate-600">
            <span
              className={`w-2 h-2 rounded-full ${
                serverHealthy === true
                  ? 'bg-emerald-500 animate-pulse'
                  : serverHealthy === false
                  ? 'bg-amber-500'
                  : 'bg-slate-400'
              }`}
            />
            <span className="font-medium text-[11px]">
              {serverHealthy === true ? 'Backend Ready' : serverHealthy === false ? 'Connecting...' : 'Checking'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
