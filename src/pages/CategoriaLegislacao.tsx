import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Search, BookOpen, ChevronRight, Scale, ArrowLeft, Landmark, Shield, FileText, ScrollText, Loader2, Star, Gavel, Building2, Briefcase, ShieldCheck, DollarSign, Car, Vote, Droplets, Plane, Bus, ListMusic, Sparkles, StickyNote, Calendar, ExternalLink, ArrowUp, BadgeCheck, Ban, Play, Pause, CheckCircle2, Radar, GitBranch, Info, BookMarked, HeartPulse } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { getLeisPorTipo, fetchArtigosPaginado, fetchArtigosInstant, getCachedArtigos, setCachedArtigos, prefetchAllArtigos, ANOS_LEIS_ORDINARIAS, ANOS_DECRETOS, fetchLeisOrdinariasPorAno, fetchDecretosPorAno, type LeiOrdinaria } from '@/services/legislacaoService';
import { fetchSumulas, type Sumula, SUMULA_TRIBUNAIS } from '@/services/sumulasService';
import ArtigoCard from '@/components/vademecum/ArtigoCard';
import ArtigoBottomSheet from '@/components/vademecum/ArtigoBottomSheet';
import GrafoOverlay from '@/components/vademecum/GrafoOverlay';
import LeiOrdinariaDetail from '@/components/vademecum/LeiOrdinariaDetail';
import type { ArtigoLei } from '@/data/mockData';
import brasaoImg from '@/assets/brasao-republica.png';
import { useIsDesktop } from '@/hooks/use-desktop';
import RadarLegislacaoContent, { prefetchRadarData } from '@/components/vademecum/RadarLegislacaoContent';

const TIPO_CONFIG: Record<string, { label: string; icon: React.ElementType; bg: string }> = {
  constituicao: { label: 'Constituição', icon: Landmark, bg: 'from-amber-500/90 to-amber-700/80' },
  codigo: { label: 'Códigos', icon: Scale, bg: 'from-sky-500/90 to-sky-700/80' },
  estatuto: { label: 'Estatutos', icon: Shield, bg: 'from-emerald-500/90 to-emerald-700/80' },
  'lei-ordinaria': { label: 'Leis Ordinárias', icon: FileText, bg: 'from-violet-500/90 to-violet-700/80' },
  decreto: { label: 'Decretos', icon: ScrollText, bg: 'from-orange-500/90 to-orange-700/80' },
  sumula: { label: 'Súmulas', icon: Gavel, bg: 'from-pink-500/90 to-pink-700/80' },
};

const LEI_ICON_MAP: Record<string, React.ElementType> = {
  CP: Gavel,
  CC: Building2,
  CPC: FileText,
  CPP: ShieldCheck,
  CLT: Briefcase,
  CDC: ShieldCheck,
  CTN: DollarSign,
  CTB: Car,
  CE: Vote,
  CA: Droplets,
  CBA: Plane,
  CBT: Bus,
};

const CategoriaLegislacao = () => {
  const isDesktop = useIsDesktop();
  const { tipo } = useParams<{ tipo: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeiId, setSelectedLeiId] = useState<string | null>(null);
  const [selectedLeiNome, setSelectedLeiNome] = useState('');
  const [selectedLeiDescricao, setSelectedLeiDescricao] = useState('');
  const [selectedTabelaNome, setSelectedTabelaNome] = useState<string | null>(null);
  const [artigos, setArtigos] = useState<ArtigoLei[]>([]);
  const [loadingArtigos, setLoadingArtigos] = useState(false);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [openArtigo, setOpenArtigo] = useState<ArtigoLei | null>(null);
  const [openFromNovidades, setOpenFromNovidades] = useState(false);
  const [openModInfo, setOpenModInfo] = useState<import('@/components/vademecum/ArtigoBottomSheet').ModificationInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'art' | 'cap'>('art');
  const [overlayPanel, setOverlayPanel] = useState<'fav' | 'playlist' | 'novidades' | 'anotacoes' | 'radar' | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [stickySearch, setStickySearch] = useState(false);
  const searchBarRef = useRef<HTMLDivElement | null>(null);
  const [expandedTitulo, setExpandedTitulo] = useState<string | null>(null);
  // Playlist state
  const [playlistNarracoes, setPlaylistNarracoes] = useState<Record<string, string>>({});
  const [loadingPlaylist, setLoadingPlaylist] = useState(false);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [favoritos, setFavoritos] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('vademecum-favoritos');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  // Leis Ordinárias state
  const [selectedAno, setSelectedAno] = useState<number | null>(null);
  const [leisOrdinarias, setLeisOrdinarias] = useState<LeiOrdinaria[]>([]);
  const [loadingLeisOrd, setLoadingLeisOrd] = useState(false);
  const [searchLeisOrd, setSearchLeisOrd] = useState('');
  const [openLeiOrd, setOpenLeiOrd] = useState<LeiOrdinaria | null>(null);
  // Decretos state
  const [selectedAnoDecreto, setSelectedAnoDecreto] = useState<number | null>(null);
  const [decretos, setDecretos] = useState<LeiOrdinaria[]>([]);
  const [loadingDecretos, setLoadingDecretos] = useState(false);
  const [searchDecretos, setSearchDecretos] = useState('');
  const [openDecreto, setOpenDecreto] = useState<LeiOrdinaria | null>(null);
  // Súmulas state
  const [selectedTribunal, setSelectedTribunal] = useState<string | null>(null);
  const [sumulas, setSumulas] = useState<Sumula[]>([]);
  const [loadingSumulas, setLoadingSumulas] = useState(false);
  const [searchSumulas, setSearchSumulas] = useState('');
  const [openSumula, setOpenSumula] = useState<Sumula | null>(null);
  const [showGrafo, setShowGrafo] = useState(false);

  // Fetch narrations when playlist tab is active
  useEffect(() => {
    if (overlayPanel !== 'playlist' || !selectedTabelaNome) return;
    setLoadingPlaylist(true);
    supabase
      .from('narracoes_artigos')
      .select('artigo_numero,audio_url')
      .eq('tabela_nome', selectedTabelaNome)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, string> = {};
          data.forEach((r) => { map[r.artigo_numero] = r.audio_url; });
          setPlaylistNarracoes(map);
        }
        setLoadingPlaylist(false);
      });
  }, [overlayPanel, selectedTabelaNome]);

  // Reset playlist when law changes
  useEffect(() => {
    setPlaylistNarracoes({});
  }, [selectedTabelaNome]);

  const togglePlayAudio = useCallback((url: string) => {
    if (playingUrl === url && audioRef.current) {
      audioRef.current.pause();
      setPlayingUrl(null);
      return;
    }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(url);
    audio.play();
    audio.onended = () => { setPlayingUrl(null); audioRef.current = null; };
    audioRef.current = audio;
    setPlayingUrl(url);
  }, [playingUrl]);

  // Scroll-to-top visibility + sticky search bar
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 600);
    window.addEventListener('scroll', handleScroll, { passive: true });

    const observer = new IntersectionObserver(
      ([entry]) => setStickySearch(!entry.isIntersecting),
      { threshold: 0 }
    );
    const el = searchBarRef.current;
    if (el) observer.observe(el);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (el) observer.unobserve(el);
    };
  }, [selectedLeiId]);
  

  const toggleFavorito = (id: string) => {
    setFavoritos(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem('vademecum-favoritos', JSON.stringify([...next]));
      return next;
    });
  };

  const config = tipo ? TIPO_CONFIG[tipo] : null;
  const Icon = config?.icon || Scale;

  const [leis, setLeis] = useState<{ id: string; nome: string; sigla: string; descricao: string; tipo: string; tabela_nome: string }[]>([]);
  const [loadingLeis, setLoadingLeis] = useState(true);

  useEffect(() => {
    if (!tipo) return;
    setLoadingLeis(true);
    getLeisPorTipo(tipo).then((data) => {
      setLeis(data);
      setLoadingLeis(false);
      // If only one lei in category, auto-select it
      if (data.length === 1 && !selectedLeiId) {
        const lei = data[0];
        setSelectedLeiId(lei.id);
        setSelectedLeiNome(lei.nome);
        setSelectedLeiDescricao(lei.descricao);
        setSelectedTabelaNome(lei.tabela_nome);
      }
    });
  }, [tipo]);

  // Prefetch artigos em background para carregamento instantâneo (paralelo)
  useEffect(() => {
    if (leis.length === 0) return;
    // Use the centralized parallel prefetch
    prefetchAllArtigos(4);
  }, [leis]);

  // Scroll to top when selecting a lei
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedLeiId, tipo]);

  // Auto-select lei from navigation state (e.g. from Acesso Rápido)
  useEffect(() => {
    const state = location.state as { autoSelectLei?: { leiId: string; nome: string; descricao: string; tabela_nome: string } } | null;
    if (state?.autoSelectLei) {
      const lei = state.autoSelectLei;
      setSelectedLeiId(lei.leiId);
      setSelectedLeiNome(lei.nome);
      setSelectedLeiDescricao(lei.descricao);
      setSelectedTabelaNome(lei.tabela_nome);
      // Clear the state so it doesn't re-trigger
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  // Fetch leis ordinárias when year selected
  useEffect(() => {
    if (!selectedAno) return;
    setLoadingLeisOrd(true);
    fetchLeisOrdinariasPorAno(selectedAno).then((data) => {
      setLeisOrdinarias(data);
      setLoadingLeisOrd(false);
    });
  }, [selectedAno]);

  // Fetch decretos when year selected
  useEffect(() => {
    if (!selectedAnoDecreto) return;
    setLoadingDecretos(true);
    fetchDecretosPorAno(selectedAnoDecreto).then((data) => {
      setDecretos(data);
      setLoadingDecretos(false);
    });
  }, [selectedAnoDecreto]);

  // Fetch sumulas when tribunal selected
  useEffect(() => {
    if (!selectedTribunal) return;
    setLoadingSumulas(true);
    fetchSumulas(selectedTribunal).then((data) => {
      setSumulas(data);
      setLoadingSumulas(false);
    });
  }, [selectedTribunal]);

  const filteredSumulas = useMemo(() => {
    if (!searchSumulas) return sumulas;
    const q = searchSumulas.toLowerCase();
    return sumulas.filter(s =>
      s.enunciado.toLowerCase().includes(q) ||
      String(s.numero).includes(q)
    );
  }, [sumulas, searchSumulas]);

  const filteredLeisOrdinarias = useMemo(() => {
    if (!searchLeisOrd) return leisOrdinarias;
    const q = searchLeisOrd.toLowerCase();
    return leisOrdinarias.filter(l =>
      l.numero_lei.toLowerCase().includes(q) ||
      l.ementa.toLowerCase().includes(q)
    );
  }, [leisOrdinarias, searchLeisOrd]);

  const filteredDecretos = useMemo(() => {
    if (!searchDecretos) return decretos;
    const q = searchDecretos.toLowerCase();
    return decretos.filter(d =>
      d.numero_lei.toLowerCase().includes(q) ||
      d.ementa.toLowerCase().includes(q)
    );
  }, [decretos, searchDecretos]);

  const filteredLeis = useMemo(() => {
    if (!searchQuery) return leis;
    const q = searchQuery.toLowerCase();
    return leis.filter(lei =>
      lei.nome.toLowerCase().includes(q) ||
      lei.sigla.toLowerCase().includes(q) ||
      lei.descricao.toLowerCase().includes(q)
    );
  }, [leis, searchQuery]);

  useEffect(() => {
    if (!selectedLeiId || !selectedTabelaNome) return;
    let cancelled = false;

    // Check cache first — instant display, no spinner
    const cached = getCachedArtigos(selectedTabelaNome);
    if (cached && cached.length > 0) {
      setArtigos(cached);
      setLoadedKey(selectedTabelaNome);
      setLoadingArtigos(false);
      return;
    }

    // Phase 1: fetch first 10 artigos instantly (~100ms)
    setLoadingArtigos(true);
    const tabelaAtual = selectedTabelaNome;
    fetchArtigosInstant(tabelaAtual, 10).then((first) => {
      if (cancelled) return;
      setArtigos(first);
      setLoadedKey(tabelaAtual);
      setLoadingArtigos(false);

      // Phase 2: fetch all artigos in background
      fetchArtigosPaginado(tabelaAtual, 0, 10000).then((all) => {
        if (cancelled) return;
        setArtigos(all);
      });
    });

    return () => { cancelled = true; };
  }, [selectedLeiId, selectedTabelaNome]);

  // Prefetch Radar data in background as soon as a law is selected
  useEffect(() => {
    if (!selectedLeiId || !selectedLeiNome) return;
    prefetchRadarData(selectedLeiNome, selectedTabelaNome);
  }, [selectedLeiId, selectedLeiNome, selectedTabelaNome]);

  const filteredArtigos = useMemo(() => artigos, [artigos]);

  const highlightText = (text: string) => text;

  const [highlightedArtigoId, setHighlightedArtigoId] = useState<string | null>(null);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    const raw = searchQuery.trim();
    // Extract just digits (and optional suffix like -A) from user input
    const digits = raw.replace(/[^\d\-a-zA-Z]/g, '').replace(/^[a-zA-Z]+/, '');
    if (!digits) return;

    // Find exact article by comparing extracted number
    const found = artigos.find(a => {
      const artNum = a.numero.replace(/^art\.?\s*/i, '').replace(/[º°]/g, '').trim();
      return artNum === digits;
    }) || artigos.find(a => {
      const artNum = a.numero.replace(/^art\.?\s*/i, '').replace(/[º°]/g, '').trim();
      return artNum.startsWith(digits);
    });

    if (found) {
      // Close keyboard to prevent layout shift
      (document.activeElement as HTMLElement)?.blur();
      setActiveTab('art');
      setExpandedTitulo(null);
      setTimeout(() => {
        const el = document.getElementById(`artigo-${found.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHighlightedArtigoId(found.id);
          setTimeout(() => setHighlightedArtigoId(null), 2500);
        }
      }, 300);
    }
  };

  // Show títulos for laws that have them (check if artigos have titulo filled)
  const showTitulos = useMemo(() => {
    if (artigos.length === 0) return false;
    return artigos.some(a => a.titulo && a.titulo.trim() !== '');
  }, [artigos]);

  // Build hierarchical groups: Título → Capítulo → Artigos
  const capituloGroups = useMemo(() => {
    const stripRedacao = (s: string) => s.replace(/\s*\((?:Redação|Incluído|Revogado|Acrescido|Alterado|Vide|Regulamento)[^)]*\)/gi, '').trim();
    
    type CapGroup = { capitulo: string; artigos: typeof artigos };
    type TituloGroup = { titulo: string; capitulos: CapGroup[] };
    
    const groups: TituloGroup[] = [];
    const tituloMap = new Map<string, TituloGroup>();
    
    for (const art of artigos) {
      // For non-CP laws, group everything under a single hidden título
      const rawTitulo = showTitulos ? (art.titulo || 'Sem título') : '__no_titulo__';
      const tituloKey = showTitulos && rawTitulo === 'Sem título' ? 'TÍTULO I - DA APLICAÇÃO DA LEI PENAL' : rawTitulo;
      const capKey = art.capitulo || '__sem_capitulo__';
      
      if (!tituloMap.has(tituloKey)) {
        const g: TituloGroup = { titulo: tituloKey, capitulos: [] };
        tituloMap.set(tituloKey, g);
        groups.push(g);
      }
      const tGroup = tituloMap.get(tituloKey)!;
      
      let capGroup = tGroup.capitulos.find(c => c.capitulo === capKey);
      if (!capGroup) {
        capGroup = { capitulo: capKey, artigos: [] };
        tGroup.capitulos.push(capGroup);
      }
      capGroup.artigos.push(art);
    }
    return groups;
  }, [artigos, showTitulos]);

  const totalCapitulos = useMemo(() => {
    return capituloGroups.reduce((sum, g) => sum + g.capitulos.length, 0);
  }, [capituloGroups]);

  // View: Leis Ordinárias — year selection + list
  if (tipo === 'lei-ordinaria' && !selectedLeiId) {
    // If viewing a specific lei ordinária detail
    if (openLeiOrd) {
      return (
        <LeiOrdinariaDetail
          lei={openLeiOrd}
          onBack={() => setOpenLeiOrd(null)}
        />
      );
    }

    // If a year is selected, show the list of laws
    if (selectedAno) {
      return (
        <div className="min-h-screen bg-background pb-20 lg:pb-0">
          <div className={`bg-gradient-to-br ${config?.bg || 'from-primary to-primary/80'} px-4 pt-10 pb-6 sm:px-6 md:px-8`}>
            <div className="max-w-5xl mx-auto">
              <button
                onClick={() => { setSelectedAno(null); setSearchLeisOrd(''); }}
                className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar aos anos
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-display text-2xl text-white font-bold">Leis Ordinárias — {selectedAno}</h1>
                  <p className="text-white/70 text-sm">{leisOrdinarias.length} leis</p>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número ou ementa..."
                value={searchLeisOrd}
                onChange={(e) => setSearchLeisOrd(e.target.value)}
                className="pl-10 bg-secondary border-border"
              />
            </div>

            {loadingLeisOrd ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-muted-foreground text-sm">Carregando leis ordinárias...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLeisOrdinarias.map((lei, i) => (
                  <motion.button
                    key={lei.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.015 }}
                    onClick={() => setOpenLeiOrd(lei)}
                    className="w-full text-left rounded-2xl bg-card hover:bg-secondary/60 transition-all group flex overflow-hidden min-h-[82px]"
                  >
                    <div className="w-1.5 bg-primary rounded-l-2xl shrink-0" />
                    <div className="flex items-center gap-3 p-4 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                        <Scale className="w-4 h-4 text-primary-light" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="font-display text-[15px] font-bold text-primary-light">
                            {lei.numero_lei}
                          </h4>
                          {lei.data_publicacao && (
                            <span className="text-muted-foreground text-[10px] bg-secondary px-2 py-0.5 rounded-full">
                              {lei.data_publicacao}
                            </span>
                          )}
                        </div>
                        <p className="text-[13px] leading-relaxed line-clamp-2 text-foreground/80">
                          {lei.ementa}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 mt-3 transition-colors" />
                    </div>
                  </motion.button>
                ))}
                {filteredLeisOrdinarias.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Nenhuma lei encontrada.</p>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Year selection view
    return (
      <div className="min-h-screen bg-background pb-20 lg:pb-0">
        <div className={`bg-gradient-to-br ${config?.bg || 'from-primary to-primary/80'} px-4 pt-10 pb-6 sm:px-6 md:px-8`}>
          <div className="max-w-5xl mx-auto">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao início
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-display text-2xl text-white font-bold">Leis Ordinárias</h1>
                <p className="text-white/70 text-sm">Selecione o ano</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ANOS_LEIS_ORDINARIAS.map((ano, i) => (
              <motion.button
                key={ano}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedAno(ano)}
                className="w-full text-left rounded-xl p-5 bg-card hover:bg-secondary/50 transition-all group flex items-center gap-4"
                style={{ borderLeft: '3px solid hsl(var(--primary))' }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-2xl text-foreground group-hover:text-primary transition-colors font-bold">
                    {ano}
                  </h3>
                  <p className="text-muted-foreground text-sm">Leis Ordinárias</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors ml-auto" />
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // View: Decretos — year selection + list (same pattern as lei-ordinaria)
  if (tipo === 'decreto' && !selectedLeiId) {
    if (openDecreto) {
      return (
        <LeiOrdinariaDetail
          lei={openDecreto}
          onBack={() => setOpenDecreto(null)}
        />
      );
    }

    if (selectedAnoDecreto) {
      return (
        <div className="min-h-screen bg-background pb-20 lg:pb-0">
          <div className={`bg-gradient-to-br ${config?.bg || 'from-primary to-primary/80'} px-4 pt-10 pb-6 sm:px-6 md:px-8`}>
            <div className="max-w-5xl mx-auto">
              <button
                onClick={() => { setSelectedAnoDecreto(null); setSearchDecretos(''); }}
                className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar aos anos
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                  <ScrollText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-display text-2xl text-white font-bold">Decretos — {selectedAnoDecreto}</h1>
                  <p className="text-white/70 text-sm">{decretos.length} decretos</p>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número ou ementa..."
                value={searchDecretos}
                onChange={(e) => setSearchDecretos(e.target.value)}
                className="pl-10 bg-secondary border-border"
              />
            </div>

            {loadingDecretos ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-muted-foreground text-sm">Carregando decretos...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredDecretos.map((dec, i) => (
                  <motion.button
                    key={dec.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.015 }}
                    onClick={() => setOpenDecreto(dec)}
                    className="w-full text-left rounded-2xl bg-card hover:bg-secondary/60 transition-all group flex overflow-hidden min-h-[82px]"
                  >
                    <div className="w-1.5 bg-primary rounded-l-2xl shrink-0" />
                    <div className="flex items-center gap-3 p-4 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                        <ScrollText className="w-4 h-4 text-primary-light" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="font-display text-[15px] font-bold text-primary-light">
                            {dec.numero_lei}
                          </h4>
                          {dec.data_publicacao && (
                            <span className="text-muted-foreground text-[10px] bg-secondary px-2 py-0.5 rounded-full">
                              {dec.data_publicacao}
                            </span>
                          )}
                        </div>
                        <p className="text-[13px] leading-relaxed line-clamp-2 text-foreground/80">
                          {dec.ementa}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 mt-3 transition-colors" />
                    </div>
                  </motion.button>
                ))}
                {filteredDecretos.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Nenhum decreto encontrado.</p>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Year selection view for decretos
    return (
      <div className="min-h-screen bg-background pb-20 lg:pb-0">
        <div className={`bg-gradient-to-br ${config?.bg || 'from-primary to-primary/80'} px-4 pt-10 pb-6 sm:px-6 md:px-8`}>
          <div className="max-w-5xl mx-auto">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao início
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                <ScrollText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-display text-2xl text-white font-bold">Decretos</h1>
                <p className="text-white/70 text-sm">Selecione o ano</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ANOS_DECRETOS.map((ano, i) => (
              <motion.button
                key={ano}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedAnoDecreto(ano)}
                className="w-full text-left rounded-xl p-5 bg-card hover:bg-secondary/50 transition-all group flex items-center gap-4"
                style={{ borderLeft: '3px solid hsl(var(--primary))' }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-2xl text-foreground group-hover:text-primary transition-colors font-bold">
                    {ano}
                  </h3>
                  <p className="text-muted-foreground text-sm">Decretos</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors ml-auto" />
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // View: Súmulas — tribunal selection + list
  if (tipo === 'sumula' && !selectedLeiId) {
    // If a tribunal is selected, show the list of sumulas
    if (selectedTribunal) {
      const tribunalInfo = SUMULA_TRIBUNAIS.find(t => t.id === selectedTribunal);
      return (
        <div className="min-h-screen bg-background pb-20 lg:pb-0">
          <div className={`bg-gradient-to-br ${config?.bg || 'from-primary to-primary/80'} px-4 pt-10 pb-6 sm:px-6 md:px-8`}>
            <div className="max-w-5xl mx-auto">
              <button
                onClick={() => { setSelectedTribunal(null); setSearchSumulas(''); }}
                className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar aos tribunais
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                  <Gavel className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-display text-2xl text-white font-bold">{tribunalInfo?.nome || selectedTribunal}</h1>
                  <p className="text-white/70 text-sm">{sumulas.length} súmulas</p>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número ou enunciado..."
                value={searchSumulas}
                onChange={(e) => setSearchSumulas(e.target.value)}
                className="pl-10 bg-secondary border-border"
              />
            </div>

            {loadingSumulas ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-muted-foreground text-sm">Carregando súmulas...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSumulas.map((sumula, i) => (
                  <motion.button
                    key={sumula.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.01, 0.5) }}
                    onClick={() => setOpenSumula(sumula)}
                    className="w-full text-left rounded-2xl bg-card hover:bg-secondary/60 transition-all group flex overflow-hidden min-h-[82px]"
                  >
                    <div
                      className="w-1.5 rounded-l-2xl shrink-0"
                      style={{ backgroundColor: sumula.situacao === 'cancelada' ? '#ef4444' : (tribunalInfo?.iconColor || 'hsl(var(--primary))') }}
                    />
                    <div className="flex items-center gap-3 p-4 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                        <Scale className="w-4 h-4 text-primary-light" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="font-display text-[15px] font-bold text-primary-light">
                            Súmula {selectedTribunal === 'STF_VINCULANTE' ? 'Vinculante ' : ''}{sumula.numero}
                          </h4>
                          {sumula.situacao === 'cancelada' && (
                            <span className="text-[10px] bg-destructive/15 text-destructive px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                              <Ban className="w-3 h-3" /> Cancelada
                            </span>
                          )}
                          {sumula.situacao === 'vigente' && (
                            <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                              <BadgeCheck className="w-3 h-3" /> Vigente
                            </span>
                          )}
                        </div>
                        <p className="text-[13px] leading-relaxed line-clamp-2 text-foreground/80">
                          {searchSumulas ? highlightText(sumula.enunciado) : sumula.enunciado}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 mt-3 transition-colors" />
                    </div>
                  </motion.button>
                ))}
                {filteredSumulas.length === 0 && !loadingSumulas && (
                  <p className="text-center text-muted-foreground py-8">Nenhuma súmula encontrada.</p>
                )}
              </div>
            )}
          </div>

          {/* Bottom sheet for súmula detail */}
          {openSumula && (
            <ArtigoBottomSheet
              artigo={{
                id: openSumula.id,
                numero: `Súmula ${selectedTribunal === 'STF_VINCULANTE' ? 'Vinculante ' : ''}${openSumula.numero}`,
                caput: openSumula.enunciado,
              }}
              onClose={() => setOpenSumula(null)}
            />
          )}
        </div>
      );
    }

    // Tribunal selection view
    return (
      <div className="min-h-screen bg-background pb-20 lg:pb-0">
        <div className={`bg-gradient-to-br ${config?.bg || 'from-primary to-primary/80'} px-4 pt-10 pb-6 sm:px-6 md:px-8`}>
          <div className="max-w-5xl mx-auto">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao início
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                <Gavel className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-display text-2xl text-white font-bold">Súmulas</h1>
                <p className="text-white/70 text-sm">Selecione o tribunal</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {SUMULA_TRIBUNAIS.map((trib, i) => (
              <motion.button
                key={trib.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedTribunal(trib.id)}
                className="w-full text-left rounded-xl p-5 bg-card hover:bg-secondary/50 transition-all group flex items-center gap-4"
                style={{ borderLeft: `3px solid ${trib.iconColor}` }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${trib.iconColor}20` }}
                >
                  <Gavel className="w-6 h-6" style={{ color: trib.iconColor }} />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-base text-foreground group-hover:text-primary transition-colors font-bold">
                    {trib.nome}
                  </h3>
                  <p className="text-muted-foreground text-xs">{trib.descricao}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // View: artigos de uma lei selecionada
  if (selectedLeiId) {
    const stripRedacaoFn = (s: string) => s.replace(/\s*\((?:Redação|Incluído|Revogado|Acrescido|Alterado|Vide|Regulamento)[^)]*\)/gi, '').trim();

    // Desktop: chapters sidebar + articles
    const chaptersPanel = !loadingArtigos && capituloGroups.length > 0 && (
      <div className="space-y-2">
        <p className="text-[10px] font-body font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Capítulos ({totalCapitulos})
        </p>
        {/* "Todos" option to clear filter */}
        {isDesktop && expandedTitulo && (
          <button
            onClick={() => setExpandedTitulo(null)}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-body text-primary hover:bg-secondary transition-colors font-semibold"
          >
            ← Todos os artigos
          </button>
        )}
        {capituloGroups.map((tGroup, ti) => (
          <div key={ti}>
            {showTitulos && (
              <div className="mb-1 mt-3 first:mt-0">
                <span className="text-primary-light text-[9px] font-bold uppercase tracking-wider">{stripRedacaoFn(tGroup.titulo)}</span>
              </div>
            )}
            {tGroup.capitulos.map((capGroup, ci) => {
              const capKey = `${tGroup.titulo}__${capGroup.capitulo}`;
              const isExpanded = expandedTitulo === capKey;
              const displayCap = capGroup.capitulo === '__sem_capitulo__'
                ? 'Disposições Gerais'
                : stripRedacaoFn(capGroup.capitulo);
              return (
                <button
                  key={ci}
                  onClick={() => setExpandedTitulo(isExpanded ? null : capKey)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-body transition-colors ${
                    isExpanded ? 'bg-primary/15 text-primary font-semibold' : 'text-foreground/70 hover:bg-secondary'
                  }`}
                >
                  <span className="line-clamp-2">{displayCap}</span>
                  <span className="text-muted-foreground text-[10px]"> ({capGroup.artigos.length})</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );

    // Articles content
    const articlesContent = loadingArtigos ? (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm">Carregando artigos...</p>
      </div>
    ) : activeTab === 'art' ? (
      <div className="space-y-2 pb-8">
        {(isDesktop && expandedTitulo
          ? filteredArtigos.filter(a => {
              for (const tg of capituloGroups) {
                for (const cg of tg.capitulos) {
                  const ck = `${tg.titulo}__${cg.capitulo}`;
                  if (ck === expandedTitulo) return cg.artigos.some(ca => ca.id === a.id);
                }
              }
              return false;
            })
          : filteredArtigos
        ).map((artigo, i) => (
          <ArtigoCard
            key={artigo.id}
            artigo={artigo}
            index={i}
            onClick={() => setOpenArtigo(artigo)}
            highlightText={searchQuery ? highlightText : undefined}
            isHighlighted={highlightedArtigoId === artigo.id}
          />
        ))}
        {filteredArtigos.length === 0 && loadedKey === selectedTabelaNome && !loadingArtigos && (
          <p className="text-center text-muted-foreground py-8">Nenhum artigo encontrado.</p>
        )}
      </div>
    ) : activeTab === 'cap' ? (
      <div className="space-y-4 pb-8">
        {capituloGroups.map((tGroup, ti) => {
          const displayTitulo = stripRedacaoFn(tGroup.titulo);
          const totalArtsInTitulo = tGroup.capitulos.reduce((s, c) => s + c.artigos.length, 0);
          return (
            <div key={ti}>
              {showTitulos && (
                <div className="mb-2">
                  <span className="text-primary-light text-[10px] font-bold uppercase tracking-wider">Título</span>
                  <h4 className="font-display text-sm font-bold text-foreground leading-snug">{displayTitulo}</h4>
                  <p className="text-muted-foreground text-[10px] mt-0.5">{totalArtsInTitulo} artigos</p>
                </div>
              )}
              <div className="space-y-2">
                {tGroup.capitulos.map((capGroup, ci) => {
                  const capKey = `${tGroup.titulo}__${capGroup.capitulo}`;
                  const isExpanded = expandedTitulo === capKey;
                  const firstArt = capGroup.artigos[0]?.numero || '';
                  const lastArt = capGroup.artigos[capGroup.artigos.length - 1]?.numero || '';
                  const displayCap = capGroup.capitulo === '__sem_capitulo__'
                    ? 'Disposições Gerais'
                    : stripRedacaoFn(capGroup.capitulo);
                  return (
                    <div key={ci}>
                      <motion.button
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: ci * 0.02 }}
                        onClick={() => setExpandedTitulo(isExpanded ? null : capKey)}
                        className="w-full text-left rounded-2xl bg-card hover:bg-secondary/60 transition-all flex overflow-hidden"
                      >
                        <div className="w-1.5 bg-primary rounded-l-2xl shrink-0" />
                        <div className="p-3.5 flex-1 min-w-0">
                          <h5 className="font-display text-xs font-bold text-foreground leading-snug">{displayCap}</h5>
                          <p className="text-muted-foreground text-[10px] mt-0.5">{capGroup.artigos.length} artigos ({firstArt} – {lastArt})</p>
                        </div>
                        <div className="flex items-center pr-4">
                          <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </div>
                      </motion.button>
                      {isExpanded && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pl-4 mt-2 space-y-2">
                          {capGroup.artigos.map((artigo, i) => (
                            <ArtigoCard key={artigo.id} artigo={artigo} index={i} onClick={() => setOpenArtigo(artigo)} />
                          ))}
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    ) : null;

    // ---- Overlay panel content builders ----
    const favContent = (
      <div className="space-y-2 pb-8">
        {artigos.filter(a => favoritos.has(a.id)).length > 0 ? (
          artigos.filter(a => favoritos.has(a.id)).map((artigo, i) => (
            <ArtigoCard key={artigo.id} artigo={artigo} index={i} onClick={() => { setOverlayPanel(null); setOpenArtigo(artigo); }} />
          ))
        ) : (
          <div className="flex flex-col items-center py-12 gap-2">
            <Star className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">Nenhum artigo favoritado ainda.</p>
            <p className="text-muted-foreground/60 text-xs">Toque na estrela ao abrir um artigo para favoritá-lo.</p>
          </div>
        )}
      </div>
    );

    const playlistContent = loadingPlaylist ? (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm">Carregando playlist...</p>
      </div>
    ) : (() => {
      const narradosEntries = Object.entries(playlistNarracoes);
      if (narradosEntries.length === 0) {
        return (
          <div className="flex flex-col items-center py-12 gap-2">
            <ListMusic className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">Nenhuma narração disponível.</p>
            <p className="text-muted-foreground/60 text-xs">Gere narrações na tela de Narração de Artigos.</p>
          </div>
        );
      }
      const narradosArtigos = artigos.filter(a => playlistNarracoes[a.numero]);
      return (
        <div className="space-y-2 pb-8">
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-3">
            🎧 {narradosArtigos.length} artigo{narradosArtigos.length !== 1 ? 's' : ''} narrado{narradosArtigos.length !== 1 ? 's' : ''}
          </p>
          {narradosArtigos.map((artigo, i) => {
            const audioUrl = playlistNarracoes[artigo.numero];
            const isPlaying = playingUrl === audioUrl;
            return (
              <motion.div
                key={artigo.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="rounded-2xl bg-card hover:bg-secondary/60 transition-all flex overflow-hidden"
              >
                <div className="w-1.5 bg-primary rounded-l-2xl shrink-0" />
                <div className="flex items-center gap-3 p-3.5 flex-1 min-w-0">
                  <button
                    onClick={() => togglePlayAudio(audioUrl)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      isPlaying
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-primary/15 text-primary hover:bg-primary/25'
                    }`}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => { setOverlayPanel(null); setOpenArtigo(artigo); }}
                  >
                    <h4 className="font-display text-[15px] font-bold text-primary-light">{artigo.numero}</h4>
                    <p className="text-[13px] leading-relaxed line-clamp-2 text-foreground/80 font-body">
                      {artigo.caput.substring(0, 120)}{artigo.caput.length > 120 ? '...' : ''}
                    </p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                </div>
              </motion.div>
            );
          })}
        </div>
      );
    })();

    const anotacoesContent = (
      <div className="space-y-2 pb-8">
        <div className="flex flex-col items-center py-12 gap-2">
          <StickyNote className="w-8 h-8 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">Nenhuma anotação ainda.</p>
          <p className="text-muted-foreground/60 text-xs">Grife um trecho e adicione um comentário para criar anotações.</p>
        </div>
      </div>
    );

    const novidadesContent = (() => {
      const modRegex = /\((?:Redação\s+dada|Incluíd[oa]|Acrescid[oa]|Revogad[oa]|Alterad[oa]|Vetad[oa]|Vigência|Regulamento|Vide|Promulgação|Renumerado|Transformado|Suprimido|Restabelecido|Ressalvado|Produção de efeito)[^)]*\)/gi;
      const yearRegex = /\b(1\d{3}|20\d{2})\b/;
      const typeRegex = /^\((Redação\s+dada|Incluíd[oa]|Acrescid[oa]|Revogad[oa]|Alterad[oa]|Vetad[oa]|Vigência|Regulamento|Vide|Promulgação|Renumerado|Transformado|Suprimido|Restabelecido|Ressalvado|Produção de efeito)/i;

      type ModItem = { artigo: ArtigoLei; tipo: string; referencia: string; ano: number; parteModificada: string; leiNome: string; linhasModificadas: number[] };
      const items: ModItem[] = [];

      for (const artigo of artigos) {
        const lines = artigo.caput.split('\n').filter(l => l.trim());
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
          if (!refGroups.has(refKey)) {
            refGroups.set(refKey, { indices: [], tipo, ref: refKey, ano });
          }
          refGroups.get(refKey)!.indices.push(li);
        }
        if (refGroups.size === 0) continue;
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
            if (group.indices.length > 1) {
              parteModificada += ` (+${group.indices.length - 1})`;
            }
          }
          const leiMatch = refKey.match(/(?:Lei(?:\s+Complementar)?|Decreto(?:-Lei)?|Emenda\s+Constitucional|Medida\s+Provisória)\s+n[º°]?\s*[\d.]+(?:,\s*de\s*\d{4})?/i);
          const leiNome = leiMatch ? leiMatch[0] : refKey;
          items.push({ artigo, tipo: group.tipo, referencia: refKey, ano: group.ano, parteModificada, leiNome, linhasModificadas: group.indices });
        }
      }
      items.sort((a, b) => b.ano - a.ano);

      const badgeColor = (tipo: string) => {
        const t = tipo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (t.startsWith('revogad')) return 'bg-destructive/20 text-destructive';
        if (t.startsWith('vetad')) return 'bg-destructive/20 text-destructive';
        if (t.startsWith('suprimid')) return 'bg-destructive/20 text-destructive';
        if (t.startsWith('incluid')) return 'bg-emerald-500/20 text-emerald-400';
        if (t.startsWith('acrescid')) return 'bg-emerald-500/20 text-emerald-400';
        if (t.startsWith('redacao') || t.startsWith('alterad')) return 'bg-amber-500/20 text-amber-400';
        if (t.startsWith('renumerad')) return 'bg-sky-500/20 text-sky-400';
        if (t.startsWith('vigencia') || t.startsWith('producao')) return 'bg-violet-500/20 text-violet-400';
        return 'bg-muted text-muted-foreground';
      };

      if (items.length === 0) {
        return (
          <div className="flex flex-col items-center py-12 gap-2">
            <Sparkles className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">Nenhuma alteração legislativa encontrada.</p>
          </div>
        );
      }

      const grouped = new Map<number, ModItem[]>();
      for (const item of items) {
        const key = item.ano || 0;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(item);
      }

      return (
        <div className="space-y-6 pb-8">
          {[...grouped.entries()].map(([ano, group]) => (
            <div key={ano}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">{ano > 0 ? ano : 'Sem data'}</h3>
                <span className="text-xs text-muted-foreground">({group.length} {group.length === 1 ? 'alteração' : 'alterações'})</span>
              </div>
              <div className="space-y-2">
                {group.map((item, i) => {
                  const displayNumero = item.artigo.numero;
                  const previewText = item.artigo.caput
                    .replace(/\s*\((?:Redação|Incluído|Revogado|Acrescido|Alterado|Vetado|Vide|Regulamento|Vigência|Promulgação|Renumerado|Transformado|Suprimido|Restabelecido|Ressalvado|Produção de efeito)[^)]*\)/gi, '')
                    .split('\n').filter(l => l.trim())[0] || '';
                  return (
                    <motion.button
                      key={`${item.artigo.id}-${i}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => {
                        setOverlayPanel(null);
                        setOpenFromNovidades(true);
                        setOpenModInfo({
                          tipo: item.tipo,
                          referencia: item.referencia,
                          leiNome: item.leiNome,
                          parteModificada: item.parteModificada,
                          linhasModificadas: item.linhasModificadas,
                        });
                        setOpenArtigo(item.artigo);
                      }}
                      className="w-full text-left rounded-2xl bg-card hover:bg-secondary/60 transition-all group flex overflow-hidden min-h-[82px]"
                    >
                      <div className="w-1.5 bg-primary rounded-l-2xl shrink-0" />
                      <div className="flex-1 min-w-0 p-4">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-display text-[15px] font-bold text-primary-light">{displayNumero}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeColor(item.tipo)}`}>
                            {item.tipo}
                          </span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400">
                            {item.parteModificada}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mb-1 italic">{item.referencia}</p>
                        {previewText && (
                          <p className="text-[13px] leading-relaxed line-clamp-2 text-foreground/80">{previewText}</p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 mt-4 mr-3 transition-colors" />
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      );
    })();

    const radarContent = (
      <RadarLegislacaoContent leiNome={selectedLeiNome} tabelaNome={selectedTabelaNome} navigate={navigate} />
    );

    const overlayLabels: Record<string, { label: string; icon: typeof Star; desc: string }> = {
      fav: { label: 'Favoritos', icon: Star, desc: 'Aqui ficam os artigos que você marcou com estrela. Favoritar facilita o acesso rápido aos dispositivos que você mais consulta.' },
      playlist: { label: 'Playlist', icon: ListMusic, desc: 'Ouça as narrações dos artigos desta lei. Ideal para estudar enquanto faz outras atividades — basta gerar as narrações na tela de Narração.' },
      anotacoes: { label: 'Anotações', icon: StickyNote, desc: 'Veja todas as suas anotações e grifos desta lei em um só lugar. Para criar, abra um artigo e grife um trecho.' },
      novidades: { label: 'Novidades', icon: Sparkles, desc: 'Histórico de alterações legislativas — veja quais artigos foram incluídos, revogados ou modificados, organizados por ano.' },
      radar: { label: 'Radar', icon: Radar, desc: 'Proposições em tramitação no Congresso que podem alterar esta legislação. Acompanhe os projetos de lei em tempo real.' },
    };
    const overlayContents: Record<string, React.ReactNode> = {
      fav: favContent,
      playlist: playlistContent,
      anotacoes: anotacoesContent,
      novidades: novidadesContent,
      radar: radarContent,
    };

    return (
      <div className="min-h-screen bg-background pb-20 lg:pb-0">
        <div className={`mx-auto px-4 sm:px-6 md:px-8 pt-4 space-y-4 ${isDesktop ? 'max-w-7xl' : 'max-w-5xl'}`}>
          {/* Header with back + title */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                if (leis.length <= 1) {
                  navigate('/');
                } else {
                  setSelectedLeiId(null); setOpenArtigo(null); setSearchQuery('');
                }
              }}
              className="flex items-center gap-1 text-foreground/70 hover:text-foreground transition-colors text-xs uppercase tracking-wide"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-semibold">Voltar</span>
            </button>
            <span className="text-foreground/70 text-sm font-medium">{config?.label || 'Legislação'}</span>
          </div>

          {/* Brasão + Lei name — always centered on desktop */}
          <div className="flex flex-col items-center gap-2 pt-2 pb-2">
            <img src={brasaoImg} alt="Brasão da República" loading="eager" decoding="sync" fetchPriority="high" className={`object-contain ${isDesktop ? 'w-16 h-16' : 'w-20 h-20'}`} />
            <div className="text-center mt-1">
              <p className="text-amber-500/80 text-xs font-semibold tracking-wide">Presidência da República</p>
              <p className="text-amber-500/70 text-[11px] font-medium">Casa Civil</p>
              <p className="text-amber-500/60 text-[10px]">Subchefia para Assuntos Jurídicos</p>
              <div className="text-center mt-2">
                <h1 className="font-display text-xl text-foreground font-bold uppercase tracking-wide">
                  {selectedLeiNome}
                </h1>
                <p className="text-muted-foreground text-sm mt-0.5">{selectedLeiDescricao}</p>
                {(() => {
                  const selectedLei = leis.find(l => l.id === selectedLeiId);
                  const planaltoUrl = (selectedLei as any)?.url_planalto;
                  if (!planaltoUrl) return null;
                  return (
                    <a
                      href={planaltoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                    >
                      <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                        <ExternalLink className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span>Ver no Planalto</span>
                      <ChevronRight className="w-3 h-3" />
                    </a>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="w-12 h-0.5 bg-primary/40 rounded-full mx-auto" />

          {/* Tabs */}
          {!loadingArtigos && (
            <div className={`mx-auto flex flex-col gap-3 ${isDesktop ? 'max-w-xl w-full' : 'w-full'}`}>
              {/* Circle buttons row */}
              <div className="flex items-center justify-evenly w-full">
                {[
                  { key: 'fav' as const, icon: Star, label: 'Favoritos', color: 'bg-amber-500/50 text-white', activeColor: 'bg-amber-400 text-white ring-2 ring-amber-300 shadow-lg shadow-amber-500/30' },
                  { key: 'playlist' as const, icon: ListMusic, label: 'Playlist', color: 'bg-sky-500/50 text-white', activeColor: 'bg-sky-400 text-white ring-2 ring-sky-300 shadow-lg shadow-sky-500/30' },
                  { key: 'anotacoes' as const, icon: StickyNote, label: 'Anotações', color: 'bg-emerald-500/50 text-white', activeColor: 'bg-emerald-400 text-white ring-2 ring-emerald-300 shadow-lg shadow-emerald-500/30' },
                  { key: 'novidades' as const, icon: Sparkles, label: 'Novidades', color: 'bg-purple-500/50 text-white', activeColor: 'bg-purple-400 text-white ring-2 ring-purple-300 shadow-lg shadow-purple-500/30' },
                  { key: 'radar' as const, icon: Radar, label: 'Radar', color: 'bg-rose-500/50 text-white', activeColor: 'bg-rose-400 text-white ring-2 ring-rose-300 shadow-lg shadow-rose-500/30' },
                  { key: 'grafos' as const, icon: GitBranch, label: 'Grafos', color: 'bg-cyan-500/50 text-white', activeColor: 'bg-cyan-400 text-white ring-2 ring-cyan-300 shadow-lg shadow-cyan-500/30' },
                ].map((tab, i) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      if (tab.key === 'grafos') {
                        setShowGrafo(true);
                      } else {
                        setOverlayPanel(tab.key);
                      }
                    }}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div className={`relative w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all overflow-hidden ${
                      (tab.key === 'grafos' ? showGrafo : overlayPanel === tab.key) ? tab.activeColor : tab.color
                    }`}>
                      <tab.icon className="w-6 h-6 md:w-7 md:h-7 relative z-10" />
                      <div
                        className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent via-white/[0.25] to-transparent skew-x-[-20deg]"
                        style={{ animation: 'shinePratique 2.5s ease-in-out infinite', animationDelay: `${i * 0.3}s` }}
                      />
                    </div>
                    <span className="text-[11px] md:text-xs font-medium text-foreground">{tab.label}</span>
                  </button>
                ))}
              </div>
              {/* Artigos / Capítulos row */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'art' as const, icon: FileText, label: 'Artigos' },
                  { key: 'cap' as const, icon: BookOpen, label: 'Capítulos' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 md:py-3 rounded-full text-xs md:text-sm font-semibold transition-all ${
                      activeTab === tab.key
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-foreground hover:text-foreground'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search bar — below tabs */}
          <div ref={searchBarRef} className={`flex items-center gap-2 mx-auto ${isDesktop ? 'max-w-xl w-full' : 'w-full'}`}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar artigo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                inputMode="numeric"
                className="pl-10 bg-secondary border-border rounded-xl"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={!searchQuery.trim()}
              className="rounded-xl px-5 h-10 font-semibold text-sm transition-all bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Pesquisar
            </Button>
          </div>

          {/* Sticky floating search bar */}
          <AnimatePresence>
            {stickySearch && (
              <motion.div
                initial={{ y: -60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -60, opacity: 0 }}
                transition={{ type: 'spring', damping: 24, stiffness: 300 }}
                className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-2.5 shadow-lg"
              >
                <div className={`flex items-center gap-2 mx-auto ${isDesktop ? 'max-w-xl w-full' : 'w-full'}`}>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar artigo..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      inputMode="numeric"
                      className="pl-10 bg-secondary border-border rounded-xl h-9"
                    />
                  </div>
                  <Button
                    onClick={handleSearch}
                    disabled={!searchQuery.trim()}
                    size="sm"
                    className="rounded-xl px-4 font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Pesquisar
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Desktop: two-column layout */}
          {isDesktop ? (
            <div className="flex gap-6">
              {/* Chapters sidebar */}
              <div className="w-[260px] shrink-0 sticky top-4 self-start max-h-[calc(100vh-8rem)] overflow-y-auto rounded-xl bg-card border border-border p-3">
                {chaptersPanel}
              </div>
              {/* Articles */}
              <div className="flex-1 min-w-0">
                {articlesContent}
              </div>
            </div>
          ) : (
            articlesContent
          )}
        </div>

        {/* Scroll to top button */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="fixed bottom-24 right-4 z-40 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
              <ArrowUp className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>

        <ArtigoBottomSheet
          artigo={openArtigo}
          onClose={() => { setOpenArtigo(null); setOpenFromNovidades(false); setOpenModInfo(null); }}
          forceShowRedacao={openFromNovidades}
          modificationInfo={openModInfo}
          isFavorito={openArtigo ? favoritos.has(openArtigo.id) : false}
          onToggleFavorito={() => openArtigo && toggleFavorito(openArtigo.id)}
          showNomenJuris={selectedLeiId === 'cp' || selectedLeiId === 'cpm'}
          tabelaNome={selectedTabelaNome || undefined}
        />
        {selectedTabelaNome && (
          <GrafoOverlay
            open={showGrafo}
            onClose={() => setShowGrafo(false)}
            tabelaNome={selectedTabelaNome}
            leiNome={selectedLeiNome || undefined}
          />
        )}

        {/* Slide-in overlay panels for Favoritos, Playlist, Anotações, Novidades, Radar */}
        <AnimatePresence>
          {overlayPanel && (
            <motion.div
              key={overlayPanel}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-0 z-[60] bg-background flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 shrink-0">
                <button onClick={() => setOverlayPanel(null)} className="w-9 h-9 rounded-full bg-secondary/60 flex items-center justify-center">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                  <h1 className="font-display text-base font-bold text-foreground truncate">{overlayLabels[overlayPanel]?.label}</h1>
                  <p className="text-xs text-muted-foreground truncate">{selectedLeiNome}</p>
                </div>
              </div>
              {/* Explanatory banner */}
              <div className="mx-4 mt-3 p-3 rounded-xl bg-primary/10 border border-primary/20 flex gap-3 items-start">
                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-foreground/80 leading-relaxed">
                  {overlayLabels[overlayPanel]?.desc}
                </p>
              </div>
              {/* Live monitoring pulse for Novidades & Radar */}
              {(overlayPanel === 'novidades' || overlayPanel === 'radar') && (
                <div className="mx-4 mt-2 flex items-center gap-2.5 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <p className="text-[11px] text-emerald-400 font-medium">
                    Monitoramento em tempo real
                  </p>
                  <div className="flex-1 h-[1px] relative overflow-hidden rounded-full bg-emerald-500/20">
                    <div className="absolute inset-y-0 w-8 bg-emerald-400/60 rounded-full animate-[liveSlide_2s_ease-in-out_infinite]" />
                  </div>
                </div>
              )}
              {/* Content */}
              <div className="flex-1 overflow-y-auto px-4 pt-4">
                {overlayContents[overlayPanel]}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // View: lista de leis da categoria
  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <div className={`bg-gradient-to-br ${config?.bg || 'from-primary to-primary/80'} px-4 pt-10 pb-6 sm:px-6 md:px-8 relative overflow-hidden`}>
        {/* Background watermark icon */}
        <Icon className="absolute bottom-2 right-4 w-24 h-24 text-white opacity-10 pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao início
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl text-white font-bold">{config?.label || tipo}</h1>
              <p className="text-white/70 text-sm">{filteredLeis.length} legislação(ões)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={`Buscar em ${config?.label || 'legislação'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary border-border"
          />
        </div>

        {loadingLeis ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-muted-foreground text-sm">Carregando legislações...</p>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {filteredLeis.map((lei, i) => (
              <motion.button
                key={lei.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => {
                  setSelectedLeiId(lei.id);
                  setSelectedLeiNome(lei.nome);
                  setSelectedLeiDescricao(lei.descricao);
                  setSelectedTabelaNome((lei as any).tabela_nome || null);
                  setSearchQuery('');
                }}
                className="w-full text-left rounded-xl p-4 h-20 transition-all group flex items-center overflow-hidden relative"
                style={{
                  borderLeft: `3px solid ${(lei as any).iconColor || 'hsl(var(--primary))'}`,
                  background: `linear-gradient(135deg, ${(lei as any).iconColor || 'hsl(var(--primary))'}12 0%, ${(lei as any).iconColor || 'hsl(var(--primary))'}06 100%)`,
                }}
              >
                {/* Background watermark icon */}
                {(() => {
                  const WatermarkIcon = LEI_ICON_MAP[lei.sigla] || BookOpen;
                  const iconColor = (lei as any).iconColor || 'hsl(var(--primary))';
                  return (
                    <WatermarkIcon
                      className="absolute right-3 bottom-1 w-14 h-14 pointer-events-none"
                      style={{ color: iconColor, opacity: 0.1 }}
                    />
                  );
                })()}
                <div className="flex items-center justify-between w-full relative z-10">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${(lei as any).iconColor || 'hsl(var(--primary))'}20` }}
                    >
                      {(() => {
                        const iconColor = (lei as any).iconColor || 'hsl(var(--primary))';
                        const IconComp = LEI_ICON_MAP[lei.sigla] || BookOpen;
                        return <IconComp className="w-5 h-5" style={{ color: iconColor }} />;
                      })()}
                    </div>
                    <div>
                      <h3 className="font-display text-lg text-foreground group-hover:text-primary transition-colors leading-tight">
                        {lei.sigla}
                      </h3>
                      <p className="text-muted-foreground text-sm">{lei.nome}</p>
                      <p className="text-muted-foreground/60 text-[10px] font-semibold tracking-wider mt-0.5">2026</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </div>
              </motion.button>
            ))}
            {filteredLeis.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Nenhuma legislação encontrada.</p>
            )}
          </div>
        )}
      </div>
    </div>
    );
  };

export default CategoriaLegislacao;
