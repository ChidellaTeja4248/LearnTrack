import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Category, Entry } from '../types';
import { Plus, X, Loader2, Calendar, Clock, FileText, BarChart, Link as LinkIcon, Youtube, Trash2 } from 'lucide-react';

interface EntryFormProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function EntryForm({ onSuccess, onClose }: EntryFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    category_id: '',
    date: new Date().toISOString().split('T')[0],
    duration_minutes: '',
    description: '',
    difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard'
  });

  const [resources, setResources] = useState<{ title: string; url: string; type: string }[]>([]);
  const [newResource, setNewResource] = useState({ title: '', url: '', type: 'documentation' });

  useEffect(() => {
    api.categories.list().then(data => {
      setCategories(data);
      if (data.length > 0) setFormData(prev => ({ ...prev, category_id: data[0].id.toString() }));
      setLoading(false);
    });
  }, []);

  const addResource = () => {
    if (!newResource.title || !newResource.url) return;
    setResources([...resources, newResource]);
    setNewResource({ title: '', url: '', type: 'documentation' });
  };

  const removeResource = (index: number) => {
    setResources(resources.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category_id) return alert('Please select a category');
    setSubmitting(true);
    try {
      await api.entries.create({
        ...formData,
        category_id: parseInt(formData.category_id),
        duration_minutes: parseInt(formData.duration_minutes),
        resources: resources as any
      });
      onSuccess();
      onClose();
    } catch (err) {
      alert('Failed to save entry');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8 overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
          <h2 className="text-xl font-bold text-zinc-900">Add Learning Entry</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 flex items-center gap-2">
                <BarChart className="w-3 h-3" /> Category
              </label>
              <select
                required
                className="w-full px-4 py-2 rounded-lg border border-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.category_id}
                onChange={e => setFormData({ ...formData, category_id: e.target.value })}
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Date
              </label>
              <input
                type="date"
                required
                className="w-full px-4 py-2 rounded-lg border border-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 flex items-center gap-2">
                <Clock className="w-3 h-3" /> Duration (min)
              </label>
              <input
                type="number"
                required
                min="1"
                className="w-full px-4 py-2 rounded-lg border border-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.duration_minutes}
                onChange={e => setFormData({ ...formData, duration_minutes: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Difficulty</label>
              <select
                className="w-full px-4 py-2 rounded-lg border border-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.difficulty}
                onChange={e => setFormData({ ...formData, difficulty: e.target.value as any })}
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 flex items-center gap-2">
              <FileText className="w-3 h-3" /> What did you learn?
            </label>
            <textarea
              rows={2}
              className="w-full px-4 py-2 rounded-lg border border-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Resource Links Section */}
          <div className="space-y-3 pt-4 border-t border-zinc-100">
            <label className="block text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
              <LinkIcon className="w-3 h-3" /> Attach Resources (Optional)
            </label>
            
            <div className="space-y-2">
              {resources.map((res, i) => (
                <div key={i} className="flex items-center justify-between bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                  <div className="flex items-center gap-2">
                    {res.type === 'youtube' ? <Youtube className="w-3 h-3 text-red-500" /> : <LinkIcon className="w-3 h-3 text-zinc-400" />}
                    <span className="text-xs font-medium text-zinc-700 truncate max-w-[200px]">{res.title}</span>
                  </div>
                  <button type="button" onClick={() => removeResource(i)} className="text-zinc-400 hover:text-red-500">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Title (e.g. Tutorial)"
                className="md:col-span-1 px-3 py-1.5 text-xs rounded-lg border border-zinc-200 outline-none"
                value={newResource.title}
                onChange={e => setNewResource({ ...newResource, title: e.target.value })}
              />
              <input
                type="url"
                placeholder="URL"
                className="md:col-span-1 px-3 py-1.5 text-xs rounded-lg border border-zinc-200 outline-none"
                value={newResource.url}
                onChange={e => setNewResource({ ...newResource, url: e.target.value })}
              />
              <div className="flex gap-2">
                <select
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-zinc-200 outline-none"
                  value={newResource.type}
                  onChange={e => setNewResource({ ...newResource, type: e.target.value })}
                >
                  <option value="documentation">Docs</option>
                  <option value="youtube">YouTube</option>
                  <option value="pdf">PDF</option>
                  <option value="other">Other</option>
                </select>
                <button
                  type="button"
                  onClick={addResource}
                  className="p-1.5 bg-zinc-100 text-zinc-600 rounded-lg hover:bg-zinc-200"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            Save Entry
          </button>
        </form>
      </div>
    </div>
  );
}
