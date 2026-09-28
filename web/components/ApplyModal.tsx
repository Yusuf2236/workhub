'use client';

import React, { useState } from 'react';
import { X, Send, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

interface ApplyModalProps {
  vacancy: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ApplyModal({ vacancy, isOpen, onClose, onSuccess }: ApplyModalProps) {
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !vacancy) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.applyToVacancy(vacancy.id, {
        cover_letter: coverLetter,
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
        setError(res.error || 'Arizani yuborishda xatolik yuz berdi');
      }
    } catch (err: any) {
      setError(err.message || 'Server bilan aloqa uzildi');
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
              Vakansiyaga ariza topshirish
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
                Arizangiz muvaffaqiyatli qabul qilindi!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Ish beruvchi arizangizni ko‘rib chiqadi va sizga tez orada javob yuboradi.
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
                  Kuzatuv xati / Izoh (Cover letter)
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Nima uchun aynan siz ushbu lavozimga mos ekansiz? Tajribangiz va yutuqlaringiz haqida qisqacha yozing..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800 flex items-center gap-3">
                <FileText size={20} className="text-blue-600 dark:text-blue-400 shrink-0" />
                <div className="text-xs">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Sizning WorkHub rezyume profilingiz
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Arizaga avtomatik ravishda biriktiriladi
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/20 transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Send size={14} />
                  <span>{loading ? 'Yuborilmoqda...' : 'Arizani jo‘natish'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
