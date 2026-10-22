'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  FileText,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Award,
  Check,
  Printer,
  Copy,
  Briefcase,
  Building2,
  GraduationCap,
  Languages,
  Phone,
  Mail,
  MapPin,
  Send,
  Eye,
  SlidersHorizontal,
  Download,
} from 'lucide-react';
import { api } from '../lib/api';
import {
  generateResumeWithAI,
  analyzeResumeText,
  hasResumePlaceholders,
  AIResumeOutput,
  AIResumeAnalysis,
} from '../lib/aiResumeGenerator';
import { detectCurrentLocation, ALL_UZBEK_REGIONS } from '../lib/geolocation';
import { downloadResumeAsPDF } from '../lib/resumePdf';
import { Language, translations } from '../lib/translations';

interface CreateResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUser?: any;
  /** When set the modal edits this resume instead of creating a new one */
  initialResume?: any | null;
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

export default function CreateResumeModal({
  isOpen,
  onClose,
  onSuccess,
  currentUser,
  initialResume = null,
  lang = 'uz',
}: CreateResumeModalProps) {
  const t = translations[lang || 'uz'];
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'ai-analyst'>('edit');

  // Form Fields
  const [title, setTitle] = useState('');
  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [location, setLocation] = useState('Toshkent shahri');
  const [summary, setSummary] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const isEditing = Boolean(initialResume?.id);
  const isCompany = Boolean(
    currentUser && (currentUser.account_type === 'company' || currentUser.role === 'employer')
  );

  // AI states
  const [aiLoading, setAiLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [aiData, setAiData] = useState<AIResumeOutput | null>(null);
  const [analysis, setAnalysis] = useState<AIResumeAnalysis | null>(null);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.name) setFullName(currentUser.name);
    if (currentUser?.email) setEmail(currentUser.email);
  }, [currentUser]);

  // Load the resume being edited, or reset the form for a new one
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setTitle(initialResume?.title || '');
    setSummary(initialResume?.summary || '');
    setFileUrl(initialResume?.file_url || '');
    setActiveTab('edit');
  }, [isOpen, initialResume]);

  // Uploads a PDF/DOC file: a new resume when creating, the edited resume's attachment otherwise
  const handleFileUpload = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const res = await api.uploadResumeFile(file, title.trim() || undefined, initialResume?.id);
      if (res.success && res.data?.file_url) {
        if (isEditing) {
          setFileUrl(res.data.file_url);
        } else {
          onSuccess();
          onClose();
        }
      } else {
        setError(res.error || t.applyError);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDetectLocation = async () => {
    setLocating(true);
    try {
      const detected = await detectCurrentLocation(currentUser?.location);
      if (detected) setLocation(detected);
    } catch {
      setLocation(currentUser?.location || 'Toshkent shahri');
    } finally {
      setLocating(false);
    }
  };

  const handleDownloadPDF = () => {
    downloadResumeAsPDF({
      title: title.trim() || 'Kasbiy rezyume',
      fullName: fullName.trim() || currentUser?.name || 'Nomzod',
      phone: phone.trim() || currentUser?.phone || '',
      email: email.trim() || currentUser?.email || '',
      location: location.trim() || '',
      summary: summary.trim(),
    });
  };

  if (!isOpen) return null;

  const handleAIGenerate = async (customTitle?: string) => {
    const targetTitle = (customTitle || title || '').trim();
    if (!targetTitle) {
      setTitle('Matematika o‘qituvchisi');
    }

    const activeTitle = targetTitle || 'Matematika o‘qituvchisi';
    setAiLoading(true);
    setAiSuccessMessage(null);

    try {
      // Pull real vacancies from the backend API for this profession/role
      const searchRes = await api.getVacancies({ q: activeTitle, limit: 10 }).catch(() => null);
      const realVacancies = (searchRes && searchRes.success && searchRes.data?.vacancies) || [];

      const result = generateResumeWithAI({
        title: activeTitle,
        fullName: fullName.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        location: location.trim() || undefined,
        realMarketData: realVacancies,
      });

      setTitle(result.title);
      setFullName(result.fullName);
      setEmail(result.email);
      setPhone(result.phone);
      setLocation(result.location);
      setSummary(result.fullFormattedCV);
      setAiData(result);
      setAnalysis(result.analysis);

      setAiSuccessMessage(
        `✨ AI backenddagi real bozor ma’lumotlari asosida «${result.title}» uchun mukammal original rezyumeni shakllantirdi!`
      );
    } catch (err) {
      console.error('AI Resume Generation error', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSelectSample = (sample: string) => {
    setTitle(sample);
    handleAIGenerate(sample);
  };

  const handleRunAnalysisOnly = () => {
    if (!summary.trim()) {
      handleAIGenerate();
      return;
    }
    const res = analyzeResumeText(summary, title || 'Mutaxassis');
    setAnalysis(res);
    setActiveTab('ai-analyst');
  };

  const handleCopyCV = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        title: title.trim() || 'Malakali Mutaxassis',
        summary: summary.trim(),
        file_url: fileUrl.trim() || undefined,
      };
      const res = isEditing
        ? await api.updateResume(initialResume.id, { ...payload, file_url: fileUrl.trim() })
        : await api.createResume(payload);

      if (res.success) {
        if (phone.trim() || location.trim()) {
          try {
            await api.updateProfile({
              phone: phone.trim() || undefined,
              location: location.trim() || undefined,
            });
          } catch {
            // non-fatal profile sync
          }
        }
        onSuccess();
        onClose();
      } else {
        setError(res.error || 'Rezyumeni saqlashda xatolik yuz berdi');
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-t-[32px] sm:rounded-2xl w-full max-w-3xl max-h-[92vh] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-sheetSlideUp sm:animate-scaleIn"
      >
        {/* Mobile Sheet Handle */}
        <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mt-2.5 -mb-1 sm:hidden" />
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                {isEditing ? t.editResumeTitle : 'Yangi rezyume joylashtirish'}
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-950/60 dark:to-indigo-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  AI Tahlilchi
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ish beruvchilar sizning rezyumeingizni topishi uchun ma‘lumotlarni kiriting
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close resume modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {isCompany ? (
          <div className="p-8 sm:p-12 text-center space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-900 shadow-inner">
              <Building2 size={32} />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                Tashkilot hisoblari rezyume yarata olmaydi
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Siz tizimga &ldquo;{currentUser?.company_name || currentUser?.name || 'Tashkilot'}&rdquo; korxonasi nomidan (ish beruvchi sifatida) kirdingiz. Ish beruvchilar rezyume yaratmaydi, faqat vakansiyalar e’lon qiladi va nomzodlar bazasidan mutaxassislarni tanlaydi.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition shadow-md cursor-pointer"
              >
                Tushundim, yopish
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* View / Tab Selector */}
            <div className="flex items-center justify-between px-6 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'edit'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <SlidersHorizontal size={14} />
              <span>{t.editResume}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Eye size={14} />
              <span>{t.originalCvPreview}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!analysis && summary) {
                  handleRunAnalysisOnly();
                } else {
                  setActiveTab('ai-analyst');
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'ai-analyst'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Sparkles size={14} className="text-amber-500" />
              <span>AI Tahlilchi {analysis ? `(${analysis.score} ${t.scoreLabel})` : ''}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCV}
              title="Rezyume matnini nusxalash"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium flex items-center gap-1 transition"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span className="hidden sm:inline">{copied ? 'Nusxalandi!' : 'Nusxa olish'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              title="Chop etish yoki PDF saqlash"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium flex items-center gap-1 transition"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">{t.printPdf}</span>
            </button>
          </div>
        </div>

        {/* Modal Form & Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {aiSuccessMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 animate-fadeIn">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
              <span className="font-semibold">{aiSuccessMessage}</span>
            </div>
          )}

          {/* TAB 1: EDIT MODE */}
          {activeTab === 'edit' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Job Title with AI Action Button inside */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Kasbiy mutaxassislik / Lavozim nomi *
                </label>

                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    placeholder="masalan: Matematika o‘qituvchisi, Senior Go Developer, Bosh buxgalter..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full pl-3.5 pr-12 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white transition"
                  />

                  <button
                    type="button"
                    onClick={() => handleAIGenerate()}
                    disabled={aiLoading}
                    title="AI orqali real rezyume ma'lumotlarini to'ldirish"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 text-xs font-bold rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-sm hover:shadow-md active:scale-95 transition disabled:opacity-50"
                  >
                    <Sparkles size={16} className={aiLoading ? 'animate-spin text-amber-300' : 'text-amber-300'} />
                  </button>
                </div>

                {/* Sample Chips */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-slate-400 font-medium mr-1">{t.resumeExamples}</span>
                  {SAMPLE_ROLES.map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => handleSelectSample(sample)}
                      className="text-[11px] px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/60 dark:border-slate-700 transition font-medium"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>

              {/* Personal Details Row with Shahar / Manzil & Geolocation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    To‘liq ism-sharifingiz
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Telefon raqam
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Shahar / Manzil
                    </label>
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={locating}
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                      title="GPS va geo-lokatsiya orqali aniq shahar/viloyatni aniqlash"
                    >
                      <MapPin size={12} className={locating ? 'animate-bounce text-blue-600' : ''} />
                      <span>{locating ? 'GPS orqali aniqlanmoqda...' : 'GPS bilan aniqlash'}</span>
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      list="regions-list"
                      placeholder="masalan: Samarqand viloyati, Samarqand shahri"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full pl-3 pr-9 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                    <datalist id="regions-list">
                      {ALL_UZBEK_REGIONS.map((r) => (
                        <option key={r} value={r} />
                      ))}
                    </datalist>
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={locating}
                      title="GPS orqali aniqlash"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <MapPin size={15} className={locating ? 'animate-bounce text-blue-600' : ''} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Full Original Resume Structure & Summary */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Qisqacha rezyume tavsifi va ko‘nikmalar (Original CV Matni) *
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAIGenerate()}
                      className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <Sparkles size={12} />
                      <span>{t.updateWithAi}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRunAnalysisOnly}
                      className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                    >
                      <Award size={12} />
                      <span>{t.viewAiAnalysis}</span>
                    </button>
                  </div>
                </div>

                <textarea
                  rows={9}
                  required
                  placeholder="Ish tajribangiz, ta’limingiz, vazifalaringiz va asosiy ko‘nikmalaringiz (yoki yuqoridagi AI tugmasini bosing)..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full p-3 text-xs leading-relaxed rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-mono text-[11px]"
                />
              </div>

              {/* PDF link */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Rezyume PDF fayl havolasi (ixtiyoriy)
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* Upload a ready-made resume file */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.uploadResumeFileLabel}
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                    e.target.value = '';
                  }}
                  className="block w-full text-xs text-slate-600 dark:text-slate-300 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-bold hover:file:bg-blue-100 disabled:opacity-50"
                />
                {uploading && <p className="text-[11px] text-slate-500 mt-1">Yuklanmoqda...</p>}
                {isEditing && fileUrl.startsWith('/uploads/') && (
                  <p className="text-[11px] text-emerald-600 mt-1">✓ {t.resumeFileAttached}</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ORIGINAL CV PREVIEW (AUTHENTIC PAPER SHEET) */}
          {activeTab === 'preview' && (
            <div className="bg-slate-100 dark:bg-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 animate-fadeIn">
              <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 shadow-xl rounded-xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 space-y-6 text-slate-800 dark:text-slate-200">
                {/* CV Header */}
                <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                        {fullName || '[Ism Familiya]'}
                      </h2>
                      <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                        {title || 'Malakali Mutaxassis'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadPDF}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                    >
                      <Download size={14} />
                      <span>PDF yuklab olish</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                    <span className="flex items-center gap-1.5">
                      <Phone size={13} className="text-slate-400" /> {phone}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Mail size={13} className="text-slate-400" /> {email}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-slate-400" /> {location}
                    </span>
                  </div>
                </div>

                {/* Professional Summary */}
                {aiData?.summary && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                      <Briefcase size={14} className="text-blue-600" /> Kasbiy tavsif (Professional Summary)
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      {aiData.summary}
                    </p>
                  </div>
                )}

                {/* Work Experience */}
                {aiData?.workExperience && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                      <Briefcase size={14} className="text-blue-600" /> Ish tajribasi (Work Experience)
                    </h4>
                    <div className="space-y-4">
                      {aiData.workExperience.map((exp, i) => (
                        <div key={i} className="pl-3 border-l-2 border-blue-500 space-y-1">
                          <div className="flex items-center justify-between flex-wrap gap-1">
                            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                              {exp.role}
                            </span>
                            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                              {exp.period}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            {exp.company}
                          </p>
                          <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-300 space-y-1 pt-1">
                            {exp.duties.map((d, dIdx) => (
                              <li key={dIdx} className="leading-snug">{d}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {aiData?.education && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                      <GraduationCap size={14} className="text-blue-600" /> Ta’lim (Education)
                    </h4>
                    <div className="space-y-2">
                      {aiData.education.map((edu, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-xs text-slate-900 dark:text-white">{edu.institution}</span>
                            <span className="text-[11px] text-slate-400 font-medium">{edu.period}</span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                            {edu.degree} — {edu.field}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills Grid */}
                {aiData?.hardSkills && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                      <Award size={14} className="text-blue-600" /> Kasbiy ko‘nikmalar (Core Skills)
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {aiData.hardSkills.map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fallback if summary was manually edited */}
                {!aiData && summary && (
                  <pre className="text-xs font-mono whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-slate-800 dark:text-slate-200">
                    {summary}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: AI ANALYST (ATS SCORING & RECOMMENDATIONS) */}
          {activeTab === 'ai-analyst' && (
            <div className="space-y-4 animate-fadeIn">
              {analysis ? (
                <div className="space-y-4">
                  {/* Score Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 text-white shadow-xl flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-indigo-100">
                        WZone AI Tahlilchi Natijasi
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black mt-1">
                        ATS Reytingi: {analysis.score} / 100 ball ({analysis.grade})
                      </h3>
                      <p className="text-xs text-indigo-100 mt-1 max-w-md">
                        {analysis.verdict}
                      </p>
                    </div>

                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex flex-col items-center justify-center shrink-0">
                      <span className="text-2xl sm:text-3xl font-black">{analysis.score}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-100">{t.scoreLabel}</span>
                    </div>
                  </div>

                  {/* Market Fit */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{t.marketDemand}</span>
                      <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                        {analysis.marketFit.demand}
                      </p>
                    </div>
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{t.expectedSalary}</span>
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {analysis.marketFit.estimatedSalary}
                      </p>
                    </div>
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{t.atsScore}</span>
                      <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                        {analysis.atsReady ? '✓ 100% Mos keladi' : 'Tahrir talab etiladi'}
                      </p>
                    </div>
                  </div>

                  {/* Strengths */}
                  <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/60 space-y-2">
                    <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                      <CheckCircle2 size={16} className="text-emerald-600" /> Rezyumening kuchli tomonlari:
                    </h4>
                    <ul className="space-y-1.5 text-xs text-emerald-800 dark:text-emerald-300">
                      {analysis.strengths.map((str, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-600 font-bold shrink-0">✓</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommendations */}
                  <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-900/60 space-y-2">
                    <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                      <Sparkles size={16} className="text-indigo-600" /> AI Tavsiyalari:
                    </h4>
                    <ul className="space-y-1.5 text-xs text-indigo-800 dark:text-indigo-300">
                      {analysis.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-indigo-600 font-bold shrink-0">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <Sparkles size={32} className="mx-auto text-indigo-600 animate-pulse" />
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    Rezyumeni AI Tahlilidan o‘tkazing
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    AI sizning rezyumeingizni xalqaro ATS standartlari, aniqlik va bozor talabiga ko‘ra tahlil qiladi.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleAIGenerate()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow transition"
                  >
                    AI bilan to‘ldirish va tahlil qilish
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {summary.trim().length > 0 ? (
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="px-3.5 py-2 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Rezyumeni A4 PDF formatida yuklab olish"
              >
                <Download size={14} />
                <span>PDF yuklab olish</span>
              </button>
            ) : <div />}
            <div className="flex items-center gap-2">
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
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition flex items-center gap-2 disabled:opacity-50"
              >
                <Plus size={16} />
                <span>{loading ? 'Saqlanmoqda...' : isEditing ? t.saveChangesBtn : 'Rezyumeni saqlash va e‘lon qilish'}</span>
              </button>
            </div>
          </div>
        </form>
        </>
        )}
      </div>
    </div>
  );
}
