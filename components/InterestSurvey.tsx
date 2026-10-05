'use client';

import React, { useState } from 'react';
import { ClipboardList, Check, ArrowLeft, ArrowRight, Pencil, X } from 'lucide-react';
import { Language, translations } from '../lib/translations';
import { SURVEY_INDUSTRIES, SurveyAnswers, SurveyFormat, SurveyGoal, EMPTY_SURVEY, surveyIsActive } from '../lib/survey';

interface InterestSurveyProps {
  answers: SurveyAnswers;
  onChange: (answers: SurveyAnswers) => void;
  lang?: Language;
}

const TEXT: Record<Language, {
  firstTitle: string;
  firstDesc: string;
  step: string;
  q1: string;
  q1Hint: string;
  q2: string;
  q3: string;
  next: string;
  back: string;
  skip: string;
  done: string;
  summaryTitle: string;
  edit: string;
  reset: string;
  allIndustries: string;
}> = {
  uz: {
    firstTitle: 'Keling, tanishamiz',
    firstDesc: '3 ta savolga javob bering — lentada faqat sizga mos vakansiya va muhokamalar chiqadi.',
    step: 'Savol',
    q1: 'Qaysi sohalar sizni qiziqtiradi?',
    q1Hint: 'Bir nechtasini belgilashingiz mumkin',
    q2: 'Qaysi ish formati sizga qulay?',
    q3: 'Asosiy maqsadingiz nima?',
    next: 'Keyingi',
    back: 'Orqaga',
    skip: 'O‘tkazib yuborish',
    done: 'Tayyor',
    summaryTitle: 'Sizning qiziqishlaringiz',
    edit: 'O‘zgartirish',
    reset: 'Tozalash',
    allIndustries: 'Barcha sohalar',
  },
  ru: {
    firstTitle: 'Давайте познакомимся',
    firstDesc: 'Ответьте на 3 вопроса — в ленте будут только подходящие вам вакансии и обсуждения.',
    step: 'Вопрос',
    q1: 'Какие сферы вам интересны?',
    q1Hint: 'Можно выбрать несколько',
    q2: 'Какой формат работы вам удобен?',
    q3: 'Какова ваша главная цель?',
    next: 'Далее',
    back: 'Назад',
    skip: 'Пропустить',
    done: 'Готово',
    summaryTitle: 'Ваши интересы',
    edit: 'Изменить',
    reset: 'Сбросить',
    allIndustries: 'Все сферы',
  },
  en: {
    firstTitle: 'Let’s get to know you',
    firstDesc: 'Answer 3 questions and your feed will only show vacancies and discussions that fit you.',
    step: 'Question',
    q1: 'Which fields interest you?',
    q1Hint: 'You can pick several',
    q2: 'Which work format suits you?',
    q3: 'What is your main goal?',
    next: 'Next',
    back: 'Back',
    skip: 'Skip',
    done: 'Done',
    summaryTitle: 'Your interests',
    edit: 'Edit',
    reset: 'Reset',
    allIndustries: 'All fields',
  },
};

export default function InterestSurvey({ answers, onChange, lang = 'uz' }: InterestSurveyProps) {
  const t = translations[lang] || translations.uz;
  const st = TEXT[lang] || TEXT.uz;
  const [step, setStep] = useState(0);
  const [editing, setEditing] = useState(false);

  const formats: [SurveyFormat, string][] = [
    ['any', t.surveyFormatAny],
    ['remote', t.surveyFormatRemote],
    ['hybrid', t.surveyFormatHybrid],
    ['office', t.surveyFormatOffice],
  ];
  const goals: [SurveyGoal, string][] = [
    ['find_job', t.surveyGoalFindJob],
    ['post_resume', t.surveyGoalPostResume],
    ['hire', t.surveyGoalHire],
    ['market', t.surveyGoalMarket],
  ];
  const catLabel = (c: string) => t.categories?.[c] || c;

  const toggleIndustry = (cat: string) => {
    const industries = answers.industries.includes(cat)
      ? answers.industries.filter((c) => c !== cat)
      : [...answers.industries, cat];
    onChange({ ...answers, industries });
  };

  const finish = () => {
    onChange({ ...answers, completed: true });
    setEditing(false);
    setStep(0);
  };

  const chip = (selected: boolean) =>
    `px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition text-left ${
      selected
        ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/25'
        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400'
    }`;

  // Summary of saved answers
  if (answers.completed && !editing) {
    return (
      <section className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900 dark:text-white">
            <ClipboardList size={15} className="text-blue-600 dark:text-blue-400" />
            {st.summaryTitle}
          </span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            <Pencil size={11} />
            {st.edit}
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(answers.industries.length > 0 ? answers.industries.map(catLabel) : [st.allIndustries]).map((label) => (
            <span key={label} className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
              {label}
            </span>
          ))}
          <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
            {formats.find(([k]) => k === answers.format)?.[1]}
          </span>
          {answers.goal && (
            <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
              {goals.find(([k]) => k === answers.goal)?.[1]}
            </span>
          )}
        </div>
        {surveyIsActive(answers) && (
          <button
            type="button"
            onClick={() => onChange({ ...EMPTY_SURVEY, completed: true })}
            className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-rose-600 dark:text-slate-400 transition"
          >
            <X size={11} />
            {st.reset}
          </button>
        )}
      </section>
    );
  }

  // Step-by-step questionnaire
  return (
    <section className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/30 border border-indigo-200/70 dark:border-indigo-900/60 shadow-sm space-y-3">
      {!answers.completed && step === 0 && (
        <div className="space-y-1">
          <span className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-700 dark:text-indigo-300">
            <ClipboardList size={15} />
            {st.firstTitle}
          </span>
          <p className="text-[11px] leading-snug text-slate-600 dark:text-slate-300 font-medium">{st.firstDesc}</p>
        </div>
      )}

      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
        ))}
      </div>

      <div className="space-y-0.5">
        <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">
          {st.step} {step + 1}/3
        </span>
        <h3 className="text-xs font-extrabold text-slate-900 dark:text-white">{[st.q1, st.q2, st.q3][step]}</h3>
        {step === 0 && <p className="text-[10px] text-slate-500 dark:text-slate-400">{st.q1Hint}</p>}
      </div>

      {step === 0 && (
        <div className="flex flex-wrap gap-1.5">
          {SURVEY_INDUSTRIES.map((cat) => {
            const selected = answers.industries.includes(cat);
            return (
              <button key={cat} type="button" onClick={() => toggleIndustry(cat)} className={chip(selected)}>
                {selected && <Check size={10} className="inline mr-1 -mt-0.5" />}
                {catLabel(cat)}
              </button>
            );
          })}
        </div>
      )}

      {step === 1 && (
        <div className="grid grid-cols-1 gap-1.5">
          {formats.map(([key, label]) => (
            <button key={key} type="button" onClick={() => onChange({ ...answers, format: key })} className={chip(answers.format === key)}>
              {label}
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-1 gap-1.5">
          {goals.map(([key, label]) => (
            <button key={key} type="button" onClick={() => onChange({ ...answers, goal: key })} className={chip(answers.goal === key)}>
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <ArrowLeft size={12} />
            {st.back}
          </button>
        ) : (
          <button
            type="button"
            onClick={finish}
            className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {st.skip}
          </button>
        )}
        <button
          type="button"
          onClick={() => (step < 2 ? setStep(step + 1) : finish())}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-sm transition active:scale-95"
        >
          {step < 2 ? st.next : st.done}
          {step < 2 ? <ArrowRight size={12} /> : <Check size={12} />}
        </button>
      </div>
    </section>
  );
}
