import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { backendGet, siteUrl } from '../../../lib/server';

// Public, server-rendered vacancy page: what search engines index and what shared links open.

type Vacancy = {
  id: string;
  title: string;
  company: string;
  location?: string;
  description?: string;
  salary?: string;
  category?: string;
  job_type?: string;
  experience?: string;
  tags?: string;
  source?: string;
  source_url?: string;
  created_by?: string;
  created_at: string;
};

async function loadVacancy(id: string): Promise<Vacancy | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const data = await backendGet<{ vacancy: Vacancy }>(`/vacancies/${id}`);
  return data?.vacancy ?? null;
}

function summary(v: Vacancy): string {
  const text = (v.description || '').replace(/\s+/g, ' ').trim();
  const head = `${v.company}${v.location ? `, ${v.location}` : ''}${v.salary ? ` — ${v.salary}` : ''}.`;
  return `${head} ${text}`.slice(0, 200);
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const v = await loadVacancy(params.id);
  if (!v) return { title: 'Vakansiya topilmadi — WZone', robots: { index: false } };
  const url = `${siteUrl()}/vacancies/${v.id}`;
  const title = `${v.title} — ${v.company} | WZone`;
  return {
    title,
    description: summary(v),
    alternates: { canonical: url },
    openGraph: { title, description: summary(v), url, type: 'article', siteName: 'WZone' },
  };
}

const EMPLOYMENT_TYPES: Record<string, string> = {
  'Full-time': 'FULL_TIME',
  'Part-time': 'PART_TIME',
  Remote: 'FULL_TIME',
  Gibrid: 'FULL_TIME',
};

export default async function VacancyPage({ params }: { params: { id: string } }) {
  const v = await loadVacancy(params.id);
  if (!v) notFound();

  const posted = new Date(v.created_at);
  const validThrough = new Date(posted.getTime() + 30 * 24 * 60 * 60 * 1000);
  const jobPosting = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: v.title,
    description: (v.description || v.title).replace(/\n/g, '<br>'),
    datePosted: posted.toISOString(),
    validThrough: validThrough.toISOString(),
    employmentType: EMPLOYMENT_TYPES[v.job_type || ''] || 'FULL_TIME',
    hiringOrganization: { '@type': 'Organization', name: v.company },
    jobLocation: {
      '@type': 'Place',
      address: { '@type': 'PostalAddress', addressLocality: v.location || 'Toshkent', addressCountry: 'UZ' },
    },
    ...(v.job_type === 'Remote' ? { jobLocationType: 'TELECOMMUTE', applicantLocationRequirements: { '@type': 'Country', name: 'UZ' } } : {}),
    identifier: { '@type': 'PropertyValue', name: 'WZone', value: v.id },
  };
  // Escape "<" so the JSON cannot close the script tag
  const jsonLd = JSON.stringify(jobPosting).replace(/</g, '\\u003c');

  const imported = !v.created_by && typeof v.source_url === 'string' && v.source_url.startsWith('https://');
  const tags = (v.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
  const facts = [
    ['Maosh', v.salary || 'Kelishilgan'],
    ['Hudud', v.location],
    ['Bandlik', v.job_type],
    ['Tajriba', v.experience],
    ['Soha', v.category],
  ].filter(([, value]) => value) as [string, string][];

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <article className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
        <nav className="text-xs">
          <Link href="/" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
            ← WZone — barcha vakansiyalar
          </Link>
        </nav>

        <header className="space-y-1">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{v.company}</p>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{v.title}</h1>
          <p className="text-xs text-slate-400">
            E’lon qilingan: {posted.toLocaleDateString('uz-UZ')}
            {v.source && v.source !== 'WZone' ? ` • Manba: ${v.source}` : ''}
          </p>
        </header>

        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {facts.map(([label, value]) => (
            <div key={label} className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 p-3">
              <dt className="text-[11px] text-slate-500">{label}</dt>
              <dd className="text-sm font-bold text-slate-800 dark:text-slate-100">{value}</dd>
            </div>
          ))}
        </dl>

        {v.description && (
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Vakansiya tavsifi</h2>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-line">{v.description}</p>
          </section>
        )}

        {tags.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li key={tag} className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold">
                {tag}
              </li>
            ))}
          </ul>
        )}

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-3">
          {imported ? (
            <a
              href={v.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm"
            >
              {v.source} saytida ariza topshirish
            </a>
          ) : (
            <Link href={`/?vacancy=${v.id}`} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm">
              Ariza topshirish
            </Link>
          )}
        </div>
      </article>
    </main>
  );
}
