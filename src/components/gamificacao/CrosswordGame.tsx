import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Pista {
  numero: number;
  direcao: 'horizontal' | 'vertical';
  dica: string;
  resposta: string;
  linha: number;
  coluna: number;
}

interface CrosswordGameProps {
  tamanho: number;
  pistas: Pista[];
  onNewGame: () => void;
}

const CrosswordGame = ({ tamanho, pistas, onNewGame }: CrosswordGameProps) => {
  const gridSize = Math.min(tamanho || 15, 15);
  const [userGrid, setUserGrid] = useState<string[][]>(() =>
    Array.from({ length: gridSize }, () => Array(gridSize).fill(''))
  );
  const [activePista, setActivePista] = useState<number | null>(null);
  const [verified, setVerified] = useState(false);
  const [correctCells, setCorrectCells] = useState<Set<string>>(new Set());
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // Build occupation map
  const occupied = new Set<string>();
  const cellNumbers = new Map<string, number>();
  const answerMap = new Map<string, string>();

  pistas.forEach(p => {
    const key = `${p.linha}-${p.coluna}`;
    cellNumbers.set(key, p.numero);
    for (let i = 0; i < p.resposta.length; i++) {
      const r = p.direcao === 'vertical' ? p.linha + i : p.linha;
      const c = p.direcao === 'horizontal' ? p.coluna + i : p.coluna;
      const ck = `${r}-${c}`;
      occupied.add(ck);
      answerMap.set(ck, p.resposta[i]);
    }
  });

  const handleInput = (r: number, c: number, value: string) => {
    const letter = value.toUpperCase().replace(/[^A-Z]/g, '').slice(-1);
    const newGrid = userGrid.map(row => [...row]);
    newGrid[r][c] = letter;
    setUserGrid(newGrid);
    setVerified(false);

    // Auto-advance to next cell in active pista direction
    if (letter && activePista !== null) {
      const pista = pistas.find(p => p.numero === activePista);
      if (pista) {
        const nr = pista.direcao === 'vertical' ? r + 1 : r;
        const nc = pista.direcao === 'horizontal' ? c + 1 : c;
        const nk = `${nr}-${nc}`;
        if (occupied.has(nk)) {
          inputRefs.current.get(nk)?.focus();
        }
      }
    }
  };

  const verify = () => {
    const correct = new Set<string>();
    let allCorrect = true;
    occupied.forEach(key => {
      const [r, c] = key.split('-').map(Number);
      if (userGrid[r][c] === answerMap.get(key)) {
        correct.add(key);
      } else {
        allCorrect = false;
      }
    });
    setCorrectCells(correct);
    setVerified(true);
  };

  const allCorrect = verified && correctCells.size === occupied.size;

  const horizontais = pistas.filter(p => p.direcao === 'horizontal').sort((a, b) => a.numero - b.numero);
  const verticais = pistas.filter(p => p.direcao === 'vertical').sort((a, b) => a.numero - b.numero);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Grid */}
      <div
        className="inline-grid gap-0"
        style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
      >
        {Array.from({ length: gridSize }, (_, r) =>
          Array.from({ length: gridSize }, (_, c) => {
            const key = `${r}-${c}`;
            const isOccupied = occupied.has(key);
            const num = cellNumbers.get(key);
            const isCorrect = verified && correctCells.has(key);
            const isWrong = verified && isOccupied && !correctCells.has(key) && userGrid[r][c] !== '';

            if (!isOccupied) {
              return <div key={key} className="w-7 h-7" />;
            }

            return (
              <div key={key} className="relative w-7 h-7">
                {num && (
                  <span className="absolute top-0 left-0.5 text-[7px] text-muted-foreground font-bold z-10 leading-none">
                    {num}
                  </span>
                )}
                <input
                  ref={el => { if (el) inputRefs.current.set(key, el); }}
                  value={userGrid[r][c]}
                  onChange={e => handleInput(r, c, e.target.value)}
                  onFocus={() => {
                    const p = pistas.find(
                      pi =>
                        (pi.direcao === 'horizontal' && pi.linha === r && c >= pi.coluna && c < pi.coluna + pi.resposta.length) ||
                        (pi.direcao === 'vertical' && pi.coluna === c && r >= pi.linha && r < pi.linha + pi.resposta.length)
                    );
                    if (p) setActivePista(p.numero);
                  }}
                  maxLength={1}
                  className={`w-7 h-7 text-center text-xs font-bold uppercase border transition-colors outline-none ${
                    isCorrect
                      ? 'bg-green-500/20 border-green-500/40 text-green-700'
                      : isWrong
                        ? 'bg-destructive/15 border-destructive/40 text-destructive'
                        : 'bg-card border-border text-foreground focus:border-primary focus:bg-primary/5'
                  }`}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Verify button */}
      {!allCorrect && (
        <Button size="sm" onClick={verify} variant="outline">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Verificar
        </Button>
      )}

      {allCorrect && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-green-500/15 text-green-600 px-4 py-2 rounded-xl text-center"
        >
          <p className="font-display font-bold text-sm">🎉 Perfeito!</p>
          <p className="text-xs">Todas as palavras corretas!</p>
        </motion.div>
      )}

      {allCorrect && (
        <Button size="sm" onClick={onNewGame}>
          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Novo Jogo
        </Button>
      )}

      {/* Clues */}
      <div className="w-full grid grid-cols-2 gap-3 text-left">
        {horizontais.length > 0 && (
          <div>
            <p className="font-display font-bold text-xs text-foreground mb-1">Horizontais</p>
            {horizontais.map(p => (
              <button
                key={p.numero}
                onClick={() => {
                  setActivePista(p.numero);
                  inputRefs.current.get(`${p.linha}-${p.coluna}`)?.focus();
                }}
                className={`block text-[11px] leading-tight py-0.5 transition-colors ${
                  activePista === p.numero ? 'text-primary font-semibold' : 'text-muted-foreground'
                }`}
              >
                <span className="font-bold">{p.numero}.</span> {p.dica}
              </button>
            ))}
          </div>
        )}
        {verticais.length > 0 && (
          <div>
            <p className="font-display font-bold text-xs text-foreground mb-1">Verticais</p>
            {verticais.map(p => (
              <button
                key={p.numero}
                onClick={() => {
                  setActivePista(p.numero);
                  inputRefs.current.get(`${p.linha}-${p.coluna}`)?.focus();
                }}
                className={`block text-[11px] leading-tight py-0.5 transition-colors ${
                  activePista === p.numero ? 'text-primary font-semibold' : 'text-muted-foreground'
                }`}
              >
                <span className="font-bold">{p.numero}.</span> {p.dica}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CrosswordGame;
