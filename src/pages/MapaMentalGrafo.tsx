import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Brain, BookOpen, Lightbulb, GraduationCap, Search, Scale, Shield, AlertTriangle, Gavel, Target, ChevronDown, ChevronUp, Sparkles, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { getLeisCatalog, fetchArtigosPaginado } from '@/services/legislacaoService';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

/* ───── types ───── */
interface MindMapTree {
  titulo: string;
  definicao: string;
  exemplo: string;
  termos_chave: string[];
  dica_prova?: string;
  filhos?: MindMapTree[];
}

interface ArtigoSimple {
  numero: string;
  caput: string;
}

function parseMindMapReply(raw: unknown): MindMapTree {
  if (raw && typeof raw === 'object' && 'titulo' in (raw as Record<string, unknown>)) {
    return raw as MindMapTree;
  }
  const content = String(raw ?? '').trim();
  if (!content) throw new Error('Resposta vazia');
  const cleaned = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  const jsonText = firstBrace >= 0 && lastBrace > firstBrace ? cleaned.slice(firstBrace, lastBrace + 1) : cleaned;
  const parsed = JSON.parse(jsonText) as MindMapTree;
  if (!parsed?.titulo || !Array.isArray(parsed?.filhos)) throw new Error('Resposta inválida');
  return parsed;
}

/* ───── icon picker based on keywords ───── */
const ICON_MAP: { keywords: string[]; icon: typeof Brain; color: string }[] = [
  { keywords: ['princípio', 'fundament', 'base', 'pilar'], icon: Scale, color: 'text-primary' },
  { keywords: ['exceção', 'excepcional', 'ressalva', 'salvo', 'exclu'], icon: Shield, color: 'text-emerald-400' },
  { keywords: ['pena', 'sanção', 'punição', 'efeito', 'consequência'], icon: AlertTriangle, color: 'text-amber-400' },
  { keywords: ['jurisprudência', 'súmula', 'tribunal', 'stf', 'stj'], icon: Gavel, color: 'text-blue-400' },
  { keywords: ['prova', 'concurso', 'oab', 'pegadinha', 'dica'], icon: Target, color: 'text-red-400' },
  { keywords: ['conceito', 'definição', 'noção'], icon: BookOpen, color: 'text-violet-400' },
  { keywords: ['exemplo', 'aplicação', 'prático', 'caso'], icon: Lightbulb, color: 'text-yellow-400' },
];

function pickIcon(titulo: string) {
  const lower = titulo.toLowerCase();
  for (const entry of ICON_MAP) {
    if (entry.keywords.some(k => lower.includes(k))) return entry;
  }
  return { icon: Sparkles, color: 'text-primary' };
}

/* ───── PDF export ───── */
async function exportMapaMentalPdf(tree: MindMapTree, leiNome: string, artigo: string) {
  const toastId = toast.loading('Gerando PDF...');
  try {
    const { default: jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = pdf.internal.pageSize.getWidth();
    const H = pdf.internal.pageSize.getHeight();
    const M = 15;
    const cw = W - M * 2;
    const maxY = H - 18;

    // Colors
    const gold: [number, number, number] = [234, 179, 8];
    const white: [number, number, number] = [230, 230, 230];
    const lightGray: [number, number, number] = [170, 170, 170];
    const darkBg: [number, number, number] = [12, 14, 20];
    const cardBg: [number, number, number] = [20, 23, 32];
    const softGray: [number, number, number] = [100, 100, 100];
    const blue: [number, number, number] = [96, 165, 250];
    const green: [number, number, number] = [52, 211, 153];
    const amber: [number, number, number] = [251, 191, 36];
    const violet: [number, number, number] = [167, 139, 250];

    let pageNum = 0;

    const newPage = () => {
      if (pageNum > 0) pdf.addPage();
      pageNum++;
      pdf.setFillColor(...darkBg);
      pdf.rect(0, 0, W, H, 'F');
    };

    const addFooter = () => {
      pdf.setDrawColor(...softGray);
      pdf.setLineWidth(0.2);
      pdf.line(M, H - 12, W - M, H - 12);
      pdf.setFontSize(7);
      pdf.setTextColor(...softGray);
      pdf.text('Vacatio  |  Mapa Mental', M, H - 7);
      pdf.text(`${pageNum}`, W - M, H - 7, { align: 'right' });
    };

    const wrap = (text: string, maxW: number, fs: number) => {
      pdf.setFontSize(fs);
      return pdf.splitTextToSize(text || '', maxW);
    };

    const drawSidebarSection = (
      y: number, title: string, text: string, sideColor: [number, number, number],
      fontSize: number, italic?: boolean
    ): number => {
      const textLines = wrap(text, cw - 22, fontSize);
      const blockH = textLines.length * (fontSize * 0.48) + 14;

      if (y + blockH > maxY) {
        addFooter();
        newPage();
        y = 18;
      }

      // Card background
      pdf.setFillColor(...cardBg);
      pdf.roundedRect(M, y, cw, blockH, 2, 2, 'F');
      // Sidebar accent
      pdf.setFillColor(...sideColor);
      pdf.roundedRect(M, y, 3, blockH, 1.5, 1.5, 'F');

      // Title
      pdf.setFontSize(7.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...sideColor);
      pdf.text(title.toUpperCase(), M + 7, y + 6);

      // Body
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', italic ? 'italic' : 'normal');
      const tc = italic ? lightGray : white;
      pdf.setTextColor(tc[0], tc[1], tc[2]);
      let ty = y + 12;
      textLines.forEach((line: string) => {
        pdf.text(line, M + 7, ty);
        ty += fontSize * 0.48;
      });

      return y + blockH + 4;
    };

    // ════════════════════ PAGE 1: COVER ════════════════════
    newPage();

    // Gold accent bar at top
    pdf.setFillColor(...gold);
    pdf.rect(0, 0, W, 3, 'F');

    // Title block
    let y = 20;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...lightGray);
    pdf.text(leiNome.toUpperCase(), M, y);
    y += 8;

    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...gold);
    const coverTitleLines = wrap(artigo, cw, 20);
    coverTitleLines.forEach((line: string) => { pdf.text(line, M, y); y += 9; });
    y += 2;

    // Decorative line
    pdf.setDrawColor(...gold);
    pdf.setLineWidth(0.6);
    pdf.line(M, y, M + 40, y);
    y += 8;

    // Root title
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...white);
    const rootTitleLines = wrap(tree.titulo, cw, 13);
    rootTitleLines.forEach((line: string) => { pdf.text(line, M, y); y += 6.5; });
    y += 4;

    // Root definition
    y = drawSidebarSection(y, 'Visao Geral', tree.definicao, blue, 9.5);

    // Root example
    if (tree.exemplo) {
      y = drawSidebarSection(y, 'Exemplo Pratico', tree.exemplo, green, 9, true);
    }

    // Key terms as inline pills
    if (tree.termos_chave?.length) {
      if (y + 18 > maxY) { addFooter(); newPage(); y = 18; }
      pdf.setFontSize(7.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...violet);
      pdf.text('TERMOS-CHAVE', M, y + 4);
      y += 9;
      let tx = M;
      tree.termos_chave.forEach((t: string) => {
        const tw = pdf.getTextWidth(t) + 6;
        if (tx + tw > W - M) { tx = M; y += 7; }
        if (y > maxY) { addFooter(); newPage(); y = 18; tx = M; }
        pdf.setFillColor(30, 33, 48);
        pdf.roundedRect(tx, y - 3.5, tw, 6, 1.5, 1.5, 'F');
        pdf.setFontSize(7.5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...white);
        pdf.text(t, tx + 3, y + 0.5);
        tx += tw + 3;
      });
      y += 10;
    }

    // Exam tip on cover
    if (tree.dica_prova) {
      y = drawSidebarSection(y, 'Dica para Prova', tree.dica_prova, amber, 9);
    }

    // Table of contents
    if (tree.filhos?.length) {
      if (y + 20 > maxY) { addFooter(); newPage(); y = 18; }
      y += 4;
      pdf.setDrawColor(40, 43, 55);
      pdf.setLineWidth(0.3);
      pdf.line(M, y, W - M, y);
      y += 8;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...gold);
      pdf.text('INDICE DE TOPICOS', M, y);
      y += 7;

      tree.filhos.forEach((child, i) => {
        if (y > maxY - 6) { addFooter(); newPage(); y = 18; }
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...white);
        pdf.text(`${String(i + 1).padStart(2, '0')}`, M, y);
        pdf.text(child.titulo, M + 10, y);
        pdf.setTextColor(...softGray);
        pdf.text(`pag. ${i + 2}`, W - M, y, { align: 'right' });
        y += 6;
      });
    }

    addFooter();

    // ════════════════════ TOPIC PAGES ════════════════════
    tree.filhos?.forEach((node, idx) => {
      newPage();

      // Gold accent bar
      pdf.setFillColor(...gold);
      pdf.rect(0, 0, W, 2, 'F');

      // Breadcrumb
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...softGray);
      pdf.text(`${leiNome}  >  ${artigo}  >  Topico ${idx + 1}/${tree.filhos!.length}`, M, 10);

      let y = 18;

      // Topic number badge
      pdf.setFillColor(...gold);
      pdf.roundedRect(M, y, 10, 10, 2, 2, 'F');
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...darkBg);
      pdf.text(String(idx + 1).padStart(2, '0'), M + 2.5, y + 7.2);

      // Topic title
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...white);
      const topicTitleLines = wrap(node.titulo, cw - 18, 14);
      let titleY = y + 4;
      topicTitleLines.forEach((line: string) => { pdf.text(line, M + 14, titleY); titleY += 7; });
      y = titleY + 6;

      // Definition
      y = drawSidebarSection(y, 'Definicao', node.definicao, blue, 10);

      // Example
      if (node.exemplo) {
        y = drawSidebarSection(y, 'Exemplo Pratico', node.exemplo, green, 9, true);
      }

      // Key terms
      if (node.termos_chave?.length) {
        if (y + 16 > maxY) { addFooter(); newPage(); y = 18; }
        pdf.setFontSize(7.5);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...violet);
        pdf.text('TERMOS-CHAVE', M + 4, y + 4);
        y += 9;
        let tx = M + 4;
        node.termos_chave.forEach((t: string) => {
          const tw = pdf.getTextWidth(t) + 6;
          if (tx + tw > W - M) { tx = M + 4; y += 7; }
          if (y > maxY) { addFooter(); newPage(); y = 18; tx = M + 4; }
          pdf.setFillColor(30, 33, 48);
          pdf.roundedRect(tx, y - 3.5, tw, 6, 1.5, 1.5, 'F');
          pdf.setFontSize(7.5);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(...white);
          pdf.text(t, tx + 3, y + 0.5);
          tx += tw + 3;
        });
        y += 10;
      }

      // Exam tip
      if (node.dica_prova) {
        y = drawSidebarSection(y, 'Dica para Prova', node.dica_prova, amber, 9);
      }

      // Sub-nodes
      if (node.filhos?.length) {
        if (y + 10 > maxY) { addFooter(); newPage(); y = 18; }
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...gold);
        pdf.text('DESDOBRAMENTOS', M + 4, y);
        y += 6;

        node.filhos.forEach((sub) => {
          const subDefLines = wrap(sub.definicao, cw - 26, 8.5);
          const subExLines = sub.exemplo ? wrap(sub.exemplo, cw - 26, 8) : [];
          const blockH = 10 + subDefLines.length * 4 + (subExLines.length ? subExLines.length * 3.8 + 6 : 0);

          if (y + blockH > maxY) { addFooter(); newPage(); y = 18; }

          pdf.setFillColor(25, 28, 38);
          pdf.roundedRect(M + 4, y, cw - 8, blockH, 2, 2, 'F');
          pdf.setFillColor(...violet);
          pdf.roundedRect(M + 4, y, 2.5, blockH, 1, 1, 'F');

          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(...white);
          pdf.text(sub.titulo, M + 10, y + 6);

          let sy = y + 11;
          pdf.setFontSize(8.5);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(...lightGray);
          subDefLines.forEach((line: string) => { pdf.text(line, M + 10, sy); sy += 4; });

          if (subExLines.length) {
            sy += 2;
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'italic');
            pdf.setTextColor(140, 140, 150);
            subExLines.forEach((line: string) => { pdf.text(line, M + 10, sy); sy += 3.8; });
          }

          y += blockH + 3;
        });
      }

      addFooter();
    });

    const fileName = `mapa-mental-${artigo.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.pdf`;
    pdf.save(fileName);
    toast.success('PDF exportado!', { id: toastId });
  } catch (err) {
    console.error(err);
    toast.error('Erro ao gerar PDF', { id: toastId });
  }
}

const CARD_COLORS = [
  { border: 'border-primary/40', bg: 'bg-primary/5' },
  { border: 'border-violet-500/40', bg: 'bg-violet-500/5' },
  { border: 'border-blue-500/40', bg: 'bg-blue-500/5' },
  { border: 'border-emerald-500/40', bg: 'bg-emerald-500/5' },
  { border: 'border-amber-500/40', bg: 'bg-amber-500/5' },
  { border: 'border-red-500/40', bg: 'bg-red-500/5' },
];

/* ───── Slide component for a single topic ───── */
function TopicSlide({ node, index, total, isRoot }: { node: MindMapTree; index: number; total: number; isRoot?: boolean }) {
  const iconInfo = pickIcon(node.titulo);
  const Icon = iconInfo.icon;

  return (
    <div className="w-full h-full overflow-y-auto px-4 py-5 space-y-4 scrollbar-thin">
      {/* Slide indicator */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          {isRoot ? 'Visão Geral' : `Tópico ${index}/${total}`}
        </span>
      </div>

      {/* Title block */}
      <div className={`rounded-2xl p-5 border ${isRoot ? 'border-primary/30 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent' : 'border-border bg-card'}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${isRoot ? 'bg-primary' : 'bg-card border border-border'}`}>
            {isRoot ? <Brain className="w-6 h-6 text-primary-foreground" /> : <Icon className={`w-5 h-5 ${iconInfo.color}`} />}
          </div>
          <h2 className="font-display text-base font-bold text-foreground leading-tight flex-1">{node.titulo}</h2>
        </div>

        {/* Definition — always expanded */}
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-bold text-foreground/70 uppercase tracking-wider">Definição</span>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">{node.definicao}</p>
        </div>
      </div>

      {/* Example — always expanded */}
      {node.exemplo && (
        <div className="rounded-xl bg-card border border-border p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Lightbulb className="w-4 h-4 text-primary" />
            <span className="text-[11px] font-bold text-foreground/70 uppercase tracking-wider">Exemplo Prático</span>
          </div>
          <p className="text-sm text-foreground/70 leading-relaxed italic">{node.exemplo}</p>
        </div>
      )}

      {/* Key terms — always expanded */}
      {node.termos_chave?.length > 0 && (
        <div className="px-1">
          <div className="flex items-center gap-1.5 mb-2">
            <GraduationCap className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-[11px] font-bold text-foreground/70 uppercase tracking-wider">Termos-Chave</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {node.termos_chave.map((t, i) => (
              <Badge key={i} variant="secondary" className="text-[11px] px-2.5 py-1">{t}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Exam tip — always expanded */}
      {node.dica_prova && (
        <div className="rounded-xl bg-primary/10 border border-primary/20 p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider">Dica para Prova</span>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">{node.dica_prova}</p>
        </div>
      )}

      {/* Sub-nodes — always expanded */}
      {node.filhos && node.filhos.length > 0 && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Desdobramentos</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          {node.filhos.map((sub, i) => {
            const subIcon = pickIcon(sub.titulo);
            const SubIcon = subIcon.icon;
            return (
              <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <SubIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${subIcon.color}`} />
                  <h4 className="text-sm font-semibold text-foreground">{sub.titulo}</h4>
                </div>
                <p className="text-xs text-foreground/70 leading-relaxed pl-6">{sub.definicao}</p>
                {sub.exemplo && (
                  <div className="ml-6 flex gap-1.5 items-start bg-primary/5 rounded-lg p-2.5">
                    <Lightbulb className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] text-foreground/60 italic leading-relaxed">{sub.exemplo}</p>
                  </div>
                )}
                {sub.termos_chave?.length > 0 && (
                  <div className="flex flex-wrap gap-1 pl-6">
                    {sub.termos_chave.map((t, j) => (
                      <span key={j} className="text-[9px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

type View = 'select-lei' | 'select-artigo' | 'loading' | 'grafo';

/* ───── page ───── */
const MapaMentalGrafo = () => {
  const navigate = useNavigate();
  const catalog = getLeisCatalog();

  const [view, setView] = useState<View>('select-lei');
  const [selectedLei, setSelectedLei] = useState<string | null>(null);
  const [artigos, setArtigos] = useState<ArtigoSimple[]>([]);
  const [artigosLoading, setArtigosLoading] = useState(false);
  const [searchArtigo, setSearchArtigo] = useState('');
  const [selectedArtigo, setSelectedArtigo] = useState<ArtigoSimple | null>(null);
  const [tree, setTree] = useState<MindMapTree | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const selectedLeiInfo = catalog.find((l) => l.tabela_nome === selectedLei);

  const slides = useMemo(() => {
    if (!tree) return [];
    const all: { node: MindMapTree; isRoot: boolean }[] = [{ node: tree, isRoot: true }];
    tree.filhos?.forEach((child) => all.push({ node: child, isRoot: false }));
    return all;
  }, [tree]);

  const goNext = useCallback(() => setSlideIndex(i => Math.min(i + 1, slides.length - 1)), [slides.length]);
  const goPrev = useCallback(() => setSlideIndex(i => Math.max(i - 1, 0)), []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => setTouchStart(e.touches[0].clientX), []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { diff > 0 ? goNext() : goPrev(); }
    setTouchStart(null);
  }, [touchStart, goNext, goPrev]);

  const handleSelectLei = async (tabela: string) => {
    setSelectedLei(tabela);
    setView('select-artigo');
    setArtigosLoading(true);
    try {
      const data = await fetchArtigosPaginado(tabela, 0, 2000);
      setArtigos(data.map((a: any) => ({ numero: a.numero, caput: a.caput })));
    } catch (err) {
      console.error(err);
    } finally {
      setArtigosLoading(false);
    }
  };

  const filteredArtigos = useMemo(() => {
    if (!searchArtigo.trim()) return artigos;
    const q = searchArtigo.toLowerCase();
    return artigos.filter((a) => a.numero.toLowerCase().includes(q) || a.caput.toLowerCase().includes(q));
  }, [artigos, searchArtigo]);

  const handleSelectArtigo = async (artigo: ArtigoSimple) => {
    setSelectedArtigo(artigo);
    setView('loading');
    setTree(null);
    setSlideIndex(0);

    const tabela = selectedLei!;
    const leiNome = selectedLeiInfo?.nome || tabela;

    const { data: cached } = await supabase
      .from('artigo_ai_cache')
      .select('conteudo')
      .eq('tabela_nome', tabela)
      .eq('artigo_numero', artigo.numero)
      .eq('modo', 'mapa_mental_grafo')
      .maybeSingle();

    if (cached?.conteudo) {
      try {
        setTree(JSON.parse(cached.conteudo));
        setView('grafo');
        return;
      } catch { /* regenerate */ }
    }

    try {
      const { data, error } = await supabase.functions.invoke('assistente-juridica', {
        body: {
          mode: 'mapa_mental_grafo',
          leiNome,
          artigoNumero: artigo.numero,
          artigoTexto: artigo.caput,
          tabelaNome: tabela,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const reply = data?.reply ?? data?.response ?? data?.resposta ?? data;
      if (!reply) throw new Error('Resposta vazia da IA');
      const parsed = parseMindMapReply(reply);
      setTree(parsed);
      const { error: upsertErr } = await supabase.from('artigo_ai_cache').upsert({
        tabela_nome: tabela,
        artigo_numero: artigo.numero,
        modo: 'mapa_mental_grafo',
        conteudo: JSON.stringify(parsed),
      }, { onConflict: 'tabela_nome,artigo_numero,modo' } as any);
      if (upsertErr) console.error('Cache upsert error:', upsertErr);
    } catch (err: any) {
      console.error('Erro ao gerar mapa mental:', err);
      toast.error(err?.message || 'Erro ao gerar mapa mental. Tente novamente.');
      setView('select-artigo');
      return;
    }
    setView('grafo');
  };

  const handleBack = () => {
    if (view === 'grafo') { setView('select-artigo'); setTree(null); }
    else if (view === 'select-artigo') { setView('select-lei'); setSelectedLei(null); setArtigos([]); setSearchArtigo(''); }
    else navigate(-1);
  };

  /* ───── view: seletor de lei ───── */
  if (view === 'select-lei') {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <Brain className="w-5 h-5 text-primary" />
          <h1 className="font-display text-lg font-bold text-foreground">Mapa Mental</h1>
        </header>
        <div className="p-4">
          <p className="text-sm text-muted-foreground mb-4">Selecione uma lei para ver os artigos:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {catalog.map((lei) => (
              <button
                key={lei.tabela_nome}
                onClick={() => handleSelectLei(lei.tabela_nome)}
                className="text-left p-4 rounded-xl border border-border bg-card hover:bg-secondary/60 hover:border-primary/40 transition-all"
              >
                <p className="font-semibold text-sm text-foreground">{lei.nome}</p>
                <p className="text-xs text-muted-foreground mt-1">{lei.sigla} — {lei.descricao}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ───── view: seletor de artigo ───── */
  if (view === 'select-artigo') {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={handleBack} className="p-2 rounded-full hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <Brain className="w-5 h-5 text-primary" />
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-sm font-bold text-foreground truncate">{selectedLeiInfo?.nome}</h1>
            <p className="text-xs text-muted-foreground">Selecione um artigo</p>
          </div>
        </header>
        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar artigo..." value={searchArtigo} onChange={(e) => setSearchArtigo(e.target.value)} className="pl-10" />
          </div>
          {artigosLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-2">
              {filteredArtigos.map((art) => (
                <button key={art.numero} onClick={() => handleSelectArtigo(art)} className="w-full text-left p-3 rounded-xl border border-border bg-card hover:bg-secondary/60 hover:border-primary/40 transition-all">
                  <p className="text-xs font-bold text-primary">{art.numero}</p>
                  <p className="text-xs text-foreground/70 mt-1 line-clamp-2">{art.caput}</p>
                </button>
              ))}
              {filteredArtigos.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum artigo encontrado.</p>}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ───── view: loading ───── */
  if (view === 'loading') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <Brain className="w-12 h-12 text-primary animate-pulse" />
          <Loader2 className="w-6 h-6 animate-spin text-primary absolute -bottom-1 -right-1" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">{selectedArtigo?.numero}</p>
          <p className="text-xs text-muted-foreground mt-1">Gerando mapa mental completo...</p>
        </div>
      </div>
    );
  }

  /* ───── view: mapa mental em slides ───── */

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex-shrink-0 bg-card/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={handleBack} className="p-2 rounded-full hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <Brain className="w-5 h-5 text-primary" />
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-sm font-bold text-foreground truncate">{selectedArtigo?.numero}</h1>
          <p className="text-xs text-muted-foreground truncate">{selectedLeiInfo?.nome}</p>
        </div>
        {tree && (
          <button
            onClick={() => exportMapaMentalPdf(tree, selectedLeiInfo?.nome || '', selectedArtigo?.numero || '')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            PDF
          </button>
        )}
      </header>

      {tree && slides.length > 0 ? (
        <>
          {/* Slide content */}
          <div
            className="flex-1 overflow-hidden relative"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={slideIndex}
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -60 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 overflow-y-auto"
              >
                <TopicSlide
                  node={slides[slideIndex].node}
                  index={slideIndex}
                  total={slides.length - 1}
                  isRoot={slides[slideIndex].isRoot}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom navigation bar */}
          <div className="flex-shrink-0 border-t border-border bg-card px-4 py-3 flex items-center justify-between gap-4">
            <button
              onClick={goPrev}
              disabled={slideIndex === 0}
              className="p-2.5 rounded-xl bg-secondary hover:bg-secondary/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>

            {/* Dots / progress */}
            <div className="flex items-center gap-1.5 overflow-hidden">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlideIndex(i)}
                  className={`rounded-full transition-all duration-200 ${
                    i === slideIndex ? 'w-6 h-2 bg-primary' : 'w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={goNext}
              disabled={slideIndex === slides.length - 1}
              className="p-2.5 rounded-xl bg-secondary hover:bg-secondary/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Erro ao gerar mapa mental. Tente novamente.</p>
        </div>
      )}
    </div>
  );
};

export default MapaMentalGrafo;
