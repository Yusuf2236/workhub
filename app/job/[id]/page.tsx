import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  absoluteUrl,
  SITE_NAME,
  truncateText,
} from '../../../lib/seo';
import {
  buildJobPostingJsonLd,
  getVacancyById,
} from '../../../lib/vacancies-seo';

type Props = {
  params: { id: string };
};

export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const vacancy = await getVacancyById(params.id);
  if (!vacancy) {
    return {
      title: 'Vakansiya topilmadi',
      robots: { index: false, follow: true },
    };
  }

  const title = `${vacancy.title} — ${vacancy.company}`;
  const description = truncateText(
    vacancy.description ||
      `${vacancy.title} lavozimi ${vacancy.company} kompaniyasida. Hudud: ${vacancy.location}. WZone orqali ariza qoldiring.`,
    165
  );
  const url = absoluteUrl(`/job/${vacancy.id}`);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title,
      description,
      siteName: SITE_NAME,
      locale: 'uz_UZ',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function JobPage({ params }: Props) {
  const vacancy = await getVacancyById(params.id);
  if (!vacancy) notFound();

  const jsonLd = buildJobPostingJsonLd(vacancy);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#0b0f19]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <nav className="text-xs font-semibold text-slate-500">
          <Link href="/" className="hover:text-blue-600">
            WZone
          </Link>
          <span className="mx-2">/</span>
          <Link href="/job" className="hover:text-blue-600">
            Vakansiyalar
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-800 dark:text-slate-200">{vacancy.title}</span>
        </nav>

        <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
          <header className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              {vacancy.category || 'Vakansiya'}
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {vacancy.title}
            </h1>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              {vacancy.company} · {vacancy.location}
            </p>
          </header>

          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-100 dark:border-slate-700">
              <dt className="text-[11px] font-bold text-slate-400 uppercase">Maosh</dt>
              <dd className="font-bold text-slate-900 dark:text-white mt-0.5">
                {vacancy.salary || 'Kelishilgan'}
              </dd>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-100 dark:border-slate-700">
              <dt className="text-[11px] font-bold text-slate-400 uppercase">Bandlik</dt>
              <dd className="font-bold text-slate-900 dark:text-white mt-0.5">
                {vacancy.job_type || 'Full-time'}
              </dd>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-100 dark:border-slate-700">
              <dt className="text-[11px] font-bold text-slate-400 uppercase">Tajriba</dt>
              <dd className="font-bold text-slate-900 dark:text-white mt-0.5">
                {vacancy.experience || 'Ko‘rsatilmagan'}
              </dd>
            </div>
          </dl>

          <section className="space-y-2">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Lavozim tavsifi
            </h2>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {vacancy.description}
            </p>
          </section>

          {vacancy.tags && (
            <p className="text-xs text-slate-500">
              Teglar: <span className="font-semibold text-slate-700 dark:text-slate-300">{vacancy.tags}</span>
            </p>
          )}

          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href={`/?vacancy=${vacancy.id}`}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/25"
            >
              WZone’da ariza topshirish
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200"
            >
              Barcha vakansiyalar
            </Link>
          </div>
        </article>

        <p className="text-xs text-slate-500 text-center">
          Ushbu sahifa qidiruv tizimlari uchun optimallashtirilgan. Asosiy platforma:{' '}
          <a href={absoluteUrl('/')} className="text-blue-600 font-semibold">
            wzone.uz
          </a>
        </p>
      </div>
    </main>
  );
}
