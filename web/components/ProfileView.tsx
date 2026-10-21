'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  ShieldCheck,
  Mail,
  Save,
  Sparkles,
  CheckCircle2,
  Camera,
  Upload,
  MapPin,
  Phone,
  Briefcase,
  Building2,
  Globe,
  AlertCircle,
  FileText,
  Plus,
  Trash2,
  Moon,
  Sun,
  Laptop,
  Bell,
  Lock,
  LogOut,
  Check,
  Code2,
  Layers,
  Settings,
  Award,
  Zap,
  Clock,
  ExternalLink,
  Download,
  X,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { api, getCurrentUser, setCurrentUser, setAuthToken } from '../lib/api';
import { OneIDOrganization } from './OneIDPortalModal';
import { downloadResumeAsPDF } from '../lib/resumePdf';
import { Language, translations } from '../lib/translations';
import FlagIcon from './FlagIcon';

interface ProfileViewProps {
  user: any;
  onUserUpdated: (u: any) => void;
  lang?: Language;
  onLanguageChange?: (lang: Language) => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  themeMode?: 'system' | 'light' | 'dark';
  onSelectTheme?: (mode: 'system' | 'light' | 'dark') => void;
  onOpenCreateResume?: () => void;
  resumes?: any[];
  onRefreshResumes?: () => void;
  onLogout?: () => void;
}

const REGIONS = [
  'Toshkent shahri',
  'Toshkent viloyati',
  'Samarqand viloyati',
  'Farg‘ona viloyati',
  'Andijon viloyati',
  'Namangan viloyati',
  'Buxoro viloyati',
  'Xorazm viloyati',
  'Qashqadaryo viloyati',
  'Surxondaryo viloyati',
  'Jizzax viloyati',
  'Sirdaryo viloyati',
  'Navoiy viloyati',
  'Qoraqalpog‘iston Respublikasi',
  'Masofaviy (Remote)',
];

const POPULAR_SKILLS = [
  'Go (Golang)',
  'TypeScript',
  'React.js',
  'Next.js',
  'PostgreSQL',
  'Docker',
  'Kubernetes',
  'Python',
  'Flutter',
  'Node.js',
  'Redis',
  'Tailwind CSS',
  'Git',
  'Linux',
];

function parsePINFL(pinfl: string) {
  const clean = (pinfl || '').replace(/\D/g, '');
  if (clean.length !== 14) return null;
  const first = clean[0];
  const gender = ['1', '3', '5'].includes(first) ? 'Erkak' : 'Ayol';
  const yearPrefix = ['1', '2'].includes(first) ? '18' : ['5', '6'].includes(first) ? '20' : '19';
  const birthDate = `${clean.substring(1, 3)}.${clean.substring(3, 5)}.${yearPrefix}${clean.substring(5, 7)}`;
  const regCode = clean.substring(7, 9);
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
  return { gender, birthDate, region: regions[regCode] || 'O‘zbekiston' };
}

export default function ProfileView({
  user,
  onUserUpdated,
  lang = 'uz',
  onLanguageChange,
  darkMode = false,
  onToggleDarkMode,
  themeMode = 'system',
  onSelectTheme,
  onOpenCreateResume,
  resumes = [],
  onRefreshResumes,
  onLogout,
}: ProfileViewProps) {
  const t = translations[lang] || translations.uz;

  const isCompany = user?.account_type === 'company';

  // Active top-level subtab: Rezyumelar, Shaxsiy ma'lumotlar, Sozlamalar
  const [activeSection, setActiveSection] = useState<'resumes-skills' | 'personal' | 'settings'>(
    user?.account_type === 'company' ? 'personal' : 'resumes-skills'
  );

  useEffect(() => {
    if (user?.account_type === 'company' && activeSection === 'resumes-skills') {
      setActiveSection('personal');
    }
  }, [user?.account_type, activeSection]);

  // Personal Info Form
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('Toshkent shahri');
  const [website, setWebsite] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');

  // Skills Management
  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Middle (2-4 yil)');

  // Notification Preferences
  const [notifyJobAlerts, setNotifyJobAlerts] = useState(true);
  const [notifyAppStatus, setNotifyAppStatus] = useState(true);
  const [notifyChatMessages, setNotifyChatMessages] = useState(true);
  const [notifyTelegram, setNotifyTelegram] = useState(false);

  // Privacy Preferences
  const [profilePublic, setProfilePublic] = useState(true);
  const [phoneVerifiedOnly, setPhoneVerifiedOnly] = useState(true);

  // States
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [personalSavedSuccess, setPersonalSavedSuccess] = useState(false);
  const [settingsSavedSuccess, setSettingsSavedSuccess] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [skillsSavedSuccess, setSkillsSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  // Role / Account Type switch modal state
  const [showRoleSwitchModal, setShowRoleSwitchModal] = useState(false);
  const [switchLoading, setSwitchLoading] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [switchSuccess, setSwitchSuccess] = useState(false);

  // OneID Organizations state
  const [organizations, setOrganizations] = useState<OneIDOrganization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [selectedOrgTarget, setSelectedOrgTarget] = useState<'individual' | number | 'custom'>('individual');
  const [customOrgName, setCustomOrgName] = useState('');
  const [customOrgInn, setCustomOrgInn] = useState('');
  const [customOrgRole, setCustomOrgRole] = useState('Rahbar / Vakil');

  const fetchOrganizations = async () => {
    if (!user || user.auth_provider !== 'oneid') return;
    setLoadingOrgs(true);
    try {
      const res = await api.getOneIDOrganizations();
      if (res.success && res.data?.organizations) {
        setOrganizations(res.data.organizations);
      }
    } catch (e) {
      console.warn('OneID tashkilotlarini yuklashda xatolik', e);
    } finally {
      setLoadingOrgs(false);
    }
  };

  useEffect(() => {
    if (user) {
      if (user.account_type === 'company') {
        const foundIdx = organizations.findIndex((o) => o.inn === user.inn);
        if (foundIdx >= 0) {
          setSelectedOrgTarget(foundIdx);
        } else if (user.company_name) {
          setSelectedOrgTarget('custom');
          setCustomOrgName(user.company_name || '');
          setCustomOrgInn(user.inn || '');
        }
      } else {
        setSelectedOrgTarget('individual');
      }
    }
  }, [user?.account_type, user?.company_name, user?.inn, organizations]);

  const handleSelectIdentity = async (
    target: 'individual' | OneIDOrganization | { name: string; inn: string; role?: string }
  ) => {
    setSwitchLoading(true);
    setSwitchError(null);
    try {
      let payload: {
        account_type: 'individual' | 'company';
        company_name?: string;
        inn?: string;
        role_in_org?: string;
        organizations?: OneIDOrganization[];
      };

      if (target === 'individual') {
        payload = {
          account_type: 'individual',
          organizations,
        };
      } else {
        const orgName = (target as any).name?.trim();
        const orgInn = (target as any).inn?.replace(/\D/g, '').trim();
        const orgRole = (target as any).role || 'Rahbar';
        if (!orgName) {
          setSwitchError('Tashkilot yoki kompaniya nomini kiriting');
          setSwitchLoading(false);
          return;
        }
        if (orgInn.length !== 9) {
          setSwitchError('STIR (INN) aynan 9 ta raqamdan iborat bo‘lishi kerak');
          setSwitchLoading(false);
          return;
        }
        let updatedOrgs = [...organizations];
        if (!updatedOrgs.some((o) => o.inn === orgInn)) {
          updatedOrgs.push({
            inn: orgInn,
            name: orgName,
            role: orgRole,
            status: 'Faol',
            is_head: true,
          });
          setOrganizations(updatedOrgs);
        }
        payload = {
          account_type: 'company',
          company_name: orgName,
          inn: orgInn,
          role_in_org: orgRole,
          organizations: updatedOrgs,
        };
      }

      const res = await api.selectOneIDIdentity(payload);
      if (res.success && res.data) {
        if (res.data.token) {
          setAuthToken(res.data.token);
        }
        const updated = res.data.user || {
          ...user,
          name: payload.account_type === 'company' ? payload.company_name : user.name,
          account_type: payload.account_type,
          company_name: payload.company_name || '',
          inn: payload.inn || '',
          role: payload.account_type === 'company' ? 'employer' : 'user',
        };
        setCurrentUser(updated);
        onUserUpdated(updated);
        setSwitchSuccess(true);
        setTimeout(() => {
          setSwitchSuccess(false);
          setShowRoleSwitchModal(false);
        }, 600);
      } else {
        setSwitchError(res.error || 'Hisob turini almashtirishda xatolik yuz berdi');
      }
    } catch (err: any) {
      setSwitchError(err.message || 'Server xatosi');
    } finally {
      setSwitchLoading(false);
    }
  };

  const handleSwitchAccountType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOrgTarget === 'individual') {
      await handleSelectIdentity('individual');
    } else if (typeof selectedOrgTarget === 'number') {
      const org = organizations[selectedOrgTarget];
      if (org) {
        await handleSelectIdentity(org);
      } else {
        setSwitchError('Tashkilot tanlanmadi');
      }
    } else {
      await handleSelectIdentity({
        name: customOrgName.trim(),
        inn: customOrgInn.trim(),
        role: customOrgRole.trim(),
      });
    }
  };

  useEffect(() => {
    if (user?.name) setName(user.name);
    if (user?.email) setEmail(user.email);
    if (user?.avatar_url) setAvatarUrl(user.avatar_url);
  }, [user?.name, user?.email, user?.avatar_url]);

  useEffect(() => {
    async function loadProfile() {
      if (user) {
        const res = await api.getProfile();
        if (res.success && res.data?.profile) {
          const p = res.data.profile;
          setBio(p.bio || '');
          setPhone(p.phone || '');
          if (p.location) setLocation(p.location);
          if (p.website) setWebsite(p.website);
          if (p.avatar_url) setAvatarUrl(p.avatar_url);

          setSkillsList(
            (p.skills || '')
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean)
          );

          // Settings are stored server-side; switches missing from the profile stay on their defaults
          const st = p.settings || {};
          if (Array.isArray(st.organizations) && st.organizations.length > 0) {
            setOrganizations(st.organizations);
          } else if (user.auth_provider === 'oneid') {
            fetchOrganizations();
          }

          if (typeof st.notify_job_alerts === 'boolean') setNotifyJobAlerts(st.notify_job_alerts);
          if (typeof st.notify_app_status === 'boolean') setNotifyAppStatus(st.notify_app_status);
          if (typeof st.notify_chat_messages === 'boolean') setNotifyChatMessages(st.notify_chat_messages);
          if (typeof st.notify_telegram === 'boolean') setNotifyTelegram(st.notify_telegram);
          if (typeof st.profile_public === 'boolean') setProfilePublic(st.profile_public);
          if (typeof st.phone_verified_only === 'boolean') setPhoneVerifiedOnly(st.phone_verified_only);
        } else {
          setSkillsList([]);
        }
      }
    }
    loadProfile();
  }, [user]);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setErrorMessage(null);

    try {
      const res = await api.uploadAvatar(file);
      if (res.success && res.data?.avatar_url) {
        const newAvatar = res.data.avatar_url;
        setAvatarUrl(newAvatar);
        const updated = { ...user, avatar_url: newAvatar };
        setCurrentUser(updated);
        onUserUpdated(updated);
      } else {
        setErrorMessage(res.error || 'Rasmni yuklashda xatolik');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Serverga rasm yuklashda xatolik');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAddSkill = (skillToAdd: string) => {
    const trimmed = skillToAdd.trim();
    if (!trimmed) return;
    if (!skillsList.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setSkillsList([...skillsList, trimmed]);
    }
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkillsList(skillsList.filter((s) => s !== skillToRemove));
  };

  const handleSaveSkills = async () => {
    setLoading(true);
    setSkillsSavedSuccess(false);
    setErrorMessage(null);

    try {
      const res = await api.updateProfile({
        skills: skillsList.join(', '),
      });
      if (res.success) {
        setSkillsSavedSuccess(true);
        setTimeout(() => setSkillsSavedSuccess(false), 3000);
      } else {
        setErrorMessage(res.error || 'Ko‘nikmalarni saqlashda xatolik');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Server xatosi');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPersonalSavedSuccess(false);
    setErrorMessage(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    if (!cleanName) {
      setErrorMessage(
        lang === 'ru'
          ? 'Введите ваше Ф.И.О'
          : lang === 'en'
          ? 'Please enter your full name'
          : 'To‘liq ism-sharifingiz (F.I.O) maydonini to‘ldiring'
      );
      setLoading(false);
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage(
        lang === 'ru'
          ? 'Введите корректный email'
          : lang === 'en'
          ? 'Please enter a valid email address'
          : 'Haqiqiy email manzilingizni to‘g‘ri kiriting'
      );
      setLoading(false);
      return;
    }

    try {
      const updateData: any = {
        name: cleanName,
        email: cleanEmail,
        bio,
        skills: skillsList.join(', '),
        phone,
        location,
        website,
        avatar_url: avatarUrl,
      };
      if (user.account_type === 'company') {
        updateData.company_name = cleanName;
      }
      const res = await api.updateProfile(updateData);

      if (res.success) {
        setPersonalSavedSuccess(true);
        const updated = (res.data as any)?.user || {
          ...user,
          name: cleanName,
          company_name: user.account_type === 'company' ? cleanName : user.company_name,
          email: cleanEmail,
          avatar_url: avatarUrl,
        };
        setCurrentUser(updated);
        onUserUpdated(updated);
        setTimeout(() => setPersonalSavedSuccess(false), 3500);
      } else {
        setErrorMessage(
          res.error ||
            (lang === 'ru'
              ? 'Ошибка при сохранении данных'
              : lang === 'en'
              ? 'Error saving personal information'
              : 'Shaxsiy ma’lumotlarni saqlashda xatolik')
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Server xatosi');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSettingsSavedSuccess(false);
    setErrorMessage(null);

    try {
      const res = await api.updateProfile({
        settings: {
          notify_job_alerts: notifyJobAlerts,
          notify_app_status: notifyAppStatus,
          notify_chat_messages: notifyChatMessages,
          notify_telegram: notifyTelegram,
          profile_public: profilePublic,
          phone_verified_only: phoneVerifiedOnly,
        },
      });
      if (!res.success) {
        setErrorMessage(res.error || 'Server xatosi');
        return;
      }
      setSettingsSavedSuccess(true);
      setTimeout(() => setSettingsSavedSuccess(false), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Server xatosi');
    } finally {
      setLoading(false);
    }
  };

  // Filter user's resumes
  const userResumes = (resumes || []).filter(
    (r) => r.user_id === user?.id || (user?.email && r.email === user.email)
  );

  // Compute profile completeness
  const completeness = [
    Boolean(user?.name),
    Boolean(user?.avatar_url),
    Boolean(phone),
    skillsList.length > 0,
    Boolean(bio),
    userResumes.length > 0,
  ].filter(Boolean).length;
  const completenessPercent = Math.round((completeness / 6) * 100);

  if (!user) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <User size={44} className="mx-auto text-slate-400 mb-3" />
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
          Profilingizni ko‘rish uchun avval tizimga kiring
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          OneID yoki Google hisobingiz orqali 1 klikda tizimga kiring
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header Banner */}
      <div className="bg-white dark:bg-slate-900/90 backdrop-blur rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar with Camera Overlay */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-500 text-white font-black text-3xl flex items-center justify-center overflow-hidden shadow-xl shadow-blue-500/25 border-4 border-white dark:border-slate-800">
              {avatarUrl ? (
                <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name?.[0]?.toUpperCase() || 'U'
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Profil rasmini o‘zgartirish"
              className="absolute inset-0 bg-slate-950/70 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer"
            >
              <Camera size={22} className="mb-0.5" />
              <span>{uploadingAvatar ? '...' : 'Yuklash'}</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* User Details & Completeness */}
          <div className="text-center sm:text-left flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {user.account_type === 'company' && user.company_name ? user.company_name : user.name}
              </h2>
              {user.auth_provider === 'oneid' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-xs">
                  <ShieldCheck size={14} className="text-blue-600 dark:text-blue-400" />
                  <span>{t.oneIdVerifiedBadge}</span>
                </span>
              )}
              {user.account_type === 'company' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-xs">
                  <Building2 size={13} className="text-indigo-600 dark:text-indigo-400" />
                  <span>Yuridik shaxs{user.company_name ? `: ${user.company_name}` : ''}</span>
                </span>
              )}
              {user.auth_provider === 'oneid' && (user.account_type === 'individual' || !user.account_type) && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs">
                  <User size={13} className="text-slate-500" />
                  <span>Oddiy shaxs</span>
                </span>
              )}
              {user.auth_provider === 'oneid' && (
                <button
                  type="button"
                  onClick={() => {
                    if (user.account_type === 'company') {
                      const idx = organizations.findIndex((o) => o.inn === user.inn);
                      if (idx >= 0) setSelectedOrgTarget(idx);
                      else {
                        setSelectedOrgTarget('custom');
                        setCustomOrgName(user.company_name || '');
                        setCustomOrgInn(user.inn || '');
                      }
                    } else {
                      setSelectedOrgTarget('individual');
                    }
                    setSwitchError(null);
                    setShowRoleSwitchModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition shadow-xs cursor-pointer active:scale-95"
                  title="Hisob turini (Oddiy shaxs / Yuridik shaxs) almashtirish"
                >
                  <RefreshCw size={12} className="text-blue-600 dark:text-blue-400" />
                  <span>Almashtirish</span>
                </button>
              )}
              {user.auth_provider === 'google' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950 text-red-600 border border-red-200">
                  Google SSO
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1.5">
              <span className="flex items-center gap-1.5">
                <Mail size={14} /> {email || user.email}
              </span>
              {phone && (
                <span className="flex items-center gap-1.5">
                  <Phone size={14} /> {phone}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <MapPin size={14} /> {location}
              </span>
            </div>

            {/* Profile Completeness Bar */}
            <div className="mt-4 max-w-md">
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" /> {t.profileCompleteness}
                </span>
                <span className="text-blue-600 dark:text-blue-400 font-extrabold">
                  {completenessPercent}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${completenessPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Primary Sub-Nav */}
        <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-800/80">
          <div className={`grid ${isCompany ? 'grid-cols-2' : 'grid-cols-3'} gap-1.5 sm:gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full`}>
            {/* 1. Rezyumelar & Skillar (Only for candidates, hidden for companies) */}
            {!isCompany && (
              <button
                type="button"
                onClick={() => setActiveSection('resumes-skills')}
                className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                  activeSection === 'resumes-skills'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileText size={16} className="shrink-0" />
                <span className="truncate">{t.profileSubResumesSkills}</span>
                {userResumes.length > 0 && (
                  <span
                    className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      activeSection === 'resumes-skills'
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {userResumes.length}
                  </span>
                )}
              </button>
            )}

            {/* 2. Shaxsiy ma'lumotlar / Tashkilot rekvizitlari */}
            <button
              type="button"
              onClick={() => setActiveSection('personal')}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                activeSection === 'personal'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isCompany ? <Building2 size={16} className="shrink-0" /> : <User size={16} className="shrink-0" />}
              <span className="truncate">{isCompany ? 'Tashkilot ma’lumotlari' : t.profileSubPersonal}</span>
            </button>

            {/* 3. Sozlamalar */}
            <button
              type="button"
              onClick={() => setActiveSection('settings')}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                activeSection === 'settings'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Settings size={16} className="shrink-0" />
              <span className="truncate">{t.profileSubSettings}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Alerts */}
      {personalSavedSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center gap-2.5 text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-300 animate-fadeIn shadow-sm">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
          <span>{t.profilePersonalSaved}</span>
        </div>
      )}

      {settingsSavedSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center gap-2.5 text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-300 animate-fadeIn shadow-sm">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
          <span>{t.profileSettingsSaved}</span>
        </div>
      )}

      {skillsSavedSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center gap-2.5 text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-300 animate-fadeIn shadow-sm">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
          <span>{t.profileSkillsUpdated}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 rounded-2xl flex items-center gap-2.5 text-xs sm:text-sm font-bold text-red-800 dark:text-red-300 animate-fadeIn shadow-sm">
          <AlertCircle size={18} className="shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1-CHI BO'LIM: REZYUMELAR VA SKILLAR (PRIMARY SECTION)     */}
      {/* ======================================================== */}
      {activeSection === 'resumes-skills' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Section 1.1: User's Resumes List */}
          <div className="bg-white dark:bg-slate-900/90 backdrop-blur rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="text-blue-600" size={20} />
                  <span>{t.profileMyResumesTitle}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.profileMyResumesDesc}
                </p>
              </div>

              {onOpenCreateResume && (
                <button
                  onClick={onOpenCreateResume}
                  className="px-3.5 py-2 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Plus size={15} />
                  <span>{t.createResume}</span>
                </button>
              )}
            </div>

            {userResumes.length === 0 ? (
              <div className="p-8 sm:p-10 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-100/80 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-sm">
                  <FileText size={28} />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    {t.profileNoResumesTitle}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                    {t.profileNoResumesDesc}
                  </p>
                </div>
                {onOpenCreateResume && (
                  <button
                    onClick={onOpenCreateResume}
                    className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/25 transition cursor-pointer"
                  >
                    <Sparkles size={16} className="text-amber-300" />
                    <span>{t.profileCreateResumeWithAI}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userResumes.map((resume: any) => (
                  <div
                    key={resume.id}
                    className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between hover:border-blue-400 dark:hover:border-blue-600 transition group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                            <FileText size={18} />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 transition">
                              {resume.title}
                            </h4>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Clock size={12} />
                              {resume.created_at ? new Date(resume.created_at).toLocaleDateString('uz-UZ') : 'Yaqinda'}
                            </p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold">
                          Faol
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed font-normal">
                        {resume.summary || 'Kasbiy tajriba va asosiy ko‘nikmalar tafsiloti.'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        {resume.file_url && (
                          <a
                            href={resume.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
                          >
                            <ExternalLink size={13} />
                            <span>Fayl</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            downloadResumeAsPDF({
                              title: resume.title,
                              fullName: user.name,
                              phone: user.phone,
                              email: user.email,
                              location: user.location,
                              summary: resume.summary,
                            })
                          }
                          className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Download size={13} />
                          <span>PDF yuklab olish</span>
                        </button>
                      </div>

                      <span className="text-[11px] font-bold text-slate-500">
                        {user.account_type === 'company' && user.company_name ? user.company_name : user.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 1.2: Skills Management & Interactive Tags */}
          <div className="bg-white dark:bg-slate-900/90 backdrop-blur rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Code2 className="text-indigo-600" size={20} />
                  <span>{t.profileSkillsExpTitle}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Ko‘nikmalaringiz qanchalik to‘liq bo‘lsa, tizim sizga shunchalik mos vakansiyalarni tavsiya qiladi
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">{t.profileExpLevel}</span>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Junior (0-1 yil)">{t.expJunior}</option>
                  <option value="Middle (2-4 yil)">{t.expMiddle}</option>
                  <option value="Senior (5+ yil)">{t.expSenior}</option>
                  <option value="Lead / Architect (7+ yil)">{t.expLead}</option>
                </select>
              </div>
            </div>

            {/* Active Skill Chips */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Faol ko‘nikmalaringiz ({skillsList.length} ta):
              </label>
              <div className="flex flex-wrap gap-2 min-h-[44px] p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                {skillsList.length === 0 ? (
                  <span className="text-xs text-slate-400 font-medium">
                    Hozircha ko‘nikmalar kiritilmagan. Quyidan tanlang yoki o‘zingiz yozing.
                  </span>
                ) : (
                  skillsList.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-100/90 dark:bg-blue-950 text-blue-800 dark:text-blue-200 font-bold text-xs border border-blue-200 dark:border-blue-800 shadow-xs animate-fadeIn"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="w-4 h-4 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs transition"
                        title={`${skill} ko‘nikmasini o‘chirish`}
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Add Custom Skill */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Yangi ko‘nikma yozing (masalan: Docker, Swift, Flutter, Spring Boot)..."
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill(newSkillInput);
                  }
                }}
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => handleAddSkill(newSkillInput)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={16} />
                <span>+</span>
              </button>
            </div>

            {/* Popular Suggestions */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                {t.profilePopularSkillsTitle}
              </span>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SKILLS.map((item) => {
                  const alreadyAdded = skillsList.some(
                    (s) => s.toLowerCase() === item.toLowerCase()
                  );
                  return (
                    <button
                      key={item}
                      type="button"
                      disabled={alreadyAdded}
                      onClick={() => handleAddSkill(item)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                        alreadyAdded
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-60 cursor-default'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700'
                      }`}
                    >
                      {alreadyAdded ? <Check size={12} /> : <Plus size={12} />}
                      <span>{item}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI Resume Matcher Insight Widget */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-blue-50/80 to-purple-50/70 dark:from-indigo-950/40 dark:via-blue-950/30 dark:to-purple-950/30 border border-indigo-200/70 dark:border-indigo-900/50 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-extrabold text-xs sm:text-sm">
                  <Sparkles size={16} className="text-amber-500" />
                  <span>WZone AI Match</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black text-xs">
                  {skillsList.length >= 4 ? '94%' : '65%'}
                </span>
              </div>
            </div>

            {/* Save Skills Button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveSkills}
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-500/25 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Save size={16} />
                <span>{loading ? '...' : t.profileSaveSkillsBtn}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2-CHI BO'LIM: SHAXSIY MA'LUMOTLAR                         */}
      {/* ======================================================== */}
      {activeSection === 'personal' && (
        <form onSubmit={handleSavePersonalInfo} className="space-y-6 animate-fadeIn">
          {/* OneID Verification Banner if applicable */}
          {user.auth_provider === 'oneid' && (() => {
            const pinflData = parsePINFL(user.pinfl || '');
            return (
              <div className="p-5 bg-gradient-to-r from-blue-50 via-indigo-50/70 to-slate-50 dark:from-blue-950/40 dark:via-indigo-950/20 dark:to-slate-900 border border-blue-200 dark:border-blue-800 rounded-3xl space-y-3 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-blue-100 dark:border-blue-900/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md">
                      ID
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-extrabold text-blue-950 dark:text-blue-100">
                          OneID Yagona Identifikatsiya Tizimi bilan tasdiqlangan
                        </h4>
                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded text-[10px] font-bold">
                          Davlat reestri
                        </span>
                      </div>
                      <p className="text-[11px] text-blue-800 dark:text-blue-300/80 mt-0.5">
                        Barcha shaxsiy pasport va fuqarolik ma’lumotlari OneID tizimidan avtomatik yuklandi
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800 dark:text-blue-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-700 shadow-sm shrink-0">
                    <ShieldCheck size={16} className="text-emerald-500" />
                    <span>{t.profileOfficialVerified}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-0.5 text-xs">
                  <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/40 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Hisob turi</span>
                      <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {user.account_type === 'company' ? (
                          <>
                            <Building2 size={13} className="text-indigo-600 shrink-0" />
                            <span>Yuridik shaxs</span>
                          </>
                        ) : (
                          <>
                            <User size={13} className="text-blue-600 shrink-0" />
                            <span>Oddiy shaxs</span>
                          </>
                        )}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (user.account_type === 'company') {
                          const idx = organizations.findIndex((o) => o.inn === user.inn);
                          if (idx >= 0) setSelectedOrgTarget(idx);
                          else {
                            setSelectedOrgTarget('custom');
                            setCustomOrgName(user.company_name || '');
                            setCustomOrgInn(user.inn || '');
                          }
                        } else {
                          setSelectedOrgTarget('individual');
                        }
                        setSwitchError(null);
                        setShowRoleSwitchModal(true);
                      }}
                      className="px-2 py-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-lg border border-blue-200 dark:border-blue-800/60 transition flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw size={11} />
                      <span>Almashtirish</span>
                    </button>
                  </div>
                  <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">{t.profilePinfl}</span>
                    <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400 text-sm tracking-wider">{user.pinfl || '—'}</span>
                  </div>
                  <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">{t.profileBirthGender}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {pinflData ? `${pinflData.birthDate} (${pinflData.gender})` : 'Davlat reestridan tasdiqlangan'}
                    </span>
                  </div>
                  {user.account_type === 'company' && (
                    <div className="bg-indigo-50/80 dark:bg-indigo-950/50 p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 col-span-1 sm:col-span-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Building2 size={15} className="text-indigo-600 dark:text-indigo-400" />
                        <span className="font-bold text-xs text-indigo-950 dark:text-indigo-100">
                          Tashkilot: {user.company_name || 'Kompaniya'}
                        </span>
                      </div>
                      {user.inn && (
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          STIR (INN): {user.inn}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* OneID Connected Organizations Card */}
          {user.auth_provider === 'oneid' && (
            <div className="bg-gradient-to-br from-indigo-50/90 via-sky-50/50 to-white dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900 rounded-3xl border border-indigo-200/80 dark:border-indigo-900/60 p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>OneID orqali biriktirilgan tashkilotlar</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-black">
                        {organizations.length} ta
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      OneID orqali aniqlangan yuridik shaxslaringiz. Istalgan tashkilot nomidan ish beruvchi sifatida kirishingiz mumkin.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fetchOrganizations}
                    disabled={loadingOrgs}
                    className="px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="OneID tashkilotlarini qayta yangilash"
                  >
                    <RefreshCw size={13} className={loadingOrgs ? 'animate-spin' : ''} />
                    <span>{loadingOrgs ? 'Yuklanmoqda...' : 'Yangilash'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRoleSwitchModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Tashkilot boshqaruvi</span>
                  </button>
                </div>
              </div>

              {/* Individual (Candidate) Mode Card */}
              <div
                className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                  user.account_type !== 'company'
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-500/20'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      user.account_type !== 'company'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <User size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                        Jismoniy shaxs (Fuqaro / Nomzod)
                      </span>
                      {user.account_type !== 'company' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shrink-0">
                          Hozirda faol
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                      Rezyume joylash, vakansiyalarga ariza topshirish
                    </span>
                  </div>
                </div>
                {user.account_type === 'company' && (
                  <button
                    type="button"
                    disabled={switchLoading}
                    onClick={() => handleSelectIdentity('individual')}
                    className="px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-xs font-bold transition shrink-0 cursor-pointer active:scale-95"
                  >
                    O‘tish
                  </button>
                )}
              </div>

              {/* Organization Cards List */}
              {organizations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {organizations.map((org, idx) => {
                    const isActive = user.account_type === 'company' && user.inn === org.inn;
                    return (
                      <div
                        key={`${org.inn}-${idx}`}
                        className={`p-3.5 rounded-2xl border transition flex flex-col justify-between gap-2.5 ${
                          isActive
                            ? 'bg-blue-50/90 dark:bg-blue-950/50 border-blue-400 dark:border-blue-700 ring-2 ring-blue-500/20'
                            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-blue-200'
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white leading-snug line-clamp-2">
                              {org.name}
                            </span>
                            {isActive ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white shrink-0">
                                Faol tashkilot
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                                {org.role || 'Rahbar'}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                            <span className="font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                              STIR: {org.inn}
                            </span>
                            {org.status && (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                ● {org.status}
                              </span>
                            )}
                          </div>
                          {org.address && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate pt-0.5">
                              {org.address}
                            </p>
                          )}
                        </div>
                        <div className="pt-1 flex items-center justify-end">
                          {isActive ? (
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                              <CheckCircle2 size={14} />
                              <span>Tanlangan rejim</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={switchLoading}
                              onClick={() => handleSelectIdentity(org)}
                              className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                            >
                              <span>Tashkilot sifatida kirish</span>
                              <ArrowRight size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-1">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    OneID tizimidan biriktirilgan tashkilotlar topilmadi
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Agar siz korxona rahbari yoki ta’sischisi bo‘lsangiz, «Tashkilot boshqaruvi» orqali STIR kiritib qo‘shishingiz mumkin.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Sub-Section 2.1: Personal Form */}
          <div className="bg-white dark:bg-slate-900/90 backdrop-blur rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
              <User size={18} className="text-blue-600" />
              <span>{t.profilePersonalData}</span>
            </h3>

            {/* Quick avatar photo change in Personal Info */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-center gap-3.5 mb-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white font-black text-xl flex items-center justify-center overflow-hidden shadow-md shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name?.[0]?.toUpperCase() || 'U'
                )}
              </div>
              <div className="flex-1 text-center sm:text-left min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Profil rasmi
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {user.name} fotosurati
                </span>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
              >
                <Camera size={14} className="text-blue-600 dark:text-blue-400" />
                <span>{uploadingAvatar ? 'Yuklanmoqda...' : 'Rasmni almashtirish'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  {user.account_type === 'company'
                    ? 'Tashkilot / Kompaniya nomi *'
                    : 'To‘liq ism-sharifingiz (F.I.O) *'}
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  required
                  placeholder={
                    user.account_type === 'company'
                      ? 'Masalan: Najot Ta’lim MCHJ'
                      : 'Masalan: Yusuf Usmonov'
                  }
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Email manzilingiz *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-slate-400" size={15} />
                  <input
                    type="email"
                    required
                    placeholder="nomingiz@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  {t.phone}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-slate-400" size={15} />
                  <input
                    type="text"
                    placeholder="+998 90 123 45 67"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  {t.location}
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-slate-400" size={15} />
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  >
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Portfolio / GitHub / Telegram
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="https://github.com/..."
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                {t.bio}
              </label>
              <textarea
                rows={3}
                placeholder="O‘zingizning ish tajribangiz, maqsadlaringiz va yutuqlaringiz haqida qisqacha yozing..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-3 text-xs sm:text-sm font-normal rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white leading-relaxed"
              />
            </div>

            {/* Form Save Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-7 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-xl shadow-blue-500/25 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Save size={17} />
                <span>{loading ? '...' : t.profileSavePersonalBtn}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* 3-CHI BO'LIM: SOZLAMALAR                                 */}
      {/* ======================================================== */}
      {activeSection === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6 animate-fadeIn">
          {/* Sub-Section 3.1: Site Preferences (Theme, Language) */}
          <div className="bg-white dark:bg-slate-900/90 backdrop-blur rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-5">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Sun size={18} className="text-amber-500" />
              <span>{t.profileSiteThemeTitle}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Language Selector */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    {t.profileInterfaceLangLabel}
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {t.profileInterfaceLangDesc}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {(['uz', 'ru', 'en'] as Language[]).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => onLanguageChange && onLanguageChange(l)}
                      className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        lang === l
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      <FlagIcon lang={l} className="w-4 h-3" />
                      <span>{l === 'uz' ? 'O‘zbekcha' : l === 'ru' ? 'Русский' : 'English'}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Selector (Light, Dark, System Adaptive) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 block">
                    {t.profileThemeLabel}
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {themeMode === 'system' ? t.themeSystemDesc : t.profileThemeDesc}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectTheme ? onSelectTheme('light') : onToggleDarkMode?.()}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      themeMode === 'light'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200/80 dark:border-slate-600'
                    }`}
                  >
                    <Sun size={15} className={themeMode === 'light' ? 'text-white' : 'text-amber-500'} />
                    <span>{t.themeLight}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectTheme ? onSelectTheme('dark') : onToggleDarkMode?.()}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      themeMode === 'dark'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200/80 dark:border-slate-600'
                    }`}
                  >
                    <Moon size={15} className={themeMode === 'dark' ? 'text-white' : 'text-blue-400'} />
                    <span>{t.themeDark}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectTheme ? onSelectTheme('system') : onToggleDarkMode?.()}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      themeMode === 'system'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200/80 dark:border-slate-600'
                    }`}
                  >
                    <Laptop size={15} className={themeMode === 'system' ? 'text-white' : 'text-slate-400'} />
                    <span>{t.themeSystem}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-Section 2.3: Notifications Preferences */}
          <div className="bg-white dark:bg-slate-900/90 backdrop-blur rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell size={18} className="text-blue-600" />
              <span>{t.profileNotificationsTitle}</span>
            </h3>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    {t.profileNotifyJobsLabel}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {t.profileNotifyJobsDesc}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyJobAlerts}
                  onChange={(e) => setNotifyJobAlerts(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    {t.profileNotifyAppStatusLabel}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {t.profileNotifyAppStatusDesc}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyAppStatus}
                  onChange={(e) => setNotifyAppStatus(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    {t.profileNotifyChatLabel}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {t.profileNotifyChatDesc}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyChatMessages}
                  onChange={(e) => setNotifyChatMessages(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Telegram Bot integratsiyasi (@WZoneUzBot)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Barcha tezkor ogohlantirishlarni shaxsiy Telegram orqali olish
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyTelegram}
                  onChange={(e) => setNotifyTelegram(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Sub-Section 2.4: Privacy & Account Security */}
          <div className="bg-white dark:bg-slate-900/90 backdrop-blur rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock size={18} className="text-emerald-600" />
              <span>{t.profilePrivacySecurity}</span>
            </h3>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Profilni nomzodlar bazasida ochiq ko‘rsatish
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Tasdiqlangan korxonalar sizni to‘g‘ridan-to‘g‘ri topishi va taklif yuborishi mumkin
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={profilePublic}
                  onChange={(e) => setProfilePublic(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Telefon raqamni faqat tasdiqlangan kompaniyalarga ko‘rsatish
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Spam va keraksiz qo‘ng‘iroqlardan himoyalanish uchun
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={phoneVerifiedOnly}
                  onChange={(e) => setPhoneVerifiedOnly(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </label>
            </div>

            {onLogout && (
              <div className="pt-4 border-t border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Tizimdan chiqish
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Ushbu qurilmadagi faol sessiyani yakunlash
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-4 py-2 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 border border-red-200 dark:border-red-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>{t.logoutBtn}</span>
                </button>
              </div>
            )}
          </div>

          {/* Form Save Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-7 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-xl shadow-blue-500/25 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Save size={17} />
              <span>{loading ? '...' : t.profileSaveGeneralBtn}</span>
            </button>
          </div>
        </form>
      )}

      {/* Modal: Hisob turini tanlash / almashtirish (OneID Tashkilotlari & Fuqaro) */}
      {showRoleSwitchModal && (
        <div
          onClick={() => setShowRoleSwitchModal(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg max-h-[90vh] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#003B95] via-[#0047BA] to-[#0A58CA] text-white p-4 sm:p-5 flex items-center justify-between shadow-md shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 p-1 flex items-center justify-center border border-white/20 shrink-0 shadow-inner">
                  <RefreshCw size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                    Hisob turini tanlash
                  </h3>
                  <p className="text-[11px] text-blue-100 font-medium">
                    Oddiy shaxs (Nomzod) yoki Tashkilot (Ish beruvchi) sifatida kiring
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRoleSwitchModal(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSwitchAccountType} className="p-5 sm:p-6 overflow-y-auto space-y-4">
              {switchError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{switchError}</span>
                </div>
              )}

              {switchSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 animate-fadeIn">
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                  <span>Hisob turi muvaffaqiyatli almashtirildi!</span>
                </div>
              )}

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Platformadan qaysi maqomda foydalanmoqchisiz? Tanlagan profilingiz bo‘yicha imkoniyatlaringiz yangilanadi:
              </p>

              {/* Option 1: Jismoniy shaxs */}
              <div
                onClick={() => setSelectedOrgTarget('individual')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-center justify-between gap-3 ${
                  selectedOrgTarget === 'individual'
                    ? 'border-[#0047BA] bg-blue-50/70 dark:bg-blue-950/50 shadow-md ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedOrgTarget === 'individual'
                        ? 'bg-[#0047BA] text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <User size={18} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                      Jismoniy shaxs (Fuqaro / Nomzod)
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Ish qidirish, rezyume yaratish va e’lonlarga ariza topshirish
                    </p>
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selectedOrgTarget === 'individual'
                      ? 'border-[#0047BA] bg-[#0047BA] text-white'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {selectedOrgTarget === 'individual' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>

              {/* Option 2: OneID Detected Organizations */}
              {organizations.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Building2 size={14} className="text-indigo-600" />
                      <span>OneID bo‘yicha tashkilotlar ({organizations.length})</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Bitta tashkilotni tanlang</span>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {organizations.map((org, idx) => {
                      const isSelected = selectedOrgTarget === idx;
                      return (
                        <div
                          key={`${org.inn}-${idx}`}
                          onClick={() => setSelectedOrgTarget(idx)}
                          className={`p-3 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 shadow-md ring-2 ring-indigo-500/20'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              <Building2 size={16} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                                  {org.name}
                                </span>
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 shrink-0">
                                  {org.role || 'Rahbar'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                <span>STIR: {org.inn}</span>
                                {org.status && <span>• {org.status}</span>}
                              </div>
                            </div>
                          </div>
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-600 text-white'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Option 3: Custom Organization (Add new) */}
              <div
                onClick={() => setSelectedOrgTarget('custom')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-center justify-between gap-3 ${
                  selectedOrgTarget === 'custom'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 shadow-md ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedOrgTarget === 'custom'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Plus size={18} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                      Boshqa tashkilot kiritish
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Ro‘yxatda bo‘lmagan yangi tashkilot nomini va 9 xonali STIR (INN) raqamini kiritish
                    </p>
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selectedOrgTarget === 'custom'
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {selectedOrgTarget === 'custom' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>

              {/* Custom Organization Inputs */}
              {selectedOrgTarget === 'custom' && (
                <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    <Briefcase size={14} />
                    <span>Yangi tashkilot rekvizitlari</span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tashkilot / Kompaniya nomi *
                    </label>
                    <input
                      type="text"
                      required
                      value={customOrgName}
                      onChange={(e) => setCustomOrgName(e.target.value)}
                      placeholder="Korxona yoki tashkilot nomini kiriting"
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      STIR / INN (9 xonali) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={9}
                      value={customOrgInn}
                      onChange={(e) => setCustomOrgInn(e.target.value.replace(/\D/g, ''))}
                      placeholder="9 xonali STIR (masalan: 301234567)"
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* Modal Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRoleSwitchModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={switchLoading}
                  className="flex-1 py-2.5 rounded-xl bg-[#0047BA] hover:bg-[#003B95] text-white text-xs font-bold transition shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Save size={14} />
                  <span>{switchLoading ? 'Saqlanmoqda...' : 'Saqlash va almashtirish'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
