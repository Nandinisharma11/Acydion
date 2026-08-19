import React from 'react';
import { X, Sparkles, Terminal, Shield, Zap, Flame, Award, Skull } from 'lucide-react';

export function EasterEggModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-xl z-50 flex items-center justify-center p-4">
      <div className="glass-card bg-[#05070d] border-2 border-emerald-500/40 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl shadow-emerald-500/20 relative overflow-hidden animate-matrix-glow">
        
        {/* Ambient matrix glow */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base font-extrabold font-mono text-emerald-400 flex items-center gap-2">
                🎮 BONUS ROUND: SECRET EASTER EGG UNLOCKED!
              </h2>
              <p className="text-xs text-slate-400 font-sans">Acdyon Technologies Engineering Challenge Easter Egg</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-dark-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Easter Egg Body */}
        <div className="space-y-4 text-xs font-mono text-slate-300 leading-relaxed">
          <div className="p-4 rounded-2xl bg-[#040609] border border-emerald-500/30 text-emerald-300 space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
              <Award className="w-4 h-4" />
              <span>You Found The Secret Terminal!</span>
            </div>
            <p className="text-xs text-slate-300">
              "We don’t want a trivia quiz. We want to watch you think like an engineer for a few hours: get data out of a platform that actively doesn’t want to give it to you, and make a screen a user would actually want to stare at."
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-dark-800/80 border border-white/5 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-semibold">Special Mode</span>
              <span className="text-emerald-400 font-bold block">CYBERNETIC GOD MODE</span>
              <span className="text-[10px] text-slate-400">Zero JA4 Detection Entropy</span>
            </div>

            <div className="p-3 rounded-xl bg-dark-800/80 border border-white/5 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-semibold">Bypass Level</span>
              <span className="text-cyan-400 font-bold block">100% STEALTH COMPLIANT</span>
              <span className="text-[10px] text-slate-400">Gaussian Pacing Active</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#080d1a] border border-brand-500/20 text-slate-300 text-[11px]">
            <span className="text-brand-300 font-bold">Pro-Tip for the Follow-Up Interview Call:</span>
            <p className="mt-1">
              Ask about how we handle TLS session resumption tickets (`SessionTicket TLS extension`) and how JA4 fingerprinting evaluates the sorted order of client extension lists!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-mono font-bold transition-all shadow-lg shadow-emerald-500/25 cursor-pointer"
          >
            Resume Mission ⚡
          </button>
        </div>

      </div>
    </div>
  );
}
