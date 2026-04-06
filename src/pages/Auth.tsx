import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2,
  ShieldCheck, KeyRound, ArrowLeft, BookOpen, Scale, Video, Star, Brain, Radar
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsDesktop } from '@/hooks/use-desktop';
import { LEIS_CATALOG } from '@/data/leisCatalog';
import logoVacatio from '@/assets/logo-vacatio.jpeg';
import themisBg from '@/assets/themis-bg.jpg';
import authBgLeft from '@/assets/auth-bg-left.jpg';
import authBgRight from '@/assets/auth-bg-right.jpg';
import landingBiblioteca from '@/assets/landing-biblioteca.jpg';
import landingVademecum from '@/assets/landing-vademecum.jpg';
import landingVideoaulas from '@/assets/landing-videoaulas.jpg';
import landingEstudar from '@/assets/landing-estudar.jpg';
import landingRadar from '@/assets/landing-radar.jpg';

const FEATURES = [
  { label: 'Vade Mecum', desc: 'Lei seca comentada', img: landingVademecum },
  { label: 'Biblioteca', desc: 'Livros jurídicos', img: landingBiblioteca },
  { label: 'Videoaulas', desc: 'Aulas em vídeo', img: landingVideoaulas },
  { label: 'Estudar', desc: 'Flashcards e questões', img: landingEstudar },
  { label: 'Radar', desc: 'Monitoramento legislativo', img: landingRadar },
];

/* CSS for shine animation injected once */
const shineStyleId = 'shine-anim-style';
if (typeof document !== 'undefined' && !document.getElementById(shineStyleId)) {
  const style = document.createElement('style');
  style.id = shineStyleId;
  style.textContent = `
    @keyframes shineSlide {
      0% { transform: translateX(-100%) rotate(25deg); }
      100% { transform: translateX(250%) rotate(25deg); }
    }
    .shine-effect { position: relative; overflow: hidden; }
    .shine-effect::after {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 40%;
      height: 200%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
      transform: translateX(-100%) rotate(25deg);
      animation: shineSlide 3s ease-in-out infinite;
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
}

function InfiniteCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let pos = 0;
    const speed = 0.4;

    const tick = () => {
      pos += speed;
      if (pos >= 820) pos = 0;
      el.style.transform = `translateX(-${pos}px)`;
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const items = [...FEATURES, ...FEATURES];

  return (
    <div className="overflow-hidden px-4 lg:px-0">
      <div ref={scrollRef} className="flex gap-3 lg:gap-4 will-change-transform" style={{ width: 'max-content' }}>
        {items.map((f, i) => (
          <div
            key={`${f.label}-${i}`}
            className="flex-shrink-0 w-[110px] lg:w-[160px] rounded-2xl overflow-hidden border border-primary/20 shadow-lg shine-effect"
          >
            <div className="relative h-[140px] lg:h-[200px]">
              <img
                src={f.img}
                alt={f.label}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-sm lg:text-base font-body font-bold text-foreground drop-shadow-lg">{f.label}</p>
                <p className="text-[10px] lg:text-xs font-body text-foreground/70 mt-0.5">{f.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Landing Screen ─── */
const LandingScreen = ({ onStart }: { onStart: () => void }) => (
  <motion.main
    key="landing"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0, x: '-30%' }}
    transition={{ duration: 0.35 }}
    className="min-h-screen relative flex flex-col overflow-hidden"
  >
    {/* Background */}
    <div className="absolute inset-0 z-0">
      <img src={themisBg} alt="" className="w-full h-full object-cover opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40 lg:bg-gradient-to-r lg:from-background lg:via-background/75 lg:to-background/30" />
    </div>

    {/* Content — centered on mobile, left-aligned on desktop */}
    <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center lg:items-center justify-center px-6 lg:px-16 xl:px-24 2xl:px-32 text-center lg:text-left">
      {/* Left column — text */}
      <div className="lg:flex-1 lg:max-w-2xl">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="shine-effect rounded-2xl inline-block"
        >
          <img
            src={logoVacatio}
            alt="Vacatio"
            className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl shadow-xl object-cover mb-4"
          />
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="font-display text-3xl lg:text-5xl xl:text-6xl font-bold text-foreground"
        >
          Vacatio
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm lg:text-lg font-body text-muted-foreground mt-1 mb-8"
        >
          Vade Mecum 2026
        </motion.p>

        {/* Headline */}
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="font-display text-xl lg:text-3xl xl:text-4xl font-semibold text-foreground leading-relaxed max-w-xs lg:max-w-lg"
        >
          Toda a{' '}
          <span className="text-primary border-b-2 border-primary/50">legislação brasileira</span>{' '}
          comentada e{' '}
          <span className="text-primary border-b-2 border-primary/50">explicada</span>.
        </motion.h2>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm lg:text-lg font-body text-muted-foreground mt-4 max-w-xs lg:max-w-md leading-relaxed"
        >
          Lei seca, comentários, explicações artigo por artigo, narração, resumos e muito mais para você{' '}
          <strong className="text-foreground">dominar a legislação</strong>.
        </motion.p>

        {/* CTA */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          onClick={onStart}
          className="mt-8 px-8 lg:px-12 py-3.5 lg:py-4 bg-primary text-primary-foreground rounded-full font-body font-semibold text-base lg:text-lg flex items-center gap-2 shadow-lg hover:opacity-90 transition-opacity mx-auto lg:mx-0"
        >
          Iniciar Agora
          <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6" />
        </motion.button>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 flex items-center gap-1.5 text-xs lg:text-sm font-body text-muted-foreground justify-center lg:justify-start"
        >
          <Star className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-yellow-500 fill-yellow-500" />
          +10.000 alunos já estudam com a gente
        </motion.div>
      </div>

      {/* Right column — decorative logo (desktop only) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 150, damping: 20 }}
        className="hidden lg:flex items-center justify-center lg:flex-1"
      >
        <div className="relative">
          <div className="absolute inset-0 blur-3xl bg-primary/15 rounded-full scale-150" />
          <div className="relative w-48 h-48 xl:w-56 xl:h-56 2xl:w-64 2xl:h-64 rounded-3xl overflow-hidden shadow-2xl border-2 border-primary/20 shine-effect">
            <img src={logoVacatio} alt="Vacatio" className="w-full h-full object-cover" />
          </div>
        </div>
      </motion.div>
    </div>

    {/* Infinite Auto-Scrolling Feature Carousel */}
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.55 }}
      className="relative z-10 pb-6 overflow-hidden"
    >
      <InfiniteCarousel />
    </motion.div>

    <p className="relative z-10 text-center text-[10px] lg:text-xs font-body text-muted-foreground pb-4">
      Vacatio — Vade Mecum © 2026
    </p>
  </motion.main>
);

/* ─── Auth Form Screen ─── */
const AuthFormScreen = ({ onBack }: { onBack: () => void }) => {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [forgotStep, setForgotStep] = useState<'email' | 'code' | 'newpass'>('email');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === 'forgot') {
        if (forgotStep === 'email') {
          const { error } = await resetPassword(email);
          if (error) throw error;
          toast.success('Código enviado! Verifique seu email.');
          setForgotStep('code');
        } else if (forgotStep === 'code') {
          const { error } = await supabase.auth.verifyOtp({ email, token: otpCode, type: 'recovery' });
          if (error) throw error;
          toast.success('Código verificado! Defina sua nova senha.');
          setForgotStep('newpass');
        } else {
          const { error } = await supabase.auth.updateUser({ password: newPassword });
          if (error) throw error;
          toast.success('Senha atualizada com sucesso!');
          setMode('login');
          setForgotStep('email');
          setOtpCode('');
          setNewPassword('');
        }
      } else if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) throw error;
      } else {
        if (password !== confirmPassword) {
          toast.error('As senhas não coincidem.');
          setSubmitting(false);
          return;
        }
        const { error } = await signUp(email, password, displayName);
        if (error) throw error;
        toast.success('Conta criada! Verifique seu email para confirmar.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao processar. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full pl-4 pr-12 py-3 bg-secondary/50 border border-border rounded-xl text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";

  const isDesktop = useIsDesktop();

  /* ── Shared form content ── */
  const formContent = (
    <>
      {/* Tabs */}
      {mode !== 'forgot' && (
        <div className="flex mb-5 bg-secondary/50 rounded-xl p-1">
          {(['login', 'signup'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2.5 text-sm font-body font-medium rounded-lg transition-all ${
                mode === m
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {m === 'login' ? 'Entrar' : 'Cadastrar'}
            </button>
          ))}
        </div>
      )}

      {/* Mode title (desktop) */}
      {isDesktop && mode !== 'forgot' && (
        <div className="text-center mb-4">
          <h2 className="font-display text-xl font-bold text-foreground">
            {mode === 'login' ? 'Entrar' : 'Criar Conta'}
          </h2>
          <p className="text-xs font-body text-muted-foreground mt-1">
            {mode === 'login' ? 'Entre com suas credenciais para acessar' : 'Preencha os dados para criar sua conta'}
          </p>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.form
          key={mode + forgotStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {mode === 'forgot' && (
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-3">
                {forgotStep === 'email' && <Mail className="w-6 h-6 text-primary" />}
                {forgotStep === 'code' && <ShieldCheck className="w-6 h-6 text-primary" />}
                {forgotStep === 'newpass' && <KeyRound className="w-6 h-6 text-primary" />}
              </div>
              <h2 className="font-display text-lg font-bold text-foreground">
                {forgotStep === 'email' && 'Recuperar Senha'}
                {forgotStep === 'code' && 'Código de Verificação'}
                {forgotStep === 'newpass' && 'Nova Senha'}
              </h2>
              <p className="text-xs font-body text-muted-foreground mt-1">
                {forgotStep === 'email' && 'Informe seu email para receber o código'}
                {forgotStep === 'code' && `Enviamos um código para ${email}`}
                {forgotStep === 'newpass' && 'Defina sua nova senha abaixo'}
              </p>
            </div>
          )}

          {mode === 'signup' && (
            <div className="relative">
              <input type="text" placeholder="Nome de exibição" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputCls} />
              <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          )}

          {(mode !== 'forgot' || forgotStep === 'email') && (
            <div className="relative">
              <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputCls} />
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          )}

          {mode === 'forgot' && forgotStep === 'code' && (
            <div className="relative">
              <input type="text" placeholder="Código de 6 dígitos" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} required maxLength={6} inputMode="numeric" className={`${inputCls} tracking-[0.3em] text-center`} />
              <ShieldCheck className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          )}

          {mode === 'forgot' && forgotStep === 'newpass' && (
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} placeholder="Nova senha (mínimo 6 caracteres)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className={inputCls} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          )}

          {mode !== 'forgot' && (
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className={inputCls} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          )}

          {mode === 'signup' && (
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} placeholder="Confirmar senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} className={inputCls} />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-body font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {mode === 'login' && 'Entrar'}
                {mode === 'signup' && 'Criar Conta'}
                {mode === 'forgot' && forgotStep === 'email' && 'Enviar Código'}
                {mode === 'forgot' && forgotStep === 'code' && 'Verificar'}
                {mode === 'forgot' && forgotStep === 'newpass' && 'Atualizar Senha'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {mode === 'login' && (
            <button type="button" onClick={() => { setMode('forgot'); setForgotStep('email'); }} className="w-full text-center text-xs font-body text-primary hover:underline">
              Esqueci minha senha
            </button>
          )}

          {mode === 'forgot' && (
            <button type="button" onClick={() => { setMode('login'); setForgotStep('email'); setOtpCode(''); setNewPassword(''); }} className="w-full text-center text-xs font-body text-primary hover:underline">
              Voltar ao login
            </button>
          )}
        </motion.form>
      </AnimatePresence>
    </>
  );

  /* ── Desktop: split-screen layout ── */
  if (isDesktop) {
    const lawItems = LEIS_CATALOG.map(l => ({ sigla: l.sigla, nome: l.nome }));

    return (
      <motion.main
        key="auth"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen flex relative overflow-hidden"
      >
        {/* ── Left panel: animated showcase ── */}
        <div className="w-1/2 relative flex flex-col items-center justify-center overflow-hidden">
          {/* Background image + overlay */}
          <img src={authBgLeft} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-background/85" />

          <div className="relative z-10 flex flex-col items-center px-10 max-w-lg">
            {/* Logo */}
            <motion.img
              src={logoVacatio}
              alt="Vacatio"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="w-20 h-20 rounded-2xl shadow-xl object-cover border-2 border-primary/30 mb-4"
            />
            <motion.h2
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="font-display text-3xl font-bold text-foreground text-center"
            >
              Vade Mecum 2026
            </motion.h2>
            <motion.p
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="font-body text-base text-muted-foreground text-center mt-2 mb-8"
            >
              Toda a legislação brasileira comentada e explicada
            </motion.p>

            {/* ── Cascading law list ── */}
            <div
              className="w-full max-h-[340px] overflow-hidden relative"
              style={{
                maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 75%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 75%, transparent 100%)',
              }}
            >
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.07 } },
                }}
                className="flex flex-col gap-2"
              >
                {lawItems.map((law, i) => (
                  <motion.div
                    key={law.sigla}
                    variants={{
                      hidden: { opacity: 0, y: 18 },
                      visible: {
                        opacity: [0, 1, 1, 0.4],
                        y: 0,
                        transition: {
                          duration: 1.2,
                          ease: 'easeOut',
                          opacity: { duration: 2.5, times: [0, 0.15, 0.7, 1] },
                        },
                      },
                    }}
                    className="flex items-center gap-3 px-4 py-2 rounded-xl bg-card/50 backdrop-blur-sm border border-border/40"
                  >
                    <span className="font-display text-sm font-bold text-primary min-w-[70px]">{law.sigla}</span>
                    <span className="font-body text-sm text-foreground/80 truncate">{law.nome}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>

        {/* ── Right panel: auth form ── */}
        <div className="w-1/2 relative flex items-center justify-center">
          <img src={authBgRight} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

          {/* Back button */}
          <button
            onClick={onBack}
            className="absolute top-6 left-6 z-20 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-card transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 24 }}
            className="relative z-10 w-full max-w-md bg-card/90 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl"
          >
            {/* Logo */}
            <div className="flex flex-col items-center mb-6">
              <img src={logoVacatio} alt="Vacatio" className="w-16 h-16 rounded-xl shadow-lg object-cover border-2 border-primary/30" />
              <h1 className="font-display text-xl font-bold text-foreground mt-3">Vacatio</h1>
              <p className="text-xs font-body text-muted-foreground">Estudos Jurídicos</p>
            </div>

            {formContent}
          </motion.div>
        </div>
      </motion.main>
    );
  }

  /* ── Mobile: original layout ── */
  return (
    <motion.main
      key="auth"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      className="min-h-screen flex flex-col bg-background overflow-hidden"
    >
      {/* Top Image */}
      <div className="relative w-full h-[35vh] flex-shrink-0">
        <img src={themisBg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />

        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 z-20 w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center shadow-lg"
        >
          <ArrowLeft className="w-5 h-5 text-primary-foreground" />
        </button>
      </div>

      {/* Logo + name */}
      <div className="flex flex-col items-center -mt-10 relative z-10">
        <img src={logoVacatio} alt="Vacatio" className="w-14 h-14 rounded-xl shadow-lg object-cover border-2 border-background" />
        <h1 className="font-display text-lg font-bold text-foreground mt-2">Vacatio</h1>
        <p className="text-[11px] font-body text-muted-foreground">Vade Mecum 2026</p>
      </div>

      {/* Form area */}
      <div className="flex-1 px-6 pt-6 pb-8">
        {formContent}
      </div>

      <p className="text-center text-[10px] font-body text-muted-foreground pb-4">
        Vacatio — Vade Mecum © 2026
      </p>
    </motion.main>
  );
};

/* ─── Main Auth Page ─── */
const Auth = () => {
  const { user, loading } = useAuth();
  const [screen, setScreen] = useState<'landing' | 'auth'>('auth');

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
    );
  }

  if (user) return <Navigate to="/" replace />;

  return (
    <AnimatePresence mode="wait">
      {screen === 'landing' ? (
        <LandingScreen key="landing" onStart={() => setScreen('auth')} />
      ) : (
        <AuthFormScreen key="auth" onBack={() => setScreen('landing')} />
      )}
    </AnimatePresence>
  );
};

export default Auth;
