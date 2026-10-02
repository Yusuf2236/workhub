'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Application, Vacancy, fetchApplications, fetchVacancies } from '../../lib/api';

const statusStyles: Record<string, string> = {
  accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  interview: 'bg-blue-50 text-blue-700 border-blue-200',
  reviewing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

export default function ApplicationsAdminPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchApplications(), fetchVacancies()])
      .then(([apps, vacs]) => {
        setApplications(apps);
        setVacancies(vacs);
      })
      .finally(() => setLoading(false));
  }, []);

  const vacancyById = useMemo(() => new Map(vacancies.map((v) => [v.id, v])), [vacancies]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Application Pipeline</h1>
        <p className="text-sm text-slate-500 mt-1">Review applicant submissions and recruitment funnel stages.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase border-b border-slate-200">
                <th className="py-3 px-6">Candidate ID</th>
                <th className="py-3 px-6">Target Role</th>
                <th className="py-3 px-6">Company</th>
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    {loading ? 'Loading applications...' : 'No applications yet'}
                  </td>
                </tr>
              ) : (
                applications.map((app) => {
                  const vacancy = vacancyById.get(app.vacancy_id);
                  return (
                    <tr key={app.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-6 font-mono text-xs text-slate-900">{app.user_id}</td>
                      <td className="py-3.5 px-6 text-slate-600">{vacancy?.title || app.vacancy_id}</td>
                      <td className="py-3.5 px-6 text-slate-500">{vacancy?.company || '—'}</td>
                      <td className="py-3.5 px-6 text-slate-400 text-xs font-mono">
                        {app.created_at ? new Date(app.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                            statusStyles[app.status] || 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
