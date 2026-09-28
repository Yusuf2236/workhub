'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Tag,
  Briefcase,
  DollarSign,
  MapPin,
  Lightbulb,
  Check,
} from 'lucide-react';
import { api } from '../lib/api';
import { generateVacancyWithAI, AIVacancyOutput } from '../lib/aiVacancyGenerator';
import { Language, translations } from '../lib/translations';

interface CreateVacancyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newVacancy?: any) => void;
  lang?: Language;
}

const SAMPLE_ROLES = [
  'Matematika o‘qituvchisi',
  'Senior Go Developer',
  'Bosh buxgalter',
  'SMM Menejer',
  'Grafik dizayner',
  'Ingliz tili ustozi',
  'Sotuv menejeri',
  'Hamshira',
];

const CATEGORIES_LIST = [
  'Ta’lim & Fan',
  'IT & Dasturlash',
  'Marketing & Savdo',
  'Dizayn & UX',
  'Moliya & Buxgalteriya',
  'HR & Menejment',
  'Tibbiyot & Salomatlik',
  'Transport & Logistika',
  'Mijozlarga xizmat',
  'Qurilish & Ishlab chiqarish',
  'Servis & Xizmat ko‘rsatish',
];

export default function CreateVacancyModal({ isOpen, onClose, onSuccess, lang = 'uz' }: CreateVacancyModalProps) {
  const t = translations[lang || 'uz'];
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('Toshkent shahri');
  const [salary, setSalary] = useState('');
  const [category, setCategory] = useState('Ta’lim & Fan');
  const [jobType, setJobType] = useState('Full-time');
  const [experience, setExperience] = useState('1-3 yil');
  const [tags, setTags] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI Generation states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState<AIVacancyOutput['marketInsights'] | null>(null);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleAIFill = (onlyDescription = false, customTitle?: string) => {
    const targetTitle = (customTitle || title || '').trim();
    if (!targetTitle) {
      // Default to "Matematika o‘qituvchisi" if completely empty
      setTitle('Matematika o‘qituvchisi');
    }

    const activeTitle = targetTitle || 'Matematika o‘qituvchisi';
    setAiLoading(true);
    setAiSuccessMessage(null);

    // Simulate smart thinking transition (300ms)
    setTimeout(() => {
      try {
        const result = generateVacancyWithAI({
          title: activeTitle,
          company: company.trim() || undefined,
          location: location.trim() || undefined,
        });

        if (onlyDescription) {
          setDescription(result.description);
          setAiSuccessMessage('✨ AI talablar va vazifalar matnini qayta shakllantirdi!');
        } else {
          setTitle(result.title);
          if (!company.trim()) {
            setCompany(result.company);
          }
          setCategory(result.category);
          setJobType(result.jobType);
          setExperience(result.experience);
          setSalary(result.salary);
          setLocation(result.location);
          setTags(result.tags);
          setDescription(result.description);
          setAiInsights(result.marketInsights);
          setSuggestedTags(result.suggestedTags || []);

          setAiSuccessMessage(
            `✨ AI tomonidan «${result.title}» uchun barcha talablar, vazifalar, maosh va teglar muvaffaqiyatli to‘ldirildi!`
          );
        }
      } catch (err) {
        console.error('AI generation error', err);
      } finally {
        setAiLoading(false);
      }
    }, 320);
  };

  const handleSelectSample = (sample: string) => {
    setTitle(sample);
    handleAIFill(false, sample);
  };

  const handleAddTag = (tagToAdd: string) => {
    const currentTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (!currentTags.includes(tagToAdd)) {
      const updated = [...currentTags, tagToAdd].join(', ');
      setTags(updated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.createVacancy({
        title,
        company: company.trim() || 'Maxfiy ish beruvchi',
        location: location.trim() || 'Toshkent shahri',
        salary,
        category,
        job_type: jobType,
        experience,
        tags,
        description,
      });

      if (res.success && res.data) {
        onSuccess(res.data.vacancy);
        onClose();
      } else {
        setError(res.error || 'Vakansiyani yaratishda xatolik yuz berdi');
      }
    } catch (err: any) {
      setError(err.message || 'Server bilan aloqa uzildi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[92vh] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-scaleIn"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles size={18} className="animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                Yangi vakansiya e‘lon qilish
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-950/60 dark:to-indigo-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  AI Yordamchi
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kompaniyangiz uchun eng iqtidorli mutaxassislarni toping
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {aiSuccessMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 animate-fadeIn">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
              <span className="font-medium">{aiSuccessMessage}</span>
            </div>
          )}

          {/* AI Banner / Tip */}
          <div className="p-3 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-medium">
              <Lightbulb size={16} className="text-amber-500 shrink-0" />
              <span>
                Lavozim nomini kiriting va <strong>{t.fillWithAi}</strong> tugmasini bosing — barcha talablar, maosh va vazifalar avtomatik to‘ldiriladi!
              </span>
            </div>
          </div>

          {/* Job Title with AI Action Button */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Lavozim nomi *
              </label>
              <button
                type="button"
                onClick={() => handleAIFill(false)}
                disabled={aiLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95 transition disabled:opacity-50"
              >
                <Sparkles size={13} className={aiLoading ? 'animate-spin' : 'animate-pulse text-amber-300'} />
                <span>{aiLoading ? '...' : `✨ ${t.fillWithAi}`}</span>
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                required
                placeholder="masalan: Matematika o‘qituvchisi, Go backend dasturchi, Buxgalter..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
            </div>

            {/* Quick Sample Role Chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] text-slate-400 font-medium mr-1">{t.popularExamples}</span>
              {SAMPLE_ROLES.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/60 dark:border-slate-700 transition font-medium"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          {/* Company & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kompaniya / Korxona (ixtiyoriy)
              </label>
              <input
                type="text"
                placeholder="masalan: Registon Ta’lim Markazi yoki bo‘sh qoldiring"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kategoriya
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium"
              >
                {CATEGORIES_LIST.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Job Type, Experience, Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ish turi
              </label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              >
                <option value="Full-time">{t.jobTypeFullTime}</option>
                <option value="Part-time">{t.jobTypePartTime}</option>
                <option value="Remote">{t.jobTypeRemote}</option>
                <option value="Gibrid">{t.jobTypeHybrid}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tajriba
              </label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              >
                <option value="Talab etilmaydi">{t.expNotRequired}</option>
                <option value="1-3 yil">{t.exp1to3}</option>
                <option value="3-5 yil">{t.exp3to5}</option>
                <option value="5+ yil">{t.exp5plus}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Joylashuv / Hudud
              </label>
              <input
                type="text"
                placeholder="masalan: Toshkent shahri"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Salary */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Maosh ko‘lami
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="masalan: 6 000 000 - 12 000 000 UZS"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium"
              />
            </div>
          </div>

          {/* Tags with AI Suggestions */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ko‘nikmalar va teglari (vergul bilan)
              </label>
              <span className="text-[10px] text-slate-400">{t.searchRelevanceHint}</span>
            </div>
            <input
              type="text"
              placeholder="masalan: Oliy matematika, Pedagogika, DTM testlari, Abituriyentlar"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            />

            {suggestedTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[11px] text-slate-400 font-medium">{t.suggestedTags}</span>
                {suggestedTags.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleAddTag(st)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 hover:bg-indigo-100 transition flex items-center gap-1"
                  >
                    <span>+ {st}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detailed Requirements & Duties (Textarea) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Batafsil talablar va vazifalar *
              </label>
              <button
                type="button"
                onClick={() => handleAIFill(true)}
                disabled={aiLoading}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <Sparkles size={12} />
                <span>{t.regenerateAi}</span>
              </button>
            </div>
            <textarea
              rows={8}
              required
              placeholder="Nomzoddan nimalar talab qilinadi va qanday vazifalarni bajarishi kerak? (yoki yuqoridagi «AI bilan to‘ldirish» tugmasini bosing)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 text-xs leading-relaxed rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-mono text-[11px]"
            />
          </div>

          {/* AI Market Insights Box */}
          {aiInsights && (
            <div className="p-3.5 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/30 border border-indigo-200/70 dark:border-indigo-800/60 rounded-xl space-y-2 text-xs animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                  <TrendingUp size={15} className="text-indigo-600" /> AI Mehnat Bozori Tahlili
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                  Talab darajasi: {aiInsights.demandLevel}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">{t.avgMarketSalary} </span>
                  <strong className="text-slate-800 dark:text-slate-200">{aiInsights.averageSalary}</strong>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">{t.similarVacancies} </span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {aiInsights.similarRoles.slice(0, 3).join(', ')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/25 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Plus size={16} />
              <span>{loading ? 'Joylashtirilmoqda...' : 'Vakansiyani e‘lon qilish'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
