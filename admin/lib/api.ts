const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export interface AnalyticsData {
  total_users: number;
  total_vacancies: number;
  total_applications: number;
  total_resumes: number;
}

export interface Vacancy {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export async function fetchAnalytics(token?: string): Promise<AnalyticsData> {
  try {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/admin/analytics`, { headers, cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error('Failed to fetch analytics:', err);
    return { total_users: 1, total_vacancies: 1, total_applications: 1, total_resumes: 1 };
  }
}

export async function fetchVacancies(): Promise<Vacancy[]> {
  try {
    const res = await fetch(`${API_BASE}/vacancies`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data?.vacancies || [];
  } catch (err) {
    console.error('Failed to fetch vacancies:', err);
    return [];
  }
}
