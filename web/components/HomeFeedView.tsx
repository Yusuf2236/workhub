'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Briefcase,
  Search,
  MapPin,
  DollarSign,
  Bookmark,
  RefreshCw,
  Check,
} from 'lucide-react';
import { Language, translations } from '../lib/translations';
import { api } from '../lib/api';
import { NavTab } from './LeftSidebar';
import InterestSurvey from './InterestSurvey';
import { SurveyAnswers, EMPTY_SURVEY, surveyIsActive, surveyVacancyFilters } from '../lib/survey';

// The feed only shows real data from the backend: vacancies and comments people left on them.

export interface CommentItem {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
  vacancyId?: string;
  vacancyTitle: string;
}

type StreamItem =
  | { streamId: string; type: 'vacancy'; data: any }
  | { streamId: string; type: 'discussion'; data: CommentItem };

interface HomeFeedViewProps {
  vacancies: any[];
  totalVacancies?: number;
  survey: SurveyAnswers | null; // null until loaded from the browser
  onSurveyChange: (answers: SurveyAnswers) => void;
  onSelectVacancy: (vacancy: any) => void;
  onNavigateToVacancies: () => void;
  onOpenCreateResume: () => void;
  onOpenCreateVacancy: () => void;
  onApplyVacancy: (vacancy: any) => void;
  isSaved?: (id: string) => boolean;
  onToggleSave?: (vacancy: any) => void;
  currentUser: any;
  onNavigateToTab?: (tab: NavTab) => void;
  /** Hero search: runs a vacancy search for the keyword and region */
  onSearch?: (query: string, region: string) => void;
  regions?: string[];
  lang?: Language;
}

const POPULAR_SEARCHES: Record<Language, string[]> = {
  uz: ['Dasturchi', 'Buxgalter', 'O‘qituvchi', 'Sotuv menejeri', 'Haydovchi', 'Dizayner'],
  ru: ['Программист', 'Бухгалтер', 'Учитель', 'Менеджер по продажам', 'Водитель', 'Дизайнер'],
  en: ['Developer', 'Accountant', 'Teacher', 'Sales manager', 'Driver', 'Designer'],
};

const VACANCIES_PER_PAGE = 3;
const COMMENTS_PER_PAGE = 2;
const AUTO_REFRESH_MS = 60_000;

const toCommentItem = (c: any): CommentItem => ({
  id: c.id,
  authorName: c.author_name || '',
  authorAvatar: c.author_avatar || '',
  content: c.content,
  createdAt: c.created_at,
  vacancyId: c.vacancy_id,
  vacancyTitle: c.vacancy_title || '',
});

// Interleave: two vacancies, then one comment, while both lists last
function interleave(vacs: any[], coms: CommentItem[]): StreamItem[] {
  const out: StreamItem[] = [];
  let ci = 0;
  vacs.forEach((v, i) => {
    out.push({ streamId: `v-${v.id}`, type: 'vacancy', data: v });
    if (i % 2 === 1 && ci < coms.length) {
      out.push({ streamId: `d-${coms[ci].id}`, type: 'discussion', data: coms[ci++] });
    }
  });
  for (; ci < coms.length; ci++) out.push({ streamId: `d-${coms[ci].id}`, type: 'discussion', data: coms[ci] });
  return out;
}

export default function HomeFeedView({
  vacancies,
  totalVacancies,
  survey,
  onSurveyChange,
  onSelectVacancy,
  onNavigateToVacancies,
  onOpenCreateResume,
  onApplyVacancy,
  isSaved,
  onToggleSave,
  currentUser,
  onSearch,
  regions = [],
  lang = 'uz',
}: HomeFeedViewProps) {
  const t = translations[lang] || translations.uz;
  const [heroQuery, setHeroQuery] = useState('');
  const [heroRegion, setHeroRegion] = useState(regions[0] || '');
  const runSearch = (q: string) => {
    if (onSearch) onSearch(q.trim(), heroRegion);
    else onNavigateToVacancies();
  };

  // Feed personalization from the interests survey (left sidebar)
  const surveyFilters = survey ? surveyVacancyFilters(survey) : {};

  // Skills saved in the user's profile rank matching vacancies higher in the feed
  const [profileSkills, setProfileSkills] = useState<string[]>([]);
  useEffect(() => {
    if (!currentUser) {
      setProfileSkills([]);
      return;
    }
    let cancelled = false;
    api
      .getProfile()
      .then((res) => {
        if (cancelled || !res.success) return;
        const raw: string = res.data?.profile?.skills || '';
        setProfileSkills(raw.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 12));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id]);

  const surveyFilterKey = JSON.stringify({ ...surveyFilters, skills: profileSkills });
  const personalized = Boolean(survey && surveyIsActive(survey));

  const [streamFilter, setStreamFilter] = useState<'all' | 'jobs' | 'comments'>('all');
  const [streamItems, setStreamItems] = useState<StreamItem[]>([]);
  const [streamPage, setStreamPage] = useState(1);
  const [isLoadingMoreStream, setIsLoadingMoreStream] = useState(false);
  const [streamHasMore, setStreamHasMore] = useState(true);
  const infiniteSentinelRef = useRef<HTMLDivElement | null>(null);

  const commentsPageRef = useRef(1);
  const commentsHasMoreRef = useRef(true);
  // Bumped whenever the stream is rebuilt so in-flight results for old filters are dropped
  const streamGenRef = useRef(0);

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

  const fetchBatch = useCallback(
    async (vacPage: number, comPage: number | null) => {
      const [vacRes, comRes] = await Promise.all([
        api.getVacancies({ ...surveyFilters, skills: profileSkills, page: vacPage, limit: VACANCIES_PER_PAGE }).catch(() => null),
        comPage !== null
          ? api.getRecentComments(comPage, COMMENTS_PER_PAGE, surveyFilters.category).catch(() => null)
          : Promise.resolve(null),
      ]);
      return {
        vacs: (vacRes && vacRes.success && vacRes.data?.vacancies) || ([] as any[]),
        vacsHasMore: Boolean(vacRes && vacRes.success && vacRes.data?.has_more),
        coms: comRes && comRes.success && comRes.data ? (comRes.data.comments || []).map(toCommentItem) : [],
        comsHasMore: Boolean(comRes && comRes.success && comRes.data?.has_more),
        comsLoaded: Boolean(comRes && comRes.success),
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [surveyFilterKey]
  );

  // Build the first batch from the newest vacancies & comments matching the survey answers
  useEffect(() => {
    if (survey === null) return;
    const gen = ++streamGenRef.current;
    (async () => {
      const batch = await fetchBatch(1, 1);
      if (gen !== streamGenRef.current) return;
      commentsPageRef.current = 1;
      commentsHasMoreRef.current = batch.comsHasMore;
      setStreamItems(interleave(batch.vacs, batch.coms));
      setStreamPage(1);
      setStreamHasMore(batch.vacsHasMore || batch.comsHasMore);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchBatch, survey === null]);

  // Endless scroll: next page of vacancies and comments, each item shown once
  const loadMoreStream = useCallback(async () => {
    if (isLoadingMoreStream || !streamHasMore) return;
    setIsLoadingMoreStream(true);
    try {
      const nextPage = streamPage + 1;
      const gen = streamGenRef.current;
      const batch = await fetchBatch(nextPage, commentsHasMoreRef.current ? commentsPageRef.current + 1 : null);
      if (gen !== streamGenRef.current) return;
      if (batch.comsLoaded) {
        commentsPageRef.current += 1;
        commentsHasMoreRef.current = batch.comsHasMore;
      }
      const newItems = interleave(batch.vacs, batch.coms);
      setStreamItems((prev) => {
        const seen = new Set(prev.map((i) => i.streamId));
        return [...prev, ...newItems.filter((i) => !seen.has(i.streamId))];
      });
      setStreamPage(nextPage);
      setStreamHasMore(batch.vacsHasMore || commentsHasMoreRef.current);
    } finally {
      setIsLoadingMoreStream(false);
    }
  }, [streamPage, isLoadingMoreStream, streamHasMore, fetchBatch]);

  // Every minute: put newly posted vacancies and comments on top of the feed
  useEffect(() => {
    if (survey === null) return;
    const timer = setInterval(async () => {
      const gen = streamGenRef.current;
      const batch = await fetchBatch(1, 1);
      if (gen !== streamGenRef.current) return;
      const fresh = interleave(batch.vacs, batch.coms);
      setStreamItems((prev) => {
        const seen = new Set(prev.map((i) => i.streamId));
        const added = fresh.filter((i) => !seen.has(i.streamId));
        return added.length > 0 ? [...added, ...prev] : prev;
      });
    }, AUTO_REFRESH_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchBatch, survey === null]);

  useEffect(() => {
    const sentinel = infiniteSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMoreStream) loadMoreStream();
      },
      { threshold: 0.1, rootMargin: '300px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMoreStream, isLoadingMoreStream]);

  const openCommentVacancy = async (vacancyId?: string) => {
    if (!vacancyId) return;
    const local = vacancies.find((v) => v.id === vacancyId);
    if (local) return onSelectVacancy(local);
    try {
      const res = await api.getVacancy(vacancyId);
      if (res.success && res.data?.vacancy) onSelectVacancy(res.data.vacancy);
    } catch (_) {}
  };

  const displayedStream = streamItems.filter((item) => {
    if (streamFilter === 'jobs') return item.type === 'vacancy';
    if (streamFilter === 'comments') return item.type === 'discussion';
    return true;
  });

  const filterPill = (key: 'all' | 'jobs' | 'comments', label: string) => (
    <button
      key={key}
      onClick={() => setStreamFilter(key)}
      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
        streamFilter === key
          ? 'bg-blue-600 text-white shadow-sm'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6 pb-24">
      {/* 1. HERO SEARCH — what + where, like a classic job board */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-sm">
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          {t.heroMainHeading}
        </h1>
        {Boolean(totalVacancies) && (
          <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
            {totalVacancies!.toLocaleString('ru-RU')} {t.vacanciesCount}
          </p>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(heroQuery);
          }}
          className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-0 sm:rounded-xl sm:border sm:border-slate-300 sm:dark:border-slate-700 sm:bg-white sm:dark:bg-slate-900 sm:p-1.5 sm:focus-within:ring-2 sm:focus-within:ring-blue-500/30"
        >
          <label className="flex items-center gap-2 flex-1 min-w-0 px-3 py-2.5 sm:py-1.5 rounded-xl sm:rounded-none border sm:border-0 border-slate-300 dark:border-slate-700">
            <Search size={17} className="text-slate-400 shrink-0" />
            <span className="sr-only">{t.heroWhatLabel}</span>
            <input
              type="text"
              value={heroQuery}
              onChange={(e) => setHeroQuery(e.target.value)}
              placeholder={t.heroWhatPlaceholder}
              className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
            />
          </label>

          {regions.length > 0 && (
            <label className="flex items-center gap-2 sm:w-56 px-3 py-2.5 sm:py-1.5 rounded-xl sm:rounded-none border sm:border-0 sm:border-l border-slate-300 dark:border-slate-700">
              <MapPin size={17} className="text-slate-400 shrink-0" />
              <span className="sr-only">{t.heroWhereLabel}</span>
              <select
                value={heroRegion}
                onChange={(e) => setHeroRegion(e.target.value)}
                className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-white focus:outline-none"
              >
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {t.regions?.[r] || r}
                  </option>
                ))}
              </select>
            </label>
          )}

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-bold transition"
          >
            {t.heroSearchBtn}
          </button>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs">
          <span className="font-semibold text-slate-500 dark:text-slate-400">{t.heroPopularSearches}</span>
          {(POPULAR_SEARCHES[lang] || POPULAR_SEARCHES.uz).map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => {
                setHeroQuery(term);
                runSearch(term);
              }}
              className="px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition"
            >
              {term}
            </button>
          ))}
        </div>

        <p className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
          {t.heroPostResumeHint}{' '}
          <button type="button" onClick={onOpenCreateResume} className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
            {t.heroPostResumeLink}
          </button>
        </p>
      </div>

      {/* 2. INTERESTS SURVEY — on desktop it lives in the left sidebar */}
      {survey && (
        <div className="lg:hidden">
          <InterestSurvey answers={survey} onChange={onSurveyChange} lang={lang} />
        </div>
      )}

      {personalized && (
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-[11px] font-bold">
          <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 min-w-0">
            <Check size={13} className="shrink-0" />
            <span className="truncate">{t.surveyFilterAppliedBadge}</span>
          </span>
          <button
            type="button"
            onClick={() => onSurveyChange({ ...EMPTY_SURVEY, completed: true })}
            className="shrink-0 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition"
          >
            {t.surveyClearFilterBtn}
          </button>
        </div>
      )}

      {/* 3. FEED: newest vacancies and comments */}
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900/90 backdrop-blur rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">{t.streamTitle}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t.streamSubtitle}</p>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {filterPill('all', t.streamFilterAll)}
              {filterPill('jobs', t.streamFilterJobs)}
              {filterPill('comments', t.streamFilterComments)}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {displayedStream.map((item) => {
            if (item.type === 'vacancy') {
              const v = item.data;
              return (
                <div
                  key={item.streamId}
                  onClick={() => onSelectVacancy(v)}
                  className="p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/95 hover:border-blue-400 dark:hover:border-blue-600 transition shadow-sm hover:shadow-md cursor-pointer space-y-3 group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0">
                      {v.company_logo ? (
                        <img
                          src={v.company_logo}
                          alt={v.company}
                          className="w-12 h-12 rounded-2xl object-contain bg-white border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                          {v.company ? v.company[0].toUpperCase() : 'W'}
                        </div>
                      )}
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{v.company}</span>
                          {v.category && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-extrabold">
                              {t.categories?.[v.category] || v.category}
                            </span>
                          )}
                          {v.location && (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <MapPin size={11} />
                              {t.regions?.[v.location] || v.location}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400">{formatRelativeTime(v.created_at)}</span>
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition leading-snug">
                          {v.title}
                        </h3>
                      </div>
                    </div>

                    {onToggleSave && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSave(v);
                        }}
                        className={`p-2 rounded-xl border transition shrink-0 ${
                          isSaved && isSaved(v.id)
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400'
                            : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                        }`}
                      >
                        <Bookmark size={15} className={isSaved && isSaved(v.id) ? 'fill-blue-600 dark:fill-blue-400' : ''} />
                      </button>
                    )}
                  </div>

                  {v.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">{v.description}</p>
                  )}

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
                    <div className="font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 min-w-0">
                      <DollarSign size={14} className="shrink-0" />
                      <span className="truncate">{v.salary || t.salaryNegotiable}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onApplyVacancy(v);
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold shadow-md shadow-blue-500/25 transition flex items-center gap-1.5 shrink-0"
                    >
                      <Briefcase size={13} />
                      <span>{t.applyBtn}</span>
                    </button>
                  </div>
                </div>
              );
            }

            const comment = item.data;
            return (
              <div
                key={item.streamId}
                className="p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/95 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {comment.authorAvatar ? (
                      <img
                        src={comment.authorAvatar}
                        alt={comment.authorName}
                        className="w-10 h-10 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center text-sm font-black border border-slate-200 dark:border-slate-700 shrink-0">
                        {(comment.authorName || t.guestUser).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                        {comment.authorName || t.guestUser}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium">{formatRelativeTime(comment.createdAt)}</span>
                    </div>
                  </div>
                  {comment.vacancyTitle && (
                    <button
                      type="button"
                      onClick={() => openCommentVacancy(comment.vacancyId)}
                      title={comment.vacancyTitle}
                      className="max-w-[45%] truncate text-[11px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900/70 px-2.5 py-0.5 rounded-md transition"
                    >
                      {comment.vacancyTitle}
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed whitespace-pre-line">
                  {comment.content}
                </p>
              </div>
            );
          })}
        </div>

        {/* Infinite scroll sentinel */}
        <div ref={infiniteSentinelRef} className="py-6 text-center">
          {streamHasMore ? (
            <div className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm text-xs font-bold text-blue-600 dark:text-blue-400">
              <RefreshCw size={16} className="animate-spin text-blue-600" />
              <span>{t.loadingMoreStreamNotice}</span>
            </div>
          ) : (
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {lang === 'ru' ? 'Вы просмотрели всё' : lang === 'en' ? "You're all caught up" : 'Hammasi ko‘rib chiqildi'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
