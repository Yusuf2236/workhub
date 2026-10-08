'use client';

import React, { useEffect, useState } from 'react';
import { APPLICATION_STATUSES, Application, fetchApplications, updateApplicationStatus } from '../../lib/api';

const statusStyles: Record<string, string> = {
  accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  interview: 'bg-blue-50 text-blue-700 border-blue-200',
  reviewing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

export default function ApplicationsAdminPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications()
      .then(setApplications)
      .finally(() => setLoading(false));
  }, []);

  const changeStatus = async (app: Application, status: string) => {
    setError(null);
    const res = await updateApplicationStatus(app.id, status);
    if (!res.ok) {
      setError(res.error || 'Update failed');
      return;
    }
    setApplications((list) => list.map((a) => (a.id === app.id ? { ...a, status } : a)));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Application Pipeline</h1>
        <p className="text-sm text-slate-500 mt-1">Review applicant submissions and recruitment funnel stages.</p>
      </div>

      {error && <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-4 py-2">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase border-b border-slate-200">
                <th className="py-3 px-6">Candidate</th>
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
                  return (
                    <tr key={app.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-6 text-slate-900">
                        <div className="font-medium">{app.applicant_name || '—'}</div>
                        <div className="text-xs text-slate-400">{app.applicant_email || app.user_id}</div>
                      </td>
                      <td className="py-3.5 px-6 text-slate-600">
                        <div>{app.vacancy_title || app.vacancy_id}</div>
                        {app.cover_letter && (
                          <div className="text-xs text-slate-400 max-w-xs truncate" title={app.cover_letter}>
                            {app.cover_letter}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-slate-500">{app.vacancy_company || '—'}</td>
                      <td className="py-3.5 px-6 text-slate-400 text-xs font-mono">
                        {app.created_at ? new Date(app.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-6">
                        <select
                          value={app.status}
                          onChange={(e) => changeStatus(app, e.target.value)}
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                            statusStyles[app.status] || 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {APPLICATION_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
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
