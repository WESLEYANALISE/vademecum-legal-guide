import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import vacatioLogo from '@/assets/logo-vacatio.jpeg';
import heroBanner from '@/assets/desktop-hero-banner.jpg';

const DesktopHeroBanner = () => {
  const navigate = useNavigate();

  return (
    <div className="relative w-full overflow-hidden" style={{ minHeight: '420px' }}>
      {/* Background image */}
      <img
        src={heroBanner}
        alt="Vacatio banner"
        className="absolute inset-0 w-full h-full object-cover object-center"
        width={1920}
        height={512}
      />
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex items-center h-full min-h-[420px] px-12 xl:px-20 2xl:px-28">
        <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
          {/* Left side — text */}
          <motion.div
            className="max-w-xl space-y-6"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 24 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg border-2 border-primary/30">
                <img src={vacatioLogo} alt="Vacatio" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="font-display text-4xl xl:text-5xl font-bold text-foreground tracking-tight">
                  Vacatio
                </h1>
                <p className="text-muted-foreground text-base font-body">Vade Mecum 2026</p>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="font-display text-2xl xl:text-3xl font-bold text-foreground leading-snug">
                Toda a <span className="underline decoration-primary decoration-2 underline-offset-4">legislação brasileira</span> comentada e explicada.
              </h2>
              <p className="text-muted-foreground text-base xl:text-lg font-body leading-relaxed max-w-md">
                Lei seca, comentários, explicações artigo por artigo, narração, resumos e muito mais para você{' '}
                <span className="text-primary font-semibold">dominar a legislação</span>.
              </p>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <motion.button
                onClick={() => navigate('/legislacao/constituicao')}
                className="flex items-center gap-3 px-8 py-4 rounded-full bg-primary text-primary-foreground font-display font-bold text-lg shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Iniciar Agora
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </div>

            <p className="text-muted-foreground text-sm font-body flex items-center gap-2">
              <span className="text-primary">★</span> +10.000 alunos já estudam com a gente
            </p>
          </motion.div>

          {/* Right side — decorative (logo glow) */}
          <motion.div
            className="hidden xl:flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 150, damping: 20 }}
          >
            <div className="relative">
              <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full scale-150" />
              <div className="relative w-40 h-40 2xl:w-48 2xl:h-48 rounded-3xl overflow-hidden shadow-2xl border-2 border-primary/20">
                <img src={vacatioLogo} alt="Vacatio" className="w-full h-full object-cover" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DesktopHeroBanner;
