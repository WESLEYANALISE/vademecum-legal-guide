import { useNavigate } from 'react-router-dom';
import { Crown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PremiumGateProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

const PremiumGate = ({ open, onClose, title = 'Funcionalidade Premium', description = 'Assine para desbloquear este recurso e aproveitar tudo sem limites.' }: PremiumGateProps) => {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[201] w-[90vw] max-w-sm"
          >
            <div className="relative bg-card border border-border rounded-2xl p-6 text-center shadow-2xl shadow-primary/10">
              <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-secondary transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>

              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/30">
                <Crown className="w-8 h-8 text-white" />
              </div>

              <h3 className="font-display text-lg font-bold text-foreground mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{description}</p>

              <button
                onClick={() => { onClose(); navigate('/assinatura'); }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-sm hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/25"
              >
                Ver planos
              </button>

              <p className="text-[11px] text-muted-foreground mt-3">A partir de R$ 9,99/mês</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PremiumGate;
