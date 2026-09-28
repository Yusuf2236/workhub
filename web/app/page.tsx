'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from '../components/Header';
import LeftSidebar, { NavTab } from '../components/LeftSidebar';
import RightSidebar from '../components/RightSidebar';
import VacancyCard from '../components/VacancyCard';
import VacancyDetailModal from '../components/VacancyDetailModal';
import ApplyModal from '../components/ApplyModal';
import CreateVacancyModal from '../components/CreateVacancyModal';
import CreateResumeModal from '../components/CreateResumeModal';
import ResumesView from '../components/ResumesView';
import ApplicationsView from '../components/ApplicationsView';
import ProfileView from '../components/ProfileView';
import HomeFeedView from '../components/HomeFeedView';
import FullChatView from '../components/FullChatView';
import AuthModal from '../components/AuthModal';
import ChatModal from '../components/ChatModal';
import NotificationsModal from '../components/NotificationsModal';
import { api, getAuthToken, setAuthToken, getCurrentUser, removeAuthToken, setCurrentUser } from '../lib/api';
import { Language, translations } from '../lib/translations';
import { Search, Filter, RefreshCw, Briefcase, Sparkles, MapPin, Bookmark, ShieldCheck } from 'lucide-react';

const CATEGORIES = [
  'Barchasi',
  'Ta’lim & Fan',
  'IT & Dasturlash',
  'Marketing & Savdo',
  'Dizayn & UX',
  'Moliya & Buxgalteriya',
  'HR & Menejment',
  'Tibbiyot & Salomatlik',
  'Transport & Logistika',
  'Mijozlarga xizmat',
  'Qurilish & Ishlab chiqarish',
  'Servis & Xizmat ko‘rsatish',
];

const REGIONS = [
  'Barcha hududlar',
  'Toshkent shahri',
  'Toshkent viloyati',
  'Samarqand viloyati',
  'Farg‘ona viloyati',
  'Andijon viloyati',
  'Namangan viloyati',
  'Buxoro viloyati',
  'Xorazm viloyati',
  'Qashqadaryo viloyati',
  'Surxondaryo viloyati',
  'Jizzax viloyati',
  'Sirdaryo viloyati',
  'Navoiy viloyati',
  'Qoraqalpog‘iston Respublikasi',
  'Masofaviy (Remote)',
];

const JOB_TYPES = [
  'Barchasi',
  'Full-time',
  'Part-time',
  'Remote',
  'Gibrid',
];

export default function WZonePortal() {
  const [lang, setLang] = useState<Language>('uz');
  const t = translations[lang] || translations.uz;

  const [user, setUser] = useState<any>(null);
  const [vacancies, setVacancies] = useState<any[]>([]);
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resumesLoading, setResumesLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState<NavTab>('feed');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Barchasi');
  const [selectedLocation, setSelectedLocation] = useState('Barcha hududlar');
  const [selectedJobType, setSelectedJobType] = useState('Barchasi');

  // Pagination & Infinite Scroll
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalVacancies, setTotalVacancies] = useState(0);
  const observerRef = useRef<HTMLDivElement | null>(null);

  // Interactive Saved & Applications & Notifications
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [createVacancyModalOpen, setCreateVacancyModalOpen] = useState(false);
  const [createResumeModalOpen, setCreateResumeModalOpen] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatTargetUser, setChatTargetUser] = useState<any | null>(null);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [selectedVacancyForDetail, setSelectedVacancyForDetail] = useState<any | null>(null);
  const [selectedVacancyForApply, setSelectedVacancyForApply] = useState<any | null>(null);
  const [oneidNotice, setOneidNotice] = useState<string | null>(null);

  // Dark Mode
  const [darkMode, setDarkMode] = useState(false);

  // Real-time search debounce (250ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Auto-login & Session restore from backend
  useEffect(() => {
    async function restoreSession() {
      const savedLang = localStorage.getItem('workhub_lang') as Language;
      if (savedLang && (savedLang === 'uz' || savedLang === 'ru' || savedLang === 'en')) {
        setLang(savedLang);
      }

      const saved = localStorage.getItem('workhub_saved');
      if (saved) {
        try {
          setSavedIds(JSON.parse(saved));
        } catch {}
      }

      // Restore theme (dark / light mode) with localStorage persistence
      try {
        const savedTheme = localStorage.getItem('workhub_theme');
        if (savedTheme) {
          const isDark = savedTheme === 'dark';
          setDarkMode(isDark);
          if (isDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          setDarkMode(true);
          document.documentElement.classList.add('dark');
        } else {
          setDarkMode(false);
          document.documentElement.classList.remove('dark');
        }
      } catch (_) {}

      // Check local cached user first for instant UI response
      const cachedUser = getCurrentUser();
      if (cachedUser) {
        setUser(cachedUser);
        setAuthModalOpen(false);
      }

      // Check if redirected from OneID OAuth or completed in popup via localStorage
      if (typeof window !== 'undefined') {
        const pendingOneID = localStorage.getItem('workhub_oneid_auth_callback');
        if (pendingOneID) {
          localStorage.removeItem('workhub_oneid_auth_callback');
          try {
            const data = JSON.parse(pendingOneID);
            if (data.code) {
              const res = await api.oneIDCallback({
                code: data.code,
                pinfl: data.pinfl || '',
              });
              if (res.success && res.data) {
                setAuthToken(res.data.token);
                setCurrentUser(res.data.user);
                setUser(res.data.user);
                setAuthModalOpen(false);
                setCurrentTab('profile');
                setOneidNotice(`Xush kelibsiz, ${res.data.user.name || 'Fuqaro'}! OneID orqali avtomatik kirdingiz.`);
                setTimeout(() => setOneidNotice(null), 5000);
              }
            }
          } catch (e) {}
        }

        const pendingGoogle = localStorage.getItem('workhub_google_auth_token');
        if (pendingGoogle) {
          localStorage.removeItem('workhub_google_auth_token');
          try {
            const data = JSON.parse(pendingGoogle);
            const redirectUri = `${window.location.origin}/api/auth/callback/google`;
            const payload = data.accessToken
              ? { access_token: data.accessToken }
              : { code: data.code, redirect_uri: redirectUri };
            const gRes = await api.googleAuth(payload);
            if (gRes.success && gRes.data) {
              setAuthToken(gRes.data.token);
              setCurrentUser(gRes.data.user);
              setUser(gRes.data.user);
              setAuthModalOpen(false);
            }
          } catch (e) {}
        }

        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const searchParams = new URLSearchParams(window.location.search);
        
        // Handle OneID query callback (/ ?oneid_code=...)
        const urlOneIDCode = searchParams.get('oneid_code') || 
          (searchParams.get('code') && (searchParams.get('state')?.includes('oneid') || searchParams.get('scope')?.includes('workhub')) ? searchParams.get('code') : null);
        if (urlOneIDCode) {
          window.history.replaceState(null, '', window.location.pathname);
          try {
            const res = await api.oneIDCallback({ code: urlOneIDCode, pinfl: '' });
            if (res.success && res.data) {
              setAuthToken(res.data.token);
              setCurrentUser(res.data.user);
              setUser(res.data.user);
              setAuthModalOpen(false);
              setCurrentTab('profile');
              setOneidNotice(`Xush kelibsiz, ${res.data.user.name || 'Fuqaro'}! OneID orqali avtomatik kirdingiz.`);
              setTimeout(() => setOneidNotice(null), 5000);
            }
          } catch (err) {
            console.warn('OneID URL authentication error', err);
          }
        }

        const urlAccessToken = hashParams.get('access_token') || searchParams.get('access_token');
        const urlCode = searchParams.get('code') || hashParams.get('code');

        if (urlAccessToken || (urlCode && !urlOneIDCode)) {
          window.history.replaceState(null, '', window.location.pathname);
          const redirectUri = `${window.location.origin}/api/auth/callback/google`;
          const payload = urlAccessToken
            ? { access_token: urlAccessToken }
            : { code: urlCode || '', redirect_uri: redirectUri };
          try {
            const gRes = await api.googleAuth(payload);
            if (gRes.success && gRes.data) {
              setAuthToken(gRes.data.token);
              setCurrentUser(gRes.data.user);
              setUser(gRes.data.user);
              setAuthModalOpen(false);
            }
          } catch (err) {
            console.warn('Google URL authentication error', err);
          }
        }
      }

      // Check backend session with token
      const token = getAuthToken();
      if (token) {
        try {
          const res = await api.getMe();
          if (res.success && res.data?.user) {
            setUser(res.data.user);
            setCurrentUser(res.data.user);
            setAuthModalOpen(false);
          } else {
            // Token expired or invalid
            removeAuthToken();
            setUser(null);
          }
        } catch {
          const local = getCurrentUser();
          if (local) {
            setUser(local);
            setAuthModalOpen(false);
          }
        }
      }
    }
    restoreSession();

    // Listen for OneID postMessage from popups
    const handleOneIDMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'WORKHUB_ONEID_AUTH_CALLBACK' && event.data?.code) {
        try {
          const res = await api.oneIDCallback({
            code: event.data.code,
            pinfl: event.data.pinfl || '',
          });
          if (res.success && res.data) {
            setAuthToken(res.data.token);
            setCurrentUser(res.data.user);
            setUser(res.data.user);
            setAuthModalOpen(false);
            setCurrentTab('profile');
            setOneidNotice(`Xush kelibsiz, ${res.data.user.name || 'Fuqaro'}! OneID orqali avtomatik kirdingiz.`);
            setTimeout(() => setOneidNotice(null), 5000);
          }
        } catch (e) {}
      }
    };
    window.addEventListener('message', handleOneIDMessage);

    // Listen for cross-component / cross-window auth sync
    const syncAuth = () => {
      const u = getCurrentUser();
      if (u) {
        setUser(u);
        setAuthModalOpen(false);
      } else {
        setUser(null);
      }
    };
    window.addEventListener('workhub_auth_changed', syncAuth);
    window.addEventListener('storage', syncAuth);
    return () => {
      window.removeEventListener('message', handleOneIDMessage);
      window.removeEventListener('workhub_auth_changed', syncAuth);
      window.removeEventListener('storage', syncAuth);
    };
  }, []);

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('workhub_lang', newLang);
  };

  const toggleDarkMode = () => {
    const nextMode = !darkMode;
    setDarkMode(nextMode);
    if (nextMode) {
      document.documentElement.classList.add('dark');
      try {
        localStorage.setItem('workhub_theme', 'dark');
      } catch (_) {}
    } else {
      document.documentElement.classList.remove('dark');
      try {
        localStorage.setItem('workhub_theme', 'light');
      } catch (_) {}
    }
  };

  // Fetch Vacancies from Backend (PostgreSQL + Redis) with Pagination
  const fetchVacancies = useCallback(async () => {
    setLoading(true);
    setPage(1);
    try {
      const res = await api.getVacancies({
        q: debouncedSearch,
        category: selectedCategory,
        location: selectedLocation === 'Barcha hududlar' ? '' : selectedLocation,
        job_type: selectedJobType,
        page: 1,
        limit: 15,
      });

      if (res.success && res.data?.vacancies) {
        setVacancies(res.data.vacancies);
        setHasMore(Boolean(res.data.has_more));
        if (res.data.total !== undefined) {
          setTotalVacancies(res.data.total);
        }
      }
    } catch (err) {
      console.error('Failed to fetch vacancies', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedCategory, selectedLocation, selectedJobType]);

  // Infinite Scroll: Load Next Page
  const loadMoreVacancies = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await api.getVacancies({
        q: debouncedSearch,
        category: selectedCategory,
        location: selectedLocation === 'Barcha hududlar' ? '' : selectedLocation,
        job_type: selectedJobType,
        page: nextPage,
        limit: 15,
      });

      if (res.success && res.data?.vacancies && res.data.vacancies.length > 0) {
        setVacancies((prev) => {
          const existing = new Set(prev.map((v) => v.id));
          const fresh = res.data.vacancies.filter((v: any) => !existing.has(v.id));
          return [...prev, ...fresh];
        });
        setPage(nextPage);
        setHasMore(Boolean(res.data.has_more));
        if (res.data.total !== undefined) {
          setTotalVacancies(res.data.total);
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to load more vacancies', err);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [page, hasMore, loading, loadingMore, debouncedSearch, selectedCategory, selectedLocation, selectedJobType]);

  // Observer for automatic infinite scroll
  useEffect(() => {
    if (currentTab !== 'feed') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadMoreVacancies();
        }
      },
      { threshold: 0.1 }
    );

    const currentTrigger = observerRef.current;
    if (currentTrigger) {
      observer.observe(currentTrigger);
    }

    return () => {
      if (currentTrigger) {
        observer.unobserve(currentTrigger);
      }
      observer.disconnect();
    };
  }, [currentTab, hasMore, loading, loadingMore, loadMoreVacancies]);

  // Fetch Resumes from Backend (PostgreSQL)
  const fetchResumes = useCallback(async () => {
    setResumesLoading(true);
    try {
      const res = await api.getResumes(true);
      if (res.success && res.data?.resumes) {
        setResumes(res.data.resumes);
      }
    } catch (err) {
      console.error('Failed to fetch resumes', err);
    } finally {
      setResumesLoading(false);
    }
  }, []);

  // Fetch User Applications & Notifications
  const fetchUserData = useCallback(async () => {
    if (user) {
      try {
        const [appRes, notifRes] = await Promise.all([
          api.getApplications(),
          api.getNotifications(),
        ]);
        if (appRes.success && appRes.data?.applications) {
          setApplications(appRes.data.applications);
        }
        if (notifRes.success && notifRes.data?.notifications) {
          setNotifications(notifRes.data.notifications);
        }
      } catch (err) {
        console.error('Error fetching user data', err);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchVacancies();
  }, [fetchVacancies]);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Toggle Save Job
  const handleToggleSave = (v: any) => {
    let updated: string[];
    if (savedIds.includes(v.id)) {
      updated = savedIds.filter((id) => id !== v.id);
    } else {
      updated = [...savedIds, v.id];
    }
    setSavedIds(updated);
    localStorage.setItem('workhub_saved', JSON.stringify(updated));
  };

  // Handle Apply Click
  const handleApplyClick = (v: any) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setSelectedVacancyForApply(v);
    setApplyModalOpen(true);
  };

  // Unread notifications
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Filtered lists for saved / my-vacancies
  const displayedVacancies = () => {
    if (currentTab === 'saved') {
      return vacancies.filter((v) => savedIds.includes(v.id));
    }
    if (currentTab === 'my-vacancies') {
      if (!user) return [];
      return vacancies.filter((v) => v.created_by === user.id);
    }
    return vacancies;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] flex flex-col font-sans transition-colors duration-200 text-slate-900 dark:text-slate-100">
      {/* Top Navigation Header */}
      <Header
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenCreateVacancy={() => setCreateVacancyModalOpen(true)}
        onOpenCreateResume={() => setCreateResumeModalOpen(true)}
        onOpenChat={() => setCurrentTab('chat')}
        onOpenNotifications={() => setNotificationsModalOpen(true)}
        unreadNotificationsCount={unreadCount}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (q.trim() && currentTab === 'feed') {
            setCurrentTab('vacancies');
          }
        }}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onUserLogout={() => setUser(null)}
        lang={lang}
        onSelectLang={handleLanguageChange}
      />

      {/* OneID Verification Alert / Toast Banner */}
      {oneidNotice && (
        <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600 text-white px-4 py-2.5 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-md animate-fadeIn">
          <ShieldCheck size={17} className="text-blue-200" />
          <span>{oneidNotice}</span>
          <button
            onClick={() => setOneidNotice(null)}
            className="ml-3 px-1.5 py-0.5 rounded-full hover:bg-white/20 text-white text-xs font-bold transition"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main 3-Column Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
        {/* Left Navigation Sidebar */}
        <LeftSidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
          }}
          user={user}
          savedCount={savedIds.length}
          applicationsCount={applications.length}
          lang={lang}
        />

        {/* Center Main Feed / Dynamic View */}
        <main className="flex-1 min-w-0 space-y-5">
          {currentTab === 'applications' ? (
            <ApplicationsView
              applications={applications}
              onSelectVacancy={(id) => {
                const target = vacancies.find((v) => v.id === id);
                if (target) setSelectedVacancyForDetail(target);
              }}
              onOpenChat={() => setChatModalOpen(true)}
              lang={lang}
            />
          ) : currentTab === 'resumes' ? (
            <ResumesView
              resumes={resumes}
              onOpenCreateResume={() => setCreateResumeModalOpen(true)}
              onOpenChat={(candidate) => {
                if (candidate) {
                  setChatTargetUser({
                    id: candidate.user_id,
                    name: candidate.title || candidate.full_name || 'Nomzod',
                  });
                  setChatModalOpen(true);
                } else {
                  setCurrentTab('chat');
                }
              }}
              onRefresh={fetchResumes}
              loading={resumesLoading}
              lang={lang}
            />
          ) : currentTab === 'chat' ? (
            <FullChatView
              currentUser={user}
              onOpenAuth={() => setAuthModalOpen(true)}
              lang={lang}
            />
          ) : currentTab === 'profile' ? (
            <ProfileView
              user={user}
              onUserUpdated={setUser}
              lang={lang}
              onLanguageChange={(newLang) => {
                setLang(newLang);
                try {
                  localStorage.setItem('workhub_lang', newLang);
                } catch (_) {}
              }}
              darkMode={darkMode}
              onToggleDarkMode={() => {
                const next = !darkMode;
                setDarkMode(next);
                try {
                  localStorage.setItem('workhub_theme', next ? 'dark' : 'light');
                } catch (_) {}
                if (next) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              }}
              onOpenCreateResume={() => setCreateResumeModalOpen(true)}
              resumes={resumes}
              onRefreshResumes={fetchResumes}
              onLogout={() => {
                removeAuthToken();
                setUser(null);
                setCurrentTab('feed');
              }}
            />
          ) : currentTab === 'saved' && displayedVacancies().length === 0 ? (
            <div className="p-14 text-center bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <Bookmark size={44} className="mx-auto text-slate-400" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Saqlangan vakansiyalar yo‘q
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Sizga ma’qul kelgan vakansiya kartasidagi belgi (bookmark) ustiga bosib saqlab qo‘yishingiz mumkin.
              </p>
              <button
                onClick={() => setCurrentTab('feed')}
                className="mt-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-500/20"
              >
                Vakansiyalarni ko‘rish
              </button>
            </div>
          ) : currentTab === 'my-vacancies' && (!user || displayedVacancies().length === 0) ? (
            <div className="p-14 text-center bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <Briefcase size={44} className="mx-auto text-slate-400" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Siz joylashtirgan e’lonlar mavjud emas
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Kompaniyangiz uchun yangi bo‘sh ish o‘rni yaratish uchun quyidagi tugmani bosing.
              </p>
              <button
                onClick={() => {
                  if (!user) setAuthModalOpen(true);
                  else setCreateVacancyModalOpen(true);
                }}
                className="mt-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition"
              >
                + Vakansiya e’lon qilish
              </button>
            </div>
          ) : currentTab === 'feed' ? (
            <HomeFeedView
              vacancies={vacancies}
              onSelectVacancy={(v) => setSelectedVacancyForDetail(v)}
              onNavigateToVacancies={() => setCurrentTab('vacancies')}
              onOpenCreateResume={() => {
                if (!user) setAuthModalOpen(true);
                else setCreateResumeModalOpen(true);
              }}
              onOpenCreateVacancy={() => {
                if (!user) setAuthModalOpen(true);
                else setCreateVacancyModalOpen(true);
              }}
              onApplyVacancy={(v) => {
                setSelectedVacancyForApply(v);
                setApplyModalOpen(true);
              }}
              isSaved={(id) => savedIds.includes(id)}
              onToggleSave={handleToggleSave}
              currentUser={user}
              lang={lang}
            />
          ) : (
            <>
              {/* Category & Region Filter Chips Bar */}
              <div className="bg-white dark:bg-slate-900/90 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition ${
                        selectedCategory === cat
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Sub-Filters: 14 Regions of Uzbekistan & Job Type */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    {/* Region Selector with all 14 provinces */}
                    <div className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-blue-600 dark:text-blue-400" />
                      <span className="font-bold text-slate-700 dark:text-slate-300">{t.regionLabel}</span>
                      <select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      >
                        {REGIONS.map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Job Type Selector */}
                    <div className="flex items-center gap-1.5">
                      <Briefcase size={14} className="text-blue-600 dark:text-blue-400" />
                      <span className="font-bold text-slate-700 dark:text-slate-300">{t.jobTypeLabel}</span>
                      <select
                        value={selectedJobType}
                        onChange={(e) => setSelectedJobType(e.target.value)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      >
                        {JOB_TYPES.map((jt) => (
                          <option key={jt} value={jt}>
                            {jt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      {displayedVacancies().length} {t.vacanciesCount}
                    </span>
                    <button
                      onClick={fetchVacancies}
                      title={t.refresh}
                      className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <RefreshCw size={14} className={loading ? 'animate-spin text-blue-600' : ''} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Vacancy Feed Cards */}
              {loading && vacancies.length === 0 ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 animate-pulse space-y-3"
                    >
                      <div className="flex gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800" />
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
                          <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : displayedVacancies().length === 0 ? (
                <div className="p-14 text-center bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
                  <Briefcase size={40} className="mx-auto text-slate-400" />
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Ushbu hudud yoki mezon bo‘yicha vakansiyalar topilmadi
                  </h4>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Boshqa viloyatni tanlang yoki qidiruv so‘zini tozalang.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {displayedVacancies().map((v) => (
                    <VacancyCard
                      key={v.id}
                      vacancy={v}
                      isSaved={savedIds.includes(v.id)}
                      onToggleSave={handleToggleSave}
                      onApply={handleApplyClick}
                      onSelect={(vac) => setSelectedVacancyForDetail(vac)}
                      lang={lang}
                    />
                  ))}

                  {/* Infinite Scroll Trigger Sentinel & Loading Indicator */}
                  {currentTab === 'vacancies' && (
                    <div ref={observerRef} className="py-4 text-center">
                      {loadingMore && (
                        <div className="flex items-center justify-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 py-3 bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                          <RefreshCw size={15} className="animate-spin text-blue-600" />
                          <span>Yangi vakansiyalar yuklanmoqda...</span>
                        </div>
                      )}
                      {!hasMore && vacancies.length > 0 && (
                        <p className="text-[11px] font-bold text-slate-400 py-2">
                          ✓ Barcha vakansiyalar ko‘rsatildi ({totalVacancies || vacancies.length} ta)
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>

        {/* Right Info & Widgets Sidebar */}
        <RightSidebar vacanciesCount={totalVacancies || vacancies.length} lang={lang} />
      </div>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(u) => {
          setUser(u);
          setAuthModalOpen(false);
          setCurrentTab('profile');
          fetchUserData();
        }}
      />

      <VacancyDetailModal
        vacancy={selectedVacancyForDetail}
        onClose={() => setSelectedVacancyForDetail(null)}
        onApply={(v) => {
          setSelectedVacancyForDetail(null);
          handleApplyClick(v);
        }}
        currentUser={user}
      />

      <ApplyModal
        vacancy={selectedVacancyForApply}
        isOpen={applyModalOpen}
        onClose={() => {
          setApplyModalOpen(false);
          setSelectedVacancyForApply(null);
        }}
        onSuccess={() => {
          fetchUserData();
        }}
      />

      <CreateVacancyModal
        isOpen={createVacancyModalOpen}
        onClose={() => setCreateVacancyModalOpen(false)}
        onSuccess={(newVac) => {
          if (newVac?.category) {
            setSelectedCategory(newVac.category);
          } else {
            setSelectedCategory('Barchasi');
          }
          fetchVacancies();
        }}
      />

      <CreateResumeModal
        isOpen={createResumeModalOpen}
        onClose={() => setCreateResumeModalOpen(false)}
        onSuccess={() => {
          fetchResumes();
          setCurrentTab('resumes');
        }}
        currentUser={user}
      />

      <ChatModal
        isOpen={chatModalOpen}
        onClose={() => {
          setChatModalOpen(false);
          setChatTargetUser(null);
        }}
        currentUser={user}
        targetUser={chatTargetUser}
      />

      <NotificationsModal
        isOpen={notificationsModalOpen}
        onClose={() => setNotificationsModalOpen(false)}
        notifications={notifications}
        onRefresh={fetchUserData}
      />
    </div>
  );
}
