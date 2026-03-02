import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Category, ReadingListItem, Resource } from '../types';
import { 
  Library, Plus, Trash2, ExternalLink, Youtube, FileText, 
  Link as LinkIcon, BookOpen, CheckCircle2, Clock, 
  AlertCircle, ChevronRight, MoreVertical, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ResourceLibrary() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [readingList, setReadingList] = useState<ReadingListItem[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reading' | 'resources'>('reading');
  
  // Form states
  const [showAddReading, setShowAddReading] = useState(false);
  const [newReading, setNewReading] = useState({
    category_id: '',
    topic: '',
    priority: 'medium' as const
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [cats, list, res] = await Promise.all([
        api.categories.list(),
        api.readingList.list(),
        api.resources.list()
      ]);
      setCategories(cats);
      setReadingList(list);
      setResources(res);
    } finally {
      setLoading(false);
    }
  }

  const handleAddReading = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReading.topic) return;
    
    try {
      await api.readingList.create({
        category_id: newReading.category_id ? parseInt(newReading.category_id) : null,
        topic: newReading.topic,
        priority: newReading.priority
      });
      setShowAddReading(false);
      setNewReading({ category_id: '', topic: '', priority: 'medium' });
      fetchData();
    } catch (err) {
      console.error('Failed to add reading item', err);
    }
  };

  const handleUpdateStatus = async (id: number, status: ReadingListItem['status']) => {
    try {
      await api.readingList.update(id, { status });
      fetchData();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleDeleteReading = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      await api.readingList.delete(id);
      fetchData();
    } catch (err) {
      console.error('Failed to delete reading item', err);
    }
  };

  const handleDeleteResource = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      await api.resources.delete(id);
      fetchData();
    } catch (err) {
      console.error('Failed to delete resource', err);
    }
  };

  const getResourceIcon = (type: Resource['type']) => {
    switch (type) {
      case 'youtube': return <Youtube className="w-4 h-4 text-red-500" />;
      case 'documentation': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'pdf': return <FileText className="w-4 h-4 text-orange-500" />;
      default: return <LinkIcon className="w-4 h-4 text-zinc-500" />;
    }
  };

  if (loading) return <div className="p-8 text-center">Loading library...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <Library className="text-emerald-600" /> Resource Library
          </h2>
          <p className="text-zinc-500">Manage your learning materials and future topics.</p>
        </div>
        <div className="flex bg-zinc-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('reading')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'reading' ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            Reading List
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'resources' ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            Saved Links
          </button>
        </div>
      </header>

      {activeTab === 'reading' ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-zinc-900">To-Learn Topics</h3>
            <button
              onClick={() => setShowAddReading(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Topic
            </button>
          </div>

          <AnimatePresence>
            {showAddReading && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-md"
              >
                <form onSubmit={handleAddReading} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Topic / Idea</label>
                    <input
                      type="text"
                      required
                      placeholder="What do you want to learn?"
                      className="w-full px-4 py-2 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500"
                      value={newReading.topic}
                      onChange={e => setNewReading({ ...newReading, topic: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Category</label>
                    <select
                      className="w-full px-4 py-2 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500"
                      value={newReading.category_id}
                      onChange={e => setNewReading({ ...newReading, category_id: e.target.value })}
                    >
                      <option value="">No Category</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddReading(false)}
                      className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-xl font-bold hover:bg-zinc-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {readingList.map(item => (
              <motion.div
                layout
                key={item.id}
                className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    item.status === 'learned' ? 'bg-emerald-50 text-emerald-600' :
                    item.status === 'learning' ? 'bg-blue-50 text-blue-600' :
                    'bg-zinc-50 text-zinc-500'
                  }`}>
                    {item.status}
                  </span>
                  <button
                    onClick={() => handleDeleteReading(item.id)}
                    className="p-1 text-zinc-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <h4 className="text-zinc-900 font-bold mb-2">{item.topic}</h4>
                
                {item.category_name && (
                  <div className="flex items-center gap-1 text-xs text-zinc-400 mb-4">
                    <BookOpen className="w-3 h-3" />
                    <span>{item.category_name}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-4 border-t border-zinc-50">
                  {item.status !== 'learned' && (
                    <button
                      onClick={() => handleUpdateStatus(item.id, item.status === 'to-learn' ? 'learning' : 'learned')}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-zinc-50 text-zinc-600 rounded-xl text-xs font-bold hover:bg-emerald-50 hover:text-emerald-600 transition-all"
                    >
                      {item.status === 'to-learn' ? (
                        <><Clock className="w-3 h-3" /> Start Learning</>
                      ) : (
                        <><CheckCircle2 className="w-3 h-3" /> Mark Learned</>
                      )}
                    </button>
                  )}
                  {item.status === 'learned' && (
                    <div className="flex-1 text-center py-2 text-emerald-600 text-xs font-bold">
                      Mastered!
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {readingList.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-zinc-100">
              <BookOpen className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-zinc-900">Your reading list is empty</h3>
              <p className="text-zinc-500">Add topics you want to explore in the future.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-zinc-900">Saved Resources</h3>
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              {resources.length} Links Total
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map(res => (
              <div key={res.id} className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-zinc-50 rounded-lg">
                    {getResourceIcon(res.type)}
                  </div>
                  <button
                    onClick={() => handleDeleteResource(res.id)}
                    className="p-1 text-zinc-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h4 className="text-zinc-900 font-bold mb-1 truncate" title={res.title}>{res.title}</h4>
                <p className="text-xs text-zinc-400 mb-4 truncate">{res.url}</p>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-50">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    {res.type}
                  </span>
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    Open <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {resources.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-zinc-100">
              <LinkIcon className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-zinc-900">No saved links yet</h3>
              <p className="text-zinc-500">Attach links to your learning entries to see them here.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
