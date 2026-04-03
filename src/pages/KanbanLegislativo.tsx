import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Kanban, Filter, RefreshCw, Loader2, ChevronRight, Calendar, User, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

interface KanbanItem {
  id: string;
  id_externo: string;
  sigla_tipo: string;
  numero: number;
  ano: number;
  ementa: string | null;
  autor: string | null;
  lei_afetada: string | null;
  status_kanban: string;
  situacao_camara: string | null;
  data_ultima_acao: string | null;
  data_votacao: string | null;
  resultado_votacao: string | null;
  data_publicacao: string | null;
  numero_lei_publicada: string | null;
  dados_json: any;
  atualizado_em: string | null;
}

const COLUMNS = [
  { key: 'tramitando', label: 'Tramitando', icon: '📋', color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30' },
  { key: 'votacao', label: 'Em votação', icon: '🗳️', color: 'from-amber-500/20 to-amber-600/10 border-amber-500/30' },
  { key: 'sancao', label: 'Sanção/Veto', icon: '✍️', color: 'from-purple-500/20 to-purple-600/10 border-purple-500/30' },
  { key: 'publicada', label: 'Publicada', icon: '✅', color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30' },
];

const TIPO_COLORS: Record<string, string> = {
  'PL': 'bg-violet-500/15 text-violet-400 border-violet-500/25',
  'PLP': 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  'PEC': 'bg-sky-500/15 text-sky-400 border-sky-500/25',
  'MPV': 'bg-rose-500/15 text-rose-400 border-rose-500/25',
  'PDL': 'bg-teal-500/15 text-teal-400 border-teal-500/25',
};

function formatDate(d: string | null) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  } catch { return null; }
}

const KanbanLegislativo = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [items, setItems] = useState<KanbanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<KanbanItem | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('kanban_proposicoes')
      .select('*')
      .order('atualizado_em', { ascending: false });

    if (!error && data) {
      setItems(data as KanbanItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();

    // Realtime subscription
    const channel = supabase
      .channel('kanban-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kanban_proposicoes' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setItems(prev => prev.map(item => 
            item.id === (payload.new as KanbanItem).id ? payload.new as KanbanItem : item
          ));
        } else if (payload.eventType === 'INSERT') {
          setItems(prev => [payload.new as KanbanItem, ...prev]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await supabase.functions.invoke('atualizar-kanban');
      await fetchItems();
    } catch (e) {
      console.error(e);
    }
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    if (filterTipo === 'all') return items;
    return items.filter(i => i.sigla_tipo === filterTipo);
  }, [items, filterTipo]);

  const columnData = useMemo(() => {
    return COLUMNS.map(col => ({
      ...col,
      items: filtered.filter(i => i.status_kanban === col.key),
    }));
  }, [filtered]);

  const tiposDisponiveis = useMemo(() => {
    const tipos = new Set(items.map(i => i.sigla_tipo));
    return Array.from(tipos).sort();
  }, [items]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 px-4 pt-10 pb-8">
          <Skeleton className="h-8 w-40 bg-white/20" />
        </div>
        <div className="p-4 flex gap-4 overflow-x-auto">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="min-w-[260px] space-y-3">
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Detail overlay */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            className="fixed inset-0 z-50 bg-background overflow-y-auto"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          >
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 px-4 pt-10 pb-6">
              <button
                onClick={() => setSelectedItem(null)}
                className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white font-medium text-sm px-3 py-1.5 rounded-lg mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>
              <h1 className="text-xl font-bold text-white">
                {selectedItem.sigla_tipo} {selectedItem.numero}/{selectedItem.ano}
              </h1>
              <Badge className={`mt-2 ${TIPO_COLORS[selectedItem.sigla_tipo] || 'bg-muted text-muted-foreground'}`}>
                {selectedItem.sigla_tipo}
              </Badge>
            </div>
            <div className="p-4 space-y-4 max-w-2xl mx-auto">
              {/* Status */}
              <Card>
                <CardContent className="p-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Status</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{COLUMNS.find(c => c.key === selectedItem.status_kanban)?.icon}</span>
                    <span className="font-semibold text-foreground capitalize">{selectedItem.status_kanban}</span>
                  </div>
                  {selectedItem.situacao_camara && (
                    <p className="text-sm text-muted-foreground">{selectedItem.situacao_camara}</p>
                  )}
                </CardContent>
              </Card>

              {/* Ementa */}
              {selectedItem.ementa && (
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Ementa</p>
                    <p className="text-sm text-foreground leading-relaxed">{selectedItem.ementa}</p>
                  </CardContent>
                </Card>
              )}

              {/* Author */}
              {selectedItem.autor && (
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                      <User className="w-3 h-3" /> Autor(es)
                    </p>
                    <p className="text-sm text-foreground">{selectedItem.autor}</p>
                  </CardContent>
                </Card>
              )}

              {/* Dates */}
              <Card>
                <CardContent className="p-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Datas
                  </p>
                  <div className="space-y-1 text-sm">
                    {selectedItem.data_ultima_acao && (
                      <p>Última ação: <span className="text-foreground font-medium">{formatDate(selectedItem.data_ultima_acao)}</span></p>
                    )}
                    {selectedItem.data_votacao && (
                      <p>Votação: <span className="text-foreground font-medium">{formatDate(selectedItem.data_votacao)}</span>
                        {selectedItem.resultado_votacao && <Badge variant="outline" className="ml-2 text-[10px]">{selectedItem.resultado_votacao}</Badge>}
                      </p>
                    )}
                    {selectedItem.data_publicacao && (
                      <p>Publicação: <span className="text-foreground font-medium">{formatDate(selectedItem.data_publicacao)}</span></p>
                    )}
                    {selectedItem.numero_lei_publicada && (
                      <p>Lei publicada: <span className="text-foreground font-medium">{selectedItem.numero_lei_publicada}</span></p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Link to Câmara */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(`https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=${selectedItem.id_externo}`, '_blank')}
              >
                Ver na Câmara dos Deputados
                <ChevronRight className="w-4 h-4 ml-auto" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="relative bg-gradient-to-br from-indigo-600 to-violet-700 overflow-hidden px-4 pt-10 pb-8 sm:px-6">
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/5" />
        <Kanban className="absolute top-5 right-5 w-10 h-10 text-white/15 rotate-12" />

        <div className="relative max-w-4xl mx-auto z-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white font-medium text-sm px-3 py-1.5 rounded-lg mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <h1 className="font-display text-2xl text-white font-bold">
            Kanban Legislativo
          </h1>
          <p className="text-white/70 text-sm mt-1">
            Acompanhe o ciclo de vida das proposições em tempo real
          </p>
        </div>
      </div>

      {/* Filters & refresh */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3 sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {tiposDisponiveis.map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="sm"
          className="ml-auto h-8 text-xs gap-1"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Kanban board */}
      <div
        ref={scrollRef}
        className="max-w-4xl mx-auto px-4 sm:px-6 py-4 overflow-x-auto scrollbar-hide"
      >
        <div className="flex gap-4" style={{ minWidth: isMobile ? `${COLUMNS.length * 260}px` : undefined }}>
          {columnData.map(col => (
            <div key={col.key} className={`${isMobile ? 'min-w-[240px] w-[240px]' : 'flex-1 min-w-[200px]'}`}>
              {/* Column header */}
              <div className={`rounded-xl border bg-gradient-to-b ${col.color} p-3 mb-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{col.icon}</span>
                    <span className="text-sm font-semibold text-foreground">{col.label}</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] h-5 min-w-[20px] justify-center">
                    {col.items.length}
                  </Badge>
                </div>
              </div>

              {/* Column items */}
              <div className="space-y-2">
                {col.items.length === 0 && (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    Nenhuma proposição
                  </div>
                )}
                {col.items.map(item => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setSelectedItem(item)}
                    className="cursor-pointer"
                  >
                    <Card className="hover:border-primary/40 transition-all group">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <Badge className={`text-[10px] px-1.5 py-0 ${TIPO_COLORS[item.sigla_tipo] || 'bg-muted'}`}>
                              {item.sigla_tipo}
                            </Badge>
                            <span className="text-xs font-bold text-foreground">
                              {item.numero}/{item.ano}
                            </span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0 mt-0.5" />
                        </div>

                        {item.ementa && (
                          <p className="text-[11px] text-muted-foreground line-clamp-3 leading-tight">
                            {item.ementa}
                          </p>
                        )}

                        <div className="flex items-center gap-2 flex-wrap">
                          {item.lei_afetada && (
                            <Badge variant="outline" className="text-[9px] h-4 px-1">
                              {item.lei_afetada}
                            </Badge>
                          )}
                          {item.data_ultima_acao && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {formatDate(item.data_ultima_acao)}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {items.length === 0 && !loading && (
        <div className="text-center py-16 px-4">
          <Kanban className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm mb-4">
            Nenhuma proposição monitorada ainda.
          </p>
          <Button onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Buscar proposições
          </Button>
        </div>
      )}
    </div>
  );
};

export default KanbanLegislativo;
