'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Smile,
  ChevronRight,
  Radio,
  Search,
} from 'lucide-react';
import { api, getAuthToken } from '../lib/api';
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

const DEFAULT_ROOMS: ChatRoom[] = [
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
];

const QUICK_PROMPTS = [
  '👋 Salom hammaga!',
  '🚀 Kimda yangi vakansiya bor?',
  '📄 Rezyumeni ko‘rib bera olasizmi?',
  '💡 Intervyu bo‘yicha maslahat kerak',
];

export default function FullChatView({
  currentUser,
  onOpenAuth,
  lang = 'uz',
}: FullChatViewProps) {
  const t = translations[lang] || translations.uz;

  const [activeRoom, setActiveRoom] = useState<string>('general');
  const [rooms, setRooms] = useState<ChatRoom[]>(DEFAULT_ROOMS);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [guestName, setGuestName] = useState('');
  const [connected, setConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch rooms from backend
  useEffect(() => {
    async function loadRooms() {
      try {
        const res = await api.getChatRooms();
        if (res.success && res.data?.rooms && res.data.rooms.length > 0) {
          setRooms(res.data.rooms);
        }
      } catch (err) {
        console.error('Error fetching rooms', err);
      }
    }
    loadRooms();
  }, []);

  // Connect to WebSocket on room or user change
  useEffect(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnected(false);

    const userId = currentUser?.id || 'guest';
    const userName = encodeURIComponent(currentUser?.name || guestName || 'Mehmon');
    const userAvatar = encodeURIComponent(currentUser?.avatar_url || '');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost' ? 'localhost:8080' : window.location.host;
    const wsUrl = `${protocol}//${host}/api/v1/ws?room=${encodeURIComponent(
      activeRoom
    )}&user_id=${userId}&user_name=${userName}&avatar=${userAvatar}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

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
            // Avoid duplicate message IDs
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
      setConnected(false);
    };

    ws.onerror = () => {
      setConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [activeRoom, currentUser, guestName]);

  // Scroll to bottom on messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const payload = {
      content: inputMessage.trim(),
      sender_name: currentUser?.name || guestName || 'Mehmon',
      sender_avatar: currentUser?.avatar_url || '',
      room_id: activeRoom,
    };

    wsRef.current.send(JSON.stringify(payload));
    setInputMessage('');
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

  const getAvatarColor = (name?: string) => {
    const colors = [
      'bg-blue-600',
      'bg-indigo-600',
      'bg-purple-600',
      'bg-emerald-600',
      'bg-rose-600',
      'bg-amber-600',
    ];
    if (!name) return colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return colors[hash % colors.length];
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl flex flex-col md:flex-row h-[720px] overflow-hidden transition-all duration-300">
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
                Jonli kanallar & muloqot
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
              {connected ? 'Onlayn' : 'Ulanmoqda'}
            </span>
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          <div className="px-2 py-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Kanal va xonalar
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
                    <span className="text-xs font-bold truncate">
                      #{room.id}
                    </span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    )}
                  </div>
                  <p
                    className={`text-[11px] truncate mt-0.5 ${
                      isActive ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {room.name}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Current User Card at bottom of sidebar */}
        <div className="p-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 flex items-center justify-between gap-3">
          {currentUser ? (
            <div className="flex items-center gap-2.5 min-w-0">
              {currentUser.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.name}
                  className="w-9 h-9 rounded-xl object-cover ring-2 ring-blue-500/20"
                />
              ) : (
                <div
                  className={`w-9 h-9 rounded-xl text-white font-bold flex items-center justify-center text-xs shadow-sm ${getAvatarColor(
                    currentUser.name
                  )}`}
                >
                  {getAvatarInitials(currentUser.name)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {currentUser.name}
                </p>
                <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Avtorizatsiyadan o‘tgan
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between gap-2">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Mehmon rejimi
              </div>
              <button
                onClick={onOpenAuth}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
              >
                {t.loginBtn}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Chat Feed & Active Conversation */}
      <div className="flex-1 flex flex-col bg-slate-50/30 dark:bg-slate-900/40">
        {/* Active Room Top Bar */}
        <div className="px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-extrabold border border-blue-200 dark:border-blue-900/60">
              <Hash size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  #{currentRoomObj.id}
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {currentRoomObj.name}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                {currentRoomObj.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span>{connected ? 'PostgreSQL Jonli efir' : 'Qayta ulanmoqda...'}</span>
            </div>
          </div>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-100/40 dark:bg-slate-950/40">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-blue-100/70 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
                <MessageSquare size={28} />
              </div>
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                #{currentRoomObj.id} kanalida suhbatni boshlang
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
                Ushbu kanalda xabarlar real vaqtda butun O‘zbekiston bo‘ylab barcha ishtirokchilarga ko‘rinadi.
              </p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isSelf =
                msg.isSelf || Boolean(currentUser?.id && msg.user_id === currentUser.id);

              return (
                <div
                  key={msg.id || index}
                  className={`flex gap-3 items-end ${isSelf ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Avatar for other users */}
                  {!isSelf && (
                    <div className="shrink-0 mb-1">
                      {msg.sender_avatar ? (
                        <img
                          src={msg.sender_avatar}
                          alt={msg.sender_name || 'Foydalanuvchi'}
                          className="w-8 h-8 rounded-xl object-cover ring-2 ring-slate-200 dark:ring-slate-700 shadow-xs"
                        />
                      ) : (
                        <div
                          className={`w-8 h-8 rounded-xl text-white font-bold flex items-center justify-center text-[11px] shadow-xs ${getAvatarColor(
                            msg.sender_name
                          )}`}
                        >
                          {getAvatarInitials(msg.sender_name)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Bubble Container */}
                  <div className={`max-w-[78%] flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                    {/* Sender Name & Role */}
                    {!isSelf && (
                      <div className="flex items-center gap-1.5 ml-1 mb-1">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {msg.sender_name || 'WZone Foydalanuvchisi'}
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
            <Sparkles size={12} className="text-amber-500" /> Tezkor:
          </span>
          {QUICK_PROMPTS.map((prompt, i) => (
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
                Ismingiz:
              </span>
              <input
                type="text"
                placeholder="Ismingizni kiriting..."
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                (yoki to‘liq imkoniyatlar uchun{' '}
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                >
                  kirish
                </button>
                )
              </span>
            </div>
          )}

          <div className="flex items-center gap-2.5">
            <input
              type="text"
              placeholder={`#${currentRoomObj.id} kanalida xabar yozing... (Enter orqali yuborish)`}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 px-4 py-3 text-xs sm:text-sm font-medium rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || !connected}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm transition disabled:opacity-50 shadow-lg shadow-blue-500/25 flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <span>Yuborish</span>
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
