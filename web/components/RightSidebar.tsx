'use client';

import React from 'react';
import { Send, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Language, translations } from '../lib/translations';
import RecommendationsWidget from './RecommendationsWidget';

interface RightSidebarProps {
  vacanciesCount: number;
  user?: any;
  onSelectVacancy?: (vacancy: any) => void;
  onOpenProfile?: () => void;
  lang?: Language;
}

export default function RightSidebar({ vacanciesCount, user, onSelectVacancy, onOpenProfile, lang = 'uz' }: RightSidebarProps) {
  const t = translations[lang] || translations.uz;

  return (
    <aside className="w-80 shrink-0 hidden xl:block sticky top-20 self-start space-y-4">
      {user && onSelectVacancy && onOpenProfile && (
        <RecommendationsWidget user={user} onSelectVacancy={onSelectVacancy} onOpenProfile={onOpenProfile} lang={lang} />
      )}

      {/* Telegram Bot Card */}
      <div className="bg-white dark:bg-slate-900/90 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <div className="flex items-center gap-3 mb-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
            <Send size={18} />
          </div>
          <div>
            <h5 className="text-xs font-extrabold text-slate-900 dark:text-white">{t.telegramTitle}</h5>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">{t.telegramHandle}</p>
          </div>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-relaxed font-normal">
          {t.telegramDesc}
        </p>
        <a
          href="https://t.me/wzone_jobs_bot"
          target="_blank"
          rel="noreferrer"
          className="w-full py-2 px-3 rounded-xl border border-sky-300 dark:border-sky-800 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-xs font-bold flex items-center justify-center gap-2 transition"
        >
          <span>{t.telegramBtn}</span>
          <ExternalLink size={13} />
        </a>
      </div>

      {/* Platform stats */}
      <div className="bg-white dark:bg-slate-900/90 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <h5 className="text-[11px] font-black text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">
          {t.statsTitle}
        </h5>
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-500" /> {t.activeVacancies}
            </span>
            <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">
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
        <p className="text-[11px] text-slate-400">{t.copyright}</p>
      </div>
    </aside>
  );
}
