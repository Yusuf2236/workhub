'use client';

import React from 'react';
import { Smartphone, Send, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Language, translations } from '../lib/translations';

interface RightSidebarProps {
  vacanciesCount: number;
  lang?: Language;
}

export default function RightSidebar({ vacanciesCount, lang = 'uz' }: RightSidebarProps) {
  const t = translations[lang] || translations.uz;

  return (
    <aside className="w-80 shrink-0 hidden xl:block sticky top-20 self-start space-y-4">
      {/* Mobile Apps Promo Card */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white p-5 rounded-2xl shadow-xl shadow-blue-500/20 relative overflow-hidden group">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-[11px] font-bold mb-3 backdrop-blur-sm">
            <Smartphone size={13} />
            <span>WZone Mobile</span>
          </div>
          <h4 className="font-extrabold text-base leading-snug mb-1">
            {t.mobileTitle}
          </h4>
          <p className="text-xs text-blue-50 mb-4 leading-relaxed font-medium">
            {t.mobileSubtitle}
          </p>

          <div className="flex flex-col gap-2">
            <a
              href="https://play.google.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 transition shadow-sm"
            >
              <span>Google Play</span>
              <ExternalLink size={13} className="text-slate-500" />
            </a>
            <a
              href="https://apple.com/app-store"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-xs font-bold transition"
            >
              <span>App Store</span>
              <ExternalLink size={13} className="text-blue-100" />
            </a>
          </div>
        </div>
      </div>

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

      {/* Platform Real-Time Stats (without Server Status row) */}
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
              {vacanciesCount} ta
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-blue-500" /> {t.verifiedCompanies}
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{t.verifiedPercent}</span>
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
