'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header, { ThemeMode } from '../components/Header';
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
import AiResumeAuditView from '../components/AiResumeAuditView';
import ChatIntroModal from '../components/ChatIntroModal';
import ResetPasswordModal from '../components/ResetPasswordModal';
import { SurveyAnswers, EMPTY_SURVEY, loadSurvey, saveSurvey } from '../lib/survey';
import { api, getAuthToken, setAuthToken, getCurrentUser, removeAuthToken, setCurrentUser } from '../lib/api';
import { Language, translations } from '../lib/translations';
import { Search, Filter, RefreshCw, Briefcase, Sparkles, MapPin, Bookmark, ShieldCheck, Home, MessageSquare, FileCheck, User as UserIcon, Info, CheckCircle2 } from 'lucide-react';

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
  // Applications sent to vacancies the user posted (employer view)
  const [receivedApplications, setReceivedApplications] = useState<any[]>([]);
  // Saved / my-vacancies tabs load their own lists, independent of the paginated feed
  const [tabVacancies, setTabVacancies] = useState<any[]>([]);
  const [tabLoading, setTabLoading] = useState(false);
  const [editingVacancy, setEditingVacancy] = useState<any | null>(null);
  const [editingResume, setEditingResume] = useState<any | null>(null);
  // Emailed links: /?reset_token=... and /?verify_email=...
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [verificationResent, setVerificationResent] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authContext, setAuthContext] = useState<'default' | 'vacancy'>('default');
  const [createVacancyModalOpen, setCreateVacancyModalOpen] = useState(false);
  const [createResumeModalOpen, setCreateResumeModalOpen] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatTargetUser, setChatTargetUser] = useState<any | null>(null);
  const [activeChatRoomId, setActiveChatRoomId] = useState<string | null>(null);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [selectedVacancyForDetail, setSelectedVacancyForDetail] = useState<any | null>(null);
  // Desktop split view (list + detail side by side) on vacancy list tabs
  const [paneVacancyId, setPaneVacancyId] = useState<string | null>(null);
  const [selectedVacancyForApply, setSelectedVacancyForApply] = useState<any | null>(null);
  const [oneidNotice, setOneidNotice] = useState<string | null>(null);
  const [chatIntroOpen, setChatIntroOpen] = useState(false);
  const [survey, setSurvey] = useState<SurveyAnswers>(EMPTY_SURVEY);
  const [surveyLoaded, setSurveyLoaded] = useState(false);

  // Interests survey answers live in this browser and personalize the home feed
  useEffect(() => {
    setSurvey(loadSurvey());
    setSurveyLoaded(true);
  }, []);
  const handleSurveyChange = (answers: SurveyAnswers) => {
    setSurvey(answers);
    saveSurvey(answers);
  };
  const [vacanciesRefreshed, setVacanciesRefreshed] = useState(false);

  // Theme Mode: system, light, dark
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [resolvedDark, setResolvedDark] = useState(false);

  // Apply theme and update document element + state
  const applyTheme = useCallback((mode: ThemeMode) => {
    let isDark = false;
    if (mode === 'dark') {
      isDark = true;
    } else if (mode === 'light') {
      isDark = false;
    } else {
      isDark = typeof window !== 'undefined' && !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }

    setThemeMode(mode);
    setResolvedDark(isDark);

    if (typeof document !== 'undefined') {
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const handleSelectTheme = useCallback((mode: ThemeMode) => {
    try {
      localStorage.setItem('workhub_theme', mode);
      if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'WORKHUB_THEME_CHANGED', theme: mode }, '*');
      }
    } catch (_) {}
    applyTheme(mode);
  }, [applyTheme]);

  const toggleDarkMode = useCallback(() => {
    const nextMode: ThemeMode = resolvedDark ? 'light' : 'dark';
    handleSelectTheme(nextMode);
  }, [resolvedDark, handleSelectTheme]);

  // Initialize theme and attach media query change listener for system adaptive mode
  useEffect(() => {
    let saved: ThemeMode = 'system';
    try {
      const stored = localStorage.getItem('workhub_theme');
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        saved = stored;
      }
    } catch (_) {}

    applyTheme(saved);

    const mediaQuery = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    const handleChange = () => {
      let currentSaved: string | null = null;
      try {
        currentSaved = localStorage.getItem('workhub_theme');
      } catch (_) {}
      if (!currentSaved || currentSaved === 'system') {
        applyTheme('system');
      }
    };

    if (mediaQuery) {
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
      } else if ((mediaQuery as any).addListener) {
        (mediaQuery as any).addListener(handleChange);
      }
    }

    return () => {
      if (mediaQuery) {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handleChange);
        } else if ((mediaQuery as any).removeListener) {
          (mediaQuery as any).removeListener(handleChange);
        }
      }
    };
  }, [applyTheme]);

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
                state: data.state || '',
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

        // Password reset link from email
        const urlResetToken = searchParams.get('reset_token');
        if (urlResetToken) {
          window.history.replaceState(null, '', window.location.pathname);
          setResetToken(urlResetToken);
        }

        // Email verification link
        const urlVerifyToken = searchParams.get('verify_email');
        if (urlVerifyToken) {
          window.history.replaceState(null, '', window.location.pathname);
          api.verifyEmail(urlVerifyToken).then(async (res) => {
            setOneidNotice(res.success ? (translations[savedLang] || translations.uz).emailVerifiedNotice : res.error || 'Xatolik');
            setTimeout(() => setOneidNotice(null), 6000);
            if (res.success && getAuthToken()) {
              const me = await api.getMe();
              if (me.success && me.data?.user) {
                setUser(me.data.user);
                setCurrentUser(me.data.user);
              }
            }
          });
        }

        // Shared vacancy link (/?vacancy=<id>)
        const sharedVacancyId = searchParams.get('vacancy');
        if (sharedVacancyId) {
          api.getVacancy(sharedVacancyId).then((res) => {
            if (res.success && res.data?.vacancy) setSelectedVacancyForDetail(res.data.vacancy);
          });
        }
        
        // Handle OneID query callback (/ ?oneid_code=...)
        const urlOneIDCode = searchParams.get('oneid_code') || 
          (searchParams.get('code') && (searchParams.get('state')?.includes('oneid') || searchParams.get('scope')?.includes('workhub')) ? searchParams.get('code') : null);
        if (urlOneIDCode) {
          window.history.replaceState(null, '', window.location.pathname);
          try {
            const urlOneIDState = searchParams.get('oneid_state') || searchParams.get('state') || '';
            const res = await api.oneIDCallback({ code: urlOneIDCode, state: urlOneIDState });
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

    // Listen for OneID and language sync postMessage from popups or parent iframe
    const handleOneIDMessage = async (event: MessageEvent) => {
      // Auth callbacks must come from our own callback page, never from another site
      if (event.data?.type === 'WORKHUB_ONEID_AUTH_CALLBACK' && event.data?.code && event.origin === window.location.origin) {
        try {
          const res = await api.oneIDCallback({
            code: event.data.code,
            state: event.data.state || '',
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
      if (event.data?.type === 'WORKHUB_CHANGE_LANG' && event.data?.lang) {
        const incoming = event.data.lang;
        if (incoming === 'uz' || incoming === 'ru' || incoming === 'en') {
          setLang(incoming);
          try {
            localStorage.setItem('workhub_lang', incoming);
          } catch (_) {}
        }
      }
      if (event.data?.type === 'WORKHUB_SET_TAB' && event.data?.tab) {
        setCurrentTab(event.data.tab);
      }
      if (event.data?.type === 'WORKHUB_CHANGE_THEME' && event.data?.theme) {
        const incomingTheme = event.data.theme as ThemeMode;
        if (incomingTheme === 'system' || incomingTheme === 'light' || incomingTheme === 'dark') {
          handleSelectTheme(incomingTheme);
        }
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
    try {
      localStorage.setItem('workhub_lang', newLang);
      if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'WORKHUB_LANG_CHANGED', lang: newLang }, '*');
      }
    } catch (_) {}
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

  // Every 60 seconds: add newly posted vacancies to the top of the list and update total counts
  useEffect(() => {
    const timer = setInterval(async () => {
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
          setVacancies((prev) => {
            const freshMap = new Map(res.data!.vacancies.map((v: any) => [v.id, v]));
            const updatedPrev = prev.map((v) => freshMap.get(v.id) || v);
            const existing = new Set(prev.map((v) => v.id));
            const fresh = res.data!.vacancies.filter((v: any) => !existing.has(v.id));
            return fresh.length > 0 ? [...fresh, ...updatedPrev] : updatedPrev;
          });
          if (res.data.total !== undefined) setTotalVacancies(res.data.total);
        }
      } catch (_) {}
    }, 60_000);
    return () => clearInterval(timer);
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
    if (currentTab !== 'vacancies') return;
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
    if (!user) {
      setResumes([]);
      return;
    }
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
  }, [user]);

  // Fetch User Applications & Notifications
  const fetchUserData = useCallback(async () => {
    if (user) {
      try {
        const [appRes, notifRes, receivedRes] = await Promise.all([
          api.getApplications(),
          api.getNotifications(),
          api.getReceivedApplications(),
        ]);
        if (appRes.success && appRes.data?.applications) {
          setApplications(appRes.data.applications);
        }
        if (receivedRes.success && receivedRes.data?.applications) {
          setReceivedApplications(receivedRes.data.applications);
        }
        if (notifRes.success && notifRes.data?.notifications) {
          setNotifications(notifRes.data.notifications);
        }
      } catch (err) {
        console.error('Error fetching user data', err);
      }
    } else {
      setApplications([]);
      setReceivedApplications([]);
      setNotifications([]);
    }
  }, [user]);

  // Saved ids are read through a ref so toggling a bookmark does not refetch the list
  const savedIdsRef = useRef<string[]>([]);
  savedIdsRef.current = savedIds;

  const fetchTabVacancies = useCallback(async () => {
    if (currentTab !== 'saved' && currentTab !== 'my-vacancies') return;
    if (currentTab === 'my-vacancies' && !user) {
      setTabVacancies([]);
      return;
    }
    setTabLoading(true);
    try {
      const res =
        currentTab === 'saved'
          ? await api.getVacanciesByIds(savedIdsRef.current)
          : await api.getMyVacancies();
      setTabVacancies(res.success && res.data?.vacancies ? res.data.vacancies : []);
    } finally {
      setTabLoading(false);
    }
  }, [currentTab, user]);

  useEffect(() => {
    fetchTabVacancies();
  }, [fetchTabVacancies]);

  const handleUpdateApplicationStatus = async (applicationId: string, status: string) => {
    const res = await api.updateApplicationStatus(applicationId, status);
    if (res.success) {
      setReceivedApplications((list) => list.map((a) => (a.id === applicationId ? { ...a, status } : a)));
    }
    return res;
  };

  // Vacancy owner actions (edit / delete)
  const handleEditVacancy = (v: any) => {
    setSelectedVacancyForDetail(null);
    setEditingVacancy(v);
    setCreateVacancyModalOpen(true);
  };

  const handleDeleteVacancy = async (v: any) => {
    if (!window.confirm(t.deleteVacancyConfirm)) return;
    const res = await api.deleteVacancy(v.id);
    if (!res.success) {
      window.alert(res.error || t.deleteFailed);
      return;
    }
    setSelectedVacancyForDetail(null);
    setVacancies((list) => list.filter((x) => x.id !== v.id));
    setTabVacancies((list) => list.filter((x) => x.id !== v.id));
    fetchUserData();
  };

  const handleDeleteResume = async (r: any) => {
    if (!window.confirm(t.deleteResumeConfirm)) return;
    const res = await api.deleteResume(r.id);
    if (!res.success) {
      window.alert(res.error || t.deleteFailed);
      return;
    }
    fetchResumes();
  };

  // Open a vacancy from the applications list, loading it when it is not in the feed
  const openVacancyById = async (id: string) => {
    const loaded = vacancies.find((v) => v.id === id) || tabVacancies.find((v) => v.id === id);
    if (loaded) {
      setSelectedVacancyForDetail(loaded);
      return;
    }
    const res = await api.getVacancy(id);
    if (res.success && res.data?.vacancy) setSelectedVacancyForDetail(res.data.vacancy);
  };

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
    // Imported vacancies are applied to on the original site; nobody reads WZone applications for them
    if (!v.created_by && typeof v.source_url === 'string' && v.source_url.startsWith('https://')) {
      window.open(v.source_url, '_blank', 'noopener,noreferrer');
      return;
    }
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setSelectedVacancyForApply(v);
    setApplyModalOpen(true);
  };

  // Open chat tab, showing the chat objectives intro first until the user dismisses it permanently
  const goToChat = () => {
    let seen = false;
    try {
      seen = localStorage.getItem('workhub_chat_intro_seen') === 'true';
    } catch (_) {}
    if (seen) {
      setCurrentTab('chat');
    } else {
      setChatIntroOpen(true);
    }
  };

  // Manual vacancy refresh with a short confirmation badge
  const handleRefreshVacancies = async () => {
    await fetchVacancies();
    setVacanciesRefreshed(true);
    setTimeout(() => setVacanciesRefreshed(false), 2500);
  };

  // Unread notifications
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  // Filtered lists for saved / my-vacancies
  const displayedVacancies = () => {
    if (currentTab === 'saved') {
      return tabVacancies.filter((v) => savedIds.includes(v.id));
    }
    if (currentTab === 'my-vacancies') {
      return user ? tabVacancies : [];
    }
    return vacancies;
  };

  const isListTab = currentTab === 'vacancies' || currentTab === 'saved' || currentTab === 'my-vacancies';
  const listLoading = currentTab === 'saved' || currentTab === 'my-vacancies' ? tabLoading : loading;
  const paneVacancy = isListTab
    ? displayedVacancies().find((v) => v.id === paneVacancyId) ?? displayedVacancies()[0] ?? null
    : null;
  const openVacancy = (v: any) => {
    if (isListTab && window.matchMedia('(min-width: 1280px)').matches) setPaneVacancyId(v.id);
    else setSelectedVacancyForDetail(v);
  };

  const handleOpenCreateVacancy = () => {
    if (!user || user.auth_provider !== 'oneid') {
      setAuthContext('vacancy');
      setAuthModalOpen(true);
    } else {
      setCreateVacancyModalOpen(true);
    }
  };

  const handleOpenCreateResume = () => {
    if (!user || user.auth_provider !== 'oneid') {
      setAuthContext('vacancy');
      setAuthModalOpen(true);
    } else {
      setCreateResumeModalOpen(true);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50/70 dark:bg-[#0b0f19] flex flex-col font-sans transition-colors duration-200 text-slate-900 dark:text-slate-100 overflow-x-hidden">
      {/* Ambient background blur orbs & mesh gradient (Frosted Glass backdrop) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        {/* Top-left soft cyan-blue ambient orb */}
        <div className="absolute -top-32 -left-32 w-[550px] h-[550px] bg-gradient-to-br from-blue-400/25 via-cyan-300/20 to-transparent dark:from-blue-600/15 dark:via-cyan-600/10 rounded-full blur-3xl transform-gpu" />
        {/* Center-right soft indigo-violet ambient orb */}
        <div className="absolute top-1/4 -right-32 w-[600px] h-[600px] bg-gradient-to-bl from-indigo-400/20 via-purple-300/15 to-transparent dark:from-indigo-600/15 dark:via-purple-600/10 rounded-full blur-3xl transform-gpu" />
        {/* Bottom-left soft sky-blue ambient orb */}
        <div className="absolute bottom-1/4 left-10 w-[500px] h-[500px] bg-gradient-to-tr from-sky-400/20 via-blue-200/15 to-transparent dark:from-blue-700/10 dark:via-slate-800/10 rounded-full blur-3xl transform-gpu" />
        {/* Bottom-right ambient glow */}
        <div className="absolute -bottom-40 right-1/4 w-[550px] h-[550px] bg-gradient-to-tl from-indigo-300/20 via-blue-300/15 to-transparent dark:from-indigo-900/15 dark:via-slate-900/10 rounded-full blur-3xl transform-gpu" />
        {/* Subtle dot mesh texture overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />
      </div>

      {/* Top Navigation Header */}
      <Header
        user={user}
        onOpenAuth={(ctx?: 'default' | 'vacancy') => {
          setAuthContext(ctx || 'default');
          setAuthModalOpen(true);
        }}
        onOpenCreateVacancy={handleOpenCreateVacancy}
        onOpenCreateResume={handleOpenCreateResume}
        onOpenChat={goToChat}
        onOpenNotifications={() => setNotificationsModalOpen(true)}
        unreadNotificationsCount={unreadCount}
        searchQuery={searchQuery}
        showSearch={currentTab !== 'feed'}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (q.trim() && currentTab === 'feed') {
            setCurrentTab('vacancies');
          }
        }}
        darkMode={resolvedDark}
        resolvedDark={resolvedDark}
        themeMode={themeMode}
        onSelectTheme={handleSelectTheme}
        onToggleDarkMode={toggleDarkMode}
        onUserLogout={() => setUser(null)}
        lang={lang}
        onSelectLang={handleLanguageChange}
      />

      {/* OneID Verification Alert / Toast Banner */}
      {/* Email not verified yet (only for accounts that report the flag) */}
      {user && user.email_verified === false && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 px-4 py-2 text-xs font-semibold text-center flex flex-wrap items-center justify-center gap-2">
          <span>{t.verifyEmailBanner}</span>
          {verificationResent ? (
            <span className="text-emerald-700 dark:text-emerald-300">✓ {t.verificationSent}</span>
          ) : (
            <button
              onClick={async () => {
                const res = await api.resendVerification();
                if (res.success) setVerificationResent(true);
              }}
              className="underline font-bold hover:text-amber-950 dark:hover:text-white"
            >
              {t.resendVerification}
            </button>
          )}
        </div>
      )}

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
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6 pb-32 lg:pb-6">
        {/* Left Navigation Sidebar */}
        <LeftSidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            if (tab === 'chat' && currentTab !== 'chat') goToChat();
            else setCurrentTab(tab);
          }}
          user={user}
          savedCount={savedIds.length}
          applicationsCount={applications.length}
          survey={surveyLoaded ? survey : undefined}
          onSurveyChange={handleSurveyChange}
          lang={lang}
        />

        {/* Center Main Feed / Dynamic View */}
        <main className="flex-1 min-w-0 space-y-5">
          {currentTab === 'applications' ? (
            <ApplicationsView
              applications={applications}
              receivedApplications={receivedApplications}
              onUpdateStatus={handleUpdateApplicationStatus}
              onOpenApplicantChat={(app) => {
                setActiveChatRoomId(`app_${app.id}`);
                setCurrentTab('chat');
              }}
              onSelectVacancy={openVacancyById}
              onOpenChat={() => setCurrentTab('chat')}
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
                  goToChat();
                }
              }}
              onRefresh={fetchResumes}
              loading={resumesLoading}
              currentUserId={user?.id}
              onEditResume={(r) => {
                setEditingResume(r);
                setCreateResumeModalOpen(true);
              }}
              onDeleteResume={handleDeleteResume}
              lang={lang}
            />
          ) : currentTab === 'ai-audit' ? (
            <AiResumeAuditView
              currentUser={user}
              resumes={resumes}
              vacancies={vacancies}
              onSelectVacancy={(v) => setSelectedVacancyForDetail(v)}
              onApplyVacancy={handleApplyClick}
              onOpenCreateResume={() => (user ? setCreateResumeModalOpen(true) : setAuthModalOpen(true))}
              onRefreshResumes={fetchResumes}
              lang={lang}
            />
          ) : currentTab === 'chat' ? (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button
                  onClick={() => setChatIntroOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition"
                >
                  <Info size={14} />
                  <span>{t.chatInfoBtnTitle}</span>
                </button>
              </div>
              <FullChatView
                currentUser={user}
                onOpenAuth={() => setAuthModalOpen(true)}
                lang={lang}
                initialRoomId={activeChatRoomId || undefined}
                onNavigateToVacancies={() => setCurrentTab('vacancies')}
                onSelectVacancy={openVacancyById}
              />
            </div>
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
              darkMode={resolvedDark}
              themeMode={themeMode}
              onSelectTheme={handleSelectTheme}
              onToggleDarkMode={toggleDarkMode}
              onOpenCreateResume={() => setCreateResumeModalOpen(true)}
              resumes={resumes}
              onRefreshResumes={fetchResumes}
              onLogout={() => {
                api.logout();
                setUser(null);
                setCurrentTab('feed');
              }}
            />
          ) : currentTab === 'saved' && displayedVacancies().length === 0 ? (
            <div className="p-14 text-center bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <Bookmark size={44} className="mx-auto text-slate-400" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {t.noSavedVacanciesTitle}
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {t.noSavedVacanciesDesc}
              </p>
              <button
                onClick={() => setCurrentTab('feed')}
                className="mt-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-500/20"
              >
                {t.viewVacanciesBtn}
              </button>
            </div>
          ) : currentTab === 'my-vacancies' && (!user || displayedVacancies().length === 0) ? (
            <div className="p-14 text-center bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <Briefcase size={44} className="mx-auto text-slate-400" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {t.noMyVacanciesTitle}
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {t.noMyVacanciesDesc}
              </p>
              <button
                onClick={handleOpenCreateVacancy}
                className="mt-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition"
              >
                {t.postVacancyBtn}
              </button>
            </div>
          ) : currentTab === 'feed' ? (
            <HomeFeedView
              vacancies={vacancies}
              totalVacancies={totalVacancies}
              survey={surveyLoaded ? survey : null}
              onSurveyChange={handleSurveyChange}
              onSelectVacancy={(v) => setSelectedVacancyForDetail(v)}
              onNavigateToVacancies={() => setCurrentTab('vacancies')}
              onOpenCreateResume={handleOpenCreateResume}
              onOpenCreateVacancy={handleOpenCreateVacancy}
              onApplyVacancy={(v) => {
                setSelectedVacancyForApply(v);
                setApplyModalOpen(true);
              }}
              isSaved={(id) => savedIds.includes(id)}
              onToggleSave={handleToggleSave}
              currentUser={user}
              onNavigateToTab={(tab) => {
                if (tab === 'chat') goToChat();
                else setCurrentTab(tab);
              }}
              regions={REGIONS}
              onSearch={(q, region) => {
                setSearchQuery(q);
                setSelectedLocation(region || 'Barcha hududlar');
                setCurrentTab('vacancies');
              }}
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
                      className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition ${
                        selectedCategory === cat
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold'
                      }`}
                    >
                      {t.categories?.[cat] || cat}
                    </button>
                  ))}
                </div>

                {/* Sub-Filters: 14 Regions of Uzbekistan & Job Type */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                    {/* Region Selector with all 14 provinces */}
                    <div className="flex items-center gap-1.5">
                      <MapPin size={15} className="text-blue-600 dark:text-blue-400" />
                      <span className="font-bold text-slate-700 dark:text-slate-300">{t.regionLabel}</span>
                      <select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      >
                        {REGIONS.map((loc) => (
                          <option key={loc} value={loc}>
                            {t.regions?.[loc] || loc}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Job Type Selector */}
                    <div className="flex items-center gap-1.5">
                      <Briefcase size={15} className="text-blue-600 dark:text-blue-400" />
                      <span className="font-bold text-slate-700 dark:text-slate-300">{t.jobTypeLabel}</span>
                      <select
                        value={selectedJobType}
                        onChange={(e) => setSelectedJobType(e.target.value)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      >
                        {JOB_TYPES.map((jt) => (
                          <option key={jt} value={jt}>
                            {t.jobTypes?.[jt] || jt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {vacanciesRefreshed && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold animate-fadeIn">
                        <CheckCircle2 size={13} />
                        {t.vacanciesRefreshedBadge}
                      </span>
                    )}
                    <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">
                      {displayedVacancies().length} {t.vacanciesCount}
                    </span>
                    <button
                      onClick={isListTab && currentTab !== 'vacancies' ? fetchTabVacancies : handleRefreshVacancies}
                      disabled={listLoading}
                      title={t.refresh}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-60 transition"
                    >
                      <RefreshCw size={14} className={listLoading ? 'animate-spin text-blue-600' : ''} />
                      <span>{t.refreshBtn}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Vacancy Feed Cards */}
              {listLoading && displayedVacancies().length === 0 ? (
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
                    {t.noVacanciesFound}
                  </h4>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {t.noVacanciesSub}
                  </p>
                </div>
              ) : (
                <div className="xl:grid xl:grid-cols-2 xl:gap-4 xl:items-start">
                <div className="space-y-3.5">
                  {displayedVacancies().map((v) => (
                    <div
                      key={v.id}
                      className={`rounded-2xl transition ${
                        paneVacancy?.id === v.id ? 'xl:ring-2 xl:ring-blue-500' : ''
                      }`}
                    >
                      <VacancyCard
                        vacancy={v}
                        isSaved={savedIds.includes(v.id)}
                        onToggleSave={handleToggleSave}
                        onApply={handleApplyClick}
                        onSelect={openVacancy}
                        lang={lang}
                      />
                    </div>
                  ))}

                  {/* Infinite Scroll Trigger Sentinel & Loading Indicator */}
                  {currentTab === 'vacancies' && (
                    <div ref={observerRef} className="py-4 text-center">
                      {loadingMore && (
                        <div className="flex items-center justify-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 py-3 bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                          <RefreshCw size={15} className="animate-spin text-blue-600" />
                          <span>{t.loadingMoreNotice}</span>
                        </div>
                      )}
                      {!hasMore && vacancies.length > 0 && (
                        <p className="text-[11px] font-bold text-slate-400 py-2">
                          ✓ {t.allLoadedNotice} ({totalVacancies || vacancies.length} {t.vacanciesCount})
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Detail pane (desktop only) */}
                <div className="hidden xl:block">
                  <VacancyDetailModal
                    variant="pane"
                    vacancy={paneVacancy}
                    onClose={() => {}}
                    onApply={handleApplyClick}
                    onEdit={handleEditVacancy}
                    onDelete={handleDeleteVacancy}
                    currentUser={user}
                    lang={lang}
                  />
                </div>
                </div>
              )}
            </>
          )}
        </main>

        {/* Right Info & Widgets Sidebar */}
        {currentTab !== 'chat' && currentTab !== 'profile' && !isListTab && (
          <RightSidebar
            vacanciesCount={totalVacancies || vacancies.length}
            user={user}
            onSelectVacancy={(v) => setSelectedVacancyForDetail(v)}
            onOpenProfile={() => setCurrentTab('profile')}
            onNavigateToComments={() => {
              setCurrentTab('feed');
            }}
            lang={lang}
          />
        )}
      </div>

      {/* Mobile Responsive Bottom Navigation Bar (Elevated Ergonomic Bar with Safe Area Clearance) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 dark:bg-[#0c1220]/95 backdrop-blur-2xl border-t border-slate-200/90 dark:border-slate-800/90 z-40 px-2 pt-2 pb-8 sm:pb-9 flex items-center justify-around shadow-[0_-8px_25px_rgba(0,0,0,0.15)] select-none transition-colors">
        {/* Tab 1: Lenta / Asosiy */}
        <button
          onClick={() => {
            setCurrentTab('feed');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex-1 py-1 flex flex-col items-center justify-center transition-all duration-200 active:scale-90 group"
        >
          <div className={`relative px-3.5 py-1 rounded-2xl transition-all duration-200 flex items-center justify-center ${
            currentTab === 'feed'
              ? 'bg-blue-100/80 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 shadow-sm scale-105'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}>
            <Home size={20} className={currentTab === 'feed' ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
          </div>
          <span className={`text-xs tracking-tight mt-0.5 leading-none transition-colors ${
            currentTab === 'feed'
              ? 'font-black text-blue-600 dark:text-blue-400'
              : 'font-semibold text-slate-400 dark:text-slate-400'
          }`}>
            {t.navFeed}
          </span>
        </button>

        {/* Tab 2: Vakansiyalar */}
        <button
          onClick={() => {
            setCurrentTab('vacancies');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex-1 py-1 flex flex-col items-center justify-center transition-all duration-200 active:scale-90 group"
        >
          <div className={`relative px-3.5 py-1 rounded-2xl transition-all duration-200 flex items-center justify-center ${
            currentTab === 'vacancies'
              ? 'bg-blue-100/80 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 shadow-sm scale-105'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}>
            <Briefcase size={20} className={currentTab === 'vacancies' ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
          </div>
          <span className={`text-xs tracking-tight mt-0.5 leading-none transition-colors ${
            currentTab === 'vacancies'
              ? 'font-black text-blue-600 dark:text-blue-400'
              : 'font-semibold text-slate-400 dark:text-slate-400'
          }`}>
            {t.navVacancies}
          </span>
        </button>

        {/* Tab 3: Chat */}
        <button
          onClick={() => {
            if (currentTab !== 'chat') goToChat();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex-1 py-1 flex flex-col items-center justify-center transition-all duration-200 active:scale-90 group"
        >
          <div className={`relative px-3.5 py-1 rounded-2xl transition-all duration-200 flex items-center justify-center ${
            currentTab === 'chat'
              ? 'bg-blue-100/80 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 shadow-sm scale-105'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}>
            <MessageSquare size={20} className={currentTab === 'chat' ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
            <span className="absolute top-1 right-2.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
          </div>
          <span className={`text-xs tracking-tight mt-0.5 leading-none transition-colors ${
            currentTab === 'chat'
              ? 'font-black text-blue-600 dark:text-blue-400'
              : 'font-semibold text-slate-400 dark:text-slate-400'
          }`}>
            {t.navChat}
          </span>
        </button>

        {/* Tab 4: Arizalar */}
        <button
          onClick={() => {
            setCurrentTab('applications');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex-1 py-1 flex flex-col items-center justify-center transition-all duration-200 active:scale-90 group"
        >
          <div className={`relative px-3.5 py-1 rounded-2xl transition-all duration-200 flex items-center justify-center ${
            currentTab === 'applications'
              ? 'bg-blue-100/80 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 shadow-sm scale-105'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}>
            <FileCheck size={20} className={currentTab === 'applications' ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
            {applications.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                {applications.length}
              </span>
            )}
          </div>
          <span className={`text-xs tracking-tight mt-0.5 leading-none transition-colors ${
            currentTab === 'applications'
              ? 'font-black text-blue-600 dark:text-blue-400'
              : 'font-semibold text-slate-400 dark:text-slate-400'
          }`}>
            {t.navApplications}
          </span>
        </button>

        {/* Tab 5: Profil */}
        <button
          onClick={() => {
            if (!user) {
              setAuthModalOpen(true);
            } else {
              setCurrentTab('profile');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className="flex-1 py-1 flex flex-col items-center justify-center transition-all duration-200 active:scale-90 group"
        >
          <div className={`relative px-3.5 py-1 rounded-2xl transition-all duration-200 flex items-center justify-center ${
            currentTab === 'profile'
              ? 'bg-blue-100/80 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 shadow-sm scale-105'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}>
            <UserIcon size={20} className={currentTab === 'profile' ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
          </div>
          <span className={`text-xs tracking-tight mt-0.5 leading-none transition-colors ${
            currentTab === 'profile'
              ? 'font-black text-blue-600 dark:text-blue-400'
              : 'font-semibold text-slate-400 dark:text-slate-400'
          }`}>
            {user ? t.navProfile : t.loginBtn}
          </span>
        </button>
      </nav>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setAuthContext('default');
        }}
        onSuccess={(u) => {
          setUser(u);
          setAuthModalOpen(false);
          if (authContext === 'vacancy') {
            setCreateVacancyModalOpen(true);
          } else {
            setCurrentTab('profile');
          }
          setAuthContext('default');
          fetchUserData();
        }}
        lang={lang}
        authContext={authContext}
      />

      <VacancyDetailModal
        vacancy={selectedVacancyForDetail}
        onClose={() => setSelectedVacancyForDetail(null)}
        onApply={(v) => {
          setSelectedVacancyForDetail(null);
          handleApplyClick(v);
        }}
        onEdit={handleEditVacancy}
        onDelete={handleDeleteVacancy}
        currentUser={user}
        lang={lang}
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
        resumes={resumes.filter((r) => user && r.user_id === user.id)}
        lang={lang}
      />

      <CreateVacancyModal
        isOpen={createVacancyModalOpen}
        initialVacancy={editingVacancy}
        onClose={() => {
          setCreateVacancyModalOpen(false);
          setEditingVacancy(null);
        }}
        onSuccess={(savedVac) => {
          if (editingVacancy) {
            const merge = (list: any[]) => list.map((v) => (v.id === savedVac?.id ? { ...v, ...savedVac } : v));
            setVacancies(merge);
            setTabVacancies(merge);
            return;
          }
          if (savedVac) {
            setVacancies((prev) => [savedVac, ...prev.filter((v) => v.id !== savedVac.id)]);
            setTabVacancies((prev) => [savedVac, ...prev.filter((v) => v.id !== savedVac.id)]);
          }
          if (savedVac?.category) {
            setSelectedCategory(savedVac.category);
          } else {
            setSelectedCategory('Barchasi');
          }
          fetchVacancies();
          fetchTabVacancies();
        }}
        lang={lang}
      />

      <CreateResumeModal
        isOpen={createResumeModalOpen}
        initialResume={editingResume}
        onClose={() => {
          setCreateResumeModalOpen(false);
          setEditingResume(null);
        }}
        onSuccess={() => {
          fetchResumes();
          setCurrentTab('resumes');
        }}
        currentUser={user}
        lang={lang}
      />

      <ResetPasswordModal
        token={resetToken}
        onClose={() => setResetToken(null)}
        onDone={() => {
          setResetToken(null);
          removeAuthToken();
          setUser(null);
          setOneidNotice(t.passwordResetDone);
          setTimeout(() => setOneidNotice(null), 6000);
          setAuthModalOpen(true);
        }}
        lang={lang}
      />

      <ChatIntroModal
        isOpen={chatIntroOpen}
        onClose={() => setChatIntroOpen(false)}
        onProceed={() => {
          setChatIntroOpen(false);
          setCurrentTab('chat');
        }}
        lang={lang}
      />

      <ChatModal
        isOpen={chatModalOpen}
        onClose={() => {
          setChatModalOpen(false);
          setChatTargetUser(null);
        }}
        currentUser={user}
        targetUser={chatTargetUser}
        lang={lang}
      />

      <NotificationsModal
        isOpen={notificationsModalOpen}
        onClose={() => setNotificationsModalOpen(false)}
        notifications={notifications}
        onRefresh={fetchUserData}
        lang={lang}
      />
    </div>
  );
}
