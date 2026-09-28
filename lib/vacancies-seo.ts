import { SITE_URL } from './seo';

export type VacancySeo = {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary?: string;
  category?: string;
  job_type?: string;
  experience?: string;
  tags?: string;
  is_verified?: boolean;
  is_featured?: boolean;
  created_at?: string;
  updated_at?: string;
};

function apiBases(): string[] {
  return [
    process.env.BACKEND_INTERNAL_URL,
    process.env.INTERNAL_API_URL?.replace(/\/api\/v1\/?$/, ''),
    'http://wzone_backend:8080',
    'http://127.0.0.1:18090',
    SITE_URL,
  ].filter(Boolean) as string[];
}

export async function getVacancyById(id: string): Promise<VacancySeo | null> {
  for (const base of apiBases()) {
    try {
      const listUrl = `${base.replace(/\/$/, '')}/api/v1/vacancies`;
      const res = await fetch(listUrl, {
        next: { revalidate: 300 },
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) continue;
      const json = await res.json();
      const list: VacancySeo[] = json?.data?.vacancies || json?.vacancies || [];
      const found = list.find((v) => v.id === id);
      if (found) return found;
    } catch {
      // try next
    }
  }
  return null;
}

export async function listVacancies(limit = 100): Promise<VacancySeo[]> {
  for (const base of apiBases()) {
    try {
      const listUrl = `${base.replace(/\/$/, '')}/api/v1/vacancies`;
      const res = await fetch(listUrl, {
        next: { revalidate: 300 },
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) continue;
      const json = await res.json();
      const list: VacancySeo[] = json?.data?.vacancies || json?.vacancies || [];
      if (Array.isArray(list) && list.length) return list.slice(0, limit);
    } catch {
      // try next
    }
  }
  return [];
}

export function buildJobPostingJsonLd(v: VacancySeo) {
  const datePosted = v.created_at || new Date().toISOString();
  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: v.title,
    description: v.description || `${v.title} — ${v.company}`,
    datePosted,
    validThrough: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    employmentType: mapEmploymentType(v.job_type),
    hiringOrganization: {
      '@type': 'Organization',
      name: v.company || 'WZone',
      sameAs: SITE_URL,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: v.location || 'Oʻzbekiston',
        addressCountry: 'UZ',
      },
    },
    applicantLocationRequirements: {
      '@type': 'Country',
      name: 'Uzbekistan',
    },
    industry: v.category || undefined,
    identifier: {
      '@type': 'PropertyValue',
      name: 'WZone',
      value: v.id,
    },
    url: `${SITE_URL}/job/${v.id}`,
    directApply: true,
    baseSalary: v.salary
      ? {
          '@type': 'MonetaryAmount',
          currency: 'UZS',
          value: {
            '@type': 'QuantitativeValue',
            unitText: 'MONTH',
            value: v.salary,
          },
        }
      : undefined,
  };
}

function mapEmploymentType(jobType?: string): string {
  const t = (jobType || '').toLowerCase();
  if (t.includes('part')) return 'PART_TIME';
  if (t.includes('remote')) return 'CONTRACTOR';
  if (t.includes('gibrid') || t.includes('hybrid')) return 'OTHER';
  return 'FULL_TIME';
}
