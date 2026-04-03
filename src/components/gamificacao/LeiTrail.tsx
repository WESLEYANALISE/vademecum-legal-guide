import { motion } from 'framer-motion';
import { type LeiCatalogItem } from '@/data/leisCatalog';

interface LeiTrailProps {
  leis: LeiCatalogItem[];
  onSelect: (lei: LeiCatalogItem) => void;
}

const X_POINTS = [18, 50, 82, 50];
const ROW_H = 130;
const NODE_PX = 64;

const LeiTrail = ({ leis, onSelect }: LeiTrailProps) => {
  const totalH = leis.length * ROW_H + 40;

  return (
    <div className="relative w-full overflow-x-hidden">
      <div
        className="relative w-full rounded-2xl overflow-hidden"
        style={{
          background:
            'radial-gradient(ellipse at 25% 15%, hsl(var(--primary) / 0.1) 0%, transparent 50%), ' +
            'radial-gradient(ellipse at 75% 50%, hsl(var(--primary) / 0.06) 0%, transparent 50%), ' +
            'hsl(var(--background))',
        }}
      >
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
            {leis.map((_, i) => {
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
          {leis.map((lei, i) => {
            const xPct = X_POINTS[i % 4];

            return (
              <div key={lei.id} className="relative" style={{ height: ROW_H }}>
                <motion.button
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: Math.min(i * 0.03, 1),
                    type: 'spring',
                    stiffness: 250,
                    damping: 20,
                  }}
                  onClick={() => onSelect(lei)}
                  className="absolute top-0 flex flex-col items-center gap-1.5 group cursor-pointer z-10"
                  style={{
                    left: `${xPct}%`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <div className="relative">
                    <div className="absolute -inset-2 rounded-full blur-lg transition-all"
                      style={{ backgroundColor: `${lei.iconColor || 'hsl(var(--primary))'}20` }}
                    />
                    <div
                      className="relative rounded-full border-[3px] flex items-center justify-center
                        group-hover:scale-110 group-hover:shadow-lg transition-all duration-300"
                      style={{
                        width: NODE_PX,
                        height: NODE_PX,
                        borderColor: lei.iconColor || 'hsl(var(--primary))',
                        backgroundColor: `${lei.iconColor || 'hsl(var(--primary))'}15`,
                      }}
                    >
                      <span
                        className="text-xs font-display font-bold leading-none text-center px-1"
                        style={{ color: lei.iconColor || 'hsl(var(--primary))' }}
                      >
                        {lei.sigla}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-display font-semibold text-foreground/60 group-hover:text-primary transition-colors text-center max-w-[90px] leading-tight">
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
