import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Play, RotateCcw, Check, X as XIcon, ChevronLeft, ChevronRight, MessageCircle, Download, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import { toast } from 'sonner';

/* ─── Markdown components for structured summary ─── */
const resumoMdComponents = {
  h2: ({ children, ...props }: any) => (
    <h2 {...props} className="text-[15px] font-display font-bold text-foreground mt-5 mb-2 flex items-center gap-2">
      <span className="w-1.5 h-5 bg-primary/60 rounded-full shrink-0" />
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3 {...props} className="text-[14px] font-display font-semibold text-primary mt-4 mb-1.5 flex items-center gap-2">
      <span className="w-1 h-4 bg-primary/40 rounded-full shrink-0" />
      {children}
    </h3>
  ),
  p: ({ children, ...props }: any) => (
    <p {...props} className="text-foreground/85 leading-[1.85] font-body my-2 text-[14px]">{children}</p>
  ),
  ul: ({ children, ...props }: any) => (
    <ul {...props} className="my-2 space-y-1.5 list-none pl-0">{children}</ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol {...props} className="my-2 space-y-1.5 list-decimal pl-5 marker:text-primary/60">{children}</ol>
  ),
  li: ({ children, ...props }: any) => (
    <li {...props} className="flex items-start gap-2 text-foreground/85 font-body leading-[1.8] text-[14px]">
      <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
      <span className="flex-1">{children}</span>
    </li>
  ),
  strong: ({ children, ...props }: any) => (
    <strong {...props} className="text-foreground font-bold">{children}</strong>
  ),
  blockquote: ({ children, ...props }: any) => (
    <blockquote {...props} className="border-l-4 border-l-primary bg-primary/5 rounded-r-xl py-3 px-4 my-4 italic text-foreground/80 font-body text-[13.5px]">{children}</blockquote>
  ),
  hr: () => (
    <div className="my-5 flex items-center gap-3">
      <div className="flex-1 h-px bg-border" />
      <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
      <div className="flex-1 h-px bg-border" />
    </div>
  ),
};

/* ─── Types ─── */
interface VideoaulaSheetProps {
  open: boolean;
  onClose: () => void;
  video: { titulo: string; url: string; canal: string; videoId: string; transcricao?: string } | null;
  tabelaNome: string;
  artigoNumero: string;
  artigoTexto: string;
}

interface Questao {
  pergunta: string;
  alternativas: string[];
  correta: number;
  comentario: string;
}

interface Flashcard {
  frente: string;
  verso: string;
  comentario: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/* ─── PDF Styles ─── */
const pdfStyles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 11 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 6, fontFamily: 'Helvetica-Bold' },
  subtitle: { fontSize: 10, color: '#666', marginBottom: 20 },
  body: { fontSize: 10, lineHeight: 1.6, color: '#333' },
  footer: { position: 'absolute', bottom: 25, left: 40, right: 40, fontSize: 8, color: '#999', textAlign: 'center' },
});

/* ─── Main Component ─── */
const VideoaulaSheet = ({ open, onClose, video, tabelaNome, artigoNumero, artigoTexto }: VideoaulaSheetProps) => {
  const [resumo, setResumo] = useState('');
  const [resumoLoading, setResumoLoading] = useState(false);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [questoesLoading, setQuestoesLoading] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [flashcardsLoading, setFlashcardsLoading] = useState(false);
  const [activeStudyTab, setActiveStudyTab] = useState<'resumo' | 'questoes' | 'flashcards'>('resumo');

  // Questions state
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [selectedAlt, setSelectedAlt] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  // Flashcards state
  const [currentFcIdx, setCurrentFcIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // PDF state
  const [pdfExporting, setPdfExporting] = useState(false);

  const transcricao = video?.transcricao || '';
  const contexto = transcricao || artigoTexto?.substring(0, 2000) || '';

  useEffect(() => {
    if (!open || !video) return;
    if (!resumo) generateResumo();
    if (questoes.length === 0) generateQuestoes();
    if (flashcards.length === 0) generateFlashcards();
  }, [open, video]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  /* ─── Generators ─── */
  const generateResumo = async () => {
    if (!video) return;
    setResumoLoading(true);
    try {
      const { data } = await supabase.functions.invoke('assistente-juridica', {
        body: {
          messages: [{
            role: 'user',
            content: `Gere um resumo estruturado e hierárquico para estudo sobre o ${artigoNumero} da legislação brasileira.

Contexto: Videoaula "${video.titulo}" do canal ${video.canal}.
${transcricao ? `Transcrição do vídeo: "${transcricao.substring(0, 8000)}"` : `Texto do artigo: "${artigoTexto?.substring(0, 800)}"`}

REGRAS DE FORMATAÇÃO:
- Comece DIRETO com o conteúdo, sem introdução ou saudação
- Use títulos com ## e ### para hierarquia
- Use **negrito** nos termos jurídicos importantes
- Use listas com marcadores (- ) para pontos-chave
- Inclua seções: Conceito, Fundamento Constitucional, Elementos Essenciais, Aplicação Prática, Jurisprudência Relevante
- Seja objetivo e direto, como material de revisão para concurso
- Máximo 600 palavras`,
          }],
          tabelaNome, artigoNumero,
          artigoTexto: artigoTexto?.substring(0, 800),
        },
      });
      if (data?.resposta) setResumo(data.resposta);
      else if (data?.reply) setResumo(data.reply);
    } catch (e) { console.error('Erro ao gerar resumo:', e); }
    finally { setResumoLoading(false); }
  };

  const generateQuestoes = async () => {
    if (!video) return;
    setQuestoesLoading(true);
    try {
      const { data } = await supabase.functions.invoke('assistente-juridica', {
        body: {
          messages: [{
            role: 'user',
            content: `Gere 12 questões de múltipla escolha sobre o ${artigoNumero}.
${transcricao ? `Transcrição do vídeo: "${transcricao.substring(0, 6000)}"` : `Texto do artigo: "${artigoTexto?.substring(0, 600)}"`}

Responda APENAS com JSON válido neste formato, sem markdown:
[{"pergunta":"...","alternativas":["a)...","b)...","c)...","d)..."],"correta":0,"comentario":"Explicação detalhada da resposta correta, citando o fundamento legal."}]

Onde "correta" é o índice (0-3) da alternativa correta. Faça questões no estilo OAB/concurso público. O comentário deve explicar POR QUE a alternativa é correta.`,
          }],
          tabelaNome, artigoNumero,
          artigoTexto: artigoTexto?.substring(0, 600),
        },
      });
      const content = data?.resposta || data?.reply || '';
      try {
        const cleaned = content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        const arrMatch = cleaned.match(/\[[\s\S]*\]/);
        if (arrMatch) setQuestoes(JSON.parse(arrMatch[0]).slice(0, 15));
      } catch { /* parsing failed */ }
    } catch (e) { console.error('Erro ao gerar questões:', e); }
    finally { setQuestoesLoading(false); }
  };

  const generateFlashcards = async () => {
    if (!video) return;
    setFlashcardsLoading(true);
    try {
      const { data } = await supabase.functions.invoke('assistente-juridica', {
        body: {
          messages: [{
            role: 'user',
            content: `Gere 12 flashcards de estudo sobre o ${artigoNumero}.
${transcricao ? `Transcrição do vídeo: "${transcricao.substring(0, 6000)}"` : `Texto do artigo: "${artigoTexto?.substring(0, 600)}"`}

Responda APENAS com JSON válido neste formato, sem markdown:
[{"frente":"Pergunta ou conceito","verso":"Resposta ou explicação","comentario":"Comentário adicional com fundamentação legal ou dica de estudo"}]

Foque em conceitos-chave, termos jurídicos e aplicações práticas.`,
          }],
          tabelaNome, artigoNumero,
          artigoTexto: artigoTexto?.substring(0, 600),
        },
      });
      const content = data?.resposta || data?.reply || '';
      try {
        const cleaned = content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        const arrMatch = cleaned.match(/\[[\s\S]*\]/);
        if (arrMatch) setFlashcards(JSON.parse(arrMatch[0]).slice(0, 15));
      } catch { /* parsing failed */ }
    } catch (e) { console.error('Erro ao gerar flashcards:', e); }
    finally { setFlashcardsLoading(false); }
  };

  /* ─── Question handlers ─── */
  const handleResponder = () => {
    if (selectedAlt === null) return;
    setAnswered(true);
  };

  const handleNextQuestion = () => {
    setCurrentQIdx(prev => prev + 1);
    setSelectedAlt(null);
    setAnswered(false);
  };

  /* ─── Flashcard handlers ─── */
  const handleNextFc = () => { setCurrentFcIdx(prev => prev + 1); setFlipped(false); };
  const handlePrevFc = () => { setCurrentFcIdx(prev => prev - 1); setFlipped(false); };

  /* ─── Chat ─── */
  const suggestedQuestions = [
    'Resuma o ponto principal',
    'Explique com exemplo prático',
    'Qual a aplicação em concurso?',
    'Quais as exceções a essa regra?',
  ];

  const sendChatMessage = async (msg: string) => {
    if (!msg.trim() || chatLoading) return;
    const userMsg: ChatMessage = { role: 'user', content: msg.trim() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);
    try {
      const { data } = await supabase.functions.invoke('assistente-juridica', {
        body: {
          messages: [
            { role: 'system', content: `Você é uma professora de Direito explicando o conteúdo de uma videoaula sobre o ${artigoNumero}. Use o conteúdo da transcrição abaixo como base para suas respostas. Seja didática e objetiva.\n\nTranscrição: ${contexto.substring(0, 6000)}` },
            ...chatMessages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: msg.trim() },
          ],
          tabelaNome, artigoNumero,
        },
      });
      const reply = data?.resposta || data?.reply || 'Desculpe, não consegui responder.';
      setChatMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      console.error('Erro no chat:', e);
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Erro ao processar sua pergunta.' }]);
    } finally { setChatLoading(false); }
  };

  /* ─── PDF Export ─── */
  const handleExportPdf = async () => {
    if (!resumo || pdfExporting) return;
    setPdfExporting(true);
    try {
      const plainResumo = resumo
        .replace(/#{1,3}\s*/g, '')
        .replace(/\*\*/g, '')
        .replace(/^- /gm, '• ');

      const doc = (
        <Document>
          <Page size="A4" style={pdfStyles.page}>
            <Text style={pdfStyles.title}>{video?.titulo || artigoNumero}</Text>
            <Text style={pdfStyles.subtitle}>{artigoNumero} — Canal: {video?.canal || 'N/A'}</Text>
            <Text style={pdfStyles.body}>{plainResumo}</Text>
            <Text style={pdfStyles.footer} render={({ pageNumber, totalPages }) => `Vacatio — Página ${pageNumber} de ${totalPages}`} fixed />
          </Page>
        </Document>
      );

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resumo-${artigoNumero.replace(/\s+/g, '-')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF baixado com sucesso!');
    } catch (e) {
      console.error('Erro ao exportar PDF:', e);
      toast.error('Erro ao gerar PDF');
    } finally { setPdfExporting(false); }
  };

  if (!video) return null;

  const tabs = [
    { id: 'resumo' as const, label: 'Resumo' },
    { id: 'questoes' as const, label: 'Questões' },
    { id: 'flashcards' as const, label: 'Flashcards' },
  ];

  const currentQ = questoes[currentQIdx];
  const currentFc = flashcards[currentFcIdx];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-[70]" onClick={onClose} />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-0 z-[71] bg-background flex flex-col items-center"
          >
            <div className="w-full max-w-3xl h-full flex flex-col min-h-0">
              {/* Header */}
              <div className="flex items-center gap-3 px-4 pt-4 pb-2 shrink-0">
                <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
                  <ArrowLeft className="w-5 h-5 text-foreground" />
                </button>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-bold text-foreground truncate">Videoaula</h2>
                  <p className="text-[11px] text-muted-foreground truncate">{artigoNumero}</p>
                </div>
              </div>

              {/* Video Player */}
              {video.videoId ? (
                <div className="aspect-video w-full shrink-0 bg-black">
                  <iframe
                    src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&rel=0`}
                    className="w-full h-full"
                    allow="autoplay; encrypted-media; fullscreen"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="aspect-video w-full shrink-0 bg-secondary flex items-center justify-center">
                  <Play className="w-12 h-12 text-muted-foreground" />
                </div>
              )}

              {/* Video Info */}
              <div className="px-4 py-3 border-b border-border shrink-0">
                <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2">{video.titulo}</h3>
                <p className="text-xs text-muted-foreground mt-1">{video.canal}</p>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border shrink-0">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveStudyTab(tab.id)}
                    className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                      activeStudyTab === tab.id
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
                {/* RESUMO TAB */}
                {activeStudyTab === 'resumo' && (
                  <div>
                    {resumoLoading ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <p className="text-xs text-muted-foreground">Gerando resumo...</p>
                      </div>
                    ) : resumo ? (
                      <div className="max-w-none">
                        <ReactMarkdown components={resumoMdComponents}>{resumo}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">Nenhum resumo disponível</p>
                    )}
                  </div>
                )}

                {/* QUESTÕES TAB — one at a time */}
                {activeStudyTab === 'questoes' && (
                  <div>
                    {questoesLoading ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <p className="text-xs text-muted-foreground">Gerando questões...</p>
                      </div>
                    ) : questoes.length > 0 && currentQ ? (
                      <div>
                        <p className="text-xs text-muted-foreground mb-4 text-center">
                          Questão {currentQIdx + 1} de {questoes.length}
                        </p>
                        <div className="rounded-xl border border-border bg-secondary/30 p-4">
                          <p className="text-[13px] font-semibold text-foreground mb-4">
                            <span className="text-primary mr-1.5">{currentQIdx + 1}.</span>
                            {currentQ.pergunta}
                          </p>
                          <div className="space-y-2">
                            {currentQ.alternativas.map((alt, altIdx) => {
                              const isCorrect = altIdx === currentQ.correta;
                              const isSelected = selectedAlt === altIdx;
                              let borderClass = 'border-border';
                              let bgClass = '';
                              let iconEl: React.ReactNode = null;

                              if (answered) {
                                if (isCorrect) {
                                  borderClass = 'border-emerald-500/60';
                                  bgClass = 'bg-emerald-500/10';
                                  iconEl = <Check className="w-4 h-4 text-emerald-500 shrink-0" />;
                                } else if (isSelected && !isCorrect) {
                                  borderClass = 'border-red-500/60';
                                  bgClass = 'bg-red-500/10';
                                  iconEl = <XIcon className="w-4 h-4 text-red-500 shrink-0" />;
                                }
                              } else if (isSelected) {
                                borderClass = 'border-primary/60';
                                bgClass = 'bg-primary/5';
                              }

                              return (
                                <button
                                  key={altIdx}
                                  onClick={() => { if (!answered) setSelectedAlt(altIdx); }}
                                  disabled={answered}
                                  className={`w-full text-left px-3 py-2.5 rounded-lg border ${borderClass} ${bgClass} flex items-center gap-2 transition-all ${
                                    !answered ? 'hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98]' : ''
                                  }`}
                                >
                                  <span className="text-[12px] text-foreground/80 flex-1">{alt}</span>
                                  {iconEl}
                                </button>
                              );
                            })}
                          </div>

                          {/* Responder button */}
                          {!answered && selectedAlt !== null && (
                            <motion.button
                              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                              onClick={handleResponder}
                              className="w-full mt-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
                            >
                              Responder
                            </motion.button>
                          )}

                          {/* Result + Comment */}
                          {answered && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                              <p className={`text-[12px] font-semibold mb-2 ${selectedAlt === currentQ.correta ? 'text-emerald-500' : 'text-red-500'}`}>
                                {selectedAlt === currentQ.correta ? '✓ Correto!' : `✗ Resposta correta: ${currentQ.alternativas[currentQ.correta]}`}
                              </p>
                              {currentQ.comentario && (
                                <div className="rounded-lg bg-muted/50 border border-border p-3">
                                  <p className="text-[11px] font-semibold text-muted-foreground mb-1">Comentário</p>
                                  <p className="text-[12px] text-foreground/80 leading-relaxed">{currentQ.comentario}</p>
                                </div>
                              )}
                              {currentQIdx < questoes.length - 1 && (
                                <button
                                  onClick={handleNextQuestion}
                                  className="w-full mt-3 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2"
                                >
                                  Próxima questão <ChevronRight className="w-4 h-4" />
                                </button>
                              )}
                              {currentQIdx === questoes.length - 1 && (
                                <p className="text-center text-xs text-muted-foreground mt-3">🎉 Você completou todas as questões!</p>
                              )}
                            </motion.div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">Nenhuma questão disponível</p>
                    )}
                  </div>
                )}

                {/* FLASHCARDS TAB — one at a time with flip */}
                {activeStudyTab === 'flashcards' && (
                  <div>
                    {flashcardsLoading ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <p className="text-xs text-muted-foreground">Gerando flashcards...</p>
                      </div>
                    ) : flashcards.length > 0 && currentFc ? (
                      <div>
                        <p className="text-xs text-muted-foreground mb-4 text-center">
                          Flashcard {currentFcIdx + 1} de {flashcards.length}
                        </p>
                        {/* Flip card */}
                        <div className="perspective-[800px] w-full" style={{ perspective: '800px' }}>
                          <motion.div
                            className="relative w-full cursor-pointer"
                            onClick={() => setFlipped(!flipped)}
                            animate={{ rotateY: flipped ? 180 : 0 }}
                            transition={{ duration: 0.5, ease: 'easeInOut' }}
                            style={{ transformStyle: 'preserve-3d' }}
                          >
                            {/* Front */}
                            <div className={`rounded-xl border p-6 min-h-[180px] flex flex-col justify-center ${
                              flipped ? 'invisible' : ''
                            } border-border bg-secondary/30`} style={{ backfaceVisibility: 'hidden' }}>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Pergunta</span>
                                <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
                              </div>
                              <p className="text-[14px] text-foreground leading-relaxed font-medium">{currentFc.frente}</p>
                            </div>
                            {/* Back */}
                            <div className={`rounded-xl border p-6 min-h-[180px] flex flex-col justify-center absolute inset-0 ${
                              !flipped ? 'invisible' : ''
                            } border-primary/40 bg-primary/5`} style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Resposta</span>
                                <RotateCcw className="w-3.5 h-3.5 text-primary/60" />
                              </div>
                              <p className="text-[14px] text-foreground leading-relaxed">{currentFc.verso}</p>
                            </div>
                          </motion.div>
                        </div>

                        {/* Comment below card (visible when flipped) */}
                        <AnimatePresence>
                          {flipped && currentFc.comentario && (
                            <motion.div
                              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                              className="mt-4 rounded-lg bg-muted/50 border border-border p-3"
                            >
                              <p className="text-[11px] font-semibold text-muted-foreground mb-1">Comentário</p>
                              <p className="text-[12px] text-foreground/80 leading-relaxed">{currentFc.comentario}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Navigation */}
                        <div className="flex items-center justify-between mt-4">
                          <button
                            onClick={handlePrevFc}
                            disabled={currentFcIdx === 0}
                            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4" /> Anterior
                          </button>
                          <button
                            onClick={handleNextFc}
                            disabled={currentFcIdx >= flashcards.length - 1}
                            className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-30 transition-colors"
                          >
                            Próximo <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">Nenhum flashcard disponível</p>
                    )}
                  </div>
                )}
              </div>

              {/* Floating action buttons */}
              <div className="absolute bottom-6 right-6 flex flex-col gap-3 z-10">
                {resumo && (
                  <button
                    onClick={handleExportPdf}
                    disabled={pdfExporting}
                    className="w-12 h-12 rounded-full bg-secondary border border-border shadow-lg flex items-center justify-center hover:bg-muted transition-colors"
                    title="Baixar PDF"
                  >
                    {pdfExporting ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : <Download className="w-5 h-5 text-foreground" />}
                  </button>
                )}
                <button
                  onClick={() => setChatOpen(true)}
                  className="w-12 h-12 rounded-full bg-primary shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
                  title="Professora"
                >
                  <MessageCircle className="w-5 h-5 text-primary-foreground" />
                </button>
              </div>
            </div>

            {/* ─── Chat Overlay ─── */}
            <AnimatePresence>
              {chatOpen && (
                <motion.div
                  initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="fixed inset-0 z-[80] bg-background flex flex-col items-center"
                >
                  <div className="w-full max-w-3xl h-full flex flex-col min-h-0">
                    {/* Chat header */}
                    <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border shrink-0">
                      <button onClick={() => setChatOpen(false)} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                      </button>
                      <div>
                        <h2 className="text-sm font-bold text-foreground">Professora IA</h2>
                        <p className="text-[11px] text-muted-foreground">Tire suas dúvidas sobre a videoaula</p>
                      </div>
                    </div>

                    {/* Chat messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
                      {chatMessages.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-sm text-muted-foreground mb-4">Pergunte sobre o conteúdo da videoaula:</p>
                          <div className="flex flex-wrap justify-center gap-2">
                            {suggestedQuestions.map((q, i) => (
                              <button
                                key={i}
                                onClick={() => sendChatMessage(q)}
                                className="px-3 py-2 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-foreground'
                          }`}>
                            {msg.role === 'assistant' ? (
                              <div className="text-[13px] leading-relaxed prose prose-sm max-w-none">
                                <ReactMarkdown components={resumoMdComponents}>{msg.content}</ReactMarkdown>
                              </div>
                            ) : (
                              <p className="text-[13px] leading-relaxed">{msg.content}</p>
                            )}
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-secondary rounded-xl px-4 py-3">
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Suggested questions after messages */}
                    {chatMessages.length > 0 && !chatLoading && (
                      <div className="px-4 pb-2 flex gap-2 overflow-x-auto shrink-0">
                        {suggestedQuestions.map((q, i) => (
                          <button
                            key={i}
                            onClick={() => sendChatMessage(q)}
                            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium hover:bg-primary/20 transition-colors shrink-0"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Chat input */}
                    <div className="px-4 pb-4 pt-2 border-t border-border shrink-0">
                      <div className="flex gap-2">
                        <input
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && sendChatMessage(chatInput)}
                          placeholder="Pergunte sobre a aula..."
                          className="flex-1 px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
                        />
                        <button
                          onClick={() => sendChatMessage(chatInput)}
                          disabled={!chatInput.trim() || chatLoading}
                          className="p-2.5 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 transition-opacity"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default VideoaulaSheet;
