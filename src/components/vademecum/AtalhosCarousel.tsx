import { useState, useEffect, useCallback, useRef } from 'react';
import { Scale, BookOpen, FileText, Newspaper, Gavel, Landmark, Shield, ScrollText, BookText, Baby, Settings, GripVertical, X, Flame, Check, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { getLeisCatalog } from '@/services/legislacaoService';

interface AtalhoItem {
  id: string;
  abbrev: string;
  sublabel: string;
  iconColor: string;
  gradient: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  cf88: Landmark, cc: BookOpen, cp: Gavel, cpc: FileText, cpp: Scale,
  clt: ScrollText, cdc: Shield, eca: Baby, ctn: BookText, noticias: Newspaper,
};

const GRADIENT_MAP: Record<string, string> = {
  cf88: 'from-amber-600/90 to-amber-800/70',
  cc: 'from-sky-600/90 to-sky-800/70',
  cp: 'from-emerald-600/90 to-emerald-800/70',
  cpc: 'from-violet-600/90 to-violet-800/70',
  cpp: 'from-orange-600/90 to-orange-800/70',
  clt: 'from-teal-600/90 to-teal-800/70',
  cdc: 'from-pink-600/90 to-pink-800/70',
  eca: 'from-cyan-600/90 to-cyan-800/70',
  ctn: 'from-lime-600/90 to-lime-800/70',
  noticias: 'from-rose-600/90 to-rose-800/70',
};

const ICON_COLOR_MAP: Record<string, string> = {
  cf88: 'text-amber-400', cc: 'text-sky-400', cp: 'text-emerald-400',
  cpc: 'text-violet-400', cpp: 'text-orange-400', clt: 'text-teal-400',
  cdc: 'text-pink-400', eca: 'text-cyan-400', ctn: 'text-lime-400',
  noticias: 'text-rose-400',
};

// Color palette for dynamically assigned items
const EXTRA_GRADIENTS = [
  'from-red-600/90 to-red-800/70', 'from-blue-600/90 to-blue-800/70',
  'from-green-600/90 to-green-800/70', 'from-purple-600/90 to-purple-800/70',
  'from-yellow-600/90 to-yellow-800/70', 'from-indigo-600/90 to-indigo-800/70',
  'from-fuchsia-600/90 to-fuchsia-800/70', 'from-stone-600/90 to-stone-800/70',
];
const EXTRA_ICON_COLORS = [
  'text-red-400', 'text-blue-400', 'text-green-400', 'text-purple-400',
  'text-yellow-400', 'text-indigo-400', 'text-fuchsia-400', 'text-stone-400',
];

function getGradient(id: string, index: number) {
  return GRADIENT_MAP[id] || EXTRA_GRADIENTS[index % EXTRA_GRADIENTS.length];
}
function getIconColor(id: string, index: number) {
  return ICON_COLOR_MAP[id] || EXTRA_ICON_COLORS[index % EXTRA_ICON_COLORS.length];
}
function getIcon(id: string): React.ElementType {
  return ICON_MAP[id] || FileText;
}

// Build full list of available atalhos from LEIS_CATALOG + noticias
function buildAllAtalhos(): AtalhoItem[] {
  const catalog = getLeisCatalog();
  const items: AtalhoItem[] = catalog.map((lei, i) => ({
    id: lei.id,
    abbrev: lei.sigla.replace(/\//g, ''),
    sublabel: `${lei.sigla}/2026`,
    iconColor: getIconColor(lei.id, i),
    gradient: getGradient(lei.id, i),
  }));
  items.push({
    id: 'noticias',
    abbrev: 'NEWS',
    sublabel: 'Atualizações',
    iconColor: 'text-rose-400',
    gradient: 'from-rose-500/30 to-rose-700/10',
  });
  return items;
}

const STORAGE_KEY = 'vademecum_atalhos_order';
const STORAGE_ENABLED_KEY = 'vademecum_atalhos_enabled';

function getStoredOrder(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return ['cf88', 'cc', 'cp', 'cpc', 'cpp', 'clt', 'cdc', 'eca', 'ctn', 'noticias'];
}

function getStoredEnabled(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_ENABLED_KEY);
    if (stored) return new Set(JSON.parse(stored));
  } catch {}
  return new Set(['cf88', 'cc', 'cp', 'cpc', 'cpp', 'clt', 'cdc', 'eca', 'ctn', 'noticias']);
}

function saveOrder(order: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
}
function saveEnabled(enabled: Set<string>) {
  localStorage.setItem(STORAGE_ENABLED_KEY, JSON.stringify([...enabled]));
}

interface AtalhosCarouselProps {
  onSelect?: (id: string) => void;
  onPersonalizarOpen?: (open: boolean) => void;
}

const AtalhosCarousel = ({ onSelect, onPersonalizarOpen }: AtalhosCarouselProps) => {
  const [allAtalhos] = useState<AtalhoItem[]>(buildAllAtalhos);
  const [order, setOrder] = useState<string[]>(getStoredOrder);
  const [enabled, setEnabled] = useState<Set<string>>(getStoredEnabled);
  const [showPersonalizar, setShowPersonalizar] = useState(false);
  const [tempOrder, setTempOrder] = useState<string[]>([]);
  const [tempEnabled, setTempEnabled] = useState<Set<string>>(new Set());
  // Drag-to-scroll for desktop
  const dragScrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.pageX;
    scrollStart.current = dragScrollRef.current?.scrollLeft || 0;
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !dragScrollRef.current) return;
    e.preventDefault();
    const dx = e.pageX - startX.current;
    dragScrollRef.current.scrollLeft = scrollStart.current - dx;
  };
  const handleMouseUp = () => { isDragging.current = false; };

  const visibleAtalhos = order
    .filter(id => enabled.has(id))
    .map(id => allAtalhos.find(a => a.id === id))
    .filter(Boolean) as AtalhoItem[];

  const openPersonalizar = () => {
    // Build temp order: enabled first (in order), then disabled (in catalog order)
    const enabledInOrder = order.filter(id => enabled.has(id));
    const disabledItems = allAtalhos.map(a => a.id).filter(id => !enabled.has(id));
    setTempOrder([...enabledInOrder, ...disabledItems]);
    setTempEnabled(new Set(enabled));
    setShowPersonalizar(true);
    onPersonalizarOpen?.(true);
  };

  const closePersonalizar = () => {
    setShowPersonalizar(false);
    onPersonalizarOpen?.(false);
  };

  const toggleItem = (id: string) => {
    setTempEnabled(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    // Save enabled items in their current order, then append disabled
    const enabledOrder = tempOrder.filter(id => tempEnabled.has(id));
    const disabledOrder = tempOrder.filter(id => !tempEnabled.has(id));
    const fullOrder = [...enabledOrder, ...disabledOrder];
    setOrder(fullOrder);
    setEnabled(tempEnabled);
    saveOrder(fullOrder);
    saveEnabled(tempEnabled);
    closePersonalizar();
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between px-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Flame className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-base text-foreground">Acesso Rápido</h2>
              <p className="text-muted-foreground text-[11px] font-body">Seus atalhos favoritos</p>
            </div>
          </div>
          <button
            onClick={openPersonalizar}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-foreground text-[11px] font-body font-medium hover:bg-primary/20 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            Personalizar
          </button>
        </div>

        <div
          ref={dragScrollRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="flex gap-3 overflow-x-auto pl-0 pr-0 pb-2 snap-x snap-mandatory lg:snap-none scrollbar-hide lg:desktop-scrollbar cursor-grab active:cursor-grabbing"
        >
          {visibleAtalhos.map((atalho, i) => {
            const Icon = getIcon(atalho.id);
            return (
              <motion.button
                key={atalho.id}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 22 }}
                onClick={() => onSelect?.(atalho.id)}
                className={`flex-shrink-0 w-[100px] h-[100px] snap-start rounded-xl bg-gradient-to-br ${atalho.gradient} border border-border/50 flex flex-col items-start justify-between p-2.5 hover:border-primary/40 transition-all group relative overflow-hidden shadow-lg shadow-black/25`}
              >
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
                  <div
                    className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent via-white/[0.10] to-transparent skew-x-[-20deg]"
                    style={{ animation: 'shinePratique 3s ease-in-out infinite', animationDelay: `${i * 0.5}s` }}
                  />
                </div>
                <Icon className={`absolute bottom-2 right-2 w-8 h-8 ${atalho.iconColor} opacity-25 pointer-events-none`} />
                <div className="w-8 h-8 rounded-lg bg-card/80 flex items-center justify-center border border-border/30">
                  <Icon className={`w-4 h-4 ${atalho.iconColor} transition-colors`} />
                </div>
                <div className="px-0">
                  <p className="font-display text-base font-bold text-foreground leading-tight">{atalho.abbrev}</p>
                  <p className="font-body text-[9px] text-muted-foreground">{atalho.sublabel}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Personalizar Overlay */}
      <AnimatePresence>
        {showPersonalizar && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePersonalizar}
              className="fixed inset-0 z-[59] bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed z-[60] inset-x-0 bottom-0 top-8 bg-card flex flex-col rounded-t-3xl lg:top-[5%] lg:max-w-[480px] lg:mx-auto lg:rounded-t-2xl lg:shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center gap-3 p-4 border-b border-border">
                <button onClick={closePersonalizar} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-bold text-foreground">Personalizar Atalhos</h3>
                  <p className="text-muted-foreground text-[11px] font-body">Ative, desative e reordene seus atalhos</p>
                </div>
              </div>

              {/* List */}
              <Reorder.Group
                axis="y"
                values={tempOrder}
                onReorder={setTempOrder}
                className="flex-1 overflow-y-auto p-4 space-y-2"
              >
                {tempOrder.map((id, idx) => {
                  const atalho = allAtalhos.find(a => a.id === id);
                  if (!atalho) return null;
                  const Icon = getIcon(id);
                  const isEnabled = tempEnabled.has(id);
                  return (
                    <Reorder.Item
                      key={id}
                      value={id}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-grab active:cursor-grabbing transition-colors ${
                        isEnabled
                          ? 'bg-secondary border-border'
                          : 'bg-secondary/40 border-border/50 opacity-60'
                      }`}
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isEnabled ? 'bg-primary/15' : 'bg-muted/50'}`}>
                        <Icon className={`w-4.5 h-4.5 ${isEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm text-foreground font-medium">{atalho.abbrev}</p>
                        <p className="font-body text-[11px] text-muted-foreground">{atalho.sublabel}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleItem(id); }}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                          isEnabled
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted/50 text-muted-foreground'
                        }`}
                      >
                        {isEnabled ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      </button>
                    </Reorder.Item>
                  );
                })}
              </Reorder.Group>

              {/* Save button */}
              <div className="p-4 border-t border-border pb-[calc(1rem+env(safe-area-inset-bottom))]">
                <button
                  onClick={handleSave}
                  className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-body font-semibold text-sm hover:bg-primary/90 transition-colors shadow-lg"
                >
                  Salvar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AtalhosCarousel;
