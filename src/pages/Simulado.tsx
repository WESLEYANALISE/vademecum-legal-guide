import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowLeft, ChevronLeft, ChevronRight, BookOpen, Trophy,
  CheckCircle, XCircle, Clock, FileText, Play, AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";

// Clean LaTeX notation to readable Unicode text
function cleanLatex(text: string | null | undefined): string {
  if (!text) return "";
  let t = text;
  // \mathrm{...} → content
  t = t.replace(/\\mathrm\{([^}]+)\}/g, "$1");
  // ^2 ^3 etc superscripts
  t = t.replace(/\^2/g, "²").replace(/\^3/g, "³").replace(/\^0/g, "⁰").replace(/\^1/g, "¹");
  t = t.replace(/\^{(\d+)}/g, (_, d) => d.split("").map((c: string) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[+c] || c).join(""));
  // \frac{a}{b} → a/b
  t = t.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1/$2");
  // Common symbols
  t = t.replace(/\\geq/g, "≥").replace(/\\leq/g, "≤").replace(/\\neq/g, "≠");
  t = t.replace(/\\times/g, "×").replace(/\\div/g, "÷").replace(/\\pi/g, "π");
  t = t.replace(/\\approx/g, "≈").replace(/\\pm/g, "±").replace(/\\sqrt/g, "√");
  // ~ (non-breaking space in LaTeX) → space
  t = t.replace(/~/g, " ");
  // Remove remaining $ delimiters and stray backslashes
  t = t.replace(/\$/g, "").replace(/\\\\/g, "").replace(/\\(?=[a-zA-Z])/g, "");
  return t.trim();
}

type Questao = {
  id: string;
  numero: number;
  enunciado: string;
  texto_base: string | null;
  enunciado_pos_imagem: string | null;
  alternativa_a: string | null;
  alternativa_b: string | null;
  alternativa_c: string | null;
  alternativa_d: string | null;
  alternativa_e: string | null;
  gabarito: string;
  materia: string | null;
  imagem_url: string | null;
};

type SimuladoMeta = {
  id: string;
  titulo: string;
  tipo_prova: string | null;
  banca: string | null;
  ano: number | null;
  orgao: string | null;
  total_questoes: number;
  pdf_url: string | null;
  gabarito_pdf_url: string | null;
};

type ViewState = "list" | "intro" | "quiz" | "result";

export default function Simulado() {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewState>("list");
  const [activeSimulado, setActiveSimulado] = useState<SimuladoMeta | null>(null);
  const [respostas, setRespostas] = useState<Record<number, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<"questao" | "texto">("questao");
  const [respondida, setRespondida] = useState<Record<number, boolean>>({});
  const [selecao, setSelecao] = useState<Record<number, string>>({});
  const { data: simulados = [] } = useQuery({
    queryKey: ["simulados-lista"],
    queryFn: async () => {
      const { data } = await supabase
        .from("simulados")
        .select("id, titulo, tipo_prova, banca, ano, orgao, total_questoes, pdf_url, gabarito_pdf_url")
        .eq("status", "ready")
        .order("created_at", { ascending: false });
      return (data || []) as SimuladoMeta[];
    },
  });

  const { data: questoes = [] } = useQuery({
    queryKey: ["simulado-questoes", activeSimulado?.id],
    queryFn: async () => {
      if (!activeSimulado) return [];
      const { data } = await supabase
        .from("simulado_questoes")
        .select("*")
        .eq("simulado_id", activeSimulado.id)
        .order("ordem", { ascending: true });
      return (data || []) as Questao[];
    },
    enabled: !!activeSimulado,
  });

  const currentQ = questoes[currentIdx];
  const alternativas = currentQ
    ? [
        { key: "A", text: currentQ.alternativa_a },
        { key: "B", text: currentQ.alternativa_b },
        { key: "C", text: currentQ.alternativa_c },
        { key: "D", text: currentQ.alternativa_d },
        { key: "E", text: currentQ.alternativa_e },
      ].filter(a => a.text)
    : [];

  const materias = useMemo(() => {
    const set = new Set<string>();
    questoes.forEach(q => { if (q.materia) set.add(q.materia); });
    return Array.from(set);
  }, [questoes]);

  const resultado = useMemo(() => {
    if (view !== "result") return null;
    let acertos = 0;
    questoes.forEach(q => { if (respostas[q.numero] === q.gabarito) acertos++; });
    return { acertos, erros: questoes.length - acertos, pct: Math.round((acertos / questoes.length) * 100) };
  }, [view, questoes, respostas]);

  const [questionKey, setQuestionKey] = useState(0);

  const handleSelect = (letra: string) => {
    if (respondida[currentQ?.numero]) return;
    setSelecao(prev => ({ ...prev, [currentQ.numero]: letra }));
    // Smooth scroll down so the "Responder" button is visible
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const handleResponder = () => {
    if (!currentQ || !selecao[currentQ.numero]) return;
    setRespostas(prev => ({ ...prev, [currentQ.numero]: selecao[currentQ.numero] }));
    setRespondida(prev => ({ ...prev, [currentQ.numero]: true }));
  };

  const isAnswered = currentQ ? !!respondida[currentQ.numero] : false;
  const currentSelection = currentQ ? selecao[currentQ.numero] : undefined;
  const isCorrect = currentQ ? respostas[currentQ.numero] === currentQ.gabarito : false;

  const handleStartSimulado = (sim: SimuladoMeta) => {
    setActiveSimulado(sim);
    setView("intro");
  };

  const handleBeginQuiz = () => {
    setRespostas({});
    setSelecao({});
    setRespondida({});
    setCurrentIdx(0);
    setActiveTab("questao");
    setView("quiz");
  };

  const resetSimulado = () => {
    setActiveSimulado(null);
    setRespostas({});
    setCurrentIdx(0);
    setView("list");
  };

  const respondidas = Object.keys(respostas).length;

  // ===== LIST VIEW =====
  if (view === "list") {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-foreground"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-bold text-foreground">Simulados</h1>
        </header>
        <div className="p-4 space-y-3 max-w-2xl mx-auto">
          {simulados.length === 0 && (
            <div className="text-center py-16 space-y-3">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhum simulado disponível ainda</p>
            </div>
          )}
          {simulados.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className="cursor-pointer hover:border-primary/50 transition-all active:scale-[0.98]"
                onClick={() => handleStartSimulado(s)}
              >
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {s.tipo_prova && <Badge variant="secondary" className="text-[10px] shrink-0">Concurso Público</Badge>}
                    {s.orgao && <Badge variant="outline" className="text-[10px] shrink-0">{s.orgao}</Badge>}
                  </div>
                  <p className="font-bold text-base text-foreground leading-snug">{s.titulo}</p>
                  <div className="flex items-center gap-4 pt-1 text-center">
                    {s.banca && (
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-muted-foreground">Banca</p>
                        <p className="text-xs font-semibold text-foreground mt-0.5 truncate">{s.banca}</p>
                      </div>
                    )}
                    {s.ano && (
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-muted-foreground">Ano</p>
                        <p className="text-xs font-semibold text-foreground mt-0.5">{s.ano}</p>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-muted-foreground">Questões</p>
                      <p className="text-xs font-semibold text-foreground mt-0.5">{s.total_questoes}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // ===== INTRO VIEW =====
  if (view === "intro" && activeSimulado) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={resetSimulado} className="text-foreground"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-bold text-foreground">Detalhes</h1>
        </header>
        <div className="p-4 max-w-2xl mx-auto space-y-5 pb-8">
          {/* Hero header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/25 via-primary/10 to-transparent p-6 space-y-4">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-8 translate-x-8" />
              <div className="relative space-y-3">
                <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground leading-tight">{activeSimulado.titulo}</h2>
                <div className="flex flex-wrap gap-2">
                  {activeSimulado.banca && <Badge className="bg-primary/15 text-primary border-primary/30 text-xs">{activeSimulado.banca}</Badge>}
                  {activeSimulado.ano && <Badge className="bg-primary/15 text-primary border-primary/30 text-xs">{activeSimulado.ano}</Badge>}
                  {activeSimulado.tipo_prova && <Badge variant="secondary" className="text-xs">{activeSimulado.tipo_prova}</Badge>}
                  {activeSimulado.orgao && <Badge variant="secondary" className="text-xs">{activeSimulado.orgao}</Badge>}
                </div>
              </div>

              {/* Stats */}
              <div className="relative grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-background/60 backdrop-blur text-center border border-border/50">
                  <p className="text-2xl font-bold text-foreground">{activeSimulado.total_questoes}</p>
                  <p className="text-[11px] text-muted-foreground">Questões</p>
                </div>
                <div className="p-3 rounded-xl bg-background/60 backdrop-blur text-center border border-border/50">
                  <p className="text-2xl font-bold text-foreground">{materias.length}</p>
                  <p className="text-[11px] text-muted-foreground">Matérias</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CTA + Orientações */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Button onClick={handleBeginQuiz} className="w-full h-12 text-base gap-2 mb-5">
              <Play className="w-5 h-5" />
              Iniciar Simulado
            </Button>

            <Card className="border-primary/20 overflow-hidden">
              <Tabs defaultValue="orientacoes">
                <TabsList className="w-full rounded-none border-b border-border bg-transparent h-auto p-0">
                  <TabsTrigger value="orientacoes" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs py-2.5 gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> Orientações
                  </TabsTrigger>
                  <TabsTrigger value="arquivos" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs py-2.5 gap-1.5">
                    <Download className="w-3.5 h-3.5" /> Arquivos
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="orientacoes" className="mt-0">
                  <CardContent className="p-4 space-y-2.5">
                    <ul className="space-y-2.5 text-xs text-foreground">
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                        Responda todas as questões no seu ritmo. Você pode navegar entre elas livremente.
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                        Questões com texto de apoio terão uma aba "Texto" para consulta durante a resolução.
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                        Ao finalizar, você verá seu resultado com revisão questão a questão.
                      </li>
                    </ul>
                  </CardContent>
                </TabsContent>

                <TabsContent value="arquivos" className="mt-0">
                  <CardContent className="p-4 space-y-3">
                    {activeSimulado.pdf_url ? (
                      <a
                        href={activeSimulado.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">Prova (PDF)</p>
                          <p className="text-[11px] text-muted-foreground">Baixar prova original</p>
                        </div>
                        <Download className="w-4 h-4 text-muted-foreground shrink-0" />
                      </a>
                    ) : (
                      <p className="text-xs text-muted-foreground">PDF da prova não disponível</p>
                    )}
                    {activeSimulado.gabarito_pdf_url ? (
                      <a
                        href={activeSimulado.gabarito_pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">Gabarito (PDF)</p>
                          <p className="text-[11px] text-muted-foreground">Baixar gabarito oficial</p>
                        </div>
                        <Download className="w-4 h-4 text-muted-foreground shrink-0" />
                      </a>
                    ) : (
                      <p className="text-xs text-muted-foreground">PDF do gabarito não disponível</p>
                    )}
                  </CardContent>
                </TabsContent>
              </Tabs>
            </Card>
          </motion.div>

          {/* Disciplinas por último */}
          {materias.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-2.5">Disciplinas</p>
                  <div className="flex flex-wrap gap-1.5">
                    {materias.map(m => (
                      <Badge key={m} variant="outline" className="text-[10px]">{m}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // ===== RESULT VIEW =====
  if (view === "result" && resultado) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={resetSimulado} className="text-foreground"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-bold text-foreground">Resultado</h1>
        </header>
        <div className="p-4 max-w-2xl mx-auto space-y-6">
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <Trophy className="w-12 h-12 mx-auto text-yellow-500" />
              <div className="text-4xl font-bold text-primary">{resultado.pct}%</div>
              <div className="flex justify-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-500">{resultado.acertos}</div>
                  <div className="text-xs text-muted-foreground">Acertos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">{resultado.erros}</div>
                  <div className="text-xs text-muted-foreground">Erros</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-sm font-semibold text-muted-foreground">Revisão</h2>
          {questoes.map(q => {
            const resp = respostas[q.numero];
            const correto = resp === q.gabarito;
            return (
              <Card key={q.id} className={`border-l-4 ${correto ? "border-l-emerald-500" : "border-l-red-500"}`}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    {correto
                      ? <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      : <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />}
                    <p className="text-sm text-foreground"><strong>Q{q.numero}.</strong> {q.enunciado.substring(0, 150)}...</p>
                  </div>
                  <div className="text-xs text-muted-foreground pl-6">
                    Sua resposta: <strong className={correto ? "text-emerald-500" : "text-red-500"}>{resp || "—"}</strong>
                    {!correto && <> · Gabarito: <strong className="text-emerald-500">{q.gabarito}</strong></>}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <Button onClick={resetSimulado} className="w-full">Voltar aos Simulados</Button>
        </div>
      </div>
    );
  }

  // ===== QUIZ VIEW =====
  const hasTextoBase = !!currentQ?.texto_base;

  // Shared question body renderer
  const renderQuestionBody = () => {
    if (!currentQ) return null;

    const getAltStyle = (key: string) => {
      if (isAnswered) {
        if (key === currentQ.gabarito) return "border-emerald-500 bg-emerald-500/10";
        if (key === respostas[currentQ.numero] && key !== currentQ.gabarito) return "border-red-500 bg-red-500/10";
        return "border-border/50 opacity-50";
      }
      if (currentSelection === key) return "border-primary bg-primary/10 ring-1 ring-primary/30";
      return "border-border hover:bg-muted/30";
    };

    const getAltIcon = (key: string) => {
      if (!isAnswered) return null;
      if (key === currentQ.gabarito) return <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />;
      if (key === respostas[currentQ.numero] && key !== currentQ.gabarito) return <XCircle className="w-4 h-4 text-red-500 shrink-0" />;
      return null;
    };

    return (
      <>
        {/* Matéria / Tema label */}
        {currentQ.materia && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{currentQ.materia}</span>
          </div>
        )}

        {/* Enunciado */}
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">{cleanLatex(currentQ.enunciado)}</p>

        {/* Imagem */}
        {currentQ.imagem_url && (
          <img src={currentQ.imagem_url} alt={`Imagem questão ${currentQ.numero}`} className="max-w-full rounded-lg border border-border" />
        )}

        {/* Texto pós-imagem */}
        {currentQ.enunciado_pos_imagem && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">{cleanLatex(currentQ.enunciado_pos_imagem)}</p>
        )}

        {/* Alternativas */}
        <div className="space-y-2.5">
          {alternativas.map(a => (
            <motion.button
              key={a.key}
              whileTap={!isAnswered ? { scale: 0.98 } : {}}
              onClick={() => handleSelect(a.key)}
              disabled={isAnswered}
              className={`w-full flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${getAltStyle(a.key)}`}
            >
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                isAnswered && a.key === currentQ.gabarito ? "bg-emerald-500 text-white" :
                isAnswered && a.key === respostas[currentQ.numero] && a.key !== currentQ.gabarito ? "bg-red-500 text-white" :
                currentSelection === a.key ? "bg-primary text-primary-foreground" :
                "bg-muted text-muted-foreground"
              }`}>
                {a.key}
              </span>
              <span className="text-sm leading-relaxed flex-1 pt-0.5">{cleanLatex(a.text)}</span>
              {getAltIcon(a.key)}
            </motion.button>
          ))}
        </div>

        {/* Feedback após responder */}
        {isAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3.5 rounded-xl border-2 ${isCorrect ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}`}
          >
            <div className="flex items-center gap-2">
              {isCorrect
                ? <CheckCircle className="w-5 h-5 text-emerald-500" />
                : <XCircle className="w-5 h-5 text-red-500" />}
              <span className={`text-sm font-semibold ${isCorrect ? "text-emerald-500" : "text-red-500"}`}>
                {isCorrect ? "Resposta correta!" : `Incorreta — Gabarito: ${currentQ.gabarito}`}
              </span>
            </div>
          </motion.div>
        )}

        {/* Botão Responder */}
        {!isAnswered && currentSelection && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Button onClick={handleResponder} className="w-full h-11 text-sm font-semibold">
              Responder
            </Button>
          </motion.div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => setView("intro")} className="text-foreground"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Questão {currentIdx + 1} de {questoes.length}</span>
          </div>
          <Progress value={((currentIdx + 1) / questoes.length) * 100} className="h-1.5 mt-1" />
        </div>
      </header>

      {currentQ && (
        <>
          {hasTextoBase ? (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "questao" | "texto")} className="flex-1 flex flex-col">
              <div className="px-4 pt-3">
                <TabsList className="w-full">
                  <TabsTrigger value="questao" className="flex-1 text-xs gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> Questão
                  </TabsTrigger>
                  <TabsTrigger value="texto" className="flex-1 text-xs gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Texto
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="questao" className="flex-1 overflow-y-auto p-4 pb-28 mt-0">
                <motion.div key={questionKey} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
                  {renderQuestionBody()}
                </motion.div>
              </TabsContent>

              <TabsContent value="texto" className="flex-1 overflow-y-auto p-4 pb-28 mt-0">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs font-semibold text-primary mb-3 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> Texto de apoio
                    </p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">{cleanLatex(currentQ.texto_base)}</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <motion.div
              key={questionKey}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-4 overflow-y-auto pb-28"
            >
              {renderQuestionBody()}
            </motion.div>
          )}
        </>
      )}

      {/* Navigation footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <Button variant="outline" size="sm" disabled={currentIdx === 0} onClick={() => { setCurrentIdx(i => i - 1); setActiveTab("questao"); setQuestionKey(k => k + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex-1 flex gap-1 justify-center overflow-x-auto scrollbar-hide">
            {questoes.map((q, i) => (
              <button
                key={q.id}
                onClick={() => { setCurrentIdx(i); setActiveTab("questao"); setQuestionKey(k => k + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={`w-6 h-6 rounded-full text-[10px] font-medium transition-colors shrink-0 ${
                  i === currentIdx ? "bg-primary text-primary-foreground" :
                  respondida[q.numero] && respostas[q.numero] === q.gabarito ? "bg-emerald-500/30 text-emerald-500" :
                  respondida[q.numero] ? "bg-red-500/30 text-red-500" :
                  selecao[q.numero] ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                {q.numero}
              </button>
            ))}
          </div>

          {currentIdx < questoes.length - 1 ? (
            <Button size="sm" onClick={() => { setCurrentIdx(i => i + 1); setActiveTab("questao"); setQuestionKey(k => k + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button size="sm" onClick={() => setView("result")} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Finalizar
            </Button>
          )}
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-1.5">
          {Object.keys(respondida).length} de {questoes.length} respondidas
        </p>
      </div>
    </div>
  );
}
