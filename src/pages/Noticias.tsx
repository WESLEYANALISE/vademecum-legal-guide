import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Landmark, Clock, ExternalLink, Loader2, ArrowLeft, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { useIsDesktop } from '@/hooks/use-desktop';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getNoticiasCache, prefetchNoticias, type Noticia } from '@/services/noticiasService';
import { newsImg } from '@/lib/cdnImg';

function formatDateParts(dateStr: string) {
  const d = new Date(dateStr);
  const day = d.getDate();
  const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const month = months[d.getMonth()];
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return { day, month, time: `${hours}:${minutes}` };
}

function formatDateFull(dateStr: string) {
  const d = new Date(dateStr);
  const day = d.getDate();
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${day} ${months[d.getMonth()]} · ${hours}:${minutes}`;
}

const Noticias = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNoticia, setSelectedNoticia] = useState<Noticia | null>(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState('');

  useEffect(() => {
    const cached = getNoticiasCache();
    if (cached) {
      setNoticias(cached);
      setLoading(false);
    } else {
      prefetchNoticias().then(() => {
        const data = getNoticiasCache();
        if (data) setNoticias(data);
        setLoading(false);
      });
    }
  }, []);

  // Auto-open noticia from navigation state
  useEffect(() => {
    const noticiaId = (location.state as any)?.noticiaId;
    if (noticiaId && noticias.length > 0) {
      const found = noticias.find(n => n.id === noticiaId);
      if (found) setSelectedNoticia(found);
    }
  }, [noticias, location.state]);

  const categorias = useMemo(() => {
    const cats = new Set(noticias.map(n => n.categoria).filter(Boolean));
    return Array.from(cats);
  }, [noticias]);

  const finalFiltered = useMemo(() => {
    const filtered = !categoriaFiltro
      ? noticias
      : noticias.filter(n => n.categoria === categoriaFiltro);

    return [...filtered].sort((a, b) => {
      const dateDiff = new Date(b.data_publicacao).getTime() - new Date(a.data_publicacao).getTime();
      if (dateDiff !== 0) return dateDiff;
      return b.id.localeCompare(a.id);
    });
  }, [noticias, categoriaFiltro]);

  const heroNoticia = finalFiltered.length > 0 ? finalFiltered[0] : null;
  const listNoticias = finalFiltered.slice(1);

  const ContentViewer = ({ noticia }: { noticia: Noticia }) => (
    <div className="space-y-4">
      {noticia.imagem_url && (
        <img
          src={cdnImg(noticia.imagem_url!, 640)}
          alt={noticia.titulo}
          className="w-full h-48 object-cover rounded-lg"
          decoding="async"
        />
      )}
      <h2 className="font-display text-lg text-foreground leading-tight font-bold">
        {noticia.titulo}
      </h2>
      <div className="flex items-center gap-2 flex-wrap">
        {noticia.categoria && (
          <span className="px-2 py-0.5 rounded-md bg-primary/20 text-primary text-[10px] font-bold">
            {noticia.categoria}
          </span>
        )}
      </div>
      <p className="text-muted-foreground text-xs font-body">
        {new Date(noticia.data_publicacao).toLocaleDateString('pt-BR')} – {new Date(noticia.data_publicacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </p>
      <div className="text-[15px] font-body leading-relaxed text-foreground whitespace-pre-line">
        {noticia.conteudo || noticia.resumo || 'Conteúdo não disponível.'}
      </div>
      <a
        href={noticia.link}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-body"
      >
        <ExternalLink className="w-3 h-3" />
        Ver no site da Câmara
      </a>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-primary" />
            <h1 className="font-display text-lg text-foreground">Notícias Legislativas</h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* Category filter tabs */}
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-1">
            <button
              onClick={() => setCategoriaFiltro('')}
              className={`whitespace-nowrap text-xs font-body font-semibold px-3 py-1.5 rounded-full transition-colors ${
                !categoriaFiltro
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              Todas
            </button>
            {categorias.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoriaFiltro(cat === categoriaFiltro ? '' : cat)}
                className={`whitespace-nowrap text-xs font-body font-semibold px-3 py-1.5 rounded-full transition-colors ${
                  categoriaFiltro === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </ScrollArea>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {!loading && (
          <>
            {/* Hero card */}
            {heroNoticia && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedNoticia(heroNoticia)}
                className="rounded-2xl overflow-hidden bg-card border border-border cursor-pointer hover:border-primary/30 transition-colors"
              >
                {heroNoticia.imagem_url ? (
                  <div className="relative h-52 overflow-hidden news-cover-shine">
                    <img
                      src={cdnImg(heroNoticia.imagem_url!, 960)}
                      srcSet={`${cdnImg(heroNoticia.imagem_url!, 640)} 640w, ${cdnImg(heroNoticia.imagem_url!, 960)} 960w`}
                      sizes="(max-width: 768px) 640px, 960px"
                      alt={heroNoticia.titulo}
                      className="w-full h-full object-cover"
                      fetchPriority="high"
                      decoding="async"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary text-primary-foreground uppercase tracking-wide">
                          Câmara dos Deputados
                        </span>
                        {heroNoticia.categoria && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary text-primary-foreground">
                            {heroNoticia.categoria}
                          </span>
                        )}
                      </div>
                      <h2 className="font-display text-base text-white leading-tight">
                        {heroNoticia.titulo}
                      </h2>
                      <div className="flex items-center gap-1.5 text-white/70 text-[11px] font-body">
                        <Clock className="w-3 h-3" />
                        {formatDateFull(heroNoticia.data_publicacao)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative p-5 bg-gradient-to-br from-primary/15 via-card to-card">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary text-primary-foreground uppercase tracking-wide">
                          Câmara dos Deputados
                        </span>
                        {heroNoticia.categoria && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary text-primary-foreground">
                            {heroNoticia.categoria}
                          </span>
                        )}
                      </div>
                      <h2 className="font-display text-lg text-foreground leading-tight">
                        {heroNoticia.titulo}
                      </h2>
                      {heroNoticia.resumo && (
                        <p className="text-muted-foreground text-xs font-body line-clamp-2">
                          {heroNoticia.resumo}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-body">
                        <Clock className="w-3 h-3" />
                        {formatDateFull(heroNoticia.data_publicacao)}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* List cards */}
            <div className="space-y-2">
              {listNoticias.map((item, i) => {
                const { day, month, time } = formatDateParts(item.data_publicacao);
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setSelectedNoticia(item)}
                    className="flex items-stretch gap-3 rounded-xl bg-card border border-border hover:border-primary/20 transition-colors cursor-pointer overflow-hidden p-3"
                  >
                    {/* Date column */}
                    <div className="flex flex-col items-center justify-center w-12 shrink-0">
                      <span className="text-lg font-display font-bold text-foreground leading-none">{day}</span>
                      <span className="text-[10px] font-body font-semibold text-primary uppercase">{month}</span>
                      <span className="text-[10px] font-body text-muted-foreground">{time}</span>
                    </div>

                    {/* Thumbnail — only if image exists */}
                    {item.imagem_url && (
                      <div className="w-20 h-16 rounded-lg overflow-hidden shrink-0 news-cover-shine">
                        <img
                          src={cdnImg(item.imagem_url!, 160)}
                          alt={item.titulo}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                      <h3 className="font-display text-sm text-foreground leading-tight line-clamp-2">
                        {item.titulo}
                      </h3>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.categoria && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                            {item.categoria}
                          </span>
                        )}
                        <span className="text-[9px] font-body text-muted-foreground">
                          Câmara dos Deputados
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {finalFiltered.length === 0 && (
              <p className="text-center text-muted-foreground py-8 font-body">
                {noticias.length === 0
                  ? 'Nenhuma notícia carregada ainda.'
                  : 'Nenhuma notícia encontrada para esta busca.'}
              </p>
            )}
          </>
        )}
      </div>

      {/* Detail view — bottom sheet style like ArtigoBottomSheet */}
      <AnimatePresence>
        {selectedNoticia && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/60"
              onClick={() => setSelectedNoticia(null)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className={
                isDesktop
                  ? "fixed z-50 bottom-0 top-[5%] left-0 right-0 mx-auto bg-card border border-border rounded-t-2xl flex flex-col w-[800px] shadow-2xl"
                  : "fixed inset-x-0 bottom-0 top-2 z-50 rounded-t-3xl bg-card border-t border-border flex flex-col"
              }
            >
              <div className="flex items-center justify-between px-5 pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
                <button
                  onClick={() => setSelectedNoticia(null)}
                  className="p-2 rounded-full hover:bg-secondary transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-8 pt-2">
                <ContentViewer noticia={selectedNoticia} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Noticias;
