'use client';

import React, { useEffect, useState } from 'react';
import { adminLogin, verifyAdminSession } from '../lib/api';

// AdminGate renders the dashboard only for a verified admin session and shows a
// sign-in form otherwise.
export function AdminGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'checking' | 'authorized' | 'login'>('checking');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    verifyAdminSession().then((ok) => setStatus(ok ? 'authorized' : 'login'));
  }, []);

  if (status === 'checking') {
    return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Checking session...</div>;
  }

  if (status === 'authorized') {
    return <>{children}</>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await adminLogin(email.trim(), password);
    setSubmitting(false);
    if (res.ok) {
      setStatus('authorized');
    } else {
      setError(res.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">WZone Admin</h1>
          <p className="text-xs text-slate-500 mt-1">Sign in with an administrator account.</p>
        </div>
        {error && <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5">{error}</div>}
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50"
        >
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
