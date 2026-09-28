'use client';

import React, { useState } from 'react';
import { Search, Plus, Bell, MessageSquare, Sun, Moon, User as UserIcon, LogOut, Briefcase, FileText, ChevronDown, Globe } from 'lucide-react';
import { removeAuthToken } from '../lib/api';
import { Language, translations } from '../lib/translations';

interface HeaderProps {
  user: any;
  onOpenAuth: () => void;
  onOpenCreateVacancy: () => void;
  onOpenCreateResume: () => void;
  onOpenChat: () => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount?: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onUserLogout: () => void;
  lang: Language;
  onSelectLang: (lang: Language) => void;
}

export default function Header({
  user,
  onOpenAuth,
  onOpenCreateVacancy,
  onOpenCreateResume,
  onOpenChat,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  searchQuery,
  onSearchChange,
  darkMode,
  onToggleDarkMode,
  onUserLogout,
  lang,
  onSelectLang,
}: HeaderProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const t = translations[lang] || translations.uz;

  const handleLogout = () => {
    removeAuthToken();
    setShowUserMenu(false);
    onUserLogout();
  };

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'uz', label: 'O‘zbekcha', flag: '🇺🇿' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Animated WorkHub Logo */}
        <div className="flex items-center gap-3 shrink-0 group cursor-pointer">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-cyan-400 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/30 transition-all duration-300 group-hover:scale-105 group-hover:shadow-blue-500/50 group-hover:rotate-3 overflow-hidden">
            <span className="relative z-10 tracking-tighter">W</span>
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white flex items-center">
              Work<span className="text-blue-600 dark:text-blue-400">Hub</span>
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 -mt-0.5 font-medium hidden sm:block">
              {t.appTagline}
            </p>
          </div>
        </div>

        {/* Global Real-Time Search Bar */}
        <div className="flex-1 max-w-xl hidden md:block">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition" size={17} />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700/60 focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition font-medium"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Create Action Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-blue-500/25 transition"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">{t.addListing}</span>
              <ChevronDown size={14} className="opacity-80" />
            </button>

            {showAddMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-fadeIn">
                <button
                  onClick={() => {
                    setShowAddMenu(false);
                    if (!user) {
                      onOpenAuth();
                    } else {
                      onOpenCreateVacancy();
                    }
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700/60 flex items-center gap-2.5 transition"
                >
                  <Briefcase size={16} className="text-blue-600 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{t.createVacancy}</div>
                    <div className="text-[11px] text-slate-400">{t.createVacancySub}</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowAddMenu(false);
                    if (!user) {
                      onOpenAuth();
                    } else {
                      onOpenCreateResume();
                    }
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700/60 flex items-center gap-2.5 transition"
                >
                  <FileText size={16} className="text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{t.createResume}</div>
                    <div className="text-[11px] text-slate-400">{t.createResumeSub}</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Language Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1 text-xs font-bold"
              title="Tilni tanlash"
            >
              <Globe size={17} className="text-slate-500 dark:text-slate-400" />
              <span className="uppercase">{lang}</span>
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-50 animate-fadeIn">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      onSelectLang(l.code);
                      setShowLangMenu(false);
                    }}
                    className={`w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center gap-2 transition ${
                      lang === l.code
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{l.flag}</span>
                    <span>{l.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Real-time WebSocket Chat Icon */}
          <button
            onClick={onOpenChat}
            title={t.chat}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition relative"
          >
            <MessageSquare size={19} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500" />
          </button>

          {/* Notifications */}
          <button
            onClick={onOpenNotifications}
            title={t.notifications}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition relative"
          >
            <Bell size={19} />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-500 text-white animate-pulse">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={onToggleDarkMode}
            title="Mavzuni almashtirish"
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {darkMode ? <Sun size={19} className="text-amber-400" /> : <Moon size={19} />}
          </button>

          {/* User Profile or Login */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 pl-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center overflow-hidden shrink-0">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white hidden md:block max-w-[110px] truncate">
                  {user.name}
                </span>
                <ChevronDown size={14} className="text-slate-400 mr-1" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-fadeIn">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                    {user.auth_provider && (
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {user.auth_provider === 'oneid' ? 'OneID Tasdiqlangan' : user.auth_provider}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 transition"
                  >
                    <LogOut size={15} />
                    <span>{t.logoutBtn}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-95 transition shadow-sm"
            >
              {t.loginBtn}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
