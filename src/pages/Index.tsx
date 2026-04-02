import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHotkeys } from 'react-hotkeys-hook';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Scale, Radar, Brain, GraduationCap, BookOpen, Wrench, Timer, BookOpenText, ScanEye, Sparkles, ArrowRight } from 'lucide-react';
import heroImage from '@/assets/hero-vademecum.jpg';
import vacatioLogo from '@/assets/logo-vacatio.jpeg';
import camaraHero from '@/assets/radar/camara-hero.jpg';
import senadoHero from '@/assets/radar/senado-hero.jpg';
import DesktopNewsSidebar from '@/components/vademecum/DesktopNewsSidebar';
import DesktopHeroBanner from '@/components/vademecum/DesktopHeroBanner';
import DesktopSidebar from '@/components/vademecum/DesktopSidebar';
import RadarTab from '@/components/radar/RadarTab';
import { supabase } from '@/integrations/supabase/client';
import AtualizacaoTab from '@/components/vademecum/AtualizacaoTab';
import BottomNav from '@/components/vademecum/BottomNav';
import AtalhosCarousel from '@/components/vademecum/AtalhosCarousel';
import CategoriasGrid from '@/components/vademecum/CategoriasGrid';
import SideMenu from '@/components/vademecum/SideMenu';
import SearchBar from '@/components/vademecum/SearchBar';
import SearchOverlay from '@/components/vademecum/SearchOverlay';
import AssistenteOverlay from '@/components/vademecum/AssistenteOverlay';
import StudyTimer from '@/components/vademecum/StudyTimer';
import HeroCarousel from '@/components/vademecum/HeroCarousel';
import { useIsDesktop } from '@/hooks/use-desktop';
import { prefetchAllArtigos } from '@/services/legislacaoService';
import { prefetchResenha, getLatestDayCount, getResenhaCache } from '@/services/atualizacaoService';
import { prefetchNoticias } from '@/services/noticiasService';

const HERO_CONFIG: Record<string, { image: string; title: string }> = {
  radar: { image: camaraHero, title: 'Radar Legislativo' },
  legislacao: { image: heroImage, title: 'Legislação' },
  noticias: { image: senadoHero, title: 'Aprender' },
};

type Tab = 'legislacao' | 'radar' | 'noticias' | 'estudar' | 'ferramentas';

const TABS: { id: Tab; label: string; icon: typeof Scale; subtitle: string }[] = [
  { id: 'radar', label: 'Radar Legislativo', icon: Radar, subtitle: 'Monitoramento' },
  { id: 'legislacao', label: 'Legislação', icon: Scale, subtitle: 'Leis e Códigos' },
  { id: 'noticias', label: 'Aprender', icon: Brain, subtitle: 'Estude e aprenda' },
];

const DESKTOP_TABS: { id: Tab; label: string; icon: typeof Scale }[] = [
  { id: 'legislacao', label: 'Legislação', icon: Scale },
  { id: 'noticias', label: 'Aprender', icon: BookOpen },
  { id: 'estudar', label: 'Estudar', icon: GraduationCap },
  { id: 'ferramentas', label: 'Ferramentas', icon: Wrench },
  { id: 'radar', label: 'Radar Legislativo', icon: Radar },
];

const DESKTOP_TOOLS = [
  { id: 'pomodoro', label: 'Pomodoro', desc: 'Timer de estudo com técnica Pomodoro', icon: Timer, color: 'from-primary to-primary/70' },
  { id: 'dicionario', label: 'Dicionário Jurídico', desc: 'Consulte termos e conceitos do Direito', icon: BookOpenText, color: 'from-primary/80 to-primary/50' },
  { id: 'radar360', label: 'Radar 360', desc: 'Alterações recentes e projetos de lei', icon: ScanEye, color: 'from-primary/90 to-primary/60' },
  { id: 'assistente', label: 'Assistente Evelyn', desc: 'IA jurídica para tirar dúvidas', icon: Sparkles, color: 'from-primary/70 to-primary' },
  { id: 'estudar', label: 'Estudar', desc: 'Questões e flashcards por IA', icon: GraduationCap, color: 'from-primary to-primary/80' },
];

const ATALHO_LEI_MAP: Record<string, { tipo: string; leiId: string; nome: string; descricao: string; tabela_nome: string }> = {
  cp: { tipo: 'codigo', leiId: 'cp', nome: 'Código Penal', descricao: 'Decreto-Lei nº 2.848/1940', tabela_nome: 'CP_CODIGO_PENAL' },
  cc: { tipo: 'codigo', leiId: 'cc', nome: 'Código Civil', descricao: 'Lei nº 10.406/2002', tabela_nome: 'CC_CODIGO_CIVIL' },
  cf88: { tipo: 'constituicao', leiId: 'cf88', nome: 'Constituição Federal', descricao: 'CF/1988', tabela_nome: 'CF88_CONSTITUICAO_FEDERAL' },
  cpc: { tipo: 'codigo', leiId: 'cpc', nome: 'Código de Processo Civil', descricao: 'Lei nº 13.105/2015', tabela_nome: 'CPC_CODIGO_PROCESSO_CIVIL' },
  cpp: { tipo: 'codigo', leiId: 'cpp', nome: 'Código de Processo Penal', descricao: 'Decreto-Lei nº 3.689/1941', tabela_nome: 'CPP_CODIGO_PROCESSO_PENAL' },
  clt: { tipo: 'lei-ordinaria', leiId: 'clt', nome: 'CLT', descricao: 'Decreto-Lei nº 5.452/1943', tabela_nome: 'CLT_CONSOLIDACAO_LEIS_TRABALHO' },
  cdc: { tipo: 'codigo', leiId: 'cdc', nome: 'Código de Defesa do Consumidor', descricao: 'Lei nº 8.078/1990', tabela_nome: 'CDC_CODIGO_DEFESA_CONSUMIDOR' },
  eca: { tipo: 'estatuto', leiId: 'eca', nome: 'Estatuto da Criança e do Adolescente', descricao: 'Lei nº 8.069/1990', tabela_nome: 'ECA_ESTATUTO_CRIANCA_ADOLESCENTE' },
  ctn: { tipo: 'codigo', leiId: 'ctn', nome: 'Código Tributário Nacional', descricao: 'Lei nº 5.172/1966', tabela_nome: 'CTN_CODIGO_TRIBUTARIO_NACIONAL' },
};

const Index = () => {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [activeTab, setActiveTab] = useState<Tab>('legislacao');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [assistenteOpen, setAssistenteOpen] = useState(false);
  const [personalizarOpen, setPersonalizarOpen] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);
  const [typingHint, setTypingHint] = useState('');
  const [radarBadge, setRadarBadge] = useState(0);
  const RADAR_SEEN_KEY = 'radar:lastSeenAt';

  // Fetch today's PL count for radar badge (only unseen)
  useEffect(() => {
    const today = new Date();
    const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const lastSeen = Number(localStorage.getItem(RADAR_SEEN_KEY) || 0);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    // If user already visited radar today, no badge
    if (lastSeen >= todayStart) {
      setRadarBadge(0);
      return;
    }

    supabase
      .from('radar_proposicoes')
      .select('id_externo', { count: 'exact', head: true })
      .eq('sigla_tipo', 'PL')
      .filter('dados_json->>dataApresentacao', 'like', `${dateKey}%`)
      .then(({ count }) => { if (count) setRadarBadge(count); });
  }, []);
  const contentRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcuts
  useHotkeys('mod+k', (e) => { e.preventDefault(); setSearchOpen(true); }, { enableOnFormTags: true });
  useHotkeys('escape', () => { setSearchOpen(false); setAssistenteOpen(false); setTimerOpen(false); });

  // Typing animation for search placeholder
  useEffect(() => {
    const hints = ['Buscar lei...', 'Ler artigo...', 'Consultar código...', 'Pesquisar jurisprudência...'];
    let hintIndex = 0;
    let charIndex = 0;
    let direction = 1; // 1 = typing, -1 = erasing
    let pauseCounter = 0;

    const interval = setInterval(() => {
      if (pauseCounter > 0) { pauseCounter--; return; }
      const current = hints[hintIndex];
      if (direction === 1) {
        charIndex++;
        setTypingHint(current.slice(0, charIndex));
        if (charIndex === current.length) { direction = -1; pauseCounter = 15; }
      } else {
        charIndex--;
        setTypingHint(current.slice(0, charIndex));
        if (charIndex === 0) { direction = 1; hintIndex = (hintIndex + 1) % hints.length; pauseCounter = 5; }
      }
    }, 80);
    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
    [vacatioLogo, ...Object.values(HERO_CONFIG).map(c => c.image)].forEach(src => {
      const img = new Image();
      img.src = src;
    });
    prefetchAllArtigos(4);
    prefetchResenha();
    prefetchNoticias();
  }, []);

  const handleAtalhoSelect = (id: string) => {
    if (id === 'noticias') { navigate('/noticias'); return; }
    const lei = ATALHO_LEI_MAP[id];
    if (lei) {
      navigate(`/legislacao/${lei.tipo}`, { state: { autoSelectLei: lei } });
    }
  };

  const handleSearchSelectLei = (lei: { tipo: string; leiId: string; nome: string; descricao: string; tabela_nome: string; artigoNumero?: string }) => {
    navigate(`/legislacao/${lei.tipo}`, { state: { autoSelectLei: lei, artigoNumero: lei.artigoNumero } });
  };

  // Desktop layout
  if (isDesktop) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Full-width hero banner */}
        <DesktopHeroBanner />

        <div className="flex flex-1 min-h-0">
        <DesktopSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Main content area */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          {/* Top Tab Bar */}
          <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border">
            <div className="flex items-center gap-1 px-8 h-12">
              {DESKTOP_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (tab.id === 'radar') {
                        localStorage.setItem(RADAR_SEEN_KEY, String(Date.now()));
                        setRadarBadge(0);
                      }
                    }}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body font-medium transition-colors ${
                      isActive
                        ? 'text-primary bg-primary/10'
                        : 'text-foreground/60 hover:text-foreground hover:bg-secondary/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {tab.id === 'radar' && radarBadge > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                        {radarBadge}
                      </span>
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="desktop-tab-indicator"
                        className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary rounded-full"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28, mass: 0.8 }}
              >
                {activeTab === 'legislacao' && (
                  <>
                    <motion.div className="mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02, type: 'spring', stiffness: 260, damping: 24 }}>
                      <div
                        className="relative flex items-center h-11 cursor-pointer"
                        onClick={() => setSearchOpen(true)}
                      >
                        <div className="absolute left-0 z-10 w-11 h-11 rounded-full border-2 border-primary/40 overflow-hidden shadow-md shrink-0">
                          <img src={vacatioLogo} alt="Vacatio" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 flex items-center h-10 ml-8 pl-6 pr-11 rounded-full bg-secondary/80 border border-border/60 shadow-sm">
                          <span className="text-muted-foreground text-sm font-body truncate">
                            {typingHint}<span className="animate-pulse">|</span>
                          </span>
                        </div>
                        <button className="absolute right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md">
                          <Search className="w-4 h-4 text-primary-foreground" />
                        </button>
                      </div>
                    </motion.div>
                    <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, type: 'spring', stiffness: 260, damping: 24 }}>
                      <AtalhosCarousel onSelect={handleAtalhoSelect} onPersonalizarOpen={setPersonalizarOpen} />
                    </motion.div>
                    <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 24 }}>
                      <CategoriasGrid onSelect={(tipo) => { setCategoriaFiltro(tipo); setActiveTab('legislacao'); }} />
                    </motion.div>
                  </>
                )}
                {activeTab === 'radar' && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, type: 'spring', stiffness: 260, damping: 24 }}>
                    <RadarTab searchQuery={searchQuery} />
                  </motion.div>
                )}
                {activeTab === 'noticias' && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, type: 'spring', stiffness: 260, damping: 24 }}>
                    <AtualizacaoTab searchQuery={searchQuery} />
                  </motion.div>
                )}
                {activeTab === 'estudar' && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, type: 'spring', stiffness: 260, damping: 24 }}>
                    <div className="text-center py-16">
                      <GraduationCap className="w-12 h-12 text-primary mx-auto mb-4" />
                      <h2 className="font-display text-2xl text-foreground mb-2">Estudar</h2>
                      <p className="text-muted-foreground font-body mb-6">Quiz, Flashcards, Mapas Mentais e mais</p>
                      <button
                        onClick={() => navigate('/estudar')}
                        className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                      >
                        Acessar Ferramentas de Estudo
                      </button>
                    </div>
                  </motion.div>
                )}
                {activeTab === 'ferramentas' && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, type: 'spring', stiffness: 260, damping: 24 }}>
                    <h2 className="font-display text-xl text-foreground mb-1">Ferramentas</h2>
                    <p className="text-muted-foreground text-sm font-body mb-6">Recursos para potencializar seus estudos</p>
                    <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                      {DESKTOP_TOOLS.map((tool, i) => {
                        const Icon = tool.icon;
                        return (
                          <motion.button
                            key={tool.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                            onClick={() => {
                              if (tool.id === 'pomodoro') setTimerOpen(true);
                              else if (tool.id === 'assistente') setAssistenteOpen(true);
                              else if (tool.id === 'radar360') navigate('/radar-360');
                              else if (tool.id === 'estudar') navigate('/estudar');
                            }}
                            className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all text-center group"
                          >
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center shadow-lg`}>
                              <Icon className="w-7 h-7 text-primary-foreground" />
                            </div>
                            <div>
                              <p className="font-display text-sm font-bold text-foreground group-hover:text-primary transition-colors">{tool.label}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{tool.desc}</p>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* News Sidebar - right side */}
        <DesktopNewsSidebar />

        <SearchOverlay
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          onSelectLei={handleSearchSelectLei}
        />
        </div>
      </div>
    );
  }

  // Mobile/Tablet layout (original)
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Carousel */}
      <HeroCarousel />

      {/* Tabs - hidden on desktop (sidebar handles it) */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === 'radar') {
                      localStorage.setItem(RADAR_SEEN_KEY, String(Date.now()));
                      setRadarBadge(0);
                    }
                  }}
                  className={`flex-1 py-3 flex flex-col items-center gap-1 relative transition-colors ${
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="relative">
                    <Icon className="w-4 h-4" />
                    {tab.id === 'radar' && radarBadge > 0 && (
                      <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center">
                        {radarBadge}
                      </span>
                    )}
                  </div>
                  <span className="font-body text-xs font-semibold">{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main ref={contentRef} className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-2">
        {/* Persistent preloaded logo — never unmounts, keeps decode in memory */}
        <img src={vacatioLogo} alt="" aria-hidden="true" loading="eager" decoding="sync" fetchPriority="high" className="absolute w-0 h-0 opacity-0 pointer-events-none" />
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28, mass: 0.8 }}
          >
            {activeTab === 'legislacao' && (
              <>
                <motion.div className="py-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, type: 'spring', stiffness: 260, damping: 24 }}>
                  <AtalhosCarousel onSelect={handleAtalhoSelect} onPersonalizarOpen={setPersonalizarOpen} />
                </motion.div>
                <motion.div className="py-4 flex justify-center" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 24 }}>
                  <div
                    className="relative flex items-center h-11 cursor-pointer w-[280px] rounded-full bg-primary shadow-md shadow-primary/25 overflow-hidden"
                    onClick={() => { navigate('/radar-360'); localStorage.setItem(RADAR_SEEN_KEY, String(Date.now())); setRadarBadge(0); }}
                  >
                    {/* Shimmer reflection */}
                    <div className="absolute inset-0 pointer-events-none z-10">
                      <div
                        className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg]"
                        style={{ animation: 'shinePratique 3s ease-in-out infinite' }}
                      />
                    </div>
                    {/* Badge de notificação */}
                    {radarBadge > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 z-20 min-w-[20px] h-5 px-1.5 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center shadow-md animate-pulse">
                        {radarBadge}
                      </span>
                    )}
                    {/* Lottie icon dentro da barra */}
                    <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-card border-2 border-primary z-10">
                      <iframe
                        src="https://lottie.host/embed/3b2d7321-76b2-43fb-9eb0-5b564b42750f/D6XzVc9mGe.lottie"
                        className="w-9 h-9 border-0 pointer-events-none scale-125"
                        title="Radar"
                      />
                    </div>
                    <div className="flex-1 flex items-center justify-between pl-3 pr-3 relative z-10">
                      <span className="text-primary-foreground text-[15px] font-display font-semibold tracking-wide italic">
                        Radar de Leis 360°
                      </span>
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                      >
                        <ArrowRight className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
                <motion.div className="pb-4 pt-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, type: 'spring', stiffness: 260, damping: 24 }}>
                  <CategoriasGrid onSelect={(tipo) => { setCategoriaFiltro(tipo); setActiveTab('legislacao'); setTimeout(() => contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100); }} />
                </motion.div>
              </>
            )}
            {activeTab === 'radar' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, type: 'spring', stiffness: 260, damping: 24 }}>
                <RadarTab searchQuery={searchQuery} />
              </motion.div>
            )}
            {activeTab === 'noticias' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, type: 'spring', stiffness: 260, damping: 24 }}>
                <AtualizacaoTab searchQuery={searchQuery} />
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Nav - hidden on radar/noticias(aprender) tabs */}
      {!personalizarOpen && activeTab !== 'radar' && activeTab !== 'noticias' && (
        <BottomNav
          onSearchClick={() => setSearchOpen(true)}
          onAssistenteClick={() => setAssistenteOpen(true)}
          onMenuClick={() => setMenuOpen(true)}
        />
      )}

      {/* Side Menu */}
      <SideMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={(section) => {
          if (section === 'explicacao') {
            setActiveTab('radar');
          } else if (section === 'atualizacao') {
            setActiveTab('noticias');
          } else if (section === 'novidades') {
            // handled by SideMenu navigate
          } else {
            setActiveTab('legislacao');
          }
        }}
      />

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectLei={handleSearchSelectLei}
      />

      <AssistenteOverlay
        open={assistenteOpen}
        onClose={() => setAssistenteOpen(false)}
      />

      <StudyTimer
        open={timerOpen}
        onClose={() => setTimerOpen(false)}
      />
    </div>
  );
};

export default Index;
