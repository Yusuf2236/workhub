import type { Metadata } from 'next';
import Link from 'next/link';
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME } from '../../lib/seo';
import { listVacancies } from '../../lib/vacancies-seo';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Barcha vakansiyalar',
  description:
    "WZone'dagi eng so'nggi ish o'rinlari va vakansiyalar. Toshkent, viloyatlar va masofaviy ish e'lonlari.",
  alternates: { canonical: absoluteUrl('/job') },
  openGraph: {
    title: `Barcha vakansiyalar | ${SITE_NAME}`,
    description: SITE_DESCRIPTION,
    url: absoluteUrl('/job'),
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export default async function JobsIndexPage() {
  const vacancies = await listVacancies(50);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#0b0f19]">
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">WZone</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Oʻzbekistondagi vakansiyalar
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
            {vacancies.length} ta faol eʼlon. Har bir vakansiya alohida SEO sahifaga ega — tezroq indeksatsiya uchun.
          </p>
        </header>

        <div className="grid gap-3">
          {vacancies.map((v) => (
            <Link
              key={v.id}
              href={`/job/${v.id}`}
              className="block p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 transition"
            >
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                {v.title}
              </h2>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                {v.company} · {v.location} · {v.salary || 'Kelishilgan'}
              </p>
            </Link>
          ))}
          {vacancies.length === 0 && (
            <p className="text-sm text-slate-500">Hozircha vakansiyalar yuklanmadi.</p>
          )}
        </div>

        <Link href="/" className="inline-flex text-sm font-bold text-blue-600">
          ← Asosiy platformaga qaytish
        </Link>
      </div>
    </main>
  );
}
