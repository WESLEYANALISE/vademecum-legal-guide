import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ScanEye, Calendar, ChevronRight, Loader2, FileText, Scale, TrendingUp, Gavel, ScrollText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import brasaoImg from '@/assets/brasao-republica.png';
import { supabase } from '@/integrations/supabase/client';
import { getResenhaCache, prefetchResenha, type ResenhaItem } from '@/services/atualizacaoService';
import { getLeisCatalog, fetchArtigosLei, getCachedArtigos, fetchLeisOrdinariasPorAno, fetchDecretosPorAno, type LeiOrdinaria } from '@/services/legislacaoService';
import AlteracaoDetailSheet from '@/components/vademecum/AlteracaoDetailSheet';
import { buildContextualTitle } from '@/components/vademecum/RadarLegislacaoContent';
import LeiOrdinariaDetail from '@/components/vademecum/LeiOrdinariaDetail';

/* ── LEI_REFS for "O que pode mudar" tab (PLs) ── */
const LEI_REFS: Record<string, { label: string; refs: string[]; tipos: string[] }> = {
  CF88: { label: 'Constituição Federal', refs: ['constituição federal', 'constituicao federal'], tipos: ['PEC'] },
  CP: { label: 'Código Penal', refs: ['decreto-lei nº 2.848', 'decreto-lei n° 2.848', 'lei 2.848', 'código penal', 'codigo penal'], tipos: ['PL', 'PLP'] },
  CC: { label: 'Código Civil', refs: ['lei nº 10.406', 'lei n° 10.406', 'lei 10.406', 'código civil', 'codigo civil'], tipos: ['PL', 'PLP'] },
  CPC: { label: 'Código de Processo Civil', refs: ['lei nº 13.105', 'lei n° 13.105', 'lei 13.105', 'código de processo civil', 'codigo de processo civil'], tipos: ['PL', 'PLP'] },
  CPP: { label: 'Código de Processo Penal', refs: ['decreto-lei nº 3.689', 'decreto-lei n° 3.689', 'lei 3.689', 'código de processo penal', 'codigo de processo penal'], tipos: ['PL', 'PLP'] },
  CLT: { label: 'CLT', refs: ['decreto-lei nº 5.452', 'decreto-lei n° 5.452', 'lei 5.452', 'consolidação das leis do trabalho', 'consolidacao das leis do trabalho', 'clt'], tipos: ['PL', 'PLP'] },
  CDC: { label: 'Código de Defesa do Consumidor', refs: ['lei nº 8.078', 'lei n° 8.078', 'lei 8.078', 'código de defesa do consumidor', 'codigo de defesa do consumidor'], tipos: ['PL', 'PLP'] },
  CTN: { label: 'Código Tributário Nacional', refs: ['lei nº 5.172', 'lei n° 5.172', 'lei 5.172', 'código tributário nacional', 'codigo tributario nacional'], tipos: ['PL', 'PLP', 'PEC'] },
  CTB: { label: 'Código de Trânsito', refs: ['lei nº 9.503', 'lei n° 9.503', 'lei 9.503', 'código de trânsito', 'codigo de transito'], tipos: ['PL'] },
  CE: { label: 'Código Eleitoral', refs: ['lei nº 4.737', 'lei n° 4.737', 'lei 4.737', 'código eleitoral', 'codigo eleitoral'], tipos: ['PL', 'PLP', 'PEC'] },
  ECA: { label: 'ECA', refs: ['lei nº 8.069', 'lei n° 8.069', 'lei 8.069', 'estatuto da criança', 'estatuto da crianca'], tipos: ['PL', 'PLP'] },
  EI: { label: 'Estatuto do Idoso', refs: ['lei nº 10.741', 'lei n° 10.741', 'lei 10.741', 'estatuto do idoso', 'estatuto da pessoa idosa'], tipos: ['PL'] },
  EPD: { label: 'Estatuto da Pessoa com Deficiência', refs: ['lei nº 13.146', 'lei n° 13.146', 'lei 13.146', 'estatuto da pessoa com deficiência', 'estatuto da pessoa com deficiencia'], tipos: ['PL'] },
  EOAB: { label: 'Estatuto da OAB', refs: ['lei nº 8.906', 'lei n° 8.906', 'lei 8.906', 'estatuto da advocacia', 'estatuto da oab'], tipos: ['PL'] },
  CPM: { label: 'Código Penal Militar', refs: ['decreto-lei nº 1.001', 'decreto-lei n° 1.001', 'lei 1.001', 'código penal militar', 'codigo penal militar'], tipos: ['PL'] },
  CFLOR: { label: 'Código Florestal', refs: ['lei nº 12.651', 'lei n° 12.651', 'lei 12.651', 'código florestal', 'codigo florestal'], tipos: ['PL'] },
};


const TIPO_COLORS: Record<string, string> = {
  'Lei': 'bg-violet-500/15 text-violet-400 border-violet-500/25',
  'Lei Complementar': 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  'Decreto': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  'Medida Provisória': 'bg-rose-500/15 text-rose-400 border-rose-500/25',
  'Emenda Constitucional': 'bg-sky-500/15 text-sky-400 border-sky-500/25',
  'Resolução': 'bg-orange-500/15 text-orange-400 border-orange-500/25',
};

interface GroupedPL {
  key: string;
  label: string;
  proposals: any[];
}

const Radar360 = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('alteracoes');
  /* ── Alterações Recentes ── */
  const [resenha, setResenha] = useState<ResenhaItem[]>([]);
  const [loadingResenha, setLoadingResenha] = useState(true);
  const [leisRecentes, setLeisRecentes] = useState<LeiOrdinaria[]>([]);
  const [decretosRecentes, setDecretosRecentes] = useState<LeiOrdinaria[]>([]);
  const [loadingLeisDec, setLoadingLeisDec] = useState(true);
  const [selectedLei, setSelectedLei] = useState<LeiOrdinaria | null>(null);

  useEffect(() => {
    const cached = getResenhaCache();
    if (cached) {
      setResenha(cached);
      setLoadingResenha(false);
    } else {
      prefetchResenha().then(() => {
        const data = getResenhaCache();
        if (data) setResenha(data);
        setLoadingResenha(false);
      });
    }

    // Fetch recent leis ordinárias and decretos
    (async () => {
      try {
        const [leis, decs] = await Promise.all([
          fetchLeisOrdinariasPorAno(2026),
          fetchDecretosPorAno(2026),
        ]);
        setLeisRecentes(leis.slice(0, 10));
        setDecretosRecentes(decs.slice(0, 10));
      } catch (e) {
        console.error('Erro ao buscar leis/decretos recentes:', e);
      }
      setLoadingLeisDec(false);
    })();
  }, []);

  // Helper: normalize text to sentence case (no ALL CAPS)
  const normalizeCase = (text: string) => {
    if (!text) return text;
    const letters = text.replace(/[^a-zA-ZÀ-ÿ]/g, '');
    const upper = letters.replace(/[^A-ZÀ-Ý]/g, '');
    if (letters.length > 3 && upper.length / letters.length > 0.6) {
      // Convert everything to lowercase first, then capitalize properly
      let result = text.toLowerCase();
      // Capitalize first letter
      result = result.charAt(0).toUpperCase() + result.slice(1);
      // Capitalize key legal terms
      result = result
        .replace(/\blei\b/g, 'Lei')
        .replace(/\bdecreto\b/g, 'Decreto')
        .replace(/\bmedida provisória\b/g, 'Medida Provisória')
        .replace(/\bemenda constitucional\b/g, 'Emenda Constitucional')
        .replace(/\bresolução\b/g, 'Resolução')
        .replace(/\bnº\b/g, 'nº');
      return result;
    }
    return text;
  };

  // Extract just type + number from resenha titles (remove date part)
  const cleanResenhaTitle = (titulo: string) => {
    // "DECRETO Nº 12.909, DE 27 DE MARÇO DE 2026" → "Decreto nº 12.909"
    const match = titulo.match(/^(.+?nº\s*[\d.]+)/i);
    return match ? normalizeCase(match[1]) : normalizeCase(titulo);
  };

  // Unified item type for the "Recentes" tab
  type UnifiedItem = {
    id: string;
    tipo: string; // 'Lei', 'Decreto', etc.
    titulo: string;
    ementa: string;
    data: string; // sortable date string
    dataDisplay: string;
    source: 'resenha' | 'lei' | 'decreto';
  };

  const allRecentes = useMemo(() => {
    const items: UnifiedItem[] = [];

    // From resenha (DOU)
    for (const item of resenha) {
      items.push({
        id: `r-${item.id}`,
        tipo: item.tipo_ato,
        titulo: cleanResenhaTitle(item.numero_ato),
        ementa: normalizeCase(item.ementa),
        data: item.data_publicacao,
        dataDisplay: item.data_publicacao,
        source: 'resenha',
      });
    }

    // From leis ordinárias (skip incomplete records)
    for (const lei of leisRecentes) {
      if (!lei.data_publicacao && !lei.ementa) continue;
      items.push({
        id: `l-${lei.id}`,
        tipo: 'Lei',
        titulo: normalizeCase(lei.numero_lei),
        ementa: normalizeCase(lei.ementa),
        data: lei.data_publicacao || '',
        dataDisplay: lei.data_publicacao || '',
        source: 'lei',
      });
    }

    // From decretos (skip incomplete records)
    for (const dec of decretosRecentes) {
      if (!dec.data_publicacao && !dec.ementa) continue;
      items.push({
        id: `d-${dec.id}`,
        tipo: 'Decreto',
        titulo: normalizeCase(dec.numero_lei),
        ementa: normalizeCase(dec.ementa),
        data: dec.data_publicacao || '',
        dataDisplay: dec.data_publicacao || '',
        source: 'decreto',
      });
    }

    // Deduplicate by titulo similarity (resenha may repeat leis/decretos)
    const seen = new Set<string>();
    const deduped: UnifiedItem[] = [];
    for (const item of items) {
      const key = item.titulo.toLowerCase().replace(/\s+/g, '');
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(item);
    }

    // Filter out items without a date
    const filtered = deduped.filter(i => i.dataDisplay && i.dataDisplay !== '');

    // Group by date
    const map = new Map<string, UnifiedItem[]>();
    for (const item of filtered) {
      const key = item.dataDisplay;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }

    // Sort groups by date descending
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 15);
  }, [resenha, leisRecentes, decretosRecentes]);

  /* ── Novidades (modificações extraídas do texto dos artigos) ── */
  const TIPO_ORDER: Record<string, number> = { constituicao: 0, codigo: 1, estatuto: 2 };
  const modRegex = /\((?:Redação\s+dada|Incluíd[oa]|Acrescid[oa]|Revogad[oa]|Alterad[oa]|Vetad[oa]|Vigência|Regulamento|Vide|Promulgação|Renumerado|Transformado|Suprimido|Restabelecido|Ressalvado|Produção de efeito)[^)]*\)/gi;
  const yearRegex = /\b(1\d{3}|20\d{2})\b/;
  const typeRegex = /^\((Redação\s+dada|Incluíd[oa]|Acrescid[oa]|Revogad[oa]|Alterad[oa]|Vetad[oa]|Vigência|Regulamento|Vide|Promulgação|Renumerado|Transformado|Suprimido|Restabelecido|Ressalvado|Produção de efeito)/i;

  type NovidadeModItem = { artigoNumero: string; tipo: string; referencia: string; ano: number; parteModificada: string; artigoTexto: string };
  type NovidadeLeiData = { items: NovidadeModItem[]; byYear: Map<number, NovidadeModItem[]>; total: number };

  const [novidadesData, setNovidadesData] = useState<Map<string, NovidadeLeiData>>(new Map());
  const [novidadesLoading, setNovidadesLoading] = useState<Set<string>>(new Set());

  // Seen tracking for green "unread" badge
  const [seenNovidades, setSeenNovidades] = useState<Record<string, number>>(() =>
    JSON.parse(localStorage.getItem('seenNovidades') || '{}')
  );
  const getUnread = (id: string, total: number) => Math.max(0, total - (seenNovidades[id] || 0));
  const markSeen = (id: string, total: number) => {
    setSeenNovidades(prev => {
      const next = { ...prev, [id]: total };
      localStorage.setItem('seenNovidades', JSON.stringify(next));
      return next;
    });
  };

  const novidadesCatalog = useMemo(() => {
    return getLeisCatalog().sort((a, b) => (TIPO_ORDER[a.tipo] ?? 9) - (TIPO_ORDER[b.tipo] ?? 9));
  }, []);

  const parseModificacoes = useCallback((artigos: any[]): NovidadeLeiData => {
    const items: NovidadeModItem[] = [];
    for (const artigo of artigos) {
      const text = artigo.caput || '';
      const lines = text.split('\n').filter((l: string) => l.trim());
      const refGroups = new Map<string, { indices: number[]; tipo: string; ref: string; ano: number }>();

      for (let li = 0; li < lines.length; li++) {
        const lineMatches = lines[li].match(modRegex);
        if (!lineMatches) continue;
        const ref = lineMatches[lineMatches.length - 1];
        const refKey = ref.replace(/^\(/, '').replace(/\)$/, '');
        const tm = ref.match(typeRegex);
        const ym = ref.match(yearRegex);
        let tipo = tm ? tm[1].replace(/\s+dada/i, '') : 'Alteração';
        if (/^redaç/i.test(tipo)) tipo = 'Alterada';
        const ano = ym ? parseInt(ym[1]) : 0;
        if (!refGroups.has(refKey)) refGroups.set(refKey, { indices: [], tipo, ref: refKey, ano });
        refGroups.get(refKey)!.indices.push(li);
      }

      for (const [refKey, group] of refGroups) {
        let parteModificada = 'Artigo inteiro';
        if (group.indices.length < lines.length) {
          const firstModLine = lines[group.indices[0]];
          if (/^§\s*\d+[º°]?/i.test(firstModLine)) {
            const pMatch = firstModLine.match(/^(§\s*\d+[º°]?)/i);
            parteModificada = pMatch ? pMatch[1].replace(/°/g, 'º') : '§';
          } else if (/^[IVXLC]+\s*[-–.]/i.test(firstModLine)) {
            const iMatch = firstModLine.match(/^([IVXLC]+)/i);
            parteModificada = iMatch ? `Inciso ${iMatch[1]}` : 'Inciso';
          } else if (/^[a-z]\)/i.test(firstModLine)) {
            const aMatch = firstModLine.match(/^([a-z]\))/i);
            parteModificada = aMatch ? `Alínea ${aMatch[1]}` : 'Alínea';
          } else if (/^Parágrafo\s+único/i.test(firstModLine)) {
            parteModificada = 'Parágrafo único';
          } else if (/caput/i.test(refKey)) {
            parteModificada = 'Caput';
          }
        }
        items.push({ artigoNumero: artigo.numero || '', tipo: group.tipo, referencia: refKey, ano: group.ano, parteModificada, artigoTexto: text });
      }
    }
    items.sort((a, b) => b.ano - a.ano);
    const byYear = new Map<number, NovidadeModItem[]>();
    for (const item of items) {
      const k = item.ano || 0;
      if (!byYear.has(k)) byYear.set(k, []);
      byYear.get(k)!.push(item);
    }
    return { items, byYear, total: items.length };
  }, []);

  const loadNovidadesForLei = useCallback(async (tabelaNome: string, leiId: string) => {
    if (novidadesData.has(leiId) || novidadesLoading.has(leiId)) return;
    setNovidadesLoading(prev => new Set(prev).add(leiId));
    try {
      const cached = getCachedArtigos(tabelaNome);
      const artigos = cached || await fetchArtigosLei(leiId, tabelaNome);
      const parsed = parseModificacoes(artigos);
      setNovidadesData(prev => new Map(prev).set(leiId, parsed));
    } catch (e) {
      console.warn(`Failed to load novidades for ${tabelaNome}`, e);
      setNovidadesData(prev => new Map(prev).set(leiId, { items: [], byYear: new Map(), total: 0 }));
    }
    setNovidadesLoading(prev => { const n = new Set(prev); n.delete(leiId); return n; });
  }, [novidadesData, novidadesLoading, parseModificacoes]);

  const [openAlteracao, setOpenAlteracao] = useState<{ leiNome: string; item: NovidadeModItem } | null>(null);

  // Preload all laws when novidades tab is active
  const [novidadesPreloaded, setNovidadesPreloaded] = useState(false);
  useEffect(() => {
    if (activeTab !== 'novidades' || novidadesPreloaded) return;
    setNovidadesPreloaded(true);
    for (const lei of novidadesCatalog) {
      loadNovidadesForLei(lei.tabela_nome, lei.id);
    }
  }, [activeTab, novidadesPreloaded, novidadesCatalog, loadNovidadesForLei]);

  const handleNovidadesAccordion = useCallback((openValues: string[]) => {
    for (const val of openValues) {
      const lei = novidadesCatalog.find(l => l.id === val);
      if (lei) {
        loadNovidadesForLei(lei.tabela_nome, lei.id);
        // Mark as seen when user expands
        const data = novidadesData.get(lei.id);
        if (data && data.total > 0) markSeen(lei.id, data.total);
      }
    }
  }, [novidadesCatalog, loadNovidadesForLei, novidadesData]);

  const badgeColor = (tipo: string) => {
    const t = tipo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (t.startsWith('revogad') || t.startsWith('vetad') || t.startsWith('suprimid')) return 'bg-destructive/20 text-destructive';
    if (t.startsWith('incluid') || t.startsWith('acrescid')) return 'bg-primary/20 text-primary';
    if (t.startsWith('redacao') || t.startsWith('alterad')) return 'bg-copper/20 text-copper';
    if (t.startsWith('renumerad')) return 'bg-copper-light/20 text-copper-light';
    if (t.startsWith('vigencia') || t.startsWith('producao')) return 'bg-copper-dark/20 text-copper-dark';
    return 'bg-muted text-muted-foreground';
  };

  /* ── O que pode mudar (PLs) ── */
  const [allProposals, setAllProposals] = useState<any[]>([]);
  const [loadingPLs, setLoadingPLs] = useState(true);
  const [plHeadlines, setPlHeadlines] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('radar_proposicoes')
          .select('id_externo, sigla_tipo, numero, ano, ementa, autor, autor_foto, dados_json')
          .order('ano', { ascending: false })
          .order('numero', { ascending: false });
        setAllProposals(data || []);

        // Fetch headlines for matched proposals
        if (data && data.length > 0) {
          const ids = data.map(p => p.id_externo);
          const { data: hlData } = await supabase
            .from('radar_pl_headlines')
            .select('id_externo, headline')
            .in('id_externo', ids);
          if (hlData) {
            const map = new Map<string, string>();
            for (const h of hlData) {
              if (h.headline) map.set(h.id_externo, h.headline);
            }
            setPlHeadlines(map);
          }
        }
      } catch (e) {
        console.error('Radar360 PLs error:', e);
      }
      setLoadingPLs(false);
    })();
  }, []);

  const groupedPLs = useMemo<GroupedPL[]>(() => {
    const results: GroupedPL[] = [];
    for (const [key, config] of Object.entries(LEI_REFS)) {
      const matched = allProposals.filter(p => {
        if (!config.tipos.includes(p.sigla_tipo)) return false;
        const ementa = (p.ementa || '').toLowerCase();
        return config.refs.some(ref => ementa.includes(ref));
      });
      if (matched.length > 0) {
        results.push({ key, label: config.label, proposals: matched.slice(0, 20) });
      }
    }
    results.sort((a, b) => b.proposals.length - a.proposals.length);
    return results;
  }, [allProposals]);

  const totalPLs = useMemo(() => groupedPLs.reduce((s, g) => s + g.proposals.length, 0), [groupedPLs]);


  const TAB_DESCRIPTIONS: Record<string, { title: string; description: string }> = {
    alteracoes: {
      title: 'Alterações Recentes',
      description: 'Acompanhe as últimas modificações publicadas no Diário Oficial da União que impactam códigos, estatutos e a Constituição Federal.',
    },
    novidades: {
      title: 'Novidades nas Leis',
      description: 'Veja quais artigos foram alterados, incluídos ou revogados dentro de cada legislação, organizados por ano de modificação.',
    },
    projetos: {
      title: 'O que pode mudar',
      description: 'Projetos de lei em tramitação no Congresso que podem alterar as legislações que você estuda. Fique à frente das mudanças.',
    },
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-card to-secondary overflow-hidden px-4 pt-8 pb-6 sm:px-6">
        {/* Decorative circle */}
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/5" />
        <ScanEye className="absolute top-5 right-5 w-10 h-10 text-white/15 rotate-12" />

        <div className="relative max-w-2xl mx-auto z-10">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white font-medium transition-all text-sm px-3 py-1.5 rounded-lg mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
              <ScanEye className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-xl text-white font-bold">Radar 360</h1>
              <p className="text-white/70 text-xs">
                Alterações recentes e projetos que podem mudar as leis
              </p>
            </div>
          </div>

          {/* Contextual description card */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 bg-black/20 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10"
          >
            <p className="text-white font-display text-sm font-semibold mb-0.5">
              {TAB_DESCRIPTIONS[activeTab]?.title}
            </p>
            <p className="text-white/70 text-xs leading-relaxed">
              {TAB_DESCRIPTIONS[activeTab]?.description}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 -mt-3 relative z-10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-card border border-border rounded-xl h-11">
            <TabsTrigger value="alteracoes" className="flex-1 rounded-lg text-[11px] font-display data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Recentes
            </TabsTrigger>
            <TabsTrigger value="novidades" className="flex-1 rounded-lg text-[11px] font-display data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Novidades
            </TabsTrigger>
            <TabsTrigger value="projetos" className="flex-1 rounded-lg text-[11px] font-display data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              O que pode mudar
            </TabsTrigger>
          </TabsList>

          {/* ── Tab: Alterações Recentes ── */}
          <TabsContent value="alteracoes" className="mt-4 space-y-4">
            {(loadingResenha || loadingLeisDec) && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}

            {!loadingResenha && !loadingLeisDec && allRecentes.length === 0 && (
              <div className="text-center py-12 space-y-2">
                <FileText className="w-8 h-8 mx-auto text-muted-foreground/40" />
                <p className="text-muted-foreground text-sm">Nenhuma alteração carregada.</p>
              </div>
            )}

            {!loadingResenha && !loadingLeisDec && allRecentes.map(([dataPub, atos]) => (
              <div key={dataPub} className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-display text-primary">{dataPub}</span>
                  <span className="text-[10px] text-muted-foreground">
                    ({atos.length} {atos.length === 1 ? 'ato' : 'atos'})
                  </span>
                </div>
                {atos.map((item, i) => {
                  const color = TIPO_COLORS[item.tipo] || 'bg-muted text-muted-foreground border-border';
                  const isClickable = item.source === 'lei' || item.source === 'decreto';
                  const handleClick = () => {
                    if (!isClickable) return;
                    const rawId = item.id.replace(/^[ld]-/, '');
                    const found = item.source === 'lei'
                      ? leisRecentes.find(l => l.id === rawId)
                      : decretosRecentes.find(d => d.id === rawId);
                    if (found) setSelectedLei(found);
                  };
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={handleClick}
                      className={`border border-border rounded-lg p-3 bg-card hover:border-primary/20 transition-colors min-h-[72px] flex gap-3 items-center ${isClickable ? 'cursor-pointer' : ''}`}
                    >
                      <img src={brasaoImg} alt="" className="w-8 h-8 flex-shrink-0" />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`${color} border text-[10px] px-2 py-0.5`}>
                            {item.tipo}
                          </Badge>
                          <span className="font-display text-sm text-foreground">{item.titulo}</span>
                        </div>
                        <p className="text-muted-foreground text-xs line-clamp-2 leading-relaxed">
                          {item.ementa}
                        </p>
                      </div>
                      {isClickable && <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </TabsContent>

          {/* ── Tab: Novidades ── */}
          <TabsContent value="novidades" className="mt-4">
            <Accordion type="multiple" className="space-y-2" onValueChange={handleNovidadesAccordion}>
              {novidadesCatalog.map((lei) => {
                const data = novidadesData.get(lei.id);
                const isLoading = novidadesLoading.has(lei.id);
                const total = data?.total ?? 0;
                const unread = data ? getUnread(lei.id, total) : 0;
                const latestYear = data && total > 0 ? [...data.byYear.keys()].sort((a, b) => b - a)[0] : 0;
                return (
                  <AccordionItem key={lei.id} value={lei.id} className="border border-border rounded-xl overflow-hidden bg-card">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center gap-3 flex-1 text-left">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Scale className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-display text-sm text-foreground font-semibold">{lei.nome}</p>
                          <p className="text-[11px] text-muted-foreground">{lei.descricao}</p>
                        </div>
                        <div className="flex items-center gap-1.5 mr-2 shrink-0">
                          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                          {data && latestYear > 0 && (
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap hidden sm:inline">
                              {latestYear}
                            </span>
                          )}
                          {data && total > 0 && (
                            <Badge className="bg-primary/15 text-primary border-primary/20 text-[10px] px-1.5">
                              {total}
                            </Badge>
                          )}
                          {unread > 0 && (
                            <Badge className="bg-green-600 text-white border-0 text-[10px] px-1.5 gap-0.5">
                              <TrendingUp className="w-3 h-3" />
                              {unread}
                            </Badge>
                          )}
                          {data && total === 0 && (
                            <span className="text-[10px] text-muted-foreground">—</span>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-3">
                      {isLoading && (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        </div>
                      )}
                      {data && total === 0 && (
                        <p className="text-muted-foreground text-xs text-center py-4">Nenhuma alteração legislativa encontrada.</p>
                      )}
                      {data && total > 0 && (
                        <div className="space-y-4">
                          {[...data.byYear.entries()].map(([ano, modItems]) => (
                            <div key={ano}>
                              <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-3.5 h-3.5 text-primary" />
                                <span className="text-xs font-bold text-foreground">{ano > 0 ? ano : 'Sem data'}</span>
                                <span className="text-[10px] text-muted-foreground">({modItems.length})</span>
                              </div>
                              <div className="space-y-2">
                                {modItems.slice(0, 30).map((item, i) => (
                                  <button
                                    key={`${item.artigoNumero}-${i}`}
                                    onClick={() => setOpenAlteracao({ leiNome: lei.nome, item })}
                                    className="flex items-center gap-2 px-3 py-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors w-full text-left min-h-[48px]"
                                  >
                                    <span className="font-display text-sm font-bold text-primary shrink-0">{item.artigoNumero}</span>
                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${badgeColor(item.tipo)}`}>
                                      {item.tipo}
                                    </span>
                                    <span className="text-[10px] text-copper-light bg-copper-light/15 px-1.5 py-0.5 rounded-full shrink-0">
                                      {item.parteModificada}
                                    </span>
                                    <p className="text-xs text-foreground/70 truncate flex-1">{item.referencia}</p>
                                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </TabsContent>

          {/* ── Tab: O que pode mudar ── */}
          <TabsContent value="projetos" className="mt-4">
            {loadingPLs && (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="bg-card/50 border-border/50">
                    <CardContent className="p-4">
                      <Skeleton className="h-5 w-2/3 mb-2" />
                      <Skeleton className="h-3 w-1/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!loadingPLs && groupedPLs.length === 0 && (
              <div className="text-center py-12 space-y-2">
                <Scale className="w-8 h-8 mx-auto text-muted-foreground/40" />
                <p className="text-muted-foreground text-sm">Nenhum projeto encontrado que afete as leis do app.</p>
              </div>
            )}

            {!loadingPLs && groupedPLs.length > 0 && (
              <Accordion type="multiple" className="space-y-2">
                {groupedPLs.map((group) => (
                  <AccordionItem key={group.key} value={group.key} className="border border-border rounded-xl overflow-hidden bg-card">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center gap-3 flex-1 text-left">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Scale className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-display text-sm text-foreground font-semibold">{group.label}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {group.proposals.length} projeto{group.proposals.length !== 1 ? 's' : ''} em tramitação
                          </p>
                        </div>
                        <Badge className="bg-primary/15 text-primary border-primary/20 text-xs mr-2">
                          {group.proposals.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-3">
                      <div className="space-y-2">
                        {group.proposals.map((p) => {
                          const dataApresentacao = (p.dados_json as any)?.dataApresentacao;
                          return (
                            <div
                              key={p.id_externo}
                              onClick={() => navigate(`/radar/pl/${p.id_externo}`)}
                              className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors"
                            >
                              <div className="shrink-0 w-8 h-8 rounded-full overflow-hidden bg-muted">
                                {p.autor_foto ? (
                                  <img src={p.autor_foto} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                                    <ScanEye className="w-3 h-3 text-primary/50" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-foreground line-clamp-2 leading-snug">
                                  {buildContextualTitle(p.ementa || '', group.label, plHeadlines.get(p.id_externo))}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    p.sigla_tipo === 'PEC' ? 'bg-red-500/20 text-red-400' :
                                    p.sigla_tipo === 'PLP' ? 'bg-purple-500/20 text-purple-400' :
                                    'bg-primary/20 text-primary'
                                  }`}>
                                    {p.sigla_tipo} {p.numero}/{p.ano}
                                  </span>
                                  {p.autor && <span className="text-[10px] text-muted-foreground truncate">{p.autor}</span>}
                                  {dataApresentacao && (
                                    <span className="text-[10px] text-muted-foreground ml-auto">
                                      {new Date(dataApresentacao).toLocaleDateString('pt-BR')}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </TabsContent>
        </Tabs>
      </div>
      {openAlteracao && (
        <AlteracaoDetailSheet
          leiNome={openAlteracao.leiNome}
          artigoNumero={openAlteracao.item.artigoNumero}
          artigoTexto={openAlteracao.item.artigoTexto}
          tipo={openAlteracao.item.tipo}
          referencia={openAlteracao.item.referencia}
          parteModificada={openAlteracao.item.parteModificada}
          ano={openAlteracao.item.ano}
          onClose={() => setOpenAlteracao(null)}
        />
      )}

      {/* Detail overlay for lei/decreto */}
      <AnimatePresence>
        {selectedLei && (
          <motion.div
            className="fixed inset-0 z-50 bg-background overflow-y-auto"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          >
            <LeiOrdinariaDetail
              lei={selectedLei}
              onBack={() => setSelectedLei(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Radar360;
