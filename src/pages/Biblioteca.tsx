import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Library, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import LivroCard, { type LivroUnificado } from '@/components/biblioteca/LivroCard';
import LivroDetailSheet from '@/components/biblioteca/LivroDetailSheet';
import LeitorWebView from '@/components/biblioteca/LeitorWebView';
import { Skeleton } from '@/components/ui/skeleton';

import capaEstudos from '@/assets/biblioteca/capa-estudos.jpg';
import capaClassicos from '@/assets/biblioteca/capa-classicos.jpg';
import capaLideranca from '@/assets/biblioteca/capa-lideranca.jpg';
import capaForaDaToga from '@/assets/biblioteca/capa-fora-da-toga.jpg';

type View = 'menu' | 'category' | 'area-detail';

const CATEGORIES = [
  { id: 'estudos', label: 'Estudos', desc: 'Materiais organizados por área do Direito', img: capaEstudos },
  { id: 'classicos', label: 'Clássicos', desc: 'Obras fundamentais do Direito', img: capaClassicos },
  { id: 'lideranca', label: 'Liderança', desc: 'Desenvolvimento pessoal e profissional', img: capaLideranca },
  { id: 'fora-da-toga', label: 'Fora da Toga', desc: 'Leituras complementares', img: capaForaDaToga },
];

const Biblioteca = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const load = async () => {
      const [c, l, e, f] = await Promise.all([
        supabase.from('biblioteca_classicos').select('id,livro,autor,imagem,sobre,download,link').order('id'),
        supabase.from('biblioteca_lideranca').select('id,livro,autor,imagem,sobre,download,link').order('id'),
        supabase.from('biblioteca_estudos').select('id,tema,area,capa_livro,sobre,download,link').order('area').order('ordem'),
        supabase.from('biblioteca_fora_da_toga').select('id,livro,autor,capa_livro,sobre,download,link').order('area').order('id'),
      ]);

      if (c.data) setClassicos(c.data.map(r => ({
        id: r.id, titulo: r.livro ?? '', autor: r.autor, sinopse: r.sobre,
        capa: r.imagem, link: r.link, download: r.download, categoria: 'Clássicos',
      })));
      if (l.data) setLideranca(l.data.map(r => ({
        id: r.id, titulo: r.livro ?? '', autor: r.autor, sinopse: r.sobre,
        capa: r.imagem, link: r.link, download: r.download, categoria: 'Liderança',
      })));
      if (e.data) setEstudos(e.data.map(r => ({
        id: r.id, titulo: r.tema ?? '', autor: null, sinopse: r.sobre,
        capa: r.capa_livro, link: r.link, download: r.download, categoria: 'Estudos', area: r.area,
      })));
      if (f.data) setForaDaToga(f.data.map(r => ({
        id: r.id, titulo: r.livro ?? '', autor: r.autor, sinopse: r.sobre,
        capa: r.capa_livro, link: r.link, download: r.download, categoria: 'Fora da Toga',
      })));
      setLoading(false);
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

  const handleSelectCategory = (catId: string) => {
    setActiveCategory(catId);
    setView('category');
  };

  const handleSelectArea = (area: string) => {
    setActiveArea(area);
    setView('area-detail');
  };

  const handleBack = () => {
    if (view === 'area-detail') { setView('category'); setActiveArea(''); }
    else if (view === 'category') { setView('menu'); setActiveCategory(''); }
    else navigate(-1);
  };

  const handleSelect = (livro: LivroUnificado) => {
    setSelected(livro);
    setDetailOpen(true);
  };

  const handleRead = (livro: LivroUnificado) => {
    if (!livro.link) return;
    setDetailOpen(false);
    setReaderTitle(livro.titulo);
    setReaderUrl(livro.link);
  };

  const catMeta = CATEGORIES.find(c => c.id === activeCategory);
  const areaLivros = areasByCategory.find(a => a.label === activeArea)?.items || [];

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

  const renderMenu = () => (
    <motion.div key="menu" initial={false} animate={{ opacity: 1 }} className="space-y-3">
      {loading ? (
        Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
      ) : (
        CATEGORIES.map((cat) => {
          const livros = getLivros(cat.id);
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
                  <span className="text-xs text-muted-foreground">{livros.length}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </button>
          );
        })
      )}
    </motion.div>
  );

  const renderCategory = () => (
    <motion.div
      key="category"
      variants={slideVariants}
      initial="enter"
      animate="center"
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="space-y-6"
    >
      {areasByCategory.length <= 1 ? (
        // No sub-areas — show as grid
        <div className="grid grid-cols-3 gap-3">
          {areasByCategory[0]?.items.map((livro) => (
            <LivroCard key={`${livro.categoria}-${livro.id}`} livro={livro} onClick={() => handleSelect(livro)} />
          ))}
        </div>
      ) : (
        // Has sub-areas — show carousels
        areasByCategory.map((section) => (
          <div key={section.label}>
            <button
              onClick={() => handleSelectArea(section.label)}
              className="flex items-center gap-1 mb-2 group"
            >
              <h2 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                {section.label}
              </h2>
              <span className="text-[10px] text-muted-foreground ml-1">({section.items.length})</span>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide">
              {section.items.map((livro) => (
                <LivroCard key={`${livro.categoria}-${livro.id}`} livro={livro} onClick={() => handleSelect(livro)} />
              ))}
            </div>
          </div>
        ))
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
    >
      <div className="grid grid-cols-3 gap-3">
        {areaLivros.map((livro) => (
          <LivroCard key={`${livro.categoria}-${livro.id}`} livro={livro} onClick={() => handleSelect(livro)} />
        ))}
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
    </>
  );
};

export default Biblioteca;
