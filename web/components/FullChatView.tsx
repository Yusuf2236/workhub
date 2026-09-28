'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  User,
  Users,
  Hash,
  Briefcase,
  HelpCircle,
  Sparkles,
  ChevronRight,
  Radio,
  RefreshCw,
  AlertCircle,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { api } from '../lib/api';
import { Language, translations } from '../lib/translations';

interface FullChatViewProps {
  currentUser: any;
  onOpenAuth: () => void;
  lang?: Language;
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

interface ChatRoom {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const ROOMS_BY_LANG: Record<Language, ChatRoom[]> = {
  uz: [
    {
      id: 'general',
      name: 'Umumiy IT Muloqot',
      description: 'Barcha IT mutaxassislar va qidiruvchilar uchun ochiq suhbat',
      icon: 'hash',
    },
    {
      id: 'ish-qidiruvchilar',
      name: 'Nomzodlar & Dasturchilar',
      description: 'Ish qidirayotgan dasturchilar va rezyume muhokamasi',
      icon: 'users',
    },
    {
      id: 'ish-beruvchilar',
      name: 'Ish beruvchilar & HR',
      description: 'HR menejerlar va kompaniya vakillari muloqoti',
      icon: 'briefcase',
    },
    {
      id: 'savol-javob',
      name: 'Savol-Javob & Intervyu',
      description: 'IT intervyulari, texnik savollar va maslahatlar',
      icon: 'help-circle',
    },
  ],
  ru: [
    {
      id: 'general',
      name: 'Общий IT Чат',
      description: 'Открытое общение для всех IT специалистов и соискателей',
      icon: 'hash',
    },
    {
      id: 'ish-qidiruvchilar',
      name: 'Кандидаты & Разработчики',
      description: 'Обсуждение резюме, поиск работы и карьера разработчиков',
      icon: 'users',
    },
    {
      id: 'ish-beruvchilar',
      name: 'Работодатели & HR',
      description: 'Коммуникация HR-специалистов и рекрутеров компаний',
      icon: 'briefcase',
    },
    {
      id: 'savol-javob',
      name: 'Вопросы & Собеседования',
      description: 'Технические вопросы, подготовка к интервью и советы',
      icon: 'help-circle',
    },
  ],
  en: [
    {
      id: 'general',
      name: 'General IT Lounge',
      description: 'Open discussion for all tech professionals and job seekers',
      icon: 'hash',
    },
    {
      id: 'ish-qidiruvchilar',
      name: 'Candidates & Engineers',
      description: 'Resume review, job hunting, and developer discussions',
      icon: 'users',
    },
    {
      id: 'ish-beruvchilar',
      name: 'Employers & Recruiters',
      description: 'HR leaders, tech recruiters, and hiring managers',
      icon: 'briefcase',
    },
    {
      id: 'savol-javob',
      name: 'Q&A & Interview Prep',
      description: 'Technical interview questions, prep, and career advice',
      icon: 'help-circle',
    },
  ],
};

const PROMPTS_BY_LANG: Record<Language, string[]> = {
  uz: [
    '👋 Salom hammaga!',
    '🚀 Kimda yangi vakansiya bor?',
    '📄 Rezyumeni ko‘rib bera olasizmi?',
    '💡 Intervyu bo‘yicha maslahat kerak',
  ],
  ru: [
    '👋 Всем привет!',
    '🚀 У кого есть свежие вакансии?',
    '📄 Можете посмотреть резюме?',
    '💡 Нужен совет по собеседованию',
  ],
  en: [
    '👋 Hello everyone!',
    '🚀 Any open vacancies right now?',
    '📄 Could you review my resume?',
    '💡 Need interview prep advice',
  ],
};

function getWebSocketUrl(roomId: string, userId: string, userName: string, avatar: string): string {
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
  return `${protocol}//${host}/api/v1/ws?room=${encodeURIComponent(
    roomId
  )}&user_id=${encodeURIComponent(userId)}&user_name=${encodeURIComponent(
    userName
  )}&avatar=${encodeURIComponent(avatar)}`;
}

export default function FullChatView({
  currentUser,
  onOpenAuth,
  lang = 'uz',
}: FullChatViewProps) {
  const t = translations[lang] || translations.uz;

  const [activeRoom, setActiveRoom] = useState<string>('general');
  const [rooms, setRooms] = useState<ChatRoom[]>(ROOMS_BY_LANG[lang] || ROOMS_BY_LANG.uz);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [guestName, setGuestName] = useState('');
  const [connected, setConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync rooms when language changes
  useEffect(() => {
    setRooms(ROOMS_BY_LANG[lang] || ROOMS_BY_LANG.uz);
  }, [lang]);

  // 1. Fetch available chat rooms
  useEffect(() => {
    async function loadRooms() {
      try {
        const res = await api.getChatRooms();
        if (res.success && res.data?.rooms && res.data.rooms.length > 0) {
          const localized = ROOMS_BY_LANG[lang] || ROOMS_BY_LANG.uz;
          setRooms(res.data.rooms.map((r: any) => {
            const loc = localized.find(lr => lr.id === r.id);
            return loc ? { ...r, name: loc.name, description: loc.description } : r;
          }));
        }
      } catch (err) {
        console.error('Error fetching rooms', err);
      }
    }
    loadRooms();
  }, [lang]);

  // 2. Load historical messages via HTTP immediately upon room change (Zero-latency fallback)
  const fetchMessagesViaHTTP = useCallback(async (roomId: string) => {
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
      }
    } catch (err) {
      console.error('Failed to load chat history via HTTP', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    fetchMessagesViaHTTP(activeRoom);
  }, [activeRoom, fetchMessagesViaHTTP]);

  // 3. Connect to WebSocket with auto-reconnect & ping/pong heartbeat
  useEffect(() => {
    let isSubscribed = true;

    function connectWS() {
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (_) {}
        wsRef.current = null;
      }

      const userId = currentUser?.id || 'guest';
      const userName = currentUser?.name || guestName || 'Mehmon';
      const userAvatar = currentUser?.avatar_url || '';

      const wsUrl = getWebSocketUrl(activeRoom, userId, userName, userAvatar);

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isSubscribed) return;
          setConnected(true);

          // Clear any pending reconnect
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }

          // Start heartbeat ping every 25 seconds
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

            if (data.type === 'pong') {
              return;
            }

            if (data.type === 'history' && Array.isArray(data.data)) {
              setMessages(
                data.data.map((m: any) => ({
                  ...m,
                  isSelf: Boolean(currentUser?.id && m.user_id === currentUser.id),
                }))
              );
              return;
            }

            if (data.type === 'message') {
              setMessages((prev) => {
                if (data.id && prev.some((p) => p.id === data.id)) {
                  return prev;
                }
                return [
                  ...prev,
                  {
                    ...data,
                    isSelf: Boolean(currentUser?.id && data.user_id === currentUser.id),
                  },
                ];
              });
            }
          } catch (err) {
            console.error('Failed to parse WS message', err);
          }
        };

        ws.onclose = () => {
          if (!isSubscribed) return;
          setConnected(false);
          if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

          // Try reconnecting in 3 seconds
          if (!reconnectTimeoutRef.current) {
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectTimeoutRef.current = null;
              if (isSubscribed) connectWS();
            }, 3000);
          }
        };

        ws.onerror = () => {
          if (!isSubscribed) return;
          setConnected(false);
        };
      } catch (err) {
        console.error('WebSocket connection error', err);
        setConnected(false);
      }
    }

    connectWS();

    return () => {
      isSubscribed = false;
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (_) {}
        wsRef.current = null;
      }
    };
  }, [activeRoom, currentUser, guestName]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 4. Send message with dual transport: WebSocket if open, else HTTP POST
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputMessage.trim();
    if (!text || isSending) return;

    const senderName = currentUser?.name || guestName.trim() || 'WZone Mehmon';
    const senderAvatar = currentUser?.avatar_url || '';

    setInputMessage('');

    // If WebSocket is open, send through it
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const payload = {
        content: text,
        sender_name: senderName,
        sender_avatar: senderAvatar,
        room_id: activeRoom,
      };
      wsRef.current.send(JSON.stringify(payload));
      return;
    }

    // Otherwise, send via HTTP REST fallback immediately
    setIsSending(true);
    try {
      const res = await api.sendChatMessage({
        room_id: activeRoom,
        content: text,
        sender_name: senderName,
        sender_avatar: senderAvatar,
      });

      if (res.success && res.data?.message) {
        const newMsg: ChatMessage = {
          ...res.data.message,
          isSelf: true,
        };
        setMessages((prev) => {
          if (newMsg.id && prev.some((p) => p.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
    } catch (err) {
      console.error('Failed to send message via HTTP fallback', err);
    } finally {
      setIsSending(false);
    }
  };

  const currentRoomObj = rooms.find((r) => r.id === activeRoom) || rooms[0];

  const formatMessageTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getAvatarInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl flex flex-col md:flex-row h-[740px] overflow-hidden transition-all duration-300">
      {/* Left Sidebar: Channels & Rooms */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex flex-col shrink-0">
        {/* Rooms Header */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {t.chat}
              </h3>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {lang === 'ru' ? 'Живые каналы и общение' : lang === 'en' ? 'Live channels & chat' : 'Jonli kanallar & muloqot'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60">
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
              {connected
                ? (lang === 'ru' ? 'Онлайн' : lang === 'en' ? 'Online' : 'Onlayn')
                : (lang === 'ru' ? 'Авто-режим' : lang === 'en' ? 'Auto-mode' : 'Avto-rejim')}
            </span>
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          <div className="px-2 py-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            {lang === 'ru' ? 'Каналы и комнаты' : lang === 'en' ? 'Channels & Rooms' : 'Kanal va xonalar'}
          </div>
          {rooms.map((room) => {
            const isActive = room.id === activeRoom;
            return (
              <button
                key={room.id}
                onClick={() => setActiveRoom(room.id)}
                className={`w-full text-left p-3 rounded-2xl transition-all flex items-start gap-3 group relative ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold'
                    : 'hover:bg-slate-200/60 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-medium'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 dark:group-hover:bg-slate-700'
                  }`}
                >
                  {room.icon === 'users' && <Users size={16} />}
                  {room.icon === 'briefcase' && <Briefcase size={16} />}
                  {room.icon === 'help-circle' && <HelpCircle size={16} />}
                  {(room.icon === 'hash' || !room.icon) && <Hash size={16} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold truncate">{room.name}</span>
                  </div>
                  <p
                    className={`text-[11px] truncate mt-0.5 ${
                      isActive
                        ? 'text-blue-100'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {room.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* User Card in Sidebar */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
          {currentUser ? (
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/80">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-black overflow-hidden shrink-0">
                {currentUser.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getAvatarInitials(currentUser.name)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1">
                  <span>{currentUser.name}</span>
                  {currentUser.auth_provider === 'oneid' && (
                    <ShieldCheck size={13} className="text-blue-500 shrink-0" />
                  )}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {currentUser.email}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-center justify-between gap-2">
              <div className="text-[11px] font-semibold text-blue-900 dark:text-blue-200">
                {lang === 'ru' ? 'Вы не авторизованы' : lang === 'en' ? 'Not signed in' : 'Ro‘yxatdan o‘tmagansiz'}
              </div>
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold shadow-sm"
              >
                {t.loginBtn}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Area: Messages & Input */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50/40 dark:bg-slate-900/40">
        {/* Chat Room Header */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Hash size={18} />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>{currentRoomObj.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold uppercase">
                  #{currentRoomObj.id}
                </span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {currentRoomObj.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchMessagesViaHTTP(activeRoom)}
              title={lang === 'ru' ? 'Обновить сообщения' : lang === 'en' ? 'Refresh messages' : 'Xabarlarni yangilash'}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-600 transition"
            >
              <RefreshCw size={15} className={loadingHistory ? 'animate-spin text-blue-600' : ''} />
            </button>
            <div className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {connected ? (
                <>
                  <Wifi size={13} className="text-emerald-500" />
                  <span>{lang === 'ru' ? 'Реал-тайм' : lang === 'en' ? 'Real-time' : 'Real-vaqt'}</span>
                </>
              ) : (
                <>
                  <Radio size={13} className="text-blue-500 animate-pulse" />
                  <span>{lang === 'ru' ? 'Экспресс' : lang === 'en' ? 'Instant' : 'Tezkor xabar'}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4">
          {loadingHistory && messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs font-semibold text-slate-400 gap-2">
              <RefreshCw size={16} className="animate-spin text-blue-600" />
              <span>{lang === 'ru' ? 'Загрузка сообщений...' : lang === 'en' ? 'Loading messages...' : 'Xabarlar yuklanmoqda...'}</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <MessageSquare size={24} />
              </div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {lang === 'ru' ? 'В этой комнате пока нет сообщений' : lang === 'en' ? 'No messages in this channel yet' : 'Bu xonada hali xabarlar yo‘q'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                {lang === 'ru' ? 'Начните беседу первым или выберите быструю подсказку ниже.' : lang === 'en' ? 'Start the conversation first or pick one of the quick prompts below.' : 'Birinchi bo‘lib suhbatni boshlang yoki quyidagi tezkor xabarlardan birini tanlang.'}
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
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-sm">
                      {msg.sender_avatar ? (
                        <img
                          src={msg.sender_avatar}
                          alt={msg.sender_name || 'User'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getAvatarInitials(msg.sender_name)
                      )}
                    </div>
                  )}

                  <div className={`max-w-[75%] flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                    {!isSelf && (
                      <div className="flex items-center gap-1.5 ml-1 mb-1">
                        <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200">
                          {msg.sender_name || (lang === 'ru' ? 'Пользователь WZone' : lang === 'en' ? 'WZone User' : 'WZone Foydalanuvchisi')}
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

                    {/* Self timestamp & checkmark */}
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

        {/* Quick Prompts Bar */}
        <div className="px-4 py-2 bg-white/70 dark:bg-slate-900/70 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles size={12} className="text-amber-500" /> {lang === 'ru' ? 'Быстро:' : lang === 'en' ? 'Quick:' : 'Tezkor:'}
          </span>
          {(PROMPTS_BY_LANG[lang] || PROMPTS_BY_LANG.uz).map((prompt, i) => (
            <button
              key={i}
              onClick={() => {
                setInputMessage(prompt);
              }}
              className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-medium transition whitespace-nowrap shrink-0 border border-slate-200/60 dark:border-slate-700/60"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Message Input & Send Form */}
        <form
          onSubmit={handleSend}
          className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col gap-2.5"
        >
          {/* Guest Name input if not logged in */}
          {!currentUser && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {lang === 'ru' ? 'Ваше имя:' : lang === 'en' ? 'Your name:' : 'Ismingiz:'}
              </span>
              <input
                type="text"
                placeholder={lang === 'ru' ? 'Введите ваше имя...' : lang === 'en' ? 'Enter your name...' : 'Ismingizni kiriting...'}
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                ({lang === 'ru' ? 'или для полного доступа ' : lang === 'en' ? 'or for full access ' : 'yoki to‘liq imkoniyatlar uchun '}
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                >
                  {t.loginBtn.toLowerCase()}
                </button>
                )
              </span>
            </div>
          )}

          <div className="flex items-center gap-2.5">
            <input
              type="text"
              placeholder={lang === 'ru' ? `#${currentRoomObj.id}: напишите сообщение... (Enter для отправки)` : lang === 'en' ? `#${currentRoomObj.id}: type a message... (Press Enter to send)` : `#${currentRoomObj.id} kanalida xabar yozing... (Enter orqali yuborish)`}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 px-4 py-3 text-xs sm:text-sm font-medium rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isSending}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm transition disabled:opacity-50 shadow-lg shadow-blue-500/25 flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <span>{isSending ? (lang === 'ru' ? 'Отправка...' : lang === 'en' ? 'Sending...' : 'Yuborilmoqda...') : (lang === 'ru' ? 'Отправить' : lang === 'en' ? 'Send' : 'Yuborish')}</span>
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
