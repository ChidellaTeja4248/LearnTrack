export interface User {
  id: number;
  email: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface Entry {
  id: number;
  category_id: number;
  category_name?: string;
  date: string;
  duration_minutes: number;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  resources?: Resource[];
}

export interface Resource {
  id: number;
  entry_id?: number;
  title: string;
  url: string;
  type: 'youtube' | 'documentation' | 'pdf' | 'other';
  created_at: string;
}

export interface ReadingListItem {
  id: number;
  category_id: number | null;
  category_name?: string;
  topic: string;
  status: 'to-learn' | 'learning' | 'learned';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
}

export interface Goal {
  id: number;
  category_id: number | null;
  category_name?: string;
  type: 'weekly' | 'monthly';
  target_minutes: number;
  start_date: string;
}

export interface Journal {
  id: number;
  date: string;
  understood: string;
  struggled: string;
  revision: string;
}

export interface SummaryStats {
  today_minutes: number;
  week_minutes: number;
  month_minutes: number;
  mostFocused: { name: string; total: number } | null;
  streak: number;
}

export interface Flashcard {
  id: number;
  category_id: number;
  category_name?: string;
  front: string;
  back: string;
  next_review: string;
  interval: number;
  ease_factor: number;
}

export interface DetailedAnalytics {
  heatmap: { date: string; value: number }[];
  trends: { date: string; total: number }[];
  difficulty: { name: string; value: number }[];
  categories: { name: string; value: number }[];
}
