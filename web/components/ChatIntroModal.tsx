'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  FileText,
  DollarSign,
  Lock,
  X,
  ArrowRight,
  Info
} from 'lucide-react';
import { Language, translations } from '../lib/translations';

interface ChatIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  lang?: Language;
}

export default function ChatIntroModal({
  isOpen,
  onClose,
  onProceed,
  lang = 'uz',
}: ChatIntroModalProps) {
  const t = translations[lang] || translations.uz;
  const [dontShowAgain, setDontShowAgain] = useState(true);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (dontShowAgain && typeof window !== 'undefined') {
      try {
        localStorage.setItem('workhub_chat_intro_seen', 'true');
      } catch (_) {}
    }
    onProceed();
  };

  const tasks = [
    {
      icon: MessageSquare,
      color: 'from-blue-500 to-indigo-600',
      textColor: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900',
      title: t.chatTask1Title,
      desc: t.chatTask1Desc,
    },
    {
      icon: FileText,
      color: 'from-emerald-500 to-teal-600',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900',
      title: t.chatTask2Title,
      desc: t.chatTask2Desc,
    },
    {
      icon: DollarSign,
      color: 'from-amber-500 to-orange-600',
      textColor: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900',
      title: t.chatTask3Title,
      desc: t.chatTask3Desc,
    },
    {
      icon: ShieldCheck,
      color: 'from-purple-500 to-pink-600',
      textColor: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-900',
      title: t.chatTask4Title,
      desc: t.chatTask4Desc,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Banner */}
        <div className="relative p-6 bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 text-white shrink-0 overflow-hidden">
          <div className="absolute -right-12 -top-12 w-44 h-44 bg-blue-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-44 h-44 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition backdrop-blur-sm"
          >
            <X size={18} />
          </button>

          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-[11px] font-black uppercase tracking-wider text-blue-200">
              <Info size={13} />
              <span>{t.chatIntroBadge}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
              {t.chatIntroTitle}
            </h2>

            <p className="text-xs text-blue-100/90 leading-relaxed font-medium">
              {t.chatIntroSubtitle}
            </p>
          </div>
        </div>

        {/* Content: 4 Key Objectives / Tasks */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-3 flex-1">
          {tasks.map((task, idx) => {
            const Icon = task.icon;
            return (
              <div
                key={idx}
                className={`p-3.5 sm:p-4 rounded-2xl border transition flex items-start gap-3.5 ${task.bgColor}`}
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${task.color} text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5`}
                >
                  <Icon size={18} />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                    {task.title}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {task.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-400 font-semibold self-start sm:self-center">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
            />
            <span>{t.chatIntroDontShowAgain}</span>
          </label>

          <button
            onClick={handleConfirm}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition active:scale-95"
          >
            <span>{t.chatIntroBtn}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
