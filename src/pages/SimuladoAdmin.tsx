import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, Upload, Trash2, Loader2, FileText, CheckCircle, XCircle, ChevronDown, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface ProcessLog {
  id: string;
  etapa: string;
  detalhe: string;
  questao_numero: number | null;
  image_url: string | null;
  created_at: string;
}

interface Questao {
  id: string;
  numero: number;
  enunciado: string;
  materia: string | null;
  imagem_url: string | null;
  gabarito: string;
}

function SimuladoLogs({ simuladoId, isProcessing }: { simuladoId: string; isProcessing: boolean }) {
  const [logs, setLogs] = useState<ProcessLog[]>([]);

  useEffect(() => {
    if (!simuladoId) return;

    // Load existing logs
    const load = async () => {
      const { data } = await supabase
        .from("simulado_process_logs")
        .select("*")
        .eq("simulado_id", simuladoId)
        .order("created_at", { ascending: true })
        .limit(10000);
      if (data) setLogs(data as ProcessLog[]);
    };
    load();

    // Subscribe to new logs in real time
    const channel = supabase
      .channel(`simulado-logs-${simuladoId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "simulado_process_logs",
          filter: `simulado_id=eq.${simuladoId}`,
        },
        ({ new: row }) => {
          setLogs((prev) => [...prev, row as ProcessLog]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [simuladoId]);

  const etapaIcon = (etapa: string) => {
    switch (etapa) {
      case "ocr_prova": return "📄";
      case "ocr_gabarito": return "📋";
      case "gemini": return "🤖";
      case "questao_extraida": return "✏️";
      case "imagem_pagina": return "🖼️";
      case "imagem_extraida": return "🖼️";
      case "concluido": return "✅";
      case "erro": return "❌";
      default: return "📌";
    }
  };

  if (logs.length === 0) return null;

  return (
    <div className="mt-3 space-y-1 max-h-48 overflow-y-auto border rounded-md p-2 bg-muted/30">
      {logs.map((log) => (
        <div key={log.id} className="flex items-start gap-2 text-xs">
          <span>{etapaIcon(log.etapa)}</span>
          <span className="flex-1 text-muted-foreground">{log.detalhe}</span>
          {log.image_url && (
            <a href={log.image_url} target="_blank" rel="noopener noreferrer">
              <ImageIcon className="w-3 h-3 text-primary" />
            </a>
          )}
        </div>
      ))}
      {isProcessing && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Processando...</span>
        </div>
      )}
    </div>
  );
}

function SimuladoQuestoes({ simuladoId }: { simuladoId: string }) {
  const { data: questoes = [] } = useQuery({
    queryKey: ["simulado-questoes-admin", simuladoId],
    queryFn: async () => {
      const { data } = await supabase
        .from("simulado_questoes")
        .select("id, numero, enunciado, materia, imagem_url, gabarito")
        .eq("simulado_id", simuladoId)
        .order("numero", { ascending: true })
        .limit(10000);
      return (data || []) as Questao[];
    },
  });

  if (questoes.length === 0) return null;

  const comImagem = questoes.filter((q) => q.imagem_url).length;

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs text-muted-foreground">
        {questoes.length} questões{comImagem > 0 ? ` · ${comImagem} com imagem` : ""}
      </p>
      <div className="max-h-60 overflow-y-auto space-y-1 border rounded-md p-2 bg-muted/30">
        {questoes.map((q) => (
          <div key={q.id} className="flex items-center gap-2 text-xs py-1 border-b border-border/50 last:border-0">
            <Badge variant="outline" className="text-[10px] px-1.5 shrink-0">
              Q{q.numero}
            </Badge>
            <span className="flex-1 truncate">{q.enunciado.substring(0, 80)}...</span>
            {q.imagem_url && (
              <a href={q.imagem_url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                <ImageIcon className="w-4 h-4 text-primary" />
              </a>
            )}
            <Badge variant="secondary" className="text-[10px] px-1.5 shrink-0">
              {q.gabarito}
            </Badge>
            {q.materia && (
              <span className="text-[10px] text-muted-foreground shrink-0 hidden sm:inline">
                {q.materia}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SimuladoAdmin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [provaFile, setProvaFile] = useState<File | null>(null);
  const [gabaritoFile, setGabaritoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: simulados = [], isLoading } = useQuery({
    queryKey: ["simulados-admin"],
    queryFn: async () => {
      const { data } = await supabase
        .from("simulados")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
    refetchInterval: 5000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("simulados").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simulados-admin"] });
      toast.success("Simulado excluído");
    },
  });

  const handleSubmit = async () => {
    if (!provaFile || !gabaritoFile || !user) {
      toast.error("Selecione o PDF da prova e o PDF do gabarito");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", provaFile);
      formData.append("gabarito_file", gabaritoFile);
      formData.append("user_id", user.id);

      const { data, error } = await supabase.functions.invoke("processar-simulado", { body: formData });
      if (error) throw error;
      toast.success("Simulado enviado para processamento!");
      setProvaFile(null);
      setGabaritoFile(null);
      const inputs = document.querySelectorAll<HTMLInputElement>('input[type="file"]');
      inputs.forEach((i) => { i.value = ""; });
      queryClient.invalidateQueries({ queryKey: ["simulados-admin"] });
    } catch (e: any) {
      toast.error(e.message || "Erro ao processar simulado");
    } finally {
      setUploading(false);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "ready":
        return <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Pronto</Badge>;
      case "error":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Erro</Badge>;
      default:
        return <Badge variant="secondary"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Processando</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">Simulado Admin</h1>
      </header>

      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nova Prova</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">PDF da Prova</label>
              <div className="flex items-center gap-2">
                <Input type="file" accept=".pdf" onChange={(e) => setProvaFile(e.target.files?.[0] || null)} />
                {provaFile && <FileText className="w-5 h-5 text-primary shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground">
                O título, banca, ano e tipo serão identificados automaticamente
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">PDF do Gabarito</label>
              <div className="flex items-center gap-2">
                <Input type="file" accept=".pdf" onChange={(e) => setGabaritoFile(e.target.files?.[0] || null)} />
                {gabaritoFile && <FileText className="w-5 h-5 text-primary shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground">PDF com o gabarito oficial da prova</p>
            </div>

            <Button onClick={handleSubmit} disabled={uploading || !provaFile || !gabaritoFile} className="w-full">
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Enviar e Processar
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Simulados Cadastrados</h2>
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          )}
          {simulados.map((s: any) => {
            const isProcessing = s.status === "processing";
            const isExpanded = expandedId === s.id;

            return (
              <Collapsible key={s.id} open={isExpanded || isProcessing} onOpenChange={() => setExpandedId(isExpanded ? null : s.id)}>
                <Card>
                  <CardContent className="p-4">
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between cursor-pointer">
                        <div className="space-y-1 flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{s.titulo}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {statusBadge(s.status)}
                            {s.banca && <span className="text-xs text-muted-foreground">{s.banca}</span>}
                            {s.ano && <span className="text-xs text-muted-foreground">{s.ano}</span>}
                            {s.total_questoes > 0 && (
                              <span className="text-xs text-muted-foreground">{s.total_questoes} questões</span>
                            )}
                          </div>
                          {s.erro_detalhe && <p className="text-xs text-destructive mt-1">{s.erro_detalhe}</p>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <ChevronDown
                            className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded || isProcessing ? "rotate-180" : ""}`}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMutation.mutate(s.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <SimuladoLogs simuladoId={s.id} isProcessing={isProcessing} />
                      {s.status === "ready" && <SimuladoQuestoes simuladoId={s.id} />}
                    </CollapsibleContent>
                  </CardContent>
                </Card>
              </Collapsible>
            );
          })}
          {!isLoading && simulados.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">Nenhum simulado cadastrado</p>
          )}
        </div>
      </div>
    </div>
  );
}
