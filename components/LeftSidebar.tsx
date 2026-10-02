'use client';

import React from 'react';
import { Home, Briefcase, Users, FileCheck, MessageSquare, Bookmark, Layers, Settings, Sparkles } from 'lucide-react';
import { Language, translations } from '../lib/translations';

export type NavTab = 'feed' | 'vacancies' | 'resumes' | 'applications' | 'chat' | 'saved' | 'my-vacancies' | 'profile';

interface LeftSidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  user: any;
  savedCount?: number;
  applicationsCount?: number;
  lang?: Language;
}

export default function LeftSidebar({
  currentTab,
  onSelectTab,
  user,
  savedCount = 0,
  applicationsCount = 0,
  lang = 'uz',
}: LeftSidebarProps) {
  const t = translations[lang] || translations.uz;

  const navItems = [
    { id: 'feed', label: t.navFeed, icon: Home },
    { id: 'vacancies', label: t.navVacancies, icon: Briefcase },
    { id: 'resumes', label: t.navResumes, icon: Users },
    { id: 'applications', label: t.navApplications, icon: FileCheck, count: applicationsCount },
    { id: 'chat', label: t.navChat, icon: MessageSquare, isLive: true },
    { id: 'saved', label: t.navSaved, icon: Bookmark, count: savedCount },
    { id: 'my-vacancies', label: t.navMyVacancies, icon: Layers },
    { id: 'profile', label: t.navProfile, icon: Settings },
  ];

  return (
    <aside className="w-64 shrink-0 hidden lg:block sticky top-20 self-start">
      <div className="bg-white dark:bg-slate-900/90 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id as NavTab)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className={isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'} />
                <span>{item.label}</span>
              </div>

              {item.isLive && (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              )}

              {item.count !== undefined && item.count > 0 && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}

        {/* AI Skill Match card */}
        <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/30 border border-indigo-200/60 dark:border-indigo-900/50">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 text-xs font-extrabold mb-1">
            <Sparkles size={15} />
            <span>{t.aiResumeAnalysisTitle}</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight font-medium">
            {t.aiResumeAnalysisDesc}
          </p>
        </div>
      </div>
    </aside>
  );
}
