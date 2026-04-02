import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Sparkles, Loader2, Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';

interface Anotacao {
  id: string;
  texto: string;
  sugerida: boolean;
  created_at: string;
}

interface AnotacoesSheetProps {
  open: boolean;
  onClose: () => void;
  tabelaNome: string;
  artigoNumero: string;
  artigoTexto: string;
}

const AnotacoesSheet = ({ open, onClose, tabelaNome, artigoNumero, artigoTexto }: AnotacoesSheetProps) => {
  const [notas, setNotas] = useState<Anotacao[]>([]);
  const [novaTexto, setNovaTexto] = useState('');
  const [loading, setLoading] = useState(false);
  const [sugerindo, setSugerindo] = useState(false);
  const [sugestoes, setSugestoes] = useState<string[]>([]);

  // Fetch existing notes
  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('anotacoes_artigo' as any)
        .select('*')
        .eq('tabela_nome', tabelaNome)
        .eq('artigo_numero', artigoNumero)
        .order('created_at', { ascending: true });
      if (data) setNotas(data as any);
      setLoading(false);
    })();

    // Realtime sync for cross-device updates
    const channel = supabase
      .channel(`anotacoes:${tabelaNome}:${artigoNumero}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'anotacoes_artigo',
        filter: `tabela_nome=eq.${tabelaNome}`,
      }, (payload) => {
        const row = payload.new as any;
        if (row.artigo_numero === artigoNumero) {
          setNotas(prev => prev.some(n => n.id === row.id) ? prev : [...prev, row]);
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'anotacoes_artigo',
      }, (payload) => {
        const old = payload.old as any;
        if (old?.id) setNotas(prev => prev.filter(n => n.id !== old.id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [open, tabelaNome, artigoNumero]);

  const addNote = useCallback(async (texto: string, sugerida = false) => {
    if (!texto.trim()) return;
    const { data } = await supabase
      .from('anotacoes_artigo' as any)
      .insert({ tabela_nome: tabelaNome, artigo_numero: artigoNumero, texto: texto.trim(), sugerida })
      .select()
      .single();
    if (data) setNotas(prev => [...prev, data as any]);
  }, [tabelaNome, artigoNumero]);

  const deleteNote = useCallback(async (id: string) => {
    await supabase.from('anotacoes_artigo' as any).delete().eq('id', id);
    setNotas(prev => prev.filter(n => n.id !== id));
  }, []);

  const handleAdd = async () => {
    await addNote(novaTexto);
    setNovaTexto('');
  };

  const handleSugerir = async () => {
    setSugerindo(true);
    setSugestoes([]);
    try {
      const { data, error } = await supabase.functions.invoke('assistente-juridica', {
        body: {
          mode: 'sugerir-anotacoes',
          artigoTexto,
          artigoNumero,
          leiNome: tabelaNome,
        },
      });
      if (!error && data?.reply) {
        // Parse numbered list from AI response
        const lines = data.reply.split('\n')
          .map((l: string) => l.replace(/^\d+[\.\)]\s*/, '').replace(/^\*\*/, '').replace(/\*\*$/, '').replace(/^[-•]\s*/, '').trim())
          .filter((l: string) => l.length > 10);
        setSugestoes(lines.slice(0, 6));
      }
    } catch (e) {
      console.error('Erro ao sugerir anotações:', e);
    } finally {
      setSugerindo(false);
    }
  };

  const handleAddSugestao = async (texto: string) => {
    await addNote(texto, true);
    setSugestoes(prev => prev.filter(s => s !== texto));
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-[60]"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="fixed bottom-0 left-0 right-0 z-[61] bg-card rounded-t-[2rem] border-t border-border/50 flex flex-col shadow-[0_-8px_40px_rgba(0,0,0,0.4)] md:max-w-lg md:mx-auto"
        style={{ maxHeight: '88vh' }}
      >
        <div className="w-10 h-1 rounded-full bg-muted-foreground/20 mx-auto mt-3 mb-1" />
        
        {/* Header */}
        <div className="px-6 py-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground font-display tracking-tight">Anotações</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary/60 hover:bg-secondary flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-4">
          {/* Input area */}
          <div className="flex gap-3 items-end">
            <Textarea
              value={novaTexto}
              onChange={e => setNovaTexto(e.target.value)}
              placeholder="Escreva sua anotação..."
              className="min-h-[90px] rounded-2xl bg-secondary/30 border-border/40 text-sm resize-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground/50"
            />
            <button
              onClick={handleAdd}
              disabled={!novaTexto.trim()}
              className="shrink-0 w-11 h-11 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-30 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Suggest button */}
          <button
            onClick={handleSugerir}
            disabled={sugerindo}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary/15 border border-primary/25 text-sm font-semibold text-primary hover:bg-primary/25 hover:border-primary/40 transition-all active:scale-[0.98]"
          >
            {sugerindo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {sugerindo ? 'Gerando sugestões...' : 'Sugerir anotações com IA'}
          </button>

          {/* AI suggestions */}
          {sugestoes.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Sugestões da IA</p>
              {sugestoes.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleAddSugestao(s)}
                  className="w-full text-left p-3 rounded-xl bg-primary/10 border border-primary/20 hover:border-primary/40 transition-all text-sm text-foreground/90 leading-relaxed"
                >
                  <span className="text-primary mr-1">+</span> {s}
                </button>
              ))}
            </div>
          )}

          {/* Existing notes */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : notas.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Suas anotações ({notas.length})
              </p>
              {notas.map(nota => (
                <div
                  key={nota.id}
                  className={`p-3 rounded-xl border text-sm leading-relaxed flex items-start gap-2 ${
                    nota.sugerida
                      ? 'bg-primary/5 border-primary/20 text-foreground/90'
                      : 'bg-secondary/40 border-border text-foreground'
                  }`}
                >
                  <p className="flex-1">{nota.texto}</p>
                  <button
                    onClick={() => deleteNote(nota.id)}
                    className="shrink-0 w-7 h-7 rounded-lg hover:bg-destructive/20 flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground text-sm py-6">
              Nenhuma anotação ainda. Escreva ou peça sugestões à IA.
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AnotacoesSheet;
