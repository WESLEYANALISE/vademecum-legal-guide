import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Brain, FileText, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ResumoSelectorSheetProps {
  open: boolean;
  onClose: () => void;
  tabelaNome: string;
  artigoNumero: string;
}

const ResumoSelectorSheet = ({ open, onClose, tabelaNome, artigoNumero }: ResumoSelectorSheetProps) => {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[70]"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-0 z-[71] bg-background flex flex-col items-center"
          >
            <div className="w-full max-w-3xl h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 pt-4 pb-2">
              <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-foreground">Resumos</h2>
                <p className="text-[11px] text-muted-foreground truncate">{artigoNumero} — Escolha o tipo de resumo</p>
              </div>
            </div>

            <div className="flex-1 px-4 py-6 space-y-4">
              <button
                onClick={() => {
                  onClose();
                  navigate(`/resumos?mode=feynman&tabela=${tabelaNome}&artigo=${artigoNumero}`);
                }}
                className="w-full flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-indigo-500/15 to-purple-500/10 border border-indigo-500/30 hover:border-indigo-500/60 transition-all text-left group"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/25">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-foreground">Método Feynman</p>
                  <p className="text-xs text-foreground/70 mt-1">Explicação simplificada com analogias e pontos-chave</p>
                </div>
                <ChevronRight className="w-5 h-5 text-foreground/50" />
              </button>

              <button
                onClick={() => {
                  onClose();
                  navigate(`/resumos?mode=cornell&tabela=${tabelaNome}&artigo=${artigoNumero}`);
                }}
                className="w-full flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-500/15 to-teal-500/10 border border-emerald-500/30 hover:border-emerald-500/60 transition-all text-left group"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/25">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-foreground">Método Cornell</p>
                  <p className="text-xs text-foreground/70 mt-1">Perguntas-chave, anotações e resumo geral</p>
                </div>
                <ChevronRight className="w-5 h-5 text-foreground/50" />
              </button>
            </div>
           </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ResumoSelectorSheet;
