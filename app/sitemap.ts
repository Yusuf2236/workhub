import type { MetadataRoute } from 'next';
import { SITE_URL } from '../lib/seo';

type Vacancy = {
  id: string;
  updated_at?: string;
  created_at?: string;
  is_featured?: boolean;
};

async function fetchVacancies(): Promise<Vacancy[]> {
  const bases = [
    process.env.BACKEND_INTERNAL_URL,
    process.env.INTERNAL_API_URL?.replace(/\/api\/v1\/?$/, ''),
    'http://wzone_backend:8080',
    'http://127.0.0.1:18090',
    SITE_URL,
  ].filter(Boolean) as string[];

  for (const base of bases) {
    try {
      const url = `${base.replace(/\/$/, '')}/api/v1/vacancies`;
      const res = await fetch(url, {
        next: { revalidate: 300 },
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) continue;
      const json = await res.json();
      const list = json?.data?.vacancies || json?.vacancies || [];
      if (Array.isArray(list) && list.length) return list;
    } catch {
      // try next base
    }
  }
  return [];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/job`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
  ];

  const vacancies = await fetchVacancies();
  const jobRoutes: MetadataRoute.Sitemap = vacancies
    .filter((v) => v?.id)
    .map((v) => ({
      url: `${SITE_URL}/job/${v.id}`,
      lastModified: new Date(v.updated_at || v.created_at || now),
      changeFrequency: 'daily' as const,
      priority: v.is_featured ? 0.9 : 0.8,
    }));

  return [...staticRoutes, ...jobRoutes];
}
