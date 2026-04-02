import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Loader2, RefreshCw, Scale, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import MindMapSimple, { MindMapSimpleHandle } from './MindMapSimple';
import { exportMindMapPdf } from './MindMapPdfExport';

interface MindMapNode {
  label: string;
  children?: MindMapNode[];
}

interface MindMapViewProps {
  tabelaNome: string;
  artigoNumero: string;
  leiNome: string;
  onBack: () => void;
}

const MindMapView = ({ tabelaNome, artigoNumero, leiNome, onBack }: MindMapViewProps) => {
  const [data, setData] = useState<MindMapNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const mindMapRef = useRef<MindMapSimpleHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchMindMap = async (force = false) => {
    setLoading(true);
    setError('');

    try {
      if (!force) {
        const { data: cached } = await supabase
          .from('artigo_ai_cache')
          .select('conteudo')
          .eq('tabela_nome', tabelaNome)
          .eq('artigo_numero', artigoNumero)
          .eq('modo', 'mapa_mental')
          .maybeSingle();

        if (cached?.conteudo) {
          setData(JSON.parse(cached.conteudo));
          setLoading(false);
          return;
        }
      }

      const { data: result, error: fnError } = await supabase.functions.invoke('gerar-estudo', {
        body: { tabela_nome: tabelaNome, artigo_numero: artigoNumero, mode: 'mapa_mental' },
      });

      if (fnError) throw new Error(fnError.message);

      const parsed = result?.data;
      if (!parsed || !parsed.label) throw new Error('Formato inválido retornado pela IA');

      await supabase.from('artigo_ai_cache').upsert({
        tabela_nome: tabelaNome,
        artigo_numero: artigoNumero,
        modo: 'mapa_mental',
        conteudo: JSON.stringify(parsed),
      }, { onConflict: 'tabela_nome,artigo_numero,modo' } as any);

      setData(parsed);
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar mapa mental');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMindMap();
  }, [tabelaNome, artigoNumero]);

  const displayArtigo = artigoNumero.startsWith('Art.') ? artigoNumero : `Art. ${artigoNumero}`;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-gradient-to-br from-card to-secondary px-4 pt-10 pb-6 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <button onClick={onBack} className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm mb-3">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <h1 className="font-display text-xl text-white font-bold">{displayArtigo}</h1>
          <p className="text-white/60 text-sm">{leiNome} — Mapa Mental</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
          <div className="p-2.5 rounded-lg bg-primary/15">
            <Scale className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-sm font-bold text-foreground truncate">{leiNome}</h2>
            <p className="text-xs text-muted-foreground">{displayArtigo} — Mapa Mental</p>
          </div>
          {data && (
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  mindMapRef.current?.expandAll();
                  await new Promise(r => setTimeout(r, 300));
                  if (containerRef.current) {
                    await exportMindMapPdf(containerRef.current, leiNome, displayArtigo);
                  }
                  mindMapRef.current?.collapseDefaults();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                PDF
              </button>
              <button
                onClick={() => fetchMindMap(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-card border border-border text-muted-foreground hover:border-primary/40 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Regerar
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Gerando mapa mental com IA...</p>
          </motion.div>
        ) : error ? (
          <div className="p-6 rounded-xl bg-destructive/10 border border-destructive/30 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <button onClick={() => fetchMindMap(true)} className="mt-3 text-xs font-semibold text-primary hover:text-primary/80">
              Tentar novamente
            </button>
          </div>
        ) : data ? (
          <motion.div ref={containerRef} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <MindMapSimple data={data} ref={mindMapRef} />
          </motion.div>
        ) : null}
      </div>
    </div>
  );
};

export default MindMapView;
