'use client';

import React, { useState, useEffect } from 'react';
import { MessageCircle, RefreshCw, ExternalLink, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { Language } from '../lib/translations';

interface LiveCommentsWidgetProps {
  onSelectVacancy?: (vacancy: any) => void;
  onNavigateToComments?: () => void;
  lang?: Language;
}

export default function LiveCommentsWidget({
  onSelectVacancy,
  onNavigateToComments,
  lang = 'uz',
}: LiveCommentsWidgetProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const isFetchingRef = React.useRef(false);

  const fetchComments = async (silent = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (!silent) setLoading(true);
    try {
      const res = await api.getRecentComments(1, 5);
      if (res.success && Array.isArray(res.data?.comments)) {
        const incoming = res.data.comments;
        setComments((prev) => {
          if (prev.length !== incoming.length || incoming.some((c: any, i: number) => !prev[i] || prev[i].id !== c.id)) {
            return incoming;
          }
          return prev;
        });
        setLastRefreshed(new Date());
      }
    } catch (e) {
      console.error('Failed to fetch recent comments', e);
    } finally {
      isFetchingRef.current = false;
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    const interval = setInterval(() => {
      fetchComments(true);
    }, 15_000);
    return () => clearInterval(interval);
  }, []);

  const formatRelativeTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diffMin < 1) return lang === 'ru' ? 'Только что' : lang === 'en' ? 'Just now' : 'Hozirgina';
    if (diffMin < 60) return lang === 'ru' ? `${diffMin} мин назад` : lang === 'en' ? `${diffMin}m ago` : `${diffMin} daqiqa oldin`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return lang === 'ru' ? `${diffHours} ч назад` : lang === 'en' ? `${diffHours}h ago` : `${diffHours} soat oldin`;
    const diffDays = Math.floor(diffHours / 24);
    return lang === 'ru' ? `${diffDays} дн назад` : lang === 'en' ? `${diffDays}d ago` : `${diffDays} kun oldin`;
  };

  const handleCommentClick = async (vacancyId: string) => {
    if (!vacancyId || !onSelectVacancy) return;
    try {
      const res = await api.getVacancy(vacancyId);
      if (res.success && res.data?.vacancy) {
        onSelectVacancy(res.data.vacancy);
      }
    } catch (e) {
      console.error('Failed to load vacancy for comment', e);
    }
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-xs space-y-3">
      {/* Widget Header with Live Beacon */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <MessageCircle size={15} />
          </div>
          <div>
            <h5 className="text-xs font-black text-slate-900 dark:text-white">
              {lang === 'ru' ? 'Живые комментарии' : lang === 'en' ? 'Live Discussions' : 'Jonli Izohlar'}
            </h5>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchComments()}
          title={lang === 'ru' ? 'Обновить' : lang === 'en' ? 'Refresh' : 'Yangilash'}
          className="p-1 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin text-blue-600' : ''} />
        </button>
      </div>

      {/* Comments List */}
      {loading && comments.length === 0 ? (
        <div className="py-4 text-center text-xs text-slate-400">
          <RefreshCw size={14} className="animate-spin mx-auto mb-1 text-blue-600" />
          <span>{lang === 'ru' ? 'Загрузка...' : lang === 'en' ? 'Loading...' : 'Yuklanmoqda...'}</span>
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400 py-3 text-center">
          {lang === 'ru' ? 'Пока нет комментариев' : lang === 'en' ? 'No recent comments' : 'Hozircha izohlar yo‘q'}
        </p>
      ) : (
        <div className="space-y-2.5">
          {comments.map((item) => (
            <div
              key={item.id}
              onClick={() => handleCommentClick(item.vacancy_id)}
              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/70 dark:hover:bg-blue-950/40 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 transition cursor-pointer space-y-1 group"
            >
              <div className="flex items-center justify-between gap-1 text-[10px]">
                <span className="font-extrabold text-slate-800 dark:text-slate-200 truncate max-w-[130px]">
                  {item.author_name || 'Mehmon'}
                </span>
                <span className="text-slate-400 shrink-0">
                  {formatRelativeTime(item.created_at)}
                </span>
              </div>

              {item.vacancy_title && (
                <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 truncate group-hover:underline">
                  💼 {item.vacancy_title}
                </div>
              )}

              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium line-clamp-2 leading-snug">
                {item.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Footer Navigation */}
      {onNavigateToComments && (
        <button
          type="button"
          onClick={onNavigateToComments}
          className="w-full py-1.5 px-2 rounded-xl text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition flex items-center justify-center gap-1"
        >
          <span>{lang === 'ru' ? 'Все комментарии в ленте' : lang === 'en' ? 'All stream comments' : 'Barcha izohlarni ko‘rish'}</span>
          <ArrowRight size={12} />
        </button>
      )}
    </div>
  );
}
