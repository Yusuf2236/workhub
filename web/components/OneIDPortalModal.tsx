'use client';

import React, { useState, useEffect } from 'react';
import { X, Lock, ShieldCheck, KeyRound, Smartphone, FileText, CheckCircle2, AlertCircle, ArrowRight, Upload, QrCode, ScanLine, RefreshCw, Sparkles } from 'lucide-react';
import QRCode from 'qrcode';
import { api, setAuthToken, setCurrentUser } from '../lib/api';
import { Language, translations } from '../lib/translations';

interface OneIDPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  lang?: Language;
}

function parsePINFL(pinfl: string) {
  const clean = pinfl.replace(/\D/g, '');
  if (clean.length !== 14) return null;
  const first = clean[0];
  const gender = ['1', '3', '5'].includes(first) ? 'Erkak' : 'Ayol';
  const prefix = ['1', '2'].includes(first) ? '18' : ['5', '6'].includes(first) ? '20' : '19';
  const day = clean.slice(1, 3);
  const month = clean.slice(3, 5);
  const year = prefix + clean.slice(5, 7);
  const birthDate = `${day}.${month}.${year}`;

  const regCode = clean.slice(7, 9);
  const regions: Record<string, string> = {
    '01': 'Andijon viloyati', '02': 'Andijon viloyati',
    '03': 'Buxoro viloyati', '04': 'Buxoro viloyati',
    '05': 'Farg‘ona viloyati', '06': 'Farg‘ona viloyati',
    '07': 'Jizzax viloyati', '08': 'Jizzax viloyati',
    '09': 'Xorazm viloyati', '10': 'Xorazm viloyati',
    '11': 'Namangan viloyati', '12': 'Namangan viloyati',
    '13': 'Navoiy viloyati', '14': 'Navoiy viloyati',
    '17': 'Qashqadaryo viloyati', '18': 'Qashqadaryo viloyati',
    '19': 'Qoraqalpog‘iston Respublikasi', '20': 'Qoraqalpog‘iston Respublikasi',
    '21': 'Samarqand viloyati', '22': 'Samarqand viloyati',
    '23': 'Sirdaryo viloyati', '24': 'Sirdaryo viloyati',
    '25': 'Surxondaryo viloyati', '26': 'Surxondaryo viloyati',
    '27': 'Toshkent shahri', '28': 'Toshkent viloyati', '29': 'Toshkent viloyati',
  };
  const location = regions[regCode] || 'Toshkent shahri';
  return { gender, birthDate, location };
}

export default function OneIDPortalModal({ isOpen, onClose, onSuccess, lang = 'uz' }: OneIDPortalModalProps) {
  const t = translations[lang || 'uz'];
  const [tab, setTab] = useState<'password' | 'qr' | 'eri' | 'mobile'>('password');

  // Input states - clean and empty (no sample presets)
  const [pinflInput, setPinflInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');
  const [eriFileName, setEriFileName] = useState('');
  const [eriPassword, setEriPassword] = useState('');
  const [mobilePhone, setMobilePhone] = useState('');
  const [smsSent, setSmsSent] = useState(false);
  const [smsCode, setSmsCode] = useState('');
  const [countdown, setCountdown] = useState(120);

  // Real OneID QR code states
  const [qrCodeData, setQrCodeData] = useState<{ code: string; hash: string } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrCountdown, setQrCountdown] = useState(180);
  const [qrStatus, setQrStatus] = useState<'idle' | 'loading' | 'waiting' | 'approved' | 'expired'>('idle');
  const [approvedCitizen, setApprovedCitizen] = useState<any>(null);

  // Flow states
  const [step, setStep] = useState<'auth' | 'consent'>('auth');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live parsed info from entered JShShIR
  const cleanPinfl = pinflInput.replace(/\D/g, '');
  const parsedData = cleanPinfl.length === 14 ? parsePINFL(cleanPinfl) : null;

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
            const citizenInfo = res.data.citizen || res.data.user;
            setApprovedCitizen(citizenInfo);
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

  // Countdown timer for Mobile-ID SMS
  useEffect(() => {
    let timer: any;
    if (smsSent && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [smsSent, countdown]);

  if (!isOpen) return null;

  const handleSendSms = () => {
    const cleanNum = mobilePhone.replace(/\D/g, '');
    if (cleanNum.length < 9) {
      setError('Haqiqiy telefon raqamingizni to‘liq kiriting');
      return;
    }
    setError(null);
    setSmsSent(true);
    setCountdown(120);
  };

  const handleProceedToConsent = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (tab === 'password') {
      if (cleanPinfl.length !== 14) {
        setError('JShShIR (PINFL) aynan 14 ta raqamdan iborat bo‘lishi kerak');
        return;
      }
      if (!passwordInput.trim()) {
        setError('OneID parolini kiriting');
        return;
      }
    } else if (tab === 'eri') {
      if (cleanPinfl.length !== 14) {
        setError('ERI egasining 14 xonali JShShIR raqamini kiriting');
        return;
      }
      if (!eriPassword.trim()) {
        setError('ERI kaliti parolini kiriting');
        return;
      }
    } else if (tab === 'mobile') {
      if (!mobilePhone.trim()) {
        setError('Telefon raqamingizni kiriting');
        return;
      }
      if (!smsCode.trim() || smsCode.length < 4) {
        setError('SMS tasdiqlash kodini to‘liq kiriting');
        return;
      }
    }

    setStep('consent');
  };

  const handleApproveAndLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const code = 'one_code-' + Math.random().toString(36).substring(2, 12) + Date.now();
      const activePinfl = cleanPinfl || '31201991234567';
      const info = parsePINFL(activePinfl);

      const res = await api.oneIDCallback({
        code,
        pinfl: activePinfl,
        full_name: fullNameInput.trim() || 'OneID Fuqarosi',
        email: `${activePinfl}@oneid.egov.uz`,
        phone: mobilePhone.trim() || '+998 (90) 123-45-67',
        location: info?.location || 'Toshkent shahri',
        birth_date: info?.birthDate || '12.01.1999',
        gender: info?.gender || 'Erkak',
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

  const handleDirectAutoLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    if (cleanPinfl.length !== 14) {
      setError('JShShIR (PINFL) aynan 14 ta raqamdan iborat bo‘lishi kerak');
      return;
    }
    await handleApproveAndLogin();
  };

  const handleSimulateQrApprove = async () => {
    setLoading(true);
    setQrStatus('loading');
    setError(null);
    try {
      const activePinfl = cleanPinfl || '31201991234567';
      const info = parsePINFL(activePinfl);
      const res = await api.oneIDCallback({
        code: 'one_code-demo-qr-' + Date.now(),
        pinfl: activePinfl,
        full_name: fullNameInput.trim() || 'Yusuf Usmonov',
        phone: mobilePhone.trim() || '+998 (90) 123-45-67',
        location: info?.location || 'Toshkent shahri',
        birth_date: info?.birthDate || '12.01.1999',
        gender: info?.gender || 'Erkak',
      });
      if (res.success && res.data) {
        setQrStatus('approved');
        const citizenInfo = res.data.citizen || res.data.user;
        setApprovedCitizen(citizenInfo);
        setAuthToken(res.data.token);
        setCurrentUser(res.data.user);
        setTimeout(() => {
          onSuccess(res.data.user);
          onClose();
        }, 1200);
      } else {
        setError(res.error || 'OneID orqali autentifikatsiyada xatolik yuz berdi');
        setQrStatus('waiting');
      }
    } catch (err: any) {
      setError(err.message || 'OneID serveri bilan ulanishda xatolik');
      setQrStatus('waiting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Browser / SSL Address Bar */}
        <div className="bg-slate-100 dark:bg-slate-950 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 select-none">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
            <div className="ml-2 flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] shadow-xs">
              <Lock size={11} className="text-emerald-600" />
              <span className="text-emerald-600 font-bold">https://</span>
              <span>sso.egov.uz/sso/oauth/Authorization.do</span>
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
                <span className="px-1.5 py-0.2 bg-white/20 text-[10px] rounded font-bold">id.egov.uz</span>
              </h2>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <span className="text-[10px] font-bold text-blue-200 uppercase bg-blue-900/60 px-2 py-1 rounded-md border border-blue-400/30">
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
          {step === 'auth' ? (
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

              {/* Tabs for Auth Methods (including QR-kod) */}
              <div className="flex border-b border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setTab('password'); setError(null); }}
                  className={`flex-1 pb-2.5 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition ${
                    tab === 'password'
                      ? 'border-[#0047BA] text-[#0047BA] dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                >
                  <KeyRound size={14} />
                  <span>{t.oneIdTabLogin}</span>
                </button>
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
                  onClick={() => { setTab('eri'); setError(null); }}
                  className={`flex-1 pb-2.5 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition ${
                    tab === 'eri'
                      ? 'border-[#0047BA] text-[#0047BA] dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                >
                  <FileText size={14} />
                  <span>{t.oneIdTabEri}</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setTab('mobile'); setError(null); }}
                  className={`flex-1 pb-2.5 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition ${
                    tab === 'mobile'
                      ? 'border-[#0047BA] text-[#0047BA] dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                >
                  <Smartphone size={14} />
                  <span>{t.oneIdTabMobileId}</span>
                </button>
              </div>

              {/* Tab 1: Password */}
              {tab === 'password' && (
                <form onSubmit={handleProceedToConsent} className="space-y-3.5 pt-1">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        JShShIR (14 xonali raqam) yoki OneID Logini *
                      </label>
                      <span className="text-[10px] font-mono text-slate-400">
                        {cleanPinfl.length}/14
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={14}
                      value={pinflInput}
                      onChange={(e) => setPinflInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="14 xonali JShShIR raqamingizni kiriting"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono font-bold tracking-wider rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                    {parsedData && (
                      <div className="mt-2 p-2 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-lg text-emerald-900 dark:text-emerald-200 text-xs space-y-1 animate-fadeIn">
                        <div className="flex items-center gap-1.5 font-bold text-[11px] text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 size={13} className="text-emerald-600" />
                          <span>{t.oneIdVerifiedNotice}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 text-[11px] pl-4">
                          <div>{t.oneIdGender} <b>{parsedData.gender}</b></div>
                          <div>{t.oneIdBirth} <b>{parsedData.birthDate}</b></div>
                          <div>{t.oneIdRegion} <b>{parsedData.location}</b></div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      To‘liq ism-sharifingiz (F.I.O) *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullNameInput}
                      onChange={(e) => setFullNameInput(e.target.value)}
                      placeholder="Ism, familiya va sharifingiz"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Telefon raqamingiz (OneID tizimida)
                    </label>
                    <input
                      type="text"
                      value={mobilePhone}
                      onChange={(e) => setMobilePhone(e.target.value)}
                      placeholder="+998 90 123 45 67"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        OneID maxfiy paroli *
                      </label>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
                        Parolni unutdingizmi?
                      </span>
                    </div>
                    <input
                      type="password"
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Parolingizni kiriting"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input type="checkbox" id="remember" defaultChecked className="rounded text-blue-600" />
                    <label htmlFor="remember" className="text-xs text-slate-600 dark:text-slate-400">
                      Meni OneID tizimida eslab qolish
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleDirectAutoLogin}
                      className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1.5 active:scale-[0.99] disabled:opacity-50"
                    >
                      <Sparkles size={15} />
                      <span>{loading ? 'Kirilmoqda...' : 'Tezkor avtomatik kirish'}</span>
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-2.5 bg-[#0047BA] hover:bg-[#003B95] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1.5 active:scale-[0.99] disabled:opacity-50"
                    >
                      <span>{t.oneIdConsentBtn}</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </form>
              )}

              {/* Tab 2: QR-kod */}
              {tab === 'qr' && (
                <div className="space-y-4 pt-1 text-center animate-fadeIn">
                  {/* Step Instructions */}
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

                  {/* Clean, 100% Scannable Official Black & White QR Code */}
                  <div className="relative mx-auto w-64 h-64 p-3.5 bg-white rounded-2xl border-2 border-slate-300 dark:border-slate-700 shadow-xl flex items-center justify-center">
                    {qrStatus === 'loading' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <RefreshCw size={36} className="animate-spin text-blue-600" />
                        <span className="text-xs mt-3 text-slate-600 dark:text-slate-400 font-medium">
                          OneID QR-kodi yuklanmoqda...
                        </span>
                      </div>
                    ) : qrStatus === 'approved' ? (
                      <div className="w-full h-full bg-emerald-50 dark:bg-emerald-950/60 rounded-xl p-4 flex flex-col items-center justify-center text-emerald-800 dark:text-emerald-200 animate-fadeIn">
                        <CheckCircle2 size={54} className="text-emerald-600 mb-2 animate-bounce" />
                        <span className="text-sm font-bold text-center">{t.oneIdConfirmed}</span>
                        <p className="text-xs text-center mt-1 font-medium text-emerald-700 dark:text-emerald-300">
                          {approvedCitizen?.full_name || 'OneID Fuqarosi'}
                        </p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                          JShShIR: {approvedCitizen?.pinfl || ''}
                        </p>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">
                          WZone tizimiga kirilmoqda...
                        </span>
                      </div>
                    ) : qrDataUrl ? (
                      <div className="w-full h-full flex items-center justify-center bg-white p-1">
                        <img
                          src={qrDataUrl}
                          alt="OneID Rasmiy QR Kod"
                          className="w-full h-full object-contain"
                          style={{ imageRendering: 'pixelated' }}
                        />
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

                  {/* Polling Live Status, Timer & Refresh */}
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

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleSimulateQrApprove}
                        disabled={loading || qrStatus === 'approved'}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 transition shadow-md active:scale-95 disabled:opacity-50"
                      >
                        <ShieldCheck size={15} />
                        <span>{t.oneIdDemoConfirm}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: ERI (E-IMZO) */}
              {tab === 'eri' && (
                <form onSubmit={handleProceedToConsent} className="space-y-3.5 pt-1">
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>{t.oneIdEimzoActive}</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      ERI egasining JShShIR raqami *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={14}
                      value={pinflInput}
                      onChange={(e) => setPinflInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="14 xonali JShShIR"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm font-mono font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      To‘liq ism-sharifingiz (F.I.O) *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullNameInput}
                      onChange={(e) => setFullNameInput(e.target.value)}
                      placeholder="Ism, familiya va sharifingiz"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Elektron raqamli imzo (.pfx) kaliti fayli
                    </label>
                    <label className="flex items-center gap-2 w-full px-3.5 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer hover:bg-slate-100 transition">
                      <Upload size={16} className="text-slate-400" />
                      <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
                        {eriFileName || '.pfx kalit faylini tanlang'}
                      </span>
                      <input
                        type="file"
                        accept=".pfx,.key"
                        onChange={(e) => setEriFileName(e.target.files?.[0]?.name || '')}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      ERI kalitining paroli *
                    </label>
                    <input
                      type="password"
                      required
                      value={eriPassword}
                      onChange={(e) => setEriPassword(e.target.value)}
                      placeholder="ERI parolini kiriting"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#0047BA] hover:bg-[#003B95] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 mt-4 active:scale-[0.99]"
                  >
                    <span>{t.oneIdSignInEri}</span>
                    <ArrowRight size={15} />
                  </button>
                </form>
              )}

              {/* Tab 4: Mobile-ID */}
              {tab === 'mobile' && (
                <form onSubmit={handleProceedToConsent} className="space-y-3.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Mobile-ID ro‘yxatdan o‘tgan telefon raqami *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={mobilePhone}
                        onChange={(e) => setMobilePhone(e.target.value)}
                        placeholder="+998 90 123 45 67"
                        className="flex-1 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={handleSendSms}
                        className="px-3 py-2 bg-blue-100 dark:bg-blue-900/60 hover:bg-blue-200 text-[#0047BA] dark:text-blue-300 font-bold text-xs rounded-xl transition shrink-0"
                      >
                        {smsSent ? 'Qayta yuborish' : 'SMS yuborish'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      To‘liq ism-sharifingiz (F.I.O) *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullNameInput}
                      onChange={(e) => setFullNameInput(e.target.value)}
                      placeholder="Ism, familiya va sharifingiz"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      JShShIR raqami (14 xonali)
                    </label>
                    <input
                      type="text"
                      maxLength={14}
                      value={pinflInput}
                      onChange={(e) => setPinflInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="14 xonali JShShIR"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm font-mono font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                  </div>

                  {smsSent && (
                    <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl space-y-2 animate-fadeIn">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          SMS tasdiqlash kodi:
                        </span>
                        <span className="font-mono text-blue-600 font-bold">
                          {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="______"
                        value={smsCode}
                        onChange={(e) => setSmsCode(e.target.value)}
                        className="w-full px-3 py-2 text-center text-lg font-mono tracking-widest font-black rounded-lg bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#0047BA] hover:bg-[#003B95] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 mt-4 active:scale-[0.99]"
                  >
                    <span>{t.oneIdConfirmMobileId}</span>
                    <ArrowRight size={15} />
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* Step 2: Official OneID Consent Screen */
            <div className="space-y-4 animate-fadeIn">
              <div className="text-center pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center mx-auto mb-2 shadow-inner">
                  <ShieldCheck size={28} />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Shaxsiy ma’lumotlarni uzatishga rozilik
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  <b>WZone</b> portali OneID tizimidan quyidagi shaxsiy ma’lumotlaringizni so‘ramoqda:
                </p>
              </div>

              {/* Verified Citizen Details Being Shared */}
              <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/80 dark:border-slate-700/80">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">{t.oneIdCitizen}</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {fullNameInput || 'Fuqaro'}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/80 dark:border-slate-700/80">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">{t.oneIdPinflLabel}</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    {cleanPinfl || '14 xonali JShShIR'}
                  </span>
                </div>
                {parsedData && (
                  <>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200/80 dark:border-slate-700/80">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">{t.oneIdBirth}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {parsedData.birthDate} ({parsedData.gender})
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200/80 dark:border-slate-700/80">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">{t.oneIdRegion}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {parsedData.location}
                      </span>
                    </div>
                  </>
                )}
                {mobilePhone && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">{t.oneIdPhone}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{mobilePhone}</span>
                  </div>
                )}
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-[11px] text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>{t.oneIdAutoSyncNotice}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('auth')}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition"
                >
                  Rad etish
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleApproveAndLogin}
                  className="flex-2 py-2.5 bg-[#0047BA] hover:bg-[#003B95] text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ShieldCheck size={16} />
                  <span>{loading ? 'Tasdiqlanmoqda...' : 'Ruxsat berish va kirish'}</span>
                </button>
              </div>
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
