import { useState, useEffect, useMemo, useCallback } from 'react';
import { directImg } from '@/lib/cdnImg';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Library, ChevronRight, Search, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import LivroCard, { type LivroUnificado } from '@/components/biblioteca/LivroCard';
import LivroDetailSheet, { type ReadMode } from '@/components/biblioteca/LivroDetailSheet';
import LeitorWebView from '@/components/biblioteca/LeitorWebView';
import LeitorEbook from '@/components/estudar/LeitorEbook';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

import capaEstudos from '@/assets/biblioteca/capa-estudos.jpg';
import capaClassicos from '@/assets/biblioteca/capa-classicos.jpg';
import capaLideranca from '@/assets/biblioteca/capa-lideranca.jpg';
import capaForaDaToga from '@/assets/biblioteca/capa-fora-da-toga.jpg';

import areaAdministrativo from '@/assets/biblioteca/areas/direito-administrativo.jpg';
import areaAmbiental from '@/assets/biblioteca/areas/direito-ambiental.jpg';
import areaCivil from '@/assets/biblioteca/areas/direito-civil.jpg';
import areaConcorrencial from '@/assets/biblioteca/areas/direito-concorrencial.jpg';
import areaConstitucional from '@/assets/biblioteca/areas/direito-constitucional.jpg';
import areaDesportivo from '@/assets/biblioteca/areas/direito-desportivo.jpg';
import areaTrabalho from '@/assets/biblioteca/areas/direito-do-trabalho.jpg';
import areaEmpresarial from '@/assets/biblioteca/areas/direito-empresarial.jpg';
import areaFinanceiro from '@/assets/biblioteca/areas/direito-financeiro.jpg';
import areaIntPrivado from '@/assets/biblioteca/areas/direito-internacional-privado.jpg';
import areaIntPublico from '@/assets/biblioteca/areas/direito-internacional-publico.jpg';
import areaPenal from '@/assets/biblioteca/areas/direito-penal.jpg';
import areaPrevidenciario from '@/assets/biblioteca/areas/direito-previdenciario.jpg';
import areaProcCivil from '@/assets/biblioteca/areas/direito-processual-civil.jpg';
import areaProcTrabalho from '@/assets/biblioteca/areas/direito-processual-do-trabalho.jpg';
import areaProcPenal from '@/assets/biblioteca/areas/direito-processual-penal.jpg';
import areaTributario from '@/assets/biblioteca/areas/direito-tributario.jpg';
import areaUrbanistico from '@/assets/biblioteca/areas/direito-urbanistico.jpg';
import areaDireitosHumanos from '@/assets/biblioteca/areas/direitos-humanos.jpg';
import areaFormacao from '@/assets/biblioteca/areas/formacao-complementar.jpg';
import areaLeiPenal from '@/assets/biblioteca/areas/lei-penal-especial.jpg';
import areaPesquisa from '@/assets/biblioteca/areas/pesquisa-cientifica.jpg';
import areaPoliticas from '@/assets/biblioteca/areas/politicas-publicas.jpg';
import areaPortugues from '@/assets/biblioteca/areas/portugues.jpg';
import areaPratica from '@/assets/biblioteca/areas/pratica-profissional.jpg';
import areaOab from '@/assets/biblioteca/areas/revisao-oab.jpg';
import areaTeoria from '@/assets/biblioteca/areas/teoria-filosofia-direito.jpg';

const AREA_IMAGES: Record<string, string> = {
  'Direito Administrativo': areaAdministrativo,
  'Direito Ambiental': areaAmbiental,
  'Direito Civil': areaCivil,
  'Direito Concorrencial': areaConcorrencial,
  'Direito Constitucional': areaConstitucional,
  'Direito Desportivo': areaDesportivo,
  'Direito Do Trabalho': areaTrabalho,
  'Direito Empresarial': areaEmpresarial,
  'Direito Financeiro': areaFinanceiro,
  'Direito Internacional Privado': areaIntPrivado,
  'Direito Internacional Público': areaIntPublico,
  'Direito Penal': areaPenal,
  'Direito Previndenciario': areaPrevidenciario,
  'Direito Processual Civil': areaProcCivil,
  'Direito Processual Do Trabalho': areaProcTrabalho,
  'Direito Processual Penal': areaProcPenal,
  'Direito Tributario': areaTributario,
  'Direito Urbanistico': areaUrbanistico,
  'Direitos Humanos': areaDireitosHumanos,
  'Formação Complementar': areaFormacao,
  'Lei Penal Especial': areaLeiPenal,
  'Pesquisa Científica': areaPesquisa,
  'Politicas Publicas': areaPoliticas,
  'Portugues': areaPortugues,
  'Pratica Profissional': areaPratica,
  'Revisão Oab': areaOab,
  'Teoria E Filosofia Do Direito': areaTeoria,
};

type View = 'menu' | 'category' | 'area-detail';
type FilterTab = 'todos' | 'favoritos';

const CATEGORIES = [
  { id: 'estudos', label: 'Estudos', desc: 'Materiais organizados por área do Direito', img: capaEstudos },
  { id: 'classicos', label: 'Clássicos', desc: 'Obras fundamentais do Direito', img: capaClassicos },
  { id: 'lideranca', label: 'Liderança', desc: 'Desenvolvimento pessoal e profissional', img: capaLideranca },
  { id: 'fora-da-toga', label: 'Fora da Toga', desc: 'Leituras complementares', img: capaForaDaToga },
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

const Biblioteca = () => {
  const navigate = useNavigate();
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

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('todos');
  const [favoriteKeys, setFavoriteKeys] = useState<Set<string>>(new Set());

  // Load favorites
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

  const toggleFavorite = useCallback(async (livro: LivroUnificado, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { toast.error('Faça login para favoritar'); return; }
    const key = makeLivroKey(livro);
    const isFav = favoriteKeys.has(key);

    // Optimistic update
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

  // Preload cover images in batches
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

  // Filtered areas (for search in category view)
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

  // Filtered livros for area-detail view
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

  // Filtered livros for single-area categories (classicos, lideranca, fora-da-toga)
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

  // Search bar component
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

  // Filter tabs (Todos / Favoritos)
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

  // Livro row with order number + favorite star
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
          {/* Order number badge */}
          <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-sm">
            {index + 1}
          </span>
          {/* Favorite star */}
          <button
            onClick={(e) => toggleFavorite(livro, e)}
            className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm"
          >
            <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-primary text-primary' : 'text-white/70'}`} />
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
        const count = livros.length;
        return (
          <button
            key={cat.id}
            onClick={() => handleSelectCategory(cat.id)}
            className="w-full flex items-stretch rounded-xl bg-card border border-border hover:border-primary/30 transition-all group text-left overflow-hidden relative"
          >
            <div className="w-20 flex-shrink-0 relative overflow-hidden">
              <img src={cat.img} alt={cat.label} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
            </div>
            <div className="flex-1 min-w-0 flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{cat.label}</p>
                <p className="text-xs text-muted-foreground">{cat.desc}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground">{count > 0 ? count : '...'}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>
          </button>
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
          {renderSearchBar('Buscar livro...')}
          {renderFilterTabs()}
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
            {filteredAreas.map((section) => {
              const areaImg = AREA_IMAGES[section.label];
              return (
                <button
                  key={section.label}
                  onClick={() => handleSelectArea(section.label)}
                  className="w-full flex items-stretch rounded-xl bg-card border border-border hover:border-primary/30 transition-all group text-left overflow-hidden relative"
                >
                  <div className="w-20 flex-shrink-0 relative overflow-hidden">
                    {areaImg ? (
                      <img src={areaImg} alt={section.label} width={80} height={100} className="w-full h-full object-cover" decoding="async" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                  </div>
                  <div className="flex-1 min-w-0 flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{section.label}</p>
                      <p className="text-xs text-muted-foreground">{section.items.length} materiais</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </div>
                </button>
              );
            })}
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
      {renderSearchBar('Buscar livro...')}
      {renderFilterTabs()}
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

      <LivroDetailSheet livro={selected} open={detailOpen} onClose={() => setDetailOpen(false)} onRead={handleRead} />

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
