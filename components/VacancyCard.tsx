'use client';

import React from 'react';
import { MapPin, DollarSign, Clock, Eye, Bookmark, CheckCircle, ArrowRight, MessageCircle } from 'lucide-react';
import { Language, translations } from '../lib/translations';

interface VacancyCardProps {
  vacancy: any;
  onApply: (v: any) => void;
  onSelect: (v: any) => void;
  isSaved?: boolean;
  onToggleSave?: (v: any) => void;
  lang?: Language;
}

export default function VacancyCard({
  vacancy,
  onApply,
  onSelect,
  isSaved = false,
  onToggleSave,
  lang = 'uz',
}: VacancyCardProps) {
  const t = translations[lang] || translations.uz;

  const tagsList = vacancy.tags
    ? vacancy.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
    : [];

  const formatRelativeTime = (dateStr?: string) => {
    if (!dateStr) return t.recently;
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) {
      return lang === 'ru' ? 'Только что' : lang === 'en' ? 'Just now' : 'Hozirgina';
    }
    if (diffHours < 24) {
      return lang === 'ru' ? `${diffHours} ч назад` : lang === 'en' ? `${diffHours}h ago` : `${diffHours} soat oldin`;
    }
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) {
      return lang === 'ru' ? 'Вчера' : lang === 'en' ? 'Yesterday' : 'Kecha';
    }
    return lang === 'ru' ? `${diffDays} дн назад` : lang === 'en' ? `${diffDays}d ago` : `${diffDays} kun oldin`;
  };

  return (
    <div className="bg-white dark:bg-slate-900/90 backdrop-blur rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-600 transition group relative overflow-hidden">
      {/* Featured Banner Accent */}
      {vacancy.is_featured && (
        <div className="absolute top-0 right-0 bg-gradient-to-l from-blue-600 to-indigo-600 text-white text-[10px] font-black tracking-wider px-3 py-0.5 rounded-bl-xl shadow-sm">
          {t.topVacancy}
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        {/* Company Avatar & Info */}
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-blue-950/60 border border-blue-200/80 dark:border-slate-700 flex items-center justify-center font-black text-blue-700 dark:text-blue-400 text-lg shadow-sm shrink-0">
            {vacancy.company ? vacancy.company[0].toUpperCase() : 'W'}
          </div>

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {vacancy.company}
              </span>
              {vacancy.is_verified !== false && (
                <CheckCircle size={14} className="text-blue-600 fill-blue-100 dark:fill-blue-950" />
              )}
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
                WZone
              </span>
              <span className="text-[11px] text-slate-400">•</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                <Clock size={12} />
                {formatRelativeTime(vacancy.created_at)}
              </span>
            </div>

            <h3
              onClick={() => onSelect(vacancy)}
              className="text-base font-extrabold text-slate-900 dark:text-white mt-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 cursor-pointer transition line-clamp-1 leading-snug"
            >
              {vacancy.title}
            </h3>
          </div>
        </div>

        {/* Bookmark button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave?.(vacancy);
          }}
          className={`p-2.5 rounded-xl border transition ${
            isSaved
              ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title={t.navSaved}
        >
          <Bookmark size={18} className={isSaved ? 'fill-current' : ''} />
        </button>
      </div>

      {/* Badges: Salary, Location, Job Type */}
      <div className="flex flex-wrap items-center gap-2 mt-4">
        {vacancy.salary && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-black">
            <DollarSign size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{vacancy.salary}</span>
          </div>
        )}

        {vacancy.location && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 text-xs font-bold">
            <MapPin size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <span>{vacancy.location}</span>
          </div>
        )}

        {vacancy.job_type && (
          <div className="inline-flex items-center px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800">
            {vacancy.job_type}
          </div>
        )}

        {vacancy.category && (
          <div className="inline-flex items-center px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 text-xs font-semibold">
            {vacancy.category}
          </div>
        )}
      </div>

      {/* Description Snippet */}
      {vacancy.description && (
        <p className="text-xs text-slate-700 dark:text-slate-300 mt-3 line-clamp-2 leading-relaxed font-normal">
          {vacancy.description}
        </p>
      )}

      {/* Tags & Action Bar */}
      <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap gap-1.5 max-w-[65%]">
          {tagsList.slice(0, 4).map((tag: string, idx: number) => (
            <span
              key={idx}
              className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200/60 dark:border-slate-700/60"
            >
              {tag}
            </span>
          ))}
          {tagsList.length > 4 && (
            <span className="text-[11px] px-1.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
              +{tagsList.length - 4}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {vacancy.views_count !== undefined && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 mr-1 hidden sm:flex">
              <Eye size={13} />
              <span>{vacancy.views_count}</span>
            </span>
          )}

          {vacancy.comments_count !== undefined && vacancy.comments_count > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(vacancy);
              }}
              className="text-[11px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 hover:underline mr-1"
              title={t.commentsTitle}
            >
              <MessageCircle size={13} />
              <span>{vacancy.comments_count}</span>
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onApply(vacancy);
            }}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-1.5"
          >
            <span>{t.applyShort}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
