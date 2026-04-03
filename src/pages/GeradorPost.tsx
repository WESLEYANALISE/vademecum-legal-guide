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

interface SlideFeature { icone: string; label: string; desc: string; }
interface SlidePasso { titulo: string; desc: string; }

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

// ─── Design tokens ───
const WINE = 'hsl(340, 55%, 12%)';
const WINE_DARK = 'hsl(340, 30%, 8%)';
const WINE_MED = 'hsl(340, 40%, 15%)';
const IVORY = 'hsl(40, 15%, 95%)';
const IVORY_WARM = 'hsl(40, 20%, 93%)';
const GOLD = '#B8860B';

const SLIDE_W = 420;
const SLIDE_H = 525;

const TIPOS_CONTEUDO = [
  { value: 'curiosidade', label: 'Curiosidade', desc: '"Você sabia que..." — fatos surpreendentes' },
  { value: 'explicacao', label: 'Explicação', desc: 'Didática com exemplos do dia-a-dia' },
  { value: 'resumo_prova', label: 'Resumo pra Prova', desc: 'Pontos-chave para OAB e concursos' },
  { value: 'dica_pratica', label: 'Dica Prática', desc: 'Aplicação na prática profissional' },
  { value: 'comparacao', label: 'Comparação', desc: 'Antes vs Depois / Artigo X vs Artigo Y' },
];

// ─── Background & color helpers ───

function getSlideBackground(tipo: string): string {
  switch (tipo) {
    case 'hero': return `linear-gradient(165deg, ${WINE}, hsl(340, 45%, 18%))`;
    case 'problema': return WINE_DARK;
    case 'solucao': return `linear-gradient(165deg, ${WINE_DARK}, hsl(340, 35%, 14%))`;
    case 'features': return IVORY;
    case 'detalhes': return WINE_MED;
    case 'passos': return IVORY_WARM;
    case 'cta': return `linear-gradient(165deg, ${WINE}, hsl(30, 50%, 20%))`;
    default: return IVORY;
  }
}

function isDark(tipo: string): boolean {
  return ['hero', 'problema', 'solucao', 'detalhes', 'cta'].includes(tipo);
}

// ─── Slide Renderer ───

function SlideRenderer({ slide, index }: { slide: SlideData; index: number }) {
  const dark = isDark(slide.tipo);
  const textColor = dark ? '#fff' : WINE;
  const subColor = dark ? 'rgba(255,255,255,0.7)' : '#5a3040';

  const baseStyle: React.CSSProperties = {
    width: SLIDE_W, height: SLIDE_H,
    background: getSlideBackground(slide.tipo),
    display: 'flex', flexDirection: 'column',
    position: 'relative', overflow: 'hidden', boxSizing: 'border-box',
    fontFamily: "'DM Sans', Arial, sans-serif",
    boxShadow: 'inset 0 0 0 1px rgba(184,134,11,0.12)',
  };

  const headingFont: React.CSSProperties = {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontWeight: 700, lineHeight: 1.18, letterSpacing: -0.3,
    color: textColor, margin: 0,
    textShadow: dark ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
  };

  const bodyFont: React.CSSProperties = {
    fontFamily: "'DM Sans', Arial, sans-serif",
    fontWeight: 400, lineHeight: 1.5, color: subColor, margin: 0,
  };

  // Gold accent line at top
  const TopAccent = () => (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `rgba(184,134,11,0.35)` }} />
  );

  const Logo = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <img src={logoImg} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} crossOrigin="anonymous" />
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: textColor }}>Vacatio</div>
        <div style={{ fontSize: 8, color: dark ? 'rgba(255,255,255,0.45)' : GOLD }}>Vade Mecum 2026</div>
      </div>
    </div>
  );

  const Tag = () => (
    <span style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, letterSpacing: 2, color: dark ? GOLD : WINE, textTransform: 'uppercase', marginBottom: 10 }}>
      {slide.tag}
    </span>
  );

  const BottomBar = () => (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 30, background: WINE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#d4c9a8', fontSize: 10, letterSpacing: 1.5 }}>@vacatio.app</span>
    </div>
  );

  // ── HERO
  if (slide.tipo === 'hero') {
    return (
      <div style={baseStyle}>
        <TopAccent />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 36px 48px' }}>
          <Logo />
          <Tag />
          <h1 style={{ ...headingFont, fontSize: 24 }}>{slide.titulo}</h1>
          {slide.subtitulo && <p style={{ ...bodyFont, fontSize: 13, marginTop: 10 }}>{slide.subtitulo}</p>}
        </div>
        <BottomBar />
      </div>
    );
  }

  // ── PROBLEMA
  if (slide.tipo === 'problema') {
    return (
      <div style={baseStyle}>
        <TopAccent />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '36px 36px 48px' }}>
          <Tag />
          <h2 style={{ ...headingFont, fontSize: 19, marginBottom: 16 }}>{slide.titulo}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {slide.itens?.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ color: GOLD, fontSize: 13, marginTop: 1, flexShrink: 0 }}>⚠</span>
                <p style={{ ...bodyFont, fontSize: 12 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>
        <BottomBar />
      </div>
    );
  }

  // ── SOLUÇÃO
  if (slide.tipo === 'solucao') {
    return (
      <div style={baseStyle}>
        <TopAccent />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '36px 36px 48px' }}>
          <Tag />
          <h2 style={{ ...headingFont, fontSize: 19, marginBottom: 12 }}>{slide.titulo}</h2>
          {slide.texto && <p style={{ ...bodyFont, fontSize: 12, marginBottom: 14 }}>{slide.texto}</p>}
          {slide.citacao && (
            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: 14, borderLeft: `3px solid ${GOLD}` }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontStyle: 'italic', lineHeight: 1.5, fontFamily: "'Playfair Display', serif", margin: 0 }}>
                "{slide.citacao}"
              </p>
            </div>
          )}
        </div>
        <BottomBar />
      </div>
    );
  }

  // ── FEATURES
  if (slide.tipo === 'features') {
    return (
      <div style={baseStyle}>
        <TopAccent />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '36px 32px 48px' }}>
          <Tag />
          <h2 style={{ ...headingFont, fontSize: 18, marginBottom: 14 }}>{slide.titulo}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {slide.features?.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(184,134,11,0.06)', borderRadius: 8, padding: '8px 10px' }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{f.icone}</span>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: WINE, display: 'block' }}>{f.label}</span>
                  <span style={{ fontSize: 10, color: '#7a6a5a' }}>{f.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <BottomBar />
      </div>
    );
  }

  // ── DETALHES
  if (slide.tipo === 'detalhes') {
    return (
      <div style={baseStyle}>
        <TopAccent />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '36px 36px 48px' }}>
          <Tag />
          <h2 style={{ ...headingFont, fontSize: 19, marginBottom: 12 }}>{slide.titulo}</h2>
          {slide.texto && <p style={{ ...bodyFont, fontSize: 12, marginBottom: 12 }}>{slide.texto}</p>}
          {slide.itens?.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 6 }}>
              <span style={{ color: GOLD, fontSize: 12, marginTop: 1, flexShrink: 0 }}>●</span>
              <p style={{ ...bodyFont, fontSize: 12 }}>{item}</p>
            </div>
          ))}
        </div>
        <BottomBar />
      </div>
    );
  }

  // ── PASSOS
  if (slide.tipo === 'passos') {
    return (
      <div style={baseStyle}>
        <TopAccent />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '36px 32px 48px' }}>
          <Tag />
          <h2 style={{ ...headingFont, fontSize: 18, marginBottom: 14 }}>{slide.titulo}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {slide.passos?.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ ...headingFont, fontSize: 22, fontWeight: 300, color: GOLD, minWidth: 28, textShadow: 'none' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: WINE, display: 'block' }}>{p.titulo}</span>
                  <span style={{ fontSize: 10, color: '#7a6a5a' }}>{p.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <BottomBar />
      </div>
    );
  }

  // ── CTA
  if (slide.tipo === 'cta') {
    return (
      <div style={baseStyle}>
        <TopAccent />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '40px 36px 48px' }}>
          <Logo />
          <Tag />
          <h2 style={{ ...headingFont, fontSize: 19, color: '#fff', marginBottom: 18 }}>{slide.texto_engajamento}</h2>
          <div style={{ display: 'inline-flex', padding: '10px 24px', background: GOLD, color: '#fff', fontWeight: 700, fontSize: 12, borderRadius: 20 }}>
            {slide.cta_texto || 'Salve para revisar!'}
          </div>
        </div>
        <BottomBar />
      </div>
    );
  }

  // Fallback
  return (
    <div style={baseStyle}>
      <TopAccent />
      <div style={{ flex: 1, padding: '36px 36px 48px' }}>
        <Tag />
        {slide.titulo && <h2 style={{ ...headingFont, fontSize: 19 }}>{slide.titulo}</h2>}
        {slide.texto && <p style={{ ...bodyFont, fontSize: 12, marginTop: 8 }}>{slide.texto}</p>}
      </div>
      <BottomBar />
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

  const previewScale = 280 / SLIDE_W;

  return (
    <div className="min-h-screen bg-background pb-20">
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div className="relative overflow-hidden px-4 pt-10 pb-8 sm:px-6" style={{ background: `linear-gradient(135deg, ${WINE}, hsl(340, 45%, 18%))` }}>
        <ImageIcon className="absolute top-5 right-5 w-10 h-10 text-white/15 rotate-12" />
        <div className="relative max-w-2xl mx-auto z-10">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <h1 className="text-2xl text-white font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Gerador de Post</h1>
          <p className="text-white/70 text-sm mt-1">Crie carrosséis profissionais para Instagram</p>
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
          style={{ background: WINE }}
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

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                disabled={currentSlide === 0}
                className="p-2 rounded-full bg-card border border-border disabled:opacity-30"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div
                className="flex-1 overflow-hidden rounded-xl border border-border bg-card"
                style={{ aspectRatio: `${SLIDE_W}/${SLIDE_H}`, position: 'relative' }}
              >
                {carrossel.slides.map((slide, i) => (
                  <div
                    key={i}
                    className={i === currentSlide ? 'block' : 'hidden'}
                    style={{
                      position: 'absolute', top: 0, left: 0, width: SLIDE_W, height: SLIDE_H,
                      transform: `scale(${previewScale})`, transformOrigin: 'top left',
                    }}
                  >
                    <SlideRenderer slide={slide} index={i} />
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

            <Button variant="outline" size="sm" onClick={() => downloadSlide(currentSlide)} className="w-full">
              <Download className="w-4 h-4 mr-1" /> Baixar Slide {currentSlide + 1}
            </Button>

            <div className="flex justify-center gap-1.5">
              {carrossel.slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${i === currentSlide ? 'bg-primary' : 'bg-muted'}`}
                  style={i === currentSlide ? { background: WINE } : {}}
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
              <SlideRenderer slide={slide} index={i} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GeradorPost;
