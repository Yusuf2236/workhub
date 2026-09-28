import React from 'react';
import Link from 'next/link';

export function Sidebar() {
  const navItems = [
    { label: 'Overview', href: '/', icon: '📊' },
    { label: 'Vacancies', href: '/vacancies', icon: '💼' },
    { label: 'Applications', href: '/applications', icon: '📝' },
    { label: 'Candidates', href: '/users', icon: '👥' },
    { label: 'Settings', href: '/settings', icon: '⚙️' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col p-4 border-r border-slate-800">
      <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-slate-800">
        <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg text-white">
          W
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">WZone</h1>
          <p className="text-xs text-slate-400">Admin Control Panel</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition"
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
        <p className="text-xs text-slate-400">Backend API</p>
        <p className="text-xs font-mono text-emerald-400 mt-1">● Online (localhost:8080)</p>
      </div>
    </aside>
  );
}
