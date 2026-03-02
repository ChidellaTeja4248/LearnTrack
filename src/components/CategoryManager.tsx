import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Category } from '../types';
import { Plus, Trash2, Tag, Loader2 } from 'lucide-react';

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const data = await api.categories.list();
      setCategories(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubmitting(true);
    try {
      const created = await api.categories.create(newName);
      setCategories([...categories, created]);
      setNewName('');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure? This will delete all entries in this category.')) return;
    await api.categories.delete(id);
    setCategories(categories.filter(c => c.id !== id));
  }

  if (loading) return <div className="p-8 text-center">Loading categories...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <header>
        <h2 className="text-2xl font-bold text-zinc-900">Categories</h2>
        <p className="text-zinc-500">Manage your learning subjects.</p>
      </header>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          placeholder="New category name (e.g. DSA)"
          className="flex-1 px-4 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button
          type="submit"
          disabled={submitting}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          Add
        </button>
      </form>

      <div className="grid gap-3">
        {categories.map(category => (
          <div key={category.id} className="bg-white p-4 rounded-xl border border-zinc-100 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-3">
              <Tag className="w-5 h-5 text-zinc-400" />
              <span className="font-medium text-zinc-800">{category.name}</span>
            </div>
            <button
              onClick={() => handleDelete(category.id)}
              className="text-zinc-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-center text-zinc-400 py-8">No categories yet. Add one to get started!</p>
        )}
      </div>
    </div>
  );
}
