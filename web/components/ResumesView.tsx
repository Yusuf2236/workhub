'use client';

import React from 'react';
import {
  Users,
  FileText,
  Download,
  MessageSquare,
  Clock,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  Lock,
  Building2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { Language, translations } from '../lib/translations';
import { resolveUploadUrl } from '../lib/api';
import { downloadResumeAsPDF } from '../lib/resumePdf';

interface ResumesViewProps {
  resumes: any[];
  onOpenCreateResume: () => void;
  onOpenChat: (resume?: any) => void;
  onRefresh?: () => void;
  loading?: boolean;
  currentUser?: any;
  currentUserId?: string;
  onEditResume?: (resume: any) => void;
  onDeleteResume?: (resume: any) => void;
  lang?: Language;
  onSwitchToCompany?: () => void;
}

export default function ResumesView({
  resumes,
  onOpenCreateResume,
  onOpenChat,
  onRefresh,
  loading = false,
  currentUser,
  currentUserId,
  onEditResume,
  onDeleteResume,
  lang = 'uz',
  onSwitchToCompany,
}: ResumesViewProps) {
  const t = translations[lang] || translations.uz;

  const isCompany = Boolean(
    currentUser && (currentUser.account_type === 'company' || currentUser.role === 'employer')
  );

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return t.recently;
    return new Date(dateStr).toLocaleDateString(
      lang === 'ru' ? 'ru-RU' : lang === 'en' ? 'en-US' : 'uz-UZ'
    );
  };

  return (
    <div className="space-y-4">
      {/* Role State Banner */}
      {isCompany ? (
        <div className="p-4 bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-blue-50/90 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 shrink-0">
              <Building2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {currentUser?.company_name || currentUser?.name || 'Tashkilot'}
                </h4>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Ish beruvchi (To‘liq ochiq)
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Nomzodlar bazasi siz uchun to‘liq ochiq: rezyumelarni ko‘rishingiz, PDF yuklab olishingiz va nomzodlar bilan chat orqali bog‘lanishingiz mumkin.
              </p>
            </div>
          </div>
          <div className="text-xs font-bold text-blue-700 dark:text-blue-300 shrink-0 flex items-center gap-1.5 self-end sm:self-center">
            <UserCheck size={16} />
            <span>Nomzodlarni saralash rejimi</span>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0 mt-0.5 sm:mt-0">
              <Lock size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                  Nomzodlar rezyumesi qulflangan
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                  Faqat korxonalar uchun
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Nomzodlarning kontaktlari va fayllari qulflangan bo‘lib, faqat korxona/ish beruvchi hisobidan kirilganda to‘liq ochiladi. O‘zingiz yaratgan rezyume esa siz uchun ochiq.
              </p>
            </div>
          </div>
          {onSwitchToCompany && (
            <button
              type="button"
              onClick={onSwitchToCompany}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 shrink-0 self-end sm:self-center cursor-pointer"
            >
              <Building2 size={14} />
              <span>Korxona sifatida kirish</span>
            </button>
          )}
        </div>
      )}

      {/* Header with live refresh & action */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {isCompany ? 'Nomzodlar bazasi (Rezyumelar)' : t.resumesTitle}
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
            {isCompany
              ? 'Kompaniyangiz uchun eng mos nomzodlarni toping va to‘g‘ridan-to‘g‘ri muloqot qiling'
              : t.resumesSub}
          </p>
        </div>

        {/* Create Resume Button ONLY for individual candidates, NEVER for companies */}
        {!isCompany && (
          <button
            onClick={onOpenCreateResume}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/25 transition cursor-pointer"
          >
            <Plus size={16} />
            <span>{t.createResume}</span>
          </button>
        )}
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
          {resumes.map((resume) => {
            const isOwn = Boolean(currentUserId) && resume.user_id === currentUserId;
            const isUnlocked = isCompany || isOwn || resume.is_locked !== true;

            return (
              <div
                key={resume.id}
                className={`bg-white dark:bg-slate-900/90 backdrop-blur rounded-2xl border p-5 flex flex-col justify-between shadow-sm transition group ${
                  isOwn
                    ? 'border-blue-400/80 dark:border-blue-700/80 ring-2 ring-blue-500/10'
                    : isUnlocked
                    ? 'border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-700'
                    : 'border-slate-200 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/40'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-base shrink-0 border ${
                        isOwn
                          ? 'bg-blue-600 text-white border-blue-600 shadow'
                          : isUnlocked
                          ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}>
                        {isUnlocked ? <FileText size={20} /> : <Lock size={20} className="text-amber-500" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 transition">
                            {resume.title}
                          </h4>
                          {isOwn && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 shrink-0">
                              Mening rezyumem
                            </span>
                          )}
                          {!isOwn && !isUnlocked && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 shrink-0 flex items-center gap-1">
                              <Lock size={10} />
                              Qulflangan
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium mt-0.5">
                          <Clock size={12} />
                          {formatTime(resume.created_at)}
                        </p>
                      </div>
                    </div>

                    {isOwn && (onEditResume || onDeleteResume) && (
                      <div className="flex items-center gap-1 shrink-0">
                        {onEditResume && (
                          <button
                            onClick={() => onEditResume(resume)}
                            title={t.editBtn}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        {onDeleteResume && (
                          <button
                            onClick={() => onDeleteResume(resume)}
                            title={t.deleteBtn}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Summary content: Unlocked vs Locked */}
                  {isUnlocked ? (
                    <p className="text-xs text-slate-700 dark:text-slate-200 line-clamp-3 leading-relaxed mb-4 font-normal">
                      {resume.summary || t.noSummaryProvided}
                    </p>
                  ) : (
                    <div className="mb-4 p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                      <p className="text-slate-500 dark:text-slate-400 line-clamp-2 select-none filter blur-[0.4px]">
                        {resume.summary ? resume.summary.slice(0, 100) + '...' : 'Nomzod malakasi va tajribasi haqida ma‘lumot...'}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 pt-0.5">
                        <Lock size={12} className="shrink-0" />
                        <span>Nomzod kontaktlari va to‘liq tavsifi qulflangan</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card footer actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  {isUnlocked ? (
                    <>
                      {resume.file_url ? (
                        <a
                          href={resolveUploadUrl(resume.file_url)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <Download size={14} />
                          <span>{t.viewFilePdf}</span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            downloadResumeAsPDF({
                              title: resume.title,
                              fullName: resume.full_name || resume.name || 'Nomzod',
                              phone: resume.phone,
                              email: resume.email,
                              location: resume.location,
                              summary: resume.summary,
                            })
                          }
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          <Download size={14} />
                          <span>PDF yuklab olish</span>
                        </button>
                      )}

                      {!isOwn && (
                        <button
                          onClick={() => onOpenChat(resume)}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                        >
                          <MessageSquare size={14} />
                          <span>{t.contactCandidate}</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                        <Lock size={13} className="text-amber-500 shrink-0" />
                        <span>Faqat korxonalarga ochiq</span>
                      </div>

                      {onSwitchToCompany ? (
                        <button
                          type="button"
                          onClick={onSwitchToCompany}
                          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Ochish</span>
                          <ArrowRight size={13} />
                        </button>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400">
                          Korxona bo‘lib kiring
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
