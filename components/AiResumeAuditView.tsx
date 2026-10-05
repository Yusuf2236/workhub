'use client';

import React, { useMemo, useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  FileText,
  RefreshCw,
  Plus,
  Award,
  Zap
} from 'lucide-react';
import { Language, translations } from '../lib/translations';

interface AiResumeAuditViewProps {
  currentUser: any;
  resumes: any[];
  vacancies: any[];
  onSelectVacancy: (vacancy: any) => void;
  onApplyVacancy: (vacancy: any) => void;
  onOpenCreateResume: () => void;
  onRefreshResumes?: () => Promise<void> | void;
  lang?: Language;
}

type CheckId = 'title' | 'summary' | 'metrics' | 'skills' | 'languages' | 'links' | 'file';

// Localized texts for each audit rule: `pass` is shown as a strength, `fail` as an improvement tip
const AUDIT_TEXT: Record<Language, {
  scanning: string;
  needsWork: string;
  fairScore: string;
  lowAtsTip: string;
  metricKeywords: string;
  metricImpact: string;
  metricCompleteness: string;
  noMatches: string;
  allGood: string;
  checks: Record<CheckId, { pass: [string, string]; fail: [string, string] }>;
}> = {
  uz: {
    scanning: 'Tahlil qilinmoqda...',
    needsWork: 'Yaxshilash kerak',
    fairScore: 'O‘rtacha natija',
    lowAtsTip: 'Quyidagi tavsiyalar ATS filtrlaridan o‘tish ehtimolini oshiradi',
    metricKeywords: 'Kalit so‘zlar (Keywords)',
    metricImpact: 'Natijalar & Metrikalar (Impact)',
    metricCompleteness: 'To‘liqlik (Completeness)',
    noMatches: 'Rezyumeingizdagi kalit so‘zlarga mos vakansiya topilmadi. Ko‘nikmalaringizni rezyumega batafsilroq yozing.',
    allGood: 'Barcha asosiy tekshiruvlardan o‘tdingiz — ajoyib!',
    checks: {
      title: {
        pass: ['Aniq lavozim nomi', 'Rezyume sarlavhasi lavozimni aniq ko‘rsatadi.'],
        fail: ['Lavozim nomini aniq yozing', 'Sarlavhada aniq lavozim bo‘lsin, masalan: “Frontend dasturchi (React)”.'],
      },
      summary: {
        pass: ['Batafsil tavsif', 'Rezyume tavsifi tajribangizni yetarlicha ochib beradi.'],
        fail: ['Tavsifni kengaytiring', 'Kamida 40 so‘zdan iborat tavsif yozing: tajriba, loyihalar va ko‘nikmalar.'],
      },
      metrics: {
        pass: ['O‘lchanadigan natijalar', 'Tavsifda raqamlar va natijalar ko‘rsatilgan.'],
        fail: ['Natijalarni raqamlarda ko‘rsating', 'Masalan: “sotuvni 25% oshirdim”, “3 yil tajriba”, “10+ loyiha”.'],
      },
      skills: {
        pass: ['Bozorga mos ko‘nikmalar', 'Rezyumedagi ko‘nikmalar vakansiyalardagi talablar bilan mos keladi.'],
        fail: ['Ko‘nikmalarni qo‘shing', 'Vakansiyalarda so‘raladigan texnologiya va vositalarni rezyumega yozing.'],
      },
      languages: {
        pass: ['Til bilish darajasi ko‘rsatilgan', 'Xorijiy til darajasi ish beruvchilar uchun muhim signal.'],
        fail: ['Til darajasini qo‘shing', 'Ingliz/rus tili darajasini yozing (masalan: B2, IELTS 6.5).'],
      },
      links: {
        pass: ['Portfolio havolalari bor', 'GitHub/portfolio havolasi rekruterlar ishonchini oshiradi.'],
        fail: ['Portfolio havolasini qo‘shing', 'GitHub, LinkedIn yoki portfolio havolasini tavsifga qo‘shing.'],
      },
      file: {
        pass: ['Rezyume fayli biriktirilgan', 'Ish beruvchi to‘liq faylni yuklab olishi mumkin.'],
        fail: ['Rezyume faylini biriktiring', 'PDF formatdagi rezyume faylini yuklang.'],
      },
    },
  },
  ru: {
    scanning: 'Анализируем...',
    needsWork: 'Требует доработки',
    fairScore: 'Средний результат',
    lowAtsTip: 'Рекомендации ниже повысят шанс пройти ATS-фильтры',
    metricKeywords: 'Ключевые слова (Keywords)',
    metricImpact: 'Результаты & Метрики (Impact)',
    metricCompleteness: 'Полнота (Completeness)',
    noMatches: 'Вакансий по ключевым словам вашего резюме не найдено. Опишите навыки подробнее.',
    allGood: 'Все основные проверки пройдены — отлично!',
    checks: {
      title: {
        pass: ['Чёткое название должности', 'Заголовок резюме ясно указывает должность.'],
        fail: ['Укажите точную должность', 'Например: «Frontend-разработчик (React)».'],
      },
      summary: {
        pass: ['Подробное описание', 'Описание достаточно раскрывает ваш опыт.'],
        fail: ['Расширьте описание', 'Напишите не менее 40 слов: опыт, проекты и навыки.'],
      },
      metrics: {
        pass: ['Измеримые результаты', 'В описании есть цифры и результаты.'],
        fail: ['Покажите результаты в цифрах', 'Например: «увеличил продажи на 25%», «3 года опыта», «10+ проектов».'],
      },
      skills: {
        pass: ['Востребованные навыки', 'Навыки в резюме совпадают с требованиями вакансий.'],
        fail: ['Добавьте навыки', 'Укажите технологии и инструменты, которые требуются в вакансиях.'],
      },
      languages: {
        pass: ['Уровень языков указан', 'Уровень иностранного языка — важный сигнал для работодателя.'],
        fail: ['Укажите уровень языков', 'Например: английский B2, IELTS 6.5.'],
      },
      links: {
        pass: ['Есть ссылки на портфолио', 'Ссылка на GitHub/портфолио повышает доверие рекрутеров.'],
        fail: ['Добавьте ссылку на портфолио', 'Добавьте в описание GitHub, LinkedIn или портфолио.'],
      },
      file: {
        pass: ['Файл резюме прикреплён', 'Работодатель может скачать полный файл.'],
        fail: ['Прикрепите файл резюме', 'Загрузите резюме в формате PDF.'],
      },
    },
  },
  en: {
    scanning: 'Analyzing...',
    needsWork: 'Needs Improvement',
    fairScore: 'Fair Result',
    lowAtsTip: 'The tips below will raise your chance of passing ATS filters',
    metricKeywords: 'Keywords',
    metricImpact: 'Results & Metrics (Impact)',
    metricCompleteness: 'Completeness',
    noMatches: 'No vacancies match your resume keywords yet. Describe your skills in more detail.',
    allGood: 'All key checks passed — great job!',
    checks: {
      title: {
        pass: ['Clear job title', 'Your resume title clearly states the position.'],
        fail: ['Use a specific job title', 'For example: “Frontend Developer (React)”.'],
      },
      summary: {
        pass: ['Detailed summary', 'Your summary describes your experience well.'],
        fail: ['Expand your summary', 'Write at least 40 words covering experience, projects and skills.'],
      },
      metrics: {
        pass: ['Measurable results', 'Your summary includes numbers and outcomes.'],
        fail: ['Quantify your results', 'For example: “grew sales by 25%”, “3 years of experience”, “10+ projects”.'],
      },
      skills: {
        pass: ['In-demand skills', 'Your skills match what vacancies ask for.'],
        fail: ['Add your skills', 'List the technologies and tools that vacancies require.'],
      },
      languages: {
        pass: ['Language level stated', 'Foreign language level is an important signal for employers.'],
        fail: ['Add your language level', 'For example: English B2, IELTS 6.5.'],
      },
      links: {
        pass: ['Portfolio links included', 'A GitHub/portfolio link builds recruiter trust.'],
        fail: ['Add a portfolio link', 'Add GitHub, LinkedIn or a portfolio link to your summary.'],
      },
      file: {
        pass: ['Resume file attached', 'Employers can download the full file.'],
        fail: ['Attach a resume file', 'Upload your resume as a PDF.'],
      },
    },
  },
};

const STOPWORDS = new Set([
  'and', 'the', 'for', 'with', 'from', 'that', 'this', 'are', 'was', 'you', 'your',
  'va', 'bilan', 'uchun', 'yil', 'ham', 'bu', 'men', 'bo‘yicha',
  'для', 'что', 'это', 'как', 'при', 'опыт',
]);

const tokenize = (text: string): string[] =>
  (text || '')
    .toLowerCase()
    .split(/[\s,;:!?()\[\]{}"«»/\\|<>*=&—–-]+/)
    .map((w) => w.replace(/^[.']+|[.']+$/g, ''))
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w));

const vacancyKeywords = (v: any): Set<string> => {
  const tags = typeof v.tags === 'string' ? v.tags : Array.isArray(v.tags) ? v.tags.join(',') : '';
  return new Set([...tokenize(v.title), ...tokenize(tags), ...tokenize(v.category)]);
};

export default function AiResumeAuditView({
  currentUser,
  resumes,
  vacancies,
  onSelectVacancy,
  onApplyVacancy,
  onOpenCreateResume,
  onRefreshResumes,
  lang = 'uz',
}: AiResumeAuditViewProps) {
  const t = translations[lang] || translations.uz;
  const at = AUDIT_TEXT[lang] || AUDIT_TEXT.uz;
  const [isScanning, setIsScanning] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');

  // Resumes are fetched for all candidates; only audit the current user's own
  const myResumes = useMemo(
    () =>
      resumes.filter(
        (r) => r.user_id === currentUser?.id || (currentUser?.email && r.email === currentUser.email)
      ),
    [resumes, currentUser]
  );
  const selectedResume = myResumes.find((r) => r.id === selectedResumeId) || myResumes[0];

  const handleRescan = async () => {
    if (!onRefreshResumes) return;
    setIsScanning(true);
    try {
      await onRefreshResumes();
    } finally {
      setIsScanning(false);
    }
  };

  const audit = useMemo(() => {
    if (!selectedResume) return null;

    const title: string = selectedResume.title || '';
    const summary: string = selectedResume.summary || '';
    const fullText = `${title} ${summary}`;
    const resumeTokens = new Set(tokenize(fullText));

    // Keywords that the market (loaded vacancies) asks for
    const marketKeywords = new Set<string>();
    vacancies.forEach((v) => vacancyKeywords(v).forEach((k) => marketKeywords.add(k)));
    const skillHits = Array.from(resumeTokens).filter((k) => marketKeywords.has(k)).length;

    const numberHits = (summary.match(/\d+([.,]\d+)?\s*%?/g) || []).length;
    const summaryWords = tokenize(summary).length;

    const passed: Record<CheckId, boolean> = {
      title: tokenize(title).length >= 2,
      summary: summaryWords >= 40,
      metrics: numberHits >= 2,
      skills: skillHits >= 5,
      languages: /(english|ingliz|ielts|toefl|cefr|\b[abc][12]\b|rus tili|англ|русск)/i.test(fullText),
      links: /(github|linkedin|portfolio|behance|https?:\/\/)/i.test(fullText),
      file: Boolean(selectedResume.file_url),
    };

    const keywordsScore = Math.min(100, Math.round((skillHits / 8) * 100));
    const impactScore = Math.min(100, numberHits * 25);
    const completenessIds: CheckId[] = ['title', 'summary', 'languages', 'links', 'file'];
    const completenessScore = Math.round(
      (completenessIds.filter((id) => passed[id]).length / completenessIds.length) * 100
    );
    const overall = Math.round((keywordsScore + impactScore + completenessScore) / 3);

    // Rank vacancies by the share of their keywords found in the resume
    const matches = vacancies
      .map((v) => {
        const keys = vacancyKeywords(v);
        const hit = Array.from(keys).filter((k) => resumeTokens.has(k)).length;
        return { ...v, matchRate: keys.size > 0 ? Math.round((hit / keys.size) * 100) : 0 };
      })
      .filter((v) => v.matchRate > 0)
      .sort((a, b) => b.matchRate - a.matchRate)
      .slice(0, 6);

    const ids = Object.keys(passed) as CheckId[];
    return {
      overall,
      metrics: [
        { label: at.metricKeywords, value: keywordsScore, bar: 'bg-blue-600', text: 'text-blue-600 dark:text-blue-400' },
        { label: at.metricImpact, value: impactScore, bar: 'bg-indigo-600', text: 'text-indigo-600 dark:text-indigo-400' },
        { label: at.metricCompleteness, value: completenessScore, bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
      ],
      strengths: ids.filter((id) => passed[id]).map((id) => at.checks[id].pass),
      suggestions: ids.filter((id) => !passed[id]).map((id) => at.checks[id].fail),
      matches,
    };
  }, [selectedResume, vacancies, at]);

  const scoreLabel = !audit
    ? ''
    : audit.overall >= 75
    ? t.aiAuditGoodScore
    : audit.overall >= 50
    ? at.fairScore
    : at.needsWork;
  const scoreBadgeClass = !audit
    ? ''
    : audit.overall >= 75
    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
    : audit.overall >= 50
    ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
    : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300';

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. HERO HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-blue-700 to-slate-900 text-white p-6 sm:p-8 shadow-xl shadow-blue-900/20 border border-indigo-500/30">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-black uppercase tracking-wider text-blue-200">
              <Sparkles size={14} className="text-yellow-400" />
              <span>WZone AI Audit</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              {t.aiResumeAuditTitle}
            </h1>

            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-medium">
              {t.aiResumeAuditSub}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            {onRefreshResumes && myResumes.length > 0 && (
              <button
                onClick={handleRescan}
                disabled={isScanning}
                className="px-5 py-3 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 disabled:opacity-70 font-black text-xs shadow-lg shadow-black/10 flex items-center justify-center gap-2 transition active:scale-95"
              >
                <RefreshCw size={15} className={isScanning ? 'animate-spin' : ''} />
                <span>{isScanning ? at.scanning : t.aiAuditScanBtn}</span>
              </button>
            )}

            <button
              onClick={onOpenCreateResume}
              className="px-5 py-3 rounded-2xl bg-blue-600/70 hover:bg-blue-600 text-white font-bold text-xs border border-white/20 backdrop-blur flex items-center justify-center gap-2 transition"
            >
              <Plus size={16} />
              <span>{t.aiAuditCreateResumeBtn}</span>
            </button>
          </div>
        </div>
      </div>

      {!audit ? (
        /* EMPTY STATE: no resume to audit */
        <div className="p-14 text-center bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <FileText size={44} className="mx-auto text-slate-400" />
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{t.aiAuditNoResume}</h3>
          <button
            onClick={onOpenCreateResume}
            className="mt-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition"
          >
            {t.aiAuditCreateResumeBtn}
          </button>
        </div>
      ) : (
        <>
          {/* Resume selector */}
          {myResumes.length > 1 && (
            <div className="flex items-center gap-2 text-xs">
              <FileText size={15} className="text-blue-600 dark:text-blue-400" />
              <span className="font-bold text-slate-700 dark:text-slate-300">{t.aiAuditSelectResume}</span>
              <select
                value={selectedResume?.id || ''}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {myResumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title || r.id}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 2. SCORE CARD & FINDINGS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Overall ATS Score Card */}
            <div className="bg-white dark:bg-slate-900/90 backdrop-blur rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between space-y-6">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Award size={18} className="text-blue-600 dark:text-blue-400" />
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {t.aiAuditScoreLabel}
                  </h3>
                </div>
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full text-center ${scoreBadgeClass}`}>
                  {scoreLabel}
                </span>
              </div>

              {/* Big Score Gauge */}
              <div className="text-center py-2 space-y-2">
                <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 p-1 shadow-xl shadow-blue-500/20">
                  <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">
                      {audit.overall}<span className="text-lg text-blue-600">%</span>
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      ATS Score
                    </span>
                  </div>
                </div>
                <p className={`text-xs font-bold flex items-center justify-center gap-1 ${
                  audit.overall >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                }`}>
                  {audit.overall >= 75 ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  <span>{audit.overall >= 75 ? t.aiAuditAtsTip : at.lowAtsTip}</span>
                </p>
              </div>

              {/* Sub-Metrics Breakdown */}
              <div className="space-y-3 pt-2 text-xs">
                {audit.metrics.map((m) => (
                  <div key={m.label}>
                    <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 mb-1">
                      <span>{m.label}</span>
                      <span className={m.text}>{m.value}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className={`h-full ${m.bar} rounded-full transition-all duration-700`} style={{ width: `${m.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Strengths & Suggestions */}
            <div className="lg:col-span-2 space-y-6">
              {audit.strengths.length > 0 && (
                <div className="bg-white dark:bg-slate-900/90 backdrop-blur rounded-3xl border border-emerald-200/70 dark:border-emerald-950/60 p-5 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-extrabold text-sm pb-2 border-b border-emerald-100 dark:border-emerald-950">
                    <CheckCircle2 size={18} />
                    <h3>{t.aiAuditStrengths}</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {audit.strengths.map(([title, desc]) => (
                      <div
                        key={title}
                        className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 space-y-1"
                      >
                        <span className="font-bold text-slate-900 dark:text-white block">✓ {title}</span>
                        <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-slate-900/90 backdrop-blur rounded-3xl border border-blue-200/70 dark:border-blue-950/60 p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-extrabold text-sm pb-2 border-b border-blue-100 dark:border-blue-950">
                  <Lightbulb size={18} />
                  <h3>{t.aiAuditWeaknesses}</h3>
                </div>

                {audit.suggestions.length === 0 ? (
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{at.allGood}</p>
                ) : (
                  <div className="space-y-2.5 text-xs">
                    {audit.suggestions.map(([title, desc]) => (
                      <div
                        key={title}
                        className="p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex items-start gap-3"
                      >
                        <Sparkles size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-slate-900 dark:text-white">{title}</span>
                          <p className="text-slate-600 dark:text-slate-300 text-[11px]">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. MATCHING VACANCIES */}
          <div className="bg-white dark:bg-slate-900/90 backdrop-blur rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Zap size={20} className="text-amber-500 fill-amber-500" />
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {t.aiAuditMatchingJobs}
                </h2>
              </div>
              <span className="text-xs font-bold text-slate-400">
                {audit.matches.length} {t.vacanciesCount}
              </span>
            </div>

            {audit.matches.length === 0 ? (
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{at.noMatches}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {audit.matches.map((vac) => (
                  <div
                    key={vac.id}
                    onClick={() => onSelectVacancy(vac)}
                    className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-500 transition shadow-sm cursor-pointer space-y-3 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                          {vac.company ? vac.company[0].toUpperCase() : 'W'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-1">
                            {vac.title}
                          </h4>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            {vac.company}
                          </span>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
                        <Zap size={11} className="fill-emerald-600 text-emerald-600" />
                        {vac.matchRate}% {t.aiAuditMatchPercent}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
                      <span className="font-extrabold text-blue-600 dark:text-blue-400">
                        {vac.salary || t.salaryNegotiable}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onApplyVacancy(vac);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-sm transition active:scale-95 flex items-center gap-1"
                      >
                        <span>{t.aiAuditApplyBtn}</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
