'use client';

import React from 'react';
import { Sparkles, CheckCircle2, Download, Pencil, Plus, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { Language, translations } from '../lib/translations';
import { downloadResumeAsPDF } from '../lib/resumePdf';

interface ResumeProgressCardProps {
  user: any;
  resume: any | null;
  onOpenCreateResume: () => void;
  onEditResume?: (resume: any) => void;
  lang?: Language;
  className?: string;
}

export function calculateResumeScore(resume: any, user: any) {
  if (!resume) {
    return { score: 0, missing: ['Rezyume yaratilmagan'] };
  }

  let score = 0;
  const missing: string[] = [];

  if (resume.title && resume.title.trim().length > 2) {
    score += 25;
  } else {
    missing.push('Kasbiy lavozim');
  }

  if (resume.summary && resume.summary.trim().length >= 40) {
    score += 35;
  } else if (resume.summary && resume.summary.trim().length > 0) {
    score += 15;
    missing.push('To‘liq tajriba va ko‘nikmalar');
  } else {
    missing.push('Tajriba va ko‘nikmalar');
  }

  const hasPhone = Boolean(resume.phone || user?.phone);
  if (hasPhone) {
    score += 20;
  } else {
    missing.push('Telefon raqam');
  }

  const hasLocation = Boolean(resume.location || user?.location);
  if (hasLocation) {
    score += 10;
  } else {
    missing.push('Joylashuv');
  }

  if (resume.file_url) {
    score += 10;
  }

  score = Math.min(100, Math.max(0, score));
  return { score, missing };
}

export default function ResumeProgressCard({
  user,
  resume,
  onOpenCreateResume,
  onEditResume,
  lang = 'uz',
  className = '',
}: ResumeProgressCardProps) {
  // If company, don't show candidate resume card
  if (user && (user.account_type === 'company' || user.role === 'employer')) {
    return null;
  }

  const { score, missing } = calculateResumeScore(resume, user);
  const isComplete = score >= 90;
  const hasResume = Boolean(resume?.id);

  const handleDownload = () => {
    if (!resume) return;
    downloadResumeAsPDF({
      title: resume.title || 'Kasbiy rezyume',
      fullName: resume.full_name || user?.name || 'Nomzod',
      phone: resume.phone || user?.phone || '',
      email: resume.email || user?.email || '',
      location: resume.location || user?.location || '',
      summary: resume.summary || '',
    });
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all shadow-xs ${
        !hasResume
          ? 'bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-blue-50/90 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-blue-950/40 border-blue-200/80 dark:border-blue-900/60'
          : isComplete
          ? 'bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-emerald-50/90 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-emerald-950/30 border-emerald-200/80 dark:border-emerald-900/60'
          : 'bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-amber-50/90 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-amber-950/30 border-amber-200/80 dark:border-amber-900/60'
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left Info & Progress Bar */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between sm:justify-start gap-2.5">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isComplete ? 'bg-emerald-500 animate-pulse' : hasResume ? 'bg-amber-500' : 'bg-blue-600'}`} />
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                {!hasResume
                  ? 'Rezyumengiz hali to‘ldirilmagan'
                  : isComplete
                  ? 'Rezyumengiz to‘liq tayyor'
                  : 'Rezyumengiz qisman to‘ldirilgan'}
              </h4>
            </div>

            <span
              className={`text-xs font-black px-2 py-0.5 rounded-full ${
                isComplete
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  : hasResume
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                  : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
              }`}
            >
              {score}%
            </span>
          </div>

          {/* Progress Bar Line */}
          <div className="w-full bg-slate-200/80 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isComplete
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : hasResume
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600'
              }`}
              style={{ width: `${Math.max(6, score)}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            {!hasResume ? (
              <span>Ish beruvchilardan tezkor takliflar olish va arizalarni 1-bosishda yuborish uchun rezyumengizni shakllantiring.</span>
            ) : isComplete ? (
              <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300 font-semibold">
                <CheckCircle2 size={13} className="shrink-0" />
                Barcha asosiy bo‘limlar to‘ldirilgan. Siz vakansiyalarga to‘g‘ridan-to‘g‘ri ariza topshira olasiz.
              </span>
            ) : (
              <span>
                To‘liqroq rezyumega ega nomzodlar suhbatga 3 barobar ko‘proq taklif qilinadi. {missing.length > 0 && `(Yetishmayapti: ${missing.slice(0, 2).join(', ')})`}
              </span>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
          {!hasResume ? (
            <button
              onClick={onOpenCreateResume}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles size={14} className="animate-pulse" />
              <span>AI bilan rezyume yaratish</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleDownload}
                title="PDF qilib yuklab olish"
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Download size={14} className="text-blue-600 dark:text-blue-400" />
                <span className="hidden xs:inline">PDF</span>
              </button>

              <button
                onClick={() => onEditResume?.(resume)}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Pencil size={13} />
                <span>Tahrirlash</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
