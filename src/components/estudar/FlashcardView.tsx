import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, XCircle, ChevronLeft, ChevronRight, RotateCcw, Check, X, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Card {
  frente: string;
  verso: string;
  exemplo_pratico: string;
}

interface Props {
  tabelaNome: string;
  artigoNumero: string;
  leiNome: string;
  onBack: () => void;
}

const FlashcardView = ({ tabelaNome, artigoNumero, leiNome, onBack }: Props) => {
  const { user } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await supabase.functions.invoke('gerar-estudo', {
          body: { tabela_nome: tabelaNome, artigo_numero: artigoNumero, mode: 'flashcards' },
        });
        if (res.error) throw res.error;
        const data = res.data?.data;
        if (!Array.isArray(data) || data.length === 0) throw new Error('Sem flashcards gerados');
        setCards(data);
      } catch (e: any) {
        setError(e.message || 'Erro ao gerar flashcards');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tabelaNome, artigoNumero]);

  const handleAnswer = async (knew: boolean) => {
    const newResults = [...results, knew];
    setResults(newResults);
    setFlipped(false);

    if (currentIdx < cards.length - 1) {
      setTimeout(() => setCurrentIdx(prev => prev + 1), 200);
    } else {
      setFinished(true);
      if (user) {
        const correct = newResults.filter(Boolean).length;
        await supabase.from('study_sessions').insert({
          user_id: user.id,
          tabela_nome: tabelaNome,
          artigo_numero: artigoNumero,
          mode: 'flashcards',
          total: cards.length,
          correct,
        });
      }
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setFlipped(false);
    setResults([]);
    setFinished(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Gerando flashcards com IA...</p>
        <p className="text-xs text-muted-foreground/60">Art. {artigoNumero} — {leiNome}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6">
        <XCircle className="w-10 h-10 text-destructive" />
        <p className="text-sm text-destructive text-center">{error}</p>
        <button onClick={onBack} className="text-sm text-primary underline">Voltar</button>
      </div>
    );
  }

  if (finished) {
    const knew = results.filter(Boolean).length;
    const pct = Math.round((knew / cards.length) * 100);
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="bg-gradient-to-br from-primary/90 to-copper-dark px-4 pt-10 pb-8">
          <div className="max-w-2xl mx-auto">
            <button onClick={onBack} className="flex items-center gap-2 text-white/80 hover:text-white text-sm mb-4">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
            <h1 className="font-display text-2xl text-white font-bold">Resultado</h1>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-8 text-center space-y-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-3xl font-bold ${pct >= 70 ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
              {pct}%
            </div>
            <p className="text-lg font-semibold text-foreground mt-4">Sabia {knew} de {cards.length}</p>
            <button onClick={handleRestart} className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm">
              <RotateCcw className="w-4 h-4" /> Revisar novamente
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  const card = cards[currentIdx];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/90 to-copper-dark px-4 pt-10 pb-6">
        <div className="max-w-2xl mx-auto">
          <button onClick={onBack} className="flex items-center gap-2 text-white/80 hover:text-white text-sm mb-3">
            <ArrowLeft className="w-4 h-4" /> Sair
          </button>
          <p className="text-white/80 text-xs mb-1">Art. {artigoNumero} — {leiNome}</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2.5 rounded-full bg-black/20 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-primary-light to-white transition-all" style={{ width: `${((currentIdx + 1) / cards.length) * 100}%` }} />
            </div>
            <span className="text-white text-xs font-bold">{currentIdx + 1}/{cards.length}</span>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-8">
        {/* Flashcard com flip 3D */}
        <div className="perspective-1000" style={{ perspective: '1000px' }}>
          <motion.div
            className="relative w-full cursor-pointer"
            style={{ transformStyle: 'preserve-3d', minHeight: '280px' }}
            animate={{ rotateY: flipped ? -180 : 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            onClick={() => setFlipped(!flipped)}
          >
            {/* Frente */}
            <div
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-copper/10 border border-primary/25 shadow-xl shadow-primary/5 p-6 flex flex-col items-center justify-center text-center"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <p className="text-xs text-primary mb-3 uppercase tracking-wider font-medium">Toque para virar</p>
              <p className="text-base font-semibold text-foreground leading-relaxed">{card.frente}</p>
            </div>

            {/* Verso */}
            <div
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/15 to-copper-light/10 border border-primary/30 shadow-xl shadow-primary/5 p-6 flex flex-col items-center justify-center text-center overflow-y-auto"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(-180deg)' }}
            >
              <p className="text-xs text-primary-light font-bold mb-2 uppercase tracking-wider">Resposta</p>
              <p className="text-base font-semibold text-foreground leading-relaxed">{card.verso}</p>
            </div>
          </motion.div>
        </div>

        {/* Botões Sei / Não sei */}
        {flipped && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 mt-6">
            <button
              onClick={() => handleAnswer(false)}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-secondary border border-border text-foreground font-medium text-sm hover:bg-muted transition-all"
            >
              <X className="w-4 h-4" /> Não sei
            </button>
            <button
              onClick={() => handleAnswer(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              <Check className="w-4 h-4" /> Sei
            </button>
          </motion.div>
        )}

        {/* Exemplo Prático */}
        {flipped && card.exemplo_pratico && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-4 p-4 rounded-xl bg-gradient-to-br from-primary/15 to-copper/10 border border-primary/25"
          >
            <p className="text-xs font-bold text-primary mb-1.5 flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5" /> Exemplo Prático
            </p>
            <p className="text-sm text-foreground/85 leading-relaxed">{card.exemplo_pratico}</p>
          </motion.div>
        )}

        {/* Nav arrows */}
        <div className="flex justify-between mt-4">
          <button
            onClick={() => { setCurrentIdx(Math.max(0, currentIdx - 1)); setFlipped(false); }}
            disabled={currentIdx === 0}
            className="p-2 rounded-lg text-muted-foreground hover:text-primary disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => { if (currentIdx < cards.length - 1) { setCurrentIdx(currentIdx + 1); setFlipped(false); } }}
            disabled={currentIdx === cards.length - 1}
            className="p-2 rounded-lg text-muted-foreground hover:text-primary disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlashcardView;
