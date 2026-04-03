import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Loader2, ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { LEIS_CATALOG } from '@/data/leisCatalog';
import { fetchArtigosLei } from '@/services/legislacaoService';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import html2canvas from 'html2canvas';
import logoImg from '@/assets/logo-vacatio.jpeg';

// ─── Types ───

interface SlideFeature {
  icone: string;
  label: string;
  desc: string;
}

interface SlidePasso {
  titulo: string;
  desc: string;
}

interface SlideData {
  tipo: 'hero' | 'problema' | 'solucao' | 'features' | 'detalhes' | 'passos' | 'cta';
  bg: 'light' | 'dark' | 'gradient';
  tag: string;
  titulo?: string;
  subtitulo?: string;
  texto?: string;
  citacao?: string;
  itens?: string[];
  features?: SlideFeature[];
  passos?: SlidePasso[];
  texto_engajamento?: string;
  cta_texto?: string;
}

interface CarrosselData {
  titulo_viral: string;
  slides: SlideData[];
}

// ─── Design System Tokens ───

const BRAND_PRIMARY = 'hsl(340, 55%, 22%)';
const BRAND_LIGHT = 'hsl(340, 40%, 45%)';
const BRAND_DARK = 'hsl(340, 55%, 12%)';
const LIGHT_BG = 'hsl(40, 15%, 95%)';
const LIGHT_BORDER = 'hsl(40, 10%, 88%)';
const DARK_BG = 'hsl(340, 30%, 8%)';
const BRAND_GRADIENT = `linear-gradient(165deg, ${BRAND_DARK} 0%, ${BRAND_PRIMARY} 50%, ${BRAND_LIGHT} 100%)`;

const SLIDE_W = 420;
const SLIDE_H = 525;

const TIPOS_CONTEUDO = [
  { value: 'curiosidade', label: 'Curiosidade', desc: '"Você sabia que..." — fatos surpreendentes' },
  { value: 'explicacao', label: 'Explicação', desc: 'Didática com exemplos do dia-a-dia' },
  { value: 'resumo_prova', label: 'Resumo pra Prova', desc: 'Pontos-chave para OAB e concursos' },
  { value: 'dica_pratica', label: 'Dica Prática', desc: 'Aplicação na prática profissional' },
  { value: 'comparacao', label: 'Comparação', desc: 'Antes vs Depois / Artigo X vs Artigo Y' },
];

// ─── Slide Sub-Components ───

function ProgressBar({ index, total, isLight }: { index: number; total: number; isLight: boolean }) {
  const pct = ((index + 1) / total) * 100;
  const trackColor = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)';
  const fillColor = isLight ? BRAND_PRIMARY : '#fff';
  const labelColor = isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)';
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 28px 20px', zIndex: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 3, background: trackColor, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: fillColor, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 11, color: labelColor, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>{index + 1}/{total}</span>
    </div>
  );
}

function SwipeArrow({ isLight }: { isLight: boolean }) {
  const bg = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)';
  const stroke = isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.35)';
  return (
    <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 48, zIndex: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(to right, transparent, ${bg})` }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M9 6l6 6-6 6" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function TagLabel({ text, isLight, isGradient }: { text: string; isLight: boolean; isGradient: boolean }) {
  const color = isGradient ? 'rgba(255,255,255,0.6)' : isLight ? BRAND_PRIMARY : BRAND_LIGHT;
  return (
    <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 600, letterSpacing: 2, color, marginBottom: 16, fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase' }}>
      {text}
    </span>
  );
}

function LogoLockup({ isLight }: { isLight: boolean }) {
  const textColor = isLight ? BRAND_DARK : '#fff';
  const subColor = isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.5)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      <img src={logoImg} alt="Vacatio" style={{ width: 32, height: 32, borderRadius: '50%' }} crossOrigin="anonymous" />
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.5, color: textColor, fontFamily: "'DM Sans', sans-serif" }}>Vacatio</div>
        <div style={{ fontSize: 9, color: subColor, fontFamily: "'DM Sans', sans-serif" }}>@vacatio.app</div>
      </div>
    </div>
  );
}

// ─── Main Slide Renderer ───

function SlideRenderer({ slide, index, total }: { slide: SlideData; index: number; total: number }) {
  const isLight = slide.bg === 'light';
  const isGradient = slide.bg === 'gradient';
  const isLast = index === total - 1;

  const bgStyle = isGradient ? BRAND_GRADIENT : isLight ? LIGHT_BG : DARK_BG;
  const textColor = isLight ? BRAND_DARK : '#fff';
  const bodyColor = isLight ? '#3a3530' : 'rgba(255,255,255,0.85)';
  const borderColor = isLight ? LIGHT_BORDER : 'rgba(255,255,255,0.1)';

  const baseStyle: React.CSSProperties = {
    width: SLIDE_W, height: SLIDE_H, background: bgStyle, display: 'flex', flexDirection: 'column',
    position: 'relative', overflow: 'hidden', boxSizing: 'border-box',
  };

  const contentStyle: React.CSSProperties = {
    flex: 1, display: 'flex', flexDirection: 'column',
    justifyContent: slide.tipo === 'hero' || slide.tipo === 'cta' ? 'center' : 'flex-start',
    padding: '28px 32px 48px',
  };

  const headingStyle: React.CSSProperties = {
    fontSize: slide.tipo === 'hero' ? 28 : 22, fontWeight: 600, color: textColor,
    lineHeight: 1.15, letterSpacing: -0.3, fontFamily: "'Playfair Display', Georgia, serif", marginBottom: 10, marginTop: 0,
  };

  const bodyStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 400, lineHeight: 1.5, color: bodyColor,
    fontFamily: "'DM Sans', sans-serif", margin: 0,
  };

  // ── Hero slide
  if (slide.tipo === 'hero') {
    return (
      <div style={baseStyle}>
        <div style={contentStyle}>
          <LogoLockup isLight={isLight} />
          <TagLabel text={slide.tag} isLight={isLight} isGradient={isGradient} />
          <h1 style={headingStyle}>{slide.titulo}</h1>
          {slide.subtitulo && <p style={{ ...bodyStyle, marginTop: 4 }}>{slide.subtitulo}</p>}
        </div>
        {!isLast && <SwipeArrow isLight={isLight} />}
        <ProgressBar index={index} total={total} isLight={isLight && !isGradient} />
      </div>
    );
  }

  // ── Problema slide (dark)
  if (slide.tipo === 'problema') {
    return (
      <div style={baseStyle}>
        <div style={contentStyle}>
          <TagLabel text={slide.tag} isLight={isLight} isGradient={isGradient} />
          <h2 style={headingStyle}>{slide.titulo}</h2>
          {slide.itens?.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '8px 0', borderBottom: `1px solid ${borderColor}` }}>
              <span style={{ color: BRAND_LIGHT, fontSize: 15, width: 18, textAlign: 'center', flexShrink: 0 }}>•</span>
              <p style={bodyStyle}>{item}</p>
            </div>
          ))}
        </div>
        {!isLast && <SwipeArrow isLight={isLight} />}
        <ProgressBar index={index} total={total} isLight={isLight && !isGradient} />
      </div>
    );
  }

  // ── Solução slide (gradient)
  if (slide.tipo === 'solucao') {
    return (
      <div style={baseStyle}>
        <div style={contentStyle}>
          <TagLabel text={slide.tag} isLight={false} isGradient={true} />
          <h2 style={{ ...headingStyle, color: '#fff' }}>{slide.titulo}</h2>
          {slide.texto && <p style={{ ...bodyStyle, color: 'rgba(255,255,255,0.85)', marginBottom: 16 }}>{slide.texto}</p>}
          {slide.citacao && (
            <div style={{ padding: 16, background: 'rgba(0,0,0,0.15)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>Dispositivo legal</p>
              <p style={{ fontSize: 15, color: '#fff', fontStyle: 'italic', lineHeight: 1.4, fontFamily: "'Playfair Display', serif" }}>"{slide.citacao}"</p>
            </div>
          )}
        </div>
        {!isLast && <SwipeArrow isLight={false} />}
        <ProgressBar index={index} total={total} isLight={false} />
      </div>
    );
  }

  // ── Features slide
  if (slide.tipo === 'features') {
    return (
      <div style={baseStyle}>
        <div style={contentStyle}>
          <TagLabel text={slide.tag} isLight={isLight} isGradient={isGradient} />
          <h2 style={headingStyle}>{slide.titulo}</h2>
          {slide.features?.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '10px 0', borderBottom: `1px solid ${borderColor}` }}>
              <span style={{ color: isLight ? BRAND_PRIMARY : BRAND_LIGHT, fontSize: 15, width: 18, textAlign: 'center', flexShrink: 0 }}>{f.icone}</span>
              <div>
                <span style={{ fontSize: 14, fontWeight: 600, color: textColor, fontFamily: "'DM Sans', sans-serif", display: 'block' }}>{f.label}</span>
                <span style={{ fontSize: 12, color: isLight ? '#8A8580' : 'rgba(255,255,255,0.5)', fontFamily: "'DM Sans', sans-serif" }}>{f.desc}</span>
              </div>
            </div>
          ))}
        </div>
        {!isLast && <SwipeArrow isLight={isLight} />}
        <ProgressBar index={index} total={total} isLight={isLight && !isGradient} />
      </div>
    );
  }

  // ── Detalhes slide (dark)
  if (slide.tipo === 'detalhes') {
    return (
      <div style={baseStyle}>
        <div style={contentStyle}>
          <TagLabel text={slide.tag} isLight={isLight} isGradient={isGradient} />
          <h2 style={headingStyle}>{slide.titulo}</h2>
          {slide.texto && <p style={{ ...bodyStyle, marginBottom: 12 }}>{slide.texto}</p>}
          {slide.itens?.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '8px 0', borderBottom: `1px solid ${borderColor}` }}>
              <span style={{ color: isLight ? BRAND_PRIMARY : BRAND_LIGHT, fontSize: 15, width: 18, textAlign: 'center', flexShrink: 0 }}>•</span>
              <p style={bodyStyle}>{item}</p>
            </div>
          ))}
        </div>
        {!isLast && <SwipeArrow isLight={isLight} />}
        <ProgressBar index={index} total={total} isLight={isLight && !isGradient} />
      </div>
    );
  }

  // ── Passos slide
  if (slide.tipo === 'passos') {
    return (
      <div style={baseStyle}>
        <div style={contentStyle}>
          <TagLabel text={slide.tag} isLight={isLight} isGradient={isGradient} />
          <h2 style={headingStyle}>{slide.titulo}</h2>
          {slide.passos?.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '14px 0', borderBottom: `1px solid ${borderColor}` }}>
              <span style={{ fontSize: 26, fontWeight: 300, color: isLight ? BRAND_PRIMARY : BRAND_LIGHT, minWidth: 34, lineHeight: '1', fontFamily: "'Playfair Display', serif" }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <span style={{ fontSize: 14, fontWeight: 600, color: textColor, fontFamily: "'DM Sans', sans-serif", display: 'block' }}>{p.titulo}</span>
                <span style={{ fontSize: 12, color: isLight ? '#8A8580' : 'rgba(255,255,255,0.5)', fontFamily: "'DM Sans', sans-serif" }}>{p.desc}</span>
              </div>
            </div>
          ))}
        </div>
        {!isLast && <SwipeArrow isLight={isLight} />}
        <ProgressBar index={index} total={total} isLight={isLight && !isGradient} />
      </div>
    );
  }

  // ── CTA slide (gradient, no arrow)
  if (slide.tipo === 'cta') {
    return (
      <div style={baseStyle}>
        <div style={{ ...contentStyle, alignItems: 'center', textAlign: 'center', padding: '28px 32px 48px' }}>
          <LogoLockup isLight={false} />
          <TagLabel text={slide.tag} isLight={false} isGradient={true} />
          <h2 style={{ ...headingStyle, color: '#fff', fontSize: 22 }}>{slide.texto_engajamento}</h2>
          <div style={{ display: 'inline-flex', alignItems: 'center', padding: '10px 24px', background: LIGHT_BG, color: BRAND_DARK, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 12, borderRadius: 24, marginTop: 16 }}>
            {slide.cta_texto || 'Salve para revisar!'}
          </div>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 12, fontFamily: "'DM Sans', sans-serif" }}>@vacatio.app</p>
        </div>
        <ProgressBar index={index} total={total} isLight={false} />
      </div>
    );
  }

  // Fallback
  return (
    <div style={baseStyle}>
      <div style={contentStyle}>
        <TagLabel text={slide.tag || ''} isLight={isLight} isGradient={isGradient} />
        {slide.titulo && <h2 style={headingStyle}>{slide.titulo}</h2>}
        {slide.texto && <p style={bodyStyle}>{slide.texto}</p>}
      </div>
      {!isLast && <SwipeArrow isLight={isLight} />}
      <ProgressBar index={index} total={total} isLight={isLight && !isGradient} />
    </div>
  );
}

// ─── Page Component ───

const GeradorPost = () => {
  const navigate = useNavigate();
  const [selectedLei, setSelectedLei] = useState('');
  const [artigos, setArtigos] = useState<{ numero: string; caput: string }[]>([]);
  const [selectedArtigo, setSelectedArtigo] = useState('');
  const [tipoConteudo, setTipoConteudo] = useState('curiosidade');
  const [loading, setLoading] = useState(false);
  const [loadingArtigos, setLoadingArtigos] = useState(false);
  const [carrossel, setCarrossel] = useState<CarrosselData | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const slidesRef = useRef<(HTMLDivElement | null)[]>([]);

  const lei = LEIS_CATALOG.find(l => l.tabela_nome === selectedLei);

  const handleLeiChange = useCallback(async (tabela: string) => {
    setSelectedLei(tabela);
    setSelectedArtigo('');
    setCarrossel(null);
    setLoadingArtigos(true);
    try {
      const data = await fetchArtigosLei('', tabela);
      setArtigos(data.slice(0, 500).map(a => ({ numero: a.numero, caput: a.caput })));
    } catch { setArtigos([]); }
    setLoadingArtigos(false);
  }, []);

  const handleGerar = async () => {
    if (!selectedLei || !selectedArtigo) return;
    setLoading(true);
    setCarrossel(null);
    try {
      const artigo = artigos.find(a => a.numero === selectedArtigo);
      const { data, error } = await supabase.functions.invoke('assistente-juridica', {
        body: {
          mode: 'carrossel_post',
          tabelaNome: selectedLei,
          artigoNumero: selectedArtigo,
          artigoTexto: artigo?.caput || selectedArtigo,
          leiNome: lei?.nome || '',
          tipoConteudo,
        },
      });
      if (error) throw error;
      const reply = data?.reply;
      if (!reply) throw new Error('Sem resposta');
      const parsed: CarrosselData = typeof reply === 'string' ? JSON.parse(reply.replace(/^```json\s*/i, '').replace(/\s*```$/i, '')) : reply;
      setCarrossel(parsed);
      setCurrentSlide(0);
    } catch (e) {
      console.error('Erro ao gerar carrossel:', e);
    }
    setLoading(false);
  };

  const downloadSlide = async (index: number) => {
    const el = slidesRef.current[index];
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 3, useCORS: true, backgroundColor: null });
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `slide-${index + 1}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const downloadAll = async () => {
    if (!carrossel) return;
    for (let i = 0; i < carrossel.slides.length; i++) {
      await downloadSlide(i);
      await new Promise(r => setTimeout(r, 500));
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div className="relative overflow-hidden px-4 pt-10 pb-8 sm:px-6" style={{ background: `linear-gradient(135deg, ${BRAND_DARK}, ${BRAND_PRIMARY})` }}>
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/5" />
        <ImageIcon className="absolute top-5 right-5 w-10 h-10 text-white/15 rotate-12" />
        <div className="relative max-w-2xl mx-auto z-10">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <h1 className="text-2xl text-white font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Gerador de Post</h1>
          <p className="text-white/70 text-sm mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>Crie carrosséis profissionais para Instagram</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 space-y-5">
        {/* Seletor de lei */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Selecione a lei</label>
          <Select value={selectedLei} onValueChange={handleLeiChange}>
            <SelectTrigger><SelectValue placeholder="Escolha uma lei..." /></SelectTrigger>
            <SelectContent className="max-h-60">
              {LEIS_CATALOG.map(l => (
                <SelectItem key={l.tabela_nome} value={l.tabela_nome}>{l.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Seletor de artigo */}
        {selectedLei && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Selecione o artigo</label>
            {loadingArtigos ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Carregando artigos...
              </div>
            ) : (
              <Select value={selectedArtigo} onValueChange={setSelectedArtigo}>
                <SelectTrigger><SelectValue placeholder="Escolha um artigo..." /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {artigos.map(a => (
                    <SelectItem key={a.numero} value={a.numero}>
                      {a.numero} — {a.caput.slice(0, 80)}{a.caput.length > 80 ? '...' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {/* Tipo de conteúdo */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">Tipo de conteúdo</label>
          <RadioGroup value={tipoConteudo} onValueChange={setTipoConteudo} className="grid grid-cols-1 gap-2">
            {TIPOS_CONTEUDO.map(t => (
              <div key={t.value} className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-accent/50 transition-colors">
                <RadioGroupItem value={t.value} id={t.value} className="mt-0.5" />
                <Label htmlFor={t.value} className="cursor-pointer flex-1">
                  <span className="text-sm font-medium block">{t.label}</span>
                  <span className="text-xs text-muted-foreground">{t.desc}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Botão gerar */}
        <Button
          onClick={handleGerar}
          disabled={!selectedLei || !selectedArtigo || loading}
          className="w-full text-white"
          style={{ background: BRAND_PRIMARY }}
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Gerando...</> : 'Gerar Carrossel'}
        </Button>

        {/* Preview dos slides */}
        {carrossel && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">
                Slide {currentSlide + 1} de {carrossel.slides.length}
              </p>
              <Button variant="outline" size="sm" onClick={downloadAll}>
                <Download className="w-4 h-4 mr-1" /> Baixar Todos
              </Button>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                disabled={currentSlide === 0}
                className="p-2 rounded-full bg-card border border-border disabled:opacity-30"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex-1 overflow-hidden rounded-xl border border-border bg-card" style={{ aspectRatio: `${SLIDE_W}/${SLIDE_H}`, position: 'relative' }}>
                {carrossel.slides.map((slide, i) => (
                  <div
                    key={i}
                    className={i === currentSlide ? 'block' : 'hidden'}
                    style={{
                      position: 'absolute', top: 0, left: 0, width: SLIDE_W, height: SLIDE_H,
                      transform: `scale(${1 / (SLIDE_W / 280)})`,
                      transformOrigin: 'top left',
                    }}
                  >
                    <SlideRenderer slide={slide} index={i} total={carrossel.slides.length} />
                  </div>
                ))}
              </div>

              <button
                onClick={() => setCurrentSlide(Math.min(carrossel.slides.length - 1, currentSlide + 1))}
                disabled={currentSlide === carrossel.slides.length - 1}
                className="p-2 rounded-full bg-card border border-border disabled:opacity-30"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Download individual */}
            <Button variant="outline" size="sm" onClick={() => downloadSlide(currentSlide)} className="w-full">
              <Download className="w-4 h-4 mr-1" /> Baixar Slide {currentSlide + 1}
            </Button>

            {/* Dots */}
            <div className="flex justify-center gap-1.5">
              {carrossel.slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${i === currentSlide ? 'bg-primary' : 'bg-muted'}`}
                  style={i === currentSlide ? { background: BRAND_PRIMARY } : {}}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Hidden full-size slides for export */}
      {carrossel && (
        <div className="fixed" style={{ left: '-9999px', top: 0 }}>
          {carrossel.slides.map((slide, i) => (
            <div
              key={`export-${i}`}
              ref={(el) => { slidesRef.current[i] = el; }}
              style={{ width: SLIDE_W, height: SLIDE_H }}
            >
              <SlideRenderer slide={slide} index={i} total={carrossel.slides.length} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GeradorPost;
