import { useState, useEffect } from 'react';
import { Newspaper } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getNoticiasCache, prefetchNoticias, type Noticia } from '@/services/noticiasService';
import { Skeleton } from '@/components/ui/skeleton';
import { directImg } from '@/lib/cdnImg';

const DesktopNewsSidebar = () => {
  const navigate = useNavigate();
  const [noticias, setNoticias] = useState<Noticia[]>(() => {
    const cached = getNoticiasCache();
    return cached ? cached.slice(0, 12) : [];
  });

  useEffect(() => {
    if (noticias.length > 0) return;
    prefetchNoticias();
    const interval = setInterval(() => {
      const cached = getNoticiasCache();
      if (cached && cached.length > 0) {
        setNoticias(cached.slice(0, 12));
        clearInterval(interval);
      }
    }, 200);
    const timeout = setTimeout(() => clearInterval(interval), 8000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, []);

  return (
    <aside className="w-[240px] lg:w-[280px] xl:w-[320px] shrink-0 sticky top-0 h-screen overflow-y-auto border-l border-border bg-card/50">
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-primary" />
          <h2 className="font-display text-sm font-bold text-foreground">Notícias</h2>
        </div>
        <button
          onClick={() => navigate('/noticias')}
          className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors px-3 py-1 rounded-full bg-primary/10 hover:bg-primary/15"
        >
          Ver todas →
        </button>
      </div>

      <div className="flex flex-col gap-3 px-4 pb-6">
        {noticias.length === 0 && (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden bg-card border border-border">
              <Skeleton className="h-[110px] w-full" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))
        )}
        {noticias.filter(n => n.imagem_url?.trim()).map((noticia, i) => {
          const date = noticia.data_publicacao
            ? new Date(noticia.data_publicacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
            : '';

          return (
            <motion.div
              key={noticia.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.4), type: 'spring', stiffness: 260, damping: 24 }}
              onClick={() => navigate('/noticias', { state: { noticiaId: noticia.id } })}
              className="rounded-lg overflow-hidden bg-card border border-border hover:border-primary/30 transition-all group cursor-pointer flex gap-3"
            >
              <div className="relative w-[90px] h-[70px] shrink-0 overflow-hidden rounded-l-lg">
                <img
                  src={directImg(noticia.imagem_url!, 200)}
                  alt={noticia.titulo}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                {noticia.categoria && (
                  <span className="absolute top-1 left-1 text-[7px] font-bold uppercase tracking-wider text-white bg-primary/80 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                    {noticia.categoria}
                  </span>
                )}
              </div>
              <div className="py-2 pr-2 flex flex-col justify-center min-w-0">
                <h4 className="font-display text-[11px] font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                  {noticia.titulo}
                </h4>
                {date && (
                  <p className="text-muted-foreground text-[10px] mt-1">{date}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </aside>
  );
};

export default DesktopNewsSidebar;
