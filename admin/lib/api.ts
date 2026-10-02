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

export interface Application {
  id: string;
  user_id: string;
  vacancy_id: string;
  status: string;
  created_at: string;
}

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('workhub_admin_token');
}

export function setAdminToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('workhub_admin_token', token);
}

export function clearAdminToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('workhub_admin_token');
  window.location.reload();
}

function authHeaders(): Record<string, string> {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// adminLogin signs in with email/password and only keeps the token for admins.
export async function adminLogin(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { ok: false, error: json.error || 'Login failed' };
    }
    if (json.data?.user?.role !== 'admin') {
      return { ok: false, error: 'This account does not have admin access' };
    }
    setAdminToken(json.data.token);
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Network error' };
  }
}

export async function verifyAdminSession(): Promise<boolean> {
  if (!getAdminToken()) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders(), cache: 'no-store' });
    if (!res.ok) return false;
    const json = await res.json();
    return json.data?.user?.role === 'admin';
  } catch {
    return false;
  }
}

export async function fetchApplications(): Promise<Application[]> {
  try {
    const res = await fetch(`${API_BASE}/applications`, { headers: authHeaders(), cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data?.applications || [];
  } catch (err) {
    console.error('Failed to fetch applications:', err);
    return [];
  }
}

export async function fetchUsers(): Promise<User[]> {
  try {
    const res = await fetch(`${API_BASE}/admin/users`, { headers: authHeaders(), cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data?.users || [];
  } catch (err) {
    console.error('Failed to fetch users:', err);
    return [];
  }
}

export async function fetchAnalytics(token?: string): Promise<AnalyticsData> {
  try {
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : authHeaders();

    const res = await fetch(`${API_BASE}/admin/analytics`, { headers, cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error('Failed to fetch analytics:', err);
    return { total_users: 0, total_vacancies: 0, total_applications: 0, total_resumes: 0 };
  }
}

export async function fetchVacancies(): Promise<Vacancy[]> {
  try {
    const res = await fetch(`${API_BASE}/vacancies?limit=100`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data?.vacancies || [];
  } catch (err) {
    console.error('Failed to fetch vacancies:', err);
    return [];
  }
}
