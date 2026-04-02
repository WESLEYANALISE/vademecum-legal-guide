import { useState, useEffect, useCallback, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, StickyNote, MessageCircle, Radio, Mic, Brain, Sparkles } from 'lucide-react';
import heroImage from '@/assets/hero-vademecum.jpg';
import vacatioLogo from '@/assets/logo-vacatio.jpeg';
import camaraHero from '@/assets/radar/camara-hero.jpg';
import senadoHero from '@/assets/radar/senado-hero.jpg';
import { getNoticiasCache, type Noticia } from '@/services/noticiasService';
import { cdnImg } from '@/lib/cdnImg';

interface Slide {
  type: 'feature' | 'news';
  title: string;
  description: string;
  image: string;
  icon?: typeof Search;
  noticia?: Noticia;
}

const FEATURE_SLIDES: Omit<Slide, 'type'>[] = [
  {
    title: 'Vacatio Vade Mecum',
    description: 'Toda a legislação brasileira na palma da sua mão',
    image: heroImage,
    icon: Sparkles,
  },
  {
    title: 'Legislação Completa',
    description: 'CF, CC, CP, CPC, CLT e mais — sempre atualizados',
    image: senadoHero,
    icon: BookOpen,
  },
  {
    title: 'Busca Inteligente',
    description: 'Encontre qualquer artigo em segundos',
    image: camaraHero,
    icon: Search,
  },
  {
    title: 'Anotações com IA',
    description: 'Faça anotações nos artigos com sugestões inteligentes',
    image: heroImage,
    icon: StickyNote,
  },
  {
    title: 'Assistente Jurídica',
    description: 'Tire dúvidas sobre qualquer artigo com a IA',
    image: senadoHero,
    icon: MessageCircle,
  },
  {
    title: 'Radar Legislativo',
    description: 'Acompanhe projetos de lei em tempo real',
    image: camaraHero,
    icon: Radio,
  },
  {
    title: 'Narração de Artigos',
    description: 'Ouça os artigos narrados com voz natural',
    image: heroImage,
    icon: Mic,
  },
  {
    title: 'Mapas Mentais e Quiz',
    description: 'Estude com mapas mentais e quizzes gerados por IA',
    image: senadoHero,
    icon: Brain,
  },
];

const HeroCarousel = () => {
  const autoplayPlugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true })
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, skipSnaps: false },
    [autoplayPlugin.current]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [slides, setSlides] = useState<Slide[]>([]);

  // Build slides with news injected
  useEffect(() => {
    const featureSlides: Slide[] = FEATURE_SLIDES.map(s => ({ ...s, type: 'feature' as const }));
    const cached = getNoticiasCache();

    const result: Slide[] = [];
    let featureIdx = 0;

    for (let i = 0; i < 10; i++) {
      // Insert news at positions 4 and 8
      if ((i === 4 || i === 8) && cached && cached.length > 0) {
        const newsIdx = i === 4 ? 0 : Math.min(1, cached.length - 1);
        const n = cached[newsIdx];
        result.push({
          type: 'news',
          title: n.titulo,
          description: n.categoria || 'Notícia',
          image: n.imagem_url ? cdnImg(n.imagem_url, 800) : heroImage,
          noticia: n,
        });
      } else if (featureIdx < featureSlides.length) {
        result.push(featureSlides[featureIdx]);
        featureIdx++;
      }
    }

    setSlides(result.length > 0 ? result : featureSlides);
  }, []);

  // Retry news injection after cache loads
  useEffect(() => {
    if (slides.some(s => s.type === 'news')) return;

    const interval = setInterval(() => {
      const cached = getNoticiasCache();
      if (cached && cached.length > 0) {
        const featureSlides: Slide[] = FEATURE_SLIDES.map(s => ({ ...s, type: 'feature' as const }));
        const result: Slide[] = [];
        let featureIdx = 0;

        for (let i = 0; i < 10; i++) {
          if ((i === 4 || i === 8) && cached.length > 0) {
            const newsIdx = i === 4 ? 0 : Math.min(1, cached.length - 1);
            const n = cached[newsIdx];
            result.push({
              type: 'news',
              title: n.titulo,
              description: n.categoria || 'Notícia',
              image: n.imagem_url ? cdnImg(n.imagem_url, 800) : heroImage,
              noticia: n,
            });
          } else if (featureIdx < featureSlides.length) {
            result.push(featureSlides[featureIdx]);
            featureIdx++;
          }
        }

        setSlides(result);
        clearInterval(interval);
      }
    }, 500);

    const timeout = setTimeout(() => clearInterval(interval), 8000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [slides]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  if (slides.length === 0) {
    return <div className="h-52 sm:h-56 bg-muted animate-pulse" />;
  }

  return (
    <div className="relative h-52 sm:h-56 overflow-hidden">
      <div ref={emblaRef} className="h-full overflow-hidden">
        <div className="flex h-full">
          {slides.map((slide, index) => (
            <div key={index} className="relative flex-[0_0_100%] min-w-0 h-full">
              <img
                src={slide.image}
                alt={slide.title}
                className="absolute inset-0 w-full h-full object-cover"
                loading={index < 2 ? 'eager' : 'lazy'}
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-background/90" />

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col justify-end px-4 pb-8 sm:px-6">
                {slide.type === 'news' && (
                  <span className="self-start text-[9px] font-bold uppercase tracking-wider text-primary-foreground bg-primary/80 px-2 py-0.5 rounded-full mb-2">
                    {slide.description}
                  </span>
                )}
                {slide.type === 'feature' && slide.icon && (
                  <div className="w-8 h-8 rounded-lg bg-primary/20 backdrop-blur-sm flex items-center justify-center mb-2">
                    <slide.icon className="w-4 h-4 text-white" />
                  </div>
                )}
                <h2 className="font-display text-lg sm:text-xl font-bold text-white leading-tight line-clamp-2 drop-shadow-lg">
                  {slide.title}
                </h2>
                {slide.type === 'feature' && (
                  <p className="text-white/80 text-xs sm:text-sm mt-1 font-body line-clamp-1 drop-shadow">
                    {slide.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Logo overlay — top left */}
      <div className="absolute top-3 left-4 z-20 flex items-center gap-2">
        <img src={vacatioLogo} alt="Vacatio" loading="eager" decoding="sync" fetchPriority="high" className="w-9 h-9 rounded-full object-cover border border-primary/30" />
        <div>
          <h1 className="font-display text-base text-gradient-gold leading-none">Vacatio</h1>
          <p className="font-display text-[10px] text-white/60">Vade Mecum 2026</p>
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            className={`rounded-full transition-all duration-300 ${
              i === selectedIndex
                ? 'w-5 h-1.5 bg-primary'
                : 'w-1.5 h-1.5 bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
