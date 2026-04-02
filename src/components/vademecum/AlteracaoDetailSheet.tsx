import { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, FileText, RefreshCw, ExternalLink, Scale, User, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';

interface AlteracaoDetailProps {
  leiNome: string;
  artigoNumero: string;
  artigoTexto: string;
  tipo: string;
  referencia: string;
  parteModificada: string;
  ano: number;
  onClose: () => void;
}

interface LeiInfo {
  numero: string;
  ano: number;
  ementa: string;
  autorNome?: string;
  autorFoto?: string;
  urlInteiroTeor?: string;
}

/** Build a probable Planalto URL from the reference string */
const buildPlanaltoUrl = (referencia: string, ano: number): string | null => {
  const isComplementar = /complementar/i.test(referencia);
  const numMatch = referencia.match(/n[ºo°]?\s*([\d.]+)/i);
  if (!numMatch) return null;
  const num = numMatch[1].replace(/\./g, '');

  if (isComplementar) {
    return `https://www.planalto.gov.br/ccivil_03/LEIS/LCP/Lcp${num}.htm`;
  }

  // Ordinary law: /ccivil_03/_ato{start}-{end}/{year}/lei/L{num}.htm
  const y = ano > 0 ? ano : new Date().getFullYear();
  const end = Math.ceil(y / 4) * 4;
  const start = end - 3;
  return `https://www.planalto.gov.br/ccivil_03/_ato${start}-${end}/${y}/lei/L${num}.htm`;
};

const AlteracaoDetailSheet = ({
  leiNome,
  artigoNumero,
  artigoTexto,
  tipo,
  referencia,
  parteModificada,
  ano,
  onClose,
}: AlteracaoDetailProps) => {
  const [analise, setAnalise] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(true);
  const [leiInfo, setLeiInfo] = useState<LeiInfo | null>(null);
  const [loadingLei, setLoadingLei] = useState(true);
  const [inteiroTeor, setInteiroTeor] = useState<string | null>(null);
  const [loadingTeor, setLoadingTeor] = useState(false);
  const [teorError, setTeorError] = useState(false);
  const [activeTab, setActiveTab] = useState('original');

  // Normalize for comparison
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const refNorm = norm(referencia);

  // Extract law number AND year from referencia
  const extractLeiRef = () => {
    const numMatch = referencia.match(/(?:lei|decreto|emenda|medida)\s*(?:complementar|ordinária)?\s*(?:nº|n°|n\.?)\s*([\d.]+)/i);
    const yearMatch = referencia.match(/de\s+(\d{4})/i);
    return {
      numero: numMatch ? numMatch[1].replace(/\./g, '') : null,
      ano: yearMatch ? parseInt(yearMatch[1]) : null,
    };
  };

  const tipoBadge = () => {
    const t = tipo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (t.startsWith('revogad') || t.startsWith('vetad') || t.startsWith('suprimid'))
      return 'bg-destructive/20 text-destructive border-destructive/30';
    if (t.startsWith('incluid') || t.startsWith('acrescid'))
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (t.startsWith('redacao') || t.startsWith('alterad'))
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-violet-500/20 text-violet-400 border-violet-500/30';
  };

  // Clean artigo number to avoid "Art. Art."
  const displayNumero = artigoNumero.replace(/^Art\.?\s*/i, '').trim();

  // Computed Planalto URL
  const planaltoDirectUrl = buildPlanaltoUrl(referencia, ano);

  // Render highlighted text
  const renderHighlightedText = () => {
    const lines = artigoTexto.split('\n').filter(l => l.trim());
    return lines.map((line, i) => {
      const lineNorm = norm(line);
      const isThisRef = lineNorm.includes(refNorm);
      return (
        <div
          key={i}
          className={`px-4 py-2 text-[13px] leading-relaxed ${
            isThisRef
              ? 'bg-violet-500/15 border-l-2 border-violet-500 text-foreground'
              : 'text-muted-foreground'
          }`}
        >
          {line}
        </div>
      );
    });
  };

  // Fetch lei/proposição info
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { numero: leiNum, ano: leiAno } = extractLeiRef();
        if (!leiNum) { setLoadingLei(false); return; }

        let query = supabase
          .from('leis_ordinarias')
          .select('numero_lei, ano, ementa, url')
          .ilike('numero_lei', `%${leiNum}%`);
        if (leiAno) query = query.eq('ano', leiAno);

        const { data: lei } = await query.limit(1).maybeSingle();

        if (!cancelled && lei) {
          setLeiInfo({
            numero: lei.numero_lei,
            ano: lei.ano,
            ementa: lei.ementa,
            urlInteiroTeor: lei.url || undefined,
          });
        }

        // Try to find matching proposição for author info
        const isComplementar = /complementar/i.test(referencia);
        let propQuery = supabase
          .from('radar_proposicoes')
          .select('autor, autor_foto, ementa, url_inteiro_teor');

        if (isComplementar) {
          propQuery = propQuery.eq('sigla_tipo', 'PLP').ilike('ementa', `%${leiNum}%`);
        } else {
          propQuery = propQuery.ilike('ementa', `%${leiNum}%`);
        }
        if (leiAno) propQuery = propQuery.eq('ano', leiAno);

        const { data: props } = await propQuery.limit(1);

        if (!cancelled && props && props.length > 0) {
          setLeiInfo(prev => ({
            numero: prev?.numero || `Lei ${leiNum}`,
            ano: prev?.ano || (leiAno || ano),
            ementa: prev?.ementa || props[0].ementa || referencia,
            autorNome: props[0].autor || undefined,
            autorFoto: props[0].autor_foto || undefined,
            urlInteiroTeor: prev?.urlInteiroTeor || props[0].url_inteiro_teor || undefined,
          }));
        }
      } catch (e) {
        console.warn('LeiInfo lookup error:', e);
      }
      if (!cancelled) setLoadingLei(false);
    })();
    return () => { cancelled = true; };
  }, [referencia, ano]);

  // Fetch AI analysis
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await supabase.functions.invoke('assistente-juridica', {
          body: {
            mode: 'explicar_alteracao',
            artigoTexto,
            artigoNumero: displayNumero,
            leiNome,
            referencia,
            parteModificada,
            tipo,
          },
        });
        if (!cancelled && res.data?.reply) {
          setAnalise(res.data.reply);
        }
      } catch (e) {
        console.error('AI analysis error:', e);
      }
      if (!cancelled) setLoadingAI(false);
    })();
    return () => { cancelled = true; };
  }, [artigoTexto, displayNumero, leiNome, referencia]);

  // Fetch inteiro teor when tab is selected
  useEffect(() => {
    if (activeTab !== 'inteiro-teor' || inteiroTeor || loadingTeor) return;

    const url = planaltoDirectUrl || leiInfo?.urlInteiroTeor;
    if (!url) return;

    let cancelled = false;
    setLoadingTeor(true);
    setTeorError(false);

    (async () => {
      try {
        const res = await supabase.functions.invoke('scrape-inteiro-teor', {
          body: { url },
        });
        if (!cancelled && res.data?.content) {
          setInteiroTeor(res.data.content);
        } else if (!cancelled) {
          setTeorError(true);
        }
      } catch (e) {
        console.error('Scrape inteiro teor error:', e);
        if (!cancelled) setTeorError(true);
      }
      if (!cancelled) setLoadingTeor(false);
    })();
    return () => { cancelled = true; };
  }, [activeTab, planaltoDirectUrl, leiInfo?.urlInteiroTeor]);

  const externalUrl = planaltoDirectUrl || leiInfo?.urlInteiroTeor
    || `https://www.google.com/search?q=${encodeURIComponent(referencia + ' site:planalto.gov.br')}`;

  return (
    <div className="fixed inset-0 z-[60] bg-background overflow-y-auto animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary/60 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-base font-bold truncate">
            Art. {displayNumero}
          </h1>
          <p className="text-[11px] text-muted-foreground truncate">{leiNome}</p>
        </div>
        <Badge className={`${tipoBadge()} border text-[10px] px-2 py-0.5`}>
          {tipo}
        </Badge>
      </div>

      <div className="p-4 space-y-4 pb-12">
        {/* Autor / Lei Card */}
        <div className="rounded-xl bg-card border border-border/50 p-4">
          <div className="flex items-start gap-3">
            <Avatar className="w-12 h-12 border-2 border-primary/20">
              {leiInfo?.autorFoto ? (
                <AvatarImage src={leiInfo.autorFoto} alt={leiInfo.autorNome} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary">
                {leiInfo?.autorNome ? leiInfo.autorNome.slice(0, 2).toUpperCase() : <User className="w-5 h-5" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-display text-sm font-bold text-foreground">
                {leiInfo?.autorNome || 'Congresso Nacional'}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge className="bg-primary/15 text-primary border-primary/20 text-[10px]">
                  {ano > 0 ? ano : 'Sem data'}
                </Badge>
                <Badge className="bg-violet-500/15 text-violet-400 border-violet-500/20 text-[10px]">
                  {parteModificada}
                </Badge>
              </div>
              {loadingLei ? (
                <Skeleton className="h-3 w-2/3 mt-2" />
              ) : (
                <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                  {referencia}
                </p>
              )}
            </div>
          </div>

          {leiInfo?.ementa && (
            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/30 leading-relaxed italic">
              {leiInfo.ementa.slice(0, 200)}{leiInfo.ementa.length > 200 ? '...' : ''}
            </p>
          )}
        </div>

        {/* Dispositivo Modificado with tabs */}
        <div className="rounded-xl bg-card border border-border/50 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <h2 className="font-display text-sm font-bold text-foreground">Dispositivo Modificado</h2>
              </div>
            </div>
            <div className="px-4 pt-3">
              <TabsList className="w-full bg-secondary/50 border border-border rounded-lg h-9">
                <TabsTrigger value="original" className="flex-1 rounded-md text-[11px] font-display data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Original
                </TabsTrigger>
                <TabsTrigger value="inteiro-teor" className="flex-1 rounded-md text-[11px] font-display data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Inteiro Teor
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="original" className="mt-0 pt-2 pb-1">
              <div className="divide-y divide-border/20">
                {renderHighlightedText()}
              </div>
            </TabsContent>

            <TabsContent value="inteiro-teor" className="mt-0 p-4">
              {loadingTeor ? (
                <div className="space-y-3 py-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex items-center gap-2 pt-2">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Buscando texto no Planalto...</span>
                  </div>
                </div>
              ) : inteiroTeor ? (
                <div className="space-y-4">
                  <div className="prose prose-sm dark:prose-invert max-w-none text-foreground text-[13px] leading-relaxed max-h-[60vh] overflow-y-auto border border-border/30 rounded-lg p-4 bg-secondary/20">
                    <ReactMarkdown>{inteiroTeor}</ReactMarkdown>
                  </div>
                  <a
                    href={externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Ver no Planalto
                  </a>
                </div>
              ) : (
                <div className="text-center space-y-3 py-4">
                  <Scale className="w-8 h-8 mx-auto text-primary/40" />
                  <p className="text-xs text-muted-foreground">
                    {teorError
                      ? 'Não foi possível carregar o texto. Acesse diretamente no portal oficial.'
                      : 'Acesse o texto completo da lei modificadora no portal oficial.'}
                  </p>
                  <a
                    href={externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {planaltoDirectUrl ? 'Ver no Planalto' : 'Buscar no Planalto'}
                  </a>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Análise IA */}
        <div className="rounded-xl bg-card border border-border/50 overflow-hidden">
          <Tabs defaultValue="analise" className="w-full">
            <div className="px-4 pt-3">
              <TabsList className="w-full bg-secondary/50 border border-border rounded-lg h-9">
                <TabsTrigger value="analise" className="flex-1 rounded-md text-[11px] font-display data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Análise IA
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="analise" className="mt-0 p-4">
              {loadingAI ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex items-center gap-2 pt-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Analisando alteração com IA...</span>
                  </div>
                </div>
              ) : analise ? (
                <div className="prose prose-sm dark:prose-invert max-w-none text-foreground text-[13px] leading-relaxed">
                  <ReactMarkdown>{analise}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Não foi possível gerar a análise.</p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AlteracaoDetailSheet;
