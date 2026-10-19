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
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  TrendingUp,
  ChevronRight,
  MessageCircle,
  Send,
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

const VACANCIES_PER_PAGE = 4;
const COMMENTS_PER_PAGE = 8;
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
  onOpenCreateVacancy,
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

  // WZone Interactive Animated Advertisement Carousel
  const [promoSlide, setPromoSlide] = useState(0);

  const PROMO_SLIDES = [
    {
      badge: lang === 'ru' ? 'AI Технологии' : lang === 'en' ? 'AI Powered' : 'AI Yordamchi',
      title:
        lang === 'ru'
          ? 'Создавайте резюme и вакансии за 10 секунд с помощью AI'
          : lang === 'en'
          ? 'Generate professional resumes & jobs in 10 seconds with AI'
          : 'AI bilan 10 soniyada professional rezyume va vakansiyalar yarating',
      desc:
        lang === 'ru'
          ? 'Укажите только название профессии — WZone AI подберет реальные навыки, актуальные обязанности и рыночную зарплату.'
          : lang === 'en'
          ? 'Just enter a job title — WZone AI will automatically pull market skills, authentic duties and competitive salary.'
          : 'Faqat lavozim nomini kiriting — WZone AI real bozor ko‘nikmalari, vazifalar va to‘g‘ri maosh ko‘lamini avtomatik to‘ldiradi.',
      cta: lang === 'ru' ? 'Заполнить с AI' : lang === 'en' ? 'Create with AI' : 'AI bilan rezyume yaratish',
      action: onOpenCreateResume,
      accent: 'from-blue-600 via-indigo-600 to-purple-600',
      glow: 'bg-blue-500/20 text-blue-400',
      icon: Sparkles,
    },
    {
      badge: lang === 'ru' ? '100% OneID' : lang === 'en' ? 'Verified OneID' : '100% OneID Kafolati',
      title:
        lang === 'ru'
          ? 'Проверенные работодатели и официальные соискатели'
          : lang === 'en'
          ? 'Verified employers & authentic candidates via OneID'
          : 'Faqat rasmiy tasdiqlangan ish beruvchilar va nomzodlar',
      desc:
        lang === 'ru'
          ? 'Никакого мошенничества и фейков. Работодатели подтверждаются через OneID портал Республики Узбекистан.'
          : lang === 'en'
          ? 'Zero spam or fake postings. Employers verify their identity via Uzbekistan OneID e-Gov portal.'
          : 'Soxta va firibgar e’lonlarga o‘rin yo‘q. Ish beruvchilar O‘zbekiston OneID portali orqali qat’iy tekshiriladi.',
      cta: lang === 'ru' ? 'Разместить вакансию' : lang === 'en' ? 'Post Verified Job' : 'Vakansiya e’lon qilish',
      action: onOpenCreateVacancy,
      accent: 'from-emerald-600 via-teal-600 to-blue-600',
      glow: 'bg-emerald-500/20 text-emerald-400',
      icon: ShieldCheck,
    },
    {
      badge: lang === 'ru' ? 'Smart GPS & Real-time' : lang === 'en' ? 'Smart GPS & Live' : 'Smart GPS & Jonli Oqim',
      title:
        lang === 'ru'
          ? 'Свежие вакансии каждую минуту и умный поиск по локации'
          : lang === 'en'
          ? 'Fresh job updates every 60s with smart proximity GPS'
          : 'Har daqiqada yangilanuvchi ish o‘rinlari va aqlli GPS qidiruv',
      desc:
        lang === 'ru'
          ? 'Вакансии обновляются в реальном времени. Находите работу рядом с домом одним нажатием кнопки геолокации.'
          : lang === 'en'
          ? 'Listings refresh continuously in real-time. Discover great jobs close to your exact location with instant GPS.'
          : 'Vakansiyalar har 60 soniyada avtomatik yangilanadi. GPS tugmasi orqali uyingizga eng yaqin ishni toping.',
      cta: lang === 'ru' ? 'Смотреть вакансии' : lang === 'en' ? 'Explore Jobs' : 'Vakansiyalarni ko‘rish',
      action: onNavigateToVacancies,
      accent: 'from-purple-600 via-pink-600 to-indigo-600',
      glow: 'bg-purple-500/20 text-purple-400',
      icon: Zap,
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setPromoSlide((prev) => (prev + 1) % PROMO_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [PROMO_SLIDES.length]);

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

  // Real-time inline comments state
  const [expandedVacancyIds, setExpandedVacancyIds] = useState<Set<string>>(new Set());
  const [vacancyCommentsMap, setVacancyCommentsMap] = useState<Record<string, any[]>>({});
  const [loadingCommentsMap, setLoadingCommentsMap] = useState<Record<string, boolean>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [submittingCommentMap, setSubmittingCommentMap] = useState<Record<string, boolean>>({});
  const [guestName, setGuestName] = useState<string>('');

  const toggleVacancyComments = async (vacancyId: string) => {
    setExpandedVacancyIds((prev) => {
      const next = new Set(prev);
      if (next.has(vacancyId)) {
        next.delete(vacancyId);
      } else {
        next.add(vacancyId);
      }
      return next;
    });

    if (!vacancyCommentsMap[vacancyId]) {
      setLoadingCommentsMap((prev) => ({ ...prev, [vacancyId]: true }));
      try {
        const res = await api.getVacancyComments(vacancyId);
        if (res.success && res.data?.comments) {
          setVacancyCommentsMap((prev) => ({ ...prev, [vacancyId]: res.data.comments }));
        }
      } catch (err) {
        console.error('Failed to load vacancy comments', err);
      } finally {
        setLoadingCommentsMap((prev) => ({ ...prev, [vacancyId]: false }));
      }
    }
  };

  const handleAddVacancyComment = async (vacancyId: string, vacancyTitle: string) => {
    const content = (commentDrafts[vacancyId] || '').trim();
    if (!content) return;

    const authorName = currentUser?.name || guestName.trim() || (lang === 'ru' ? 'Гость' : lang === 'en' ? 'Guest' : 'Mehmon');
    const authorAvatar = currentUser?.avatar_url || '';

    setSubmittingCommentMap((prev) => ({ ...prev, [vacancyId]: true }));
    try {
      const res = await api.createVacancyComment(vacancyId, {
        content,
        author_name: authorName,
        author_avatar: authorAvatar,
      });

      if (res.success && res.data?.comment) {
        const created = res.data.comment;

        // 1. Update vacancy comments list
        setVacancyCommentsMap((prev) => ({
          ...prev,
          [vacancyId]: [...(prev[vacancyId] || []), created],
        }));

        // 2. Clear draft
        setCommentDrafts((prev) => ({ ...prev, [vacancyId]: '' }));

        // 3. Increment comments_count in streamItems
        setStreamItems((prev) =>
          prev.map((item) => {
            if (item.type === 'vacancy' && item.data.id === vacancyId) {
              return {
                ...item,
                data: {
                  ...item.data,
                  comments_count: (item.data.comments_count || 0) + 1,
                },
              };
            }
            return item;
          })
        );

        // 4. Prepend to streamItems as a discussion item so it immediately appears in real-time stream
        const newDiscussion: StreamItem = {
          streamId: `d-${created.id}`,
          type: 'discussion',
          data: {
            id: created.id,
            authorName: created.author_name || authorName,
            authorAvatar: created.author_avatar || authorAvatar,
            content: created.content,
            createdAt: created.created_at,
            vacancyId: vacancyId,
            vacancyTitle: vacancyTitle,
          },
        };
        setStreamItems((prev) => [newDiscussion, ...prev]);
      }
    } catch (err) {
      console.error('Failed to post vacancy comment', err);
    } finally {
      setSubmittingCommentMap((prev) => ({ ...prev, [vacancyId]: false }));
    }
  };

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

  // Every 60 seconds: refresh feed with new vacancies and comments without jumping scroll
  useEffect(() => {
    const timer = setInterval(async () => {
      const gen = streamGenRef.current;
      const batch = await fetchBatch(1, 1);
      if (gen !== streamGenRef.current) return;
      const fresh = interleave(batch.vacs, batch.coms);
      setStreamItems((prev) => {
        const freshMap = new Map(fresh.map((i) => [i.streamId, i]));
        const updated = prev.map((item) => freshMap.get(item.streamId) || item);
        const seen = new Set(prev.map((i) => i.streamId));
        const added = fresh.filter((i) => !seen.has(i.streamId));
        return added.length > 0 ? [...added, ...updated] : updated;
      });
    }, AUTO_REFRESH_MS);
    return () => clearInterval(timer);
  }, [fetchBatch]);

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
      {/* 1. HERO SEARCH & WZONE ANIMATED PROMOTIONAL SHOWCASE */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-sm relative overflow-hidden">
        {/* Ambient Animated Glow Accents */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-gradient-to-br from-blue-500/15 via-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-gradient-to-tr from-purple-500/15 via-blue-500/10 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse-glow" />

        {/* WZONE INTERACTIVE ANIMATED PROMO BANNER (Fixed Uniform Dimensions) */}
        <div id="wzone-promo-banner" className="relative mb-6 rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-slate-950 dark:via-blue-950/50 dark:to-slate-950 text-white border border-indigo-500/30 shadow-lg shadow-indigo-500/10 overflow-hidden min-h-[220px] sm:min-h-[205px] flex flex-col justify-between">
          {/* Moving shimmer light streak */}
          <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-shimmer pointer-events-none" />

          {/* Top Bar: Live Beacon Badge & Slide Dots */}
          <div className="flex items-center justify-between gap-2 mb-2 relative z-10 flex-wrap">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-[11px] font-bold text-blue-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>WZone 2.0 • O‘zbekiston #1 AI Karyera Ekotizimi</span>
            </div>

            {/* Slide Navigation Dots & Tabs */}
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur px-2.5 py-1 rounded-full border border-white/10">
              {PROMO_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPromoSlide(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    promoSlide === idx ? 'w-5 bg-blue-400' : 'w-1.5 bg-white/30 hover:bg-white/60'
                  }`}
                  aria-label={`Promo slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Active Animated Slide Content (Locked Uniform Box) */}
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 py-1 min-h-[96px]">
            <div className="space-y-1 max-w-xl flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-md ${PROMO_SLIDES[promoSlide].glow}`}>
                  {React.createElement(PROMO_SLIDES[promoSlide].icon, { size: 12, className: 'shrink-0 animate-bounce' })}
                  {PROMO_SLIDES[promoSlide].badge}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight leading-snug line-clamp-2 h-[2.75rem] sm:h-[2.85rem] flex items-center">
                {PROMO_SLIDES[promoSlide].title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium line-clamp-2 h-[2.4rem] flex items-center">
                {PROMO_SLIDES[promoSlide].desc}
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <button
                type="button"
                onClick={PROMO_SLIDES[promoSlide].action}
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl text-white bg-gradient-to-r ${PROMO_SLIDES[promoSlide].accent} hover:brightness-110 active:scale-95 transition shadow-md shadow-black/30 group`}
              >
                <span>{PROMO_SLIDES[promoSlide].cta}</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Interactive Feature Highlights Strip */}
          <div className="mt-3 pt-2.5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-semibold text-slate-300 relative z-10">
            <div className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-400 shrink-0" />
              <span>Real bozor AI tahlili</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
              <span>OneID rasmiy kafolati</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap size={13} className="text-blue-400 shrink-0" />
              <span>60s Jonli yangilanish</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin size={13} className="text-purple-400 shrink-0" />
              <span>Smart GPS geolokatsiya</span>
            </div>
          </div>
        </div>

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

        {/* Stream Filter: Live Comments Header Banner */}
        {streamFilter === 'comments' && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                <MessageCircle size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    {lang === 'ru' ? 'Лента живых комментариев' : lang === 'en' ? 'Live Comments Stream' : 'Jonli Izohlar va Savollar Oqimi'}
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Real-time
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {lang === 'ru'
                    ? 'Актуальные вопросы и обсуждения по вакансиям в реальном времени'
                    : lang === 'en'
                    ? 'Real-time candidate questions and discussions on active vacancies'
                    : 'Nomzodlar va ish beruvchilar o‘rtasidagi real vaqtdagi savol-javoblar'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {displayedStream.map((item) => {
            if (item.type === 'vacancy') {
              const v = item.data;
              const isCommentsOpen = expandedVacancyIds.has(v.id);
              const commentsList = vacancyCommentsMap[v.id] || [];
              const isLoadingThis = loadingCommentsMap[v.id];
              const isSubmittingThis = submittingCommentMap[v.id];

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

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVacancyComments(v.id);
                        }}
                        className={`px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                          isCommentsOpen
                            ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-400 dark:border-blue-600 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                        title={lang === 'ru' ? 'Обсуждение и вопросы' : lang === 'en' ? 'Discussion & questions' : 'Izohlar va savollar'}
                      >
                        <MessageCircle size={14} className={isCommentsOpen ? 'text-blue-600 fill-blue-100 dark:fill-blue-900' : 'text-blue-500'} />
                        <span>{v.comments_count || 0}</span>
                        <span className="hidden sm:inline font-medium text-[11px] text-slate-400">
                          {lang === 'ru' ? 'коммент.' : lang === 'en' ? 'comments' : 'izoh'}
                        </span>
                      </button>

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

                  {/* Expandable Real-time Comments Drawer */}
                  {isCommentsOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 -mx-5 -mb-5 p-5 rounded-b-3xl space-y-3 cursor-default animate-fadeIn"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageCircle size={15} className="text-blue-600" />
                          <h4 className="text-xs font-black text-slate-900 dark:text-white">
                            {lang === 'ru' ? 'Обсуждения вакансии' : lang === 'en' ? 'Vacancy Discussions' : 'Vakansiya bo‘yicha izohlar'} ({commentsList.length})
                          </h4>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            Live
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleVacancyComments(v.id)}
                          className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                        >
                          ✕ {lang === 'ru' ? 'Закрыть' : lang === 'en' ? 'Close' : 'Yopish'}
                        </button>
                      </div>

                      {/* Comments List */}
                      {isLoadingThis ? (
                        <div className="py-6 flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
                          <RefreshCw size={14} className="animate-spin text-blue-600" />
                          <span>{lang === 'ru' ? 'Загрузка комментариев...' : lang === 'en' ? 'Loading comments...' : 'Izohlar yuklanmoqda...'}</span>
                        </div>
                      ) : commentsList.length === 0 ? (
                        <div className="py-5 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-4">
                          {lang === 'ru'
                            ? 'Пока никто не оставил комментариев. Задайте первый вопрос!'
                            : lang === 'en'
                            ? 'No comments yet. Be the first to ask a question!'
                            : 'Hozircha hech kim fikr bildirmagan. Birinchi bo‘lib savol bering!'}
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                          {commentsList.map((c: any) => (
                            <div
                              key={c.id}
                              className="p-3 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/70 dark:border-slate-800 shadow-sm space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                  {c.author_avatar ? (
                                    <img
                                      src={c.author_avatar}
                                      alt={c.author_name}
                                      className="w-6 h-6 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                                    />
                                  ) : (
                                    <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                                      {c.author_name ? c.author_name[0].toUpperCase() : 'M'}
                                    </div>
                                  )}
                                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                    {c.author_name || 'Mehmon'}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium shrink-0">
                                  {formatRelativeTime(c.created_at)}
                                </span>
                              </div>
                              <p className="text-xs text-slate-700 dark:text-slate-200 pl-8 leading-relaxed font-normal whitespace-pre-line">
                                {c.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Inline Comment Composer Form */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleAddVacancyComment(v.id, v.title);
                        }}
                        className="space-y-2 pt-1"
                      >
                        {!currentUser && (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-500">
                              {lang === 'ru' ? 'Ваше имя:' : lang === 'en' ? 'Your name:' : 'Ismingiz:'}
                            </span>
                            <input
                              type="text"
                              placeholder={lang === 'ru' ? 'Имя...' : lang === 'en' ? 'Name...' : 'Ismingiz...'}
                              value={guestName}
                              onChange={(e) => setGuestName(e.target.value)}
                              className="px-2.5 py-1 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder={
                              lang === 'ru'
                                ? 'Напишите комментарий или вопрос...'
                                : lang === 'en'
                                ? 'Write a comment or question...'
                                : 'Izoh yoki savol qoldiring...'
                            }
                            value={commentDrafts[v.id] || ''}
                            onChange={(e) =>
                              setCommentDrafts((prev) => ({ ...prev, [v.id]: e.target.value }))
                            }
                            className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                          <button
                            type="submit"
                            disabled={!(commentDrafts[v.id] || '').trim() || isSubmittingThis}
                            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm shrink-0"
                          >
                            {isSubmittingThis ? (
                              <RefreshCw size={12} className="animate-spin" />
                            ) : (
                              <Send size={12} />
                            )}
                            <span>{lang === 'ru' ? 'Отправить' : lang === 'en' ? 'Send' : 'Yuborish'}</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              );
            }

            const comment = item.data;
            const isReplying = comment.vacancyId ? expandedVacancyIds.has(comment.vacancyId) : false;
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
                      💼 {comment.vacancyTitle}
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed whitespace-pre-line pl-1">
                  {comment.content}
                </p>

                {comment.vacancyId && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleVacancyComments(comment.vacancyId!)}
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition flex items-center gap-1.5"
                    >
                      <MessageCircle size={13} />
                      <span>
                        {isReplying
                          ? (lang === 'ru' ? 'Скрыть обсуждение' : lang === 'en' ? 'Hide discussion' : 'Muhokamani yopish')
                          : (lang === 'ru' ? 'Ответить / Смотреть обсуждение' : lang === 'en' ? 'Reply / View discussion' : 'Javob yozish / Muhokama')}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openCommentVacancy(comment.vacancyId)}
                      className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                    >
                      {lang === 'ru' ? 'Перейти к вакансии →' : lang === 'en' ? 'Open vacancy →' : 'Vakansiyaga o‘tish →'}
                    </button>
                  </div>
                )}

                {/* Inline Reply / Discussion Box under Comment Card */}
                {comment.vacancyId && isReplying && (
                  <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 -mx-5 -mb-5 p-4 rounded-b-3xl space-y-3">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleAddVacancyComment(comment.vacancyId!, comment.vacancyTitle);
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        placeholder={
                          lang === 'ru'
                            ? 'Напишите ваш ответ или мнение...'
                            : lang === 'en'
                            ? 'Write your reply or thoughts...'
                            : 'Fikr yoki javobingizni yozing...'
                        }
                        value={commentDrafts[comment.vacancyId] || ''}
                        onChange={(e) =>
                          setCommentDrafts((prev) => ({ ...prev, [comment.vacancyId!]: e.target.value }))
                        }
                        className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <button
                        type="submit"
                        disabled={!(commentDrafts[comment.vacancyId] || '').trim() || submittingCommentMap[comment.vacancyId]}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm shrink-0"
                      >
                        {submittingCommentMap[comment.vacancyId] ? (
                          <RefreshCw size={12} className="animate-spin" />
                        ) : (
                          <Send size={12} />
                        )}
                        <span>{lang === 'ru' ? 'Отправить' : lang === 'en' ? 'Send' : 'Yuborish'}</span>
                      </button>
                    </form>
                  </div>
                )}
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
