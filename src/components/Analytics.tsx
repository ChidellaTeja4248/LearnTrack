import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { DetailedAnalytics } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { BarChart3, TrendingUp, PieChart as PieIcon, Calendar } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Analytics() {
  const [data, setData] = useState<DetailedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await api.analytics.detailed();
        setData(res);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch analytics', err);
        setError('Failed to load analytics data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
      <p className="text-zinc-500 font-medium">Analyzing your progress...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-zinc-900">Oops! Something went wrong</h3>
        <p className="text-zinc-500 max-w-xs mx-auto mt-1">{error}</p>
      </div>
      <button 
        onClick={() => window.location.reload()}
        className="px-6 py-2 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all"
      >
        Try Again
      </button>
    </div>
  );

  if (!data) return <div className="p-8 text-center">No data available.</div>;

  const hasTrends = data.trends && data.trends.length > 0;
  const hasCategories = data.categories && data.categories.length > 0;
  const hasDifficulty = data.difficulty && data.difficulty.length > 0;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <BarChart3 className="text-emerald-600" /> Advanced Analytics
          </h2>
          <p className="text-zinc-500">Deep dive into your learning patterns.</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
          title="Refresh Data"
        >
          <TrendingUp className="w-5 h-5" />
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Trend Chart - Custom Implementation */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-zinc-900">
            <TrendingUp className="w-5 h-5 text-emerald-500" /> Learning Trend (Last 30 Days)
          </h3>
          <div className="h-64 flex items-end justify-between gap-1 px-2 relative">
            {hasTrends ? (
              data.trends.map((day, i) => {
                const maxVal = Math.max(...data.trends.map(d => d.total), 60);
                const height = (day.total / maxVal) * 100;
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center group">
                    <div className="relative w-full flex flex-col items-center justify-end h-48">
                      <div className="absolute -top-8 bg-zinc-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        {day.total}m on {day.date}
                      </div>
                      <div 
                        className="w-full bg-emerald-500/20 group-hover:bg-emerald-500/40 rounded-t-sm transition-all"
                        style={{ height: `${Math.max(height, 2)}%` }}
                      />
                      {day.total > 0 && (
                        <div 
                          className="absolute bottom-0 w-full bg-emerald-500 rounded-t-sm"
                          style={{ height: `${height}%` }}
                        />
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-zinc-400 text-sm">No trend data available yet.</p>
              </div>
            )}
          </div>
          <div className="flex justify-between mt-4 px-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            <span>{hasTrends ? data.trends[0].date : ''}</span>
            <span>{hasTrends ? data.trends[data.trends.length-1].date : ''}</span>
          </div>
        </div>

        {/* Category Distribution - Custom Progress Bars */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-zinc-900">
            <PieIcon className="w-5 h-5 text-blue-500" /> Category Distribution
          </h3>
          <div className="space-y-5 h-64 overflow-y-auto pr-2 custom-scrollbar">
            {hasCategories ? (
              data.categories.sort((a, b) => b.value - a.value).map((cat, i) => {
                const total = data.categories.reduce((sum, c) => sum + c.value, 0);
                const percent = (cat.value / total) * 100;
                return (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-bold text-zinc-700">{cat.name}</span>
                      <span className="text-xs font-bold text-zinc-400">{cat.value}m ({Math.round(percent)}%)</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                        style={{ width: `${percent}%`, backgroundColor: COLORS[i % COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-zinc-400 text-sm">No category data available.</p>
              </div>
            )}
          </div>
        </div>

        {/* Difficulty Distribution - Custom Bars */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-zinc-900">
            <BarChart3 className="w-5 h-5 text-amber-500" /> Difficulty Balance
          </h3>
          <div className="h-64 flex items-end justify-around gap-4 px-4">
            {hasDifficulty ? (
              ['Easy', 'Medium', 'Hard'].map(diff => {
                const item = data.difficulty.find(d => d.name === diff) || { name: diff, value: 0 };
                const maxVal = Math.max(...data.difficulty.map(d => d.value), 1);
                const height = (item.value / maxVal) * 100;
                const color = diff === 'Easy' ? '#10b981' : diff === 'Medium' ? '#f59e0b' : '#ef4444';
                
                return (
                  <div key={diff} className="flex-1 flex flex-col items-center gap-4">
                    <div className="relative w-full flex flex-col items-center justify-end h-48">
                      <div className="absolute -top-6 text-[10px] font-bold text-zinc-400">{item.value}</div>
                      <div 
                        className="w-full max-w-[60px] rounded-t-xl transition-all duration-1000"
                        style={{ height: `${Math.max(height, 5)}%`, backgroundColor: color }}
                      />
                    </div>
                    <span className="text-xs font-bold text-zinc-600">{diff}</span>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex items-center justify-center w-full">
                <p className="text-zinc-400 text-sm">No difficulty data available.</p>
              </div>
            )}
          </div>
        </div>

        {/* Consistency Heatmap Summary */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex flex-col justify-center items-center text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
            <Calendar className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-zinc-900">Learning Consistency</h3>
            <p className="text-zinc-500 max-w-xs mx-auto mt-2 text-sm">
              You've been active on <span className="text-emerald-600 font-bold">{data.heatmap.length}</span> days this year.
            </p>
          </div>
          
          <div className="grid grid-cols-7 gap-1.5">
            {/* Show last 28 days (4 weeks) */}
            {Array.from({ length: 28 }).map((_, i) => {
              const date = subDays(new Date(), 27 - i);
              const dateStr = format(date, 'yyyy-MM-dd');
              const dayData = data.heatmap.find(d => d.date === dateStr);
              const val = dayData ? dayData.value : 0;
              
              return (
                <div 
                  key={i}
                  className={`w-4 h-4 rounded-sm transition-colors ${
                    val > 120 ? 'bg-emerald-700' :
                    val > 60 ? 'bg-emerald-500' :
                    val > 0 ? 'bg-emerald-300' : 'bg-zinc-100'
                  }`}
                  title={`${dateStr}: ${val} mins`}
                />
              );
            })}
          </div>
          <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">Last 4 Weeks Activity</p>
        </div>
      </div>
    </div>
  );
}
