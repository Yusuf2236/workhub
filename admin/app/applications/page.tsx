'use client';

import React from 'react';

export default function ApplicationsAdminPage() {
  const applications = [
    { id: '1', candidate: 'Alisher Navoiy', role: 'Principal Go Architect', company: 'WZone Global', status: 'Submitted', date: '2026-09-24' },
    { id: '2', candidate: 'Bobur Mirzo', role: 'Mobile iOS Engineer', company: 'AppWorks', status: 'Interview', date: '2026-09-23' },
    { id: '3', candidate: 'Ulugbek Samarkandi', role: 'Data Platform Lead', company: 'CloudSys', status: 'Accepted', date: '2026-09-22' },
  ];

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
                <th className="py-3 px-6">Candidate</th>
                <th className="py-3 px-6">Target Role</th>
                <th className="py-3 px-6">Company</th>
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-6 font-semibold text-slate-900">{app.candidate}</td>
                  <td className="py-3.5 px-6 text-slate-600">{app.role}</td>
                  <td className="py-3.5 px-6 text-slate-500">{app.company}</td>
                  <td className="py-3.5 px-6 text-slate-400 text-xs font-mono">{app.date}</td>
                  <td className="py-3.5 px-6">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                      app.status === 'Accepted'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : app.status === 'Interview'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-6">
                    <button className="text-xs bg-slate-100 text-slate-700 font-semibold px-3 py-1 rounded hover:bg-slate-200 transition">
                      View CV
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
