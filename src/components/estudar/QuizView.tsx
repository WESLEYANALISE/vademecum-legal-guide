import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, Loader2, ChevronRight, RotateCcw, Lightbulb, GripVertical } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Progress } from '@/components/ui/progress';
import React from 'react';

// --- Types ---
interface QMultiplaEscolha {
  tipo: 'multipla_escolha';
  enunciado: string;
  alternativas: { A: string; B: string; C: string; D: string };
  gabarito: string;
  comentario: string;
  exemplo_pratico?: string;
}
interface QCertoErrado {
  tipo: 'certo_errado';
  afirmacao: string;
  gabarito: 'certo' | 'errado';
  comentario: string;
  exemplo_pratico?: string;
}
interface QCompletarPalavra {
  tipo: 'completar_palavra';
  frase: string;
  opcao_a: string;
  opcao_b: string;
  gabarito: 'a' | 'b';
  comentario: string;
  exemplo_pratico?: string;
}
interface QPreencherLacuna {
  tipo: 'preencher_lacuna';
  frase: string;
  resposta: string;
  dica: string;
  comentario: string;
}
interface QAssociarColunas {
  tipo: 'associar_colunas';
  pares: { conceito: string; definicao: string }[];
  comentario: string;
}
interface QOrdenarItens {
  tipo: 'ordenar_itens';
  enunciado: string;
  itens: string[];
  comentario: string;
}

type Question = QMultiplaEscolha | QCertoErrado | QCompletarPalavra | QPreencherLacuna | QAssociarColunas | QOrdenarItens;

interface Props {
  tabelaNome: string;
  artigoNumero: string;
  leiNome: string;
  onBack: () => void;
}

// --- Helpers ---
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const LEGAL_TERMS = /\b(Art\.\s*\d+[º°]?(?:-[A-Z])?|§\s*\d+[º°]?|cláusula pétrea|devido processo legal|presunção de inocência|mandado de segurança|habeas corpus|ação civil pública)\b/gi;

function highlightKeyTerms(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = new RegExp(LEGAL_TERMS.source, 'gi');
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(
      <mark key={match.index} className="bg-primary/20 text-primary font-semibold px-0.5 rounded-sm">
        {match[0]}
      </mark>
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length > 0 ? parts : [text];
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  multipla_escolha: { label: 'Múltipla Escolha', color: 'text-blue-400' },
  certo_errado: { label: 'Certo ou Errado', color: 'text-emerald-400' },
  completar_palavra: { label: 'Complete a Frase', color: 'text-purple-400' },
  preencher_lacuna: { label: 'Preencha a Lacuna', color: 'text-amber-400' },
  associar_colunas: { label: 'Associar Colunas', color: 'text-pink-400' },
  ordenar_itens: { label: 'Ordenar Itens', color: 'text-cyan-400' },
};

// --- Main Component ---
const QuizView = ({ tabelaNome, artigoNumero, leiNome, onBack }: Props) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);
  const feedbackRef = useRef<HTMLDivElement>(null);

  // Per-type state
  const [mcSelected, setMcSelected] = useState<string | null>(null);
  const [ceSelected, setCeSelected] = useState<string | null>(null);
  const [cpSelected, setCpSelected] = useState<string | null>(null);
  const [lacunaInput, setLacunaInput] = useState('');
  const [assocSelected, setAssocSelected] = useState<Record<string, string>>({});
  const [shuffledDefs, setShuffledDefs] = useState<string[]>([]);
  const [activeConceito, setActiveConceito] = useState<string | null>(null);
  const [ordenItems, setOrdenItems] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setGenerating(false);
      setError('');
      try {
        // Check cache first
        const { data: cached } = await supabase
          .from('artigo_ai_cache')
          .select('conteudo')
          .eq('tabela_nome', tabelaNome)
          .eq('artigo_numero', artigoNumero)
          .eq('modo', 'questoes')
          .maybeSingle();

        if (cached?.conteudo) {
          const parsed = JSON.parse(cached.conteudo);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.tipo) {
            setQuestions(parsed);
            setLoading(false);
            setCountdown(3);
            return;
          }
        }

        setGenerating(true);
        const res = await supabase.functions.invoke('gerar-estudo', {
          body: { tabela_nome: tabelaNome, artigo_numero: artigoNumero, mode: 'questoes' },
        });
        if (res.error) throw res.error;
        const data = res.data?.data;
        if (!Array.isArray(data) || data.length === 0) throw new Error('Sem questões geradas');
        setQuestions(data);
        setCountdown(3);
      } catch (e: any) {
        setError(e.message || 'Erro ao gerar questões');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tabelaNome, artigoNumero]);

  const q = questions[currentIdx];
  const progress = questions.length > 0 ? ((currentIdx + (answered ? 1 : 0)) / questions.length) * 100 : 0;

  const resetPerType = useCallback(() => {
    setMcSelected(null);
    setCeSelected(null);
    setCpSelected(null);
    setLacunaInput('');
    setAssocSelected({});
    setActiveConceito(null);
    setShowExample(false);
  }, []);

  // Initialize per-question state
  useEffect(() => {
    if (!q) return;
    resetPerType();
    if (q.tipo === 'associar_colunas') {
      setShuffledDefs(shuffleArray(q.pares.map(p => p.definicao)));
    }
    if (q.tipo === 'ordenar_itens') {
      setOrdenItems(shuffleArray(q.itens));
    }
  }, [currentIdx, q, resetPerType]);

  const scrollToFeedback = () => {
    setTimeout(() => feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350);
  };

  const markAnswer = (correct: boolean) => {
    setAnswered(true);
    setResults(prev => [...prev, correct]);
    scrollToFeedback();
  };

  const handleNext = async () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setAnswered(false);
      resetPerType();
    } else {
      setFinished(true);
      if (user) {
        const correct = results.filter(Boolean).length;
        const { data: sess } = await supabase.from('study_sessions').insert({
          user_id: user.id,
          tabela_nome: tabelaNome,
          artigo_numero: artigoNumero,
          mode: 'questoes',
          total: questions.length,
          correct,
        }).select('id').single();

        if (sess?.id) {
          const answers = results.map((is_correct, i) => ({
            session_id: sess.id,
            question_index: i,
            selected_answer: '',
            is_correct,
          }));
          await supabase.from('study_answers').insert(answers);
        }
      }
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setAnswered(false);
    resetPerType();
    setResults([]);
    setFinished(false);
  };

  // --- Loading ---
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Gerando questões com IA...</p>
        <p className="text-xs text-muted-foreground/60">Art. {artigoNumero} — {leiNome}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6">
        <XCircle className="w-10 h-10 text-destructive" />
        <p className="text-sm text-destructive text-center">{error}</p>
        <button onClick={onBack} className="text-sm text-primary underline">Voltar</button>
      </div>
    );
  }

  // --- Finished ---
  if (finished) {
    const correct = results.filter(Boolean).length;
    const pct = Math.round((correct / questions.length) * 100);
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="bg-gradient-to-br from-primary/20 via-card to-secondary px-4 pt-10 pb-8 relative overflow-hidden">
          <motion.div initial={{ opacity: 0, scale: 0.8, rotate: -10 }} animate={{ opacity: 0.07, scale: 1, rotate: 0 }} transition={{ duration: 0.8 }} className="absolute right-4 top-4 pointer-events-none">
            <CheckCircle2 className="w-28 h-28 text-primary" />
          </motion.div>
          <div className="max-w-2xl mx-auto relative z-10">
            <button onClick={onBack} className="flex items-center gap-2 text-white/80 hover:text-white text-sm mb-4">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
            <h1 className="font-display text-2xl text-white font-bold">Resultado</h1>
            <p className="text-white/70 text-sm">Art. {artigoNumero} — {leiNome}</p>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-4">
            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-3xl font-bold ${pct >= 70 ? 'bg-emerald-500/20 text-emerald-400' : pct >= 40 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
              {pct}%
            </div>
            <p className="text-lg font-semibold text-foreground">{correct} de {questions.length} corretas</p>
            <p className="text-sm text-muted-foreground">
              {pct >= 70 ? 'Excelente! Você domina esse artigo.' : pct >= 40 ? 'Bom, mas pode melhorar.' : 'Precisa revisar com mais atenção.'}
            </p>
            <button onClick={handleRestart} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors">
              <RotateCcw className="w-4 h-4" /> Tentar novamente
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // --- Question type badge ---
  const typeInfo = TYPE_LABELS[q.tipo] || { label: q.tipo, color: 'text-muted-foreground' };

  // --- Render per type ---
  const renderQuestion = () => {
    switch (q.tipo) {
      case 'multipla_escolha': return <MultiplaEscolhaRenderer q={q} selected={mcSelected} answered={answered} onSelect={(l) => { setMcSelected(l); markAnswer(l === q.gabarito); }} />;
      case 'certo_errado': return <CertoErradoRenderer q={q} selected={ceSelected} answered={answered} onSelect={(v) => { setCeSelected(v); markAnswer(v === q.gabarito); }} />;
      case 'completar_palavra': return <CompletarPalavraRenderer q={q} selected={cpSelected} answered={answered} onSelect={(v) => { setCpSelected(v); markAnswer(v === q.gabarito); }} />;
      case 'preencher_lacuna': return <PreencherLacunaRenderer q={q} input={lacunaInput} setInput={setLacunaInput} answered={answered} onSubmit={() => { markAnswer(lacunaInput.trim().toLowerCase() === q.resposta.trim().toLowerCase()); }} />;
      case 'associar_colunas': return <AssociarColunasRenderer q={q} assoc={assocSelected} setAssoc={setAssocSelected} shuffledDefs={shuffledDefs} activeConceito={activeConceito} setActiveConceito={setActiveConceito} answered={answered} onSubmit={() => { const correct = q.pares.every(p => assocSelected[p.conceito] === p.definicao); markAnswer(correct); }} />;
      case 'ordenar_itens': return <OrdenarItensRenderer q={q} items={ordenItems} setItems={setOrdenItems} answered={answered} onSubmit={() => { const correct = ordenItems.every((item, i) => item === q.itens[i]); markAnswer(correct); }} />;
      default: return <p className="text-foreground">Tipo de questão não reconhecido.</p>;
    }
  };

  const comentario = 'comentario' in q ? (q as any).comentario : '';
  const exemploPratico = 'exemplo_pratico' in q ? (q as any).exemplo_pratico : '';

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-gradient-to-br from-primary/20 via-card to-secondary px-4 pt-10 pb-6 relative overflow-hidden">
        <motion.div initial={{ opacity: 0, scale: 0.8, rotate: 12 }} animate={{ opacity: 0.07, scale: 1, rotate: 0 }} transition={{ duration: 0.8 }} className="absolute right-3 top-3 pointer-events-none">
          <Lightbulb className="w-32 h-32 text-primary" />
        </motion.div>
        <div className="max-w-2xl mx-auto relative z-10">
          <button onClick={onBack} className="flex items-center gap-2 text-white/80 hover:text-white text-sm mb-3">
            <ArrowLeft className="w-4 h-4" /> Sair
          </button>
          <p className="text-white/70 text-xs mb-1">Art. {artigoNumero} — {leiNome}</p>
          <div className="flex items-center gap-3">
            <Progress value={progress} className="flex-1 h-2 bg-white/20" />
            <span className="text-white text-xs font-medium">{currentIdx + 1}/{questions.length}</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div key={currentIdx} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
            {/* Type badge */}
            <span className={`text-[11px] font-bold ${typeInfo.color} mb-3 block`}>{typeInfo.label}</span>

            {renderQuestion()}

            {/* Feedback */}
            {answered && (
              <motion.div ref={feedbackRef} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-3">
                {comentario && (
                  <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="text-xs font-bold text-primary">📝 Comentário</p>
                      {exemploPratico && (
                        <button onClick={() => setShowExample(true)} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/15 text-purple-400 text-[11px] font-semibold hover:bg-purple-500/25 transition-colors">
                          <Lightbulb className="w-3 h-3" /> Ver exemplo
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed">{highlightKeyTerms(comentario)}</p>
                  </div>
                )}

                {/* Exemplo prático sheet */}
                <AnimatePresence>
                  {showExample && exemploPratico && (
                    <>
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowExample(false)} />
                      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 300 }} className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-2xl p-5 pb-8 max-h-[70vh] overflow-y-auto">
                        <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-xs font-bold text-primary mb-2 flex items-center gap-1.5"><Lightbulb className="w-4 h-4" /> Exemplo Prático</p>
                        <p className="text-sm text-foreground/90 leading-relaxed">{exemploPratico}</p>
                        <button onClick={() => setShowExample(false)} className="w-full mt-5 py-3 rounded-xl bg-secondary border border-border text-foreground font-medium text-sm">Fechar</button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

                <button onClick={handleNext} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors">
                  {currentIdx < questions.length - 1 ? <>Próxima <ChevronRight className="w-4 h-4" /></> : 'Ver Resultado'}
                </button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// ========================
// SUB-RENDERERS
// ========================

// 1. Múltipla Escolha
const MultiplaEscolhaRenderer = ({ q, selected, answered, onSelect }: { q: QMultiplaEscolha; selected: string | null; answered: boolean; onSelect: (l: string) => void }) => (
  <div>
    <p className="text-[15px] font-semibold text-foreground leading-relaxed mb-5">{q.enunciado}</p>
    <div className="space-y-2.5">
      {(['A', 'B', 'C', 'D'] as const).map((letter) => {
        const isCorrect = letter === q.gabarito;
        const isSelected = letter === selected;
        let borderClass = 'border-border';
        let bgClass = 'bg-card';
        if (answered) {
          if (isCorrect) { borderClass = 'border-emerald-500'; bgClass = 'bg-emerald-500/10'; }
          else if (isSelected && !isCorrect) { borderClass = 'border-red-500'; bgClass = 'bg-red-500/10'; }
        }
        return (
          <button key={letter} onClick={() => onSelect(letter)} disabled={answered} className={`w-full flex items-start gap-3 p-3.5 rounded-xl border ${borderClass} ${bgClass} transition-all text-left`}>
            <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${answered && isCorrect ? 'bg-emerald-500 text-white' : answered && isSelected ? 'bg-red-500 text-white' : 'bg-primary/20 text-primary'}`}>
              {answered && isCorrect ? <CheckCircle2 className="w-4 h-4" /> : answered && isSelected && !isCorrect ? <XCircle className="w-4 h-4" /> : letter}
            </span>
            <span className="text-[13px] text-foreground leading-relaxed">{q.alternativas[letter]}</span>
          </button>
        );
      })}
    </div>
  </div>
);

// 2. Certo ou Errado
const CertoErradoRenderer = ({ q, selected, answered, onSelect }: { q: QCertoErrado; selected: string | null; answered: boolean; onSelect: (v: string) => void }) => (
  <div>
    <p className="text-[15px] font-semibold text-foreground leading-relaxed mb-5">{q.afirmacao}</p>
    <div className="grid grid-cols-2 gap-3">
      {['certo', 'errado'].map((v) => {
        const isCorrect = v === q.gabarito;
        const isSelected = v === selected;
        let cls = 'border-border bg-card';
        if (answered) {
          if (isCorrect) cls = 'border-emerald-500 bg-emerald-500/10';
          else if (isSelected) cls = 'border-red-500 bg-red-500/10';
        }
        return (
          <button key={v} onClick={() => onSelect(v)} disabled={answered} className={`p-4 rounded-xl border ${cls} transition-all text-center`}>
            <span className={`text-lg ${answered && isCorrect ? 'text-emerald-400' : answered && isSelected ? 'text-red-400' : 'text-foreground'}`}>
              {v === 'certo' ? '✅' : '❌'}
            </span>
            <p className={`text-sm font-semibold mt-1 ${answered && isCorrect ? 'text-emerald-400' : answered && isSelected ? 'text-red-400' : 'text-foreground'}`}>
              {v === 'certo' ? 'Certo' : 'Errado'}
            </p>
          </button>
        );
      })}
    </div>
  </div>
);

// 3. Completar Palavra
const CompletarPalavraRenderer = ({ q, selected, answered, onSelect }: { q: QCompletarPalavra; selected: string | null; answered: boolean; onSelect: (v: string) => void }) => (
  <div>
    <p className="text-[15px] text-foreground leading-relaxed mb-5">
      {q.frase.split('___').map((part, i, arr) => (
        <React.Fragment key={i}>
          {part}
          {i < arr.length - 1 && <span className="inline-block px-2 py-0.5 mx-1 rounded bg-primary/20 text-primary font-bold">___</span>}
        </React.Fragment>
      ))}
    </p>
    <div className="grid grid-cols-2 gap-3">
      {['a', 'b'].map((v) => {
        const text = v === 'a' ? q.opcao_a : q.opcao_b;
        const isCorrect = v === q.gabarito;
        const isSelected = v === selected;
        let cls = 'border-border bg-card';
        if (answered) {
          if (isCorrect) cls = 'border-emerald-500 bg-emerald-500/10';
          else if (isSelected) cls = 'border-red-500 bg-red-500/10';
        }
        return (
          <button key={v} onClick={() => onSelect(v)} disabled={answered} className={`p-3.5 rounded-xl border ${cls} transition-all text-center`}>
            <span className={`text-[13px] font-semibold ${answered && isCorrect ? 'text-emerald-400' : answered && isSelected ? 'text-red-400' : 'text-foreground'}`}>{text}</span>
          </button>
        );
      })}
    </div>
  </div>
);

// 4. Preencher Lacuna
const PreencherLacunaRenderer = ({ q, input, setInput, answered, onSubmit }: { q: QPreencherLacuna; input: string; setInput: (v: string) => void; answered: boolean; onSubmit: () => void }) => {
  const isCorrect = input.trim().toLowerCase() === q.resposta.trim().toLowerCase();
  return (
    <div>
      <p className="text-[15px] text-foreground leading-relaxed mb-4">
        {q.frase.split('___').map((part, i, arr) => (
          <React.Fragment key={i}>
            {part}
            {i < arr.length - 1 && (
              answered ? (
                <span className={`inline-block px-2 py-0.5 mx-1 rounded font-bold ${isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400 line-through'}`}>
                  {input || '?'}
                </span>
              ) : (
                <span className="inline-block px-2 py-0.5 mx-1 rounded bg-primary/20 text-primary font-bold">___</span>
              )
            )}
          </React.Fragment>
        ))}
      </p>
      {!answered && <p className="text-xs text-muted-foreground mb-3">💡 Dica: {q.dica}</p>}
      {!answered ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua resposta..."
            className="flex-1 px-4 py-3 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:border-primary"
            onKeyDown={(e) => e.key === 'Enter' && input.trim() && onSubmit()}
          />
          <button onClick={onSubmit} disabled={!input.trim()} className="px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40">
            Confirmar
          </button>
        </div>
      ) : !isCorrect ? (
        <p className="text-sm text-emerald-400 font-medium">Resposta correta: <span className="font-bold">{q.resposta}</span></p>
      ) : null}
    </div>
  );
};

// 5. Associar Colunas
const AssociarColunasRenderer = ({ q, assoc, setAssoc, shuffledDefs, activeConceito, setActiveConceito, answered, onSubmit }: {
  q: QAssociarColunas; assoc: Record<string, string>; setAssoc: (v: Record<string, string>) => void;
  shuffledDefs: string[]; activeConceito: string | null; setActiveConceito: (v: string | null) => void;
  answered: boolean; onSubmit: () => void;
}) => {
  const usedDefs = new Set(Object.values(assoc));

  const handleDefClick = (def: string) => {
    if (!activeConceito || answered) return;
    setAssoc({ ...assoc, [activeConceito]: def });
    setActiveConceito(null);
  };

  return (
    <div>
      <p className="text-[15px] font-semibold text-foreground mb-4">Associe cada conceito à sua definição:</p>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Conceitos</p>
          {q.pares.map((p) => {
            const isActive = activeConceito === p.conceito;
            const hasMatch = !!assoc[p.conceito];
            const isCorrectMatch = answered && assoc[p.conceito] === p.definicao;
            const isWrongMatch = answered && hasMatch && assoc[p.conceito] !== p.definicao;
            return (
              <button
                key={p.conceito}
                onClick={() => !answered && setActiveConceito(isActive ? null : p.conceito)}
                className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all ${
                  isCorrectMatch ? 'border-emerald-500 bg-emerald-500/10' :
                  isWrongMatch ? 'border-red-500 bg-red-500/10' :
                  isActive ? 'border-primary bg-primary/10' :
                  hasMatch ? 'border-primary/40 bg-card' : 'border-border bg-card'
                }`}
              >
                <span className="font-semibold text-foreground">{p.conceito}</span>
                {hasMatch && <span className="block text-[10px] text-muted-foreground mt-0.5 truncate">→ {assoc[p.conceito]}</span>}
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Definições</p>
          {shuffledDefs.map((def) => {
            const isUsed = usedDefs.has(def);
            return (
              <button
                key={def}
                onClick={() => handleDefClick(def)}
                disabled={isUsed && !answered}
                className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all ${
                  isUsed ? 'border-primary/30 bg-card opacity-50' : activeConceito ? 'border-primary/40 bg-card hover:border-primary' : 'border-border bg-card'
                }`}
              >
                {def}
              </button>
            );
          })}
        </div>
      </div>
      {!answered && (
        <button onClick={onSubmit} disabled={Object.keys(assoc).length < q.pares.length} className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 transition-colors">
          Confirmar
        </button>
      )}
    </div>
  );
};

// 6. Ordenar Itens
const OrdenarItensRenderer = ({ q, items, setItems, answered, onSubmit }: {
  q: QOrdenarItens; items: string[]; setItems: (v: string[]) => void;
  answered: boolean; onSubmit: () => void;
}) => {
  const moveItem = (from: number, to: number) => {
    if (answered || to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setItems(next);
  };

  return (
    <div>
      <p className="text-[15px] font-semibold text-foreground leading-relaxed mb-4">{q.enunciado}</p>
      <div className="space-y-2 mb-4">
        {items.map((item, i) => {
          const correctIdx = q.itens.indexOf(item);
          const isCorrectPos = answered && correctIdx === i;
          const isWrongPos = answered && correctIdx !== i;
          return (
            <div
              key={item}
              className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                isCorrectPos ? 'border-emerald-500 bg-emerald-500/10' :
                isWrongPos ? 'border-red-500 bg-red-500/10' :
                'border-border bg-card'
              }`}
            >
              <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}.</span>
              <span className="flex-1 text-[13px] text-foreground">{item}</span>
              {!answered && (
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveItem(i, i - 1)} className="text-muted-foreground hover:text-foreground p-0.5" disabled={i === 0}>
                    <ChevronRight className="w-3.5 h-3.5 -rotate-90" />
                  </button>
                  <button onClick={() => moveItem(i, i + 1)} className="text-muted-foreground hover:text-foreground p-0.5" disabled={i === items.length - 1}>
                    <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {!answered && (
        <button onClick={onSubmit} className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-colors">
          Confirmar Ordem
        </button>
      )}
      {answered && (
        <div className="p-3 rounded-xl bg-muted/30 border border-border">
          <p className="text-xs font-bold text-muted-foreground mb-2">Ordem correta:</p>
          {q.itens.map((item, i) => (
            <p key={i} className="text-xs text-foreground/80"><span className="font-bold">{i + 1}.</span> {item}</p>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizView;
