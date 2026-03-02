import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Journal } from '../types';
import { BookOpen, Save, CheckCircle2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function DailyJournal() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [journal, setJournal] = useState<Partial<Journal>>({
    understood: '',
    struggled: '',
    revision: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchJournal() {
      setLoading(true);
      try {
        const data = await api.journals.get(date);
        if (data) {
          setJournal(data);
        } else {
          setJournal({ understood: '', struggled: '', revision: '' });
        }
      } finally {
        setLoading(false);
      }
    }
    fetchJournal();
  }, [date]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.journals.save({ ...journal, date });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <BookOpen className="text-emerald-600" /> Daily Reflection
          </h2>
          <p className="text-zinc-500">Reflect on your learning for the day.</p>
        </div>
        <input
          type="date"
          className="px-4 py-2 rounded-lg border border-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </header>

      {loading ? (
        <div className="text-center py-12">Loading reflection...</div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">What I understood today</label>
              <textarea
                rows={4}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                placeholder="Key concepts, breakthroughs..."
                value={journal.understood}
                onChange={e => setJournal({ ...journal, understood: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">What I struggled with</label>
              <textarea
                rows={4}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                placeholder="Difficult topics, bugs, roadblocks..."
                value={journal.struggled}
                onChange={e => setJournal({ ...journal, struggled: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">What to revise tomorrow</label>
              <textarea
                rows={4}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                placeholder="Follow-up tasks, revision list..."
                value={journal.revision}
                onChange={e => setJournal({ ...journal, revision: e.target.value })}
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : saved ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Reflection
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
