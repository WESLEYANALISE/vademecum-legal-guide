import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Monitor, BookOpen, Brain, Zap, Layout, Globe, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import desktopImg from '@/assets/desktop-promo-laptop.jpg';
import vacatioLogo from '@/assets/logo-vacatio.jpeg';

const slides = [
  {
    icon: Monitor,
    title: 'Estude pelo Desktop',
    subtitle: 'Uma experiência completa de estudo jurídico na tela grande',
    description: 'Acesse toda a legislação brasileira com mais conforto, produtividade e ferramentas avançadas no seu computador.',
    color: 'from-primary/20 to-primary/5',
  },
  {
    icon: Layout,
    title: 'Tela ampla, mais produtividade',
    subtitle: 'Visualize artigos, anotações e explicações lado a lado',
    description: 'No desktop você aproveita a tela inteira para estudar com painéis simultâneos, sem precisar alternar entre abas.',
    color: 'from-blue-500/20 to-blue-500/5',
  },
  {
    icon: BookOpen,
    title: 'Leitura mais confortável',
    subtitle: 'Seus olhos agradecem',
    description: 'Textos em tamanho ideal, tipografia otimizada para leitura prolongada e modo escuro para estudar à noite.',
    color: 'from-emerald-500/20 to-emerald-500/5',
  },
  {
    icon: Brain,
    title: 'Ferramentas de IA avançadas',
    subtitle: 'Mapas mentais, resumos e questões em tela cheia',
    description: 'Gere mapas mentais interativos, resumos Cornell e Feynman com visualização expandida no desktop.',
    color: 'from-purple-500/20 to-purple-500/5',
  },
  {
    icon: Zap,
    title: 'Desempenho superior',
    subtitle: 'Navegação instantânea entre artigos e leis',
    description: 'Aproveite atalhos de teclado, busca rápida e carregamento instantâneo para maximizar seu tempo de estudo.',
    color: 'from-amber-500/20 to-amber-500/5',
  },
];

const benefits = [
  'Estude de forma mais confortável na tela grande',
  'Visualize artigos e anotações lado a lado',
  'Mapas mentais e resumos em tela expandida',
  'Navegação rápida com atalhos de teclado',
  'Modo escuro para sessões noturnas de estudo',
  'Radar legislativo com dashboard completo',
  'Biblioteca de livros com leitura imersiva',
  'Gamificação e questões em tela cheia',
];

const DesktopPromo = () => {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const slide = slides[current];

  const next = () => setCurrent((p) => (p + 1) % slides.length);
  const prev = () => setCurrent((p) => (p - 1 + slides.length) % slides.length);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <Monitor className="w-5 h-5 text-primary" />
          <h1 className="font-display text-lg font-bold text-foreground">Versão Desktop</h1>
        </div>
      </header>

      <div className="p-4 space-y-6 max-w-lg mx-auto pb-24">
        {/* Hero image */}
        <div className="relative rounded-2xl overflow-hidden border border-border">
          <img src={desktopImg} alt="Vacatio no Desktop" className="w-full h-48 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-4 flex items-center gap-2">
            <img src={vacatioLogo} alt="Vacatio" className="w-8 h-8 rounded-lg border border-primary/30" />
            <div>
              <p className="font-display text-sm font-bold text-foreground">Vacatio Desktop</p>
              <p className="text-[10px] text-muted-foreground">www.vacatio.com.br</p>
            </div>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={`rounded-2xl p-5 bg-gradient-to-br ${slide.color} border border-border`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <slide.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-foreground">{slide.title}</h2>
                  <p className="text-xs text-muted-foreground">{slide.subtitle}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">{slide.description}</p>
            </motion.div>
          </AnimatePresence>

          {/* Nav arrows */}
          <div className="flex items-center justify-between mt-3">
            <button onClick={prev} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </button>
            <div className="flex gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === current ? 'w-5 h-1.5 bg-primary' : 'w-1.5 h-1.5 bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
            <button onClick={next} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
              <ArrowRight className="w-4 h-4 text-foreground" />
            </button>
          </div>
        </div>

        {/* CTA */}
        <motion.a
          href="https://www.vacatio.com.br"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full py-4 rounded-full bg-primary text-primary-foreground font-display font-bold text-lg shadow-lg shadow-primary/30"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          <Globe className="w-5 h-5" />
          Acessar no Desktop
        </motion.a>
        <p className="text-center text-xs text-muted-foreground">www.vacatio.com.br</p>

        {/* Benefits list */}
        <section className="space-y-3">
          <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" /> Benefícios do Desktop
          </h3>
          <div className="space-y-2">
            {benefits.map((b) => (
              <div key={b} className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border">
                <ChevronRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-foreground font-body">{b}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DesktopPromo;
