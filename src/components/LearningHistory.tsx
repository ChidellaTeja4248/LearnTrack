import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Entry } from '../types';
import { History, Calendar, Search, Filter, Clock, BookOpen, ChevronRight, Youtube, Link as LinkIcon } from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

export default function LearningHistory() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchEntries() {
      try {
        const data = await api.entries.list();
        setEntries(data);
      } finally {
        setLoading(false);
      }
    }
    fetchEntries();
  }, []);

  const filteredEntries = entries.filter(entry => {
    const entryDate = parseISO(entry.date);
    const matchesDate = (!startDate || entryDate >= startOfDay(parseISO(startDate))) &&
                        (!endDate || entryDate <= endOfDay(parseISO(endDate)));
    const matchesSearch = !searchQuery || 
                          entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          entry.category_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDate && matchesSearch;
  });

  // Group entries by date
  const groupedEntries = filteredEntries.reduce((groups: Record<string, Entry[]>, entry) => {
    const date = entry.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(entry);
    return groups;
  }, {});

  const sortedDates = Object.keys(groupedEntries).sort((a, b) => b.localeCompare(a));

  if (loading) return <div className="p-8 text-center">Loading history...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <History className="text-emerald-600" /> Learning History
          </h2>
          <p className="text-zinc-500">Review your learning journey over time.</p>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search topics..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">From Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="date"
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">To Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="date"
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {sortedDates.map(date => (
          <div key={date} className="relative pl-8 border-l-2 border-zinc-100 pb-4">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm" />
            <div className="mb-4">
              <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                {format(parseISO(date), 'EEEE, MMMM do, yyyy')}
              </h3>
              <p className="text-sm text-zinc-500">
                {groupedEntries[date].length} sessions • {groupedEntries[date].reduce((sum, e) => sum + e.duration_minutes, 0)} minutes total
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {Object.entries(
                groupedEntries[date].reduce((acc: Record<string, Entry[]>, entry) => {
                  const cat = entry.category_name || 'Uncategorized';
                  if (!acc[cat]) acc[cat] = [];
                  acc[cat].push(entry);
                  return acc;
                }, {})
              ).map(([categoryName, categoryEntries]) => {
                const totalMinutes = categoryEntries.reduce((sum, e) => sum + e.duration_minutes, 0);
                const firstEntry = categoryEntries[0];

                return (
                  <div key={categoryName} className="bg-white p-5 rounded-xl border border-zinc-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
                            {categoryName}
                          </span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                            firstEntry.difficulty === 'Easy' ? 'bg-green-50 text-green-600' :
                            firstEntry.difficulty === 'Medium' ? 'bg-amber-50 text-amber-600' :
                            'bg-red-50 text-red-600'
                          }`}>
                            {firstEntry.difficulty}
                          </span>
                        </div>
                        <div className="space-y-3">
                          {categoryEntries.map((entry) => (
                            <div key={entry.id} className="flex items-start gap-3">
                              {categoryEntries.length > 1 && (
                                <div className="mt-2 w-1.5 h-1.5 rounded-full bg-zinc-300 shrink-0" />
                              )}
                              <div className="flex-1">
                                <h4 className="text-zinc-800 font-medium leading-relaxed">
                                  {entry.description}
                                </h4>
                                {categoryEntries.length > 1 && (
                                  <span className="text-[10px] text-zinc-400 font-bold">{entry.duration_minutes}m</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Attached Resources */}
                        {categoryEntries.some(e => e.resources && e.resources.length > 0) && (
                          <div className="mt-4 pt-4 border-t border-zinc-50 flex flex-wrap gap-2">
                            {categoryEntries.flatMap(e => e.resources || []).map(res => (
                              <a
                                key={res.id}
                                href={res.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-2 py-1 bg-zinc-50 text-zinc-600 rounded-lg text-[10px] font-bold hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-zinc-100"
                              >
                                {res.type === 'youtube' ? <Youtube className="w-3 h-3 text-red-500" /> : <LinkIcon className="w-3 h-3" />}
                                {res.title}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1 text-zinc-900 font-bold text-lg">
                          <Clock className="w-4 h-4 text-zinc-400" />
                          <span>{totalMinutes}m</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">Total Time</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {sortedDates.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-zinc-100">
            <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="w-8 h-8 text-zinc-300" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900">No entries found</h3>
            <p className="text-zinc-500">Try adjusting your filters or search query.</p>
          </div>
        )}
      </div>
    </div>
  );
}
