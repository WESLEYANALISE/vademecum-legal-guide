import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, Star, Highlighter, Copy, Plus, Minus, Type, MessageSquare, ChevronUp, ChevronDown, ChevronRight, ExternalLink, Volume2, Pause, Target, StickyNote, MessageCircle, Loader2, Share2, Network, BookOpen, Layers, Sparkles, GraduationCap, Play } from 'lucide-react';
import AnotacoesSheet from './AnotacoesSheet';
import PerguntarSheet from './PerguntarSheet';
import GrafoOverlay from './GrafoOverlay';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import ReactMarkdown from 'react-markdown';
import type { ArtigoLei } from '@/data/mockData';
import brasaoImg from '@/assets/brasao-republica.png';
import { useIsDesktop } from '@/hooks/use-desktop';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHighlights, type Highlight } from '@/hooks/useHighlights';
import HighlightColorBar from './HighlightColorBar';
import HighlightCommentPanel from './HighlightCommentPanel';
import { supabase } from '@/integrations/supabase/client';
import { buildPlanaltoArticleUrl } from '@/services/legislacaoService';
import ShareButtons from './ShareButtons';
import VideoaulaSheet from './VideoaulaSheet';
import ResumoSelectorSheet from './ResumoSelectorSheet';

export interface ModificationInfo {
  tipo: string;        // "Incluído", "Alterada", etc.
  referencia: string;  // "Incluído pela Lei Complementar nº 225, de 2026"
  leiNome: string;     // "Lei Complementar nº 225, de 2026"
  parteModificada: string; // "Artigo inteiro", "§ 4º", "Inciso II", etc.
  linhasModificadas: number[]; // indices of modified lines
}

interface ArtigoBottomSheetProps {
  artigo: ArtigoLei | null;
  onClose: () => void;
  isFavorito?: boolean;
  onToggleFavorito?: () => void;
  showNomenJuris?: boolean;
  tabelaNome?: string;
  forceShowRedacao?: boolean;
  modificationInfo?: ModificationInfo | null;
}

function stripRedacao(text: string): string {
  return text.replace(/\s*\((?:Redação|Incluído|Acrescido|Alterado|Vide|Regulamento|Vigência|Vetado)[^)]*\)/gi, '');
}

function isLineRevogado(line: string): boolean {
  return /\(Revogado[^)]*\)/i.test(line);
}

function highlightTermos(text: string, showRedacao?: boolean): React.ReactNode[] {
  // Pattern for ALL metadata references (shown in yellow, togglable via eye icon)
  const redacaoPattern = /\((?:Redação|Incluído|Acrescido|Alterado|Vide|Regulamento|Vigência|Revogado|Vetado)[^)]*\)/gi;

  if (showRedacao) {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let m: RegExpExecArray | null;
    redacaoPattern.lastIndex = 0;
    while ((m = redacaoPattern.exec(text)) !== null) {
      if (m.index > lastIndex) parts.push(...highlightTermosOnly(text.slice(lastIndex, m.index)));
      parts.push(
        <span key={`r${m.index}`} className="text-yellow-400 text-xs font-normal bg-yellow-400/10 rounded px-0.5">
          {m[0]}
        </span>
      );
      lastIndex = m.index + m[0].length;
    }
    if (lastIndex < text.length) parts.push(...highlightTermosOnly(text.slice(lastIndex)));
    return parts.length > 0 ? parts : highlightTermosOnly(text);
  }
  return highlightTermosOnly(text);
}

function highlightTermosOnly(text: string): React.ReactNode[] {
  const patterns = [
    /^(Art\.\s*\d+[º°]?(?:-[A-Z])?)(\s*[–-]\s*)?/i,
    /^(§\s*\d+[º°]?(?:-[A-Z])?)(\s*[.–-]?\s*)?/i,
    /^(Parágrafo\s+único)(\.?\s*[–-]?\s*)?/i,
    /^([IVXLC]+\s*[-–.])\s*/i,
    /^([a-z]\))\s*/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const fullMatch = match[0];
    const leadingToken = match[1] || fullMatch;
    const separator = fullMatch.slice(leadingToken.length);
    const rest = text.slice(fullMatch.length);
    const parts: React.ReactNode[] = [];
    parts.push(<span key="token" className="text-primary-light font-bold">{leadingToken}</span>);
    if (separator) parts.push(<span key="sep">{separator}</span>);
    if (rest) parts.push(rest);
    return parts;
  }
  return [text];
}

function classifyLine(line: string): { type: 'nomen' | 'caput' | 'inciso' | 'alinea' | 'paragrafo' | 'text'; text: string } {
  if (/^[IVXLC]+\s*[-–.]\s*/i.test(line)) return { type: 'inciso', text: line };
  if (/^[a-z]\)\s*/i.test(line)) return { type: 'alinea', text: line };
  if (/^(§\s*\d+[º°]?\s*[-–.]?\s*|Parágrafo\s+único)/i.test(line)) return { type: 'paragrafo', text: line };
  return { type: 'text', text: line };
}

/** Apply highlight marks over existing React nodes for a given line */
function applyHighlightsToText(
  nodes: React.ReactNode[],
  lineHighlights: Highlight[],
  onRemove: (id: string) => void,
  highlightMode: boolean,
  onHoverHighlight?: (id: string | null, rect?: DOMRect) => void,
  onTapHighlight?: (id: string, rect: DOMRect) => void,
): React.ReactNode[] {
  if (lineHighlights.length === 0) return nodes;

  const flatText = nodes.map(n => (typeof n === 'string' ? n : (n && typeof n === 'object' && 'props' in n ? (n as any).props.children : ''))).join('');
  const sorted = [...lineHighlights].sort((a, b) => a.startOffset - b.startOffset);

  type Segment = { start: number; end: number; color?: string; id?: string; hasComment?: boolean };
  const segments: Segment[] = [];
  let cursor = 0;
  for (const h of sorted) {
    if (h.startOffset > cursor) segments.push({ start: cursor, end: h.startOffset });
    segments.push({ start: h.startOffset, end: h.endOffset, color: h.color, id: h.id, hasComment: !!(h.comment && h.comment.trim()) });
    cursor = h.endOffset;
  }
  if (cursor < flatText.length) segments.push({ start: cursor, end: flatText.length });

  const result: React.ReactNode[] = [];

  let tokenEnd = 0;
  let tokenNodes: React.ReactNode[] = [];
  for (const n of nodes) {
    if (typeof n !== 'string' && n && typeof n === 'object' && 'props' in n) {
      const len = ((n as any).props.children as string)?.length || 0;
      tokenNodes.push(n);
      tokenEnd += len;
    } else {
      break;
    }
  }

  for (const seg of segments) {
    const segText = flatText.slice(seg.start, seg.end);
    if (!segText) continue;

    if (seg.end <= tokenEnd && !seg.color) {
      if (seg.start === 0) result.push(...tokenNodes);
      continue;
    }

    if (seg.start === 0 && !seg.color && tokenNodes.length > 0) {
      result.push(...tokenNodes);
      const remainder = segText.slice(tokenEnd);
      if (remainder) result.push(remainder);
      continue;
    }

    if (seg.color) {
      result.push(
        <mark
          key={`hl-${seg.id}`}
          style={{ backgroundColor: seg.color, color: 'white', borderRadius: '2px', padding: '0 1px' }}
          className={`${highlightMode ? 'cursor-pointer' : 'cursor-default'} ${seg.hasComment ? 'underline decoration-dotted decoration-white/50' : ''}`}
          onClick={highlightMode ? (e) => { e.stopPropagation(); onRemove(seg.id!); } : (e) => {
            if (seg.hasComment && onTapHighlight) {
              e.stopPropagation();
              const rect = (e.target as HTMLElement).getBoundingClientRect();
              onTapHighlight(seg.id!, rect);
            }
          }}
          onMouseEnter={!highlightMode && seg.hasComment && onHoverHighlight ? (e) => {
            const rect = (e.target as HTMLElement).getBoundingClientRect();
            onHoverHighlight(seg.id!, rect);
          } : undefined}
          onMouseLeave={!highlightMode && onHoverHighlight ? () => onHoverHighlight(null) : undefined}
          title={highlightMode ? 'Clique para remover grifo' : undefined}
        >
          {segText}
        </mark>
      );
    } else {
      result.push(segText);
    }
  }

  return result.length > 0 ? result : nodes;
}

const ArtigoBottomSheet = ({ artigo, onClose, isFavorito, onToggleFavorito, showNomenJuris = false, tabelaNome, forceShowRedacao, modificationInfo }: ArtigoBottomSheetProps) => {
  const [showRedacao, setShowRedacao] = useState(forceShowRedacao ?? false);

  // Reset showRedacao when forceShowRedacao changes (e.g. opening from novidades)
  useEffect(() => {
    if (forceShowRedacao !== undefined) setShowRedacao(forceShowRedacao);
  }, [forceShowRedacao, artigo?.id]);
  const [fontSize, setFontSize] = useState(17);
  const [showFontControls, setShowFontControls] = useState(false);
  const [showCommentPanel, setShowCommentPanel] = useState(false);
  const [showPraticarSheet, setShowPraticarSheet] = useState(false);
  const [showEstudarSheet, setShowEstudarSheet] = useState(false);
  const [videoaula, setVideoaula] = useState<{ titulo: string; url: string; canal: string; videoId: string; transcricao?: string } | null>(null);
  const [videoaulasLoading, setVideoaulasLoading] = useState(false);
  const [showVideoaulaSheet, setShowVideoaulaSheet] = useState(false);
  const [showResumoSelectorSheet, setShowResumoSelectorSheet] = useState(false);
  const [showAnotacoesSheet, setShowAnotacoesSheet] = useState(false);
  const [showPerguntarSheet, setShowPerguntarSheet] = useState(false);
  const [activeTab, setActiveTab] = useState('artigo');
  const [aiContent, setAiContent] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [commentPrompt, setCommentPrompt] = useState<{ id: string; show: boolean } | null>(null);
  const [commentText, setCommentText] = useState('');
  const [tooltipData, setTooltipData] = useState<{ id: string; rect: DOMRect } | null>(null);
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isDesktop = useIsDesktop();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [showGrafo, setShowGrafo] = useState(false);

  // ─── Grifo Mágico state ───
  interface MagicGrifo {
    trechoExato: string;
    cor: 'amarelo' | 'verde' | 'azul' | 'rosa' | 'laranja';
    explicacao: string;
    hierarquia: string;
  }
  const [magicMode, setMagicMode] = useState(false);
  const [magicHighlights, setMagicHighlights] = useState<MagicGrifo[]>([]);
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicTooltip, setMagicTooltip] = useState<{ grifo: MagicGrifo; rect: DOMRect } | null>(null);

  const MAGIC_COLORS: Record<string, string> = {
    amarelo: 'rgba(234, 179, 8, 0.55)',
    verde: 'rgba(34, 197, 94, 0.55)',
    azul: 'rgba(59, 130, 246, 0.55)',
    rosa: 'rgba(236, 72, 153, 0.55)',
    laranja: 'rgba(249, 115, 22, 0.55)',
  };

  // Realtime Presence: show how many users are reading this article
  const [onlineCount, setOnlineCount] = useState(0);
  useEffect(() => {
    if (!tabelaNome || !artigo?.numero) return;
    const channelName = `artigo:${tabelaNome}:${artigo.numero}`;
    const channel = supabase.channel(channelName);
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });
    return () => { supabase.removeChannel(channel); };
  }, [tabelaNome, artigo?.numero]);

  // Narration state
  const [narracaoUrl, setNarracaoUrl] = useState<string | null>(null);
  const [narracaoLoading, setNarracaoLoading] = useState(false);
  const [narracaoPlaying, setNarracaoPlaying] = useState(false);
  const [narracaoProgress, setNarracaoProgress] = useState(0);
  const narracaoAudioRef = useRef<HTMLAudioElement | null>(null);
  const narracaoAnimRef = useRef<number | null>(null);

  // Check for existing narration when artigo changes
  useEffect(() => {
    setNarracaoUrl(null);
    setNarracaoPlaying(false);
    if (narracaoAudioRef.current) {
      narracaoAudioRef.current.pause();
      narracaoAudioRef.current = null;
    }
    if (!tabelaNome || !artigo?.numero) return;

    (async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/narracoes_artigos?tabela_nome=eq.${tabelaNome}&artigo_numero=eq.${encodeURIComponent(artigo.numero)}&select=audio_url&limit=1`,
          {
            headers: {
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (data?.[0]?.audio_url) setNarracaoUrl(data[0].audio_url);
        }
      } catch (e) {
        console.error('Erro ao verificar narração:', e);
      }
    })();
  }, [tabelaNome, artigo?.id, artigo?.numero]);

  const startProgressTracking = useCallback((audio: HTMLAudioElement) => {
    const update = () => {
      if (audio.duration && audio.duration > 0) {
        setNarracaoProgress((audio.currentTime / audio.duration) * 100);
      }
      if (!audio.paused && !audio.ended) {
        narracaoAnimRef.current = requestAnimationFrame(update);
      }
    };
    narracaoAnimRef.current = requestAnimationFrame(update);
  }, []);

  const stopProgressTracking = useCallback(() => {
    if (narracaoAnimRef.current) {
      cancelAnimationFrame(narracaoAnimRef.current);
      narracaoAnimRef.current = null;
    }
  }, []);

  const handleNarrar = async () => {
    if (!artigo || !tabelaNome) return;

    // If already have audio, toggle play
    if (narracaoUrl) {
      if (narracaoPlaying && narracaoAudioRef.current) {
        narracaoAudioRef.current.pause();
        stopProgressTracking();
        setNarracaoPlaying(false);
        return;
      }
      const audio = new Audio(narracaoUrl);
      audio.onended = () => { setNarracaoPlaying(false); setNarracaoProgress(0); stopProgressTracking(); narracaoAudioRef.current = null; };
      narracaoAudioRef.current = audio;
      setNarracaoPlaying(true);
      audio.play();
      startProgressTracking(audio);
      return;
    }

    // Generate narration
    setNarracaoLoading(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const leiCatalog = (await import('@/services/legislacaoService')).getLeisCatalog();
      const lei = leiCatalog.find((l: any) => l.tabela_nome === tabelaNome);

      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/narrar-artigo`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            tabela_nome: tabelaNome,
            artigo_numero: artigo.numero,
            artigo_texto: artigo.caput,
            lei_nome: lei?.nome || tabelaNome,
            titulo_artigo: artigo.titulo || artigo.capitulo || null,
          }),
        }
      );

      if (res.ok) {
        const { audio_url } = await res.json();
        setNarracaoUrl(audio_url);
        // Auto-play
        const audio = new Audio(audio_url);
        audio.onended = () => { setNarracaoPlaying(false); setNarracaoProgress(0); stopProgressTracking(); narracaoAudioRef.current = null; };
        narracaoAudioRef.current = audio;
        setNarracaoPlaying(true);
        audio.play();
        startProgressTracking(audio);
      }
    } catch (e) {
      console.error('Erro ao gerar narração:', e);
    } finally {
      setNarracaoLoading(false);
    }
  };

  const planaltoUrl = useMemo(() => {
    if (!tabelaNome || !artigo?.numero) return null;
    return buildPlanaltoArticleUrl(tabelaNome, artigo.numero);
  }, [tabelaNome, artigo?.numero]);

  const {
    highlights,
    highlightMode,
    selectedColor,
    containerRef,
    setSelectedColor,
    toggleMode,
    addHighlight,
    removeHighlight,
    updateHighlightComment,
    clearAll,
    getLineHighlights,
  } = useHighlights(artigo?.id || null);

  // Reset magic highlights when artigo changes
  useEffect(() => {
    setMagicMode(false);
    setMagicHighlights([]);
    setMagicTooltip(null);
  }, [artigo?.id]);

  const handleToggleMagic = useCallback(async () => {
    if (magicMode) {
      setMagicMode(false);
      setMagicTooltip(null);
      return;
    }
    if (magicHighlights.length > 0) {
      setMagicMode(true);
      return;
    }
    if (!artigo || !tabelaNome) return;

    setMagicLoading(true);
    try {
      // Helper to parse and validate grifos JSON
      const parseGrifos = (raw: string): MagicGrifo[] | null => {
        try {
          let cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
          const arrMatch = cleaned.match(/\[[\s\S]*\]/);
          if (arrMatch) cleaned = arrMatch[0];
          let parsed: unknown;
          try {
            parsed = JSON.parse(cleaned);
          } catch {
            cleaned = cleaned.replace(/,\s*([}\]])/g, '$1').replace(/'/g, '"');
            parsed = JSON.parse(cleaned);
          }
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.trechoExato) {
            return parsed as MagicGrifo[];
          }
          return null;
        } catch {
          return null;
        }
      };

      // Check cache first
      const { data: cached } = await supabase
        .from('artigo_ai_cache')
        .select('conteudo')
        .eq('tabela_nome', tabelaNome)
        .eq('artigo_numero', artigo.numero)
        .eq('modo', 'grifo_magico')
        .maybeSingle();

      let grifos: MagicGrifo[] | null = null;

      if (cached?.conteudo) {
        grifos = parseGrifos(cached.conteudo);
        // If cached data is corrupt, delete it and re-fetch
        if (!grifos) {
          await supabase.from('artigo_ai_cache')
            .delete()
            .eq('tabela_nome', tabelaNome)
            .eq('artigo_numero', artigo.numero)
            .eq('modo', 'grifo_magico');
        }
      }

      if (!grifos) {
        // Build full article text
        const fullParts: string[] = [artigo.caput || ''];
        if (artigo.incisos?.length) {
          fullParts.push(...artigo.incisos.map((x: any) => typeof x === 'string' ? x : x?.texto).filter(Boolean));
        }
        if (artigo.paragrafos?.length) {
          fullParts.push(...artigo.paragrafos.map((x: any) => typeof x === 'string' ? x : x?.texto).filter(Boolean));
        }
        const fullText = fullParts.join('\n\n');

        // Try up to 2 times
        for (let attempt = 0; attempt < 2; attempt++) {
          const { data, error } = await supabase.functions.invoke('assistente-juridica', {
            body: {
              mode: 'grifo_magico',
              artigoTexto: fullText,
              artigoNumero: artigo.numero,
              leiNome: tabelaNome,
            },
          });
          if (error) { console.error('Grifo mágico invoke error:', error); continue; }
          const rawReply = data?.reply ?? data?.response ?? data?.text ?? data?.content ?? '';
          const rawStr = typeof rawReply === 'string' ? rawReply : JSON.stringify(rawReply);
          grifos = parseGrifos(rawStr);
          if (grifos) break;
          console.warn(`Grifo mágico: parse failed attempt ${attempt + 1}, retrying...`);
        }

        if (grifos) {
          // Save valid data to cache
          await supabase.from('artigo_ai_cache').upsert({
            tabela_nome: tabelaNome,
            artigo_numero: artigo.numero,
            modo: 'grifo_magico',
            conteudo: JSON.stringify(grifos),
          }, { onConflict: 'tabela_nome,artigo_numero,modo' });
        }
      }

      if (grifos && grifos.length > 0) {
        setMagicHighlights(grifos);
        setMagicMode(true);
      } else {
        console.warn('Grifo mágico: no valid highlights generated');
      }
    } catch (e) {
      console.error('Grifo mágico error:', e);
    } finally {
      setMagicLoading(false);
    }
  }, [magicMode, magicHighlights, artigo, tabelaNome]);

  const handleCopy = () => {
    if (!artigo) return;
    navigator.clipboard.writeText(`${artigo.numero}\n${artigo.caput}`);
  };

  const handleTextSelection = useCallback(() => {
    if (!highlightMode) return;
    const delay = isMobile ? 200 : 10;
    setTimeout(() => {
      const newId = addHighlight();
      if (newId) {
        setCommentPrompt({ id: newId, show: true });
        setCommentText('');
      }
    }, delay);
  }, [highlightMode, addHighlight, isMobile]);

  const handleScrollUp = useCallback(() => {
    scrollContainerRef.current?.scrollBy({ top: -150, behavior: 'smooth' });
  }, []);

  const handleScrollDown = useCallback(() => {
    scrollContainerRef.current?.scrollBy({ top: 150, behavior: 'smooth' });
  }, []);

  const handleSaveComment = useCallback(() => {
    if (commentPrompt && commentText.trim()) {
      updateHighlightComment(commentPrompt.id, commentText.trim());
    }
    setCommentPrompt(null);
    setCommentText('');
  }, [commentPrompt, commentText, updateHighlightComment]);

  const handleDismissComment = useCallback(() => {
    setCommentPrompt(null);
    setCommentText('');
  }, []);

  const handleHoverHighlight = useCallback((id: string | null, rect?: DOMRect) => {
    if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    if (id && rect) {
      setTooltipData({ id, rect });
    } else {
      tooltipTimeoutRef.current = setTimeout(() => setTooltipData(null), 200);
    }
  }, []);

  const handleTapHighlight = useCallback((id: string, rect: DOMRect) => {
    if (tooltipData?.id === id) {
      setTooltipData(null);
    } else {
      setTooltipData({ id, rect });
    }
  }, [tooltipData]);

  const handleScrollToHighlight = useCallback((highlightId: string) => {
    const mark = containerRef.current?.querySelector(`[data-highlight-id="${highlightId}"]`) ||
      containerRef.current?.querySelector(`mark`);
    // Find the mark with matching key
    const marks = containerRef.current?.querySelectorAll('mark');
    marks?.forEach(m => {
      if (m.getAttribute('data-hl-id') === highlightId) {
        m.scrollIntoView({ behavior: 'smooth', block: 'center' });
        m.classList.add('ring-2', 'ring-primary');
        setTimeout(() => m.classList.remove('ring-2', 'ring-primary'), 2000);
      }
    });
    setShowCommentPanel(false);
  }, [containerRef]);

  const tooltipHighlight = tooltipData ? highlights.find(h => h.id === tooltipData.id) : null;

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (!artigo) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [artigo]);

  // Auto-scroll to first modified line when opening from novidades
  useEffect(() => {
    if (!artigo || !modificationInfo || modificationInfo.linhasModificadas.length === 0) return;
    const targetLine = modificationInfo.linhasModificadas[0];
    const timer = setTimeout(() => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const el = container.querySelector(`[data-line-index="${targetLine}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 400); // wait for animation
    return () => clearTimeout(timer);
  }, [artigo?.id, modificationInfo]);

  // Pre-load all cached AI content when artigo changes
  useEffect(() => {
    setAiContent({});
    setAiLoading({});
    setActiveTab('artigo');

    if (!artigo || !tabelaNome) return;

    // Pre-fetch all cached modes from DB at once
    const modes = ['explicacao', 'exemplo', 'termos'];
    supabase
      .from('artigo_ai_cache')
      .select('modo, conteudo')
      .eq('tabela_nome', tabelaNome)
      .eq('artigo_numero', artigo.numero)
      .in('modo', modes)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const cached: Record<string, string> = {};
          data.forEach((row: any) => { cached[row.modo] = row.conteudo; });
          setAiContent(prev => ({ ...prev, ...cached }));
        }
      });
  }, [artigo?.id]);

  // Helper to split AI content into accordion sections
  const splitSections = useCallback((text: string, marker: string) => {
    const parts = text.split(marker).filter(s => s.trim());
    return parts.map((part, i) => {
      const lines = part.trim().split('\n');
      const titleLine = lines.find(l => l.startsWith('## ') || l.startsWith('**'));
      const title = titleLine 
        ? titleLine.replace(/^##\s*/, '').replace(/^\*\*/, '').replace(/\*\*$/, '').trim()
        : `Seção ${i + 1}`;
      const body = lines.filter(l => l !== titleLine).join('\n').trim();
      return { title, body: body || part.trim() };
    });
  }, []);

  // Fetch AI content: check DB cache first, then generate
  useEffect(() => {
    if (activeTab === 'artigo' || !artigo) return;
    if (aiContent[activeTab] || aiLoading[activeTab]) return;
    if (modificationInfo && activeTab !== 'explicacao') return;

    const cacheKey = { tabela: tabelaNome || 'unknown', numero: artigo.numero, modo: activeTab };

    setAiLoading(prev => ({ ...prev, [activeTab]: true }));

    // Check DB cache first
    supabase
      .from('artigo_ai_cache')
      .select('conteudo')
      .eq('tabela_nome', cacheKey.tabela)
      .eq('artigo_numero', cacheKey.numero)
      .eq('modo', cacheKey.modo)
      .maybeSingle()
      .then(({ data: cached }) => {
        if (cached?.conteudo) {
          setAiContent(prev => ({ ...prev, [activeTab]: cached.conteudo }));
          setAiLoading(prev => ({ ...prev, [activeTab]: false }));
          return;
        }

        // Generate with AI
        supabase.functions.invoke('assistente-juridica', {
          body: {
            mode: activeTab,
            artigoTexto: artigo.caput,
            artigoNumero: artigo.numero,
            leiNome: tabelaNome || '',
          },
        }).then(({ data, error }) => {
          if (!error && data?.reply) {
            setAiContent(prev => ({ ...prev, [activeTab]: data.reply }));
            // Save to DB cache
            supabase.from('artigo_ai_cache').upsert({
              tabela_nome: cacheKey.tabela,
              artigo_numero: cacheKey.numero,
              modo: cacheKey.modo,
              conteudo: data.reply,
            }, { onConflict: 'tabela_nome,artigo_numero,modo' }).then(() => {});
          } else {
            setAiContent(prev => ({ ...prev, [activeTab]: 'Não foi possível gerar o conteúdo. Tente novamente.' }));
          }
          setAiLoading(prev => ({ ...prev, [activeTab]: false }));
        });
      });
  }, [activeTab, artigo?.id]);

  if (!artigo) return null;

  const fullText = artigo.caput;
  const lines = fullText.split('\n').map(l => l.trim()).filter(Boolean);
  let nomenJuris: string | null = null;
  let contentLines = lines;
  const structuralPattern = /^(LIVRO|PARTE|TÍTULO)\s+/i;
  contentLines = contentLines.filter(l => !structuralPattern.test(l.trim()));

  // Nomen juris only for CP (Código Penal) and CPM (Código Penal Militar)
  const isCodigoPenal = tabelaNome && /^(CP_|CPM_)/i.test(tabelaNome);
  if (isCodigoPenal && showNomenJuris && contentLines.length > 1) {
    const firstLine = contentLines[0].trim();
    const firstLineClean = firstLine.replace(/\s*\([^)]*\)\s*/g, '').trim();
    const isNomen =
      firstLineClean.length > 0 &&
      firstLineClean.length <= 50 &&
      /^[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÚÇ]/.test(firstLineClean) &&
      !/^(Art\.|§|Parágrafo|[IVXLC]+\s*[-–.]|[a-z]\))/i.test(firstLineClean) &&
      !/[.;:!?]/.test(firstLineClean) &&
      !/\b(não|será|é|foi|são|tem|houver|aplica|considera)\b/i.test(firstLineClean);

    if (isNomen) {
      nomenJuris = firstLine;
      contentLines = contentLines.slice(1);
    }
  }

  const rawContent = contentLines.join('\n');
  const rawLines = rawContent.split('\n').filter(l => l.trim() !== '');
  // Keep revoked lines in the display even when redação is stripped
  const processedLines = rawLines.map(l => {
    if (isLineRevogado(l)) return l; // always keep revoked lines as-is
    return showRedacao ? l : stripRedacao(l);
  }).filter(l => l.trim() !== '');
  const isRevogado = processedLines.length === 0 && rawLines.length > 0;
  const displayLines = isRevogado ? rawLines : processedLines;

  const renderLine = (line: string, lineIndex: number, isFirst: boolean) => {
    const classified = classifyLine(line);
    const lineHighlights = getLineHighlights(lineIndex);
    const lineIsRevogado = isLineRevogado(line);

    // When opened from novidades, only show the specific modification reference on modified lines
    // and strip ALL references from non-modified lines
    const isModifiedLine = modificationInfo && modificationInfo.linhasModificadas.includes(lineIndex);
    let displayText: string;
    if (modificationInfo) {
      if (isModifiedLine && showRedacao) {
        displayText = line;
      } else {
        displayText = stripRedacao(line);
      }
    } else {
      displayText = showRedacao ? line : stripRedacao(line);
    }

    // If this specific line is revoked (inciso/paragraph with only "(Revogado...)"), show it styled
    if (lineIsRevogado && !isRevogado) {
      const revogadoDisplay = showRedacao ? line : line;
      return (
        <p key={lineIndex} data-line-index={lineIndex} className={`italic leading-[1.8] ${classified.type === 'inciso' ? 'pl-4 border-l-2 border-purple-400/30' : classified.type === 'alinea' ? 'pl-8' : classified.type === 'paragrafo' ? 'mt-2' : ''}`} style={{ fontSize: `${Math.max(fontSize - 1, 10)}px` }}>
          <span className="bg-purple-500/20 text-purple-300 rounded px-1 py-0.5">{revogadoDisplay}</span>
        </p>
      );
    }

    let baseNodes: React.ReactNode[];
    if (isFirst && !isRevogado) {
      baseNodes = [
        <span key="num" className="text-primary-light font-bold">{artigo.numero}</span>,
        <span key="sep" className="text-primary-light font-bold"> – </span>,
        ...highlightTermos(displayText, modificationInfo ? isModifiedLine && showRedacao : showRedacao),
      ];
    } else {
      baseNodes = highlightTermos(displayText, modificationInfo ? isModifiedLine && showRedacao : showRedacao);
    }

    let finalNodes = applyHighlightsToText(baseNodes, lineHighlights, removeHighlight, highlightMode, handleHoverHighlight, handleTapHighlight);

    // Apply magic highlights on top — works on the full line text, not individual nodes
    if (magicMode && magicHighlights.length > 0) {
      // Extract all text content from finalNodes to build a flat string
      const extractText = (nodes: React.ReactNode[]): string => {
        return nodes.map(n => {
          if (typeof n === 'string') return n;
          if (n && typeof n === 'object' && 'props' in (n as any)) {
            const props = (n as any).props;
            if (typeof props?.children === 'string') return props.children;
            if (Array.isArray(props?.children)) return extractText(props.children);
          }
          return '';
        }).join('');
      };
      
      const fullLineText = extractText(finalNodes);
      
      // Find magic grifo matches in the full line text
      const magicMatches: { start: number; end: number; grifo: typeof magicHighlights[0] }[] = [];
      for (const grifo of magicHighlights) {
        const idx = fullLineText.indexOf(grifo.trechoExato);
        if (idx !== -1) {
          magicMatches.push({ start: idx, end: idx + grifo.trechoExato.length, grifo });
        }
      }
      
      if (magicMatches.length > 0) {
        magicMatches.sort((a, b) => a.start - b.start);
        // Remove overlaps
        const filtered: typeof magicMatches = [];
        for (const m of magicMatches) {
          if (filtered.length === 0 || m.start >= filtered[filtered.length - 1].end) {
            filtered.push(m);
          }
        }
        
        // Rebuild nodes: walk through finalNodes tracking character position
        const newNodes: React.ReactNode[] = [];
        let charPos = 0;
        
        const wrapWithMagic = (text: string, offsetInLine: number, nodeKey: string): React.ReactNode[] => {
          const parts: React.ReactNode[] = [];
          let localPos = 0;
          for (const m of filtered) {
            const relStart = m.start - offsetInLine;
            const relEnd = m.end - offsetInLine;
            if (relEnd <= 0 || relStart >= text.length) continue;
            const clampStart = Math.max(0, relStart);
            const clampEnd = Math.min(text.length, relEnd);
            if (clampStart > localPos) parts.push(text.slice(localPos, clampStart));
            parts.push(
              <mark
                key={`magic-${nodeKey}-${m.start}`}
                style={{ backgroundColor: MAGIC_COLORS[m.grifo.cor] || MAGIC_COLORS.amarelo, color: 'white', borderRadius: '3px', padding: '1px 3px', cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = (e.target as HTMLElement).getBoundingClientRect();
                  setMagicTooltip(prev => prev?.grifo.trechoExato === m.grifo.trechoExato ? null : { grifo: m.grifo, rect });
                }}
              >
                {text.slice(clampStart, clampEnd)}
              </mark>
            );
            localPos = clampEnd;
          }
          if (localPos < text.length) parts.push(text.slice(localPos));
          return parts.length > 0 ? parts : [text];
        };
        
        const processNode = (node: React.ReactNode, idx: number): React.ReactNode => {
          if (typeof node === 'string') {
            const result = wrapWithMagic(node, charPos, `s${idx}`);
            charPos += node.length;
            return result.length === 1 ? result[0] : result;
          }
          if (node && typeof node === 'object' && 'props' in (node as any)) {
            const el = node as React.ReactElement;
            const children = el.props?.children;
            if (typeof children === 'string') {
              const result = wrapWithMagic(children, charPos, `e${idx}`);
              charPos += children.length;
              if (result.length === 1 && typeof result[0] === 'string') return node; // unchanged
              const { children: _, ...restProps } = el.props;
              // @ts-ignore
              return <el.type {...restProps} key={el.key || `mn${idx}`}>{result}</el.type>;
            }
            if (Array.isArray(children)) {
              const newChildren = children.map((c: React.ReactNode, ci: number) => processNode(c, idx * 100 + ci));
              const { children: _, ...restProps } = el.props;
              // @ts-ignore
              return <el.type {...restProps} key={el.key || `mn${idx}`}>{newChildren}</el.type>;
            }
          }
          return node;
        };
        
        finalNodes = finalNodes.map((n, i) => processNode(n, i)).flat();
      }
    }

    if (isRevogado) {
      return (
        <p key={lineIndex} data-line-index={lineIndex} className="leading-[1.8]" style={{ fontSize: `${Math.max(fontSize - 2, 10)}px` }}>
          <span className="bg-purple-500/20 text-purple-300 rounded px-1 py-0.5">{line}</span>
        </p>
      );
    }

    const extra =
      classified.type === 'inciso' ? 'pl-4 border-l-2 border-primary/30' :
      classified.type === 'alinea' ? 'pl-8' :
      classified.type === 'paragrafo' ? 'mt-2' : '';

    const highlightBg = isModifiedLine
      ? 'bg-violet-500/20 border-l-3 border-violet-400 pl-3 rounded-r-lg'
      : !modificationInfo && showRedacao && /\((?:Redação|Incluído|Acrescido|Alterado|Revogado|Vetado|Vigência)[^)]*\)/i.test(line)
        ? 'bg-yellow-400/5 border-l-2 border-yellow-400/40 pl-2 rounded-r'
        : '';

    return (
      <p
        key={lineIndex}
        data-line-index={lineIndex}
        className={`text-foreground leading-[1.8] ${extra} ${highlightBg}`}
        style={{ fontSize: `${fontSize}px` }}
      >
        {finalNodes}
      </p>
    );
  };

  const commentsWithText = highlights.filter(h => h.comment && h.comment.trim().length > 0);

  return (
    <>
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 bg-black/60"
        onClick={onClose}
      />

      <motion.div
        initial={isDesktop ? { y: '100%', opacity: 0.5 } : { y: '100%' }}
        animate={isDesktop ? { y: 0, opacity: 1 } : { y: 0 }}
        exit={isDesktop ? { y: '100%', opacity: 0.5 } : { y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className={
          isDesktop
            ? "fixed z-50 bottom-0 top-[5%] left-0 right-0 mx-auto bg-card border border-border rounded-t-2xl flex flex-col w-[800px] shadow-2xl"
            : "fixed inset-x-0 bottom-0 top-8 z-50 rounded-t-3xl bg-card border-t border-border flex flex-col"
        }
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="px-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-xl text-primary-light font-bold">
              {artigo.numero}
            </h3>
            {onlineCount > 1 && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-400/10 rounded-full px-2 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {onlineCount} estudando
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowRedacao(!showRedacao)}
              className={`p-2 rounded-full transition-colors ${showRedacao ? 'bg-primary/20' : 'hover:bg-secondary'}`}
              title={showRedacao ? 'Ocultar redações' : 'Mostrar redações'}
            >
              {showRedacao
                ? <Eye className="w-5 h-5 text-primary" />
                : <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground" />
              }
            </button>
            <button
              onClick={toggleMode}
              className={`p-2 rounded-full transition-colors ${highlightMode ? 'bg-primary/20' : 'hover:bg-secondary'}`}
              title={highlightMode ? 'Desativar grifo' : 'Ativar grifo'}
            >
              <Highlighter className={`w-5 h-5 ${highlightMode ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`} />
            </button>
            <button onClick={handleCopy} className="p-2 rounded-full hover:bg-secondary transition-colors" title="Copiar">
              <Copy className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            </button>
            <button
              onClick={() => onToggleFavorito?.()}
              className={`p-2 rounded-full transition-colors ${isFavorito ? 'bg-amber-400/20' : 'hover:bg-secondary'}`}
              title={isFavorito ? 'Remover favorito' : 'Favoritar'}
            >
              <Star className={`w-5 h-5 ${isFavorito ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground hover:text-foreground'}`} />
            </button>
            {tabelaNome && (
              <button
                onClick={() => setShowGrafo(true)}
                className="p-2 rounded-full hover:bg-secondary transition-colors"
                title="Ver grafo de conexões"
              >
                <Network className="w-5 h-5 text-muted-foreground hover:text-foreground" />
              </button>
            )}
            <div className="flex flex-col gap-1">
              <button onClick={onClose} className="p-2 rounded-full bg-amber-400 hover:bg-amber-500 transition-colors">
                <X className="w-5 h-5 text-black" />
              </button>
              <button onClick={() => setShowSharePanel(p => !p)} className="p-1.5 rounded-full hover:bg-secondary transition-colors" title="Compartilhar">
                <Share2 className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* Share panel */}
        <AnimatePresence>
          {showSharePanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-5 pb-2 overflow-hidden"
            >
              <ShareButtons
                artigoNumero={artigo.numero}
                artigoTexto={artigo.caput}
                leiNome={tabelaNome}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Título */}
        {artigo.titulo && (() => {
          const parts = artigo.titulo.match(/^(T[IÍ]TULO\s+[IVXLC\d]+)\s*[-–]?\s*(.*)/i);
          if (parts) {
            return (
              <div className="px-5 pb-1">
                <p className="text-[11px] text-foreground/70 font-body uppercase tracking-wide">{parts[1]}</p>
                <p className="text-[11px] text-foreground font-body leading-snug">{parts[2]}</p>
              </div>
            );
          }
          return (
            <div className="px-5 pb-1">
              <p className="text-[11px] text-foreground font-body leading-snug">{artigo.titulo}</p>
            </div>
          );
        })()}

        {/* Capítulo */}
        {artigo.capitulo && (() => {
          const parts = artigo.capitulo.match(/^(CAP[IÍ]TULO\s+[IVXLC\d]+)\s*[-–]?\s*(.*)/i);
          if (parts) {
            return (
              <div className="px-5 pb-2">
                <p className="text-[11px] text-foreground/70 font-body uppercase tracking-wide">{parts[1]}</p>
                <p className="text-[11px] text-foreground font-body leading-snug">{parts[2]}</p>
              </div>
            );
          }
          return (
            <div className="px-5 pb-2">
              <p className="text-[11px] text-foreground font-body leading-snug">{artigo.capitulo}</p>
            </div>
          );
        })()}

        <AnimatePresence>
          {highlightMode && (
            <HighlightColorBar
              selectedColor={selectedColor}
              onSelectColor={setSelectedColor}
              onClearAll={clearAll}
            />
          )}
        </AnimatePresence>

        {/* Magic Highlights Legend */}
        <AnimatePresence>
          {magicMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-5 pb-2 overflow-hidden"
            >
              <div className="flex items-center gap-3 flex-wrap py-1.5">
                {[
                  { cor: 'amarelo', label: 'Chave', bg: 'bg-yellow-500' },
                  { cor: 'verde', label: 'Exceção', bg: 'bg-green-500' },
                  { cor: 'azul', label: 'Efeito', bg: 'bg-blue-500' },
                  { cor: 'rosa', label: 'Termo', bg: 'bg-pink-500' },
                  { cor: 'laranja', label: 'Pegadinha', bg: 'bg-orange-500' },
                ].map(({ cor, label, bg }) => (
                  <span key={cor} className="flex items-center gap-1 text-[10px] text-foreground/70">
                    <span className={`w-2.5 h-2.5 rounded-full ${bg}`} />
                    {label}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {modificationInfo ? (
            <TabsList className="mx-5 bg-secondary/60 rounded-xl h-11 grid grid-cols-2 w-auto">
              <TabsTrigger value="artigo" className="rounded-lg text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">Artigo</TabsTrigger>
              <TabsTrigger value="explicacao" className="rounded-lg text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">Explicação</TabsTrigger>
            </TabsList>
          ) : (
            <TabsList className="mx-5 bg-secondary/60 rounded-xl h-11 grid grid-cols-4 w-auto">
              <TabsTrigger value="artigo" className="rounded-lg text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">Artigo</TabsTrigger>
              <TabsTrigger value="explicacao" className="rounded-lg text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">Explicação</TabsTrigger>
              <TabsTrigger value="exemplo" className="rounded-lg text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">Exemplo</TabsTrigger>
              <TabsTrigger value="termos" className="rounded-lg text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">Termos</TabsTrigger>
            </TabsList>
          )}


          <TabsContent value="artigo" className="flex-1 min-h-0 overflow-y-auto px-5 pb-24 pt-4 relative">
            {/* Brasão watermark fixo */}
            <div className="sticky top-1/2 -translate-y-1/2 left-0 right-0 flex items-center justify-center pointer-events-none z-0" style={{ height: 0 }}>
              <img src={brasaoImg} alt="" className="w-48 h-48 opacity-[0.04] object-contain" />
            </div>
            <div
              ref={scrollContainerRef as any}
              className=""
              style={highlightMode && isMobile ? { touchAction: 'none' } : undefined}
            >
              {nomenJuris && (
                <div className="mb-3">
                  <h4 className="text-primary-light font-bold text-base">
                    {showRedacao ? highlightTermos(nomenJuris, true) : stripRedacao(nomenJuris)}
                  </h4>
                </div>
              )}

              {isRevogado && (
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-purple-500/15 px-3 py-1 text-purple-300 text-xs font-semibold">
                  Dispositivo revogado
                </div>
              )}

              <div
                ref={containerRef}
                className={`space-y-4 font-legal text-base ${highlightMode ? 'select-text cursor-text' : ''}`}
                style={highlightMode ? {
                  WebkitUserSelect: 'text',
                  userSelect: 'text',
                  WebkitTouchCallout: 'default' as any,
                } : undefined}
                onMouseUp={handleTextSelection}
                onTouchEnd={handleTextSelection}
              >
                {displayLines.map((line, i) => renderLine(line, i, i === 0))}
              </div>

              {/* Botão Ver no Planalto */}
              {planaltoUrl && (
                <a
                  href={planaltoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[hsl(40_85%_55%/0.18)] flex items-center justify-center shrink-0">
                    <ExternalLink className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Ver no Planalto</p>
                    <p className="text-xs text-muted-foreground">planalto.gov.br</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </a>
              )}
            </div>

            {/* Mobile scroll buttons when highlight mode is active */}
            <AnimatePresence>
              {highlightMode && isMobile && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-[65]"
                >
                  <button
                    onClick={handleScrollUp}
                    className="w-9 h-9 rounded-full bg-card/90 border border-border shadow-lg flex items-center justify-center"
                  >
                    <ChevronUp className="w-4 h-4 text-foreground" />
                  </button>
                  <button
                    onClick={handleScrollDown}
                    className="w-9 h-9 rounded-full bg-card/90 border border-border shadow-lg flex items-center justify-center"
                  >
                    <ChevronDown className="w-4 h-4 text-foreground" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Comment prompt after highlighting */}
            <AnimatePresence>
              {commentPrompt?.show && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.9 }}
                  className="fixed bottom-24 left-4 right-4 z-[70] mx-auto max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-4"
                >
                  <p className="text-foreground text-sm font-semibold mb-2">Adicionar comentário?</p>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Digite seu comentário..."
                    className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                    rows={2}
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleDismissComment}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold text-muted-foreground bg-secondary hover:bg-secondary/80 transition-colors"
                    >
                      Pular
                    </button>
                    <button
                      onClick={handleSaveComment}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
                    >
                      Salvar
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tooltip for highlighted text with comment */}
            <AnimatePresence>
              {tooltipData && tooltipHighlight?.comment && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="fixed z-[80] max-w-64 bg-popover border border-border rounded-xl shadow-xl px-3 py-2"
                  style={{
                    top: tooltipData.rect.top - 8,
                    left: Math.min(tooltipData.rect.left, window.innerWidth - 270),
                    transform: 'translateY(-100%)',
                  }}
                  onMouseEnter={() => { if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current); }}
                  onMouseLeave={() => setTooltipData(null)}
                >
                  <p className="text-xs text-foreground leading-relaxed">{tooltipHighlight.comment}</p>
                  <div
                    className="absolute w-2 h-2 bg-popover border-r border-b border-border rotate-45"
                    style={{ bottom: -5, left: 16 }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Magic grifo tooltip — blurred overlay + centered card */}
            <AnimatePresence>
              {magicTooltip && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[79] bg-black/60 backdrop-blur-sm"
                    onClick={() => setMagicTooltip(null)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ type: 'spring', duration: 0.3 }}
                    className="fixed z-[80] left-4 right-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto bg-popover border border-border rounded-2xl shadow-2xl px-5 py-4"
                  >
                    <button
                      onClick={() => setMagicTooltip(null)}
                      className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-muted/60 hover:bg-muted text-foreground/60 hover:text-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-2.5 mb-2.5 pr-6">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: MAGIC_COLORS[magicTooltip.grifo.cor] }}
                      />
                      <span className="text-[11px] font-bold text-foreground/70 uppercase tracking-wider">
                        {magicTooltip.grifo.hierarquia}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed mb-3">
                      {magicTooltip.grifo.explicacao}
                    </p>
                    <div className="text-[11px] text-muted-foreground italic border-t border-border/40 pt-2">
                      "{magicTooltip.grifo.trechoExato}"
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

          </TabsContent>


          <TabsContent value="explicacao" className="flex-1 overflow-y-auto px-5 pb-20 pt-4">
            {modificationInfo ? (
              <div className="space-y-5">
                <div className="rounded-2xl bg-violet-500/10 border border-violet-500/20 p-4">
                  <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-2">O que mudou</h4>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {(() => {
                      const parte = modificationInfo.parteModificada;
                      const tipo = modificationInfo.tipo.toLowerCase();
                      const lei = modificationInfo.leiNome;
                      if (/incluíd|acrescid/i.test(modificationInfo.tipo)) {
                        return parte === 'Artigo inteiro'
                          ? `O ${artigo.numero} foi inteiramente incluído no ordenamento jurídico pela ${lei}.`
                          : `O ${parte} do ${artigo.numero} foi incluído pela ${lei}. Na aba "Artigo", ele está destacado em roxo.`;
                      }
                      if (/alterad|redaç/i.test(modificationInfo.tipo)) {
                        return parte === 'Artigo inteiro'
                          ? `Todo o ${artigo.numero} teve sua redação alterada pela ${lei}.`
                          : `O ${parte} do ${artigo.numero} teve sua redação modificada pela ${lei}. Na aba "Artigo", o trecho está destacado em roxo.`;
                      }
                      if (/revogad/i.test(modificationInfo.tipo)) {
                        return `Este dispositivo foi revogado pela ${lei} e não produz mais efeitos jurídicos.`;
                      }
                      return `O ${parte} do ${artigo.numero} foi ${tipo} pela ${lei}.`;
                    })()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-400">{modificationInfo.tipo}</span>
                  <span className="text-xs text-foreground/60 font-medium">{modificationInfo.parteModificada}</span>
                </div>
                <div className="rounded-2xl bg-card border border-border p-4">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Lei modificadora</h4>
                  <p className="text-sm font-semibold text-foreground mb-1">{modificationInfo.leiNome}</p>
                  <p className="text-xs text-muted-foreground italic mb-3">{modificationInfo.referencia}</p>
                  {(() => {
                    const leiMatch = modificationInfo.leiNome.match(/(?:Lei(?:\s+Complementar)?|Decreto(?:-Lei)?|Emenda\s+Constitucional)\s+n[º°]?\s*([\d.]+)/i);
                    if (leiMatch) {
                      const num = leiMatch[1].replace(/\./g, '');
                      const isLC = /complementar/i.test(modificationInfo.leiNome);
                      const searchUrl = isLC
                        ? `https://www.planalto.gov.br/ccivil_03/leis/lcp/Lcp${num}.htm`
                        : `https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L${num}.htm`;
                      return (
                        <a href={searchUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                          <ExternalLink className="w-3.5 h-3.5" />
                          Ver texto oficial no Planalto
                        </a>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {aiLoading.explicacao ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground font-body">Gerando explicação com IA...</p>
                  </div>
                ) : aiContent.explicacao ? (
                  (() => {
                    const sections = splitSections(aiContent.explicacao, '---SECAO---');
                    if (sections.length <= 1) {
                      return (
                        <div className="prose prose-sm dark:prose-invert max-w-none font-body leading-relaxed [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 [&_h2]:font-bold [&_h2]:text-foreground [&_h3]:font-bold [&_strong]:text-foreground" style={{ fontSize: `${fontSize}px` }}>
                          <ReactMarkdown>{aiContent.explicacao}</ReactMarkdown>
                        </div>
                      );
                    }
                    return (
                      <Accordion type="multiple" className="space-y-2">
                        {sections.map((sec, i) => {
                          const borderColors = ['border-l-red-500/70', 'border-l-amber-500/70', 'border-l-emerald-500/70', 'border-l-sky-500/70', 'border-l-violet-500/70', 'border-l-pink-500/70', 'border-l-orange-500/70'];
                          const strongColors = ['[&_strong]:text-red-400', '[&_strong]:text-amber-400', '[&_strong]:text-emerald-400', '[&_strong]:text-sky-400', '[&_strong]:text-violet-400', '[&_strong]:text-pink-400', '[&_strong]:text-orange-400'];
                          return (
                          <AccordionItem key={i} value={`exp-${i}`} className={`border border-border rounded-xl overflow-hidden bg-secondary/30 border-l-4 ${borderColors[i % borderColors.length]}`}>
                            <AccordionTrigger className="px-4 py-4 text-base font-semibold text-foreground text-left hover:no-underline [&[data-state=open]>svg]:rotate-180">
                              {sec.title}
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                              <div className={`prose prose-sm dark:prose-invert max-w-none font-body leading-relaxed [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 ${strongColors[i % strongColors.length]}`} style={{ fontSize: `${fontSize}px` }}>
                                <ReactMarkdown>{sec.body}</ReactMarkdown>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                          );
                        })}
                      </Accordion>
                    );
                  })()
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-8">Clique para gerar a explicação.</p>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="exemplo" className="flex-1 overflow-y-auto px-5 pb-20 pt-4">
            {aiLoading.exemplo ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground font-body">Gerando exemplos práticos com IA...</p>
              </div>
            ) : aiContent.exemplo ? (
              (() => {
                const sections = splitSections(aiContent.exemplo, '---EXEMPLO---');
                if (sections.length <= 1) {
                  return (
                    <div className="prose prose-sm dark:prose-invert max-w-none font-body leading-relaxed [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 [&_h2]:font-bold [&_h2]:text-foreground [&_h3]:font-bold [&_strong]:text-foreground" style={{ fontSize: `${fontSize}px` }}>
                      <ReactMarkdown>{aiContent.exemplo}</ReactMarkdown>
                    </div>
                  );
                }
                return (
                  <Accordion type="single" collapsible className="space-y-2">
                    {sections.map((sec, i) => {
                      const borderColors = ['border-l-emerald-500/70', 'border-l-sky-500/70', 'border-l-amber-500/70', 'border-l-violet-500/70'];
                      const strongColors = ['[&_strong]:text-emerald-400', '[&_strong]:text-sky-400', '[&_strong]:text-amber-400', '[&_strong]:text-violet-400'];
                      return (
                      <AccordionItem key={i} value={`ex-${i}`} className={`border border-border rounded-xl overflow-hidden bg-secondary/30 border-l-4 ${borderColors[i % borderColors.length]}`}>
                        <AccordionTrigger className="px-4 py-4 text-base font-semibold text-foreground text-left hover:no-underline [&[data-state=open]>svg]:rotate-180">
                          {sec.title}
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className={`prose prose-sm dark:prose-invert max-w-none font-body leading-relaxed [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 ${strongColors[i % strongColors.length]}`} style={{ fontSize: `${fontSize}px` }}>
                            <ReactMarkdown>{sec.body}</ReactMarkdown>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      );
                    })}
                  </Accordion>
                );
              })()
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">Clique para gerar exemplos.</p>
            )}
          </TabsContent>

          <TabsContent value="termos" className="flex-1 overflow-y-auto px-5 pb-20 pt-4">
            {aiLoading.termos ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground font-body">Analisando termos jurídicos com IA...</p>
              </div>
            ) : aiContent.termos ? (
              (() => {
                const sections = splitSections(aiContent.termos, '---TERMO---');
                if (sections.length <= 1) {
                  return (
                    <div className="prose prose-sm dark:prose-invert max-w-none font-body leading-relaxed [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 [&_h2]:font-bold [&_h2]:text-foreground [&_h3]:font-bold [&_strong]:text-foreground" style={{ fontSize: `${fontSize}px` }}>
                      <ReactMarkdown>{aiContent.termos}</ReactMarkdown>
                    </div>
                  );
                }
                return (
                  <Accordion type="single" collapsible className="space-y-2">
                    {sections.map((sec, i) => {
                      const borderColors = ['border-l-pink-500/70', 'border-l-orange-500/70', 'border-l-cyan-500/70', 'border-l-red-500/70', 'border-l-indigo-500/70', 'border-l-lime-500/70'];
                      const strongColors = ['[&_strong]:text-pink-400', '[&_strong]:text-orange-400', '[&_strong]:text-cyan-400', '[&_strong]:text-red-400', '[&_strong]:text-indigo-400', '[&_strong]:text-lime-400'];
                      return (
                      <AccordionItem key={i} value={`term-${i}`} className={`border border-border rounded-xl overflow-hidden bg-secondary/30 border-l-4 ${borderColors[i % borderColors.length]}`}>
                        <AccordionTrigger className="px-4 py-4 text-base font-semibold text-foreground text-left hover:no-underline [&[data-state=open]>svg]:rotate-180">
                          {sec.title}
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className={`prose prose-sm dark:prose-invert max-w-none font-body leading-relaxed [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 ${strongColors[i % strongColors.length]}`} style={{ fontSize: `${fontSize}px` }}>
                            <ReactMarkdown>{sec.body}</ReactMarkdown>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      );
                    })}
                  </Accordion>
                );
              })()
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">Clique para ver os termos.</p>
            )}
          </TabsContent>
        </Tabs>

        {/* Floating FABs — Grifo Mágico + Font size */}
        <div className={`fixed ${activeTab === 'artigo' ? 'bottom-24' : 'bottom-6'} right-5 z-[60] flex flex-col items-end gap-2`}>
          <AnimatePresence>
            {showFontControls && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="bg-card border border-border rounded-2xl shadow-lg p-3 flex flex-col items-center gap-2 mb-2"
              >
                <button
                  onClick={() => setFontSize(prev => Math.min(prev + 1, 24))}
                  className="w-10 h-10 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
                >
                  <Plus className="w-4 h-4 text-foreground" />
                </button>
                <span className="text-foreground text-xs font-bold">{fontSize}px</span>
                <button
                  onClick={() => setFontSize(prev => Math.max(prev - 1, 10))}
                  className="w-10 h-10 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
                >
                  <Minus className="w-4 h-4 text-foreground" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Grifo Mágico FAB — above font size */}
          {activeTab === 'artigo' && (
            <button
              onClick={handleToggleMagic}
              disabled={magicLoading}
              className={`relative w-11 h-11 mb-1 rounded-full shadow-lg flex items-center justify-center transition-colors overflow-hidden ${
                magicMode
                  ? 'bg-amber-300 text-amber-900'
                  : 'bg-amber-400 text-amber-900 hover:bg-amber-300'
              }`}
              title={magicMode ? 'Desativar grifo mágico' : 'Grifo mágico (IA)'}
              style={{ boxShadow: '0 0 14px rgba(252, 211, 77, 0.6)' }}
            >
              {/* Shine sweep animation */}
              <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
                <span
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.5) 50%, transparent 60%)',
                    animation: 'shimmer 2.5s ease-in-out infinite',
                  }}
                />
              </span>
              <Sparkles className={`w-5 h-5 relative z-10 ${magicLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
          <button
            onClick={() => { setShowFontControls(!showFontControls); setShowCommentPanel(false); }}
            className="w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
          >
            <Type className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom nav bar — only visible on "artigo" tab */}
        {activeTab === 'artigo' && (
        <div className="shrink-0 mt-auto border-t border-amber-400/30 bg-amber-400/10 backdrop-blur-sm px-2 pb-[env(safe-area-inset-bottom)]">
          <div className="grid grid-cols-5 h-16 sm:h-[72px] items-end">
            <button
              onClick={() => setShowEstudarSheet(true)}
              className="flex flex-col items-center justify-center gap-1 py-2 transition-colors text-white hover:text-amber-400"
            >
              <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7" />
              <span className="text-[11px] sm:text-[13px] font-medium">Estudar</span>
            </button>
            <button
              onClick={() => setShowPraticarSheet(true)}
              className="flex flex-col items-center justify-center gap-1 py-2 transition-colors text-white hover:text-amber-400"
            >
              <Target className="w-6 h-6 sm:w-7 sm:h-7" />
              <span className="text-[11px] sm:text-[13px] font-medium">Praticar</span>
            </button>
            <div className="flex flex-col items-center -mt-7">
              <div className="relative">
                {/* Pulsing wave rings when playing */}
                {narracaoPlaying && (
                  <>
                    <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" style={{ animationDuration: '1.5s' }} />
                    <span className="absolute -inset-1 rounded-full bg-primary/15 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
                  </>
                )}
                {/* SVG circular progress overlay */}
                {narracaoPlaying && (
                  <svg className="absolute inset-0 w-14 h-14 sm:w-16 sm:h-16 -rotate-90 z-10 pointer-events-none" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="26" fill="none" stroke="hsl(var(--primary-foreground))" strokeWidth="3" strokeOpacity="0.2" />
                    <circle
                      cx="28" cy="28" r="26" fill="none"
                      stroke="hsl(var(--primary-foreground))"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 26}`}
                      strokeDashoffset={`${2 * Math.PI * 26 * (1 - narracaoProgress / 100)}`}
                      style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                    />
                  </svg>
                )}
                <button
                  onClick={handleNarrar}
                  disabled={narracaoLoading}
                  className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${narracaoPlaying ? 'bg-primary shadow-primary/40 scale-105' : 'bg-primary shadow-primary/30 hover:bg-primary/90'}`}
                >
                  {narracaoLoading ? (
                    <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 text-primary-foreground animate-spin" />
                  ) : narracaoPlaying ? (
                    <Pause className="w-7 h-7 sm:w-8 sm:h-8 text-primary-foreground" />
                  ) : (
                    <Volume2 className="w-7 h-7 sm:w-8 sm:h-8 text-primary-foreground" />
                  )}
                </button>
              </div>
              <span className={`text-[11px] sm:text-[13px] font-medium mt-0.5 ${narracaoPlaying ? 'text-primary' : 'text-primary'}`}>
                {narracaoPlaying ? 'Pausar' : 'Narrar'}
              </span>
            </div>
            <button
              onClick={() => { setShowAnotacoesSheet(true); setShowFontControls(false); }}
              className="flex flex-col items-center justify-center gap-1 py-2 relative transition-colors text-white hover:text-amber-400"
            >
              <div className="relative">
                <StickyNote className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <span className="text-[11px] sm:text-[13px] font-medium">Anotações</span>
            </button>

            {/* Perguntar */}
            <button
              onClick={() => setShowPerguntarSheet(true)}
              className="flex flex-col items-center justify-center gap-1 py-2 transition-colors text-white hover:text-amber-400"
            >
              <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" />
              <span className="text-[11px] sm:text-[13px] font-medium">Perguntar</span>
            </button>
          </div>
        </div>
        )}

        {/* Praticar Sheet */}
        <AnimatePresence>
          {showPraticarSheet && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-[60]"
                onClick={() => setShowPraticarSheet(false)}
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-[61] bg-card rounded-t-3xl border-t border-border p-6 pb-10"
              >
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-5" />
                <h3 className="text-lg font-bold text-foreground mb-1">Praticar</h3>
                <p className="text-sm text-foreground/70 mb-5">Art. {artigo?.numero} — Escolha o modo de estudo</p>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setShowPraticarSheet(false);
                      navigate(`/estudar?mode=questoes&tabela=${tabelaNome}&artigo=${artigo?.numero}`);
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-primary/20 to-copper/15 border border-primary/30 hover:border-primary/60 transition-all text-left group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-copper-dark flex items-center justify-center shrink-0 shadow-lg shadow-primary/25">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">Questões</p>
                      <p className="text-xs text-foreground/70 mt-0.5">Múltipla escolha com comentários e exemplos</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-foreground/50" />
                  </button>
                  <button
                    onClick={() => {
                      setShowPraticarSheet(false);
                      navigate(`/estudar?mode=flashcards&tabela=${tabelaNome}&artigo=${artigo?.numero}`);
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-copper/20 to-copper-light/15 border border-copper/30 hover:border-copper/60 transition-all text-left group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-copper to-copper-light flex items-center justify-center shrink-0 shadow-lg shadow-copper/25">
                      <Layers className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">Flashcards</p>
                      <p className="text-xs text-foreground/70 mt-0.5">Cards com flip animado e exemplos práticos</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-foreground/50" />
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Estudar Sheet */}
        <AnimatePresence>
          {showEstudarSheet && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-[60]"
                onClick={() => setShowEstudarSheet(false)}
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-[61] bg-card rounded-t-3xl border-t border-border p-6 pb-10 max-w-3xl mx-auto"
              >
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-5" />
                <h3 className="text-lg font-bold text-foreground mb-1">Estudar</h3>
                <p className="text-sm text-foreground/70 mb-5">{artigo?.numero} — Escolha como estudar</p>
                <div className="space-y-3">
                  {/* Videoaulas */}
                  <button
                    onClick={async () => {
                      if (videoaula) {
                        setShowEstudarSheet(false);
                        setShowVideoaulaSheet(true);
                        return;
                      }
                      setVideoaulasLoading(true);
                      try {
                        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
                        const leiCatalog = (await import('@/services/legislacaoService')).getLeisCatalog();
                        const lei = leiCatalog.find((l: any) => l.tabela_nome === tabelaNome);
                        const res = await fetch(
                          `https://${projectId}.supabase.co/functions/v1/buscar-videoaulas`,
                          {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                            },
                            body: JSON.stringify({
                              artigoNumero: artigo?.numero,
                              artigoTexto: artigo?.caput?.substring(0, 500),
                              leiNome: lei?.nome || tabelaNome,
                            }),
                          }
                        );
                        if (res.ok) {
                          const data = await res.json();
                          const videos = data.videos || [];
                          if (videos.length > 0) {
                            setVideoaula(videos[0]);
                            setShowEstudarSheet(false);
                            setShowVideoaulaSheet(true);
                          }
                        }
                      } catch (e) {
                        console.error('Erro ao buscar videoaulas:', e);
                      } finally {
                        setVideoaulasLoading(false);
                      }
                    }}
                    disabled={videoaulasLoading}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-red-500/20 to-red-400/10 border border-red-500/30 hover:border-red-500/60 transition-all text-left group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center shrink-0 shadow-lg shadow-red-500/25">
                      {videoaulasLoading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Play className="w-6 h-6 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">Videoaulas</p>
                      <p className="text-xs text-foreground/70 mt-0.5">Aulas no YouTube sobre este artigo</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-foreground/50" />
                  </button>

                  {/* Resumos */}
                  <button
                    onClick={() => {
                      setShowEstudarSheet(false);
                      navigate(`/resumos?tabela=${encodeURIComponent(tabelaNome || '')}&artigo=${encodeURIComponent(artigo?.numero || '')}`);
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-primary/20 to-copper/15 border border-primary/30 hover:border-primary/60 transition-all text-left group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-copper-dark flex items-center justify-center shrink-0 shadow-lg shadow-primary/25">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">Resumos</p>
                      <p className="text-xs text-foreground/70 mt-0.5">Resumo completo do artigo com IA</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-foreground/50" />
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Videoaula full-screen sheet */}
        <VideoaulaSheet
          open={showVideoaulaSheet}
          onClose={() => setShowVideoaulaSheet(false)}
          video={videoaula}
          tabelaNome={tabelaNome || ''}
          artigoNumero={artigo?.numero || ''}
          artigoTexto={artigo?.caput || ''}
        />

        {/* Resumo selector sheet */}
        <ResumoSelectorSheet
          open={showResumoSelectorSheet}
          onClose={() => setShowResumoSelectorSheet(false)}
          tabelaNome={tabelaNome || ''}
          artigoNumero={artigo?.numero || ''}
        />


        <AnotacoesSheet
          open={showAnotacoesSheet}
          onClose={() => setShowAnotacoesSheet(false)}
          tabelaNome={tabelaNome || 'unknown'}
          artigoNumero={artigo.numero}
          artigoTexto={artigo.caput}
        />

        {/* Perguntar Sheet */}
        <PerguntarSheet
          open={showPerguntarSheet}
          onClose={() => setShowPerguntarSheet(false)}
          tabelaNome={tabelaNome || 'unknown'}
          artigoNumero={artigo.numero}
          artigoTexto={artigo.caput}
        />
      </motion.div>
    </AnimatePresence>

    {tabelaNome && artigo && (
      <GrafoOverlay
        open={showGrafo}
        onClose={() => setShowGrafo(false)}
        tabelaNome={tabelaNome}
        leiNome={tabelaNome}
        artigoNumero={artigo.numero}
      />
    )}
    </>
  );
};

export default ArtigoBottomSheet;
