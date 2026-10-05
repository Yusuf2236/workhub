'use client';

import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, CheckCircle2, AlertCircle, QrCode, ScanLine, RefreshCw, ExternalLink, FlaskConical } from 'lucide-react';
import QRCode from 'qrcode';
import { api, setAuthToken, setCurrentUser } from '../lib/api';
import { Language, translations } from '../lib/translations';

interface OneIDPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  lang?: Language;
}

type OneIDTab = 'qr' | 'sso' | 'demo';

export default function OneIDPortalModal({ isOpen, onClose, onSuccess, lang = 'uz' }: OneIDPortalModalProps) {
  const t = translations[lang || 'uz'];
  const [tab, setTab] = useState<OneIDTab>('qr');

  // What the backend supports (real SSO credentials / local demo mode)
  const [ssoUrl, setSsoUrl] = useState<string | null>(null);
  const [ssoConfigured, setSsoConfigured] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  // Real OneID QR code states
  const [qrCodeData, setQrCodeData] = useState<{ code: string; hash: string } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrCountdown, setQrCountdown] = useState(180);
  const [qrStatus, setQrStatus] = useState<'idle' | 'loading' | 'waiting' | 'approved' | 'expired'>('idle');
  const [approvedCitizen, setApprovedCitizen] = useState<any>(null);

  // Demo (development only) inputs
  const [pinflInput, setPinflInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanPinfl = pinflInput.replace(/\D/g, '');

  useEffect(() => {
    if (!isOpen) return;
    api.getOneIDLoginUrl().then((res) => {
      if (res.success && res.data) {
        setSsoUrl(res.data.auth_url);
        setSsoConfigured(Boolean(res.data.is_live_configured));
        setDemoMode(Boolean(res.data.demo_mode));
      }
    });
  }, [isOpen]);

  const generateQrSession = async () => {
    setQrStatus('loading');
    setQrCountdown(180);
    setError(null);
    try {
      const res = await api.oneIDQRGenerate();
      if (res.success && res.data && res.data.qr_string) {
        setQrCodeData({ code: res.data.code, hash: res.data.hash });
        const url = await QRCode.toDataURL(res.data.qr_string, {
          width: 340,
          margin: 1,
          errorCorrectionLevel: 'M',
          color: { dark: '#000000', light: '#FFFFFF' },
        });
        setQrDataUrl(url);
        setQrStatus('waiting');
      } else {
        setError(res.error || 'OneID QR kodini olishda xatolik yuz berdi');
        setQrStatus('idle');
      }
    } catch (e: any) {
      console.error('Failed to generate OneID QR code', e);
      setError('OneID tizimi bilan aloqa o‘rnatilmadi');
      setQrStatus('idle');
    }
  };

  useEffect(() => {
    if (isOpen && tab === 'qr') {
      generateQrSession();
    }
  }, [isOpen, tab]);

  // QR countdown
  useEffect(() => {
    let timer: any;
    if (tab === 'qr' && qrCountdown > 0 && qrStatus === 'waiting') {
      timer = setInterval(() => {
        setQrCountdown((c) => {
          if (c <= 1) {
            setQrStatus('expired');
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [tab, qrCountdown, qrStatus]);

  // Poll until the citizen confirms the login in the OneID mobile app
  useEffect(() => {
    if (!isOpen || tab !== 'qr' || qrStatus !== 'waiting' || !qrCodeData) return;

    let isSubscribed = true;
    const interval = setInterval(async () => {
      try {
        const res = await api.oneIDQRCheck({
          code: qrCodeData.code,
          hash: qrCodeData.hash,
        });

        if (!isSubscribed) return;

        if (res.success && res.data) {
          if (res.data.status === 'approved' && res.data.token && res.data.user) {
            clearInterval(interval);
            setQrStatus('approved');
            setApprovedCitizen(res.data.citizen || res.data.user);
            setAuthToken(res.data.token);
            setCurrentUser(res.data.user);
            setTimeout(() => {
              if (isSubscribed) {
                onSuccess(res.data.user);
                onClose();
              }
            }, 1200);
          } else if (res.data.status === 'expired') {
            clearInterval(interval);
            setQrStatus('expired');
          }
        }
      } catch (e) {
        console.error('OneID QR check polling error', e);
      }
    }, 2000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [isOpen, tab, qrStatus, qrCodeData?.code, qrCodeData?.hash]);

  if (!isOpen) return null;

  // Opens the official sso.egov.uz page. The callback page posts {code, state}
  // back to AuthModal, which completes the login on the backend.
  const handleOpenSSO = () => {
    if (!ssoUrl) return;
    const w = 520;
    const h = 680;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    const popup = window.open(ssoUrl, 'oneid_sso', `width=${w},height=${h},left=${left},top=${top}`);
    if (!popup) {
      window.location.href = ssoUrl;
    }
  };

  const handleDemoLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (cleanPinfl.length !== 14) {
      setError('JShShIR (PINFL) aynan 14 ta raqamdan iborat bo‘lishi kerak');
      return;
    }
    setLoading(true);
    try {
      const res = await api.oneIDCallback({
        pinfl: cleanPinfl,
        full_name: fullNameInput.trim() || undefined,
      });
      if (res.success && res.data) {
        setAuthToken(res.data.token);
        setCurrentUser(res.data.user);
        onSuccess(res.data.user);
        onClose();
      } else {
        setError(res.error || 'OneID orqali autentifikatsiyada xatolik yuz berdi');
      }
    } catch (err: any) {
      setError(err.message || 'OneID serveri bilan ulanishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const tabs: { id: OneIDTab; label: string; icon: React.ReactNode; visible: boolean }[] = [
    { id: 'qr', label: t.oneIdTabQr, icon: <QrCode size={14} />, visible: true },
    { id: 'sso', label: 'id.egov.uz', icon: <ExternalLink size={14} />, visible: ssoConfigured },
    { id: 'demo', label: 'Demo (dev)', icon: <FlaskConical size={14} />, visible: demoMode },
  ];
  const visibleTabs = tabs.filter((x) => x.visible);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#003B95] via-[#0047BA] to-[#0A58CA] text-white p-4 sm:p-5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center border border-white/20 shrink-0 font-black">
              ID
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">{t.oneIdTitle}</h2>
              <p className="text-[11px] text-blue-100">{t.wzoneSystemName} · {t.oneIdAuthRequest}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-blue-100 hover:text-white hover:bg-white/15 transition"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-3 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {visibleTabs.length > 1 && (
            <div className="flex border-b border-slate-200 dark:border-slate-800">
              {visibleTabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setTab(item.id);
                    setError(null);
                  }}
                  className={`flex-1 pb-2.5 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition ${
                    tab === item.id
                      ? 'border-[#0047BA] text-[#0047BA] dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}

          {tab === 'qr' && (
            <div className="space-y-4 text-center animate-fadeIn">
              <div className="p-3 bg-blue-50/90 dark:bg-blue-950/40 rounded-xl border border-blue-200/80 dark:border-blue-900/50 text-xs text-blue-950 dark:text-blue-200 text-left">
                <p className="font-bold flex items-center gap-1.5 mb-2 text-blue-900 dark:text-blue-300">
                  <ScanLine size={16} className="text-blue-600" />
                  OneID Mobile yoki MyGov ilovasi orqali kirish
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                  <li>{t.oneIdQrStep1}</li>
                  <li>{t.oneIdQrStep2}</li>
                  <li>{t.oneIdQrStep3}</li>
                </ol>
              </div>

              <div className="relative mx-auto w-64 h-64 p-3.5 bg-white rounded-2xl border-2 border-slate-300 dark:border-slate-700 shadow-xl flex items-center justify-center">
                {qrStatus === 'loading' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <RefreshCw size={36} className="animate-spin text-blue-600" />
                    <span className="text-xs mt-3 text-slate-600 font-medium">OneID QR-kodi yuklanmoqda...</span>
                  </div>
                ) : qrStatus === 'approved' ? (
                  <div className="w-full h-full bg-emerald-50 rounded-xl p-4 flex flex-col items-center justify-center text-emerald-800 animate-fadeIn">
                    <CheckCircle2 size={54} className="text-emerald-600 mb-2 animate-bounce" />
                    <span className="text-sm font-bold text-center">{t.oneIdConfirmed}</span>
                    <p className="text-xs text-center mt-1 font-medium text-emerald-700">
                      {approvedCitizen?.full_name || 'OneID Fuqarosi'}
                    </p>
                    <span className="text-[10px] text-slate-500 mt-2">WZone tizimiga kirilmoqda...</span>
                  </div>
                ) : qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="OneID QR kod"
                    className="w-full h-full object-contain"
                    style={{ imageRendering: 'pixelated' }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <QrCode size={48} className="animate-pulse text-slate-800" />
                    <span className="text-xs mt-2 text-slate-600">{t.oneIdQrGenerating}</span>
                  </div>
                )}

                {qrStatus === 'expired' && (
                  <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center text-white p-4 rounded-2xl animate-fadeIn">
                    <AlertCircle size={36} className="text-amber-400 mb-1" />
                    <p className="text-xs font-bold mb-3">{t.oneIdQrExpired}</p>
                    <button
                      type="button"
                      onClick={generateQrSession}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-lg active:scale-95"
                    >
                      <RefreshCw size={14} />
                      <span>{t.oneIdRefresh}</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center justify-center gap-2">
                {qrStatus === 'waiting' && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-full text-amber-800 dark:text-amber-200 text-xs font-medium">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    <span>{t.oneIdWaitingQr}</span>
                  </div>
                )}
                <div className="flex items-center justify-center gap-3 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Amal qilish muddati:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                    {Math.floor(qrCountdown / 60)}:{(qrCountdown % 60).toString().padStart(2, '0')}
                  </span>
                  <button
                    type="button"
                    onClick={generateQrSession}
                    title="QR-kodni yangilash"
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                  >
                    <RefreshCw size={14} className={qrStatus === 'loading' ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'sso' && (
            <div className="space-y-4 text-center animate-fadeIn">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Rasmiy <b>id.egov.uz</b> sahifasi yangi oynada ochiladi. Login, parol yoki ERI kalitingizni faqat o‘sha
                sahifada kiriting — WZone ularni hech qachon so‘ramaydi.
              </p>
              <button
                type="button"
                onClick={handleOpenSSO}
                disabled={!ssoUrl}
                className="px-5 py-2.5 bg-[#0047BA] hover:bg-[#003B95] text-white rounded-xl text-sm font-bold inline-flex items-center gap-2 transition shadow-md active:scale-95 disabled:opacity-50"
              >
                <ShieldCheck size={16} />
                <span>id.egov.uz orqali kirish</span>
                <ExternalLink size={14} />
              </button>
            </div>
          )}

          {tab === 'demo' && (
            <form onSubmit={handleDemoLogin} className="space-y-3.5 animate-fadeIn">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-[11px] text-amber-900 dark:text-amber-200">
                Faqat lokal ishlab chiqish uchun (ONEID_DEMO_MODE). JShShIR tekshirilmaydi; production’da bu rejim o‘chiq.
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">JShShIR (14 xonali) *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={14}
                  value={pinflInput}
                  onChange={(e) => setPinflInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2.5 text-sm font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">F.I.O</label>
                <input
                  type="text"
                  value={fullNameInput}
                  onChange={(e) => setFullNameInput(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition disabled:opacity-50"
              >
                {loading ? '...' : t.oneIdDemoConfirm}
              </button>
            </form>
          )}
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 px-5 py-3 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400">
          <span>{t.oneIdLawNotice}</span>
        </div>
      </div>
    </div>
  );
}
