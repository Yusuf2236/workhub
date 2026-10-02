'use client';

import React from 'react';
import { clearAdminToken } from '../../lib/api';

export function Navbar() {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
      <div>
        <h2 className="text-sm font-semibold text-slate-700">Platform Management</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
            AD
          </div>
          <span className="text-sm font-medium text-slate-800">Admin</span>
        </div>
        <button
          onClick={clearAdminToken}
          className="text-xs font-semibold text-slate-600 hover:text-red-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-red-200 transition"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
