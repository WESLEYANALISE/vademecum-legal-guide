import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Loader2, ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { LEIS_CATALOG } from '@/data/leisCatalog';
import { fetchArtigosLei } from '@/services/legislacaoService';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import html2canvas from 'html2canvas';
import logoImg from '@/assets/logo-vacatio.jpeg';

interface SlideData {
  tipo: string;
  titulo?: string;
  subtitulo?: string;
  titulo_esquerda?: string;
  itens_esquerda?: string[];
  titulo_direita?: string;
  itens_direita?: string[];
  texto?: string;
  itens?: string[];
  texto_engajamento?: string;
  texto_salvar?: string;
}

interface CarrosselData {
  titulo_viral: string;
  slides: SlideData[];
}

const SLIDE_W = 1080;
const SLIDE_H = 1350;

const GeradorPost = () => {
  const navigate = useNavigate();
  const [selectedLei, setSelectedLei] = useState('');
  const [artigos, setArtigos] = useState<{ numero: string; caput: string }[]>([]);
  const [selectedArtigo, setSelectedArtigo] = useState('');
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
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: null });
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
      {/* Header */}
      <div className="relative bg-gradient-to-br from-[hsl(340,55%,12%)] to-[hsl(340,45%,18%)] overflow-hidden px-4 pt-10 pb-8 sm:px-6">
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/5" />
        <ImageIcon className="absolute top-5 right-5 w-10 h-10 text-white/15 rotate-12" />
        <div className="relative max-w-2xl mx-auto z-10">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <h1 className="font-display text-2xl text-white font-bold">Gerador de Post</h1>
          <p className="text-white/70 text-sm mt-1">Crie carrosséis Instagram com artigos de lei</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 space-y-4">
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

        {/* Botão gerar */}
        <Button
          onClick={handleGerar}
          disabled={!selectedLei || !selectedArtigo || loading}
          className="w-full bg-[hsl(340,55%,12%)] hover:bg-[hsl(340,55%,18%)] text-white"
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

              <div className="flex-1 overflow-hidden rounded-xl border border-border bg-card">
                <div className="relative w-full" style={{ paddingBottom: `${(SLIDE_H / SLIDE_W) * 100}%` }}>
                  <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                    <div style={{ transform: `scale(${Math.min(1, 350 / SLIDE_W)}`, transformOrigin: 'top center' }}>
                      {carrossel.slides.map((slide, i) => (
                        <div
                          key={i}
                          ref={(el) => { slidesRef.current[i] = el; }}
                          className={i === currentSlide ? 'block' : 'hidden'}
                          style={{ width: SLIDE_W, height: SLIDE_H }}
                        >
                          <SlideRenderer slide={slide} leiNome={lei?.nome || ''} logoSrc={logoImg} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
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
                  className={`w-2 h-2 rounded-full transition-colors ${i === currentSlide ? 'bg-[hsl(340,55%,12%)]' : 'bg-muted'}`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Hidden full-size slides for export (all rendered but off-screen) */}
      {carrossel && (
        <div className="fixed" style={{ left: '-9999px', top: 0 }}>
          {carrossel.slides.map((slide, i) => (
            <div
              key={`export-${i}`}
              ref={(el) => { slidesRef.current[i] = el; }}
              style={{ width: SLIDE_W, height: SLIDE_H }}
            >
              <SlideRenderer slide={slide} leiNome={lei?.nome || ''} logoSrc={logoImg} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Slide Renderer ───

function SlideRenderer({ slide, leiNome, logoSrc }: { slide: SlideData; leiNome: string; logoSrc: string }) {
  const bg = 'hsl(40, 15%, 92%)';
  const wine = 'hsl(340, 55%, 12%)';
  const gold = '#B8860B';
  const baseStyle: React.CSSProperties = {
    width: SLIDE_W, height: SLIDE_H, background: bg, display: 'flex', flexDirection: 'column',
    fontFamily: 'Georgia, "Times New Roman", serif', color: wine, position: 'relative', overflow: 'hidden',
  };

  const LogoHeader = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '48px 56px 0' }}>
      <img src={logoSrc} alt="Vacatio" style={{ width: 56, height: 56, borderRadius: 12 }} crossOrigin="anonymous" />
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: wine }}>Vacatio</div>
        <div style={{ fontSize: 14, color: gold, fontFamily: 'Arial, sans-serif' }}>Vade Mecum 2026</div>
      </div>
    </div>
  );

  const Footer = () => (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: 64,
      background: wine, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ color: bg, fontSize: 18, fontFamily: 'Arial, sans-serif', letterSpacing: 2 }}>
        @vacatio.app
      </span>
    </div>
  );

  if (slide.tipo === 'capa') {
    return (
      <div style={baseStyle}>
        <LogoHeader />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 56px', gap: 24 }}>
          <div style={{ width: 80, height: 4, background: gold, borderRadius: 2 }} />
          <h1 style={{ fontSize: 52, fontWeight: 700, lineHeight: 1.2, color: wine }}>{slide.titulo}</h1>
          {slide.subtitulo && (
            <p style={{ fontSize: 28, color: gold, fontFamily: 'Arial, sans-serif' }}>{slide.subtitulo}</p>
          )}
          <p style={{ fontSize: 20, color: 'hsl(340, 30%, 40%)', fontFamily: 'Arial, sans-serif' }}>{leiNome}</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (slide.tipo === 'comparacao') {
    return (
      <div style={baseStyle}>
        <LogoHeader />
        <div style={{ flex: 1, display: 'flex', gap: 24, padding: '40px 56px 80px' }}>
          {/* Esquerda */}
          <div style={{ flex: 1, background: 'white', borderRadius: 20, padding: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: wine, borderBottom: `3px solid ${gold}`, paddingBottom: 12 }}>
              {slide.titulo_esquerda}
            </h3>
            {slide.itens_esquerda?.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ minWidth: 8, height: 8, borderRadius: '50%', background: gold, marginTop: 8 }} />
                <p style={{ fontSize: 18, lineHeight: 1.5, fontFamily: 'Arial, sans-serif', color: wine }}>{item}</p>
              </div>
            ))}
          </div>
          {/* Direita */}
          <div style={{ flex: 1, background: wine, borderRadius: 20, padding: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: bg, borderBottom: `3px solid ${gold}`, paddingBottom: 12 }}>
              {slide.titulo_direita}
            </h3>
            {slide.itens_direita?.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ minWidth: 8, height: 8, borderRadius: '50%', background: gold, marginTop: 8 }} />
                <p style={{ fontSize: 18, lineHeight: 1.5, fontFamily: 'Arial, sans-serif', color: bg }}>{item}</p>
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (slide.tipo === 'destaque') {
    return (
      <div style={baseStyle}>
        <LogoHeader />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 56px 80px', gap: 32 }}>
          <div style={{ background: `linear-gradient(135deg, ${wine}, hsl(340,45%,22%))`, borderRadius: 24, padding: 48, position: 'relative' }}>
            <div style={{ position: 'absolute', top: -2, left: 40, width: 60, height: 6, background: gold, borderRadius: 3 }} />
            <h2 style={{ fontSize: 32, fontWeight: 700, color: bg, marginBottom: 24 }}>{slide.titulo}</h2>
            <p style={{ fontSize: 22, lineHeight: 1.6, color: 'hsl(40, 15%, 85%)', fontFamily: 'Arial, sans-serif' }}>{slide.texto}</p>
          </div>
          {slide.itens?.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '0 16px' }}>
              <div style={{ minWidth: 10, height: 10, borderRadius: '50%', background: gold, marginTop: 8 }} />
              <p style={{ fontSize: 20, lineHeight: 1.5, fontFamily: 'Arial, sans-serif', color: wine }}>{item}</p>
            </div>
          ))}
        </div>
        <Footer />
      </div>
    );
  }

  if (slide.tipo === 'cta') {
    return (
      <div style={baseStyle}>
        <LogoHeader />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 56px 80px', textAlign: 'center', gap: 40 }}>
          <div style={{ width: 100, height: 4, background: gold, borderRadius: 2 }} />
          <h2 style={{ fontSize: 40, fontWeight: 700, color: wine, lineHeight: 1.3 }}>{slide.texto_engajamento}</h2>
          <div style={{
            background: gold, borderRadius: 16, padding: '20px 40px',
          }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: 'white', fontFamily: 'Arial, sans-serif' }}>
              {slide.texto_salvar || 'Salve para revisar!'}
            </span>
          </div>
          <p style={{ fontSize: 20, color: 'hsl(340, 30%, 40%)', fontFamily: 'Arial, sans-serif' }}>
            Siga @vacatio.app para mais conteúdo jurídico
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  // Generic/content slide
  return (
    <div style={baseStyle}>
      <LogoHeader />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 56px 80px', gap: 24 }}>
        {slide.titulo && <h2 style={{ fontSize: 36, fontWeight: 700, color: wine }}>{slide.titulo}</h2>}
        {slide.texto && <p style={{ fontSize: 22, lineHeight: 1.6, fontFamily: 'Arial, sans-serif', color: wine }}>{slide.texto}</p>}
        {slide.itens?.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ minWidth: 10, height: 10, borderRadius: '50%', background: gold, marginTop: 8 }} />
            <p style={{ fontSize: 20, lineHeight: 1.5, fontFamily: 'Arial, sans-serif', color: wine }}>{item}</p>
          </div>
        ))}
      </div>
      <Footer />
    </div>
  );
}

export default GeradorPost;
