'use client';

import React from 'react';
import { Send, ExternalLink, CheckCircle2, Video, Sparkles } from 'lucide-react';
import { Language, translations } from '../lib/translations';
import RecommendationsWidget from './RecommendationsWidget';
import LiveCommentsWidget from './LiveCommentsWidget';

interface RightSidebarProps {
  vacanciesCount: number;
  user?: any;
  onSelectVacancy?: (vacancy: any) => void;
  onOpenProfile?: () => void;
  onNavigateToComments?: () => void;
  onOpenVideoAdModal?: () => void;
  lang?: Language;
}

export default function RightSidebar({
  vacanciesCount,
  user,
  onSelectVacancy,
  onOpenProfile,
  onNavigateToComments,
  onOpenVideoAdModal,
  lang = 'uz',
}: RightSidebarProps) {
  const t = translations[lang] || translations.uz;

  return (
    <aside className="w-80 shrink-0 hidden xl:block sticky top-20 self-start space-y-4">
      {/* Real-time Live Comments Widget */}
      <LiveCommentsWidget
        onSelectVacancy={onSelectVacancy}
        onNavigateToComments={onNavigateToComments}
        lang={lang}
      />

      {user && onSelectVacancy && onOpenProfile && (
        <RecommendationsWidget user={user} onSelectVacancy={onSelectVacancy} onOpenProfile={onOpenProfile} lang={lang} />
      )}

      {/* AI Video Ad Promotion Card */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white rounded-2xl border border-indigo-500/30 p-4 shadow-lg shadow-indigo-500/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[10px] font-extrabold uppercase">
            <Video size={12} className="animate-pulse text-amber-400" />
            <span>AI Video Reklama</span>
          </div>
          <span className="text-[10px] font-bold text-amber-400 font-mono">9:16 HD Reel</span>
        </div>
        <div>
          <h5 className="font-extrabold text-sm text-white">Vakansiya uchun Video Reklama</h5>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Kompaniyangiz vakansiyalarini Instagram Story va Telegram kanallar uchun 14 soniyali video formatga aylantiring.
          </p>
        </div>
        {onOpenVideoAdModal && (
          <button
            type="button"
            onClick={onOpenVideoAdModal}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:brightness-110 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
          >
            <Sparkles size={14} className="text-amber-300" />
            <span>Video Reklama Yaratish</span>
          </button>
        )}
      </div>

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
