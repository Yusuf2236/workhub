'use client';

import React, { useState } from 'react';
import { FileCheck, Building, Clock, ChevronRight, Eye, MessageSquare, AlertCircle } from 'lucide-react';
import { Language, translations } from '../lib/translations';

interface ApplicationsViewProps {
  applications: any[];
  onSelectVacancy?: (id: string) => void;
  onOpenChat?: () => void;
  lang?: Language;
}

export default function ApplicationsView({
  applications,
  onSelectVacancy,
  onOpenChat,
  lang = 'uz',
}: ApplicationsViewProps) {
  const t = translations[lang] || translations.uz;
  const [selectedApp, setSelectedApp] = useState<any | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return (
          <span className="px-3 py-1 text-xs font-black rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
            {t.statusAccepted}
          </span>
        );
      case 'rejected':
        return (
          <span className="px-3 py-1 text-xs font-black rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
            {t.statusRejected}
          </span>
        );
      case 'reviewing':
        return (
          <span className="px-3 py-1 text-xs font-black rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
            {t.statusReviewing}
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-xs font-black rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
            {t.statusSubmitted}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {t.applicationsTitle}
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t.applicationsSubtitle}
          </p>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          Jami: {applications.length} ta
        </span>
      </div>

      {applications.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <FileCheck size={44} className="mx-auto text-slate-400 mb-2" />
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            {t.noApplications}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Bosh sahifadagi vakansiyalarni ko‘rib chiqing va 1 klikda ariza jo‘nating.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-white dark:bg-slate-900/90 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm hover:border-blue-400 dark:hover:border-blue-700 transition"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-extrabold text-lg shrink-0 border border-blue-200 dark:border-blue-900/40">
                  <Building size={22} />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    {app.vacancy_title || 'Vakansiya arizasi'}
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                    <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-bold">
                      <Clock size={13} />
                      {new Date(app.created_at || Date.now()).toLocaleDateString('uz-UZ')}
                    </span>
                    <span>•</span>
                    <span className="text-slate-600 dark:text-slate-300">Ariza ID: {app.id?.slice(0, 8)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                {getStatusBadge(app.status)}

                {app.vacancy_id && onSelectVacancy && (
                  <button
                    onClick={() => onSelectVacancy(app.vacancy_id)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1"
                    title="Vakansiyani ko‘rish"
                  >
                    <Eye size={15} />
                    <span className="hidden md:inline">{t.details}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
