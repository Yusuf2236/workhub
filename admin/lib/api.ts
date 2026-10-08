// Without NEXT_PUBLIC_API_URL the admin talks to the API on the same host: the backend
// port locally, and the nginx /api/v1 route on a server.
function resolveApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window === 'undefined') return 'http://localhost:8080/api/v1';
  const { protocol, hostname } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return `${protocol}//${hostname}:8080/api/v1`;
  return `${protocol}//${hostname}/api/v1`;
}

const API_BASE = resolveApiBase();

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
  source?: string;
  is_verified?: boolean;
  is_featured?: boolean;
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
  cover_letter?: string;
  vacancy_title?: string;
  vacancy_company?: string;
  applicant_name?: string;
  applicant_email?: string;
}

export const APPLICATION_STATUSES = ['submitted', 'reviewing', 'interview', 'accepted', 'rejected'] as const;

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

export async function fetchVacancies(query = ''): Promise<Vacancy[]> {
  try {
    const params = new URLSearchParams({ limit: '100' });
    if (query.trim()) params.set('q', query.trim());
    const res = await fetch(`${API_BASE}/vacancies?${params.toString()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data?.vacancies || [];
  } catch (err) {
    console.error('Failed to fetch vacancies:', err);
    return [];
  }
}

async function sendJSON(method: string, path: string, body?: unknown): Promise<{ ok: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) return { ok: false, error: json.error || `HTTP ${res.status}` };
    return { ok: true, data: json.data };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Network error' };
  }
}

export async function updateVacancy(id: string, changes: Partial<Vacancy>) {
  return sendJSON('PUT', `/vacancies/${id}`, changes);
}

export async function deleteVacancy(id: string) {
  return sendJSON('DELETE', `/vacancies/${id}`);
}

export async function updateApplicationStatus(id: string, status: string) {
  return sendJSON('PATCH', `/applications/${id}/status`, { status });
}
