'use client';

import React from 'react';
import { X, Bell, Check, Clock } from 'lucide-react';
import { api } from '../lib/api';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: any[];
  onRefresh: () => void;
}

export default function NotificationsModal({
  isOpen,
  onClose,
  notifications,
  onRefresh,
}: NotificationsModalProps) {
  if (!isOpen) return null;

  const handleMarkAsRead = async (id: string) => {
    await api.markNotificationRead(id);
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md max-h-[80vh] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Bildirishnomalar
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-2.5">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Hozircha hech qanday bildirishnoma yo‘q
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 rounded-xl border text-xs transition ${
                  n.is_read
                    ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-500'
                    : 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50 text-slate-800 dark:text-slate-200 font-medium'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white mb-0.5">{n.title}</h5>
                    <p className="leading-relaxed">{n.message}</p>
                  </div>
                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      title="O‘qilgan deb belgilash"
                      className="p-1 rounded-lg text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition shrink-0"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
