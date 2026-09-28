'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, MessageSquare, User, Radio, CheckCircle2, RefreshCw, Wifi } from 'lucide-react';
import { api } from '../lib/api';
import { Language, translations } from '../lib/translations';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  targetUser?: { id?: string; name?: string; role?: string };
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

export default function ChatModal({
  isOpen,
  onClose,
  currentUser,
  targetUser,
  lang = 'uz',
}: ChatModalProps) {
  const t = translations[lang] || translations.uz;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [guestName, setGuestName] = useState('');
  const [connected, setConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const roomId = targetUser?.id
    ? `dm_${[currentUser?.id || 'guest', targetUser.id].sort().join('_')}`
    : 'general';

  // 1. Fetch initial message history via HTTP immediately on open
  const fetchMessagesViaHTTP = useCallback(async (rId: string) => {
    setLoadingHistory(true);
    try {
      const res = await api.getChatMessages(rId);
      if (res.success && Array.isArray(res.data?.messages)) {
        setMessages(
          res.data.messages.map((m: any) => ({
            ...m,
            isSelf: Boolean(currentUser?.id && m.user_id === currentUser.id),
          }))
        );
      }
    } catch (err) {
      console.error('Failed to load modal chat history via HTTP', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (isOpen) {
      fetchMessagesViaHTTP(roomId);
    }
  }, [isOpen, roomId, fetchMessagesViaHTTP]);

  // 2. WebSocket connection lifecycle
  useEffect(() => {
    if (!isOpen) return;

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

      const wsUrl = getWebSocketUrl(roomId, userId, userName, userAvatar);

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

            if (data.type === 'pong') return;

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
                if (data.id && prev.some((p) => p.id === data.id)) return prev;
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
            console.error('Failed to parse WS message in modal', err);
          }
        };

        ws.onclose = () => {
          if (!isSubscribed) return;
          setConnected(false);
          if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

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
        console.error('Error connecting modal WebSocket', err);
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
  }, [isOpen, currentUser, roomId, guestName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 3. Dual send
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputMessage.trim();
    if (!text || isSending) return;

    const senderName = currentUser?.name || guestName.trim() || 'WZone Mehmon';
    const senderAvatar = currentUser?.avatar_url || '';

    setInputMessage('');

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const payload = {
        content: text,
        sender_name: senderName,
        sender_avatar: senderAvatar,
        room_id: roomId,
      };
      wsRef.current.send(JSON.stringify(payload));
      return;
    }

    // HTTP POST fallback
    setIsSending(true);
    try {
      const res = await api.sendChatMessage({
        room_id: roomId,
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
      console.error('Failed to send message in modal via HTTP', err);
    } finally {
      setIsSending(false);
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

  const getAvatarInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[600px] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/20">
              {targetUser?.name ? getAvatarInitials(targetUser.name) : <MessageSquare size={18} />}
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span>{targetUser?.name || t.liveChat}</span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  {connected
                    ? (lang === 'ru' ? 'Онлайн' : lang === 'en' ? 'Online' : 'Onlayn')
                    : (lang === 'ru' ? 'Авто-режим' : lang === 'en' ? 'Auto-mode' : 'Avto-rejim')}
                </span>
              </h3>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {targetUser?.role
                  ? (lang === 'ru' ? `Беседа с ${targetUser.role}` : lang === 'en' ? `Chat with ${targetUser.role}` : `${targetUser.role} bilan suhbat`)
                  : (lang === 'ru' ? 'Общий чат сообщества' : lang === 'en' ? 'Community open chat' : 'Barcha foydalanuvchilar bilan muloqot')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => fetchMessagesViaHTTP(roomId)}
              title={lang === 'ru' ? 'Обновить' : lang === 'en' ? 'Refresh' : 'Yangilash'}
              className="p-1.5 text-slate-400 hover:text-blue-600 transition rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <RefreshCw size={14} className={loadingHistory ? 'animate-spin text-blue-600' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30 dark:bg-slate-900/30">
          {loadingHistory && messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400 gap-2">
              <RefreshCw size={15} className="animate-spin text-blue-600" />
              <span>{lang === 'ru' ? 'Загрузка сообщений...' : lang === 'en' ? 'Loading messages...' : 'Xabarlar yuklanmoqda...'}</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <MessageSquare size={22} />
              </div>
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                {lang === 'ru' ? 'Начните диалог' : lang === 'en' ? 'Start conversation' : 'Muloqotni boshlang'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                {lang === 'ru'
                  ? 'Этот диалог защищен и работает в режиме реального времени.'
                  : lang === 'en'
                  ? 'This conversation is secure and runs in real time.'
                  : 'Ushbu suhbat xavfsiz va real-vaqt rejimida amalga oshiriladi.'}
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isSelf = msg.isSelf;
              return (
                <div
                  key={msg.id || idx}
                  className={`flex gap-2.5 items-end ${isSelf ? 'justify-end' : 'justify-start'}`}
                >
                  {!isSelf && (
                    <div className="shrink-0 mb-1">
                      {msg.sender_avatar ? (
                        <img
                          src={msg.sender_avatar}
                          alt={msg.sender_name || 'Foydalanuvchi'}
                          className="w-7 h-7 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
                          {getAvatarInitials(msg.sender_name)}
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`max-w-[80%] flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                    {!isSelf && (
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 ml-1 mb-0.5">
                        {msg.sender_name || 'WZone Foydalanuvchisi'}
                      </span>
                    )}

                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm font-medium ${
                        isSelf
                          ? 'bg-blue-600 text-white rounded-br-xs shadow-blue-500/20'
                          : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-700 rounded-bl-xs'
                      }`}
                    >
                      {msg.content}
                    </div>

                    <div className="flex items-center gap-1 mt-0.5 px-1 text-[10px] text-slate-400">
                      <span>{formatMessageTime(msg.created_at)}</span>
                      {isSelf && <CheckCircle2 size={11} className="text-blue-500" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Guest Input Notice if not logged in */}
        {!currentUser && (
          <div className="px-4 py-2 bg-slate-100/80 dark:bg-slate-800/80 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500">
              {lang === 'ru' ? 'Ваше имя:' : lang === 'en' ? 'Your name:' : 'Ismingiz:'}
            </span>
            <input
              type="text"
              placeholder={lang === 'ru' ? 'Гость...' : lang === 'en' ? 'Guest...' : 'Mehmon...'}
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 flex-1"
            />
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={handleSend}
          className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2.5"
        >
          <input
            type="text"
            placeholder={lang === 'ru' ? 'Напишите ваше сообщение...' : lang === 'en' ? 'Type your message...' : 'Xabaringizni yozing...'}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm font-medium rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isSending}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white font-bold text-xs transition disabled:opacity-50 shadow-md shadow-blue-500/25 flex items-center gap-1.5 cursor-pointer"
          >
            <span>{isSending ? '...' : (lang === 'ru' ? 'Отправить' : lang === 'en' ? 'Send' : 'Yuborish')}</span>
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
