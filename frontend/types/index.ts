// User types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
  settings?: {
    sync_interval: number;
    categorization: Record<string, string>;
  };
}

export interface AuthResponse {
  message: string;
  user: User;
  access_token: string;
  refresh_token: string;
}

// Event types
export interface Event {
  id: string;
  userId: string;
  type: string;
  timestamp: string;
  domain?: string;
  tabId?: number;
  windowId?: number;
  url?: string;
  title?: string;
}

export interface EventsResponse {
  events: Event[];
  total: number;
  limit: number;
  skip: number;
}

// Analytics types
export interface DashboardData {
  period: {
    start: string;
    end: string;
    days: number;
  };
  total_events: number;
  daily_events: Array<{
    date: string;
    count: number;
  }>;
  top_domains: Array<{
    domain: string;
    count: number;
  }>;
  event_types: Array<{
    type: string;
    count: number;
  }>;
  hourly_activity: Array<{
    hour: number;
    count: number;
  }>;
}

export interface TimeSpentData {
  time_spent: Array<{
    domain: string;
    minutes: number;
    hours: number;
  }>;
  total_minutes: number;
}

export interface ProductivityData {
  score: number;
  productive_events: number;
  social_events: number;
  total_events: number;
  productive_percentage: number;
  social_percentage: number;
}

// AI Insights types
export interface DailySummary {
  summary: string;
  date: string;
  event_count: number;
}

export interface ProductivityInsights {
  insights: string;
  productivity_score: number;
  time_spent: {
    total_minutes: number;
    productive_minutes: number;
    social_minutes: number;
  };
}

export interface WeeklyReport {
  report: {
    summary: string;
    highlights: string[];
    recommendations: string[];
  };
  data: {
    total_events: number;
    top_domains: Array<{ domain: string; count: number }>;
    productivity_score: number;
    peak_hour: string;
    peak_day: string;
  };
  period: {
    start: string;
    end: string;
  };
}