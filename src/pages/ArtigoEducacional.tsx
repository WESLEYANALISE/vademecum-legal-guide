import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, BookOpen, ExternalLink, Loader2, Share2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { findArtigoBySlug, CATEGORIAS_EDUCACIONAIS } from '@/data/artigosEducacionais';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { TimelineWidget, PyramidWidget, CalloutBox, FlowChartWidget, ComparisonTableWidget } from '@/components/estudar/ArticleWidgets';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Split markdown into sections by ## headings, render each as a collapsible card
function splitIntoSections(md: string): { title: string; body: string; isIntro: boolean }[] {
  const lines = md.split('\n');
  const sections: { title: string; body: string; isIntro: boolean }[] = [];
  let currentTitle = '';
  let currentLines: string[] = [];
  let foundHeading = false;

  for (const line of lines) {
    if (/^##\s+/.test(line)) {
      if (currentLines.length > 0 || currentTitle) {
        sections.push({
          title: currentTitle,
          body: currentLines.join('\n').trim(),
          isIntro: !foundHeading,
        });
      }
      currentTitle = line.replace(/^##\s+/, '').trim();
      currentLines = [];
      foundHeading = true;
    } else {
      currentLines.push(line);
    }
  }
  if (currentLines.length > 0 || currentTitle) {
    sections.push({ title: currentTitle, body: currentLines.join('\n').trim(), isIntro: !foundHeading });
  }
  return sections;
}

const mdComponents = {
  h3: ({ children, ...props }: any) => (
    <h3 {...props} className="text-[16px] font-display font-semibold text-primary mt-6 mb-2 flex items-center gap-2">
      <span className="w-1 h-4 bg-primary/50 rounded-full shrink-0" />
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: any) => (
    <h4 {...props} className="text-[15px] font-display font-semibold text-foreground/90 mt-5 mb-2">
      {children}
    </h4>
  ),
  p: ({ children, ...props }: any) => (
    <p {...props} className="text-foreground/85 leading-[1.85] font-body my-2.5 text-[14.5px]">
      {children}
    </p>
  ),
  blockquote: ({ children, ...props }: any) => {
    // Detect callout syntax: [!type] Title
    const text = extractText(children);
    const calloutMatch = text.match(/^\[!(dica|atencao|exemplo|jurisprudencia|nota|important)\]\s*(.*)/i);
    if (calloutMatch) {
      const type = calloutMatch[1];
      const title = calloutMatch[2] || undefined;
      // Remove the callout marker line from children
      const body = text.replace(/^\[![\w]+\]\s*.*\n?/, '').trim();
      return <CalloutBox type={type} title={title}><p className="text-[13.5px]">{body}</p></CalloutBox>;
    }
    return (
      <blockquote {...props} className="border-l-4 border-l-primary bg-primary/5 rounded-r-xl py-3 px-4 my-5 italic text-foreground/80 font-body text-[14px]">
        {children}
      </blockquote>
    );
  },
  table: ({ children, ...props }: any) => (
    <div className="relative my-5">
      <div className="overflow-x-auto rounded-xl border border-border">
        <table {...props} className="w-full text-sm">{children}</table>
      </div>
      <p className="text-[11px] text-muted-foreground/60 text-center mt-1.5 italic">← Arraste para o lado →</p>
    </div>
  ),
  th: ({ children, ...props }: any) => (
    <th {...props} className="bg-primary/10 text-foreground p-2.5 text-left font-display font-semibold text-xs border-b border-border">
      {children}
    </th>
  ),
  td: ({ children, ...props }: any) => (
    <td {...props} className="p-2.5 text-xs font-body border-b border-border/50 text-foreground/85">
      {children}
    </td>
  ),
  ul: ({ children, ...props }: any) => (
    <ul {...props} className="my-3 space-y-1.5 list-none pl-0">{children}</ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol {...props} className="my-3 space-y-1.5 list-decimal pl-5 marker:text-primary/60">{children}</ol>
  ),
  li: ({ children, ...props }: any) => (
    <li {...props} className="flex items-start gap-2 text-foreground/85 font-body leading-[1.8] text-[14.5px]">
      <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
      <span className="flex-1">{children}</span>
    </li>
  ),
  strong: ({ children, ...props }: any) => (
    <strong {...props} className="text-foreground font-bold">{children}</strong>
  ),
  hr: () => (
    <div className="my-6 flex items-center gap-3">
      <div className="flex-1 h-px bg-border" />
      <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
      <div className="flex-1 h-px bg-border" />
    </div>
  ),
  code: ({ className, children }: any) => {
    const lang = className?.replace('language-', '') || '';
    const raw = String(children).trim();
    try {
      if (lang === 'timeline') {
        return <TimelineWidget items={JSON.parse(raw)} />;
      }
      if (lang === 'pyramid') {
        return <PyramidWidget layers={JSON.parse(raw)} />;
      }
      if (lang === 'flowchart') {
        return <FlowChartWidget steps={JSON.parse(raw)} />;
      }
      if (lang === 'comparison') {
        return <ComparisonTableWidget data={JSON.parse(raw)} />;
      }
    } catch { /* fall through to default */ }
    return <code className={`${className || ''} text-[13px] bg-muted/60 px-1.5 py-0.5 rounded`}>{children}</code>;
  },
  pre: ({ children }: any) => <>{children}</>,
};

function extractText(node: any): string {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node?.props?.children) return extractText(node.props.children);
  return '';
}

const SectionCard = ({ title, body, index, isIntro }: { title: string; body: string; index: number; isIntro: boolean }) => {
  if (isIntro && body) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <ReactMarkdown components={mdComponents}>{body}</ReactMarkdown>
      </motion.div>
    );
  }

  if (!title) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.4) }}
      className="rounded-2xl bg-card border border-border overflow-hidden mb-6"
    >
      {/* Section heading */}
      <div
        className="flex items-center gap-3 p-3.5"
        style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--card)))' }}
      >
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-md shadow-primary/30">
          <span className="text-xs font-display font-bold text-primary-foreground">{index}</span>
        </div>
        <h2 className="flex-1 font-display text-[14px] font-bold text-foreground leading-snug">
          {title}
        </h2>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      {/* Section body - always visible */}
      <div className="px-4 pb-4 pt-2 bg-card">
        <ReactMarkdown components={mdComponents}>{body}</ReactMarkdown>
      </div>
    </motion.div>
  );
};

const SectionedArticle = ({ conteudo }: { conteudo: string }) => {
  const sections = useMemo(() => splitIntoSections(conteudo), [conteudo]);
  let sectionIndex = 0;

  return (
    <div className="space-y-0">
      {sections.map((sec, i) => {
        if (!sec.isIntro) sectionIndex++;
        return (
          <SectionCard
            key={i}
            title={sec.title}
            body={sec.body}
            index={sectionIndex}
            isIntro={sec.isIntro}
          />
        );
      })}
    </div>
  );
};

const ArtigoEducacional = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [conteudo, setConteudo] = useState<string | null>(null);
  const [fontes, setFontes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const artigo = slug ? findArtigoBySlug(slug) : undefined;
  const categoria = CATEGORIAS_EDUCACIONAIS.find(c => c.artigos.some(a => a.slug === slug));

  useEffect(() => {
    if (!slug || !artigo) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      // Try cache first via direct query
      try {
        const { data: cached } = await supabase
          .from('artigo_educacional_cache')
          .select('conteudo_md, fontes')
          .eq('slug', slug)
          .maybeSingle();

        if (cached?.conteudo_md && !cancelled) {
          setConteudo(cached.conteudo_md);
          setFontes((cached.fontes as string[]) || []);
          setLoading(false);
          return;
        }
      } catch {
        // continue to generate
      }

      // Generate via edge function
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/gerar-artigo-educacional`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${anonKey}`,
              'apikey': anonKey,
            },
            body: JSON.stringify({
              slug,
              titulo: artigo.titulo,
              categoria: artigo.categoria,
            }),
          }
        );

        if (!res.ok) throw new Error('Erro ao gerar artigo');

        const data = await res.json();
        if (!cancelled) {
          setConteudo(data.conteudo_md);
          setFontes(data.fontes || []);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Erro ao carregar artigo');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [slug, artigo]);

  if (!artigo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Artigo não encontrado</p>
          <Button variant="outline" onClick={() => navigate('/')}>Voltar</Button>
        </div>
      </div>
    );
  }

  const handleShare = async () => {
    try {
      await navigator.share({ title: artigo.titulo, url: window.location.href });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado!');
    }
  };

  const CategoriaIcon = categoria?.icon || BookOpen;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-3xl mx-auto flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-body truncate">{artigo.categoria}</p>
            <h1 className="font-display text-sm font-bold text-foreground truncate">{artigo.titulo}</h1>
          </div>
          <button onClick={handleShare} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <Share2 className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className={`w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mb-4`}>
            <CategoriaIcon className={`w-7 h-7 ${categoria?.cor || 'text-primary'}`} />
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
            {artigo.titulo}
          </h1>
          <p className="text-muted-foreground font-body text-sm leading-relaxed mb-3">
            {artigo.descricao}
          </p>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-xs">
              <CategoriaIcon className="w-3 h-3 mr-1" />
              {artigo.categoria}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              ~8 min de leitura
            </span>
          </div>
        </motion.div>

        {/* Content */}
        {loading && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 py-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground font-body">
                Pesquisando fontes e gerando artigo...
              </p>
            </div>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-12 space-y-3">
            <p className="text-destructive text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </div>
        )}

        {conteudo && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <SectionedArticle conteudo={conteudo} />

            {/* Sources */}
            {fontes.length > 0 && (
              <div className="mt-10 pt-6 border-t border-border">
                <h3 className="font-display text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  Fontes Consultadas
                </h3>
                <div className="space-y-2">
                  {fontes.map((fonte, i) => (
                    <a
                      key={i}
                      href={fonte}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2.5 p-3 rounded-xl bg-card hover:bg-secondary/60 transition-all group"
                    >
                      <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                      </div>
                      <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors font-body break-all leading-relaxed">
                        {fonte}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ArtigoEducacional;
