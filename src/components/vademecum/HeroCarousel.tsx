import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { Bell } from 'lucide-react';
import vacatioLogo from '@/assets/logo-vacatio.jpeg';
import heroVademecum from '@/assets/hero-vademecum.webp';
import { getNoticiasCache, prefetchNoticias, type Noticia } from '@/services/noticiasService';
import { getLatestDayCount, getResenhaCache, prefetchResenha } from '@/services/atualizacaoService';
import { newsImg } from '@/lib/cdnImg';

const HeroCarousel = () => {
  const navigate = useNavigate();
  const autoplayPlugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true })
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, skipSnaps: false },
    [autoplayPlugin.current]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [noticias, setNoticias] = useState<Noticia[]>(() => {
    const cached = getNoticiasCache();
    return cached ? cached.filter(n => n.imagem_url?.trim()).slice(0, 10) : [];
  });
  const [badgeCount, setBadgeCount] = useState(0);

  // Novidades badge
  useEffect(() => {
    const cached = getResenhaCache();
    if (cached) {
      setBadgeCount(getLatestDayCount());
    } else {
      prefetchResenha().then(() => setBadgeCount(getLatestDayCount()));
    }
  }, []);

  // Load news
  useEffect(() => {
    if (noticias.length > 0) return;

    prefetchNoticias();

    const interval = setInterval(() => {
      const cached = getNoticiasCache();
      if (cached && cached.length > 0) {
        setNoticias(cached.filter(n => n.imagem_url?.trim()).slice(0, 10));
        clearInterval(interval);
      }
    }, 300);

    const timeout = setTimeout(() => clearInterval(interval), 8000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, []);

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

  const totalSlides = 1 + noticias.length;

  /* ── Logo + Novidades overlays (shared) ──────────────── */
  const logoOverlay = (
    <div className="absolute top-3 left-4 lg:top-6 lg:left-10 z-20 flex items-center gap-2 lg:gap-3">
      <img src={vacatioLogo} alt="Vacatio" loading="eager" decoding="sync" fetchPriority="high" className="w-9 h-9 lg:w-14 lg:h-14 rounded-full lg:rounded-2xl object-cover border border-primary/30 lg:border-2 lg:shadow-lg" />
      <div>
        <h1 className="font-display text-base lg:text-2xl text-gradient-gold leading-none">Vacatio</h1>
        <p className="font-display text-[10px] lg:text-sm text-white/60">Vade Mecum 2026</p>
      </div>
    </div>
  );

  const novidadesButton = (
    <button
      onClick={() => { setBadgeCount(0); navigate('/novidades'); }}
      className="absolute top-3 right-4 lg:top-6 lg:right-10 z-20 w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center border border-white/10 hover:bg-black/50 transition-colors"
    >
      <Bell className="w-[18px] h-[18px] lg:w-5 lg:h-5 text-white" />
      {badgeCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center px-1">
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      )}
    </button>
  );

  /* ── Slide content overlay ────────────────────────────── */
  const slideContent = (title: string, subtitle: string) => (
    <div className="relative z-10 h-full flex flex-col justify-end lg:justify-center px-4 pb-8 sm:px-6 lg:px-10 lg:pb-0">
      <div className="lg:max-w-xl">
        <h2 className="font-display text-lg sm:text-xl lg:text-4xl xl:text-5xl font-bold text-white leading-tight drop-shadow-lg">
          {title}
        </h2>
        <p className="text-white/70 text-sm lg:text-lg mt-1 lg:mt-3">{subtitle}</p>
      </div>
    </div>
  );

  if (noticias.length === 0) {
    return (
      <div className="relative h-52 sm:h-56 lg:h-[340px] xl:h-[400px] overflow-hidden">
        <img src={heroVademecum} alt="Vade Mecum Anotado" className="absolute inset-0 w-full h-full object-cover" loading="eager" decoding="sync" fetchPriority="high" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-background/90 lg:bg-gradient-to-r lg:from-background lg:via-background/70 lg:to-transparent" />
        {slideContent('Vade Mecum 2026', 'Sua legislação completa e anotada')}
        {logoOverlay}
        {novidadesButton}
      </div>
    );
  }

  return (
    <div className="relative h-52 sm:h-56 lg:h-[340px] xl:h-[400px] overflow-hidden">
      <div ref={emblaRef} className="h-full overflow-hidden">
        <div className="flex h-full">
          {/* First slide: Hero image */}
          <div className="relative flex-[0_0_100%] min-w-0 h-full cursor-pointer" onClick={() => navigate('/noticias')}>
            <img src={heroVademecum} alt="Vade Mecum Anotado" className="absolute inset-0 w-full h-full object-cover" loading="eager" decoding="sync" fetchPriority="high" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-background/90 lg:bg-gradient-to-r lg:from-background lg:via-background/70 lg:to-transparent" />
            {slideContent('Vade Mecum 2026', 'Sua legislação completa e anotada')}
          </div>

          {/* News slides */}
          {noticias.map((noticia, index) => (
            <div
              key={noticia.id}
              className="relative flex-[0_0_100%] min-w-0 h-full cursor-pointer"
              onClick={() => navigate('/noticias', { state: { noticiaId: noticia.id } })}
            >
              <img
                src={newsImg(noticia.imagem_url!, 800)}
                alt={noticia.titulo}
                className="absolute inset-0 w-full h-full object-cover"
                loading={index < 2 ? 'eager' : 'lazy'}
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-background/90 lg:bg-gradient-to-r lg:from-background lg:via-background/70 lg:to-transparent" />
              <div className="relative z-10 h-full flex flex-col justify-end lg:justify-center px-4 pb-8 sm:px-6 lg:px-10 lg:pb-0">
                <div className="lg:max-w-xl">
                  <span className="self-start text-[9px] lg:text-xs font-bold uppercase tracking-wider text-primary-foreground bg-primary/80 px-2 py-0.5 lg:px-3 lg:py-1 rounded-full mb-2 inline-block">
                    {noticia.categoria || 'Notícia'}
                  </span>
                  <h2 className="font-display text-lg sm:text-xl lg:text-3xl xl:text-4xl font-bold text-white leading-tight line-clamp-2 drop-shadow-lg mt-2">
                    {noticia.titulo}
                  </h2>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Logo overlay */}
      {logoOverlay}

      {/* Novidades button */}
      {novidadesButton}

      {/* Dots */}
      <div className="absolute bottom-2 lg:bottom-6 left-1/2 lg:left-10 lg:translate-x-0 -translate-x-1/2 z-20 flex items-center gap-1.5">
        {Array.from({ length: totalSlides }).map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            className={`rounded-full transition-all duration-300 ${
              i === selectedIndex
                ? 'w-5 h-1.5 lg:w-7 lg:h-2 bg-primary'
                : 'w-1.5 h-1.5 lg:w-2 lg:h-2 bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
