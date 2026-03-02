import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Save, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PomodoroProps {
  onComplete: (minutes: number) => void;
}

export default function Pomodoro({ onComplete }: PomodoroProps) {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionType, setSessionType] = useState<'work' | 'break'>('work');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleComplete();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, timeLeft]);

  const handleComplete = () => {
    setIsActive(false);
    if (sessionType === 'work') {
      onComplete(25);
      alert('Work session complete! Time for a break.');
      setSessionType('break');
      setTimeLeft(5 * 60);
    } else {
      alert('Break over! Ready to work?');
      setSessionType('work');
      setTimeLeft(25 * 60);
    }
  };

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(sessionType === 'work' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (timeLeft / (sessionType === 'work' ? 25 * 60 : 5 * 60)) * 100;

  return (
    <div className="max-w-md mx-auto p-8 bg-white rounded-3xl shadow-xl border border-zinc-100 text-center">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-zinc-900 mb-1">Pomodoro Timer</h2>
        <p className="text-zinc-500 text-sm uppercase tracking-widest font-semibold">
          {sessionType === 'work' ? 'Focus Session' : 'Short Break'}
        </p>
      </div>

      <div className="relative w-64 h-64 mx-auto mb-8 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-zinc-100"
          />
          <motion.circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray="754"
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: 754 - (754 * progress) / 100 }}
            className={sessionType === 'work' ? 'text-emerald-500' : 'text-blue-500'}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-mono font-bold text-zinc-800">{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={toggleTimer}
          className={`p-4 rounded-2xl transition-all ${isActive ? 'bg-zinc-100 text-zinc-600' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'}`}
        >
          {isActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
        </button>
        <button
          onClick={resetTimer}
          className="p-4 bg-zinc-100 text-zinc-600 rounded-2xl hover:bg-zinc-200 transition-all"
        >
          <RotateCcw className="w-8 h-8" />
        </button>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <button
          onClick={() => { setSessionType('work'); setTimeLeft(25 * 60); setIsActive(false); }}
          className={`py-2 rounded-xl text-sm font-bold transition-all ${sessionType === 'work' ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-500' : 'bg-zinc-50 text-zinc-500 border-2 border-transparent'}`}
        >
          Work (25m)
        </button>
        <button
          onClick={() => { setSessionType('break'); setTimeLeft(5 * 60); setIsActive(false); }}
          className={`py-2 rounded-xl text-sm font-bold transition-all ${sessionType === 'break' ? 'bg-blue-50 text-blue-600 border-2 border-blue-500' : 'bg-zinc-50 text-zinc-500 border-2 border-transparent'}`}
        >
          Break (5m)
        </button>
      </div>
    </div>
  );
}
