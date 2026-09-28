'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, ShieldCheck, Mail, Lock, User, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api, setAuthToken, setCurrentUser } from '../lib/api';
import OneIDPortalModal from './OneIDPortalModal';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

const GoogleIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

function cleanNameFromEmail(emailAddress: string): string {
  if (!emailAddress || !emailAddress.includes('@')) return '';
  const raw = emailAddress.split('@')[0];
  const parts = raw.replace(/[._\-+]/g, ' ').split(/\s+/).filter(Boolean);
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
}



interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOneIDPortal, setShowOneIDPortal] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const handleOneIDMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'WORKHUB_ONEID_AUTH_CALLBACK' && event.data?.code) {
        setLoading(true);
        try {
          const res = await api.oneIDCallback({
            code: event.data.code,
            pinfl: event.data.pinfl || '',
          });
          if (res.success && res.data) {
            setAuthToken(res.data.token);
            setCurrentUser(res.data.user);
            onSuccess(res.data.user);
            onClose();
          }
        } catch (err: any) {
          setError(err.message || 'OneID xatoligi');
        } finally {
          setLoading(false);
        }
      }
    };
    window.addEventListener('message', handleOneIDMessage);
    return () => window.removeEventListener('message', handleOneIDMessage);
  }, []);

  const processGoogleAccessToken = async (accessToken: string) => {
    setLoading(true);
    setGoogleLoading(true);
    setError(null);
    try {
      let gUser: any = null;
      try {
        const gRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (gRes.ok) {
          gUser = await gRes.json();
        }
      } catch (err) {
        console.warn('Direct userinfo fetch failed, relying on backend verification', err);
      }

      const payload = {
        access_token: accessToken,
        email: gUser?.email || '',
        name: gUser?.name || '',
        avatar_url: gUser?.picture || '',
      };

      const res = await api.googleAuth(payload);
      if (res.success && res.data) {
        setAuthToken(res.data.token);
        setCurrentUser(res.data.user);
        onSuccess(res.data.user);
        onClose();
      } else {
        setError(res.error || 'Google hisobini tasdiqlashda xatolik yuz berdi');
      }
    } catch (err: any) {
      setError(err.message || 'Google bilan ulanishda xatolik');
    } finally {
      setLoading(false);
      setGoogleLoading(false);
    }
  };

  const processGoogleCredential = async (credential: string) => {
    setLoading(true);
    setGoogleLoading(true);
    setError(null);
    try {
      const res = await api.googleAuth({ credential });
      if (res.success && res.data) {
        setAuthToken(res.data.token);
        setCurrentUser(res.data.user);
        onSuccess(res.data.user);
        onClose();
      } else {
        setError(res.error || 'Google hisobini tasdiqlashda xatolik yuz berdi');
      }
    } catch (err: any) {
      setError(err.message || 'Google bilan ulanishda xatolik');
    } finally {
      setLoading(false);
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    const handleAuthData = async (authData: any) => {
      if (!authData) return;
      const { accessToken, code } = authData;
      if (accessToken) {
        await processGoogleAccessToken(accessToken);
      } else if (code) {
        const redirectUri = `${window.location.origin}/api/auth/callback/google`;
        setLoading(true);
        setGoogleLoading(true);
        try {
          const res = await api.googleAuth({ code, redirect_uri: redirectUri });
          if (res.success && res.data) {
            setAuthToken(res.data.token);
            setCurrentUser(res.data.user);
            onSuccess(res.data.user);
            onClose();
          } else {
            setError(res.error || 'Google hisobini tasdiqlashda xatolik yuz berdi');
          }
        } catch (err: any) {
          setError(err.message || 'Google xizmati bilan bog‘lanishda xatolik');
        } finally {
          setLoading(false);
          setGoogleLoading(false);
        }
      }
    };

    // 1. Listen for postMessage from popup
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'WORKHUB_GOOGLE_AUTH_CALLBACK') {
        handleAuthData(event.data);
      }
    };
    window.addEventListener('message', handleMessage);

    // 2. Listen for storage event across windows/tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'workhub_google_auth_token' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          localStorage.removeItem('workhub_google_auth_token');
          handleAuthData(data);
        } catch (_) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    // 3. Periodic poll for localStorage (in case storage event was suppressed)
    const pollInterval = setInterval(() => {
      const stored = localStorage.getItem('workhub_google_auth_token');
      if (stored) {
        localStorage.removeItem('workhub_google_auth_token');
        try {
          const data = JSON.parse(stored);
          handleAuthData(data);
        } catch (_) {}
      }
    }, 400);

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorage);
      clearInterval(pollInterval);
    };
  }, []);

  const openGoogleOAuthPopup = () => {
    const redirectUri = `${window.location.origin}/api/auth/callback/google`;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=token&scope=email%20profile%20openid&prompt=select_account`;

    const width = 500;
    const height = 620;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const popup = window.open(
      authUrl,
      'GoogleSignInPopup',
      `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no`
    );

    if (!popup) {
      window.location.href = authUrl;
      return;
    }

    const timer = setInterval(() => {
      try {
        if (popup.closed) {
          clearInterval(timer);
          setLoading(false);
          setGoogleLoading(false);
          return;
        }
        if (popup.location && popup.location.origin === window.location.origin) {
          const hash = popup.location.hash;
          if (hash && hash.includes('access_token=')) {
            clearInterval(timer);
            popup.close();
            const params = new URLSearchParams(hash.replace('#', ''));
            const accessToken = params.get('access_token');
            if (accessToken) {
              processGoogleAccessToken(accessToken);
            }
          }
        }
      } catch (_) {}
    }, 400);
  };

  const handleRealGoogleSignIn = () => {
    setError(null);
    setLoading(true);
    setGoogleLoading(true);

    // 1. Check Google Identity Services OAuth2 token client (Official popup)
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
      try {
        const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'email profile openid',
          callback: async (resp: any) => {
            if (resp.error) {
              setError('Google orqali kirish bekor qilindi yoki xatolik yuz berdi');
              setLoading(false);
              setGoogleLoading(false);
              return;
            }
            if (resp.access_token) {
              await processGoogleAccessToken(resp.access_token);
            }
          },
        });
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (e) {
        console.warn('Google oauth2 tokenClient error, trying popup fallback', e);
      }
    }

    // 2. Fallback to Google ID prompt if available
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            openGoogleOAuthPopup();
          }
        });
        return;
      } catch (e) {
        console.warn('Google id prompt error, fallback to popup', e);
      }
    }

    // 3. Fallback to native Google OAuth popup
    openGoogleOAuthPopup();
  };

  useEffect(() => {
    if (!isOpen) return;

    const setupGSI = () => {
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (res: any) => {
              if (res.credential) {
                processGoogleCredential(res.credential);
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });
        } catch (e) {
          console.warn('GSI setup error', e);
        }
      }
    };

    setupGSI();
    const timer = setTimeout(setupGSI, 600);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const handleStandardAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === 'login') {
        const res = await api.login({ email, password });
        if (res.success && res.data) {
          setAuthToken(res.data.token);
          setCurrentUser(res.data.user);
          onSuccess(res.data.user);
          onClose();
        } else {
          setError(res.error || 'Email yoki parol xato kiritildi');
        }
      } else {
        const res = await api.register({ name, email, password });
        if (res.success && res.data) {
          setAuthToken(res.data.token);
          setCurrentUser(res.data.user);
          onSuccess(res.data.user);
          onClose();
        } else {
          setError(res.error || 'Ro‘yxatdan o‘tishda xatolik yuz berdi');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };



  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
              W
            </div>
            <span className="font-bold text-lg text-slate-900 dark:text-white">
              Work<span className="text-blue-600">Hub</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {tab === 'login' ? 'Tizimga kirish' : 'Ro‘yxatdan o‘tish'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              WZone imkoniyatlaridan to‘liq foydalanish uchun hisobingizga kiring
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-2.5 text-sm text-red-700 dark:text-red-300">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Social / SSO Auth Buttons */}
          <div className="space-y-2.5 mb-6">
            {/* OneID SSO Button */}
            <button
              type="button"
              onClick={() => setShowOneIDPortal(true)}
              disabled={loading}
              className="w-full flex items-center justify-between gap-3 py-2.5 px-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-sky-950/20 hover:border-blue-400 dark:hover:border-blue-700 text-blue-950 dark:text-blue-100 font-semibold text-sm transition shadow-sm group active:scale-[0.99]"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0047BA] text-white flex items-center justify-center text-xs font-black shadow group-hover:scale-105 transition">
                  ID
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                    <span>OneID orqali kirish</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-600/10 dark:bg-blue-500/20 text-[#0047BA] dark:text-blue-300 font-bold rounded">
                      id.egov.uz
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 font-normal">
                    Yagona darcha (SSO) davlat xizmatlari orqali kirish
                  </p>
                </div>
              </div>
              <ShieldCheck size={18} className="text-[#0047BA] dark:text-blue-400 shrink-0" />
            </button>

            {/* Real Google SSO Button */}
            <button
              type="button"
              onClick={handleRealGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold text-sm transition shadow-sm hover:shadow active:scale-[0.99]"
            >
              <GoogleIcon />
              <span>
                {googleLoading ? 'Google hisobi tasdiqlanmoqda...' : 'Google orqali davom etish'}
              </span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center mb-6">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            <span className="bg-white dark:bg-slate-900 px-3 text-xs text-slate-400 uppercase tracking-wider">
              yoki email orqali
            </span>
            <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
          </div>

          {/* Tabs */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-5">
            <button
              type="button"
              onClick={() => { setTab('login'); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                tab === 'login'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              Kirish
            </button>
            <button
              type="button"
              onClick={() => { setTab('register'); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                tab === 'register'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              Ro‘yxatdan o‘tish
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleStandardAuth} className="space-y-4">
            {tab === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  To‘liq ismingiz
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <input
                    type="text"
                    required
                    placeholder="Ism Familiya"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Elektron pochta
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input
                  type="email"
                  required
                  placeholder="pochta@misol.uz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Maxfiy parol
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-medium text-sm rounded-xl shadow-lg shadow-blue-500/25 transition disabled:opacity-50"
            >
              {loading ? 'Kutilmoqda...' : tab === 'login' ? 'Tizimga kirish' : 'Hisob yaratish'}
            </button>
          </form>
        </div>
      </div>

      {/* Official OneID Portal Modal */}
      <OneIDPortalModal
        isOpen={showOneIDPortal}
        onClose={() => setShowOneIDPortal(false)}
        onSuccess={(u) => {
          onSuccess(u);
          onClose();
        }}
      />
    </div>
  );
}
