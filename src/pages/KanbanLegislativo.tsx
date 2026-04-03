import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Kanban, Filter, RefreshCw, Loader2, ChevronRight, Calendar, User, Clock, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';

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

/* ── Draggable Card ── */
function DraggableCard({ item, onClick }: { item: KanbanItem; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { item },
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="touch-manipulation">
      <Card className="hover:border-primary/40 transition-all group">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {/* Drag handle */}
              <button
                {...listeners}
                {...attributes}
                className="cursor-grab active:cursor-grabbing touch-manipulation p-0.5 -ml-1 text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="w-3.5 h-3.5" />
              </button>
              <Badge className={`text-[10px] px-1.5 py-0 ${TIPO_COLORS[item.sigla_tipo] || 'bg-muted'}`}>
                {item.sigla_tipo}
              </Badge>
              <span className="text-xs font-bold text-foreground">
                {item.numero}/{item.ano}
              </span>
            </div>
            <button onClick={onClick} className="shrink-0 mt-0.5">
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
            </button>
          </div>

          <div onClick={onClick} className="cursor-pointer">
            {item.ementa && (
              <p className="text-[11px] text-muted-foreground line-clamp-3 leading-tight">
                {item.ementa}
              </p>
            )}

            <div className="flex items-center gap-2 flex-wrap mt-2">
              {item.lei_afetada && (
                <Badge variant="outline" className="text-[9px] h-4 px-1 bg-amber-500/10 text-amber-400 border-amber-500/25">
                  ⚖️ {item.lei_afetada}
                </Badge>
              )}
              {item.autor && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 truncate max-w-[140px]">
                  <User className="w-2.5 h-2.5 shrink-0" />
                  {item.autor.split(',')[0]}
                </span>
              )}
              {item.data_ultima_acao && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {formatDate(item.data_ultima_acao)}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Overlay Card (shown while dragging) ── */
function OverlayCard({ item }: { item: KanbanItem }) {
  return (
    <div className="w-[230px] rotate-2 shadow-2xl">
      <Card className="border-primary/50 bg-card">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <GripVertical className="w-3.5 h-3.5 text-primary" />
            <Badge className={`text-[10px] px-1.5 py-0 ${TIPO_COLORS[item.sigla_tipo] || 'bg-muted'}`}>
              {item.sigla_tipo}
            </Badge>
            <span className="text-xs font-bold text-foreground">
              {item.numero}/{item.ano}
            </span>
          </div>
          {item.ementa && (
            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-tight">
              {item.ementa}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Droppable Column ── */
function DroppableColumn({ columnKey, children, color, label, icon, count }: {
  columnKey: string;
  children: React.ReactNode;
  color: string;
  label: string;
  icon: string;
  count: number;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: columnKey });

  return (
    <div ref={setNodeRef} className="flex flex-col">
      <div className={`rounded-xl border bg-gradient-to-b ${color} p-3 mb-3 transition-all ${isOver ? 'ring-2 ring-primary scale-[1.02]' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            <span className="text-sm font-semibold text-foreground">{label}</span>
          </div>
          <Badge variant="secondary" className="text-[10px] h-5 min-w-[20px] justify-center">
            {count}
          </Badge>
        </div>
      </div>
      <div className={`space-y-2 flex-1 min-h-[100px] rounded-xl transition-colors ${isOver ? 'bg-primary/5' : ''}`}>
        {children}
      </div>
    </div>
  );
}

const KanbanLegislativo = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [items, setItems] = useState<KanbanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [filterLei, setFilterLei] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<KanbanItem | null>(null);
  const [activeItem, setActiveItem] = useState<KanbanItem | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 8 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } });
  const sensors = useSensors(pointerSensor, touchSensor);

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
    let result = items;
    if (filterTipo !== 'all') result = result.filter(i => i.sigla_tipo === filterTipo);
    if (filterLei !== 'all') result = result.filter(i => i.lei_afetada?.includes(filterLei));
    return result;
  }, [items, filterTipo, filterLei]);

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

  const leisDisponiveis = useMemo(() => {
    const leis = new Set<string>();
    items.forEach(i => {
      if (i.lei_afetada) {
        i.lei_afetada.split(', ').forEach(l => leis.add(l));
      }
    });
    return Array.from(leis).sort();
  }, [items]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const item = event.active.data.current?.item as KanbanItem;
    if (item) setActiveItem(item);
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = event;
    if (!over) return;

    const draggedItem = active.data.current?.item as KanbanItem;
    if (!draggedItem) return;

    const newStatus = over.id as string;
    if (!COLUMNS.some(c => c.key === newStatus)) return;
    if (draggedItem.status_kanban === newStatus) return;

    // Optimistic update
    setItems(prev => prev.map(item =>
      item.id === draggedItem.id ? { ...item, status_kanban: newStatus } : item
    ));

    // Persist to DB
    const { error } = await supabase
      .from('kanban_proposicoes')
      .update({ status_kanban: newStatus, atualizado_em: new Date().toISOString() } as any)
      .eq('id', draggedItem.id);

    if (error) {
      toast.error('Erro ao mover proposição');
      setItems(prev => prev.map(item =>
        item.id === draggedItem.id ? { ...item, status_kanban: draggedItem.status_kanban } : item
      ));
    } else {
      const colLabel = COLUMNS.find(c => c.key === newStatus)?.label || newStatus;
      toast.success(`Movido para "${colLabel}"`);
    }
  }, []);

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

              {selectedItem.ementa && (
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Ementa</p>
                    <p className="text-sm text-foreground leading-relaxed">{selectedItem.ementa}</p>
                  </CardContent>
                </Card>
              )}

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

        {leisDisponiveis.length > 0 && (
          <Select value={filterLei} onValueChange={setFilterLei}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue placeholder="Lei afetada" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as leis</SelectItem>
              {leisDisponiveis.map(l => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

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

      {/* Kanban board with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          ref={scrollRef}
          className="max-w-4xl mx-auto px-4 sm:px-6 py-4 overflow-x-auto scrollbar-hide"
        >
          <div className="flex gap-4" style={{ minWidth: isMobile ? `${COLUMNS.length * 260}px` : undefined }}>
            {columnData.map(col => (
              <div key={col.key} className={`${isMobile ? 'min-w-[240px] w-[240px]' : 'flex-1 min-w-[200px]'}`}>
                <DroppableColumn
                  columnKey={col.key}
                  color={col.color}
                  label={col.label}
                  icon={col.icon}
                  count={col.items.length}
                >
                  {col.items.length === 0 && (
                    <div className="text-center py-8 text-xs text-muted-foreground">
                      Nenhuma proposição
                    </div>
                  )}
                  {col.items.map(item => (
                    <DraggableCard
                      key={item.id}
                      item={item}
                      onClick={() => setSelectedItem(item)}
                    />
                  ))}
                </DroppableColumn>
              </div>
            ))}
          </div>
        </div>

        <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
          {activeItem ? <OverlayCard item={activeItem} /> : null}
        </DragOverlay>
      </DndContext>

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
