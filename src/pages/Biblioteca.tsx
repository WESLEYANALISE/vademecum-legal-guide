import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Library, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import LivroCard, { type LivroUnificado } from '@/components/biblioteca/LivroCard';
import LivroDetailSheet from '@/components/biblioteca/LivroDetailSheet';
import LeitorWebView from '@/components/biblioteca/LeitorWebView';
import { Skeleton } from '@/components/ui/skeleton';

interface Section {
  label: string;
  livros: LivroUnificado[];
}

const Biblioteca = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [classicos, setClassicos] = useState<LivroUnificado[]>([]);
  const [lideranca, setLideranca] = useState<LivroUnificado[]>([]);
  const [estudos, setEstudos] = useState<LivroUnificado[]>([]);
  const [foraDaToga, setForaDaToga] = useState<LivroUnificado[]>([]);

  const [selected, setSelected] = useState<LivroUnificado | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [readerUrl, setReaderUrl] = useState<string | null>(null);
  const [readerTitle, setReaderTitle] = useState('');

  useEffect(() => {
    const fetch = async () => {
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
    fetch();
  }, []);

  const estudosByArea = useMemo(() => {
    const map = new Map<string, LivroUnificado[]>();
    estudos.forEach(l => {
      const area = l.area || 'Geral';
      if (!map.has(area)) map.set(area, []);
      map.get(area)!.push(l);
    });
    return Array.from(map.entries()).map(([label, livros]) => ({ label, livros }));
  }, [estudos]);

  const sections: Section[] = useMemo(() => [
    { label: 'Clássicos', livros: classicos },
    { label: 'Liderança', livros: lideranca },
    ...estudosByArea.map(s => ({ label: `Estudos — ${s.label}`, livros: s.livros })),
    { label: 'Fora da Toga', livros: foraDaToga },
  ].filter(s => s.livros.length > 0), [classicos, lideranca, estudosByArea, foraDaToga]);

  const handleSelect = (livro: LivroUnificado) => {
    setSelected(livro);
    setSheetOpen(true);
  };

  const handleRead = (livro: LivroUnificado) => {
    if (!livro.link) return;
    setSheetOpen(false);
    setReaderTitle(livro.titulo);
    setReaderUrl(livro.link);
  };

  const mobileHeader = (
    <div className="relative bg-gradient-to-br from-card to-secondary overflow-hidden px-4 pt-10 pb-8 sm:px-6">
      <Library className="absolute top-5 right-5 w-10 h-10 text-white/15 rotate-12" />
      <div className="relative max-w-2xl mx-auto z-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white font-medium transition-all text-sm px-3 py-1.5 rounded-lg mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <h1 className="font-display text-2xl text-white font-bold">Biblioteca de Leitura</h1>
        <p className="text-white/70 text-sm mt-1">Livros e materiais para estudo</p>
      </div>
    </div>
  );

  return (
    <>
      <DesktopPageLayout activeId="ferramentas" title="Biblioteca de Leitura" subtitle="Livros e materiais para estudo" mobileHeader={mobileHeader}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 lg:max-w-none lg:px-0 lg:py-0 space-y-6">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <div className="flex gap-3 overflow-hidden">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} className="w-[120px] h-[170px] rounded-lg flex-shrink-0" />
                  ))}
                </div>
              </div>
            ))
          ) : (
            sections.map((section) => (
              <div key={section.label}>
                <h2 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1">
                  {section.label}
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                </h2>
                <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide">
                  {section.livros.map((livro) => (
                    <LivroCard key={`${livro.categoria}-${livro.id}`} livro={livro} onClick={() => handleSelect(livro)} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </DesktopPageLayout>

      <LivroDetailSheet livro={selected} open={sheetOpen} onClose={() => setSheetOpen(false)} onRead={handleRead} />

      {readerUrl && (
        <LeitorWebView url={readerUrl} titulo={readerTitle} onClose={() => setReaderUrl(null)} />
      )}
    </>
  );
};

export default Biblioteca;
