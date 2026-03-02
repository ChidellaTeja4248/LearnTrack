import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Category, Flashcard } from '../types';
import { Brain, Plus, Loader2, CheckCircle2, Trash2, ChevronLeft, ChevronRight, RotateCcw, Pencil } from 'lucide-react';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export default function Flashcards() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'list' | 'study' | 'add' | 'edit'>('list');
  const [editingCardId, setEditingCardId] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    category_id: '',
    front: '',
    back: '',
    interval: '0'
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [c, cat] = await Promise.all([
          api.flashcards.list(),
          api.categories.list()
        ]);
        setCards(c);
        setCategories(cat);
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
      if (mode === 'edit' && editingCardId) {
        const updated = await api.flashcards.update(editingCardId, {
          category_id: parseInt(formData.category_id),
          front: formData.front,
          back: formData.back,
          interval: parseInt(formData.interval)
        });
        setCards(cards.map(c => c.id === editingCardId ? updated : c));
      } else {
        const created = await api.flashcards.create({
          category_id: parseInt(formData.category_id),
          front: formData.front,
          back: formData.back,
          interval: parseInt(formData.interval)
        });
        setCards([...cards, created]);
      }
      setFormData({ ...formData, front: '', back: '', category_id: '', interval: '0' });
      setMode('list');
      setEditingCardId(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (card: Flashcard) => {
    setFormData({
      category_id: card.category_id.toString(),
      front: card.front,
      back: card.back,
      interval: card.interval.toString()
    });
    setEditingCardId(card.id);
    setMode('edit');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this card?')) return;
    await api.flashcards.delete(id);
    setCards(cards.filter(c => c.id !== id));
  };

  const handleReview = async (quality: number) => {
    const card = cards[currentIndex];
    await api.flashcards.review(card.id, quality);
    
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      setMode('list');
      // Refresh cards to update next_review dates
      const updated = await api.flashcards.list();
      setCards(updated);
    }
  };

  const dueCards = cards.filter(c => isBefore(startOfDay(parseISO(c.next_review)), startOfDay(new Date())) || format(parseISO(c.next_review), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'));

  if (loading) return <div className="p-8 text-center">Loading flashcards...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <Brain className="text-emerald-600" /> Spaced Repetition
          </h2>
          <p className="text-zinc-500">Master concepts with active recall.</p>
        </div>
        <div className="flex gap-2">
          {mode === 'list' && (
            <>
              <button 
                onClick={() => {
                  if (dueCards.length > 0) {
                    setCards(dueCards);
                    setMode('study');
                    setCurrentIndex(0);
                    setIsFlipped(false);
                  } else {
                    alert('No cards due for review today!');
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
                disabled={dueCards.length === 0}
              >
                <RotateCcw className="w-4 h-4" /> Study Due ({dueCards.length})
              </button>
              <button 
                onClick={() => setMode('add')}
                className="bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Card
              </button>
            </>
          )}
          {mode !== 'list' && (
            <button 
              onClick={() => setMode('list')}
              className="text-zinc-500 hover:text-zinc-900 font-bold px-4 py-2"
            >
              Back to List
            </button>
          )}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {(mode === 'add' || mode === 'edit') && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm"
          >
            <h3 className="text-lg font-bold mb-6">{mode === 'edit' ? 'Edit Flashcard' : 'Create New Flashcard'}</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Category</label>
                <select
                  required
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  value={formData.category_id}
                  onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                >
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Front (Question/Concept)</label>
                <textarea
                  required
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  value={formData.front}
                  onChange={e => setFormData({ ...formData, front: e.target.value })}
                  placeholder="What is the Big O complexity of binary search?"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Back (Answer/Explanation)</label>
                <textarea
                  required
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  value={formData.back}
                  onChange={e => setFormData({ ...formData, back: e.target.value })}
                  placeholder="O(log n)"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Revision Interval (Days from now)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  value={formData.interval}
                  onChange={e => setFormData({ ...formData, interval: e.target.value })}
                  placeholder="0 for today, 1 for tomorrow..."
                />
                <p className="text-[10px] text-zinc-400 mt-1 italic">The next revision date will be calculated based on this interval.</p>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                {mode === 'edit' ? 'Update Flashcard' : 'Save Flashcard'}
              </button>
            </form>
          </motion.div>
        )}

        {mode === 'study' && cards.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center space-y-8"
          >
            <div className="w-full flex justify-between items-center text-zinc-400 font-bold text-sm">
              <span>Card {currentIndex + 1} of {cards.length}</span>
              <span>{cards[currentIndex].category_name}</span>
            </div>

            <div 
              className="w-full max-w-lg aspect-[4/3] relative perspective-1000 cursor-pointer group"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div className={`w-full h-full transition-all duration-500 transform-style-3d relative ${isFlipped ? 'rotate-y-180' : ''}`}>
                {/* Front */}
                <div className="absolute inset-0 bg-white border-2 border-zinc-100 rounded-3xl shadow-xl flex items-center justify-center p-12 text-center backface-hidden">
                  <h3 className="text-2xl font-bold text-zinc-800 leading-tight">
                    {cards[currentIndex].front}
                  </h3>
                  <div className="absolute bottom-6 text-zinc-400 text-xs font-bold uppercase tracking-widest">Click to flip</div>
                </div>
                {/* Back */}
                <div className="absolute inset-0 bg-emerald-50 border-2 border-emerald-100 rounded-3xl shadow-xl flex items-center justify-center p-12 text-center backface-hidden rotate-y-180">
                  <p className="text-xl text-emerald-900 font-medium leading-relaxed">
                    {cards[currentIndex].back}
                  </p>
                  <div className="absolute bottom-6 text-emerald-400 text-xs font-bold uppercase tracking-widest">Click to flip back</div>
                </div>
              </div>
            </div>

            {isFlipped && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-lg"
              >
                <button onClick={(e) => { e.stopPropagation(); handleReview(1); }} className="bg-red-50 hover:bg-red-100 text-red-600 py-3 rounded-xl font-bold transition-all">Again</button>
                <button onClick={(e) => { e.stopPropagation(); handleReview(3); }} className="bg-amber-50 hover:bg-amber-100 text-amber-600 py-3 rounded-xl font-bold transition-all">Hard</button>
                <button onClick={(e) => { e.stopPropagation(); handleReview(4); }} className="bg-blue-50 hover:bg-blue-100 text-blue-600 py-3 rounded-xl font-bold transition-all">Good</button>
                <button onClick={(e) => { e.stopPropagation(); handleReview(5); }} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 py-3 rounded-xl font-bold transition-all">Easy</button>
              </motion.div>
            )}
          </motion.div>
        )}

        {mode === 'list' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {cards.map(card => (
              <div key={card.id} className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm group hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] font-bold uppercase rounded-full">
                    {card.category_name}
                  </span>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleEdit(card)}
                      className="p-1.5 text-zinc-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(card.id)}
                      className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-zinc-800 font-bold mb-2 line-clamp-2">{card.front}</p>
                <p className="text-zinc-500 text-sm line-clamp-2 mb-4">{card.back}</p>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  <span className="flex items-center gap-1">
                    Next: {format(parseISO(card.next_review), 'MMM dd')}
                  </span>
                  <span>Interval: {card.interval}d</span>
                </div>
              </div>
            ))}
            {cards.length === 0 && (
              <div className="col-span-full text-center py-20 bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200">
                <Brain className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-zinc-900">No flashcards yet</h3>
                <p className="text-zinc-500">Create cards to start mastering concepts.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
}
