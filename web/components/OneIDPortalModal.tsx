'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  QrCode,
  RefreshCw,
  Sparkles,
  User,
  Building2,
  Briefcase,
  ExternalLink,
  KeyRound,
} from 'lucide-react';
import QRCode from 'qrcode';
import { api, setAuthToken, setCurrentUser } from '../lib/api';
import { Language, translations } from '../lib/translations';

interface OneIDPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  lang?: Language;
}

export default function OneIDPortalModal({ isOpen, onClose, onSuccess, lang = 'uz' }: OneIDPortalModalProps) {
  const t = translations[lang || 'uz'];
  const [tab, setTab] = useState<'qr' | 'sso'>('qr');

  // Real OneID QR code states
  const [qrCodeData, setQrCodeData] = useState<{ code: string; hash: string } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrCountdown, setQrCountdown] = useState(180);
  const [qrStatus, setQrStatus] = useState<'idle' | 'loading' | 'waiting' | 'approved' | 'expired'>('idle');

  // Role & account selection states
  const [accountType, setAccountType] = useState<'individual' | 'company'>('individual');
  const [companyName, setCompanyName] = useState('');
  const [companyInn, setCompanyInn] = useState('');

  // Flow states: 'auth' -> 'role_select'
  const [step, setStep] = useState<'auth' | 'role_select'>('auth');
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('auth');
      setError(null);
      setLoggedInUser(null);
      setTab('qr');
    }
  }, [isOpen]);

  // Generate dynamic QR code directly from official OneID API
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
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
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

  // Real-time polling to check if citizen scanned and confirmed in OneID mobile app
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
            setAuthToken(res.data.token);
            setLoggedInUser(res.data.user);
            setTimeout(() => {
              if (isSubscribed) {
                setStep('role_select');
              }
            }, 600);
          } else if (res.data.status === 'expired') {
            clearInterval(interval);
            setQrStatus('expired');
          }
        }
      } catch (e) {
        console.error('OneID QR check polling error', e);
      }
    }, 2500);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [isOpen, tab, qrStatus, qrCodeData?.code, qrCodeData?.hash]);

  // Launch official OneID SSO authorization redirect (sso.egov.uz)
  const handleLaunchSSO = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getOneIDLoginUrl();
      if (res.success && res.data?.auth_url) {
        window.location.href = res.data.auth_url;
      } else {
        setError(res.error || 'OneID SSO manzilini olishda xatolik yuz berdi');
      }
    } catch (err: any) {
      setError(err.message || 'OneID serveri bilan ulanishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  // Finalize selected account type (individual / company) and enter platform
  const handleFinalizeRole = async () => {
    setLoading(true);
    setError(null);
    try {
      if (accountType === 'company') {
        if (!companyName.trim()) {
          setError('Tashkilot yoki kompaniya nomini kiriting');
          setLoading(false);
          return;
        }
        if (companyInn.trim().length !== 9) {
          setError('STIR (INN) aynan 9 ta raqamdan iborat bo‘lishi kerak');
          setLoading(false);
          return;
        }
      }

      const updateRes = await api.updateProfile({
        account_type: accountType,
        company_name: accountType === 'company' ? companyName.trim() : '',
        inn: accountType === 'company' ? companyInn.trim() : '',
        name: accountType === 'company' ? companyName.trim() : undefined,
      });

      const finalUser = updateRes.data?.user || {
        ...(loggedInUser || {}),
        name: accountType === 'company' ? companyName.trim() : (loggedInUser?.name || 'OneID Fuqarosi'),
        account_type: accountType,
        company_name: accountType === 'company' ? companyName.trim() : '',
        inn: accountType === 'company' ? companyInn.trim() : '',
        role: accountType === 'company' ? 'employer' : 'user',
      };
      if (accountType === 'company' && companyName.trim()) {
        finalUser.name = companyName.trim();
      }

      setCurrentUser(finalUser);
      onSuccess(finalUser);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Profilni saqlashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp"
      >
        {/* Top Browser URL Bar */}
        <div className="bg-slate-100 dark:bg-slate-950 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
            <div className="ml-2 flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] shadow-xs">
              <Lock size={11} className="text-emerald-600" />
              <span className="text-emerald-600 font-bold">https://</span>
              <span>id.egov.uz</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Official OneID Portal Header */}
        <div className="bg-gradient-to-r from-[#003B95] via-[#0047BA] to-[#0A58CA] text-white p-4 sm:p-5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            {/* Republic Coat of Arms */}
            <div className="w-12 h-12 rounded-xl bg-white/10 p-1 flex items-center justify-center border border-white/20 shrink-0 shadow-inner">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle cx="50" cy="50" r="46" fill="#0047BA" stroke="#D4AF37" strokeWidth="3" />
                <path d="M 20 65 Q 50 20 80 65 Q 50 50 20 65 Z" fill="#D4AF37" opacity="0.9" />
                <circle cx="50" cy="40" r="14" fill="#FFD700" />
                <polygon points="50,22 53,30 62,30 55,36 58,45 50,39 42,45 45,36 38,30 47,30" fill="#fff" />
              </svg>
            </div>
            <div>
              <div className="text-[10px] tracking-wider uppercase font-semibold text-blue-100">
                O‘zbekiston Respublikasi Raqamli texnologiyalar vazirligi
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>{t.oneIdTitle}</span>
                <span className="px-1.5 py-0.5 bg-white/20 text-[10px] rounded font-bold">id.egov.uz</span>
              </h2>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <span className="text-[10px] font-bold text-blue-200 uppercase bg-blue-900/60 px-2.5 py-1 rounded-md border border-blue-400/30">
              Davlat portali
            </span>
          </div>
        </div>

        {/* Error alert */}
        {error && (
          <div className="mx-4 mt-3 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {step === 'role_select' ? (
            <div className="space-y-5 animate-fadeIn">
              {/* Heading */}
              <div className="text-center space-y-1.5 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#0047BA] dark:text-blue-400 text-[11px] font-bold border border-blue-200 dark:border-blue-800">
                  <Sparkles size={13} />
                  <span>OneID identifikatsiyasi tasdiqlandi</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Kim bo‘lib davom ettirasiz?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  OneID orqali muvaffaqiyatli autentifikatsiyadan o‘tdingiz! Platformada faoliyatingizga mos hisob turini tanlang.
                </p>
              </div>

              {/* Authenticated citizen banner */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>OneID orqali tasdiqlangan fuqaro: <b>{loggedInUser?.name || 'OneID Fuqarosi'}</b></span>
                </div>
                {loggedInUser?.pinfl && (
                  <span className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                    JShShIR: {loggedInUser.pinfl}
                  </span>
                )}
              </div>

              {/* Two selection cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Card 1: Oddiy shaxs (Jismoniy shaxs) */}
                <div
                  onClick={() => { setAccountType('individual'); setError(null); }}
                  className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 text-left flex flex-col justify-between ${
                    accountType === 'individual'
                      ? 'border-[#0047BA] bg-blue-50/60 dark:bg-blue-950/40 shadow-md ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        accountType === 'individual'
                          ? 'bg-[#0047BA] text-white shadow-md'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}>
                        <User size={22} />
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        accountType === 'individual'
                          ? 'border-[#0047BA] bg-[#0047BA] text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {accountType === 'individual' && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-900 dark:text-white">
                        Oddiy shaxs
                      </h4>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                        Fuqaro / Nomzod sifatida
                      </p>
                    </div>
                    <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                      <li className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span>Vakansiyalarga rezyume topshirish</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span>Ish beruvchilar bilan to‘g‘ridan-to‘g‘ri yozishish</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Card 2: Yuridik shaxs (Kompaniya) */}
                <div
                  onClick={() => { setAccountType('company'); setError(null); }}
                  className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 text-left flex flex-col justify-between ${
                    accountType === 'company'
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 shadow-md ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        accountType === 'company'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}>
                        <Building2 size={22} />
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        accountType === 'company'
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {accountType === 'company' && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-900 dark:text-white">
                        Yuridik shaxs
                      </h4>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                        Kompaniya / Ish beruvchi
                      </p>
                    </div>
                    <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                      <li className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <span>Kompaniya nomidan vakansiyalar e’lon qilish</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <span>Nomzodlar arizalarini ko‘rish va saralash</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* If Yuridik shaxs is selected, show Company Name & INN inputs */}
              {accountType === 'company' && (
                <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    <Briefcase size={15} />
                    <span>Tashkilot rekvizitlari (Yuridik shaxs)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Tashkilot / Kompaniya nomi *
                      </label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Korxona yoki tashkilot nomini kiriting"
                        className="w-full px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        STIR / INN (9 xonali) *
                      </label>
                      <input
                        type="text"
                        maxLength={9}
                        value={companyInn}
                        onChange={(e) => setCompanyInn(e.target.value.replace(/\D/g, ''))}
                        placeholder="9 xonali STIR (masalan: 301234567)"
                        className="w-full px-3.5 py-2 text-xs sm:text-sm font-mono font-bold rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-indigo-700 dark:text-indigo-300">
                    * Barcha e’lonlar va muloqotlar shaxsiy ismingizdan emas, aynan shu tashkilot nomidan olib boriladi.
                  </p>
                </div>
              )}

              {/* Confirm & Proceed to Platform button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleFinalizeRole}
                  className="w-full py-3 bg-[#0047BA] hover:bg-[#003B95] text-white text-sm font-black rounded-xl shadow-lg transition flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
                >
                  {loading ? (
                    <span>Saqlanmoqda...</span>
                  ) : (
                    <>
                      <span>Tasdiqlash va platformaga o‘tish</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Target Service Info */}
              <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200/80 dark:border-blue-900/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    W
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{t.wzoneSystemName}</span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{t.oneIdAuthRequest}</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <ShieldCheck size={14} /> Rasmiy SSO
                </span>
              </div>

              {/* Two Clean Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setTab('qr'); setError(null); }}
                  className={`flex-1 pb-2.5 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition ${
                    tab === 'qr'
                      ? 'border-[#0047BA] text-[#0047BA] dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                >
                  <QrCode size={14} />
                  <span>{t.oneIdTabQr}</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setTab('sso'); setError(null); }}
                  className={`flex-1 pb-2.5 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition ${
                    tab === 'sso'
                      ? 'border-[#0047BA] text-[#0047BA] dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                >
                  <KeyRound size={14} />
                  <span>Rasmiy OneID SSO (Login & ERI)</span>
                </button>
              </div>

              {/* Tab 1: QR Code Scanner (OneID Mobile App) */}
              {tab === 'qr' && (
                <div className="space-y-4 pt-1 animate-fadeIn">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <QrCode size={14} className="text-blue-600" />
                      <span>OneID mobil ilovasi orqali kirish tartibi:</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400 pl-1">
                      <li>{t.oneIdQrStep1}</li>
                      <li>{t.oneIdQrStep2}</li>
                      <li>{t.oneIdQrStep3}</li>
                    </ol>
                  </div>

                  {/* QR Image Display */}
                  <div className="relative mx-auto w-64 h-64 p-3 bg-white rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center overflow-hidden">
                    {qrStatus === 'approved' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-emerald-600 animate-fadeIn">
                        <CheckCircle2 size={56} className="mb-2 animate-bounce" />
                        <span className="text-sm font-black">{t.oneIdConfirmed}</span>
                        <span className="text-[11px] text-slate-500 mt-1">Hisob ma’lumotlari yuklanmoqda...</span>
                      </div>
                    ) : qrDataUrl && qrStatus === 'waiting' ? (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <img
                          src={qrDataUrl}
                          alt="OneID Rasmiy QR Kodi"
                          className="w-full h-full object-contain rounded-lg"
                        />
                        <div className="absolute inset-0 border-2 border-blue-500/20 rounded-lg pointer-events-none" />
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <QrCode size={48} className="animate-pulse text-slate-800" />
                        <span className="text-xs mt-2 text-slate-600">{t.oneIdQrGenerating}</span>
                      </div>
                    )}

                    {qrStatus === 'expired' && (
                      <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4 rounded-2xl animate-fadeIn">
                        <AlertCircle size={36} className="text-amber-400 mb-1" />
                        <p className="text-xs font-bold mb-1">{t.oneIdQrExpired}</p>
                        <p className="text-[11px] text-slate-300 text-center mb-3">
                          Xavfsizlik maqsadida yangi kod yarating
                        </p>
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

                  {/* Polling Live Status & Countdown */}
                  <div className="flex flex-col items-center justify-center gap-2">
                    {qrStatus === 'waiting' && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-full text-amber-800 dark:text-amber-200 text-xs font-medium animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        <span>{t.oneIdWaitingQr}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-center gap-3 text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        Amal qilish muddati:
                      </span>
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

              {/* Tab 2: Rasmiy OneID SSO (Login & Parol / E-IMZO / Mobile-ID) */}
              {tab === 'sso' && (
                <div className="space-y-4 pt-1 animate-fadeIn">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 rounded-2xl border border-blue-200 dark:border-blue-900/60 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0047BA] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md">
                        SSO
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">
                          Davlat xizmatlari yagona portali (sso.egov.uz)
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                          Login va maxfiy parol, Elektron raqamli imzo (ERI / E-IMZO) yoki Mobile-ID orqali xavfsiz autentifikatsiya to‘g‘ridan-to‘g‘ri davlat portalida amalga oshiriladi.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-[11px]">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center font-semibold text-slate-800 dark:text-slate-200 shadow-xs">
                        🔑 Login & Parol
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center font-semibold text-slate-800 dark:text-slate-200 shadow-xs">
                        📜 E-IMZO (ERI kaliti)
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center font-semibold text-slate-800 dark:text-slate-200 shadow-xs">
                        📱 Mobile-ID
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                    <ShieldCheck size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Xavfsizlik talablariga asosan, fuqarolarning maxfiy parollari va ERI kalitlari hech qachon begona saytlarda so‘ralmaydi, faqat davlatning rasmiy <b>sso.egov.uz</b> manzilida kiritiladi.
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleLaunchSSO}
                    className="w-full py-3 bg-[#0047BA] hover:bg-[#003B95] active:scale-[0.99] text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <span>Ulanmoqda...</span>
                    ) : (
                      <>
                        <span>Rasmiy OneID portaliga o‘tish (sso.egov.uz)</span>
                        <ExternalLink size={15} />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 dark:bg-slate-950 px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
          <span>{t.oneIdLawNotice}</span>
          <span className="font-mono">id.egov.uz • 2026</span>
        </div>
      </div>
    </div>
  );
}
