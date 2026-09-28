'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageSquare, User, Radio, CheckCircle2 } from 'lucide-react';
import { getAuthToken } from '../lib/api';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  targetUser?: { id?: string; name?: string; role?: string };
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

export default function ChatModal({
  isOpen,
  onClose,
  currentUser,
  targetUser,
}: ChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [guestName, setGuestName] = useState('');
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const roomId = targetUser?.id ? `dm_${[currentUser?.id || 'guest', targetUser.id].sort().join('_')}` : 'general';

  useEffect(() => {
    if (!isOpen) return;

    const userId = currentUser?.id || 'guest';
    const userName = encodeURIComponent(currentUser?.name || guestName || 'Mehmon');
    const userAvatar = encodeURIComponent(currentUser?.avatar_url || '');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost' ? 'localhost:8080' : window.location.host;
    const wsUrl = `${protocol}//${host}/api/v1/ws?room=${encodeURIComponent(
      roomId
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
  }, [isOpen, currentUser, roomId, guestName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const payload = {
      content: inputMessage.trim(),
      sender_name: currentUser?.name || guestName || 'Mehmon',
      sender_avatar: currentUser?.avatar_url || '',
      room_id: roomId,
    };

    wsRef.current.send(JSON.stringify(payload));
    setInputMessage('');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg h-[600px] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>{targetUser?.name ? `Muloqot: ${targetUser.name}` : 'WorkHub Jonli Muloqot'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
                  {targetUser?.name ? 'To‘g‘ridan-to‘g‘ri' : '#general'}
                </span>
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold mt-0.5">
                <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                <span className={connected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
                  {connected ? 'WebSocket ulandi (PostgreSQL Jonli)' : 'Ulanmoqda...'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-3.5 bg-slate-50/50 dark:bg-slate-950/40">
          {messages.length === 0 ? (
            <div className="text-center py-16 text-slate-500 dark:text-slate-400 text-xs font-medium space-y-2">
              <MessageSquare size={32} className="mx-auto text-slate-400 opacity-60" />
              <p>Muloqotni boshlang. Xabarlar server orqali real vaqtda yetkaziladi.</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isSelf =
                msg.isSelf || Boolean(currentUser?.id && msg.user_id === currentUser.id);

              return (
                <div
                  key={msg.id || index}
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
                        {msg.sender_name || 'WorkHub Foydalanuvchisi'}
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

        {/* Input */}
        <form
          onSubmit={handleSend}
          className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2.5"
        >
          <input
            type="text"
            placeholder="Xabaringizni yozing..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm font-medium rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || !connected}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white font-bold text-xs transition disabled:opacity-50 shadow-md shadow-blue-500/25 flex items-center gap-1.5"
          >
            <span>Yuborish</span>
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
