'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, ShieldCheck, Mail, Save, Sparkles, CheckCircle2, Camera, Upload, MapPin, Phone, Briefcase, Globe, Send, AlertCircle } from 'lucide-react';
import { api, getCurrentUser, setCurrentUser } from '../lib/api';
import { Language, translations } from '../lib/translations';

interface ProfileViewProps {
  user: any;
  onUserUpdated: (u: any) => void;
  lang?: Language;
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

export default function ProfileView({ user, onUserUpdated, lang = 'uz' }: ProfileViewProps) {
  const t = translations[lang] || translations.uz;

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('Toshkent shahri');
  const [website, setWebsite] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');

  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
    if (user?.email) {
      setEmail(user.email);
    }
    if (user?.avatar_url) {
      setAvatarUrl(user.avatar_url);
    }
  }, [user?.name, user?.email, user?.avatar_url]);

  useEffect(() => {
    async function loadProfile() {
      if (user) {
        const res = await api.getProfile();
        if (res.success && res.data?.profile) {
          const p = res.data.profile;
          setBio(p.bio || '');
          setSkills(p.skills || '');
          setPhone(p.phone || '');
          if (p.location) setLocation(p.location);
          if (p.website) setWebsite(p.website);
          if (p.avatar_url) setAvatarUrl(p.avatar_url);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSavedSuccess(false);
    setErrorMessage(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    if (!cleanName) {
      setErrorMessage('To‘liq ism-sharifingiz (F.I.O) maydonini to‘ldiring');
      setLoading(false);
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Haqiqiy email manzilingizni to‘g‘ri kiriting');
      setLoading(false);
      return;
    }

    try {
      const res = await api.updateProfile({
        name: cleanName,
        email: cleanEmail,
        bio,
        skills,
        phone,
        location,
        website,
        avatar_url: avatarUrl,
      });

      if (res.success) {
        setSavedSuccess(true);
        const updated = (res.data as any)?.user || { ...user, name: cleanName, email: cleanEmail, avatar_url: avatarUrl };
        setCurrentUser(updated);
        onUserUpdated(updated);
        setTimeout(() => setSavedSuccess(false), 3500);
      } else {
        setErrorMessage(res.error || 'Profilni saqlashda xatolik');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Server xatosi');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <User size={40} className="mx-auto text-slate-400 mb-3" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Profilingizni ko‘rish uchun avval tizimga kiring
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          OneID yoki Google hisobingiz orqali 1 klikda tizimga kiring
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900/90 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header Info with Avatar Upload */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-slate-200/80 dark:border-slate-800">
        {/* Avatar with Camera Overlay */}
        <div className="relative group shrink-0">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white font-black text-3xl flex items-center justify-center overflow-hidden shadow-xl shadow-blue-500/25 border-2 border-white dark:border-slate-800">
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
            className="absolute inset-0 bg-slate-950/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold"
          >
            <Camera size={20} className="mb-0.5" />
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

        {/* Name and Auth Badges */}
        <div className="text-center sm:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {user.name}
            </h2>
            {user.auth_provider === 'oneid' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <ShieldCheck size={13} /> OneID Tasdiqlangan {user.pinfl ? `(${user.pinfl})` : ''}
              </span>
            )}
            {user.auth_provider === 'google' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950 text-red-600 border border-red-200">
                Google SSO
              </span>
            )}
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{email || user.email}</p>

          {(!user.name || user.name === 'Google Foydalanuvchisi' || user.name === 'Google Foydalanuvchi') && (
            <div className="mt-2.5 p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between gap-2 text-xs font-medium text-amber-800 dark:text-amber-300 animate-fadeIn">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
                <span>
                  Profilingizda haqiqiy ism-sharifingiz to‘liq kiritilmagan.
                </span>
              </div>
              <button
                type="button"
                onClick={() => nameInputRef.current?.focus()}
                className="shrink-0 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold transition"
              >
                F.I.O kiritish
              </button>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 shadow-sm"
            >
              <Upload size={13} />
              <span>{uploadingAvatar ? 'Yuklanmoqda...' : t.uploadPhoto}</span>
            </button>
          </div>
        </div>
      </div>

      {/* OneID Official Verification Banner */}
      {user.auth_provider === 'oneid' && (() => {
        const pinflData = parsePINFL(user.pinfl || '');
        return (
          <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-slate-50 dark:from-blue-950/40 dark:via-indigo-950/20 dark:to-slate-900 border border-blue-200 dark:border-blue-800 rounded-2xl space-y-3 animate-fadeIn shadow-sm">
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
                <span>Rasmiy Tasdiqlangan</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-0.5 text-xs">
              <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">JShShIR (PINFL)</span>
                <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400 text-sm tracking-wider">{user.pinfl || '—'}</span>
              </div>
              <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Tug‘ilgan sana va jinsi</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {pinflData ? `${pinflData.birthDate} (${pinflData.gender})` : 'Davlat reestridan tasdiqlangan'}
                </span>
              </div>
              <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Doimiy hudud</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                  {location || (pinflData ? pinflData.region : 'O‘zbekiston')}
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center gap-2.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 animate-fadeIn">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
          <span>{t.profileSaved}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 rounded-xl flex items-center gap-2.5 text-xs font-bold text-red-800 dark:text-red-300 animate-fadeIn">
          <AlertCircle size={18} className="shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              To‘liq ism-sharifingiz (F.I.O) *
            </label>
            <input
              ref={nameInputRef}
              id="profile-fullname-input"
              type="text"
              required
              placeholder="Masalan: Sardor Rahimov"
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
            {t.skills}
          </label>
          <input
            type="text"
            placeholder="Go, React, Next.js, PostgreSQL, Docker, Kubernetes"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
            {t.bio}
          </label>
          <textarea
            rows={4}
            placeholder="O‘zingizning ish tajribangiz, yutuqlaringiz va maqsadlaringiz haqida yozing..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full p-3 text-xs sm:text-sm font-normal rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white leading-relaxed"
          />
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-500/25 transition flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={16} />
            <span>{loading ? 'Saqlanmoqda...' : t.saveChanges}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
