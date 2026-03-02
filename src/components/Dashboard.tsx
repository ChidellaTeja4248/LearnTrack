import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { SummaryStats, Entry } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Clock, Calendar, Flame, Target, TrendingUp, AlertCircle } from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [summary, allEntries] = await Promise.all([
        api.analytics.summary(),
        api.entries.list()
      ]);
      setStats(summary);
      setEntries(allEntries);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch dashboard data', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
      <p className="text-zinc-500 font-medium">Loading your dashboard...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-zinc-900">Dashboard Error</h3>
        <p className="text-zinc-500 max-w-xs mx-auto mt-1">{error}</p>
      </div>
      <button 
        onClick={() => fetchData()}
        className="px-6 py-2 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all"
      >
        Retry
      </button>
    </div>
  );

  // Prepare chart data
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date()
  }).map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayEntries = entries.filter(e => e.date === dateStr);
    const totalMinutes = dayEntries.reduce((sum, e) => sum + e.duration_minutes, 0);
    return {
      name: format(date, 'EEE'),
      minutes: totalMinutes
    };
  });

  const categoryData = entries.reduce((acc: any[], entry) => {
    const existing = acc.find(a => a.name === entry.category_name);
    if (existing) {
      existing.value += entry.duration_minutes;
    } else {
      acc.push({ name: entry.category_name, value: entry.duration_minutes });
    }
    return acc;
  }, []);

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Dashboard</h1>
          <p className="text-zinc-500">Welcome back to your learning journey.</p>
        </div>
        <button 
          onClick={() => fetchData()}
          className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
          title="Refresh Data"
        >
          <TrendingUp className="w-5 h-5" />
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Clock className="text-emerald-600" />}
          label="Today's Learning"
          value={`${stats?.today_minutes || 0}m`}
          subtext="Keep it up!"
        />
        <StatCard 
          icon={<Calendar className="text-blue-600" />}
          label="This Week"
          value={`${Math.round((stats?.week_minutes || 0) / 60 * 10) / 10}h`}
          subtext="Weekly progress"
        />
        <StatCard 
          icon={<TrendingUp className="text-purple-600" />}
          label="Most Focused"
          value={stats?.mostFocused?.name || 'N/A'}
          subtext={`${stats?.mostFocused?.total || 0}m total`}
        />
        <StatCard 
          icon={<Flame className="text-orange-600" />}
          label="Current Streak"
          value={`${stats?.streak || 0} Days`}
          subtext="Keep it burning!"
        />
      </div>

      {/* Charts Section - Custom Implementation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Hours Trend - Custom SVG Bar Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-zinc-900">Daily Learning Trend</h3>
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
              <div className="w-2 h-2 rounded-full bg-emerald-500" /> Minutes
            </div>
          </div>
          
          <div className="h-64 flex items-end justify-between gap-2 px-2">
            {last7Days.map((day, i) => {
              const maxMinutes = Math.max(...last7Days.map(d => d.minutes), 60);
              const heightPercent = (day.minutes / maxMinutes) * 100;
              const isToday = i === last7Days.length - 1;

              return (
                <div key={day.name} className="flex-1 flex flex-col items-center gap-3 group">
                  <div className="relative w-full flex flex-col items-center justify-end h-48">
                    {/* Tooltip on Hover */}
                    <div className="absolute -top-8 bg-zinc-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {day.minutes} mins
                    </div>
                    {/* Bar */}
                    <div 
                      className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 ease-out ${
                        isToday ? 'bg-emerald-500' : 'bg-zinc-100 group-hover:bg-emerald-200'
                      }`}
                      style={{ height: `${Math.max(heightPercent, 4)}%` }}
                    />
                  </div>
                  <span className={`text-xs font-bold ${isToday ? 'text-emerald-600' : 'text-zinc-400'}`}>
                    {day.name}
                  </span>
                </div>
              );
            })}
          </div>
          {entries.length === 0 && (
            <div className="mt-[-160px] h-40 flex items-center justify-center">
              <p className="text-zinc-400 text-sm">No data for the last 7 days.</p>
            </div>
          )}
        </div>

        {/* Time Distribution - Custom Progress Rails */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
          <h3 className="text-lg font-bold text-zinc-900 mb-8">Time Distribution</h3>
          <div className="space-y-6">
            {categoryData.length > 0 ? (
              categoryData.sort((a, b) => b.value - a.value).map((cat, index) => {
                const totalMinutes = categoryData.reduce((sum, c) => sum + c.value, 0);
                const percent = (cat.value / totalMinutes) * 100;
                const color = COLORS[index % COLORS.length];

                return (
                  <div key={cat.name} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-bold text-zinc-700">{cat.name}</span>
                      <span className="text-xs font-bold text-zinc-400">{cat.value}m ({Math.round(percent)}%)</span>
                    </div>
                    <div className="h-3 w-full bg-zinc-50 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ 
                          width: `${percent}%`,
                          backgroundColor: color
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center">
                  <Target className="w-6 h-6 text-zinc-300" />
                </div>
                <p className="text-zinc-400 text-sm">No categories tracked yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subtext }: { icon: React.ReactNode, label: string, value: string, subtext: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 flex items-center gap-4">
      <div className="p-3 bg-zinc-50 rounded-xl shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-zinc-500 font-medium truncate">{label}</p>
        <h4 className="text-2xl font-bold text-zinc-900 truncate">{value}</h4>
        <p className="text-xs text-zinc-400 mt-1 truncate">{subtext}</p>
      </div>
    </div>
  );
}
