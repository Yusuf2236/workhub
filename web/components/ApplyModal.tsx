'use client';

import React, { useEffect, useState } from 'react';
import { X, Send, FileText, CheckCircle2, AlertCircle, Plus, Download } from 'lucide-react';
import { api } from '../lib/api';
import { Language, translations } from '../lib/translations';
import { downloadResumeAsPDF } from '../lib/resumePdf';

interface ApplyModalProps {
  vacancy: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** The applicant's own resumes to attach */
  resumes?: any[];
  onOpenCreateResume?: () => void;
  lang?: Language;
}

export default function ApplyModal({
  vacancy,
  isOpen,
  onClose,
  onSuccess,
  resumes = [],
  onOpenCreateResume,
  lang = 'uz',
}: ApplyModalProps) {
  const t = translations[lang] || translations.uz;
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeId, setResumeId] = useState('');

  // Preselect the newest resume each time the modal opens
  useEffect(() => {
    if (isOpen) setResumeId(resumes[0]?.id || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !vacancy) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resumes.length === 0) {
      setError('Ishga ariza topshirish uchun avval rezyumengizni to‘ldirishingiz kerak');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await api.applyToVacancy(vacancy.id, {
        cover_letter: coverLetter.trim(),
        resume_id: resumeId || undefined,
      });

      if (res.success) {
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          setCoverLetter('');
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setError(res.error || t.applyError);
      }
    } catch (err: any) {
      setError(err.message || t.networkError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {lang === 'ru' ? 'Отклик на вакансию' : lang === 'en' ? 'Apply for Vacancy' : 'Vakansiyaga ariza topshirish'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {vacancy.title} • {vacancy.company}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {submitted ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 size={32} />
              </div>
              <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                {lang === 'ru' ? 'Ваш отклик успешно отправлен!' : lang === 'en' ? 'Application submitted successfully!' : 'Arizangiz muvaffaqiyatli qabul qilindi!'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                {lang === 'ru' ? 'Работодатель рассмотрит вашу кандидатуру и свяжется с вами.' : lang === 'en' ? 'The employer will review your profile and respond soon.' : 'Ish beruvchi arizangizni ko‘rib chiqadi va sizga tez orada javob yuboradi.'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-2.5 text-xs text-red-700 dark:text-red-300">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'ru'
                    ? 'Сопроводительное письмо / Комментарий (необязательно)'
                    : lang === 'en'
                    ? 'Cover Letter / Note (optional)'
                    : 'Kuzatuv xati / Izoh (ixtiyoriy)'}
                </label>
                <textarea
                  rows={4}
                  maxLength={5000}
                  placeholder={
                    lang === 'ru'
                      ? 'Почему именно вы подходите на эту роль? Кратко расскажите об опыте (необязательно)...'
                      : lang === 'en'
                      ? 'Why are you a great fit for this position? (optional)...'
                      : 'Nima uchun aynan siz ushbu lavozimga mos ekansiz? Tajribangiz va yutuqlaringiz haqida qisqacha yozing (ixtiyoriy)...'
                  }
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {resumes.length === 0 ? (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                        Rezyume to‘ldirilmagan
                      </h4>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                        Ish beruvchiga ariza topshirish uchun avval rezyumengizni to‘ldirishingiz kerak. Rezyumeni saqlaganingizdan so‘ng u tizimda doimiy saqlanib qoladi, keyinchalik xohlagan paytingizda o‘zgartirishingiz yoki PDF qilib yuklab olishingiz mumkin.
                      </p>
                    </div>
                  </div>
                  {onOpenCreateResume && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenCreateResume();
                      }}
                      className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>Rezyume to‘ldirish va saqlash</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText size={18} className="text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">{t.applyResumeLabel}</span>
                    </div>
                    {onOpenCreateResume && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenCreateResume();
                        }}
                        className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={12} />
                        <span>Yangi rezyume</span>
                      </button>
                    )}
                  </div>

                  <select
                    value={resumeId}
                    onChange={(e) => setResumeId(e.target.value)}
                    className="w-full p-2 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title}
                      </option>
                    ))}
                  </select>

                  {(() => {
                    const selResume = resumes.find((r) => r.id === resumeId) || resumes[0];
                    if (!selResume) return null;
                    return (
                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                        <span className="truncate">Biriktirilgan rezyume</span>
                        <button
                          type="button"
                          onClick={() =>
                            downloadResumeAsPDF({
                              title: selResume.title,
                              fullName: selResume.full_name || selResume.name,
                              phone: selResume.phone,
                              email: selResume.email,
                              location: selResume.location,
                              summary: selResume.summary,
                            })
                          }
                          className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Download size={12} />
                          <span>PDF yuklab olish</span>
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  {lang === 'ru' ? 'Отмена' : lang === 'en' ? 'Cancel' : 'Bekor qilish'}
                </button>
                <button
                  type="submit"
                  disabled={loading || resumes.length === 0}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/20 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Send size={14} />
                  <span>{loading ? (lang === 'ru' ? 'Отправка...' : lang === 'en' ? 'Sending...' : 'Yuborilmoqda...') : (lang === 'ru' ? 'Отправить отклик' : lang === 'en' ? 'Submit Application' : 'Arizani jo‘natish')}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
