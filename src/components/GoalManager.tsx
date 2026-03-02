import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Category, Goal, Entry } from '../types';
import { Target, Plus, Loader2, CheckCircle2, TrendingUp, Trash2 } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export default function GoalManager() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    category_id: '',
    type: 'weekly' as 'weekly' | 'monthly',
    target_hours: '',
    start_date: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [g, c, e] = await Promise.all([
          api.goals.list(),
          api.categories.list(),
          api.entries.list()
        ]);
        setGoals(g);
        setCategories(c);
        setEntries(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await api.goals.create({
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        type: formData.type,
        target_minutes: parseFloat(formData.target_hours) * 60,
        start_date: formData.start_date
      });
      setGoals([...goals, created]);
      setFormData({ ...formData, target_hours: '' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    await api.goals.delete(id);
    setGoals(goals.filter(g => g.id !== id));
  };

  const calculateProgress = (goal: Goal) => {
    const start = goal.type === 'weekly' ? startOfWeek(new Date(goal.start_date)) : startOfMonth(new Date(goal.start_date));
    const end = goal.type === 'weekly' ? endOfWeek(new Date(goal.start_date)) : endOfMonth(new Date(goal.start_date));
    
    const relevantEntries = entries.filter(e => {
      const entryDate = new Date(e.date);
      const isWithinRange = entryDate >= start && entryDate <= end;
      const isCorrectCategory = goal.category_id ? e.category_id === goal.category_id : true;
      return isWithinRange && isCorrectCategory;
    });

    const totalMinutes = relevantEntries.reduce((sum, e) => sum + e.duration_minutes, 0);
    return Math.min(100, (totalMinutes / goal.target_minutes) * 100);
  };

  if (loading) return <div className="p-8 text-center">Loading goals...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <header>
        <h2 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
          <Target className="text-emerald-600" /> Goal Setting
        </h2>
        <p className="text-zinc-500">Set and track your learning goals.</p>
      </header>

      <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Set a New Goal</h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Category</label>
            <select
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500"
              value={formData.category_id}
              onChange={e => setFormData({ ...formData, category_id: e.target.value })}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Type</label>
            <select
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500"
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value as any })}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Target (Hours)</label>
            <input
              type="number"
              step="0.5"
              required
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500"
              value={formData.target_hours}
              onChange={e => setFormData({ ...formData, target_hours: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              Set Goal
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map(goal => {
          const progress = calculateProgress(goal);
          return (
            <div key={goal.id} className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${goal.type === 'weekly' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                    {goal.type} Goal
                  </span>
                  <h4 className="text-lg font-bold text-zinc-800 mt-2">
                    {goal.category_name || 'All Subjects'}
                  </h4>
                </div>
                <div className="flex gap-2">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-zinc-900">{Math.round(progress)}%</p>
                    <p className="text-xs text-zinc-400">Target: {goal.target_minutes / 60}h</p>
                  </div>
                  <button 
                    onClick={() => handleDelete(goal.id)}
                    className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="w-full bg-zinc-100 h-3 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${progress >= 100 ? 'bg-emerald-500' : 'bg-emerald-400'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-sm">
                <p className="text-zinc-500 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" /> Keep going!
                </p>
                {progress >= 100 && (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Goal Met
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {goals.length === 0 && (
          <p className="col-span-full text-center text-zinc-400 py-12 bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200">
            No goals set yet. Challenge yourself!
          </p>
        )}
      </div>
    </div>
  );
}
