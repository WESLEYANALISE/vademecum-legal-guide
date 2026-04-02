import { ArrowLeft, Check, Palette } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { motion } from 'framer-motion';

const Configuracoes = () => {
  const navigate = useNavigate();
  const { currentTheme, setTheme, palettes } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            <h1 className="font-display text-lg text-foreground">Configurações</h1>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto">
        <h2 className="font-display text-base text-foreground mb-1">Paleta de Cores</h2>
        <p className="font-body text-sm text-muted-foreground mb-5">
          Escolha o tema visual do aplicativo
        </p>

        <div className="flex flex-col gap-3">
          {palettes.map((palette) => {
            const isActive = currentTheme === palette.id;
            const bg = palette.colors['--background'];
            const primary = palette.colors['--primary'];
            const card = palette.colors['--card'];
            const secondary = palette.colors['--secondary'];
            const muted = palette.colors['--muted'];

            return (
              <motion.button
                key={palette.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setTheme(palette.id)}
                className={`relative w-full rounded-xl border-2 p-4 text-left transition-all ${
                  isActive
                    ? 'border-primary shadow-lg shadow-primary/20'
                    : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                )}

                <div className="flex items-center gap-4">
                  {/* Color preview circles */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex gap-1.5">
                      <div
                        className="w-8 h-8 rounded-lg"
                        style={{ backgroundColor: `hsl(${bg})` }}
                      />
                      <div
                        className="w-8 h-8 rounded-lg"
                        style={{ backgroundColor: `hsl(${card})` }}
                      />
                    </div>
                    <div className="flex gap-1.5">
                      <div
                        className="w-8 h-8 rounded-lg"
                        style={{ backgroundColor: `hsl(${primary})` }}
                      />
                      <div
                        className="w-8 h-8 rounded-lg"
                        style={{ backgroundColor: `hsl(${secondary})` }}
                      />
                    </div>
                  </div>

                  {/* Mini mockup */}
                  <div
                    className="flex-1 h-[68px] rounded-lg overflow-hidden relative"
                    style={{ backgroundColor: `hsl(${bg})` }}
                  >
                    <div
                      className="absolute top-0 left-0 right-0 h-4"
                      style={{ backgroundColor: `hsl(${primary})` }}
                    />
                    <div className="px-2 pt-6 flex gap-1.5">
                      <div
                        className="w-8 h-4 rounded-sm"
                        style={{ backgroundColor: `hsl(${card})` }}
                      />
                      <div
                        className="w-8 h-4 rounded-sm"
                        style={{ backgroundColor: `hsl(${card})` }}
                      />
                      <div
                        className="w-8 h-4 rounded-sm"
                        style={{ backgroundColor: `hsl(${muted})` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <h3 className="font-display text-sm text-foreground">{palette.name}</h3>
                  <p className="font-body text-xs text-muted-foreground">{palette.description}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Configuracoes;
