import { useState, useEffect, useMemo, useCallback } from 'react';
import { directImg } from '@/lib/cdnImg';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Library, ChevronRight, Search, Star, BookOpen, Crown, Coffee, GraduationCap, Landmark, TreePine, Users, ShoppingCart, Scale, Dribbble, Briefcase, Building2, Banknote, Globe, Globe2, Siren, HeartPulse, Gavel, Hammer, FileText, ScrollText, UserCheck, FlaskConical, Vote, Languages, Pen, Award, Brain, Receipt } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import PremiumGate from '@/components/PremiumGate';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import LivroCard, { type LivroUnificado } from '@/components/biblioteca/LivroCard';
import LivroDetailSheet, { type ReadMode } from '@/components/biblioteca/LivroDetailSheet';
import LeitorWebView from '@/components/biblioteca/LeitorWebView';
import LeitorEbook from '@/components/estudar/LeitorEbook';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

import type { LucideIcon } from 'lucide-react';

const AREA_ICONS: Record<string, LucideIcon> = {
  'Direito Administrativo': Landmark,
  'Direito Ambiental': TreePine,
  'Direito Civil': Users,
  'Direito Concorrencial': ShoppingCart,
  'Direito Constitucional': Scale,
  'Direito Desportivo': Dribbble,
  'Direito Do Trabalho': Briefcase,
  'Direito Empresarial': Building2,
  'Direito Financeiro': Banknote,
  'Direito Internacional Privado': Globe,
  'Direito Internacional Público': Globe2,
  'Direito Penal': Siren,
  'Direito Previndenciario': HeartPulse,
  'Direito Processual Civil': Gavel,
  'Direito Processual Do Trabalho': Hammer,
  'Direito Processual Penal': FileText,
  'Direito Tributario': Receipt,
  'Direito Urbanistico': Building2,
  'Direitos Humanos': UserCheck,
  'Formação Complementar': GraduationCap,
  'Lei Penal Especial': ScrollText,
  'Pesquisa Científica': FlaskConical,
  'Politicas Publicas': Vote,
  'Portugues': Languages,
  'Pratica Profissional': Pen,
  'Revisão Oab': Award,
  'Teoria E Filosofia Do Direito': Brain,
};

type View = 'menu' | 'category' | 'area-detail';
type FilterTab = 'todos' | 'favoritos';

const CATEGORIES: { id: string; label: string; desc: string; icon: LucideIcon; gradient: string }[] = [
  { id: 'estudos', label: 'Estudos', icon: GraduationCap, desc: 'Materiais organizados por área do Direito', gradient: 'from-emerald-600 to-emerald-800' },
  { id: 'classicos', label: 'Clássicos', icon: BookOpen, desc: 'Obras fundamentais do Direito', gradient: 'from-amber-600 to-amber-800' },
  { id: 'lideranca', label: 'Liderança', icon: Crown, desc: 'Desenvolvimento pessoal e profissional', gradient: 'from-violet-600 to-violet-800' },
  { id: 'fora-da-toga', label: 'Fora da Toga', icon: Coffee, desc: 'Leituras complementares', gradient: 'from-rose-600 to-rose-800' },
];

const AREA_COLORS = [
  'from-emerald-600 to-emerald-800',
  'from-sky-600 to-sky-800',
  'from-amber-600 to-amber-800',
  'from-violet-600 to-violet-800',
  'from-rose-600 to-rose-800',
  'from-teal-600 to-teal-800',
  'from-indigo-600 to-indigo-800',
  'from-orange-600 to-orange-800',
  'from-pink-600 to-pink-800',
  'from-cyan-600 to-cyan-800',
];

function isDynamicProcessingStatus(status?: string | null): boolean {
  return !!status && (
    status === 'processing' ||
    status === 'ocr' ||
    status === 'structuring' ||
    status.startsWith('cleaning:')
  );
}

function makeLivroKey(livro: LivroUnificado): string {
  return `${livro.categoria}-${livro.id}`;
}

const CategoryIconCard = ({ icon: Icon, label, desc, count, gradient, onClick }: { icon: LucideIcon; label: string; desc: string; count: number; gradient: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="w-full flex items-stretch rounded-xl bg-card border border-border hover:border-white/20 transition-all group text-left overflow-hidden relative h-[72px]"
  >
    <div className={`w-20 flex-shrink-0 relative overflow-hidden bg-gradient-to-br ${gradient} flex items-center justify-center`}>
      <Icon className="w-8 h-8 text-white/90" strokeWidth={1.5} />
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ animation: 'shinePratique 3s ease-in-out infinite' }}
      >
        <div className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]" style={{ animation: 'shinePratique 3s ease-in-out infinite' }} />
      </div>
    </div>
    <div className="flex-1 min-w-0 flex items-center gap-3 px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-muted-foreground">{count > 0 ? count : '...'}</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
      </div>
    </div>
  </button>
);

const AreaIconCard = ({ label, count, index, onClick }: { label: string; count: number; index: number; onClick: () => void }) => {
  const Icon = AREA_ICONS[label] || BookOpen;
  const gradient = AREA_COLORS[index % AREA_COLORS.length];
  return (
    <button
      onClick={onClick}
      className="w-full flex items-stretch rounded-xl bg-card border border-border hover:border-white/20 transition-all group text-left overflow-hidden relative"
    >
      <div className={`w-20 flex-shrink-0 relative overflow-hidden bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        <Icon className="w-7 h-7 text-white/90" strokeWidth={1.5} />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]" style={{ animation: 'shinePratique 3s ease-in-out infinite', animationDelay: `${index * 0.4}s` }} />
        </div>
      </div>
      <div className="flex-1 min-w-0 flex items-center gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{label}</p>
          <p className="text-xs text-muted-foreground">{count} materiais</p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
      </div>
    </button>
  );
};

const Biblioteca = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [classicos, setClassicos] = useState<LivroUnificado[]>([]);
  const [lideranca, setLideranca] = useState<LivroUnificado[]>([]);
  const [estudos, setEstudos] = useState<LivroUnificado[]>([]);
  const [foraDaToga, setForaDaToga] = useState<LivroUnificado[]>([]);

  const [view, setView] = useState<View>('menu');
  const [activeCategory, setActiveCategory] = useState('');
  const [activeArea, setActiveArea] = useState('');

  const [selected, setSelected] = useState<LivroUnificado | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [readerUrl, setReaderUrl] = useState<string | null>(null);
  const [readerTitle, setReaderTitle] = useState('');
  const [ebookData, setEbookData] = useState<any>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('todos');
  const [favoriteKeys, setFavoriteKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    supabase
      .from('biblioteca_favoritos')
      .select('livro_key')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) setFavoriteKeys(new Set(data.map(d => d.livro_key)));
      });
  }, [user]);

  useEffect(() => {
    const livroId = searchParams.get('livro');
    if (!livroId) return;
    setSearchParams({}, { replace: true });

    (async () => {
      const { data: full } = await supabase
        .from('biblioteca_livros')
        .select('id,titulo,total_paginas,ultima_pagina,conteudo,estrutura_leitura')
        .eq('id', livroId)
        .single();
      if (full) {
        setEbookData(full);
      } else {
        toast.error('Livro não encontrado');
      }
    })();
  }, [searchParams]);

  const toggleFavorite = useCallback(async (livro: LivroUnificado, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { toast.error('Faça login para favoritar'); return; }
    const key = makeLivroKey(livro);
    const isFav = favoriteKeys.has(key);

    setFavoriteKeys(prev => {
      const next = new Set(prev);
      if (isFav) next.delete(key); else next.add(key);
      return next;
    });

    if (isFav) {
      await supabase.from('biblioteca_favoritos').delete().eq('user_id', user.id).eq('livro_key', key);
    } else {
      await supabase.from('biblioteca_favoritos').insert({ user_id: user.id, livro_key: key, categoria: livro.categoria });
    }
  }, [user, favoriteKeys]);

  const preloadCovers = (livros: LivroUnificado[]) => {
    const urls = livros.map(l => l.capa).filter(Boolean) as string[];
    let i = 0;
    const batch = () => {
      const slice = urls.slice(i, i + 10);
      if (slice.length === 0) return;
      slice.forEach(u => { const img = new Image(); img.src = directImg(u, 300); });
      i += 10;
      setTimeout(batch, 100);
    };
    batch();
  };

  useEffect(() => {
    const CACHE_KEY = 'vacatio_biblioteca_cache';
    const TTL = 60 * 60 * 1000;

    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        const hasBrokenRefs = JSON.stringify(cached).includes('.png');
        if (hasBrokenRefs) {
          localStorage.removeItem(CACHE_KEY);
        } else {
          if (cached.classicos) setClassicos(cached.classicos);
          if (cached.lideranca) setLideranca(cached.lideranca);
          if (cached.estudos) setEstudos(cached.estudos);
          if (cached.foraDaToga) setForaDaToga(cached.foraDaToga);
          preloadCovers([...cached.classicos || [], ...cached.lideranca || [], ...cached.estudos || [], ...cached.foraDaToga || []]);
          if (Date.now() - (cached.timestamp || 0) < TTL) return;
        }
      }
    } catch { /* ignore */ }

    const load = async () => {
      const [c, l, e, f] = await Promise.all([
        supabase.from('biblioteca_classicos').select('id,livro,autor,imagem,sobre,download,link').order('id'),
        supabase.from('biblioteca_lideranca').select('id,livro,autor,imagem,sobre,download,link').order('id'),
        supabase.from('biblioteca_estudos').select('id,tema,area,capa_livro,sobre,download,link').order('area').order('ordem'),
        supabase.from('biblioteca_fora_da_toga').select('id,livro,autor,capa_livro,sobre,download,link').order('area').order('id'),
      ]);

      const newClassicos = c.data?.map(r => ({
        id: r.id, titulo: r.livro ?? '', autor: r.autor, sinopse: r.sobre,
        capa: r.imagem, link: r.link, download: r.download, categoria: 'Clássicos',
      })) || [];
      const newLideranca = l.data?.map(r => ({
        id: r.id, titulo: r.livro ?? '', autor: r.autor, sinopse: r.sobre,
        capa: r.imagem, link: r.link, download: r.download, categoria: 'Liderança',
      })) || [];
      const newEstudos = e.data?.map(r => ({
        id: r.id, titulo: r.tema ?? '', autor: null, sinopse: r.sobre,
        capa: r.capa_livro, link: r.link, download: r.download, categoria: 'Estudos', area: r.area,
      })) || [];
      const newForaDaToga = f.data?.map(r => ({
        id: r.id, titulo: r.livro ?? '', autor: r.autor, sinopse: r.sobre,
        capa: r.capa_livro, link: r.link, download: r.download, categoria: 'Fora da Toga',
      })) || [];

      setClassicos(newClassicos);
      setLideranca(newLideranca);
      setEstudos(newEstudos);
      setForaDaToga(newForaDaToga);
      setLoading(false);

      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          classicos: newClassicos, lideranca: newLideranca,
          estudos: newEstudos, foraDaToga: newForaDaToga,
          timestamp: Date.now(),
        }));
      } catch { /* quota exceeded */ }

      preloadCovers([...newClassicos, ...newLideranca, ...newEstudos, ...newForaDaToga]);
    };
    load();
  }, []);

  const getLivros = (catId: string) => {
    switch (catId) {
      case 'estudos': return estudos;
      case 'classicos': return classicos;
      case 'lideranca': return lideranca;
      case 'fora-da-toga': return foraDaToga;
      default: return [];
    }
  };

  const areasByCategory = useMemo(() => {
    const livros = getLivros(activeCategory);
    const map = new Map<string, LivroUnificado[]>();
    livros.forEach(l => {
      const area = l.area || 'Geral';
      if (!map.has(area)) map.set(area, []);
      map.get(area)!.push(l);
    });
    return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
  }, [activeCategory, estudos, classicos, lideranca, foraDaToga]);

  const filteredAreas = useMemo(() => {
    if (!searchQuery.trim()) return areasByCategory;
    const q = searchQuery.toLowerCase();
    return areasByCategory.filter(a => a.label.toLowerCase().includes(q));
  }, [areasByCategory, searchQuery]);

  const handleSelectCategory = (catId: string) => {
    setActiveCategory(catId);
    setSearchQuery('');
    setFilterTab('todos');
    setView('category');
  };

  const handleSelectArea = (area: string) => {
    setActiveArea(area);
    setSearchQuery('');
    setFilterTab('todos');
    setView('area-detail');
  };

  const handleBack = () => {
    setSearchQuery('');
    setFilterTab('todos');
    if (view === 'area-detail') { setView('category'); setActiveArea(''); }
    else if (view === 'category') { setView('menu'); setActiveCategory(''); }
    else navigate(-1);
  };

  const handleSelect = (livro: LivroUnificado) => {
    setSelected(livro);
    setDetailOpen(true);
  };

  const handleRead = async (livro: LivroUnificado, mode: ReadMode) => {
    setDetailOpen(false);

    if (mode === 'fliphtml5') {
      if (!livro.link) return;
      setReaderTitle(livro.titulo);
      setReaderUrl(livro.link);
    } else if (mode === 'vertical') {
      if (!livro.download) return;
      const match = livro.download.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (!match) { toast.error('Link do Drive inválido'); return; }
      const previewUrl = `https://drive.google.com/file/d/${match[1]}/preview`;
      setReaderTitle(livro.titulo);
      setReaderUrl(previewUrl);
    } else if (mode === 'dinamico') {
      const { data } = await supabase
        .from('biblioteca_livros')
        .select('id,status,created_at')
        .ilike('titulo', livro.titulo.trim())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && data.status === 'ready') {
        const { data: full } = await supabase
          .from('biblioteca_livros')
          .select('id,titulo,total_paginas,ultima_pagina,conteudo,estrutura_leitura')
          .eq('id', data.id)
          .single();
        if (full) setEbookData(full);
      } else if (isDynamicProcessingStatus(data?.status)) {
        toast.info('Este livro ainda está sendo formatado...');
      } else {
        toast.info('Iniciando formatação do e-book...');
        try {
          await supabase.functions.invoke('processar-pdf', {
            body: {
              url: livro.download,
              titulo: livro.titulo,
              autor: livro.autor || undefined,
              capa_url: livro.capa || undefined,
            },
          });
          toast.success('Formatação iniciada! Volte em alguns minutos.');
        } catch {
          toast.error('Erro ao iniciar formatação');
        }
      }
    }
  };

  const catMeta = CATEGORIES.find(c => c.id === activeCategory);
  const areaLivros = areasByCategory.find(a => a.label === activeArea)?.items || [];

  const filteredAreaLivros = useMemo(() => {
    let items = areaLivros;
    if (filterTab === 'favoritos') {
      items = items.filter(l => favoriteKeys.has(makeLivroKey(l)));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(l =>
        l.titulo.toLowerCase().includes(q) ||
        (l.autor && l.autor.toLowerCase().includes(q))
      );
    }
    return items;
  }, [areaLivros, filterTab, searchQuery, favoriteKeys]);

  const filteredFlatLivros = useMemo(() => {
    if (areasByCategory.length > 1) return [];
    let items = areasByCategory[0]?.items || [];
    if (filterTab === 'favoritos') {
      items = items.filter(l => favoriteKeys.has(makeLivroKey(l)));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(l =>
        l.titulo.toLowerCase().includes(q) ||
        (l.autor && l.autor.toLowerCase().includes(q))
      );
    }
    return items;
  }, [areasByCategory, filterTab, searchQuery, favoriteKeys]);

  const slideVariants = {
    enter: { x: '100%', opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: '-30%', opacity: 0 },
  };

  const mobileHeader = (
    <div className="relative bg-gradient-to-br from-card to-secondary overflow-hidden px-4 pt-10 pb-8 sm:px-6">
      <Library className="absolute top-5 right-5 w-10 h-10 text-white/15 rotate-12" />
      <div className="relative max-w-2xl mx-auto z-10">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white font-medium transition-all text-sm px-3 py-1.5 rounded-lg mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <h1 className="font-display text-2xl text-white font-bold">
          {view === 'area-detail' ? activeArea : view === 'category' ? (catMeta?.label || 'Biblioteca') : 'Biblioteca de Leitura'}
        </h1>
        <p className="text-white/70 text-sm mt-1">
          {view === 'area-detail' ? `${areaLivros.length} livros` : view === 'category' ? (catMeta?.desc || '') : 'Livros e materiais para estudo'}
        </p>
      </div>
    </div>
  );

  const renderSearchBar = (placeholder: string) => (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={placeholder}
        className="pl-9 h-10 bg-muted border-none text-sm rounded-xl"
      />
    </div>
  );

  const renderFilterTabs = () => (
    <div className="flex gap-2">
      <button
        onClick={() => setFilterTab('todos')}
        className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
          filterTab === 'todos'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        Todos
      </button>
      <button
        onClick={() => setFilterTab('favoritos')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
          filterTab === 'favoritos'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        <Star className="w-3.5 h-3.5" />
        Favoritos
      </button>
    </div>
  );

  const renderLivroRow = (livro: LivroUnificado, index: number) => {
    const capaUrl = livro.capa ? directImg(livro.capa, 300) : '';
    const key = makeLivroKey(livro);
    const isFav = favoriteKeys.has(key);

    return (
      <button
        key={key}
        onClick={() => handleSelect(livro)}
        className="w-full flex items-stretch rounded-xl bg-card border border-border hover:border-primary/30 transition-all group text-left overflow-hidden relative"
      >
        <div className="w-20 flex-shrink-0 relative overflow-hidden">
          {capaUrl ? (
            <img src={capaUrl} alt={livro.titulo} width={80} height={100} className="w-full h-full object-cover" decoding="async" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center p-1">
              <span className="text-[9px] text-muted-foreground text-center line-clamp-3">{livro.titulo}</span>
            </div>
          )}
          <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-sm">
            {index + 1}
          </span>
          <button
            onClick={(e) => toggleFavorite(livro, e)}
            className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm"
          >
            <Star className={`w-3.5 h-3.5 transition-all duration-300 ${isFav ? 'fill-yellow-400 text-yellow-400 scale-125' : 'text-white/70 scale-100'}`} />
          </button>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none" />
        </div>
        <div className="flex-1 min-w-0 flex items-center gap-3 px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm line-clamp-2">{livro.titulo}</p>
            {livro.autor && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{livro.autor}</p>}
            {livro.sinopse && !livro.autor && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{livro.sinopse}</p>}
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
        </div>
      </button>
    );
  };

  const renderMenu = () => (
    <motion.div key="menu" initial={false} animate={{ opacity: 1 }} className="space-y-3">
      {CATEGORIES.map((cat) => {
        const livros = getLivros(cat.id);
        return (
          <CategoryIconCard
            key={cat.id}
            icon={cat.icon}
            label={cat.label}
            desc={cat.desc}
            count={livros.length}
            gradient={cat.gradient}
            onClick={() => handleSelectCategory(cat.id)}
          />
        );
      })}
    </motion.div>
  );

  const renderCategory = () => (
    <motion.div
      key="category"
      variants={slideVariants}
      initial="enter"
      animate="center"
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="space-y-4"
    >
      {areasByCategory.length <= 1 ? (
        <>
          {renderFilterTabs()}
          {renderSearchBar('Buscar livro...')}
          <div className="space-y-3">
            {filteredFlatLivros.map((livro, i) => renderLivroRow(livro, i))}
            {filteredFlatLivros.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">
                {filterTab === 'favoritos' ? 'Nenhum favorito ainda' : 'Nenhum resultado encontrado'}
              </p>
            )}
          </div>
        </>
      ) : (
        <>
          {renderSearchBar('Buscar área do direito...')}
          <div className="space-y-3">
            {filteredAreas.map((section, idx) => (
              <AreaIconCard
                key={section.label}
                label={section.label}
                count={section.items.length}
                index={idx}
                onClick={() => handleSelectArea(section.label)}
              />
            ))}
            {filteredAreas.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">Nenhuma área encontrada</p>
            )}
          </div>
        </>
      )}
    </motion.div>
  );

  const renderAreaDetail = () => (
    <motion.div
      key="area-detail"
      variants={slideVariants}
      initial="enter"
      animate="center"
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="space-y-4"
    >
      {renderFilterTabs()}
      {renderSearchBar('Buscar livro...')}
      <div className="space-y-3">
        {filteredAreaLivros.map((livro, i) => renderLivroRow(livro, i))}
        {filteredAreaLivros.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">
            {filterTab === 'favoritos' ? 'Nenhum favorito ainda' : 'Nenhum resultado encontrado'}
          </p>
        )}
      </div>
    </motion.div>
  );

  return (
    <>
      <DesktopPageLayout
        activeId="ferramentas"
        title={view === 'area-detail' ? activeArea : view === 'category' ? (catMeta?.label || 'Biblioteca') : 'Biblioteca de Leitura'}
        subtitle={view === 'area-detail' ? `${areaLivros.length} livros` : view === 'category' ? (catMeta?.desc || '') : 'Livros e materiais para estudo'}
        mobileHeader={mobileHeader}
      >
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 lg:max-w-none lg:px-0 lg:py-0">
          <AnimatePresence mode="wait">
            {view === 'menu' && renderMenu()}
            {view === 'category' && renderCategory()}
            {view === 'area-detail' && renderAreaDetail()}
          </AnimatePresence>
        </div>
      </DesktopPageLayout>

      <LivroDetailSheet livro={selected} open={detailOpen} onClose={() => setDetailOpen(false)} onRead={handleRead} categoryId={activeCategory} />

      {readerUrl && (
        <LeitorWebView url={readerUrl} titulo={readerTitle} onClose={() => setReaderUrl(null)} />
      )}

      {ebookData && (
        <LeitorEbook livro={ebookData} onBack={() => setEbookData(null)} onUpdateBookmark={() => {}} />
      )}
    </>
  );
};

export default Biblioteca;
