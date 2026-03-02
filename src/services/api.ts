import { User, Category, Entry, Goal, Journal, SummaryStats, Flashcard, DetailedAnalytics, Resource, ReadingListItem } from '../types';

const API_BASE = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'X-Auth-Token': token } : {}),
  };
};

const handleResponse = async (res: Response) => {
  console.log(`API Response: ${res.status} ${res.url}`);
  
  // Only handle as session expiration if NOT an auth endpoint
  if ((res.status === 401 || res.status === 403) && !res.url.includes('/auth/')) {
    console.log('Auth failure detected, clearing session');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/'; // Force reload to show login
    throw new Error('Session expired. Please log in again.');
  }
  
  if (!res.ok) {
    const text = await res.text();
    console.error(`API Error Response: ${text}`);
    let errorMessage = `Request failed with status ${res.status}`;
    try {
      const json = JSON.parse(text);
      if (json.error) {
        errorMessage = json.error;
      }
    } catch (e) {
      errorMessage = `${errorMessage}: ${text.substring(0, 100)}`;
    }
    throw new Error(errorMessage);
  }
  const data = await res.json();
  console.log('API Success Data:', data);
  return data;
};

export const api = {
  auth: {
    register: (data: any) => fetch(`${API_BASE}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(handleResponse),
    login: (data: any) => fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(handleResponse),
  },
  categories: {
    list: (): Promise<Category[]> => fetch(`${API_BASE}/categories`, { headers: getHeaders() }).then(handleResponse),
    create: (name: string): Promise<Category> => fetch(`${API_BASE}/categories`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ name }) }).then(handleResponse),
    delete: (id: number) => fetch(`${API_BASE}/categories/${id}`, { method: 'DELETE', headers: getHeaders() }).then(res => res.ok || handleResponse(res)),
  },
  entries: {
    list: (): Promise<Entry[]> => fetch(`${API_BASE}/entries`, { headers: getHeaders() }).then(handleResponse),
    create: (data: Partial<Entry>): Promise<Entry> => fetch(`${API_BASE}/entries`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
    delete: (id: number) => fetch(`${API_BASE}/entries/${id}`, { method: 'DELETE', headers: getHeaders() }).then(res => res.ok || handleResponse(res)),
  },
  goals: {
    list: (): Promise<Goal[]> => fetch(`${API_BASE}/goals`, { headers: getHeaders() }).then(handleResponse),
    create: (data: Partial<Goal>): Promise<Goal> => fetch(`${API_BASE}/goals`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
    delete: (id: number) => fetch(`${API_BASE}/goals/${id}`, { method: 'DELETE', headers: getHeaders() }).then(res => res.ok || handleResponse(res)),
  },
  journals: {
    get: (date: string): Promise<Journal | null> => fetch(`${API_BASE}/journals/${date}`, { headers: getHeaders() }).then(handleResponse),
    save: (data: Partial<Journal>) => fetch(`${API_BASE}/journals`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  },
  analytics: {
    summary: (): Promise<SummaryStats> => fetch(`${API_BASE}/analytics/summary`, { headers: getHeaders() }).then(handleResponse),
    detailed: (): Promise<DetailedAnalytics> => fetch(`${API_BASE}/analytics/detailed`, { headers: getHeaders() }).then(handleResponse),
  },
  flashcards: {
    list: (): Promise<Flashcard[]> => fetch(`${API_BASE}/flashcards`, { headers: getHeaders() }).then(handleResponse),
    due: (): Promise<Flashcard[]> => fetch(`${API_BASE}/flashcards/due`, { headers: getHeaders() }).then(handleResponse),
    create: (data: Partial<Flashcard>): Promise<Flashcard> => fetch(`${API_BASE}/flashcards`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
    update: (id: number, data: Partial<Flashcard>): Promise<Flashcard> => fetch(`${API_BASE}/flashcards/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
    review: (id: number, quality: number): Promise<any> => fetch(`${API_BASE}/flashcards/${id}/review`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ quality }) }).then(handleResponse),
    delete: (id: number) => fetch(`${API_BASE}/flashcards/${id}`, { method: 'DELETE', headers: getHeaders() }).then(res => res.ok || handleResponse(res)),
  },
  resources: {
    list: (): Promise<Resource[]> => fetch(`${API_BASE}/resources`, { headers: getHeaders() }).then(handleResponse),
    create: (data: Partial<Resource>): Promise<Resource> => fetch(`${API_BASE}/resources`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
    delete: (id: number) => fetch(`${API_BASE}/resources/${id}`, { method: 'DELETE', headers: getHeaders() }).then(res => res.ok || handleResponse(res)),
  },
  readingList: {
    list: (): Promise<ReadingListItem[]> => fetch(`${API_BASE}/reading-list`, { headers: getHeaders() }).then(handleResponse),
    create: (data: Partial<ReadingListItem>): Promise<ReadingListItem> => fetch(`${API_BASE}/reading-list`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
    update: (id: number, data: Partial<ReadingListItem>): Promise<ReadingListItem> => fetch(`${API_BASE}/reading-list/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
    delete: (id: number) => fetch(`${API_BASE}/reading-list/${id}`, { method: 'DELETE', headers: getHeaders() }).then(res => res.ok || handleResponse(res)),
  },
};
