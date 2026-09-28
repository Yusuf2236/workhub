export const SITE_URL = 'https://wzone.uz';
export const SITE_NAME = 'WZone';
export const SITE_LOCALE = 'uz_UZ';
export const SITE_LANG = 'uz';

export const SITE_TITLE =
  "WZone — O'zbekistondagi ish va vakansiyalar platformasi";

export const SITE_DESCRIPTION =
  "WZone — O'zbekistonda ish qidirish va vakansiya e'lon qilish platformasi. IT, ta'lim, moliya, marketing va boshqa sohalardagi yangi ish o'rinlari. OneID va Google orqali tezkor kirish, AI rezyume yordamchisi.";

export const SITE_KEYWORDS = [
  'WZone',
  'ish',
  'vakansiya',
  'ish qidirish',
  "ish o'rinlari",
  'Toshkent ish',
  'Oʻzbekiston vakansiyalar',
  'rezyume',
  'OneID',
  'IT ish',
  'remote ish',
  'job Uzbekistan',
  'vacancies Uzbekistan',
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
