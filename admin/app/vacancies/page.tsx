'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Vacancy, deleteVacancy, fetchVacancies, updateVacancy } from '../../lib/api';

type EditForm = Pick<Vacancy, 'title' | 'company' | 'location' | 'salary'>;

export default function VacanciesAdminPage() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Vacancy | null>(null);
  const [form, setForm] = useState<EditForm>({ title: '', company: '', location: '', salary: '' });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((q: string) => {
    setLoading(true);
    fetchVacancies(q)
      .then(setVacancies)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load('');
  }, [load]);

  const replaceVacancy = (updated: Vacancy) =>
    setVacancies((list) => list.map((v) => (v.id === updated.id ? { ...v, ...updated } : v)));

  const startEdit = (v: Vacancy) => {
    setError(null);
    setEditing(v);
    setForm({ title: v.title, company: v.company, location: v.location || '', salary: v.salary || '' });
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setBusyId(editing.id);
    const res = await updateVacancy(editing.id, form);
    setBusyId(null);
    if (!res.ok) {
      setError(res.error || 'Update failed');
      return;
    }
    replaceVacancy(res.data.vacancy);
    setEditing(null);
  };

  const toggleFlag = async (v: Vacancy, flag: 'is_featured' | 'is_verified') => {
    setBusyId(v.id);
    setError(null);
    const res = await updateVacancy(v.id, { [flag]: !v[flag] });
    setBusyId(null);
    if (!res.ok) setError(res.error || 'Update failed');
    else replaceVacancy(res.data.vacancy);
  };

  const remove = async (v: Vacancy) => {
    if (!window.confirm(`Delete "${v.title}"? Its applications and comments will be deleted too.`)) return;
    setBusyId(v.id);
    setError(null);
    const res = await deleteVacancy(v.id);
    setBusyId(null);
    if (!res.ok) setError(res.error || 'Delete failed');
    else setVacancies((list) => list.filter((x) => x.id !== v.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vacancy Moderation</h1>
          <p className="text-sm text-slate-500 mt-1">Review, approve, and manage employer listings.</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(query);
          }}
          className="flex gap-2"
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, company..."
            className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 w-64"
          />
          <button className="text-sm bg-slate-900 text-white font-semibold px-3 py-1.5 rounded-lg">Search</button>
        </form>
      </div>

      {error && <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-4 py-2">{error}</div>}

      {editing && (
        <form onSubmit={saveEdit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          {(['title', 'company', 'location', 'salary'] as const).map((field) => (
            <label key={field} className="text-xs font-semibold text-slate-600 uppercase space-y-1">
              <span>{field}</span>
              <input
                value={form[field]}
                required={field === 'title'}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                className="w-full text-sm font-normal normal-case border border-slate-300 rounded-lg px-3 py-1.5"
              />
            </label>
          ))}
          <div className="md:col-span-2 flex gap-2 justify-end">
            <button type="button" onClick={() => setEditing(null)} className="text-sm px-3 py-1.5 rounded-lg border border-slate-300">
              Cancel
            </button>
            <button disabled={busyId === editing.id} className="text-sm bg-blue-600 text-white font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50">
              Save
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase border-b border-slate-200">
                <th className="py-3 px-6">Title</th>
                <th className="py-3 px-6">Company</th>
                <th className="py-3 px-6">Location</th>
                <th className="py-3 px-6">Salary</th>
                <th className="py-3 px-6">Source</th>
                <th className="py-3 px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr><td colSpan={6} className="py-6 text-center text-slate-400">Loading vacancies...</td></tr>
              ) : vacancies.length === 0 ? (
                <tr><td colSpan={6} className="py-6 text-center text-slate-400">No vacancies to review.</td></tr>
              ) : (
                vacancies.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-6 font-semibold text-slate-900">{v.title}</td>
                    <td className="py-3.5 px-6 text-slate-600">{v.company}</td>
                    <td className="py-3.5 px-6 text-slate-500">{v.location || 'Remote'}</td>
                    <td className="py-3.5 px-6 font-mono text-emerald-600 font-medium">{v.salary}</td>
                    <td className="py-3.5 px-6 text-slate-500 text-xs">{v.source || 'WZone'}</td>
                    <td className="py-3.5 px-6 whitespace-nowrap space-x-2">
                      <button
                        onClick={() => startEdit(v)}
                        disabled={busyId === v.id}
                        className="text-xs bg-blue-50 text-blue-600 font-semibold px-2.5 py-1 rounded hover:bg-blue-100 transition disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleFlag(v, 'is_verified')}
                        disabled={busyId === v.id}
                        className={`text-xs font-semibold px-2.5 py-1 rounded transition disabled:opacity-50 ${
                          v.is_verified ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {v.is_verified ? 'Verified' : 'Verify'}
                      </button>
                      <button
                        onClick={() => toggleFlag(v, 'is_featured')}
                        disabled={busyId === v.id}
                        className={`text-xs font-semibold px-2.5 py-1 rounded transition disabled:opacity-50 ${
                          v.is_featured ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {v.is_featured ? 'Featured' : 'Feature'}
                      </button>
                      <button
                        onClick={() => remove(v)}
                        disabled={busyId === v.id}
                        className="text-xs bg-rose-50 text-rose-600 font-semibold px-2.5 py-1 rounded hover:bg-rose-100 transition disabled:opacity-50"
                      >
                        Delete
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
