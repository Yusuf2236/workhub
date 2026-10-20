'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  User,
  Users,
  Briefcase,
  Building2,
  FileText,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  AlertCircle,
  Wifi,
  WifiOff,
  Search,
  ExternalLink,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { api, getAuthToken } from '../lib/api';
import { Language, translations } from '../lib/translations';

export interface ApplicationChatRoom {
  id: string; // "app_<applicationId>"
  application_id: string;
  vacancy_id: string;
  name: string; // Opponent name (Company or Candidate)
  role: 'employer' | 'applicant'; // who the other party is
  role_label: string; // "Ish beruvchi" or "Nomzod (CV topshirgan)"
  opponent_name: string;
  vacancy_title: string;
  vacancy_company: string;
  applicant_name: string;
  status: string; // "submitted", "reviewing", "interview", "accepted", "rejected"
  resume_title?: string;
  created_at: string;
  description: string;
  icon?: string;
}

interface ChatMessage {
  id?: string;
  sender_name?: string;
  sender_avatar?: string;
  user_id?: string;
  content: string;
  created_at?: string;
  room_id?: string;
  isSelf?: boolean;
}

interface FullChatViewProps {
  currentUser: any;
  onOpenAuth: () => void;
  lang?: Language;
  initialRoomId?: string;
  onNavigateToVacancies?: () => void;
  onSelectVacancy?: (vacancyId: string) => void;
}

function getAvatarInitials(name?: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.trim().slice(0, 2).toUpperCase();
}

function ChatAvatar({
  avatarUrl,
  name,
  size = 'md',
}: {
  avatarUrl?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [imgError, setImgError] = useState(false);
  const initials = getAvatarInitials(name);

  let src = avatarUrl?.trim();
  if (src && src.startsWith('/uploads')) {
    const host =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:8080'
        : '';
    src = `${host}${src}`;
  }

  if (!src || imgError) {
    return (
      <div
        className={`w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black ${
          size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-sm' : 'text-xs'
        } select-none shrink-0`}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      onError={() => setImgError(true)}
      className="w-full h-full object-cover shrink-0"
    />
  );
}

function getWebSocketUrl(
  roomId: string,
  userId: string,
  userName: string,
  avatar: string,
  token?: string | null
): string {
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  let host = 'localhost:8080';
  if (typeof window !== 'undefined') {
    const hn = window.location.hostname;
    if (hn === 'localhost' || hn === '127.0.0.1') {
      host = `${hn}:8080`;
    } else if (window.location.port === '3000') {
      host = `${hn}:8080`;
    } else {
      host = window.location.host;
    }
  }
  let url = `${protocol}//${host}/api/v1/ws?room=${encodeURIComponent(
    roomId
  )}&user_id=${encodeURIComponent(userId)}&user_name=${encodeURIComponent(
    userName
  )}&avatar=${encodeURIComponent(avatar)}`;
  if (token) {
    url += `&token=${encodeURIComponent(token)}`;
  }
  return url;
}

export default function FullChatView({
  currentUser,
  onOpenAuth,
  lang = 'uz',
  initialRoomId,
  onNavigateToVacancies,
  onSelectVacancy,
}: FullChatViewProps) {
  const t = translations[lang] || translations.uz;

  const [rooms, setRooms] = useState<ApplicationChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<string>(initialRoomId || '');
  const [filterType, setFilterType] = useState<'all' | 'sent' | 'received'>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [showMobileChannels, setShowMobileChannels] = useState<boolean>(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [connected, setConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Status labels and badge colors (hh.uz style)
  const STATUS_LABELS: Record<string, { label: string; color: string; badge: string }> = {
    submitted: {
      label: lang === 'ru' ? 'Отправлено' : lang === 'en' ? 'Submitted' : 'Ariza yuborildi',
      color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900',
      badge: 'bg-blue-500',
    },
    reviewing: {
      label: lang === 'ru' ? 'На рассмотрении' : lang === 'en' ? 'Reviewing' : 'Ko‘rib chiqilmoqda',
      color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900',
      badge: 'bg-amber-500',
    },
    interview: {
      label: lang === 'ru' ? 'Приглашение на интервью' : lang === 'en' ? 'Interview' : 'Suhbatga taklif',
      color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-900',
      badge: 'bg-purple-500',
    },
    accepted: {
      label: lang === 'ru' ? 'Принят' : lang === 'en' ? 'Accepted' : 'Qabul qilindi',
      color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
      badge: 'bg-emerald-500',
    },
    rejected: {
      label: lang === 'ru' ? 'Отказ' : lang === 'en' ? 'Declined' : 'Rad etildi',
      color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900',
      badge: 'bg-rose-500',
    },
  };

  // Quick application prompts tailored to job discussion
  const getCandidatePrompts = () => [
    lang === 'ru' ? '👋 Здравствуйте! Моё резюме рассмотрено?' : lang === 'en' ? '👋 Hello! Has my CV been reviewed?' : '👋 Assalomu alaykum! Rezyumeim ko‘rib chiqildimi?',
    lang === 'ru' ? '📅 Можно уточнить время для собеседования?' : lang === 'en' ? '📅 Could we schedule an interview?' : '📅 Suhbat vaqti haqida ma’lumot bera olasizmi?',
    lang === 'ru' ? '💼 Готов ответить на вопросы по опыту и проектам.' : lang === 'en' ? '💼 Ready to answer any questions about my projects.' : '💼 Loyihalarim bo‘yicha qo‘shimcha ma’lumot berishga tayyorman.',
    lang === 'ru' ? '🤝 Спасибо за возможность!' : lang === 'en' ? '🤝 Thank you for the opportunity!' : '🤝 E’tibor va imkoniyat uchun rahmat!',
  ];

  const getEmployerPrompts = () => [
    lang === 'ru' ? '👋 Здравствуйте! Мы ознакомились с вашим резюме.' : lang === 'en' ? '👋 Hello! We reviewed your application.' : '👋 Assalomu alaykum! Rezyumeingiz bilan tanishib chiqdik.',
    lang === 'ru' ? '🎯 Приглашаем вас на техническое собеседование.' : lang === 'en' ? '🎯 We would like to invite you to an interview.' : '🎯 Sizni texnik suhbatga taklif qilamiz.',
    lang === 'ru' ? '🕒 В какое время вам удобно созвониться?' : lang === 'en' ? '🕒 What time works best for a quick call?' : '🕒 Suhbat uchun qaysi vaqt sizga qulay bo‘ladi?',
    lang === 'ru' ? '📄 Можете отправить ссылку на портфолио или GitHub?' : lang === 'en' ? '📄 Could you share your GitHub or portfolio?' : '📄 GitHub yoki portfolio havolangizni yubora olasizmi?',
  ];

  // 1. Fetch available application chat rooms
  const loadRooms = useCallback(async () => {
    if (!currentUser) {
      setRooms([]);
      return;
    }
    setLoadingRooms(true);
    try {
      const res = await api.getChatRooms();
      if (res.success && Array.isArray(res.data?.rooms)) {
        const fetchedRooms: ApplicationChatRoom[] = res.data.rooms;
        setRooms(fetchedRooms);

        if (fetchedRooms.length > 0) {
          // If initialRoomId matches, select it; otherwise pick active or first
          if (initialRoomId && fetchedRooms.some((r) => r.id === initialRoomId)) {
            setActiveRoom(initialRoomId);
          } else if (!activeRoom || !fetchedRooms.some((r) => r.id === activeRoom)) {
            setActiveRoom(fetchedRooms[0].id);
          }
        } else {
          setActiveRoom('');
        }
      }
    } catch (err) {
      console.error('Error fetching application chat rooms', err);
    } finally {
      setLoadingRooms(false);
    }
  }, [currentUser, initialRoomId, activeRoom]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  // If initialRoomId changes externally, switch to it
  useEffect(() => {
    if (initialRoomId) {
      setActiveRoom(initialRoomId);
    }
  }, [initialRoomId]);

  // 2. Load historical messages via HTTP immediately upon room change
  const fetchMessagesViaHTTP = useCallback(
    async (roomId: string) => {
      if (!roomId) {
        setMessages([]);
        return;
      }
      setLoadingHistory(true);
      try {
        const res = await api.getChatMessages(roomId);
        if (res.success && Array.isArray(res.data?.messages)) {
          setMessages(
            res.data.messages.map((m: any) => ({
              ...m,
              isSelf: Boolean(currentUser?.id && m.user_id === currentUser.id),
            }))
          );
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.error('Failed to load chat history', err);
        setMessages([]);
      } finally {
        setLoadingHistory(false);
      }
    },
    [currentUser?.id]
  );

  useEffect(() => {
    if (activeRoom) {
      fetchMessagesViaHTTP(activeRoom);
    } else {
      setMessages([]);
    }
  }, [activeRoom, fetchMessagesViaHTTP]);

  // 3. Connect to WebSocket with auto-reconnect & ping/pong heartbeat
  useEffect(() => {
    if (!activeRoom || !currentUser) {
      setConnected(false);
      return;
    }

    let isSubscribed = true;

    function connectWS() {
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (_) {}
        wsRef.current = null;
      }

      const userId = currentUser?.id || 'guest';
      const userName = currentUser?.name || 'Foydalanuvchi';
      const userAvatar = currentUser?.avatar_url || '';
      const token = getAuthToken();

      const wsUrl = getWebSocketUrl(activeRoom, userId, userName, userAvatar, token);

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isSubscribed) return;
          setConnected(true);

          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }

          if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, 25000);
        };

        ws.onmessage = (event) => {
          if (!isSubscribed) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'message') {
              const newMsg: ChatMessage = {
                id: data.id,
                room_id: data.room_id,
                user_id: data.user_id,
                sender_name: data.sender_name,
                sender_avatar: data.sender_avatar,
                content: data.content,
                created_at: data.created_at,
                isSelf: Boolean(currentUser?.id && data.user_id === currentUser.id),
              };

              setMessages((prev) => {
                if (newMsg.id && prev.some((m) => m.id === newMsg.id)) {
                  return prev;
                }
                return [...prev, newMsg];
              });
            }
          } catch (_) {}
        };

        ws.onerror = () => {
          if (!isSubscribed) return;
          setConnected(false);
        };

        ws.onclose = () => {
          if (!isSubscribed) return;
          setConnected(false);
          if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isSubscribed) connectWS();
          }, 4000);
        };
      } catch (_) {
        setConnected(false);
      }
    }

    connectWS();

    return () => {
      isSubscribed = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (_) {}
        wsRef.current = null;
      }
    };
  }, [activeRoom, currentUser]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message handler
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const content = inputMessage.trim();
    if (!content || isSending || !activeRoom) return;

    setIsSending(true);
    setInputMessage('');

    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'message',
            room_id: activeRoom,
            content,
            sender_name: currentUser?.name || 'Foydalanuvchi',
            sender_avatar: currentUser?.avatar_url || '',
          })
        );
      } else {
        const res = await api.sendChatMessage({
          room_id: activeRoom,
          content,
          sender_name: currentUser?.name || 'Foydalanuvchi',
          sender_avatar: currentUser?.avatar_url || '',
        });

        if (res.success && res.data?.message) {
          const sentMsg: ChatMessage = {
            ...res.data.message,
            isSelf: true,
          };
          setMessages((prev) => [...prev, sentMsg]);
        }
      }
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setIsSending(false);
    }
  };

  // Employer status update handler
  const handleUpdateStatus = async (appId: string, newStatus: string) => {
    if (!appId || statusUpdating) return;
    setStatusUpdating(true);
    try {
      const res = await api.updateApplicationStatus(appId, newStatus);
      if (res.success) {
        setRooms((prev) =>
          prev.map((r) => (r.application_id === appId ? { ...r, status: newStatus } : r))
        );
        // Post status update system note into chat
        const statusText = STATUS_LABELS[newStatus]?.label || newStatus;
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'message',
              room_id: activeRoom,
              content: `[Tizim bildirishnomasi]: Ariza holati o‘zgartirildi: «${statusText}».`,
              sender_name: currentUser?.name || 'Ish beruvchi',
            })
          );
        }
      }
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setStatusUpdating(false);
    }
  };

  const formatMessageTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Filtered rooms
  const filteredRooms = rooms.filter((r) => {
    if (filterType === 'sent' && r.role !== 'employer') return false; // Sent applications where other party is employer
    if (filterType === 'received' && r.role !== 'applicant') return false; // Received applications where other party is applicant
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const matchName = r.opponent_name?.toLowerCase().includes(q);
      const matchVacancy = r.vacancy_title?.toLowerCase().includes(q);
      const matchCompany = r.vacancy_company?.toLowerCase().includes(q);
      return matchName || matchVacancy || matchCompany;
    }
    return true;
  });

  const currentRoomObj = rooms.find((r) => r.id === activeRoom) || null;

  // Render unauthenticated state
  if (!currentUser) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl p-8 sm:p-12 text-center max-w-xl mx-auto my-8">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Lock size={30} />
        </div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
          {lang === 'ru' ? 'Чат доступен авторизованным пользователям' : lang === 'en' ? 'Chat requires authentication' : 'Chatdan foydalanish uchun tizimga kiring'}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
          {lang === 'ru'
            ? 'По стандарту hh.uz, чат открывается исключительно между кандидатом, отправившим резюме, и работодателем. Войдите в свой аккаунт, чтобы просмотреть диалоги.'
            : lang === 'en'
            ? 'Like hh.uz, chat opens strictly between the candidate who submitted a CV and the employer. Sign in to view your applications and conversations.'
            : 'hh.uz kabi, WZone chat tizimida muloqot faqat vakansiyaga rezyume (CV) topshirgan nomzod va ish beruvchi o‘rtasida xavfsiz ochiladi. Muloqotlarni ko‘rish uchun tizimga kiring.'}
        </p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-blue-500/25 active:scale-95 transition inline-flex items-center gap-2"
        >
          <ShieldCheck size={18} />
          <span>{t.loginBtn}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl flex flex-col md:flex-row h-[760px] overflow-hidden transition-all duration-300">
      {/* Left Sidebar: Application Threads List (hh.uz style) */}
      <div
        className={`border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex flex-col shrink-0 transition-all duration-300 ease-in-out ${
          isSidebarExpanded ? 'w-full md:w-[320px]' : 'w-full md:w-[76px]'
        } ${showMobileChannels ? 'block h-[340px] md:h-auto' : 'hidden md:flex'}`}
      >
        {/* Header */}
        <div className="p-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          {isSidebarExpanded ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                <MessageSquare size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                  <span>{t.chat}</span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 uppercase">
                    hh.uz
                  </span>
                </h3>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                  {lang === 'ru' ? 'Кандидаты и работодатели' : lang === 'en' ? 'Candidates & Employers' : 'Nomzod va ish beruvchilar'}
                </p>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsSidebarExpanded(true)}
              className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 hover:scale-105 transition mx-auto"
              title="Ro‘yxatni kengaytirish"
            >
              <MessageSquare size={19} />
            </button>
          )}

          {isSidebarExpanded && (
            <button
              type="button"
              onClick={() => setIsSidebarExpanded(false)}
              className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition"
              title="Yig‘ish"
            >
              <ChevronLeft size={18} />
            </button>
          )}
        </div>

        {/* Filter Tabs & Search Bar when expanded */}
        {isSidebarExpanded && (
          <div className="p-3 border-b border-slate-200/80 dark:border-slate-800 space-y-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder={lang === 'ru' ? 'Поиск диалогов...' : lang === 'en' ? 'Search chats...' : 'Muloqotlarni qidirish...'}
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-800/60 p-1 rounded-xl text-[10.5px] font-bold">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`flex-1 py-1 rounded-lg text-center transition ${
                  filterType === 'all'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Barchasi ({rooms.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('sent')}
                className={`flex-1 py-1 rounded-lg text-center transition ${
                  filterType === 'sent'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                CV yuborilgan
              </button>
              <button
                type="button"
                onClick={() => setFilterType('received')}
                className={`flex-1 py-1 rounded-lg text-center transition ${
                  filterType === 'received'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Kelib tushgan
              </button>
            </div>
          </div>
        )}

        {/* Conversations List */}
        <div className="flex-1 p-2 space-y-1.5 overflow-y-auto">
          {loadingRooms ? (
            <div className="p-6 text-center text-xs font-semibold text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw size={15} className="animate-spin text-blue-500" />
              <span>Yuklanmoqda...</span>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="p-4 text-center">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-2">
                <Briefcase size={18} />
              </div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {rooms.length === 0 ? 'Muloqotlar topilmadi' : 'Mos muloqot yo‘q'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                {rooms.length === 0
                  ? 'Chat faqat vakansiyaga rezyume (CV) topshirilganda ochiladi.'
                  : 'Filtr bo‘yicha hech qanday natija chiqmadi.'}
              </p>
            </div>
          ) : (
            filteredRooms.map((room) => {
              const isActive = room.id === activeRoom;
              const statusCfg = STATUS_LABELS[room.status] || STATUS_LABELS.submitted;

              return (
                <div key={room.id} className="relative group w-full flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveRoom(room.id);
                      setShowMobileChannels(false);
                    }}
                    className={`transition-all flex items-center cursor-pointer relative ${
                      isSidebarExpanded
                        ? `w-full text-left p-3 rounded-2xl gap-3 ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 font-bold'
                              : 'hover:bg-slate-200/60 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-medium'
                          }`
                        : `w-12 h-12 rounded-2xl justify-center ${
                            isActive
                              ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                          }`
                    }`}
                  >
                    {!isSidebarExpanded && isActive && (
                      <span className="absolute -left-1 top-3 bottom-3 w-1 bg-blue-600 rounded-r-full" />
                    )}

                    {/* Opponent Avatar */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden ${
                        isActive
                          ? 'bg-white/20 text-white ring-1 ring-white/30'
                          : room.role === 'employer'
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300'
                      }`}
                    >
                      {room.role === 'employer' ? <Building2 size={18} /> : <User size={18} />}
                    </div>

                    {isSidebarExpanded && (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-xs font-black truncate">{room.opponent_name}</span>
                          <span
                            className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                              isActive ? 'bg-white/20 text-white' : statusCfg.color
                            }`}
                          >
                            {statusCfg.label}
                          </span>
                        </div>
                        <p
                          className={`text-[11px] truncate leading-tight ${
                            isActive ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {room.vacancy_title}
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-[10px]">
                          <span
                            className={`font-semibold ${
                              isActive ? 'text-blue-200' : 'text-slate-400'
                            }`}
                          >
                            {room.role_label}
                          </span>
                          {room.resume_title && (
                            <span
                              className={`truncate max-w-[120px] ${
                                isActive ? 'text-blue-100/90' : 'text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              • 📄 {room.resume_title}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </button>

                  {/* Tooltip when collapsed */}
                  {!isSidebarExpanded && (
                    <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 hidden group-hover:flex flex-col whitespace-nowrap bg-slate-900/95 dark:bg-slate-800 text-white text-xs px-3 py-2 rounded-xl shadow-2xl border border-slate-700/80 backdrop-blur-md">
                      <span className="font-extrabold text-[12px]">{room.opponent_name}</span>
                      <span className="text-[10px] text-blue-400 font-semibold">{room.vacancy_title}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">{room.role_label} • {statusCfg.label}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Current User Info Bar at Bottom of Sidebar */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 shadow-sm">
              <ChatAvatar avatarUrl={currentUser.avatar_url} name={currentUser.name} />
            </div>
            {isSidebarExpanded && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1">
                  <span>{currentUser.name}</span>
                  {currentUser.auth_provider === 'oneid' && (
                    <ShieldCheck size={13} className="text-blue-500 shrink-0" />
                  )}
                </div>
                <div className="text-[10px] text-slate-400 truncate">{currentUser.email}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Area: Messages & Active Application Details */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50/40 dark:bg-slate-900/40 h-full overflow-hidden">
        {currentRoomObj ? (
          <>
            {/* Active Chat Header */}
            <div className="p-3 sm:p-4 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                {/* Mobile Channel Switcher */}
                <button
                  type="button"
                  onClick={() => setShowMobileChannels(!showMobileChannels)}
                  className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold shrink-0 border border-slate-200 dark:border-slate-700"
                >
                  <MessageSquare size={14} className="text-blue-500" />
                  <span className="truncate max-w-[130px]">{currentRoomObj.opponent_name}</span>
                  <ChevronRight size={13} className={showMobileChannels ? 'rotate-90 transition' : 'transition'} />
                </button>

                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-md shadow-blue-500/20">
                  {currentRoomObj.role === 'employer' ? <Building2 size={20} /> : <User size={20} />}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-black text-sm text-slate-900 dark:text-white truncate">
                      {currentRoomObj.opponent_name}
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {currentRoomObj.role_label}
                    </span>
                    {currentUser.auth_provider === 'oneid' && (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                        <ShieldCheck size={11} />
                        OneID
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs">
                      «{currentRoomObj.vacancy_title}»
                    </span>
                    {currentRoomObj.vacancy_id && onSelectVacancy && (
                      <button
                        type="button"
                        onClick={() => onSelectVacancy(currentRoomObj.vacancy_id)}
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5 font-bold"
                      >
                        <span>Vakansiya</span>
                        <ExternalLink size={10} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Controller (Employer can update, Candidate can view) */}
              <div className="flex items-center gap-2 shrink-0">
                {currentRoomObj.role === 'applicant' ? (
                  /* Current user is employer: provide status change dropdown */
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">Holat:</span>
                    <select
                      value={currentRoomObj.status}
                      disabled={statusUpdating}
                      onChange={(e) => handleUpdateStatus(currentRoomObj.application_id, e.target.value)}
                      className={`text-xs font-black px-2.5 py-1.5 rounded-xl border focus:outline-none cursor-pointer ${
                        STATUS_LABELS[currentRoomObj.status]?.color || 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      <option value="submitted">Ariza yuborildi</option>
                      <option value="reviewing">Ko‘rib chiqilmoqda</option>
                      <option value="interview">Suhbatga taklif qilish</option>
                      <option value="accepted">Qabul qilindi</option>
                      <option value="rejected">Rad etildi</option>
                    </select>
                  </div>
                ) : (
                  /* Current user is candidate: view-only badge */
                  <div
                    className={`text-xs font-black px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                      STATUS_LABELS[currentRoomObj.status]?.color || 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        STATUS_LABELS[currentRoomObj.status]?.badge || 'bg-blue-500'
                      }`}
                    />
                    <span>{STATUS_LABELS[currentRoomObj.status]?.label || currentRoomObj.status}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => fetchMessagesViaHTTP(activeRoom)}
                  title="Xabarlarni yangilash"
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-600 transition shrink-0"
                >
                  <RefreshCw size={15} className={loadingHistory ? 'animate-spin text-blue-600' : ''} />
                </button>
              </div>
            </div>

            {/* Pinned Application Context Box (hh.uz Standard) */}
            <div className="px-4 py-2.5 bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-sky-50/80 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-sky-950/20 border-b border-blue-100 dark:border-blue-900/60 text-xs flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <FileText size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
                <span>
                  <strong className="text-slate-900 dark:text-white">Ariza ob’ekti:</strong> «{currentRoomObj.vacancy_title}»
                </span>
                {currentRoomObj.resume_title && (
                  <span className="hidden sm:inline text-slate-500 dark:text-slate-400">
                    • CV: <strong className="text-slate-800 dark:text-slate-200">{currentRoomObj.resume_title}</strong>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                <ShieldCheck size={14} />
                <span>hh.uz tartibidagi xavfsiz to‘g‘ridan-to‘g‘ri muloqot</span>
              </div>
            </div>

            {/* Message Feed */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4">
              {loadingHistory && messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs font-semibold text-slate-400 gap-2">
                  <RefreshCw size={16} className="animate-spin text-blue-600" />
                  <span>Xabarlar yuklanmoqda...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <MessageSquare size={24} />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Ushbu ariza bo‘yicha muloqotni boshlang
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                    {currentRoomObj.role === 'applicant'
                      ? 'Nomzodga o‘z fikrlaringizni yozing yoki pastdagi tezkor takliflardan foydalaning.'
                      : 'Ish beruvchi bilan o‘z rezyumeingiz, suhbat vaqti yoki boshqa masalalarni muhokama qiling.'}
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isSelf = msg.isSelf;
                  return (
                    <div
                      key={msg.id || idx}
                      className={`flex gap-3 items-end ${isSelf ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isSelf && (
                        <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 shadow-sm">
                          <ChatAvatar avatarUrl={msg.sender_avatar} name={msg.sender_name} />
                        </div>
                      )}

                      <div className={`max-w-[75%] flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                        {!isSelf && (
                          <div className="flex items-center gap-1.5 ml-1 mb-1">
                            <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200">
                              {msg.sender_name || currentRoomObj.opponent_name}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              {formatMessageTime(msg.created_at)}
                            </span>
                          </div>
                        )}

                        {/* Message Bubble */}
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm font-medium break-words ${
                            isSelf
                              ? 'bg-blue-600 text-white rounded-br-xs shadow-blue-500/20'
                              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-700 rounded-bl-xs'
                          }`}
                        >
                          {msg.content}
                        </div>

                        {/* Timestamp & checkmark for self */}
                        {isSelf && (
                          <div className="flex items-center gap-1 mt-1 mr-1 text-[10px] font-semibold text-slate-400">
                            <span>{formatMessageTime(msg.created_at)}</span>
                            <CheckCircle2 size={12} className="text-blue-500" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts Bar (Context-aware for applicant vs employer) */}
            <div className="px-4 py-2 bg-white/70 dark:bg-slate-900/70 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Sparkles size={12} className="text-amber-500" /> Tezkor:
              </span>
              {(currentRoomObj.role === 'applicant' ? getEmployerPrompts() : getCandidatePrompts()).map(
                (prompt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setInputMessage(prompt)}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-medium transition whitespace-nowrap shrink-0 border border-slate-200/60 dark:border-slate-700/60"
                  >
                    {prompt}
                  </button>
                )
              )}
            </div>

            {/* Message Input & Send Form */}
            <form
              onSubmit={handleSend}
              className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2.5"
            >
              <input
                type="text"
                placeholder={`«${currentRoomObj.opponent_name}» ga xabar yozing...`}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 min-w-0 px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isSending}
                className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm transition disabled:opacity-50 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 shrink-0 cursor-pointer min-w-[44px]"
              >
                <span className="hidden sm:inline">
                  {isSending ? 'Yuborilmoqda...' : 'Yuborish'}
                </span>
                <Send size={16} />
              </button>
            </form>
          </>
        ) : (
          /* Empty State when no conversation is selected / user has 0 applications */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
              <Briefcase size={28} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white mb-1.5">
                Hozircha hech qanday chat ochilmagan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                hh.uz qoidasiga ko‘ra, chat faqat nomzod vakansiyaga o‘z CV (rezyume)sini yuborganidan so‘ng ish beruvchi bilan ochiladi.
                Vakansiyalarga ariza topshiring yoki yangi vakansiya e’lon qiling.
              </p>
            </div>
            {onNavigateToVacancies && (
              <button
                type="button"
                onClick={onNavigateToVacancies}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 active:scale-95 transition inline-flex items-center gap-2"
              >
                <span>Vakansiyalarni ko‘rish</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
