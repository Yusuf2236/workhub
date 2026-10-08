import type { MetadataRoute } from 'next';
import { backendGet, siteUrl } from '../lib/server';

// Lists the home page and every vacancy page for search engines (regenerated hourly).
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const data = await backendGet<{ vacancies: { id: string; updated_at: string }[] }>('/vacancies/sitemap', 3600);
  return [
    { url: `${base}/`, changeFrequency: 'hourly', priority: 1 },
    ...(data?.vacancies || []).map((v) => ({
      url: `${base}/vacancies/${v.id}`,
      lastModified: new Date(v.updated_at),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
  ];
}
