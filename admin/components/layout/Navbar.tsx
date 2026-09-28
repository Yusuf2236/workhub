import React from 'react';

export function Navbar() {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
      <div>
        <h2 className="text-sm font-semibold text-slate-700">Platform Management</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
            HR
          </div>
          <span className="text-sm font-medium text-slate-800">Recruiter Admin</span>
        </div>
      </div>
    </header>
  );
}
