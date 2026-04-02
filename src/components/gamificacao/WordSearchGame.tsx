import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WordSearchGameProps {
  palavras: string[];
  grade: string[][];
  onNewGame: () => void;
}

const WordSearchGame = ({ palavras, grade, onNewGame }: WordSearchGameProps) => {
  const [found, setFound] = useState<Set<string>>(new Set());
  const [selecting, setSelecting] = useState(false);
  const [selectedCells, setSelectedCells] = useState<[number, number][]>([]);
  const [foundCells, setFoundCells] = useState<Set<string>>(new Set());

  const allFound = found.size === palavras.length;

  const cellKey = (r: number, c: number) => `${r}-${c}`;

  const getSelectedWord = useCallback((cells: [number, number][]) => {
    return cells.map(([r, c]) => grade[r]?.[c] || '').join('');
  }, [grade]);

  const checkWord = useCallback((cells: [number, number][]) => {
    const word = getSelectedWord(cells);
    const reversed = [...cells].reverse();
    const wordRev = getSelectedWord(reversed);

    const match = palavras.find(
      p => !found.has(p) && (p === word || p === wordRev)
    );

    if (match) {
      setFound(prev => new Set(prev).add(match));
      const newFoundCells = new Set(foundCells);
      cells.forEach(([r, c]) => newFoundCells.add(cellKey(r, c)));
      setFoundCells(newFoundCells);
    }
  }, [palavras, found, foundCells, getSelectedWord]);

  const handlePointerDown = (r: number, c: number) => {
    setSelecting(true);
    setSelectedCells([[r, c]]);
  };

  const handlePointerEnter = (r: number, c: number) => {
    if (!selecting) return;
    // Only allow straight lines
    const first = selectedCells[0];
    if (!first) return;
    const dr = r - first[0];
    const dc = c - first[1];
    const steps = Math.max(Math.abs(dr), Math.abs(dc));
    if (steps === 0) return;
    const stepR = dr / steps;
    const stepC = dc / steps;
    // Must be horizontal, vertical, or 45-degree diagonal
    if (![0, 1, -1].includes(stepR) || ![0, 1, -1].includes(stepC)) return;

    const cells: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      cells.push([first[0] + stepR * i, first[1] + stepC * i]);
    }
    setSelectedCells(cells);
  };

  const handlePointerUp = () => {
    if (selecting && selectedCells.length > 1) {
      checkWord(selectedCells);
    }
    setSelecting(false);
    setSelectedCells([]);
  };

  const isSelected = (r: number, c: number) =>
    selectedCells.some(([sr, sc]) => sr === r && sc === c);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Grid */}
      <div
        className="inline-grid gap-0 select-none touch-none"
        style={{ gridTemplateColumns: `repeat(${grade[0]?.length || 12}, 1fr)` }}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {grade.map((row, ri) =>
          row.map((cell, ci) => {
            const sel = isSelected(ri, ci);
            const isFnd = foundCells.has(cellKey(ri, ci));
            return (
              <div
                key={cellKey(ri, ci)}
                onPointerDown={() => handlePointerDown(ri, ci)}
                onPointerEnter={() => handlePointerEnter(ri, ci)}
                className={`w-7 h-7 flex items-center justify-center text-[11px] font-bold cursor-pointer transition-colors rounded-sm ${
                  isFnd
                    ? 'bg-green-500/25 text-green-700'
                    : sel
                      ? 'bg-primary/25 text-primary'
                      : 'text-foreground hover:bg-secondary'
                }`}
              >
                {cell}
              </div>
            );
          })
        )}
      </div>

      {/* Word list */}
      <div className="flex flex-wrap gap-2 justify-center max-w-[320px]">
        {palavras.map(p => (
          <span
            key={p}
            className={`text-xs px-2 py-1 rounded-md font-medium transition-all ${
              found.has(p)
                ? 'bg-green-500/15 text-green-600 line-through'
                : 'bg-secondary text-foreground'
            }`}
          >
            {p}
          </span>
        ))}
      </div>

      {/* Progress */}
      <p className="text-xs text-muted-foreground">
        {found.size} / {palavras.length} palavras encontradas
      </p>

      {allFound && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-green-500/15 text-green-600 px-4 py-2 rounded-xl text-center"
        >
          <CheckCircle2 className="w-5 h-5 mx-auto mb-1" />
          <p className="font-display font-bold text-sm">Parabéns! 🎉</p>
          <p className="text-xs">Todas as palavras encontradas!</p>
        </motion.div>
      )}

      {allFound && (
        <Button size="sm" onClick={onNewGame}>
          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Novo Jogo
        </Button>
      )}
    </div>
  );
};

export default WordSearchGame;
