'use client';

import React from 'react';
import { Home, Briefcase, Users, FileCheck, MessageSquare, Bookmark, Layers, Settings, Sparkles } from 'lucide-react';
import { Language, translations } from '../lib/translations';
import { SurveyAnswers } from '../lib/survey';
import InterestSurvey from './InterestSurvey';

export type NavTab = 'feed' | 'vacancies' | 'resumes' | 'applications' | 'chat' | 'saved' | 'my-vacancies' | 'profile' | 'ai-audit';

interface LeftSidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  user: any;
  savedCount?: number;
  applicationsCount?: number;
  survey?: SurveyAnswers;
  onSurveyChange?: (answers: SurveyAnswers) => void;
  lang?: Language;
}

export default function LeftSidebar({
  currentTab,
  onSelectTab,
  user,
  savedCount = 0,
  applicationsCount = 0,
  survey,
  onSurveyChange,
  lang = 'uz',
}: LeftSidebarProps) {
  const t = translations[lang] || translations.uz;

  const navItems = [
    { id: 'feed', label: t.navFeed, icon: Home },
    { id: 'vacancies', label: t.navVacancies, icon: Briefcase },
    { id: 'resumes', label: t.navResumes, icon: Users },
    { id: 'applications', label: t.navApplications, icon: FileCheck, count: applicationsCount },
    { id: 'chat', label: t.navChat, icon: MessageSquare },
    { id: 'saved', label: t.navSaved, icon: Bookmark, count: savedCount },
    { id: 'my-vacancies', label: t.navMyVacancies, icon: Layers },
    { id: 'profile', label: t.navProfile, icon: Settings },
  ];

  return (
    <aside className="w-64 shrink-0 hidden lg:block sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto space-y-3 pb-2">

      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-3 shadow-xs space-y-1.5">
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

        {/* AI Skill Match card (Clickable to open AI Resume Audit in the center open area) */}
        <button
          type="button"
          onClick={() => onSelectTab('ai-audit')}
          className={`w-full text-left mt-4 p-3.5 rounded-xl border transition group cursor-pointer block ${
            currentTab === 'ai-audit'
              ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/25'
              : 'bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/30 border-indigo-200/60 dark:border-indigo-900/50 hover:border-blue-400 dark:hover:border-blue-500'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className={`flex items-center gap-2 text-xs font-extrabold ${
              currentTab === 'ai-audit' ? 'text-white' : 'text-indigo-700 dark:text-indigo-400'
            }`}>
              <Sparkles size={15} className={currentTab === 'ai-audit' ? 'text-yellow-300' : ''} />
              <span>{t.aiResumeAnalysisTitle}</span>
            </div>
            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
              currentTab === 'ai-audit' ? 'bg-white/20 text-white' : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
            }`}>
              AI
            </span>
          </div>
          <p className={`text-[11px] leading-tight font-medium ${
            currentTab === 'ai-audit' ? 'text-blue-100' : 'text-slate-600 dark:text-slate-300'
          }`}>
            {t.aiResumeAnalysisDesc}
          </p>
        </button>
      </div>

      {/* Interests survey (below navigation): personalizes the feed */}
      {survey && onSurveyChange && (
        <InterestSurvey answers={survey} onChange={onSurveyChange} lang={lang} />
      )}
    </aside>
  );
}
