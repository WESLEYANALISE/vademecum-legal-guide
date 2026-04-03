import { ArrowLeft, BookOpen, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import type { LivroUnificado } from './LivroCard';
import { cdnImg } from '@/lib/cdnImg';

interface LivroDetailSheetProps {
  livro: LivroUnificado | null;
  open: boolean;
  onClose: () => void;
  onRead: (livro: LivroUnificado) => void;
}

const LivroDetailSheet = ({ livro, open, onClose, onRead }: LivroDetailSheetProps) => {
  if (!livro && !open) return null;

  const capaUrl = livro?.capa ? cdnImg(livro.capa, 400) : '';

  return (
    <AnimatePresence>
      {open && livro && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed inset-0 z-50 bg-background flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
            <button
              onClick={onClose}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-sm font-semibold text-foreground truncate flex-1">{livro.titulo}</h1>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Cover hero */}
            {capaUrl && (
              <div className="flex justify-center py-8 bg-gradient-to-b from-secondary/40 to-transparent">
                <img
                  src={capaUrl}
                  alt={livro.titulo}
                  className="w-40 h-56 rounded-xl object-cover shadow-2xl"
                />
              </div>
            )}

            <div className="px-5 pb-8 space-y-5">
              {/* Title & Author */}
              <div className="text-center space-y-1">
                <h2 className="text-xl font-bold text-foreground">{livro.titulo}</h2>
                {livro.autor && (
                  <p className="text-sm text-muted-foreground">{livro.autor}</p>
                )}
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {livro.categoria}
                  </span>
                  {livro.area && (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">
                      {livro.area}
                    </span>
                  )}
                </div>
              </div>

              {/* Synopsis */}
              {livro.sinopse && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">Sobre o livro</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {livro.sinopse}
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                {livro.link && (
                  <Button className="flex-1 gap-2 h-12 text-base" onClick={() => onRead(livro)}>
                    <BookOpen className="w-5 h-5" />
                    Ler agora
                  </Button>
                )}
                {livro.download && (
                  <Button
                    variant="outline"
                    className="flex-1 gap-2 h-12 text-base"
                    onClick={() => window.open(livro.download!, '_blank')}
                  >
                    <Download className="w-5 h-5" />
                    Download
                  </Button>
                )}
              </div>

              {!livro.link && !livro.download && (
                <p className="text-sm text-muted-foreground text-center">Nenhum link disponível</p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LivroDetailSheet;
