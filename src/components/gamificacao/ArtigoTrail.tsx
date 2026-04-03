import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';

interface Artigo {
  numero: string;
  rotulo?: string;
  caput?: string;
}

interface ArtigoTrailProps {
  artigos: Artigo[];
  loading: boolean;
  loadingGame: boolean;
  onSelect: (numero: string) => void;
}

const formatNumero = (numero: string) =>
  numero.toLowerCase().startsWith('art') ? numero : `Art. ${numero}`;

// Safe positions that won't overflow (percentage of container width)
// Pattern: left(18%) → center(50%) → right(82%) → center(50%) → repeat
const X_POINTS = [18, 50, 82, 50];
const ROW_H = 120;
const NODE_PX = 56;

const ArtigoTrail = ({ artigos, loading, loadingGame, onSelect }: ArtigoTrailProps) => {
  const [search, setSearch] = useState('');

  const filtered = useFuzzySearch(artigos, search, {
    keys: ['numero', 'rotulo', 'caput'],
    threshold: 0.35,
    limit: 120,
  });

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const totalH = filtered.length * ROW_H + 40;

  return (
    <div className="relative w-full overflow-x-hidden">
      {/* Search */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar artigo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
      </div>

      {/* Trail area */}
      <div
        className="relative w-full rounded-2xl overflow-hidden border border-border/50"
        style={{
          background:
            'radial-gradient(ellipse at 30% 10%, hsl(var(--signature) / 0.06) 0%, transparent 50%), ' +
            'radial-gradient(ellipse at 70% 60%, hsl(var(--signature) / 0.04) 0%, transparent 50%), ' +
            'hsl(var(--card))',
        }}
      >
        {/* Animated background shine */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
          transition={{ repeat: Infinity, duration: 10, ease: 'linear' }}
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, hsl(var(--primary) / 0.08) 0, transparent 30%), ' +
              'radial-gradient(circle at 80% 60%, hsl(var(--primary) / 0.06) 0, transparent 30%)',
            backgroundSize: '150% 150%',
          }}
        />

        <div className="relative w-full px-4 py-6" style={{ minHeight: totalH }}>
          {/* SVG connectors */}
          <svg
            className="absolute inset-0 w-full pointer-events-none"
            style={{ height: totalH }}
            overflow="visible"
          >
            {filtered.map((_, i) => {
              if (i === 0) return null;
              const x1 = X_POINTS[(i - 1) % 4];
              const y1 = (i - 1) * ROW_H + NODE_PX / 2 + 24;
              const x2 = X_POINTS[i % 4];
              const y2 = i * ROW_H + NODE_PX / 2 + 24;
              const midY = (y1 + y2) / 2;

              return (
                <motion.path
                  key={`line-${i}`}
                  d={`M ${x1}% ${y1} C ${x1}% ${midY}, ${x2}% ${midY}, ${x2}% ${y2}`}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  strokeDasharray="8 6"
                  strokeOpacity="0.45"
                  animate={{ strokeDashoffset: [0, -28] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {filtered.map((art, i) => {
            const xPct = X_POINTS[i % 4];
            const label = formatNumero(art.numero);
            const shortNum = art.numero.replace(/^art\.?\s*/i, '');

            return (
              <div
                key={art.numero}
                className="relative"
                style={{ height: ROW_H }}
              >
                <motion.button
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: Math.min(i * 0.025, 0.8),
                    type: 'spring',
                    stiffness: 250,
                    damping: 20,
                  }}
                  onClick={() => onSelect(art.numero)}
                  disabled={loadingGame}
                  className="absolute top-0 flex flex-col items-center gap-1.5 group cursor-pointer z-10"
                  style={{
                    left: `${xPct}%`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  {/* Glow */}
                  <div className="relative">
                    <div className="absolute -inset-2 rounded-full bg-primary/15 blur-lg group-hover:bg-primary/25 transition-all" />
                    <div
                      className="relative rounded-full border-[3px] border-primary bg-primary/10
                        flex items-center justify-center
                        group-hover:bg-primary/20 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/30
                        transition-all duration-300"
                      style={{ width: NODE_PX, height: NODE_PX }}
                    >
                      <span className="text-sm font-display font-bold text-primary leading-none">
                        {shortNum}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-display font-semibold text-foreground/60 group-hover:text-primary transition-colors">
                    {label}
                  </span>
                </motion.button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ArtigoTrail;
