'use client';

import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';
import { api } from '../lib/api';
import { Language, translations } from '../lib/translations';

interface ResetPasswordModalProps {
  token: string | null;
  onClose: () => void;
  /** Called after the password changed; the user signs in again */
  onDone: () => void;
  lang?: Language;
}

// ResetPasswordModal sets a new password from the emailed /?reset_token=... link.
export default function ResetPasswordModal({ token, onClose, onDone, lang = 'uz' }: ResetPasswordModalProps) {
  const t = translations[lang] || translations.uz;
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!token) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== repeat) {
      setError(t.passwordsDontMatch);
      return;
    }
    setLoading(true);
    try {
      const res = await api.resetPassword(token, password);
      if (res.success) onDone();
      else setError(res.error || t.networkError);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">{t.newPasswordTitle}</h3>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        {[
          { label: t.newPasswordLabel, value: password, set: setPassword },
          { label: t.repeatPasswordLabel, value: repeat, set: setRepeat },
        ].map((f) => (
          <label key={f.label} className="block text-xs font-medium text-slate-600 dark:text-slate-400 space-y-1">
            <span>{f.label}</span>
            <span className="relative block">
              <Lock className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="password"
                required
                minLength={8}
                maxLength={72}
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                className={inputClass}
              />
            </span>
          </label>
        ))}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl shadow-lg shadow-blue-500/25 transition disabled:opacity-50"
        >
          {loading ? '...' : t.savePasswordBtn}
        </button>
      </form>
    </div>
  );
}
