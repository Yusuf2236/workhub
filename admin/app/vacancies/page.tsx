'use client';

import React, { useEffect, useState } from 'react';
import { Vacancy, fetchVacancies } from '../../lib/api';

export default function VacanciesAdminPage() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVacancies().then((data) => {
      setVacancies(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vacancy Moderation</h1>
          <p className="text-sm text-slate-500 mt-1">Review, approve, and manage employer listings.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase border-b border-slate-200">
                <th className="py-3 px-6">Title</th>
                <th className="py-3 px-6">Company</th>
                <th className="py-3 px-6">Location</th>
                <th className="py-3 px-6">Salary</th>
                <th className="py-3 px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr><td colSpan={5} className="py-6 text-center text-slate-400">Loading vacancies...</td></tr>
              ) : vacancies.length === 0 ? (
                <tr><td colSpan={5} className="py-6 text-center text-slate-400">No vacancies to review.</td></tr>
              ) : (
                vacancies.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-6 font-semibold text-slate-900">{v.title}</td>
                    <td className="py-3.5 px-6 text-slate-600">{v.company}</td>
                    <td className="py-3.5 px-6 text-slate-500">{v.location || 'Remote'}</td>
                    <td className="py-3.5 px-6 font-mono text-emerald-600 font-medium">{v.salary}</td>
                    <td className="py-3.5 px-6 space-x-2">
                      <button className="text-xs bg-blue-50 text-blue-600 font-semibold px-2.5 py-1 rounded hover:bg-blue-100 transition">
                        Edit
                      </button>
                      <button className="text-xs bg-rose-50 text-rose-600 font-semibold px-2.5 py-1 rounded hover:bg-rose-100 transition">
                        Archive
                      </button>
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
