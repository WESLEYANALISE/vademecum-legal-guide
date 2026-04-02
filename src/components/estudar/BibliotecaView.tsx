import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, BookOpen, Upload, Loader2, Trash2, Clock, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import LeitorEbook from './LeitorEbook';

interface Livro {
  id: string;
  titulo: string;
  autor: string | null;
  total_paginas: number;
  ultima_pagina: number;
  status: string;
  created_at: string;
  capa_url: string | null;
  conteudo: { pagina: number; markdown: string }[];
  estrutura_leitura: any;
  versao_processamento: number;
  erro_detalhe: string | null;
}

interface BibliotecaViewProps {
  onBack: () => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ocr: { label: 'Extraindo OCR...', color: 'text-primary' },
  structuring: { label: 'Organizando capítulos com IA...', color: 'text-primary' },
  cleaning: { label: 'Formatando com IA...', color: 'text-primary' },
  processing: { label: 'Processando...', color: 'text-primary' },
  ready: { label: 'Pronto', color: 'text-green-500' },
  error: { label: 'Erro no processamento', color: 'text-red-500' },
};

function parseStatus(status: string): { baseStatus: string; progress: number | null } {
  if (status.startsWith('cleaning:')) {
    const pct = parseInt(status.split(':')[1], 10);
    return { baseStatus: 'cleaning', progress: isNaN(pct) ? null : pct };
  }
  return { baseStatus: status, progress: null };
}

export default function BibliotecaView({ onBack }: BibliotecaViewProps) {
  const { user } = useAuth();
  const [livros, setLivros] = useState<Livro[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedLivro, setSelectedLivro] = useState<Livro | null>(null);

  const fetchLivros = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('biblioteca_livros')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setLivros((data as any[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchLivros();
  }, [fetchLivros]);

  // Poll for processing books + auto-resume stalled cleaning
  const lastStatusRef = React.useRef<Record<string, { status: string; since: number }>>({});

  useEffect(() => {
    const processingBooks = livros.filter(l => {
      const { baseStatus } = parseStatus(l.status);
      return ['ocr', 'structuring', 'cleaning', 'processing'].includes(baseStatus);
    });
    if (processingBooks.length === 0) return;

    const interval = setInterval(async () => {
      await fetchLivros();

      // Check for stalled cleaning (same status for 30+ seconds)
      for (const book of processingBooks) {
        if (!book.status.startsWith('cleaning:')) continue;
        const prev = lastStatusRef.current[book.id];
        const now = Date.now();

        if (prev && prev.status === book.status && (now - prev.since) > 30000) {
          // Stalled — trigger resume
          console.log('Auto-resuming stalled book:', book.id);
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) continue;
            const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
            await fetch(
              `https://${projectId}.supabase.co/functions/v1/processar-pdf`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'resume', livro_id: book.id }),
              }
            );
            lastStatusRef.current[book.id] = { status: '', since: now };
          } catch (e) {
            console.warn('Resume failed:', e);
          }
        } else if (!prev || prev.status !== book.status) {
          lastStatusRef.current[book.id] = { status: book.status, since: now };
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [livros, fetchLivros]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.type !== 'application/pdf') {
      toast.error('Apenas arquivos PDF são aceitos');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error('Arquivo muito grande (máximo 20MB)');
      return;
    }

    setUploading(true);
    const titulo = file.name.replace(/\.pdf$/i, '');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('titulo', titulo);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Faça login para continuar');
        setUploading(false);
        return;
      }

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/processar-pdf`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao iniciar processamento do PDF');
      }

      toast.success(result.message || 'PDF enviado. O processamento começou em segundo plano.');
      fetchLivros();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar PDF');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (livroId: string) => {
    const { error } = await supabase
      .from('biblioteca_livros')
      .delete()
      .eq('id', livroId);
    if (!error) {
      setLivros(prev => prev.filter(l => l.id !== livroId));
      toast.success('Livro removido');
    }
  };

  const handleReprocess = async (livroId: string) => {
    toast.info('Reprocessamento ainda não implementado no servidor');
  };

  const handleUpdateBookmark = async (livroId: string, pagina: number) => {
    await supabase
      .from('biblioteca_livros')
      .update({ ultima_pagina: pagina })
      .eq('id', livroId);
    setLivros(prev =>
      prev.map(l => (l.id === livroId ? { ...l, ultima_pagina: pagina } : l))
    );
  };

  if (selectedLivro) {
    return (
      <LeitorEbook
        livro={selectedLivro}
        onBack={() => setSelectedLivro(null)}
        onUpdateBookmark={(p) => handleUpdateBookmark(selectedLivro.id, p)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-card to-secondary px-4 pt-10 pb-8 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-black/20 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl text-white font-bold">Biblioteca</h1>
              <p className="text-white/70 text-sm">Seus PDFs em formato e-book</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Upload */}
        <label
          className={`flex items-center justify-center gap-3 p-5 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer ${uploading ? 'pointer-events-none opacity-60' : ''}`}
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-sm font-medium text-primary">Processando PDF com OCR...</span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary">Enviar PDF</span>
            </>
          )}
          <input
            type="file"
            accept=".pdf"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>

        {/* Lista de livros */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : livros.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum livro ainda</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Envie um PDF para começar</p>
          </div>
        ) : (
          <AnimatePresence>
            {livros.map((livro, i) => {
              const { baseStatus, progress: cleaningProgress } = parseStatus(livro.status);
              const isReady = baseStatus === 'ready';
              const isProcessing = ['ocr', 'structuring', 'cleaning', 'processing'].includes(baseStatus);
              const isError = baseStatus === 'error';
              const isLegacy = isReady && (!livro.estrutura_leitura || livro.versao_processamento < 2);
              const statusInfo = STATUS_LABELS[baseStatus] || { label: livro.status, color: 'text-muted-foreground' };

              // Calculate progress from estrutura_leitura if available
              let totalDisplayPages = livro.total_paginas;
              if (livro.estrutura_leitura?.chapters) {
                totalDisplayPages = livro.estrutura_leitura.chapters.reduce(
                  (acc: number, ch: any) => acc + 1 + (ch.pages?.length || 0), 0
                );
              }
              const progresso = totalDisplayPages > 0
                ? Math.round((livro.ultima_pagina / totalDisplayPages) * 100)
                : 0;

              return (
                <motion.div
                  key={livro.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all cursor-pointer group"
                  onClick={() => isReady && setSelectedLivro(livro)}
                >
                  <div className="w-14 h-20 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {livro.capa_url ? (
                      <img src={livro.capa_url} alt={livro.titulo} className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen className="w-6 h-6 text-primary/40" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                      {livro.titulo}
                    </p>
                    {isProcessing ? (
                      <div className="mt-1 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Loader2 className="w-3 h-3 animate-spin text-primary" />
                          <span className={`text-xs ${statusInfo.color}`}>
                            {statusInfo.label}
                            {cleaningProgress !== null ? ` ${cleaningProgress}%` : ''}
                          </span>
                        </div>
                        {cleaningProgress !== null && (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all duration-500"
                                style={{ width: `${cleaningProgress}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-primary font-medium">{cleaningProgress}%</span>
                          </div>
                        )}
                      </div>
                    ) : isError ? (
                      <div className="mt-0.5">
                        <span className="text-xs text-destructive">{statusInfo.label}</span>
                        {livro.erro_detalhe && (
                          <p className="text-[10px] text-destructive/70 mt-0.5 line-clamp-2">{livro.erro_detalhe}</p>
                        )}
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {livro.total_paginas} páginas
                          {livro.estrutura_leitura?.chapters && ` · ${livro.estrutura_leitura.chapters.length} capítulos`}
                        </p>
                        {progresso > 0 && (
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${Math.min(progresso, 100)}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground">{Math.min(progresso, 100)}%</span>
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-muted-foreground/50" />
                      <span className="text-[10px] text-muted-foreground/50">
                        {new Date(livro.created_at).toLocaleDateString('pt-BR')}
                      </span>
                      {isLegacy && (
                        <span className="text-[10px] text-amber-500 ml-2">v1</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    {isLegacy && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReprocess(livro.id);
                        }}
                        className="p-2 rounded-lg text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Reprocessar com IA"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(livro.id);
                      }}
                      className="p-2 rounded-lg text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
