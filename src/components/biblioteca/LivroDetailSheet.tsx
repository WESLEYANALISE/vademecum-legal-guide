import { useState } from 'react';
import { ArrowLeft, BookOpen, Download, FileText, Smartphone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import type { LivroUnificado } from './LivroCard';
import { directImg } from '@/lib/cdnImg';

export type ReadMode = 'fliphtml5' | 'vertical' | 'dinamico';

interface LivroDetailSheetProps {
  livro: LivroUnificado | null;
  open: boolean;
  onClose: () => void;
  onRead: (livro: LivroUnificado, mode: ReadMode) => void;
  categoryId?: string;
}

function extractDriveFileId(url: string): string | null {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match?.[1] ?? null;
}

const LivroDetailSheet = ({ livro, open, onClose, onRead, categoryId }: LivroDetailSheetProps) => {
  const [modePickerOpen, setModePickerOpen] = useState(false);

  if (!livro && !open) return null;

  const capaUrl = livro?.capa ? directImg(livro.capa, 400) : '';
  const hasFliphtml5 = !!livro?.link;
  const hasDrivePreview = !!livro?.download && !!extractDriveFileId(livro.download);
  const DYNAMIC_CATEGORIES = ['classicos', 'lideranca', 'fora-da-toga'];
  const hasDynamic = DYNAMIC_CATEGORIES.includes(categoryId ?? '');

  const handleReadMode = (mode: ReadMode) => {
    if (!livro) return;
    setModePickerOpen(false);
    onRead(livro, mode);
  };

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
              onClick={() => { setModePickerOpen(false); onClose(); }}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-sm font-semibold text-foreground truncate flex-1">{livro.titulo}</h1>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {capaUrl && (
              <div className="flex justify-center py-8 bg-gradient-to-b from-secondary/40 to-transparent">
                <img
                  src={capaUrl}
                  alt={livro.titulo}
                  className="w-40 h-56 rounded-xl object-cover shadow-2xl"
                />
              </div>
            )}

            <div className="px-5 pb-8 space-y-5 max-w-2xl mx-auto">
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

              {/* Two main buttons */}
              <div className="space-y-2 pt-2">
                <Button className="w-full gap-2 h-12 text-base" onClick={() => setModePickerOpen(true)}>
                  <BookOpen className="w-5 h-5" />
                  Ler agora
                </Button>

                {livro.download && (
                  <Button
                    variant="outline"
                    className="w-full gap-2 h-12 text-base"
                    onClick={() => window.open(livro.download!, '_blank')}
                  >
                    <Download className="w-5 h-5" />
                    Download PDF
                  </Button>
                )}
              </div>

              {!hasFliphtml5 && !hasDrivePreview && !livro.download && (
                <p className="text-sm text-muted-foreground text-center">Nenhum link disponível</p>
              )}

              {/* Synopsis */}
              {livro.sinopse && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">Sobre o livro</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {livro.sinopse}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Mode picker floating card */}
          <AnimatePresence>
            {modePickerOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/40 backdrop-blur-md z-10 flex items-center justify-center"
                  onClick={() => setModePickerOpen(false)}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    className="mx-4 w-full max-w-sm flex flex-col items-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="text-center text-white text-base font-semibold mb-4">Como deseja ler?</p>
                    <div className="grid grid-cols-3 gap-3 w-full">
                      {hasFliphtml5 && (
                        <button
                          onClick={() => handleReadMode('fliphtml5')}
                          className="flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-gradient-to-br from-blue-500/90 to-blue-700/90 border border-blue-400/30 hover:scale-105 transition-all shadow-lg"
                        >
                          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-xs font-bold text-white">Paginação</span>
                        </button>
                      )}
                      {hasDrivePreview && (
                        <button
                          onClick={() => handleReadMode('vertical')}
                          className="flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-gradient-to-br from-emerald-500/90 to-emerald-700/90 border border-emerald-400/30 hover:scale-105 transition-all shadow-lg"
                        >
                          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-xs font-bold text-white">Vertical</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleReadMode('dinamico')}
                        className="flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-gradient-to-br from-violet-500/90 to-violet-700/90 border border-violet-400/30 hover:scale-105 transition-all shadow-lg"
                      >
                        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Smartphone className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xs font-bold text-white">Dinâmico</span>
                      </button>
                    </div>
                    <button
                      onClick={() => setModePickerOpen(false)}
                      className="mt-5 w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-colors"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </motion.div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LivroDetailSheet;
