export const SITE_URL = 'https://wzone.uz';
export const SITE_NAME = 'WZone';
export const SITE_LOCALE = 'uz_UZ';
export const SITE_LANG = 'uz';

/** Primary SERP title — keep readable, brand-first */
export const SITE_TITLE =
  "WZone — Ish, vakansiya, rezyume va karyera platformasi | Work Zone O'zbekiston";

/**
 * Multi-language description (UZ + RU + EN signals in one natural blurb).
 * Google uses description more than keywords meta.
 */
export const SITE_DESCRIPTION =
  "WZone (Work Zone / Work Zona) — O'zbekistonda ish topish, vakansiya, ishxona, rezyume, suhbat va karyera platformasi. " +
  "Ish bor, ish qidirish, ish o'rinlari, tashkilotga ishga kirish, remote va Toshkent vakansiyalari. " +
  "Работа в Узбекистане, вакансии, резюме, собеседование, карьера, работодатели. " +
  "Jobs in Uzbekistan, vacancies, resume, interview, career, WorkZone hiring. OneID & Google login, AI resume.";

export const SITE_DESCRIPTION_UZ =
  "WZone — ish topish, vakansiya e'lon qilish, rezyume, suhbat va karyera uchun zamonaviy platforma. Ishxona, tashkilot, remote ish va barcha sohalar.";

export const SITE_DESCRIPTION_RU =
  "WZone — работа в Узбекистане: вакансии, резюме, собеседования, карьера, работодатели и удалённая работа. Work Zone / Work Zona.";

export const SITE_DESCRIPTION_EN =
  "WZone (Work Zone) — jobs and vacancies in Uzbekistan: career, resume, interview, hiring, remote work and employers.";

/**
 * Exhaustive multilingual keyword set for meta keywords / classification.
 * Includes brand variants, job-search intent, career, interview, org, resume.
 */
export const SITE_KEYWORDS: string[] = [
  // Brand / product
  'WZone',
  'wzone',
  'wzone.uz',
  'Work Zone',
  'WorkZone',
  'work zone',
  'workzone',
  'Work Zona',
  'work zona',
  'workzona',
  'W Zone',
  'Ish zona',
  'ishzona',

  // UZ — ish / vakansiya
  'ish',
  'ishlar',
  "ish o'rinlari",
  "ish o‘rinlari",
  'ish orinlari',
  'ish topish',
  'ish qidirish',
  'ish izlash',
  'ish bor',
  'ish kerak',
  'ishxona',
  'ish xona',
  'ish joyi',
  'ish joy',
  'bo‘sh ish o‘rinlari',
  "bo'sh ish o'rinlari",
  'vakansiya',
  'vakansiyalar',
  'yangi vakansiya',
  'vakansiya e’lon',
  'vakansiya elon',
  'e’lon berish',
  'elon berish',
  'ish e’loni',
  'ish eloni',

  // UZ — karyera / suhbat / tashkilot / rezyume
  'karyera',
  'karyerа',
  'kasbiy o‘sish',
  'suhbat',
  'ish suhbat',
  'ishga suhbat',
  'suhbatga tayyorgarlik',
  'intervyu',
  'tashkilot',
  'tashkilotga ish',
  'kompaniya',
  'ish beruvchi',
  'ish beruvchilar',
  'xodim',
  'xodim izlash',
  'rezyume',
  'rezyume yozish',
  'rezyume yaratish',
  'CV',
  'cv yuborish',
  'ariza',
  'ariza topshirish',
  'nomzod',
  'nomzodlar bazasi',
  'HR',
  'hr menejer',
  'recruitment',
  'kadrlar',

  // UZ — joylashuv / format
  'Toshkent ish',
  'Toshkent vakansiya',
  'Samarqand ish',
  'Farg‘ona ish',
  'Andijon ish',
  'Namangan ish',
  'Buxoro ish',
  'O‘zbekiston ish',
  'Uzbekistan ish',
  'masofaviy ish',
  'remote ish',
  'online ish',
  'uyda ish',
  'part-time ish',
  'full-time ish',
  'gibrid ish',
  'smena ishi',
  'frilanser',
  'freelance',

  // UZ — sohalar
  'IT ish',
  'dasturchi ish',
  'developer ish',
  'o‘qituvchi ish',
  'sotuv menejeri',
  'buxgalter ish',
  'dizayner ish',
  'marketing ish',
  'SMM ish',
  'haydovchi ish',
  'kuryer ish',
  'tibbiyot ish',
  'hamshira ish',
  'qurilish ish',

  // RU — работа / вакансии
  'работа',
  'работа Узбекистан',
  'работа в Узбекистане',
  'работа Ташкент',
  'вакансии',
  'вакансия',
  'свежие вакансии',
  'поиск работы',
  'найти работу',
  'ищу работу',
  'есть работа',
  'работа рядом',
  'удаленная работа',
  'удалённая работа',
  'работа на дому',
  'подработка',
  'полный день',
  'частичная занятость',
  'стажировка',
  'резюме',
  'составить резюме',
  'отправить резюме',
  'собеседование',
  'интервью',
  'карьера',
  'карьерный рост',
  'работодатель',
  'работодатели',
  'организация',
  'компания вакансии',
  'нанимать сотрудников',
  'подбор персонала',
  'рекрутинг',
  'HR Узбекистан',
  'биржа труда',
  'доска объявлений работа',
  'объявления о работе',

  // EN — jobs / career
  'job',
  'jobs',
  'job search',
  'find a job',
  'find work',
  'work',
  'hiring',
  'now hiring',
  'vacancy',
  'vacancies',
  'job vacancy',
  'job openings',
  'open positions',
  'employment',
  'employer',
  'employers',
  'organization jobs',
  'company careers',
  'career',
  'careers',
  'career growth',
  'interview',
  'job interview',
  'resume',
  'CV',
  'curriculum vitae',
  'cover letter',
  'apply for job',
  'job application',
  'recruitment',
  'talent acquisition',
  'HR platform',
  'job board',
  'job portal',
  'job marketplace',
  'remote jobs',
  'work from home',
  'full time jobs',
  'part time jobs',
  'freelance jobs',
  'internship',
  'Uzbekistan jobs',
  'jobs in Uzbekistan',
  'Tashkent jobs',
  'Tashkent vacancies',
  'Work Zone Uzbekistan',
  'WorkZone Uzbekistan',
  'WZone jobs',

  // Intent / long-tail
  'qayerda ish bor',
  'bugun ish bor',
  'tezkor ish',
  'yuqori maoshli ish',
  'maosh',
  'ish haqi',
  'salary',
  'зарплата',
  'vakansiyaga ariza',
  'ishga kirish',
  'ishga joylashish',
  'yangi ish',
  'birinchi ish',
  'talabalar uchun ish',
  'без опыта работа',
  'entry level jobs',
  'AI rezyume',
  'AI resume',
  'OneID ish',
  'Google kirish ish',
];

export const SITE_OG_IMAGE = `${SITE_URL}/opengraph-image`;

export function absoluteUrl(path = '/'): string {
  if (!path || path === '/') return SITE_URL;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function truncateText(text: string, max = 160): string {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

/** Comma-separated keywords for raw meta tags */
export function keywordsMetaString(extra: string[] = []): string {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const k of [...SITE_KEYWORDS, ...extra]) {
    const key = k.trim();
    if (!key) continue;
    const low = key.toLowerCase();
    if (seen.has(low)) continue;
    seen.add(low);
    out.push(key);
  }
  return out.join(', ');
}
