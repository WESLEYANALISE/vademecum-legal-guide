import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Trophy, Star, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WordData {
  palavra: string;
  dica: string;
}

interface HangmanGameProps {
  palavras: WordData[];
  onNewGame: () => void;
}

const KEYBOARD_ROWS = [
  'QWERTYUIOP'.split(''),
  'ASDFGHJKL'.split(''),
  'ZXCVBNM'.split(''),
];

const MAX_ERRORS = 6;
const POINTS_PER_WORD = 10;
const PENALTY_PER_ERROR = 2;
const BONUS_NO_ERRORS = 5;

const HangmanGame = ({ palavras, onNewGame }: HangmanGameProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<('won' | 'lost' | null)[]>(palavras.map(() => null));
  const [trailComplete, setTrailComplete] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const current = palavras[currentIndex];
  const wordLetters = current.palavra.toUpperCase().split('');
  const wrongGuesses = [...guessed].filter(l => !wordLetters.includes(l));
  const errors = wrongGuesses.length;
  const won = wordLetters.every(l => guessed.has(l));
  const lost = errors >= MAX_ERRORS;
  const gameOver = won || lost;

  // Auto-advance after win/loss
  useEffect(() => {
    if (!gameOver || transitioning) return;

    const newResults = [...results];
    newResults[currentIndex] = won ? 'won' : 'lost';
    setResults(newResults);

    if (won) {
      const bonus = errors === 0 ? BONUS_NO_ERRORS : 0;
      setScore(prev => prev + POINTS_PER_WORD - (errors * PENALTY_PER_ERROR) + bonus);
    }

    const timer = setTimeout(() => {
      if (currentIndex < palavras.length - 1) {
        setTransitioning(true);
        setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
          setGuessed(new Set());
          setTransitioning(false);
        }, 300);
      } else {
        setTrailComplete(true);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [won, lost]);

  const handleGuess = useCallback((letter: string) => {
    if (gameOver || guessed.has(letter) || transitioning) return;
    setGuessed(prev => new Set(prev).add(letter));
  }, [gameOver, guessed, transitioning]);

  const reset = () => {
    setCurrentIndex(0);
    setGuessed(new Set());
    setScore(0);
    setResults(palavras.map(() => null));
    setTrailComplete(false);
    setTransitioning(false);
    onNewGame();
  };

  const totalWon = results.filter(r => r === 'won').length;

  // SVG hangman parts
  const parts = [
    <circle key="head" cx="150" cy="70" r="20" className="stroke-foreground fill-none" strokeWidth="3" />,
    <line key="body" x1="150" y1="90" x2="150" y2="150" className="stroke-foreground" strokeWidth="3" />,
    <line key="larm" x1="150" y1="110" x2="120" y2="140" className="stroke-foreground" strokeWidth="3" />,
    <line key="rarm" x1="150" y1="110" x2="180" y2="140" className="stroke-foreground" strokeWidth="3" />,
    <line key="lleg" x1="150" y1="150" x2="120" y2="190" className="stroke-foreground" strokeWidth="3" />,
    <line key="rleg" x1="150" y1="150" x2="180" y2="190" className="stroke-foreground" strokeWidth="3" />,
  ];

  // Trail complete screen
  if (trailComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 py-6"
      >
        <Trophy className="w-12 h-12 text-yellow-500" />
        <h2 className="font-display text-xl font-bold text-foreground">Trilha Completa!</h2>
        <div className="bg-primary/10 rounded-2xl px-6 py-4 text-center">
          <p className="text-3xl font-display font-bold text-primary">{score}</p>
          <p className="text-xs text-muted-foreground mt-1">pontos</p>
        </div>
        <div className="flex gap-3 mt-2">
          <div className="flex items-center gap-1.5 text-sm">
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-foreground font-medium">{totalWon} acertos</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <X className="w-4 h-4 text-destructive" />
            <span className="text-foreground font-medium">{palavras.length - totalWon} erros</span>
          </div>
        </div>

        {/* Word summary */}
        <div className="w-full flex flex-col gap-1.5 mt-2">
          {palavras.map((p, i) => (
            <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
              results[i] === 'won' ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'
            }`}>
              <span className="font-bold w-5">{i + 1}.</span>
              <span className="font-display font-bold flex-1">{p.palavra}</span>
              {results[i] === 'won' ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
            </div>
          ))}
        </div>

        <Button size="sm" onClick={reset} className="mt-3">
          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Jogar Novamente
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Trail indicator */}
      <div className="flex items-center gap-1.5 w-full justify-center mb-1">
        {palavras.map((_, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
              i === currentIndex
                ? 'border-yellow-500 bg-yellow-500/20 text-yellow-600 scale-110'
                : results[i] === 'won'
                  ? 'border-green-500 bg-green-500/20 text-green-600'
                  : results[i] === 'lost'
                    ? 'border-destructive bg-destructive/15 text-destructive'
                    : 'border-muted bg-muted/50 text-muted-foreground'
            }`}>
              {results[i] === 'won' ? <Check className="w-3.5 h-3.5" /> : results[i] === 'lost' ? <X className="w-3.5 h-3.5" /> : i + 1}
            </div>
            {i < palavras.length - 1 && (
              <div className={`w-4 h-0.5 ${results[i] ? (results[i] === 'won' ? 'bg-green-500' : 'bg-destructive') : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Score */}
      <div className="flex items-center gap-1.5">
        <Star className="w-4 h-4 text-yellow-500" />
        <span className="text-sm font-display font-bold text-foreground">{score} pts</span>
      </div>

      {/* Hint always visible */}
      <div className="bg-primary/10 px-3 py-2 rounded-xl text-center w-full">
        <p className="text-xs text-primary font-medium">💡 {current.dica}</p>
      </div>

      {/* Hangman SVG */}
      <AnimatePresence mode="wait">
        <motion.div key={currentIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <svg viewBox="0 0 300 220" className="w-40 h-32">
            <line x1="60" y1="210" x2="240" y2="210" className="stroke-muted-foreground" strokeWidth="3" />
            <line x1="100" y1="210" x2="100" y2="20" className="stroke-muted-foreground" strokeWidth="3" />
            <line x1="100" y1="20" x2="150" y2="20" className="stroke-muted-foreground" strokeWidth="3" />
            <line x1="150" y1="20" x2="150" y2="50" className="stroke-muted-foreground" strokeWidth="3" />
            {parts.slice(0, errors).map((part, i) => (
              <motion.g key={i} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}>
                {part}
              </motion.g>
            ))}
          </svg>
        </motion.div>
      </AnimatePresence>

      {/* Errors counter */}
      <p className="text-xs text-muted-foreground">
        Erros: <span className={errors > 3 ? 'text-destructive font-bold' : 'text-foreground font-bold'}>{errors}</span> / {MAX_ERRORS}
      </p>

      {/* Word display */}
      <div className="flex gap-1.5 flex-wrap justify-center">
        {wordLetters.map((letter, i) => (
          <motion.div
            key={`${currentIndex}-${i}`}
            initial={{ rotateX: 0 }}
            animate={guessed.has(letter) ? { rotateX: 360 } : {}}
            className="w-9 h-11 border-b-2 border-primary flex items-center justify-center"
          >
            <span className="text-lg font-display font-bold text-foreground">
              {guessed.has(letter) || gameOver ? letter : ''}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Game over message */}
      {gameOver && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`px-4 py-2 rounded-xl text-center ${won ? 'bg-green-500/15 text-green-600' : 'bg-destructive/15 text-destructive'}`}
        >
          <p className="font-display font-bold text-sm">
            {won ? '🎉 Acertou!' : '😔 Errou!'}
          </p>
          <p className="text-xs mt-0.5">
            {won
              ? (errors === 0 ? `+${POINTS_PER_WORD + BONUS_NO_ERRORS} pts (bônus!)` : `+${Math.max(0, POINTS_PER_WORD - errors * PENALTY_PER_ERROR)} pts`)
              : `A palavra era: ${current.palavra}`}
          </p>
        </motion.div>
      )}

      {/* Keyboard */}
      {!gameOver && (
        <div className="flex flex-col items-center gap-1 mt-1">
          {KEYBOARD_ROWS.map((row, ri) => (
            <div key={ri} className="flex gap-1">
              {row.map(letter => {
                const isGuessed = guessed.has(letter);
                const isCorrect = isGuessed && wordLetters.includes(letter);
                const isWrong = isGuessed && !wordLetters.includes(letter);
                return (
                  <button
                    key={letter}
                    onClick={() => handleGuess(letter)}
                    disabled={isGuessed}
                    className={`w-8 h-9 rounded-lg text-xs font-bold transition-all ${
                      isCorrect
                        ? 'bg-green-500/20 text-green-600 border border-green-500/30'
                        : isWrong
                          ? 'bg-destructive/15 text-destructive/50 border border-destructive/20'
                          : 'bg-secondary text-foreground hover:bg-primary/20 hover:text-primary border border-border'
                    }`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HangmanGame;
