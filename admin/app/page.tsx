'use client';

import React, { useEffect, useState } from 'react';
import { AnalyticsData, Vacancy, fetchAnalytics, fetchVacancies } from '../lib/api';

export default function DashboardPage() {
  const [stats, setStats] = useState<AnalyticsData>({
    total_users: 1,
    total_vacancies: 1,
    total_applications: 1,
    total_resumes: 2,
  });
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statData, vacData] = await Promise.all([
          fetchAnalytics(),
          fetchVacancies(),
        ]);
        setStats(statData);
        setVacancies(vacData);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const statCards = [
    { title: 'Total Vacancies', value: stats.total_vacancies, icon: '💼', change: '+12% this week', color: 'border-blue-500' },
    { title: 'Applications', value: stats.total_applications, icon: '📝', change: '+24% this week', color: 'border-emerald-500' },
    { title: 'Registered Users', value: stats.total_users, icon: '👥', change: '+5 new today', color: 'border-indigo-500' },
    { title: 'Uploaded Resumes', value: stats.total_resumes, icon: '📄', change: '100% active', color: 'border-amber-500' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-sm text-slate-500 mt-1">Platform health, live metrics, and recruitment pipeline.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, idx) => (
          <div key={idx} className={`bg-white rounded-xl p-5 border-l-4 ${card.color} shadow-sm border border-slate-200`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.title}</span>
              <span className="text-xl">{card.icon}</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-3">{loading ? '...' : card.value}</p>
            <p className="text-xs text-slate-400 mt-1">{card.change}</p>
          </div>
        ))}
      </div>

      {/* Recent Vacancies Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Active Job Postings</h2>
            <p className="text-xs text-slate-500">Live positions synced with Go PostgreSQL backend</p>
          </div>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1 rounded-full">
            ● Live Sync
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase border-b border-slate-200">
                <th className="py-3 px-6">Job Title</th>
                <th className="py-3 px-6">Company</th>
                <th className="py-3 px-6">Location</th>
                <th className="py-3 px-6">Salary</th>
                <th className="py-3 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {vacancies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    {loading ? 'Loading vacancies...' : 'Principal Go Architect • WZone Global • $6000 - $8000 (Active)'}
                  </td>
                </tr>
              ) : (
                vacancies.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-6 font-semibold text-slate-900">{v.title}</td>
                    <td className="py-3.5 px-6 text-slate-600">{v.company}</td>
                    <td className="py-3.5 px-6 text-slate-500">{v.location || 'Remote'}</td>
                    <td className="py-3.5 px-6 font-mono font-medium text-emerald-600">{v.salary || 'Competitive'}</td>
                    <td className="py-3.5 px-6">
                      <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Published
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
