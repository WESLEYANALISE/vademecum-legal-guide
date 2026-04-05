import { useEffect, useState, useMemo, useCallback } from 'react';
import { ArrowLeft, Loader2, BarChart3, Play, Square, RefreshCw, Trash2, ChevronRight, Check, Globe, Pause } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getLeisCatalog } from '@/services/legislacaoService';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

const MODOS = [
  { key: 'explicacao', label: 'Explicação', color: 'bg-green-500' },
  { key: 'exemplo', label: 'Exemplos', color: 'bg-blue-500' },
  { key: 'termos', label: 'Termos-chave', color: 'bg-purple-500' },
  { key: 'quiz', label: 'Questões', color: 'bg-orange-500' },
  { key: 'flashcard', label: 'Flashcards', color: 'bg-pink-500' },
  { key: 'grifos', label: 'Grifos IA', color: 'bg-cyan-500' },
  { key: 'video', label: 'Vídeos', color: 'bg-red-500' },
] as const;

type CacheMap = Record<string, Record<string, Set<string>>>;

interface GeneratingState {
  tabela: string;
  modo: string;
  artigo: string;
  progress: number;
  total: number;
}

interface LeiDetail {
  tabela_nome: string;
  nome: string;
  sigla: string;
  iconColor?: string;
}

/* ─── Geração Global Card Component ─── */
const GeracaoGlobalCard = () => {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const [ticking, setTicking] = useState(false);
  const tickingRef = useRef(false);

  const { data: globalState, refetch } = useQuery({
    queryKey: ['geracao-global'],
    queryFn: async () => {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/gerar-global`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${anonKey}` },
      });
      return res.json();
    },
    refetchInterval: 3000,
  });

  const isRunning = globalState?.status === 'running';
  const isDone = globalState?.status === 'done';
  const isPaused = globalState?.status === 'paused';
  const total = globalState?.total_pendentes || 0;
  const processed = globalState?.total_processadas || 0;
  const errors = globalState?.total_erros || 0;
  const pct = total > 0 ? Math.round((processed / total) * 100) : 0;

  // Auto-tick loop: when running, continuously call tick
  useEffect(() => {
    if (!isRunning) {
      tickingRef.current = false;
      setTicking(false);
      return;
    }
    if (tickingRef.current) return; // already ticking
    tickingRef.current = true;
    setTicking(true);

    const runTicks = async () => {
      while (tickingRef.current) {
        try {
          const res = await fetch(`https://${projectId}.supabase.co/functions/v1/gerar-global`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anonKey}` },
            body: JSON.stringify({ action: 'tick' }),
          });
          const data = await res.json();
          refetch();

          if (data.stopped || data.done) {
            tickingRef.current = false;
            setTicking(false);
            break;
          }

          if (data.rateLimited) {
            // Wait 2 minutes on rate limit
            await new Promise(r => setTimeout(r, 120000));
          } else {
            // Normal pace: 8s between ticks
            await new Promise(r => setTimeout(r, 8000));
          }
        } catch {
          await new Promise(r => setTimeout(r, 10000));
        }
      }
    };

    runTicks();

    return () => {
      tickingRef.current = false;
      setTicking(false);
    };
  }, [isRunning, projectId, anonKey, refetch]);

  const handleStart = async () => {
    toast.info('Iniciando geração global...');
    await fetch(`https://${projectId}.supabase.co/functions/v1/gerar-global`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anonKey}` },
      body: JSON.stringify({ action: 'start' }),
    });
    refetch();
  };

  const handleStop = async () => {
    tickingRef.current = false;
    await fetch(`https://${projectId}.supabase.co/functions/v1/gerar-global`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anonKey}` },
      body: JSON.stringify({ action: 'stop' }),
    });
    toast.info('Geração global pausada');
    refetch();
  };

  return (
    <div className="rounded-2xl bg-card border-2 border-primary/30 p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <Globe className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-display text-sm font-bold text-foreground">Geração Global</p>
          <p className="text-[11px] font-body text-muted-foreground">
            {isRunning && ticking ? 'Processando...' : isRunning ? 'Aguardando tick...' : isDone ? 'Concluído!' : isPaused ? 'Pausado' : 'Pronto para iniciar'}
          </p>
        </div>
        {isRunning ? (
          <button onClick={handleStop} className="px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold flex items-center gap-1.5 hover:bg-destructive/20 transition-colors">
            <Pause className="w-3.5 h-3.5" /> Parar
          </button>
        ) : (
          <button onClick={handleStart} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 hover:bg-primary/90 transition-colors">
            <Play className="w-3.5 h-3.5" /> {isPaused ? 'Retomar' : 'Iniciar'}
          </button>
        )}
      </div>

      {total > 0 && (
        <>
          <Progress value={pct} className="h-2.5" />
          <div className="flex items-center justify-between text-[11px] font-body text-muted-foreground">
            <span>{processed.toLocaleString()} / {total.toLocaleString()} ({pct}%)</span>
            {errors > 0 && <span className="text-destructive">{errors} erros</span>}
          </div>
          {isRunning && globalState?.current_tabela && (
            <div className="flex items-center gap-2 text-[11px] font-body text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2">
              <Loader2 className="w-3 h-3 animate-spin text-primary shrink-0" />
              <span className="truncate">
                {globalState.current_tabela?.replace(/_/g, ' ')} → {globalState.current_artigo} [{globalState.current_modo}]
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const GeracaoAdmin = () => {
  const navigate = useNavigate();
  const catalog = useMemo(() => getLeisCatalog(), []);

  const [loading, setLoading] = useState(true);
  const [totalArtigos, setTotalArtigos] = useState<Record<string, number>>({});
  const [cacheMap, setCacheMap] = useState<CacheMap>({});
  const [generating, setGenerating] = useState<GeneratingState | null>(null);
  const [abortRef] = useState({ current: false });

  // Detail view state
  const [selectedLei, setSelectedLei] = useState<LeiDetail | null>(null);
  const [selectedModo, setSelectedModo] = useState<string | null>(null);
  const [artigos, setArtigos] = useState<Array<{ numero: string; caput: string }>>([]);
  const [artigosLoading, setArtigosLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const countPromises = catalog.map(async (lei) => {
      const { count } = await supabase
        .from(lei.tabela_nome as any)
        .select('*', { count: 'exact', head: true });
      return { tabela: lei.tabela_nome, count: count ?? 0 };
    });

    const cachePromise = supabase
      .from('artigo_ai_cache')
      .select('tabela_nome, modo, artigo_numero')
      .limit(10000);

    const [counts, cacheResult] = await Promise.all([
      Promise.all(countPromises),
      cachePromise,
    ]);

    const totals: Record<string, number> = {};
    counts.forEach(c => { totals[c.tabela] = c.count; });
    setTotalArtigos(totals);

    const map: CacheMap = {};
    (cacheResult.data ?? []).forEach((row: any) => {
      if (!map[row.tabela_nome]) map[row.tabela_nome] = {};
      if (!map[row.tabela_nome][row.modo]) map[row.tabela_nome][row.modo] = new Set();
      map[row.tabela_nome][row.modo].add(row.artigo_numero);
    });
    setCacheMap(map);
    setLoading(false);
  }

  function getPct(tabela: string, modo: string): number {
    const total = totalArtigos[tabela] || 0;
    if (total === 0) return 0;
    const cached = cacheMap[tabela]?.[modo]?.size ?? 0;
    return Math.round((cached / total) * 100);
  }

  function getCachedCount(tabela: string, modo: string): number {
    return cacheMap[tabela]?.[modo]?.size ?? 0;
  }

  const overallPct = useMemo(() => {
    if (catalog.length === 0) return 0;
    let sum = 0, count = 0;
    catalog.forEach(lei => {
      MODOS.forEach(m => { sum += getPct(lei.tabela_nome, m.key); count++; });
    });
    return count > 0 ? Math.round(sum / count) : 0;
  }, [totalArtigos, cacheMap, catalog]);

  // Open detail view for a law + mode
  const openDetail = async (lei: LeiDetail, modo: string) => {
    setSelectedLei(lei);
    setSelectedModo(modo);
    setArtigosLoading(true);
    const { data } = await supabase
      .from(lei.tabela_nome as any)
      .select('numero, caput')
      .order('ordem_numero', { ascending: true })
      .limit(10000);
    setArtigos((data as any[]) || []);
    setArtigosLoading(false);
  };

  const closeDetail = () => {
    setSelectedLei(null);
    setSelectedModo(null);
    setArtigos([]);
  };

  // Generate single article
  const generateSingle = async (tabela: string, modo: string, artNumero: string) => {
    if (generating) return;
    setGenerating({ tabela, modo, artigo: artNumero, progress: 1, total: 1 });
    try {
      if (modo === 'video') {
        const result = await generateVideo(tabela, artNumero);
        if (result === 'quota') { toast.error('Cota do YouTube esgotada! Reseta à meia-noite (horário do Pacífico).'); setGenerating(null); return; }
      } else {
        const prompt = getPromptForMode(modo, artNumero, tabela);
        const { data } = await supabase.functions.invoke('assistente-juridica', {
          body: { messages: [{ role: 'user', content: prompt }], tabelaNome: tabela, artigoNumero: artNumero },
        });
        const content = data?.resposta || data?.reply || '';
        if (content) {
          await supabase.from('artigo_ai_cache').upsert(
            { tabela_nome: tabela, artigo_numero: artNumero, modo, conteudo: content },
            { onConflict: 'tabela_nome,artigo_numero,modo' }
          );
          updateLocalCache(tabela, modo, artNumero);
        }
      }
      toast.success(`${modo} gerado para ${artNumero}`);
    } catch (e) {
      console.error(e);
      toast.error(`Erro ao gerar ${modo}`);
    }
    setGenerating(null);
  };

  // Generate all pending for a law+mode
  const generateAll = async (tabela: string, modo: string) => {
    if (generating) return;
    abortRef.current = false;

    const { data: allArt } = await supabase
      .from(tabela as any)
      .select('numero')
      .order('ordem_numero', { ascending: true })
      .limit(10000);
    if (!allArt?.length) return;

    const cached = cacheMap[tabela]?.[modo] ?? new Set();
    const pending = (allArt as any[]).filter(a => !cached.has(a.numero));
    if (pending.length === 0) { toast.info('Tudo já gerado!'); return; }

    toast.info(`Gerando ${modo}: ${pending.length} pendentes`);

    for (let i = 0; i < pending.length; i++) {
      if (abortRef.current) { toast.info('Interrompido'); break; }
      const art = pending[i];
      setGenerating({ tabela, modo, artigo: art.numero, progress: i + 1, total: pending.length });

      try {
        if (modo === 'video') {
          const result = await generateVideo(tabela, art.numero);
          if (result === 'quota') {
            toast.error('Cota do YouTube esgotada! Reseta à meia-noite (horário do Pacífico).');
            break;
          }
        } else {
          const prompt = getPromptForMode(modo, art.numero, tabela);
          const { data } = await supabase.functions.invoke('assistente-juridica', {
            body: { messages: [{ role: 'user', content: prompt }], tabelaNome: tabela, artigoNumero: art.numero },
          });
          const content = data?.resposta || data?.reply || '';
          if (content) {
            await supabase.from('artigo_ai_cache').upsert(
              { tabela_nome: tabela, artigo_numero: art.numero, modo, conteudo: content },
              { onConflict: 'tabela_nome,artigo_numero,modo' }
            );
            updateLocalCache(tabela, modo, art.numero);
          }
        }
      } catch (e) { console.error(e); }
      await new Promise(r => setTimeout(r, 1500));
    }
    setGenerating(null);
    toast.success(`Geração de ${modo} concluída!`);
  };

  const generateVideo = async (tabela: string, artNumero: string): Promise<'ok' | 'quota'> => {
    const lei = catalog.find(l => l.tabela_nome === tabela);
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

    // 1. Buscar vídeo + transcrição
    const res = await fetch(`https://${projectId}.supabase.co/functions/v1/buscar-videoaulas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
      body: JSON.stringify({ artigoNumero: artNumero, artigoTexto: artNumero, leiNome: lei?.nome || '' }),
    });
    const data = await res.json();

    // Se a cota do YouTube acabou, parar imediatamente
    if (data.quotaExceeded) return 'quota';

    const video = data.videos?.[0];
    if (!video) return 'ok';

    const transcricao = video.transcricao || '';
    const contexto = transcricao
      ? `Transcrição da videoaula "${video.titulo}":\n${transcricao.substring(0, 6000)}`
      : `Videoaula "${video.titulo}" sobre ${artNumero} da ${lei?.nome || tabela}`;

    // 2. Gerar resumo, questões e flashcards em paralelo
    const [resumoRes, questoesRes, flashcardsRes] = await Promise.all([
      supabase.functions.invoke('assistente-juridica', {
        body: { messages: [{ role: 'user', content: `${contexto}\n\nCom base no conteúdo acima, gere um resumo hierárquico e estruturado para estudo. Use títulos com ##, subtítulos com ###, bullets, negrito em termos-chave. Seja didático e completo.` }] },
      }),
      supabase.functions.invoke('assistente-juridica', {
        body: { messages: [{ role: 'user', content: `${contexto}\n\nGere entre 10 e 15 questões de múltipla escolha no estilo OAB/concurso baseadas EXCLUSIVAMENTE no conteúdo acima. Responda APENAS com JSON: [{"pergunta":"...","alternativas":["a)...","b)...","c)...","d)..."],"correta":0,"comentario":"Explicação detalhada"}]` }] },
      }),
      supabase.functions.invoke('assistente-juridica', {
        body: { messages: [{ role: 'user', content: `${contexto}\n\nGere entre 10 e 15 flashcards de estudo baseados EXCLUSIVAMENTE no conteúdo acima. Responda APENAS com JSON: [{"frente":"Pergunta","verso":"Resposta completa","comentario":"Dica ou contexto adicional"}]` }] },
      }),
    ]);

    const resumo = resumoRes.data?.resposta || resumoRes.data?.reply || '';
    const questoes = questoesRes.data?.resposta || questoesRes.data?.reply || '';
    const flashcards = flashcardsRes.data?.resposta || flashcardsRes.data?.reply || '';

    const pacote = JSON.stringify({
      ...video,
      resumo,
      questoes,
      flashcards,
    });

    await supabase.from('artigo_ai_cache').upsert(
      { tabela_nome: tabela, artigo_numero: artNumero, modo: 'video', conteudo: pacote },
      { onConflict: 'tabela_nome,artigo_numero,modo' }
    );
    updateLocalCache(tabela, 'video', artNumero);
    return 'ok';
  };

  // Delete single cache entry
  const deleteSingle = async (tabela: string, modo: string, artNumero: string) => {
    await supabase.from('artigo_ai_cache')
      .delete()
      .eq('tabela_nome', tabela)
      .eq('artigo_numero', artNumero)
      .eq('modo', modo);

    setCacheMap(prev => {
      const next = { ...prev };
      if (next[tabela]?.[modo]) {
        const s = new Set(next[tabela][modo]);
        s.delete(artNumero);
        next[tabela] = { ...next[tabela], [modo]: s };
      }
      return next;
    });
    toast.success(`Cache apagado: ${artNumero}`);
  };

  const updateLocalCache = (tabela: string, modo: string, artNumero: string) => {
    setCacheMap(prev => {
      const next = { ...prev };
      if (!next[tabela]) next[tabela] = {};
      if (!next[tabela][modo]) next[tabela][modo] = new Set();
      next[tabela][modo] = new Set(next[tabela][modo]).add(artNumero);
      return next;
    });
  };

  const handleStop = () => { abortRef.current = true; };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-lg font-bold text-foreground">Geração Admin</h1>
          <p className="text-[11px] font-body text-muted-foreground">Progresso do conteúdo IA por lei</p>
        </div>
        <button onClick={loadData} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center" title="Recarregar">
          <RefreshCw className="w-4 h-4 text-foreground" />
        </button>
      </div>

      {/* Generating banner */}
      {generating && (
        <div className="sticky top-[57px] z-10 bg-primary/10 border-b border-primary/20 px-4 py-3 flex items-center gap-3">
          <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">
              Gerando {generating.modo}: {generating.artigo}
            </p>
            <p className="text-[11px] text-muted-foreground">{generating.progress}/{generating.total}</p>
          </div>
          <button onClick={handleStop} className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold flex items-center gap-1.5 hover:bg-destructive/20 transition-colors">
            <Square className="w-3 h-3" /> Parar
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="max-w-4xl mx-auto p-4 space-y-4">
          {/* ─── Geração Global Card ─── */}
          <GeracaoGlobalCard />

          {/* Summary */}
          <div className="rounded-2xl bg-card border border-border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-display text-sm font-bold text-foreground">Progresso Geral</p>
                <p className="text-[11px] font-body text-muted-foreground">{catalog.length} leis • {MODOS.length} categorias</p>
              </div>
              <span className="font-display text-2xl font-bold text-primary">{overallPct}%</span>
            </div>
            <Progress value={overallPct} className="h-2.5" />
          </div>

          {/* Per-law cards */}
          {catalog.map(lei => {
            const total = totalArtigos[lei.tabela_nome] || 0;
            return (
              <div key={lei.id} className="rounded-2xl bg-card border border-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-8 rounded-full" style={{ backgroundColor: lei.iconColor || 'hsl(var(--primary))' }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm font-bold text-foreground truncate">{lei.nome}</p>
                    <p className="text-[11px] font-body text-muted-foreground">{lei.sigla} • {total} artigos</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {MODOS.map(modo => {
                    const pct = getPct(lei.tabela_nome, modo.key);
                    const cached = getCachedCount(lei.tabela_nome, modo.key);
                    return (
                      <button
                        key={modo.key}
                        onClick={() => openDetail(
                          { tabela_nome: lei.tabela_nome, nome: lei.nome, sigla: lei.sigla, iconColor: lei.iconColor },
                          modo.key
                        )}
                        className="w-full flex items-center gap-2 group hover:bg-secondary/50 rounded-lg px-1 py-1 -mx-1 transition-colors"
                      >
                        <span className="text-[12px] font-body text-foreground/70 w-24 shrink-0 text-left">{modo.label}</span>
                        <div className="flex-1">
                          <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                            <div className={`h-full rounded-full transition-all ${modo.color}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <span className="text-[11px] font-body font-semibold text-foreground/80 w-16 text-right shrink-0">
                          {cached}/{total} <span className="text-muted-foreground">({pct}%)</span>
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Detail Overlay ─── */}
      <AnimatePresence>
        {selectedLei && selectedModo && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-[70]" onClick={closeDetail} />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-0 z-[71] bg-background flex flex-col items-center"
            >
              <div className="w-full max-w-3xl h-full flex flex-col min-h-0">
                {/* Detail header */}
                <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
                  <button onClick={closeDetail} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                    <ArrowLeft className="w-5 h-5 text-foreground" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-display text-sm font-bold text-foreground truncate">{selectedLei.nome}</h2>
                    <p className="text-[11px] font-body text-muted-foreground">
                      {MODOS.find(m => m.key === selectedModo)?.label} — {getCachedCount(selectedLei.tabela_nome, selectedModo)}/{totalArtigos[selectedLei.tabela_nome] || 0}
                    </p>
                  </div>
                  <button
                    onClick={() => generateAll(selectedLei.tabela_nome, selectedModo)}
                    disabled={!!generating}
                    className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40"
                  >
                    <Play className="w-3.5 h-3.5" /> Gerar tudo
                  </button>
                </div>

                {/* Article list */}
                <div className="flex-1 overflow-y-auto min-h-0">
                  {artigosLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {artigos.map(art => {
                        const isCached = cacheMap[selectedLei.tabela_nome]?.[selectedModo]?.has(art.numero);
                        const isCurrentlyGenerating = generating?.tabela === selectedLei.tabela_nome
                          && generating?.modo === selectedModo
                          && generating?.artigo === art.numero;
                        return (
                          <div key={art.numero} className="px-4 py-3 flex items-center gap-3">
                            {/* Status indicator */}
                            <div className={`w-2 h-2 rounded-full shrink-0 ${isCached ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                            {/* Article info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-semibold text-foreground truncate">{art.numero}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{art.caput?.substring(0, 80)}</p>
                            </div>
                            {/* Actions */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {isCurrentlyGenerating ? (
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                </div>
                              ) : isCached ? (
                                <>
                                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                    <Check className="w-4 h-4 text-emerald-500" />
                                  </div>
                                  <button
                                    onClick={() => deleteSingle(selectedLei.tabela_nome, selectedModo, art.numero)}
                                    className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors"
                                    title="Apagar cache"
                                  >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => generateSingle(selectedLei.tabela_nome, selectedModo, art.numero)}
                                  disabled={!!generating}
                                  className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors disabled:opacity-40"
                                  title="Gerar"
                                >
                                  <Play className="w-4 h-4 text-primary" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

function getPromptForMode(modo: string, artigo: string, tabela: string): string {
  const base = `Artigo: ${artigo} da tabela ${tabela}.`;
  switch (modo) {
    case 'explicacao':
      return `${base} Gere uma explicação didática e detalhada deste artigo de legislação brasileira. Inclua o significado, aplicação prática e importância. Seja direto, sem introdução.`;
    case 'exemplo':
      return `${base} Gere 3 exemplos práticos e realistas de aplicação deste artigo da legislação brasileira. Cada exemplo deve ter um cenário concreto e a conclusão jurídica.`;
    case 'termos':
      return `${base} Liste e explique os termos jurídicos mais importantes deste artigo da legislação brasileira. Para cada termo, dê: definição, contexto no artigo e uso prático.`;
    case 'quiz':
      return `${base} Gere 5 questões de múltipla escolha no estilo OAB/concurso sobre este artigo. Responda APENAS com JSON: [{"pergunta":"...","alternativas":["a)...","b)...","c)...","d)..."],"correta":0,"comentario":"..."}]`;
    case 'flashcard':
      return `${base} Gere 5 flashcards de estudo sobre este artigo. Responda APENAS com JSON: [{"frente":"Pergunta","verso":"Resposta","comentario":"Dica adicional"}]`;
    case 'grifos':
      return `${base} Identifique e destaque as partes mais importantes deste artigo para estudo. Liste os trechos-chave que devem ser grifados, explicando por que cada um é relevante.`;
    default:
      return `${base} Gere conteúdo de estudo sobre este artigo.`;
  }
}

export default GeracaoAdmin;
