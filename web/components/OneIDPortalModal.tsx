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
  Plus,
  Check,
  Building,
} from 'lucide-react';
import QRCode from 'qrcode';
import { api, setAuthToken, setCurrentUser } from '../lib/api';
import { Language, translations } from '../lib/translations';

export interface OneIDOrganization {
  inn: string;
  name: string;
  short_name?: string;
  role: string;
  status: string;
  address?: string;
  is_head: boolean;
  oked?: string;
}

export interface OneIDPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  lang?: Language;
  initialStep?: 'auth' | 'role_select';
  initialUser?: any;
  initialCitizen?: any;
  initialOrganizations?: OneIDOrganization[];
}

export default function OneIDPortalModal({
  isOpen,
  onClose,
  onSuccess,
  lang = 'uz',
  initialStep,
  initialUser,
  initialCitizen,
  initialOrganizations,
}: OneIDPortalModalProps) {
  const t = translations[lang || 'uz'];
  const [tab, setTab] = useState<'qr' | 'sso'>('qr');

  // Real OneID QR code states
  const [qrCodeData, setQrCodeData] = useState<{ code: string; hash: string } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrCountdown, setQrCountdown] = useState(180);
  const [qrStatus, setQrStatus] = useState<'idle' | 'loading' | 'waiting' | 'approved' | 'expired'>('idle');

  // Flow states: 'auth' -> 'role_select'
  const [step, setStep] = useState<'auth' | 'role_select'>('auth');
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [citizen, setCitizen] = useState<any>(null);
  const [organizations, setOrganizations] = useState<OneIDOrganization[]>([]);

  // Selection target: 'individual' | number (index of organization) | 'custom'
  const [selectedTarget, setSelectedTarget] = useState<'individual' | number | 'custom'>('individual');
  const [customOrgName, setCustomOrgName] = useState('');
  const [customOrgInn, setCustomOrgInn] = useState('');
  const [customRole, setCustomRole] = useState('Rahbar / Vakil');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialStep === 'role_select' && (initialUser || initialCitizen)) {
        setStep('role_select');
        setLoggedInUser(initialUser || null);
        setCitizen(initialCitizen || null);
        const orgs = (initialOrganizations || initialCitizen?.organizations || []) as OneIDOrganization[];
        setOrganizations(orgs);
        if (orgs.length > 0) {
          setSelectedTarget(0); // Pick first organization by default
        } else {
          setSelectedTarget('individual');
        }
      } else {
        setStep('auth');
        setError(null);
        setLoggedInUser(null);
        setCitizen(null);
        setOrganizations([]);
        setSelectedTarget('individual');
        setTab('qr');
      }
    }
  }, [isOpen, initialStep, initialUser, initialCitizen, initialOrganizations]);

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
    if (isOpen && tab === 'qr' && step === 'auth') {
      generateQrSession();
    }
  }, [isOpen, tab, step]);

  // QR countdown
  useEffect(() => {
    let timer: any;
    if (tab === 'qr' && qrCountdown > 0 && qrStatus === 'waiting' && step === 'auth') {
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
  }, [tab, qrCountdown, qrStatus, step]);

  // Real-time polling to check if citizen scanned and confirmed in OneID mobile app
  useEffect(() => {
    if (!isOpen || tab !== 'qr' || qrStatus !== 'waiting' || !qrCodeData || step !== 'auth') return;

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

            const cit = res.data.citizen || {
              pinfl: res.data.user?.pinfl,
              full_name: res.data.user?.name,
              location: res.data.user?.location,
              phone: res.data.user?.phone,
              avatar_url: res.data.user?.avatar_url,
            };
            setCitizen(cit);

            const orgs = (res.data.organizations || (cit as any)?.organizations || []) as OneIDOrganization[];
            setOrganizations(orgs);
            if (orgs.length > 0) {
              setSelectedTarget(0); // Choose first organization by default
            } else {
              setSelectedTarget('individual');
            }

            // Instantly transition to role_select so user is never stuck
            setStep('role_select');
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
  }, [isOpen, tab, qrStatus, qrCodeData?.code, qrCodeData?.hash, step]);

  // Fallback watchdog: whenever qrStatus becomes 'approved', ensure we move to 'role_select'
  useEffect(() => {
    if (qrStatus === 'approved' && step === 'auth') {
      const timer = setTimeout(() => {
        setStep('role_select');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [qrStatus, step]);

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

  // Finalize selected account type (individual / chosen company / custom company)
  const handleFinalizeRole = async () => {
    setLoading(true);
    setError(null);
    try {
      let payload: {
        account_type: 'individual' | 'company';
        company_name?: string;
        inn?: string;
        role_in_org?: string;
        organizations?: OneIDOrganization[];
      };

      if (selectedTarget === 'individual') {
        payload = {
          account_type: 'individual',
          organizations,
        };
      } else if (typeof selectedTarget === 'number') {
        const org = organizations[selectedTarget];
        if (!org) {
          setError('Tashkilot tanlanmadi');
          setLoading(false);
          return;
        }
        payload = {
          account_type: 'company',
          company_name: org.name,
          inn: org.inn,
          role_in_org: org.role || 'Rahbar',
          organizations,
        };
      } else {
        // 'custom'
        if (!customOrgName.trim()) {
          setError('Tashkilot yoki kompaniya nomini kiriting');
          setLoading(false);
          return;
        }
        const cleanInn = customOrgInn.replace(/\D/g, '').trim();
        if (cleanInn.length !== 9) {
          setError('STIR (INN) aynan 9 ta raqamdan iborat bo‘lishi kerak');
          setLoading(false);
          return;
        }
        const newOrg: OneIDOrganization = {
          inn: cleanInn,
          name: customOrgName.trim(),
          role: customRole.trim() || 'Vakil',
          status: 'Faol',
          is_head: true,
        };
        const updatedOrgs = [...organizations, newOrg];
        payload = {
          account_type: 'company',
          company_name: newOrg.name,
          inn: newOrg.inn,
          role_in_org: newOrg.role,
          organizations: updatedOrgs,
        };
      }

      const res = await api.selectOneIDIdentity(payload);
      if (res.success && res.data) {
        if (res.data.token) {
          setAuthToken(res.data.token);
        }
        const finalUser = res.data.user || loggedInUser;
        setCurrentUser(finalUser);
        onSuccess(finalUser);
        onClose();
      } else {
        setError(res.error || 'Profilni tasdiqlashda xatolik yuz berdi');
      }
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
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp"
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
            <div className="space-y-4 animate-fadeIn">
              {/* Authenticated citizen profile card */}
              <div className="p-3.5 bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-slate-50/90 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-slate-900/40 rounded-2xl border border-blue-200/80 dark:border-blue-900/60 shadow-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    {citizen?.avatar_url ? (
                      <img
                        src={citizen.avatar_url}
                        alt="OneID Photo"
                        className="w-12 h-12 rounded-xl object-cover border-2 border-white dark:border-slate-800 shadow"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[#0047BA] text-white flex items-center justify-center font-bold text-lg shadow">
                        <User size={24} />
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white dark:border-slate-900">
                      <ShieldCheck size={11} />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {citizen?.full_name || loggedInUser?.name || 'OneID Fuqarosi'}
                      </h4>
                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                        OneID Tasdiqlangan
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono flex-wrap mt-0.5">
                      <span>JShShIR: {citizen?.pinfl || loggedInUser?.pinfl || '—'}</span>
                      {citizen?.phone && <span>• Tel: {citizen.phone}</span>}
                      {citizen?.location && <span>• {citizen.location}</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Title & prompt */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Building2 size={15} className="text-[#0047BA]" />
                    <span>Kirish profilini tanlang:</span>
                  </h4>
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                    {organizations.length > 0 ? `${organizations.length} ta tashkilot aniqlandi` : 'Jismoniy shaxs'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  OneID tizimi orqali sizga biriktirilgan yuridik shaxslar ma‘lumotlari tortildi. Tizimga qaysi nomdan kirmoqchisiz?
                </p>
              </div>

              {/* List of identity options */}
              <div className="space-y-2.5 max-h-[38vh] overflow-y-auto pr-1">
                {/* 1. Individual Citizen Option */}
                <div
                  onClick={() => { setSelectedTarget('individual'); setError(null); }}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-3 ${
                    selectedTarget === 'individual'
                      ? 'border-[#0047BA] bg-blue-50/70 dark:bg-blue-950/40 shadow-sm ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    selectedTarget === 'individual'
                      ? 'bg-[#0047BA] text-white shadow'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}>
                    <User size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {citizen?.full_name || loggedInUser?.name || 'Jismoniy shaxs (Fuqaro)'}
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 shrink-0">
                        Nomzod
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Vakansiyalarga rezyume topshirish, ish qidirish va ish beruvchilar bilan shaxsiy muloqot
                    </p>
                    <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-1">
                      JShShIR: {citizen?.pinfl || loggedInUser?.pinfl || '—'}
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                    selectedTarget === 'individual'
                      ? 'border-[#0047BA] bg-[#0047BA] text-white'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {selectedTarget === 'individual' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>

                {/* 2..N: Detected OneID Organizations */}
                {organizations.map((org, idx) => {
                  const isSelected = selectedTarget === idx;
                  return (
                    <div
                      key={org.inn || idx}
                      onClick={() => { setSelectedTarget(idx); setError(null); }}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-3 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-sm ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}>
                        <Building2 size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {org.name}
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 shrink-0">
                            Ish beruvchi
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                          <span className="font-bold text-indigo-700 dark:text-indigo-400 font-mono">
                            STIR: {org.inn}
                          </span>
                          <span>•</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium">
                            {org.role || (org.is_head ? 'Direktor' : 'Vakil')}
                          </span>
                          {org.status && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">{org.status}</span>
                            </>
                          )}
                        </div>
                        {org.address && (
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 truncate">
                            {org.address}
                          </p>
                        )}
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>
                  );
                })}

                {/* N+1: Custom Organization option */}
                <div
                  onClick={() => { setSelectedTarget('custom'); setError(null); }}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-3 ${
                    selectedTarget === 'custom'
                      ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-sm ring-2 ring-indigo-500/20'
                      : 'border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-400'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    selectedTarget === 'custom'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}>
                    <Plus size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        Boshqa tashkilot qo‘shish
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        Yangi
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Ro‘yxatda bo‘lmagan boshqa yuridik shaxs yoki korxona STIRini kiritish
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                    selectedTarget === 'custom'
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {selectedTarget === 'custom' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
              </div>

              {/* If 'custom' is selected, show inputs */}
              {selectedTarget === 'custom' && (
                <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    <Briefcase size={15} />
                    <span>Yangi tashkilot ma‘lumotlari</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Tashkilot / Kompaniya nomi *
                      </label>
                      <input
                        type="text"
                        value={customOrgName}
                        onChange={(e) => setCustomOrgName(e.target.value)}
                        placeholder="Masalan: Najot Ta’lim MCHJ"
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
                        value={customOrgInn}
                        onChange={(e) => setCustomOrgInn(e.target.value.replace(/\D/g, ''))}
                        placeholder="301234567"
                        className="w-full px-3.5 py-2 text-xs sm:text-sm font-mono font-bold rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Confirm button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleFinalizeRole}
                  className="w-full py-3 bg-[#0047BA] hover:bg-[#003B95] text-white text-sm font-black rounded-xl shadow-lg transition flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <span>Saqlanmoqda...</span>
                  ) : (
                    <>
                      <span>Tanlangan profil bilan tizimga kirish</span>
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
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">WZone Yagona Ish Portali</h4>
                    <p className="text-[10px] text-slate-500">Davlat integratsiyasi & id.egov.uz</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck size={14} />
                  <span>Xavfsiz ulanish</span>
                </div>
              </div>

              {/* Sub-tabs: QR vs SSO */}
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setTab('qr')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${
                    tab === 'qr'
                      ? 'bg-white dark:bg-slate-900 text-[#0047BA] dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <QrCode size={15} />
                  <span>OneID Mobile QR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab('sso')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${
                    tab === 'sso'
                      ? 'bg-white dark:bg-slate-900 text-[#0047BA] dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ExternalLink size={15} />
                  <span>id.egov.uz Sayti orqali</span>
                </button>
              </div>

              {tab === 'qr' ? (
                <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
                  {qrStatus === 'waiting' && qrDataUrl ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-white rounded-2xl shadow-md inline-block border border-slate-200">
                        <img
                          src={qrDataUrl}
                          alt="OneID QR Code"
                          className="w-48 h-48 sm:w-56 sm:h-56 mx-auto object-contain rounded-lg"
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          OneID mobil ilovasi orqali QR-kodni skanerlang
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Muddati: <span className="font-bold text-blue-600">{Math.floor(qrCountdown / 60)}:{(qrCountdown % 60).toString().padStart(2, '0')}</span>
                        </p>
                      </div>
                    </div>
                  ) : qrStatus === 'loading' ? (
                    <div className="py-16 space-y-3">
                      <RefreshCw size={32} className="animate-spin text-[#0047BA] mx-auto" />
                      <p className="text-xs text-slate-500">OneID xavfsiz QR sessiyasi yaratilmoqda...</p>
                    </div>
                  ) : qrStatus === 'expired' ? (
                    <div className="py-12 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                        <AlertCircle size={24} />
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">QR-kod muddati tugadi</p>
                      <button
                        type="button"
                        onClick={generateQrSession}
                        className="px-4 py-2 bg-[#0047BA] text-white text-xs font-bold rounded-xl shadow transition"
                      >
                        Qayta yaratish
                      </button>
                    </div>
                  ) : qrStatus === 'approved' ? (
                    <div className="py-10 space-y-3 text-center animate-fadeIn">
                      <CheckCircle2 size={44} className="mx-auto text-emerald-600 animate-bounce" />
                      <div className="space-y-1">
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">Tasdiqlandi!</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Hisob ma‘lumotlari yuklanmoqda...</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep('role_select')}
                        className="px-5 py-2.5 bg-[#0047BA] hover:bg-[#003B95] text-white text-xs font-bold rounded-xl shadow transition inline-flex items-center gap-1.5 cursor-pointer mt-2"
                      >
                        <span>Davom etish</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="p-6 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/60 text-[#0047BA] dark:text-blue-400 flex items-center justify-center mx-auto shadow-inner">
                    <ExternalLink size={28} />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      id.egov.uz Yagona Identifikatsiya Tizimi
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      Rasmiy davlat portali orqali login/parol yoki E-IMZO (ERI) kalitingiz bilan kiring.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleLaunchSSO}
                    className="w-full py-3 bg-[#0047BA] hover:bg-[#003B95] text-white text-xs sm:text-sm font-black rounded-xl shadow-lg transition flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
                  >
                    {loading ? (
                      <span>Ulanmoqda...</span>
                    ) : (
                      <>
                        <span>id.egov.uz orqali kirish</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
