'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  DollarSign,
  Briefcase,
  Calendar,
  CheckCircle,
  Share2,
  ArrowRight,
  MessageCircle,
  Send,
  User,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { api } from '../lib/api';

interface VacancyDetailModalProps {
  vacancy: any | null;
  onClose: () => void;
  onApply: (v: any) => void;
  currentUser?: any;
}

export default function VacancyDetailModal({
  vacancy,
  onClose,
  onApply,
  currentUser,
}: VacancyDetailModalProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [guestName, setGuestName] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!vacancy?.id) return;
    let isMounted = true;

    async function fetchComments() {
      setLoadingComments(true);
      try {
        const res = await api.getVacancyComments(vacancy.id);
        if (isMounted && res.success && res.data?.comments) {
          setComments(res.data.comments);
        }
      } catch (err) {
        console.error('Failed to load comments', err);
      } finally {
        if (isMounted) setLoadingComments(false);
      }
    }

    fetchComments();
    return () => {
      isMounted = false;
    };
  }, [vacancy?.id]);

  if (!vacancy) return null;

  const tagsList = vacancy.tags
    ? vacancy.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
    : [];

  const handleShare = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      alert('Havola nusxalandi!');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const authorName = currentUser?.name || guestName.trim() || 'WZone Foydalanuvchisi';
      const authorAvatar = currentUser?.avatar_url || '';

      const res = await api.createVacancyComment(vacancy.id, {
        content: newComment.trim(),
        author_name: authorName,
        author_avatar: authorAvatar,
      });

      if (res.success && res.data?.comment) {
        setComments((prev) => [...prev, res.data.comment]);
        setNewComment('');
      }
    } catch (err) {
      console.error('Failed to add comment', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCommentTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString('uz-UZ');
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-cyan-500 text-white flex items-center justify-center font-extrabold text-2xl shadow-md shrink-0">
              {vacancy.company ? vacancy.company[0].toUpperCase() : 'W'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {vacancy.company}
                </span>
                {vacancy.is_verified !== false && (
                  <CheckCircle size={15} className="text-blue-600 fill-blue-100 dark:fill-blue-950" />
                )}
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
                  WZone
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-1 leading-snug">
                {vacancy.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              title="Ulashish"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <Share2 size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <DollarSign size={13} /> Maosh
              </span>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {vacancy.salary || 'Kelishilgan'}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <MapPin size={13} /> Joylashuv
              </span>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1 truncate">
                {vacancy.location || 'O‘zbekiston'}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <Briefcase size={13} /> Bandlik
              </span>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1">
                {vacancy.job_type || 'Full-time'}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <Calendar size={13} /> Tajriba
              </span>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1">
                {vacancy.experience || '1-3 yil'}
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-2">
              Vakansiya tavsifi
            </h4>
            <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800">
              {vacancy.description || 'Vakansiya bo‘yicha batafsil ma‘lumot keltirilmagan.'}
            </div>
          </div>

          {/* Tags */}
          {tagsList.length > 0 && (
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-2">
                Talab etiladigan ko‘nikmalar
              </h4>
              <div className="flex flex-wrap gap-2">
                {tagsList.map((tag: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 text-xs font-bold rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Comments & Discussion Section */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageCircle size={18} className="text-blue-600" />
                <span>Savollar va Fikr-mulohazalar ({comments.length})</span>
              </h4>
              <span className="text-[11px] text-slate-400 font-semibold">Jonli muhokama</span>
            </div>

            {/* Comments List */}
            <div className="space-y-3">
              {comments.length === 0 ? (
                <div className="py-6 text-center text-slate-500 dark:text-slate-400 text-xs bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-4">
                  Hozircha hech kim fikr qoldirmagan. Birinchi bo‘lib savol bering yoki fikr bildiring!
                </div>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {c.author_avatar ? (
                          <img
                            src={c.author_avatar}
                            alt={c.author_name}
                            className="w-6 h-6 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-[10px] flex items-center justify-center">
                            {c.author_name ? c.author_name[0].toUpperCase() : 'U'}
                          </div>
                        )}
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {c.author_name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {formatCommentTime(c.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-200 pl-8 leading-relaxed font-normal">
                      {c.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Comment Post Form */}
            <form onSubmit={handleAddComment} className="space-y-2 pt-2">
              {!currentUser && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Ismingiz:</span>
                  <input
                    type="text"
                    placeholder="Ismingizni kiriting..."
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="px-3 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Vakansiya bo‘yicha savol yoki fikringizni yozing..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                >
                  <span>Yuborish</span>
                  <Send size={13} />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400">Ish beruvchi: {vacancy.company}</p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {vacancy.salary || 'Maosh suhbatda kelishiladi'}
            </p>
          </div>

          <button
            onClick={() => {
              onClose();
              onApply(vacancy);
            }}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition flex items-center gap-2"
          >
            <span>Ariza topshirish</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
