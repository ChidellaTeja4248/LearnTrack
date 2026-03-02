import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import CategoryManager from './components/CategoryManager';
import DailyJournal from './components/DailyJournal';
import GoalManager from './components/GoalManager';
import LearningHistory from './components/LearningHistory';
import Analytics from './components/Analytics';
import Flashcards from './components/Flashcards';
import Pomodoro from './components/Pomodoro';
import EntryForm from './components/EntryForm';
import ResourceLibrary from './components/ResourceLibrary';
import { 
  LayoutDashboard, Tag, BookOpen, Target, Timer, LogOut, Plus, Menu, X, List, History, BarChart3, Brain, Library
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type View = 'dashboard' | 'categories' | 'journal' | 'goals' | 'pomodoro' | 'entries' | 'history' | 'analytics' | 'flashcards' | 'library';

export default function App() {
  const { user, loading, login, logout } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);

  if (loading) return null;

  if (!user) {
    return <Auth onLogin={login} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'history', label: 'History', icon: <History className="w-5 h-5" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'flashcards', label: 'Flashcards', icon: <Brain className="w-5 h-5" /> },
    { id: 'library', label: 'Library', icon: <Library className="w-5 h-5" /> },
    { id: 'categories', label: 'Categories', icon: <Tag className="w-5 h-5" /> },
    { id: 'goals', label: 'Goals', icon: <Target className="w-5 h-5" /> },
    { id: 'journal', label: 'Journal', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'pomodoro', label: 'Pomodoro', icon: <Timer className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Sidebar */}
      <aside className={`bg-white border-r border-zinc-200 transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">L</div>
          {isSidebarOpen && <span className="text-xl font-bold text-zinc-900">LearnTrack</span>}
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as View)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === item.id ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'}`}
            >
              {item.icon}
              {isSidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-100 space-y-2">
          <button
            onClick={() => setIsEntryModalOpen(true)}
            className={`w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center gap-2 transition-all py-3 shadow-lg shadow-emerald-100 ${!isSidebarOpen && 'px-0'}`}
          >
            <Plus className="w-5 h-5" />
            {isSidebarOpen && <span>Add Entry</span>}
          </button>
          
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-zinc-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-zinc-500 hover:text-zinc-900">
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-zinc-600">{user.email}</span>
            <div className="w-8 h-8 bg-zinc-200 rounded-full"></div>
          </div>
        </header>

        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {currentView === 'dashboard' && <Dashboard />}
              {currentView === 'history' && <LearningHistory />}
              {currentView === 'analytics' && <Analytics />}
              {currentView === 'flashcards' && <Flashcards />}
              {currentView === 'categories' && <CategoryManager />}
              {currentView === 'journal' && <DailyJournal />}
              {currentView === 'goals' && <GoalManager />}
              {currentView === 'library' && <ResourceLibrary />}
              {currentView === 'pomodoro' && (
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                  <Pomodoro onComplete={(mins) => setIsEntryModalOpen(true)} />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Entry Modal */}
      {isEntryModalOpen && (
        <EntryForm 
          onClose={() => setIsEntryModalOpen(false)} 
          onSuccess={() => {
            // Refresh dashboard if current view
            if (currentView === 'dashboard') {
              window.location.reload(); // Simple refresh for now
            }
          }} 
        />
      )}
    </div>
  );
}
