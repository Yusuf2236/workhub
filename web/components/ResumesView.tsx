'use client';

import React from 'react';
import { Users, FileText, Download, MessageSquare, Clock, Plus, RefreshCw } from 'lucide-react';
import { Language, translations } from '../lib/translations';

interface ResumesViewProps {
  resumes: any[];
  onOpenCreateResume: () => void;
  onOpenChat: (resume?: any) => void;
  onRefresh?: () => void;
  loading?: boolean;
  lang?: Language;
}

export default function ResumesView({
  resumes,
  onOpenCreateResume,
  onOpenChat,
  onRefresh,
  loading = false,
  lang = 'uz',
}: ResumesViewProps) {
  const t = translations[lang] || translations.uz;

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return t.recently;
    return new Date(dateStr).toLocaleDateString(lang === 'ru' ? 'ru-RU' : lang === 'en' ? 'en-US' : 'uz-UZ');
  };

  return (
    <div className="space-y-4">
      {/* Header with live refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {t.resumesTitle}
            </h2>
            {onRefresh && (
              <button
                onClick={onRefresh}
                title={t.refreshResumes}
                className="p-1 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                <RefreshCw size={15} className={loading ? 'animate-spin text-blue-600' : ''} />
              </button>
            )}
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t.resumesSub}
          </p>
        </div>

        <button
          onClick={onOpenCreateResume}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/25 transition"
        >
          <Plus size={16} />
          <span>{t.createResume}</span>
        </button>
      </div>

      {/* Grid of Resumes */}
      {resumes.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <Users size={44} className="mx-auto text-slate-400 mb-2" />
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            {t.noResumes}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t.noResumesSub}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resumes.map((resume) => (
            <div
              key={resume.id}
              className="bg-white dark:bg-slate-900/90 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between shadow-sm hover:border-blue-400 dark:hover:border-blue-700 transition group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-extrabold text-base shrink-0 border border-blue-200 dark:border-blue-900/50">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 transition">
                        {resume.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium mt-0.5">
                        <Clock size={12} />
                        {formatTime(resume.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-200 line-clamp-3 leading-relaxed mb-4 font-normal">
                  {resume.summary || t.noSummaryProvided}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                {resume.file_url ? (
                  <a
                    href={resume.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <Download size={14} />
                    <span>{t.viewFilePdf}</span>
                  </a>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-400">{t.onlineProfile}</span>
                )}

                <button
                  onClick={() => onOpenChat(resume)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <MessageSquare size={14} />
                  <span>{t.contactCandidate}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
