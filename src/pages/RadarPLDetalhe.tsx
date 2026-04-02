import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, RefreshCw, Scale, Mail, MapPin, Building2, FileText, Users, CheckCircle2, AlertTriangle, BarChart3, Lightbulb, Clock, Instagram, ChevronDown } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { fetchProposicaoDetalhe, fetchProposicaoTramitacoes, fetchDeputadoDetalhe } from '@/services/radarService';
import ReactMarkdown from 'react-markdown';

// Global cache for PL detail pages
const plDetalheCache = new Map<string, { pl: any; tramitacoes: any[]; deputado: any; instagram: string | null; analise: string | null }>();
function parseAnalise(text: string) {
  const sections: { icon: string; title: string; content: string }[] = [];
  const sectionRegex = /##\s*([^\n]+)\n([\s\S]*?)(?=\n##\s|$)/g;
  let match;
  while ((match = sectionRegex.exec(text)) !== null) {
    const rawTitle = match[1].trim();
    const content = match[2].trim();
    const emojiMatch = rawTitle.match(/^([^\w\s]|[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FEFF}]|[\u{1F900}-\u{1F9FF}])+\s*/u);
    const icon = emojiMatch ? emojiMatch[0].trim() : '';
    const title = emojiMatch ? rawTitle.slice(emojiMatch[0].length).trim() : rawTitle;
    sections.push({ icon, title, content });
  }
  return sections;
}

function getSectionStyle(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes('resumo')) return { border: 'border-blue-500/30', bg: 'bg-blue-500/5', iconColor: 'text-blue-400' };
  if (lower.includes('afetado')) return { border: 'border-amber-500/30', bg: 'bg-amber-500/5', iconColor: 'text-amber-400' };
  if (lower.includes('positiv')) return { border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', iconColor: 'text-emerald-400' };
  if (lower.includes('atenção') || lower.includes('atencao') || lower.includes('risco')) return { border: 'border-red-500/30', bg: 'bg-red-500/5', iconColor: 'text-red-400' };
  if (lower.includes('aprovação') || lower.includes('aprovacao') || lower.includes('chance')) return { border: 'border-purple-500/30', bg: 'bg-purple-500/5', iconColor: 'text-purple-400' };
  if (lower.includes('impacto')) return { border: 'border-cyan-500/30', bg: 'bg-cyan-500/5', iconColor: 'text-cyan-400' };
  return { border: 'border-border/50', bg: 'bg-card', iconColor: 'text-primary' };
}

export default function RadarPLDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [pl, setPl] = useState<any>(null);
  const [tramitacoes, setTramitacoes] = useState<any[]>([]);
  const [deputado, setDeputado] = useState<any>(null);
  const [instagram, setInstagram] = useState<string | null>(null);
  const [analise, setAnalise] = useState<string | null>(null);
  const [loadingAnalise, setLoadingAnalise] = useState(true);
  const [tramOpen, setTramOpen] = useState(false);

  const analiseSections = useMemo(() => analise ? parseAnalise(analise) : [], [analise]);

  useEffect(() => {
    if (!id) return;

    // Check cache first
    const cached = plDetalheCache.get(id);
    if (cached) {
      setPl(cached.pl);
      setTramitacoes(cached.tramitacoes);
      setDeputado(cached.deputado);
      setInstagram(cached.instagram);
      setAnalise(cached.analise);
      setLoading(false);
      setLoadingAnalise(false);
      return;
    }

    (async () => {
      try {
        const { data: dbPl } = await supabase
          .from('radar_proposicoes')
          .select('*')
          .eq('id_externo', id)
          .maybeSingle();

        let dbAutorFoto: string | null = null;

        if (dbPl) {
          dbAutorFoto = dbPl.autor_foto || (dbPl.dados_json as any)?.urlFoto || (dbPl.dados_json as any)?.autores?.[0]?.urlFoto || null;
          setPl({
            id: dbPl.id_externo,
            siglaTipo: dbPl.sigla_tipo,
            numero: dbPl.numero,
            ano: dbPl.ano,
            ementa: dbPl.ementa,
            autorNome: dbPl.autor,
            autorFoto: dbAutorFoto,
          });
        }

        const detail = await fetchProposicaoDetalhe(id);
        if (detail) {
          setPl((prev: any) => ({
            ...prev,
            id: detail.id,
            siglaTipo: detail.siglaTipo || prev?.siglaTipo,
            numero: detail.numero || prev?.numero,
            ano: detail.ano || prev?.ano,
            ementa: detail.ementa || prev?.ementa,
            dataApresentacao: detail.dataApresentacao,
            statusSituacao: detail.statusProposicao?.descricaoSituacao,
            statusOrgao: detail.statusProposicao?.siglaOrgao,
            urlInteiro: detail.urlInteiroTeor,
            uri: detail.uri,
          }));

          // Fetch deputy details and Instagram
          const autoresUrl = detail.uriAutores || `https://dadosabertos.camara.leg.br/api/v2/proposicoes/${id}/autores`;
          try {
            const autoresRes = await fetch(autoresUrl, { headers: { Accept: 'application/json' } });
            if (autoresRes.ok) {
              const autoresJson = await autoresRes.json();
              const autores = autoresJson.dados || [];
              // Find first deputy author — check URI or codTipo
              const depAutor = autores.find((a: any) =>
                a.uri?.includes('/deputados/') || a.codTipo === 10000
              );
              if (depAutor) {
                let depId: string | null = null;
                if (depAutor.uri?.includes('/deputados/')) {
                  depId = depAutor.uri.split('/deputados/')[1];
                } else if (depAutor.uri) {
                  const match = depAutor.uri.match(/\/(\d+)$/);
                  if (match) depId = match[1];
                }
                if (depId) {
                  const depDetail = await fetchDeputadoDetalhe(Number(depId));
                  if (depDetail) {
                    setDeputado(depDetail);
                    const ig = (depDetail.redeSocial || []).find(
                      (url: string) => typeof url === 'string' && url.includes('instagram.com')
                    );
                    if (ig) setInstagram(ig);
                    setPl((prev: any) => ({
                      ...prev,
                      autorNome: depDetail.nomeCivil || depDetail.ultimoStatus?.nome || prev?.autorNome,
                      autorFoto: depDetail.ultimoStatus?.urlFoto || prev?.autorFoto,
                    }));
                  }
                }
              } else if (dbAutorFoto) {
                // No deputy found via API but we have a photo from DB
                setPl((prev: any) => ({ ...prev, autorFoto: dbAutorFoto }));
              }
            }
          } catch (e) {
            console.warn('Failed to fetch deputy details:', e);
          }
        }
      } catch { }
      setLoading(false);
    })();

    fetchProposicaoTramitacoes(id).then(t => setTramitacoes(t.slice(0, 10))).catch(() => { });

    (async () => {
      try {
        const { data: cached } = await (supabase as any)
          .from('radar_pl_headlines')
          .select('analise')
          .eq('id_externo', id)
          .maybeSingle();

        if (cached?.analise) {
          setAnalise(cached.analise);
          setLoadingAnalise(false);
        } else {
          setLoadingAnalise(true);
          try {
            const { data: plData } = await supabase
              .from('radar_proposicoes')
              .select('ementa, numero, ano, autor, url_inteiro_teor')
              .eq('id_externo', id)
              .maybeSingle();

            const { data: aiResult } = await supabase.functions.invoke('assistente-juridica', {
              body: {
                mode: 'analise_pl',
                ementa: plData?.ementa || '',
                plNumero: plData?.numero,
                plAno: plData?.ano,
                autorNome: plData?.autor,
                pdfUrl: plData?.url_inteiro_teor,
              }
            });

            if (aiResult?.reply) {
              setAnalise(aiResult.reply);
              await (supabase as any)
                .from('radar_pl_headlines')
                .upsert({ id_externo: id, analise: aiResult.reply }, { onConflict: 'id_externo' });
            }
          } catch { }
          setLoadingAnalise(false);
        }
      } catch { setLoadingAnalise(false); }
    })();
  }, [id]);

  // Save to cache when fully loaded
  useEffect(() => {
    if (!id || loading || loadingAnalise) return;
    if (pl && !plDetalheCache.has(id)) {
      plDetalheCache.set(id, { pl, tramitacoes, deputado, instagram, analise });
    }
  }, [id, loading, loadingAnalise, pl, tramitacoes, deputado, instagram, analise]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const plLabel = pl ? `PL ${pl.numero || ''}/${pl.ano || ''}` : 'Projeto de Lei';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="font-display text-base font-bold text-foreground">{plLabel}</h1>
            <p className="text-[11px] text-muted-foreground">Análise por IA</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* Autor Card */}
        <div className="rounded-xl bg-card border border-border/50 p-4">
          <div className="flex items-start gap-4">
            <Avatar className="w-14 h-14 sm:w-16 sm:h-16 border-2 border-primary/30 shrink-0">
              <AvatarImage src={deputado?.ultimoStatus?.urlFoto || pl?.autorFoto} alt={pl?.autorNome} className="object-cover object-center" />
              <AvatarFallback className="text-lg bg-primary/10 text-primary">
                {pl?.autorNome?.slice(0, 2) || '??'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Autor do Projeto</p>
              <h2 className="font-display text-[15px] sm:text-[17px] font-bold text-foreground leading-tight break-words">
                {deputado?.nomeCivil || pl?.autorNome || 'Autor não identificado'}
              </h2>
              {deputado?.ultimoStatus && (
                <p className="text-[13px] text-foreground mt-0.5">
                  {deputado.ultimoStatus.nome}
                </p>
              )}
              {instagram && (
                <a
                  href={instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[13px] text-pink-500 font-medium hover:text-pink-400 transition-colors mt-1"
                >
                  <Instagram className="w-3.5 h-3.5" />
                  Instagram
                </a>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                {(deputado?.ultimoStatus?.siglaPartido) && (
                  <Badge variant="secondary" className="text-[11px] gap-1 py-1">
                    <Building2 className="w-3 h-3" />
                    {deputado.ultimoStatus.siglaPartido} - {deputado.ultimoStatus.siglaUf}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Deputy extra info — text-foreground */}
          {deputado && (
            <div className="mt-4 pt-3 border-t border-border/30 space-y-1.5">
              {deputado.ultimoStatus?.email && (
                <p className="text-[13px] text-foreground flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-primary/60" />
                  {deputado.ultimoStatus.email}
                </p>
              )}
              {deputado.municipioNascimento && (
                <p className="text-[13px] text-foreground flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-primary/60" />
                  Natural de {deputado.municipioNascimento} - {deputado.ufNascimento}
                </p>
              )}
              {deputado.dataNascimento && (
                <p className="text-[13px] text-foreground flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-primary/60" />
                  Nascimento: {deputado.dataNascimento.split('-').reverse().join('/')}
                </p>
              )}
              {deputado.escolaridade && (
                <p className="text-[13px] text-foreground flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-primary/60" />
                  {deputado.escolaridade}
                </p>
              )}
            </div>
          )}
        </div>

        {/* PL Info Card */}
        <div className="rounded-xl bg-card border border-border/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Badge className="bg-primary/15 text-primary border-0 text-[12px] font-semibold py-1">
              <Scale className="w-3.5 h-3.5 mr-1.5" />
              {plLabel}
            </Badge>
            {pl?.statusSituacao && (
              <Badge variant="outline" className="text-[10px] py-1">
                {pl.statusSituacao}
              </Badge>
            )}
          </div>

          {pl?.dataApresentacao && (
            <p className="text-[13px] text-foreground">
              Apresentação: <span className="text-foreground">{pl.dataApresentacao.split('-').reverse().join('/')}</span>
              {pl.statusOrgao && <> · Órgão: <span className="text-foreground">{pl.statusOrgao}</span></>}
            </p>
          )}

          <p className="text-[14px] sm:text-[15px] text-foreground leading-[1.7] break-words">{pl?.ementa}</p>

          <div className="flex items-center gap-4 pt-1">
            <a
              href={`https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=${id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[13px] text-primary font-semibold hover:text-primary/80 transition-colors"
            >
              Ver na Câmara <ExternalLink className="w-3.5 h-3.5" />
            </a>
            {pl?.urlInteiro && (
              <a
                href={pl.urlInteiro}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[13px] text-primary font-semibold hover:text-primary/80 transition-colors"
              >
                Inteiro Teor <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Tramitações — Collapsible */}
        {tramitacoes.length > 0 && (
          <Collapsible open={tramOpen} onOpenChange={setTramOpen}>
            <div className="rounded-xl bg-card border border-border/50 p-4">
              <CollapsibleTrigger className="w-full flex items-center justify-between">
                <h3 className="font-display text-[15px] font-bold text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Tramitação Recente
                </h3>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${tramOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-3 mt-3 pt-3 border-t border-border/30">
                  {tramitacoes.map((t, i) => (
                    <div key={i} className="flex gap-3 border-l-2 border-primary/20 pl-3">
                      <div className="flex-1">
                        <p className="text-[11px] text-muted-foreground font-medium">
                          {t.dataHora?.split('T')[0]?.split('-').reverse().join('/') || ''}
                        </p>
                        <p className="text-[14px] text-foreground leading-relaxed mt-0.5">{t.descricaoTramitacao}</p>
                        {t.despacho && (
                          <p className="text-[13px] text-foreground mt-1 leading-relaxed">{t.despacho}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        )}

        {/* AI Analysis - Structured Cards */}
        <div>
          <h3 className="font-display text-[15px] font-bold text-foreground mb-4 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-primary" />
            Análise Completa por IA
          </h3>

          {loadingAnalise ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-xl bg-card border border-border/50 p-4 space-y-2">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </div>
              ))}
            </div>
          ) : analiseSections.length > 0 ? (
            <div className="space-y-3">
              {analiseSections.map((section, i) => {
                const style = getSectionStyle(section.title);
                return (
                  <div key={i} className={`rounded-xl border ${style.border} ${style.bg} p-4`}>
                    <h4 className={`text-[15px] font-bold ${style.iconColor} mb-2.5 flex items-center gap-2`}>
                      {section.icon && <span className="text-lg">{section.icon}</span>}
                      {section.title}
                    </h4>
                     <div className="text-[14px] sm:text-[15px] text-foreground leading-[1.7] space-y-2">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="text-[14px] sm:text-[15px] leading-[1.7]">{children}</p>,
                          strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
                          ul: ({ children }) => <ul className="space-y-1.5 mt-1">{children}</ul>,
                          li: ({ children }) => <li className="text-[14px] sm:text-[15px] leading-[1.7] flex gap-2"><span className="text-primary mt-1">•</span><span>{children}</span></li>,
                        }}
                      >{section.content}</ReactMarkdown>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : analise ? (
            <div className="rounded-xl bg-card border border-border/50 p-4">
               <div className="text-[14px] sm:text-[15px] text-foreground leading-[1.7] break-words">
                <ReactMarkdown>{analise}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-card border border-border/50 p-4">
              <p className="text-[15px] text-muted-foreground">Não foi possível gerar a análise no momento. Tente novamente mais tarde.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
