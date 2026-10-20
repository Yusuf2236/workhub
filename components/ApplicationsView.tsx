'use client';

import React, { useState } from 'react';
import { FileCheck, Building, Clock, Eye, MessageSquare, FileText, User as UserIcon } from 'lucide-react';
import { Language, translations } from '../lib/translations';
import { resolveUploadUrl } from '../lib/api';

const APPLICATION_STATUSES = ['submitted', 'reviewing', 'interview', 'accepted', 'rejected'] as const;

interface ApplicationsViewProps {
  applications: any[];
  /** Applications sent to vacancies the current user posted */
  receivedApplications?: any[];
  onUpdateStatus?: (applicationId: string, status: string) => Promise<{ success: boolean; error?: string }>;
  onOpenApplicantChat?: (application: any) => void;
  onSelectVacancy?: (id: string) => void;
  onOpenChat?: () => void;
  lang?: Language;
}

export default function ApplicationsView({
  applications,
  receivedApplications = [],
  onUpdateStatus,
  onOpenApplicantChat,
  onSelectVacancy,
  lang = 'uz',
}: ApplicationsViewProps) {
  const t = translations[lang] || translations.uz;
  const [view, setView] = useState<'mine' | 'received'>('mine');
  const [statusError, setStatusError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const locale = lang === 'ru' ? 'ru-RU' : lang === 'en' ? 'en-US' : 'uz-UZ';

  const statusLabels: Record<string, string> = {
    submitted: t.statusSubmitted,
    reviewing: t.statusReviewing,
    interview: t.statusInterview,
    accepted: t.statusAccepted,
    rejected: t.statusRejected,
  };

  const statusStyles: Record<string, string> = {
    accepted: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
    rejected: 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700',
    reviewing: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700',
    interview: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700',
    submitted: 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700',
  };

  const statusKey = (status: string) => (statusLabels[status?.toLowerCase()] ? status.toLowerCase() : 'submitted');

  const getStatusBadge = (status: string) => {
    const key = statusKey(status);
    return (
      <span className={`px-3 py-1 text-xs font-black rounded-xl border ${statusStyles[key]}`}>{statusLabels[key]}</span>
    );
  };

  const changeStatus = async (app: any, status: string) => {
    if (!onUpdateStatus) return;
    setStatusError(null);
    setUpdatingId(app.id);
    const res = await onUpdateStatus(app.id, status);
    setUpdatingId(null);
    if (!res.success) setStatusError(res.error || t.applyError);
  };

  const list = view === 'mine' ? applications : receivedApplications;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {view === 'mine' ? t.applicationsTitle : t.receivedApplicationsTab}
          </h2>
          {view === 'mine' && (
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.applicationsSubtitle}</p>
          )}
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          {list.length} {t.totalCountSuffix}
        </span>
      </div>

      {/* Candidate / employer switch (shown once the user has received applications) */}
      {receivedApplications.length > 0 && (
        <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
          {(['mine', 'received'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`px-3.5 py-1.5 rounded-lg transition ${
                view === key
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {key === 'mine' ? t.myApplicationsTab : `${t.receivedApplicationsTab} (${receivedApplications.length})`}
            </button>
          ))}
        </div>
      )}

      {statusError && (
        <div className="text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl px-4 py-2">
          {statusError}
        </div>
      )}

      {list.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <FileCheck size={44} className="mx-auto text-slate-400 mb-2" />
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            {view === 'mine' ? t.noApplications : t.noReceivedApplications}
          </h4>
          {view === 'mine' && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.noApplicationsSub}</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((app) => (
            <div
              key={app.id}
              className="bg-white dark:bg-slate-900/90 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-sm hover:border-blue-400 dark:hover:border-blue-700 transition"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-extrabold text-lg shrink-0 border border-blue-200 dark:border-blue-900/40">
                    {view === 'mine' ? <Building size={22} /> : <UserIcon size={22} />}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                      {view === 'mine' ? app.vacancy_title || t.defaultAppTitle : app.applicant_name || 'Nomzod'}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                      {view === 'mine' ? (
                        app.vacancy_company && <span className="text-slate-700 dark:text-slate-300 font-bold">{app.vacancy_company}</span>
                      ) : (
                        <span className="text-slate-700 dark:text-slate-300 font-bold">{app.vacancy_title}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock size={13} />
                        {new Date(app.created_at || Date.now()).toLocaleDateString(locale)}
                      </span>
                      {view === 'received' && (app.applicant_email || app.applicant_phone) && (
                        <span>{[app.applicant_email, app.applicant_phone].filter(Boolean).join(' • ')}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {view === 'mine' ? (
                    getStatusBadge(app.status)
                  ) : (
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                      <span className="sr-only">{t.statusLabel}</span>
                      <select
                        value={statusKey(app.status)}
                        disabled={updatingId === app.id}
                        onChange={(e) => changeStatus(app, e.target.value)}
                        className={`px-2.5 py-1 text-xs font-black rounded-xl border disabled:opacity-60 ${statusStyles[statusKey(app.status)]}`}
                      >
                        {APPLICATION_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {statusLabels[s]}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  {onOpenApplicantChat && (
                    <button
                      onClick={() => onOpenApplicantChat(app)}
                      title={view === 'received' ? "Nomzod bilan muloqot" : "Ish beruvchi bilan muloqot"}
                      className="p-2 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 transition flex items-center gap-1 text-xs font-bold"
                    >
                      <MessageSquare size={15} />
                      <span className="hidden sm:inline">Muloqot</span>
                    </button>
                  )}

                  {app.vacancy_id && onSelectVacancy && (
                    <button
                      onClick={() => onSelectVacancy(app.vacancy_id)}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1"
                      title={t.details}
                    >
                      <Eye size={15} />
                      <span className="hidden md:inline">{t.details}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Cover letter and resume the candidate attached */}
              {(app.cover_letter || app.resume_title) && (
                <div className="pl-0 sm:pl-16 space-y-2 text-xs">
                  {app.cover_letter && (
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 p-3">
                      <p className="font-bold text-slate-600 dark:text-slate-300 mb-1">{t.coverLetterLabel}</p>
                      <p className="whitespace-pre-line text-slate-700 dark:text-slate-200">{app.cover_letter}</p>
                    </div>
                  )}
                  {app.resume_title && (
                    <div className="flex flex-wrap items-center gap-2 text-slate-600 dark:text-slate-300">
                      <FileText size={14} />
                      <span className="font-bold">{t.resumeLabel}:</span>
                      <span>{app.resume_title}</span>
                      {view === 'received' && app.resume_file_url && (
                        <a
                          href={resolveUploadUrl(app.resume_file_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                        >
                          {t.openResumeFile}
                        </a>
                      )}
                    </div>
                  )}
                  {view === 'received' && app.resume_summary && (
                    <details className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 p-3">
                      <summary className="cursor-pointer font-bold text-slate-600 dark:text-slate-300">{t.resumeLabel}</summary>
                      <p className="whitespace-pre-line text-slate-700 dark:text-slate-200 mt-2">{app.resume_summary}</p>
                    </details>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
