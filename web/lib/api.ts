const API_BASE =
  typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:8080/api/v1' : '/api/v1'))
    : (process.env.INTERNAL_API_URL || 'http://localhost:8080/api/v1');

// Uploaded files are served by the backend; locally it runs on its own port
export function resolveUploadUrl(path?: string): string {
  if (!path) return '';
  if (!path.startsWith('/uploads/') || typeof window === 'undefined') return path;
  const local = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return `${local ? 'http://localhost:8080' : ''}${path}`;
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('workhub_token');
}

export function setAuthToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('workhub_token', token);
  window.dispatchEvent(new Event('workhub_auth_changed'));
}

export function removeAuthToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('workhub_token');
  localStorage.removeItem('workhub_user');
  window.dispatchEvent(new Event('workhub_auth_changed'));
}

export function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem('workhub_user');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setCurrentUser(user: any) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('workhub_user', JSON.stringify(user));
  window.dispatchEvent(new Event('workhub_auth_changed'));
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<{ data: T; success: boolean; error?: string }> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });
    const result = await res.json();
    return result;
  } catch (err: any) {
    return { data: null as any, success: false, error: err.message || 'Tarmoq xatosi yuz berdi' };
  }
}

export const api = {
  // Vacancies
  async getVacancies(params?: {
    q?: string;
    category?: string;
    location?: string;
    job_type?: string;
    skills?: string[];
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.q) query.set('q', params.q);
    if (params?.category && params.category !== 'Barchasi') query.set('category', params.category);
    if (params?.location && params.location !== 'Barchasi' && params.location !== 'Barcha hududlar') query.set('location', params.location);
    if (params?.job_type && params.job_type !== 'Barchasi') query.set('job_type', params.job_type);
    if (params?.skills?.length) query.set('skills', params.skills.join(','));
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request<{
      vacancies: any[];
      total: number;
      page: number;
      limit: number;
      has_more: boolean;
    }>(`/vacancies${queryString}`);
  },

  async getVacancy(id: string) {
    return request<{ vacancy: any }>(`/vacancies/${id}`);
  },

  async getVacanciesByIds(ids: string[]) {
    if (ids.length === 0) return { success: true, data: { vacancies: [] as any[] } };
    return request<{ vacancies: any[] }>(`/vacancies?ids=${encodeURIComponent(ids.slice(0, 100).join(','))}`);
  },

  async getMyVacancies() {
    return request<{ vacancies: any[] }>('/vacancies/mine');
  },

  async updateVacancy(id: string, payload: Record<string, any>) {
    return request<{ vacancy: any }>(`/vacancies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteVacancy(id: string) {
    return request<{ deleted: boolean; id: string }>(`/vacancies/${id}`, {
      method: 'DELETE',
    });
  },

  async getVacancyComments(vacancyId: string) {
    return request<{ vacancy_id: string; comments: any[]; total: number }>(`/vacancies/${vacancyId}/comments`);
  },

  async getRecentComments(page = 1, limit = 10, category?: string) {
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (category) query.set('category', category);
    return request<{ comments: any[]; total: number; page: number; has_more: boolean }>(
      `/comments/recent?${query.toString()}`
    );
  },

  async createVacancyComment(vacancyId: string, payload: { content: string; author_name?: string; author_avatar?: string }) {
    return request<{ comment: any }>(`/vacancies/${vacancyId}/comments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async createVacancy(payload: {
    title: string;
    company: string;
    location: string;
    description: string;
    salary: string;
    category: string;
    job_type: string;
    experience: string;
    tags: string;
  }) {
    return request<{ vacancy: any }>('/vacancies', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async applyToVacancy(vacancyId: string, payload: { resume_id?: string; cover_letter?: string }) {
    return request<{ application: any }>(`/vacancies/${vacancyId}/apply`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Auth
  async login(payload: { email: string; password: string }) {
    return request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async register(payload: { name: string; email: string; password: string }) {
    return request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async googleAuth(payload: { email?: string; name?: string; avatar_url?: string; credential?: string; access_token?: string; code?: string; redirect_uri?: string }) {
    return request<{ user: any; token: string; provider: string }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getOneIDLoginUrl() {
    return request<{ auth_url: string; provider: string; state: string; is_live_configured: boolean; demo_mode: boolean; qr_enabled?: boolean }>('/auth/oneid/login');
  },

  async oneIDCallback(payload: {
    pinfl?: string;
    state?: string;
    full_name?: string;
    email?: string;
    phone?: string;
    location?: string;
    passport?: string;
    birth_date?: string;
    gender?: string;
    code?: string;
    account_type?: string;
    company_name?: string;
    inn?: string;
  }) {
    return request<{
      user: any;
      token: string;
      profile?: any;
      citizen?: any;
      provider: string;
      pinfl: string;
      birth_date?: string;
      gender?: string;
      location?: string;
      phone?: string;
      account_type?: string;
      company_name?: string;
      inn?: string;
    }>('/auth/oneid/callback', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async oneIDQRGenerate() {
    return request<{
      code: string;
      hash: string;
      qr_string: string;
    }>('/auth/oneid/qr/generate');
  },

  async oneIDQRCheck(payload: { code: string; hash: string }) {
    return request<{
      status: 'pending' | 'approved' | 'expired';
      user?: any;
      token?: string;
      message?: string;
      citizen?: {
        pinfl: string;
        full_name: string;
        birth_date: string;
        gender: string;
        location: string;
        phone: string;
        email: string;
      };
    }>('/auth/oneid/qr/check', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getMe() {
    return request<{ user: any }>('/auth/me');
  },

  // Signs out on the server (all devices) and clears the local session
  async logout() {
    try {
      if (getAuthToken()) await request('/auth/logout', { method: 'POST' });
    } finally {
      removeAuthToken();
    }
  },

  async forgotPassword(email: string) {
    return request<{ message: string }>('/auth/password/forgot', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(token: string, password: string) {
    return request<{ password_reset: boolean }>('/auth/password/reset', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  },

  async verifyEmail(token: string) {
    return request<{ email_verified: boolean }>('/auth/email/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  async resendVerification() {
    return request<{ sent?: boolean; email_verified?: boolean }>('/auth/email/resend', { method: 'POST' });
  },

  // Profile
  async getProfile() {
    return request<{ profile: any }>('/profile');
  },

  async updateProfile(payload: any) {
    return request<{ profile: any; user?: any }>('/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  // Applications
  async getApplications() {
    return request<{ applications: any[] }>('/applications');
  },

  // Applications sent to vacancies the current user posted
  async getReceivedApplications() {
    return request<{ applications: any[] }>('/applications/received');
  },

  async updateApplicationStatus(id: string, status: string) {
    return request<{ application: any }>(`/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Resumes
  async getResumes(all: boolean = true) {
    return request<{ resumes: any[] }>(`/resumes${all ? '?all=true' : ''}`);
  },

  async getResume(id: string) {
    return request<{ resume: any }>(`/resumes/${id}`);
  },

  async createResume(payload: { title: string; summary: string; file_url?: string }) {
    return request<{ resume: any }>('/resumes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateResume(id: string, payload: { title?: string; summary?: string; file_url?: string }) {
    return request<{ resume: any }>(`/resumes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteResume(id: string) {
    return request<{ deleted: boolean; id: string }>(`/resumes/${id}`, {
      method: 'DELETE',
    });
  },

  // With resumeId the file replaces that resume's attachment; otherwise a new resume is created
  async uploadResumeFile(file: File, title?: string, resumeId?: string) {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    if (resumeId) formData.append('resume_id', resumeId);

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE}/resumes/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // Notifications
  async getNotifications() {
    return request<{ notifications: any[] }>('/notifications');
  },

  async markNotificationRead(id: string) {
    return request<{ success: boolean }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  // Recommendations
  async getRecommendations() {
    return request<{ recommendations: any[]; needs_skills?: boolean }>('/vacancies/recommendations');
  },

  // Avatar Upload
  async uploadAvatar(file: File) {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('avatar', file);

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE}/profile/avatar`, {
        method: 'POST',
        headers,
        body: formData,
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // Chat
  async getChatRooms() {
    return request<{ rooms: any[] }>('/chat/rooms');
  },

  async getChatMessages(room: string = 'general') {
    return request<{ room_id: string; messages: any[] }>(`/chat/messages?room=${encodeURIComponent(room)}`);
  },

  async sendChatMessage(payload: { room_id?: string; content: string; sender_name?: string; sender_avatar?: string }) {
    return request<{ message: any }>('/chat/messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getChatHealth() {
    return request<{ status: string; active_rooms: number; active_users: number }>('/chat/health');
  },

  // Billing & Subscriptions
  async getBillingPlans() {
    return request<{ plans: any[] }>('/billing/plans');
  },

  async subscribe(plan: string, provider: string = 'click') {
    return request<{ subscription: any; payment: any }>('/billing/subscribe', {
      method: 'POST',
      body: JSON.stringify({ plan, provider }),
    });
  },

  async getMySubscription() {
    return request<{ subscription: any }>('/billing/my-subscription');
  },
};
