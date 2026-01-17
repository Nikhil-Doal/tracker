import axios from 'axios';
import type {
  AuthResponse,
  User,
  Event,
  EventsResponse,
  DashboardData,
  TimeSpentData,
  ProductivityData,
  DailySummary,
  ProductivityInsights,
  WeeklyReport,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: async (email: string, name: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/register', { email, name, password });
    return data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },

  getCurrentUser: async (): Promise<{ user: User }> => {
    const { data } = await api.get('/auth/me');
    return data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
};

// Events APIs
export const eventsAPI = {
  getEvents: async (params?: {
    start_date?: string;
    end_date?: string;
    type?: string;
    limit?: number;
    skip?: number;
  }): Promise<EventsResponse> => {
    const { data } = await api.get('/events/', { params });
    return data;
  },

  getCount: async (): Promise<{ count: number }> => {
    const { data } = await api.get('/events/count');
    return data;
  },

  getRecent: async (hours = 24): Promise<{ events: Event[]; count: number }> => {
    const { data } = await api.get(`/events/recent?hours=${hours}`);
    return data;
  },

  getTopDomains: async (limit = 10): Promise<{ domains: Array<{ domain: string; count: number; lastVisit?: string }> }> => {
    const { data } = await api.get(`/events/domains?limit=${limit}`);
    return data;
  },
};

// Analytics APIs
export const analyticsAPI = {
  getDashboard: async (days = 7): Promise<DashboardData> => {
    const { data } = await api.get(`/analytics/dashboard?days=${days}`);
    return data;
  },

  getTimeSpent: async (days = 7): Promise<TimeSpentData> => {
    const { data } = await api.get(`/analytics/time-spent?days=${days}`);
    return data;
  },

  getProductivity: async (days = 7): Promise<ProductivityData> => {
    const { data } = await api.get(`/analytics/productivity?days=${days}`);
    return data;
  },

  getPatterns: async (days = 30): Promise<{
    most_active_hour: number | null;
    most_active_day: string | null;
    patterns: {
      peak_hour: { _id: number; count: number } | null;
      peak_day: { _id: number; count: number } | null;
    };
  }> => {
    const { data } = await api.get(`/analytics/patterns?days=${days}`);
    return data;
  },
};

// AI APIs
export const aiAPI = {
  getDailySummary: async (date?: string): Promise<DailySummary> => {
    const params = date ? `?date=${date}` : '';
    const { data } = await api.get(`/ai/daily-summary${params}`);
    return data;
  },

  getProductivityInsights: async (days = 7): Promise<ProductivityInsights> => {
    const { data } = await api.get(`/ai/productivity-insights?days=${days}`);
    return data;
  },

  getWeeklyReport: async (): Promise<WeeklyReport> => {
    const { data } = await api.get('/ai/weekly-report');
    return data;
  },
};

export default api;