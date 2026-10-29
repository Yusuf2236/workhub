'use client';

import React from 'react';
import { Home, Briefcase, Plus, Clock, User } from 'lucide-react';

export interface BottomNavProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onAddClick?: () => void;
  applicationsCount?: number;
  unreadCount?: number;
  className?: string;
}

export default function BottomNav({
  activeTab = 'home',
  onTabChange,
  onAddClick,
  applicationsCount = 0,
  unreadCount = 0,
  className = '',
}: BottomNavProps) {
  const handleTab = (tab: string) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(10);
      } catch {
        // Ignore if vibrator unavailable
      }
    }
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const handleAdd = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(15);
      } catch {
        // Ignore
      }
    }
    if (onAddClick) {
      onAddClick();
    } else {
      console.log('Yangi e\'lon yoki rezyume qo\'shish bosildi');
    }
  };

  const isHomeActive = activeTab === 'home' || activeTab === 'feed';
  const isVacanciesActive = activeTab === 'vakansiyalar' || activeTab === 'vacancies' || activeTab === 'my-vacancies';
  const isApplicationsActive = activeTab === 'arizalar' || activeTab === 'applications';
  const isProfileActive = activeTab === 'profil' || activeTab === 'profile';

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 select-none ${className}`}>
      {/* Markaziy tugma nuri (Aura Glow effekti - Figma dizayniga 100% mos) */}
      <div className="absolute left-1/2 -top-4 -translate-x-1/2 w-16 h-16 bg-[#6C47D8]/40 dark:bg-[#7c4dff]/40 rounded-full blur-xl pointer-events-none" />

      {/* Asosiy oq/dark panel (iOS 18+ Rounded corners va Safe Area) */}
      <div className="relative bg-white/95 dark:bg-[#0c1220]/95 backdrop-blur-2xl rounded-t-[32px] border-t border-purple-100/70 dark:border-slate-800 shadow-[0_-8px_30px_rgba(28,16,56,0.08)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.5)] px-3 pt-2.5 pb-[max(1.75rem,env(safe-area-inset-bottom))] transition-colors">
        <div className="max-w-md mx-auto flex items-center justify-around relative">
          
          {/* 1. Home / Asosiy */}
          <button 
            type="button"
            onClick={() => handleTab('home')} 
            className="flex flex-col items-center justify-center gap-1 min-w-[58px] transition-transform active:scale-90 group focus:outline-none"
            aria-label="Home"
          >
            <div className="relative">
              <Home 
                size={22} 
                className={isHomeActive ? 'text-[#2E1C59] dark:text-[#a78bfa] fill-[#2E1C59] dark:fill-[#a78bfa]' : 'text-[#8E8E93] dark:text-slate-400 group-hover:text-slate-600'} 
              />
            </div>
            <span className={`text-[11px] tracking-tight ${isHomeActive ? 'text-[#2E1C59] dark:text-[#a78bfa] font-bold' : 'text-[#8E8E93] dark:text-slate-400 font-medium'}`}>
              Home
            </span>
          </button>

          {/* 2. Vakansiyalar */}
          <button 
            type="button"
            onClick={() => handleTab('vakansiyalar')} 
            className="flex flex-col items-center justify-center gap-1 min-w-[58px] transition-transform active:scale-90 group focus:outline-none"
            aria-label="Vakansiyalar"
          >
            <div className="relative">
              <Briefcase 
                size={22} 
                className={isVacanciesActive ? 'text-[#2E1C59] dark:text-[#a78bfa]' : 'text-[#8E8E93] dark:text-slate-400 group-hover:text-slate-600'} 
                strokeWidth={isVacanciesActive ? 2.4 : 1.8}
              />
            </div>
            <span className={`text-[11px] tracking-tight ${isVacanciesActive ? 'text-[#2E1C59] dark:text-[#a78bfa] font-bold' : 'text-[#8E8E93] dark:text-slate-400 font-medium'}`}>
              Vakansiyalar
            </span>
          </button>

          {/* 3. Markaziy Creative "+" Tugmasi (Oq ramkasiz, toza binafsha aura) */}
          <button 
            type="button"
            onClick={handleAdd}
            className="w-14 h-14 -mt-7 rounded-full bg-[#6C47D8] text-white flex items-center justify-center shadow-[0_4px_24px_rgba(108,71,216,0.5)] hover:shadow-[0_6px_28px_rgba(108,71,216,0.65)] active:scale-95 transition-all duration-200 z-10 focus:outline-none group"
            title="Yangi e'lon / rezyume yaratish"
            aria-label="Yangi qo'shish"
          >
            <Plus size={28} strokeWidth={2.6} className="transition-transform duration-300 group-hover:rotate-90" />
          </button>

          {/* 4. Arizalarim */}
          <button 
            type="button"
            onClick={() => handleTab('arizalar')} 
            className="flex flex-col items-center justify-center gap-1 min-w-[58px] transition-transform active:scale-90 group focus:outline-none"
            aria-label="Arizalarim"
          >
            <div className="relative">
              <Clock 
                size={22} 
                className={isApplicationsActive ? 'text-[#2E1C59] dark:text-[#a78bfa]' : 'text-[#8E8E93] dark:text-slate-400 group-hover:text-slate-600'} 
                strokeWidth={isApplicationsActive ? 2.4 : 1.8}
              />
              {applicationsCount > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#6C47D8] text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                  {applicationsCount}
                </span>
              )}
            </div>
            <span className={`text-[11px] tracking-tight ${isApplicationsActive ? 'text-[#2E1C59] dark:text-[#a78bfa] font-bold' : 'text-[#8E8E93] dark:text-slate-400 font-medium'}`}>
              Arizalarim
            </span>
          </button>

          {/* 5. Profil */}
          <button 
            type="button"
            onClick={() => handleTab('profil')} 
            className="flex flex-col items-center justify-center gap-1 min-w-[58px] transition-transform active:scale-90 group focus:outline-none"
            aria-label="Profil"
          >
            <div className="relative">
              <User 
                size={22} 
                className={isProfileActive ? 'text-[#2E1C59] dark:text-[#a78bfa]' : 'text-[#8E8E93] dark:text-slate-400 group-hover:text-slate-600'} 
                strokeWidth={isProfileActive ? 2.4 : 1.8}
              />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </div>
            <span className={`text-[11px] tracking-tight ${isProfileActive ? 'text-[#2E1C59] dark:text-[#a78bfa] font-bold' : 'text-[#8E8E93] dark:text-slate-400 font-medium'}`}>
              Profil
            </span>
          </button>

        </div>

        {/* iOS Home Indicator Chizig'i (Ekranda barqaror turishi uchun) */}
        <div className="w-32 h-1 bg-zinc-900/40 dark:bg-zinc-100/40 rounded-full mx-auto mt-2 pointer-events-none" />
      </div>
    </div>
  );
}
