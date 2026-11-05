'use client';

import React from 'react';
import { Send, ExternalLink, CheckCircle2, Sparkles, Plus, Briefcase, FileText } from 'lucide-react';
import { Language, translations } from '../lib/translations';
import RecommendationsWidget from './RecommendationsWidget';
import ResumeProgressCard from './ResumeProgressCard';

interface RightSidebarProps {
  vacanciesCount: number;
  user?: any;
  resume?: any | null;
  onSelectVacancy?: (vacancy: any) => void;
  onOpenProfile?: () => void;
  onOpenCreateResume?: () => void;
  onEditResume?: (resume: any) => void;
  onOpenCreateVacancy?: () => void;
  lang?: Language;
}

export default function RightSidebar({
  vacanciesCount,
  user,
  resume,
  onSelectVacancy,
  onOpenProfile,
  onOpenCreateResume,
  onEditResume,
  onOpenCreateVacancy,
  lang = 'uz',
}: RightSidebarProps) {
  const t = translations[lang] || translations.uz;
  const isCompany = Boolean(user && (user.account_type === 'company' || user.role === 'employer'));

  return (
    <aside className="w-80 shrink-0 hidden xl:block sticky top-20 self-start space-y-4">
      {/* 1. Candidate Resume Progress Card (Jobish style) */}
      {!isCompany && user && onOpenCreateResume && (
        <ResumeProgressCard
          user={user}
          resume={resume}
          onOpenCreateResume={onOpenCreateResume}
          onEditResume={onEditResume}
          lang={lang}
        />
      )}

      {/* 2. Employer Quick Actions Card */}
      {isCompany && (
        <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl border border-blue-500/30 p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Briefcase size={18} className="text-blue-300" />
            <h5 className="font-extrabold text-sm">Ish beruvchi kabineti</h5>
          </div>
          <p className="text-xs text-blue-100/90 leading-relaxed">
            Bo‘sh ish o‘rinlarini e’lon qiling va mos keluvchi nomzodlar arizalarini to‘g‘ridan-to‘g‘ri qabul qiling.
          </p>
          {onOpenCreateVacancy && (
            <button
              onClick={onOpenCreateVacancy}
              className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
            >
              <Plus size={16} />
              <span>Vakansiya e'lon qilish</span>
            </button>
          )}
        </div>
      )}

      {/* 3. Guest Prompt Card */}
      {!user && (
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-amber-300" />
            <h5 className="font-extrabold text-sm">WZone Karyera Portali</h5>
          </div>
          <p className="text-xs text-blue-50 leading-relaxed">
            O‘zbekistondagi bo‘sh ish o‘rinlariga topshiring yoki professional rezyume yaratib kompaniyalarga yuboring.
          </p>
          {onOpenProfile && (
            <button
              onClick={onOpenProfile}
              className="w-full py-2.5 px-3 rounded-xl bg-white text-blue-700 hover:bg-blue-50 active:scale-95 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
            >
              <span>Kirish / Ro‘yxatdan o‘tish</span>
            </button>
          )}
        </div>
      )}

      {/* Recommended vacancies for logged in user */}
      {user && onSelectVacancy && onOpenProfile && (
        <RecommendationsWidget user={user} onSelectVacancy={onSelectVacancy} onOpenProfile={onOpenProfile} lang={lang} />
      )}

      {/* Telegram Bot Card */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-xs">
        <div className="flex items-center gap-3 mb-2.5">
          <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
            <Send size={19} />
          </div>
          <div>
            <h5 className="text-sm font-extrabold text-slate-900 dark:text-white">{t.telegramTitle}</h5>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{t.telegramHandle}</p>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-3 leading-relaxed font-normal">
          {t.telegramDesc}
        </p>
        <a
          href="https://t.me/wzone_jobs_bot"
          target="_blank"
          rel="noreferrer"
          className="w-full py-2.5 px-3 rounded-xl border border-sky-300 dark:border-sky-800 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition"
        >
          <span>{t.telegramBtn}</span>
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Platform stats */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-xs">
        <h5 className="text-xs font-black text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">
          {t.statsTitle}
        </h5>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-emerald-500" /> {t.activeVacancies}
            </span>
            <span className="font-extrabold text-blue-600 dark:text-blue-400 text-base">
              {vacanciesCount.toLocaleString('ru-RU')} ta
            </span>
          </div>
        </div>
      </div>

      {/* Legal & Footer links */}
      <div className="px-2 text-xs text-slate-500 dark:text-slate-400 space-y-1.5 font-medium">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition">{t.terms}</a>
          <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition">{t.privacy}</a>
          <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition">{t.help}</a>
        </div>
        <p className="text-xs text-slate-400">{t.copyright}</p>
      </div>
    </aside>
  );
}
