'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { Language, translations } from '../lib/translations';

interface RecommendationsWidgetProps {
  user: any;
  onSelectVacancy: (vacancy: any) => void;
  onOpenProfile: () => void;
  lang?: Language;
}

// RecommendationsWidget lists vacancies matching the skills in the user's profile.
export default function RecommendationsWidget({ user, onSelectVacancy, onOpenProfile, lang = 'uz' }: RecommendationsWidgetProps) {
  const t = translations[lang] || translations.uz;
  const [items, setItems] = useState<any[]>([]);
  const [needsSkills, setNeedsSkills] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    api.getRecommendations().then((res) => {
      if (!active) return;
      setItems(res.success ? (res.data?.recommendations || []).slice(0, 5) : []);
      setNeedsSkills(Boolean(res.success && res.data?.needs_skills));
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [user?.id]);

  if (!user || !loaded) return null;

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-xs space-y-3">
      <h5 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        <Sparkles size={14} className="text-purple-500" />
        {t.recommendedTitle}
      </h5>
      {needsSkills || items.length === 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-slate-600 dark:text-slate-300">{needsSkills ? t.recommendedNeedsSkills : t.recommendedEmpty}</p>
          {needsSkills && (
            <button onClick={onOpenProfile} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
              {t.recommendedAddSkills}
            </button>
          )}
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map(({ vacancy, match_score, matched_tags }) => (
            <li key={vacancy.id}>
              <button
                onClick={() => onSelectVacancy(vacancy)}
                className="w-full text-left rounded-xl p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">{vacancy.title}</span>
                  <span className="shrink-0 text-[10px] font-black px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                    {match_score}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{vacancy.company}</p>
                <p className="text-[10px] text-purple-600 dark:text-purple-400 truncate">{(matched_tags || []).join(', ')}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
