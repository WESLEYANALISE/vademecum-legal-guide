import { motion } from 'framer-motion';
import { type LeiCatalogItem } from '@/data/leisCatalog';

interface LeiTrailProps {
  leis: LeiCatalogItem[];
  onSelect: (lei: LeiCatalogItem) => void;
}

const X_POINTS = [22, 50, 78, 50];
const ROW_H = 140;
const NODE_PX = 68;

const LeiTrail = ({ leis, onSelect }: LeiTrailProps) => {
  const totalH = leis.length * ROW_H + 60;

  return (
    <div className="relative w-full overflow-x-hidden">
      <div
        className="relative w-full rounded-2xl overflow-hidden border border-border/50"
        style={{
          background:
            'radial-gradient(ellipse at 30% 10%, hsl(var(--signature) / 0.06) 0%, transparent 50%), ' +
            'radial-gradient(ellipse at 70% 60%, hsl(var(--signature) / 0.04) 0%, transparent 50%), ' +
            'hsl(var(--card))',
        }}
      >
        {/* Subtle animated glow */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
          transition={{ repeat: Infinity, duration: 12, ease: 'linear' }}
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, hsl(var(--signature) / 0.05) 0, transparent 35%), ' +
              'radial-gradient(circle at 80% 70%, hsl(var(--signature) / 0.04) 0, transparent 35%)',
            backgroundSize: '200% 200%',
          }}
        />

        <div className="relative w-full px-4 py-8" style={{ minHeight: totalH }}>
          {/* SVG connectors */}
          <svg
            className="absolute inset-0 w-full pointer-events-none"
            style={{ height: totalH }}
            overflow="visible"
          >
            <defs>
              <linearGradient id="trail-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--signature))" stopOpacity="0.6" />
                <stop offset="100%" stopColor="hsl(var(--signature))" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            {leis.map((_, i) => {
              if (i === 0) return null;
              const x1 = X_POINTS[(i - 1) % 4];
              const y1 = (i - 1) * ROW_H + NODE_PX / 2 + 32;
              const x2 = X_POINTS[i % 4];
              const y2 = i * ROW_H + NODE_PX / 2 + 32;
              const midY = (y1 + y2) / 2;

              return (
                <motion.path
                  key={`line-${i}`}
                  d={`M ${x1}% ${y1} C ${x1}% ${midY}, ${x2}% ${midY}, ${x2}% ${y2}`}
                  fill="none"
                  stroke="url(#trail-grad)"
                  strokeWidth="2.5"
                  strokeDasharray="10 6"
                  animate={{ strokeDashoffset: [0, -32] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {leis.map((lei, i) => {
            const xPct = X_POINTS[i % 4];
            const color = lei.iconColor || '#d4d4d8';

            return (
              <div key={lei.id} className="relative" style={{ height: ROW_H }}>
                <motion.button
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: Math.min(i * 0.04, 1.2),
                    type: 'spring',
                    stiffness: 220,
                    damping: 18,
                  }}
                  onClick={() => onSelect(lei)}
                  className="absolute top-0 flex flex-col items-center gap-2 group cursor-pointer z-10"
                  style={{
                    left: `${xPct}%`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  {/* Outer glow ring */}
                  <div className="relative">
                    <motion.div
                      className="absolute -inset-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background: `radial-gradient(circle, ${color}30 0%, transparent 70%)`,
                      }}
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                    />
                    {/* Node circle */}
                    <div
                      className="relative rounded-full border-[3px] flex items-center justify-center
                        group-hover:scale-110 group-hover:shadow-xl transition-all duration-300"
                      style={{
                        width: NODE_PX,
                        height: NODE_PX,
                        borderColor: color,
                        backgroundColor: `${color}12`,
                        boxShadow: `0 0 20px ${color}15, inset 0 0 12px ${color}08`,
                      }}
                    >
                      <span
                        className="text-xs font-display font-bold leading-none text-center px-1"
                        style={{ color }}
                      >
                        {lei.sigla}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-display font-semibold text-muted-foreground group-hover:text-foreground transition-colors text-center max-w-[100px] leading-tight">
                    {lei.nome}
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

export default LeiTrail;
