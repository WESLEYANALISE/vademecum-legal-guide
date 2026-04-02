import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, RotateCcw, Coffee, BookOpen } from 'lucide-react';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';

interface StudyTimerProps {
  open: boolean;
  onClose: () => void;
}

type TimerMode = 'study' | 'break';

const DURATIONS = { study: 25 * 60, break: 5 * 60 };

const StudyTimer = ({ open, onClose }: StudyTimerProps) => {
  const [mode, setMode] = useState<TimerMode>('study');
  const [isPlaying, setIsPlaying] = useState(false);
  const [key, setKey] = useState(0);
  const [sessions, setSessions] = useState(0);

  const handleComplete = useCallback(() => {
    if (mode === 'study') {
      setSessions(s => s + 1);
      setMode('break');
    } else {
      setMode('study');
    }
    setKey(k => k + 1);
    setIsPlaying(false);
    // Play notification sound
    try { new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ==').play(); } catch {}
    return { shouldRepeat: false };
  }, [mode]);

  const reset = () => {
    setIsPlaying(false);
    setKey(k => k + 1);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-muted">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-8">
          {mode === 'study' ? <BookOpen className="w-5 h-5 text-primary" /> : <Coffee className="w-5 h-5 text-green-400" />}
          <h2 className="font-display text-xl font-bold text-foreground">
            {mode === 'study' ? 'Tempo de Estudo' : 'Pausa'}
          </h2>
        </div>

        <CountdownCircleTimer
          key={key}
          isPlaying={isPlaying}
          duration={DURATIONS[mode]}
          colors={mode === 'study' ? ['#6366f1', '#8b5cf6', '#a855f7', '#ef4444'] : ['#22c55e', '#4ade80', '#86efac', '#fbbf24']}
          colorsTime={[DURATIONS[mode], DURATIONS[mode] * 0.66, DURATIONS[mode] * 0.33, 0]}
          size={220}
          strokeWidth={10}
          trailColor="#333344"
          onComplete={handleComplete}
        >
          {({ remainingTime }) => {
            const mins = Math.floor(remainingTime / 60);
            const secs = remainingTime % 60;
            return (
              <div className="text-center">
                <span className="font-display text-4xl font-bold text-foreground">
                  {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                </span>
              </div>
            );
          }}
        </CountdownCircleTimer>

        <div className="flex items-center gap-4 mt-8">
          <button onClick={reset} className="p-3 rounded-full bg-muted hover:bg-muted/80 transition-colors">
            <RotateCcw className="w-5 h-5 text-muted-foreground" />
          </button>
          <button
            onClick={() => setIsPlaying(p => !p)}
            className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30"
          >
            {isPlaying ? <Pause className="w-7 h-7 text-primary-foreground" /> : <Play className="w-7 h-7 text-primary-foreground ml-1" />}
          </button>
        </div>

        <p className="text-muted-foreground text-sm mt-6">
          {sessions} sessão{sessions !== 1 ? 'ões' : ''} completa{sessions !== 1 ? 's' : ''}
        </p>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => { setMode('study'); setKey(k => k + 1); setIsPlaying(false); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'study' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
          >
            25 min Estudo
          </button>
          <button
            onClick={() => { setMode('break'); setKey(k => k + 1); setIsPlaying(false); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'break' ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}
          >
            5 min Pausa
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StudyTimer;
