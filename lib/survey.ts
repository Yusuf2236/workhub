// Personal interests survey: answers are kept per browser and drive what the home feed shows.

export type SurveyFormat = 'any' | 'remote' | 'hybrid' | 'office';
export type SurveyGoal = 'find_job' | 'post_resume' | 'hire' | 'market';

export interface SurveyAnswers {
  industries: string[];
  format: SurveyFormat;
  goal: SurveyGoal | null;
  completed: boolean;
}

export const SURVEY_INDUSTRIES = [
  'IT & Dasturlash',
  'Marketing & Savdo',
  'Dizayn & UX',
  'Moliya & Buxgalteriya',
  'HR & Menejment',
  'Ta’lim & Fan',
  'Tibbiyot & Salomatlik',
  'Transport & Logistika',
  'Mijozlarga xizmat',
  'Qurilish & Ishlab chiqarish',
  'Servis & Xizmat ko‘rsatish',
];

export const EMPTY_SURVEY: SurveyAnswers = { industries: [], format: 'any', goal: null, completed: false };

const STORAGE_KEY = 'workhub_survey';
const FORMATS: SurveyFormat[] = ['any', 'remote', 'hybrid', 'office'];
const GOALS: SurveyGoal[] = ['find_job', 'post_resume', 'hire', 'market'];

export function loadSurvey(): SurveyAnswers {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved || typeof saved !== 'object') return EMPTY_SURVEY;
    const industries: string[] = Array.isArray(saved.industries)
      ? saved.industries.filter((i: unknown) => typeof i === 'string' && SURVEY_INDUSTRIES.includes(i as string))
      : typeof saved.industry === 'string' && SURVEY_INDUSTRIES.includes(saved.industry)
      ? [saved.industry] // older single-choice format
      : [];
    return {
      industries,
      format: FORMATS.includes(saved.format) ? saved.format : 'any',
      goal: GOALS.includes(saved.goal) ? saved.goal : null,
      completed: Boolean(saved.completed) || industries.length > 0,
    };
  } catch (_) {
    return EMPTY_SURVEY;
  }
}

export function saveSurvey(answers: SurveyAnswers) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  } catch (_) {}
}

export const surveyIsActive = (s: SurveyAnswers) => s.industries.length > 0 || s.format !== 'any';

// Backend filter params for the chosen answers
export function surveyVacancyFilters(s: SurveyAnswers): { category?: string; job_type?: string } {
  const jobType = s.format === 'remote' ? 'Remote' : s.format === 'hybrid' ? 'Gibrid' : s.format === 'office' ? 'Full-time' : '';
  return {
    ...(s.industries.length > 0 ? { category: s.industries.join(',') } : {}),
    ...(jobType ? { job_type: jobType } : {}),
  };
}
