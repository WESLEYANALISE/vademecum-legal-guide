import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, TrendingUp, TrendingDown, FileText, FileX, UserCheck, UserX, Mic, MicOff, Building, Building2, Users, UsersRound, ChevronRight } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

type RankingCategory = string;

interface CategoryDef {
  id: string;
  label: string;
  shortLabel: string;
  icon: any;
  color: string;
  bgColor: string;
  col: string;
  asc: boolean;
  filterZero?: boolean;
  format: (v: number) => string;
}

const POSITIVE: CategoryDef[] = [
  { id: 'menores_gastos', label: 'Menores Gastos', shortLabel: 'Menores Gastos', icon: TrendingDown, color: 'text-primary', bgColor: 'bg-primary/15', col: 'total_despesas', asc: true, filterZero: true, format: (v) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` },
  { id: 'mais_proposicoes', label: 'Mais Proposições', shortLabel: 'Mais PLs', icon: FileText, color: 'text-primary', bgColor: 'bg-primary/15', col: 'total_proposicoes', asc: false, format: (v) => `${v} PLs` },
  { id: 'maior_presenca', label: 'Maior Presença', shortLabel: 'Maior Presença', icon: UserCheck, color: 'text-copper-light', bgColor: 'bg-copper-light/15', col: 'presenca_percentual', asc: false, format: (v) => `${v.toFixed(1)}%` },
  { id: 'mais_discursos', label: 'Mais Discursos', shortLabel: 'Mais Discursos', icon: Mic, color: 'text-copper', bgColor: 'bg-copper/15', col: 'total_discursos', asc: false, format: (v) => `${v} discursos` },
  { id: 'mais_comissoes', label: 'Mais Comissões', shortLabel: 'Mais Comissões', icon: Building, color: 'text-copper-light', bgColor: 'bg-copper-light/15', col: 'total_orgaos', asc: false, format: (v) => `${v} comissões` },
  { id: 'mais_frentes', label: 'Mais Frentes', shortLabel: 'Mais Frentes', icon: Users, color: 'text-primary', bgColor: 'bg-primary/15', col: 'total_frentes', asc: false, format: (v) => `${v} frentes` },
];

const NEGATIVE: CategoryDef[] = [
  { id: 'maiores_gastos', label: 'Maiores Gastos', shortLabel: 'Maiores Gastos', icon: TrendingUp, color: 'text-muted-foreground', bgColor: 'bg-muted', col: 'total_despesas', asc: false, format: (v) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` },
  { id: 'menos_proposicoes', label: 'Menos Proposições', shortLabel: 'Menos PLs', icon: FileX, color: 'text-muted-foreground', bgColor: 'bg-muted', col: 'total_proposicoes', asc: true, format: (v) => `${v} PLs` },
  { id: 'menor_presenca', label: 'Menor Presença', shortLabel: 'Menor Presença', icon: UserX, color: 'text-muted-foreground', bgColor: 'bg-muted', col: 'presenca_percentual', asc: true, filterZero: true, format: (v) => `${v.toFixed(1)}%` },
  { id: 'menos_discursos', label: 'Menos Discursos', shortLabel: 'Menos Discursos', icon: MicOff, color: 'text-muted-foreground', bgColor: 'bg-muted', col: 'total_discursos', asc: true, filterZero: true, format: (v) => `${v} discursos` },
  { id: 'menos_comissoes', label: 'Menos Comissões', shortLabel: 'Menos Comissões', icon: Building2, color: 'text-muted-foreground', bgColor: 'bg-muted', col: 'total_orgaos', asc: true, filterZero: true, format: (v) => `${v} comissões` },
  { id: 'menos_frentes', label: 'Menos Frentes', shortLabel: 'Menos Frentes', icon: UsersRound, color: 'text-muted-foreground', bgColor: 'bg-muted', col: 'total_frentes', asc: true, filterZero: true, format: (v) => `${v} frentes` },
];

const ALL_CATEGORIES = [...POSITIVE, ...NEGATIVE];

interface RankingItem {
  deputado_id: number;
  nome: string;
  sigla_partido: string;
  sigla_uf: string;
  foto_url: string;
  [key: string]: any;
}

let cachedPreviews: Record<string, RankingItem[]> = {};

const RankingPanel = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'positivos' | 'negativos'>('positivos');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, RankingItem[]>>(() => cachedPreviews);
  const [loading, setLoading] = useState(Object.keys(cachedPreviews).length === 0);
  const [detailData, setDetailData] = useState<RankingItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (Object.keys(cachedPreviews).length > 0) {
      setPreviews(cachedPreviews);
      setLoading(false);
      return;
    }
    loadPreviews();
  }, []);

  const loadPreviews = async () => {
    setLoading(true);
    const results: Record<string, RankingItem[]> = {};

    await Promise.all(ALL_CATEGORIES.map(async (cat) => {
      const { data } = await supabase
        .from('radar_ranking')
        .select('*')
        .order(cat.col, { ascending: cat.asc })
        .limit(3) as any;

      let filtered = (data || []) as RankingItem[];
      if (cat.filterZero) filtered = filtered.filter(r => (r[cat.col] || 0) > 0);
      results[cat.id] = filtered;
    }));

    cachedPreviews = results;
    setPreviews(results);
    setLoading(false);
  };

  const openCategory = async (catId: string) => {
    setSelectedCategory(catId);
    setDetailLoading(true);
    const cat = ALL_CATEGORIES.find(c => c.id === catId)!;

    const { data } = await supabase
      .from('radar_ranking')
      .select('*')
      .order(cat.col, { ascending: cat.asc })
      .limit(50) as any;

    let filtered = (data || []) as RankingItem[];
    if (cat.filterZero) filtered = filtered.filter(r => (r[cat.col] || 0) > 0);
    setDetailData(filtered);
    setDetailLoading(false);
  };

  // Detail view
  if (selectedCategory) {
    const cat = ALL_CATEGORIES.find(c => c.id === selectedCategory)!;
    const Icon = cat.icon;
    return (
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Icon className={`w-5 h-5 ${cat.color}`} />
          <h2 className="font-display text-lg font-bold">{cat.label}</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-5">Ranking completo dos deputados federais</p>

        {detailLoading ? (
          <div className="flex justify-center py-16">
            <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2">
            {detailData.map((item, index) => (
              <button
                key={item.deputado_id}
                onClick={() => navigate(`/radar/deputado/${item.deputado_id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:bg-secondary/40 transition-colors text-left"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                  index === 1 ? 'bg-gray-300/20 text-gray-400' :
                  index === 2 ? 'bg-amber-700/20 text-amber-600' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {index + 1}º
                </div>
                <Avatar className="w-11 h-11 border-2 border-border shrink-0">
                  <AvatarImage src={item.foto_url} alt={item.nome} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">{item.nome?.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.nome}</p>
                  <p className="text-[11px] text-muted-foreground">{item.sigla_partido}-{item.sigla_uf}</p>
                </div>
                <div className="text-right shrink-0 flex items-center gap-1">
                  <p className={`text-xs font-bold ${cat.color}`}>
                    {cat.format(Number(item[cat.col] || 0))}
                  </p>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Main grid view with tabs
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const categories = tab === 'positivos' ? POSITIVE : NEGATIVE;

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted mb-4">
        <button
          onClick={() => setTab('positivos')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
            tab === 'positivos' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          ✅ Positivos
        </button>
        <button
          onClick={() => setTab('negativos')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
            tab === 'negativos' ? 'bg-secondary text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          ⚠️ Negativos
        </button>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-2 gap-3">
        {categories.map(cat => {
          const Icon = cat.icon;
          const items = previews[cat.id] || [];
          return (
            <button
              key={cat.id}
              onClick={() => openCategory(cat.id)}
              className="text-left rounded-xl bg-card border border-border/50 p-3 hover:bg-secondary/40 transition-colors"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-1.5 rounded-lg ${cat.bgColor}`}>
                  <Icon className={`w-3.5 h-3.5 ${cat.color}`} />
                </div>
                <span className="text-xs font-semibold text-foreground leading-tight">{cat.shortLabel}</span>
              </div>

              <div className="space-y-2">
                {items.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground/50">Sem dados</p>
                ) : (
                  items.map((item, idx) => (
                    <div key={item.deputado_id} className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold w-4 shrink-0 ${
                        idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-400' : 'text-amber-600'
                      }`}>
                        {idx + 1}º
                      </span>
                      <Avatar className="w-6 h-6 shrink-0">
                        <AvatarImage src={item.foto_url} alt={item.nome} />
                        <AvatarFallback className="text-[8px] bg-primary/10 text-primary">{item.nome?.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium text-foreground truncate">
                          {item.nome?.split(' ').slice(0, 2).join(' ')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center justify-end mt-2 pt-2 border-t border-border/30">
                <span className={`text-[10px] font-semibold ${cat.color} flex items-center gap-0.5`}>
                  Ver todos <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RankingPanel;
