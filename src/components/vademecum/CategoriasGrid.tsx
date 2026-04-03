import { useState, useEffect } from 'react';
import { ScrollText, FileText, Scale, Landmark, Shield, ChevronLeft, ChevronRight, Gavel, BookMarked, HeartPulse } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface Categoria {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  bg: string;
}

const CATEGORIAS: Categoria[] = [
  { id: 'constituicao', label: 'Constituição', sublabel: 'Lei Maior', icon: Landmark, bg: 'bg-gradient-to-br from-amber-600/90 to-amber-800/70' },
  { id: 'codigo', label: 'Códigos', sublabel: 'Civil, Penal...', icon: Scale, bg: 'bg-gradient-to-br from-sky-600/90 to-sky-800/70' },
  { id: 'estatuto', label: 'Estatutos', sublabel: 'ECA, Idoso...', icon: Shield, bg: 'bg-gradient-to-br from-emerald-600/90 to-emerald-800/70' },
  { id: 'lei-ordinaria', label: 'Leis Ordinárias', sublabel: 'Legislação', icon: FileText, bg: 'bg-gradient-to-br from-violet-600/90 to-violet-800/70' },
  { id: 'decreto', label: 'Decretos', sublabel: 'Regulamentos', icon: ScrollText, bg: 'bg-gradient-to-br from-orange-600/90 to-orange-800/70' },
  { id: 'sumula', label: 'Súmulas', sublabel: 'STF e STJ', icon: Gavel, bg: 'bg-gradient-to-br from-pink-600/90 to-pink-800/70' },
  { id: 'lei-especial', label: 'Leis Especiais', sublabel: 'Penais, Civis...', icon: BookMarked, bg: 'bg-gradient-to-br from-indigo-600/90 to-indigo-800/70' },
  { id: 'previdenciario', label: 'Previdenciário', sublabel: 'Benefícios, Custeio', icon: HeartPulse, bg: 'bg-gradient-to-br from-teal-600/90 to-teal-800/70' },
];


interface CategoriasGridProps {
  onSelect?: (id: string) => void;
}

const CategoriasGrid = ({ onSelect }: CategoriasGridProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* Legislação */}
      <div className="mx-0 sm:mx-2 md:mx-4 rounded-2xl bg-gradient-to-b from-card to-secondary/50 border border-border p-3">
        <div className="flex items-center justify-between mb-4">
          <button className="w-9 h-9 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <Scale className="w-5 h-5 text-primary" />
              <h2 className="font-display text-lg text-foreground font-bold">Legislação</h2>
            </div>
            <p className="text-muted-foreground text-xs font-body">Navegue por categoria</p>
          </div>
          <button className="w-9 h-9 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {CATEGORIAS.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, scale: 0.9, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: i * 0.07, type: 'spring', stiffness: 280, damping: 22 }}
                onClick={() => navigate(`/legislacao/${cat.id}`)}
                className={`${cat.bg} rounded-xl p-3 flex flex-col items-start gap-2 aspect-[5/3] lg:aspect-auto lg:py-4 relative overflow-hidden group shadow-lg shadow-black/25`}
              >
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
                  <div
                    className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent via-white/[0.10] to-transparent skew-x-[-20deg]"
                    style={{ animation: 'shinePratique 3s ease-in-out infinite', animationDelay: `${i * 0.8}s` }}
                  />
                </div>
                <Icon className="absolute bottom-2 right-2 w-10 h-10 text-white opacity-25 pointer-events-none" />
                <div className="w-10 h-10 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="mt-auto text-left w-full">
                  <p className="font-body text-sm font-bold text-white leading-tight">{cat.label}</p>
                  <p className="font-body text-xs text-white/70">{cat.sublabel}</p>
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-4">
          <div className="w-5 h-1.5 rounded-full bg-foreground" />
          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
        </div>
      </div>


      {/* Notícias */}
      {noticias.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-primary" />
              <h2 className="font-display text-base text-foreground font-bold">Notícias</h2>
            </div>
            <button
              onClick={() => navigate('/noticias')}
              className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/15"
            >
              Ver mais →
            </button>
          </div>

          <div
            className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pr-0 -mr-4"
            style={{ scrollbarWidth: 'none' }}
          >
            {noticias.filter(n => n.imagem_url?.trim()).map((noticia) => (
              <motion.div
                key={noticia.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                onClick={() => navigate('/noticias', { state: { noticiaId: noticia.id } })}
                className="shrink-0 w-[180px] snap-start rounded-xl overflow-hidden bg-card border border-border hover:border-primary/30 transition-all cursor-pointer group"
              >
                <div className="relative h-[100px] overflow-hidden bg-muted">
                  <img
                    src={cdnImg(noticia.imagem_url!, 360)}
                    alt={noticia.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  {noticia.categoria && (
                    <span className="absolute top-1.5 left-1.5 text-[8px] font-bold uppercase tracking-wider text-white bg-primary/80 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                      {noticia.categoria}
                    </span>
                  )}
                </div>
                <div className="p-2">
                  <h4 className="font-display text-[11px] font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {noticia.titulo}
                  </h4>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriasGrid;
