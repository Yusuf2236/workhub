'use client';

import React from 'react';
import { Language } from '../lib/translations';

interface FlagIconProps {
  lang: Language | string;
  className?: string;
}

export default function FlagIcon({ lang, className = 'w-5 h-3.5' }: FlagIconProps) {
  const code = lang.toLowerCase();

  if (code === 'uz') {
    // 🇺🇿 Uzbekistan National Flag (Official standard proportions & colors)
    return (
      <svg
        viewBox="0 0 32 24"
        className={`inline-block shrink-0 rounded-sm shadow-sm border border-slate-300/60 dark:border-slate-600/60 overflow-hidden ${className}`}
        aria-label="O‘zbekiston bayrog‘i"
      >
        {/* Top sky blue stripe */}
        <rect width="32" height="7.5" fill="#0099B5" />
        {/* Thin red stripe */}
        <rect y="7.5" width="32" height="1" fill="#CE1126" />
        {/* Middle white stripe */}
        <rect y="8.5" width="32" height="7" fill="#FFFFFF" />
        {/* Thin red stripe */}
        <rect y="15.5" width="32" height="1" fill="#CE1126" />
        {/* Bottom light green stripe */}
        <rect y="16.5" width="32" height="7.5" fill="#1EB53A" />

        {/* Crescent moon (White circle with blue cutout circle) */}
        <circle cx="5.2" cy="3.75" r="2.2" fill="#FFFFFF" />
        <circle cx="5.9" cy="3.75" r="1.8" fill="#0099B5" />

        {/* 12 Stars arranged in 3 rows: 3 top, 4 middle, 5 bottom */}
        {/* Row 1 (3 stars) */}
        <circle cx="8.8" cy="2.2" r="0.38" fill="#FFFFFF" />
        <circle cx="10.2" cy="2.2" r="0.38" fill="#FFFFFF" />
        <circle cx="11.6" cy="2.2" r="0.38" fill="#FFFFFF" />

        {/* Row 2 (4 stars) */}
        <circle cx="8.8" cy="3.75" r="0.38" fill="#FFFFFF" />
        <circle cx="10.2" cy="3.75" r="0.38" fill="#FFFFFF" />
        <circle cx="11.6" cy="3.75" r="0.38" fill="#FFFFFF" />
        <circle cx="13.0" cy="3.75" r="0.38" fill="#FFFFFF" />

        {/* Row 3 (5 stars) */}
        <circle cx="7.4" cy="5.3" r="0.38" fill="#FFFFFF" />
        <circle cx="8.8" cy="5.3" r="0.38" fill="#FFFFFF" />
        <circle cx="10.2" cy="5.3" r="0.38" fill="#FFFFFF" />
        <circle cx="11.6" cy="5.3" r="0.38" fill="#FFFFFF" />
        <circle cx="13.0" cy="5.3" r="0.38" fill="#FFFFFF" />
      </svg>
    );
  }

  if (code === 'ru') {
    // 🇷🇺 Russian Tricolor (White, Blue, Red)
    return (
      <svg
        viewBox="0 0 32 24"
        className={`inline-block shrink-0 rounded-sm shadow-sm border border-slate-300/60 dark:border-slate-600/60 overflow-hidden ${className}`}
        aria-label="Rossiya bayrog‘i"
      >
        <rect width="32" height="8" fill="#FFFFFF" />
        <rect y="8" width="32" height="8" fill="#0039A6" />
        <rect y="16" width="32" height="8" fill="#D52B1E" />
      </svg>
    );
  }

  // 🇬🇧 English / UK Flag (Union Jack)
  return (
    <svg
      viewBox="0 0 32 24"
      className={`inline-block shrink-0 rounded-sm shadow-sm border border-slate-300/60 dark:border-slate-600/60 overflow-hidden ${className}`}
      aria-label="English Flag"
    >
      <rect width="32" height="24" fill="#012169" />
      {/* Diagonal white crosses */}
      <path d="M0,0 L32,24 M32,0 L0,24" stroke="#FFFFFF" strokeWidth="4" />
      {/* Diagonal red crosses */}
      <path d="M0,0 L32,24 M32,0 L0,24" stroke="#C8102E" strokeWidth="2.2" />
      {/* Straight white cross */}
      <path d="M16,0 V24 M0,12 H32" stroke="#FFFFFF" strokeWidth="6.5" />
      {/* Straight red cross */}
      <path d="M16,0 V24 M0,12 H32" stroke="#C8102E" strokeWidth="3.8" />
    </svg>
  );
}
