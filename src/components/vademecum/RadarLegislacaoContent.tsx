import { useState, useEffect, useMemo } from 'react';
import { Radar, Loader2, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import type { NavigateFunction } from 'react-router-dom';

const LEI_REFS: Record<string, { refs: string[]; tipos: string[] }> = {
  'CF88_CONSTITUICAO_FEDERAL': { refs: ['constituição federal', 'constituicao federal'], tipos: ['PEC'] },
  'CP_CODIGO_PENAL': { refs: ['decreto-lei nº 2.848', 'decreto-lei n° 2.848', 'lei 2.848', 'código penal', 'codigo penal'], tipos: ['PL', 'PLP'] },
  'CC_CODIGO_CIVIL': { refs: ['lei nº 10.406', 'lei n° 10.406', 'lei 10.406', 'código civil', 'codigo civil'], tipos: ['PL', 'PLP'] },
  'CPC_CODIGO_PROCESSO_CIVIL': { refs: ['lei nº 13.105', 'lei n° 13.105', 'lei 13.105', 'código de processo civil', 'codigo de processo civil'], tipos: ['PL', 'PLP'] },
  'CPP_CODIGO_PROCESSO_PENAL': { refs: ['decreto-lei nº 3.689', 'decreto-lei n° 3.689', 'lei 3.689', 'código de processo penal', 'codigo de processo penal'], tipos: ['PL', 'PLP'] },
  'CLT_CONSOLIDACAO_LEIS_TRABALHO': { refs: ['decreto-lei nº 5.452', 'decreto-lei n° 5.452', 'lei 5.452', 'consolidação das leis do trabalho', 'consolidacao das leis do trabalho', 'clt'], tipos: ['PL', 'PLP'] },
  'CDC_CODIGO_DEFESA_CONSUMIDOR': { refs: ['lei nº 8.078', 'lei n° 8.078', 'lei 8.078', 'código de defesa do consumidor', 'codigo de defesa do consumidor'], tipos: ['PL', 'PLP'] },
  'CTN_CODIGO_TRIBUTARIO_NACIONAL': { refs: ['lei nº 5.172', 'lei n° 5.172', 'lei 5.172', 'código tributário nacional', 'codigo tributario nacional'], tipos: ['PL', 'PLP', 'PEC'] },
  'CTB_CODIGO_TRANSITO_BRASILEIRO': { refs: ['lei nº 9.503', 'lei n° 9.503', 'lei 9.503', 'código de trânsito', 'codigo de transito'], tipos: ['PL'] },
  'CE_CODIGO_ELEITORAL': { refs: ['lei nº 4.737', 'lei n° 4.737', 'lei 4.737', 'código eleitoral', 'codigo eleitoral'], tipos: ['PL', 'PLP', 'PEC'] },
  'ECA_ESTATUTO_CRIANCA_ADOLESCENTE': { refs: ['lei nº 8.069', 'lei n° 8.069', 'lei 8.069', 'estatuto da criança', 'estatuto da crianca'], tipos: ['PL', 'PLP'] },
  'EI_ESTATUTO_IDOSO': { refs: ['lei nº 10.741', 'lei n° 10.741', 'lei 10.741', 'estatuto do idoso', 'estatuto da pessoa idosa'], tipos: ['PL'] },
  'EPD_ESTATUTO_PESSOA_DEFICIENCIA': { refs: ['lei nº 13.146', 'lei n° 13.146', 'lei 13.146', 'estatuto da pessoa com deficiência', 'estatuto da pessoa com deficiencia'], tipos: ['PL'] },
  'EOAB_ESTATUTO_OAB': { refs: ['lei nº 8.906', 'lei n° 8.906', 'lei 8.906', 'estatuto da advocacia', 'estatuto da oab'], tipos: ['PL'] },
  'CPM_CODIGO_PENAL_MILITAR': { refs: ['decreto-lei nº 1.001', 'decreto-lei n° 1.001', 'lei 1.001', 'código penal militar', 'codigo penal militar'], tipos: ['PL'] },
  'CFLOR_CODIGO_FLORESTAL': { refs: ['lei nº 12.651', 'lei n° 12.651', 'lei 12.651', 'código florestal', 'codigo florestal'], tipos: ['PL'] },
  'CBA_CODIGO_BRASILEIRO_AERONAUTICA': { refs: ['lei nº 7.565', 'lei n° 7.565', 'lei 7.565', 'código brasileiro de aeronáutica', 'codigo brasileiro de aeronautica'], tipos: ['PL'] },
  'CAGUA_CODIGO_AGUAS': { refs: ['decreto nº 24.643', 'decreto n° 24.643', 'código de águas', 'codigo de aguas'], tipos: ['PL'] },
  'CCOM_CODIGO_COMERCIAL': { refs: ['lei nº 556', 'código comercial', 'codigo comercial'], tipos: ['PL'] },
  'CMIN_CODIGO_MINAS': { refs: ['decreto-lei nº 227', 'decreto-lei n° 227', 'código de minas', 'codigo de minas', 'código de mineração', 'codigo de mineracao'], tipos: ['PL'] },
  'CTEL_CODIGO_TELECOMUNICACOES': { refs: ['lei nº 4.117', 'lei n° 4.117', 'lei 4.117', 'código de telecomunicações', 'codigo de telecomunicacoes'], tipos: ['PL'] },
  'CPPM_CODIGO_PROCESSO_PENAL_MILITAR': { refs: ['decreto-lei nº 1.002', 'decreto-lei n° 1.002', 'código de processo penal militar', 'codigo de processo penal militar'], tipos: ['PL'] },
};

function extractRefs(leiNome: string): string[] {
  const lower = leiNome.toLowerCase();
  return [lower.trim()];
}

// ---- CACHE GLOBAL ----
const CACHE_TTL = 10 * 60 * 1000; // 10 min
interface CacheEntry {
  proposals: any[];
  headlines: Map<string, string>;
  autorFotos: Map<string, string>;
  timestamp: number;
}
const cachedRadarData = new Map<string, CacheEntry>();

export function prefetchRadarData(leiNome: string, tabelaNome: string | null) {
  const cacheKey = tabelaNome || leiNome;
  const cached = cachedRadarData.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return;

  const config = tabelaNome && LEI_REFS[tabelaNome]
    ? LEI_REFS[tabelaNome]
    : { refs: extractRefs(leiNome), tipos: ['PL', 'PEC', 'PLP'] };

  (async () => {
    try {
      const { data } = await supabase
        .from('radar_proposicoes')
        .select('id_externo, sigla_tipo, numero, ano, ementa, autor, autor_foto, dados_json')
        .in('sigla_tipo', config.tipos)
        .order('ano', { ascending: false })
        .order('numero', { ascending: false });

      if (!data) return;

      const filtered = data.filter(p => {
        const ementa = (p.ementa || '').toLowerCase();
        return config.refs.some(ref => ementa.includes(ref));
      }).slice(0, 50);

      const headlines = new Map<string, string>();
      const autorFotos = new Map<string, string>();

      if (filtered.length > 0) {
        const ids = filtered.map(p => p.id_externo);
        const { data: hlData } = await supabase
          .from('radar_pl_headlines')
          .select('id_externo, headline')
          .in('id_externo', ids);
        if (hlData) {
          for (const h of hlData) {
            if (h.headline) headlines.set(h.id_externo, h.headline);
          }
        }
      }

      cachedRadarData.set(cacheKey, { proposals: filtered, headlines, autorFotos, timestamp: Date.now() });
    } catch (e) {
      console.error('Prefetch radar error:', e);
    }
  })();
}

// ---- HEADLINE CONTEXTUAL ----
const ART_REGEX = /art(?:igo)?\.?\s*(\d+[\.\d]*(?:-[A-Z])?)/gi;

export function buildContextualTitle(ementa: string, leiNome: string, existingHeadline?: string): string {
  if (existingHeadline) return existingHeadline;

  // Extract article references from ementa
  ART_REGEX.lastIndex = 0;
  const matches: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = ART_REGEX.exec(ementa)) !== null) {
    matches.push(m[1]);
  }

  const cleanEmenta = (ementa || '')
    .replace(/\s*e\s+dá\s+outras\s+providências\.?/gi, '')
    .replace(/\s*;\s*e\s+dá\s+outras\s+providências\.?/gi, '')
    .trim();

  const shortLei = leiNome
    .replace(/^(Código|Estatuto|Consolidação das Leis do?)\s*/i, '')
    .trim();

  if (matches.length > 0) {
    const artRef = matches.length === 1
      ? `art. ${matches[0]}`
      : `arts. ${matches.slice(0, 2).join(' e ')}`;
    const summary = truncateWords(cleanEmenta, 60);
    return `Pode alterar o ${artRef} do ${shortLei} para ${summary}`;
  }

  // Fallback: "Propõe alteração no [lei] sobre [tema]"
  const tema = truncateWords(cleanEmenta, 70);
  return `Propõe alteração no ${shortLei} — ${tema}`;
}

function truncateWords(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const cut = text.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 20 ? cut.slice(0, lastSpace) : cut) + '…';
}

// ---- HELPER: chunk array ----
function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

interface RadarLegislacaoContentProps {
  leiNome: string;
  tabelaNome: string | null;
  navigate: NavigateFunction;
}

const RadarLegislacaoContent = ({ leiNome, tabelaNome, navigate }: RadarLegislacaoContentProps) => {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [headlines, setHeadlines] = useState<Map<string, string>>(new Map());
  const [autorFotos, setAutorFotos] = useState<Map<string, string>>(new Map());

  const config = useMemo(() => {
    if (tabelaNome && LEI_REFS[tabelaNome]) return LEI_REFS[tabelaNome];
    return { refs: extractRefs(leiNome), tipos: ['PL', 'PEC', 'PLP'] };
  }, [tabelaNome, leiNome]);

  useEffect(() => {
    loadProposals();
  }, [config]);

  async function loadProposals() {
    const cacheKey = tabelaNome || leiNome;
    const cached = cachedRadarData.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setProposals(cached.proposals);
      setHeadlines(cached.headlines);
      setAutorFotos(cached.autorFotos);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data } = await supabase
        .from('radar_proposicoes')
        .select('id_externo, sigla_tipo, numero, ano, ementa, autor, autor_foto, dados_json, url_inteiro_teor')
        .in('sigla_tipo', config.tipos)
        .order('ano', { ascending: false })
        .order('numero', { ascending: false });

      if (!data) { setProposals([]); setLoading(false); return; }

      const filtered = data.filter(p => {
        const ementa = (p.ementa || '').toLowerCase();
        return config.refs.some(ref => ementa.includes(ref));
      }).slice(0, 50);

      setProposals(filtered);
      setLoading(false);

      if (filtered.length > 0) {
        const ids = filtered.map(p => p.id_externo);

        // Load headlines and deputy photos in parallel
        const [hlResult, depResult] = await Promise.all([
          supabase
            .from('radar_pl_headlines')
            .select('id_externo, headline, analise')
            .in('id_externo', ids),
          // Fetch deputy photos for authors missing photos
          (async () => {
            const autoresSemFoto = [...new Set(
              filtered.filter(p => !p.autor_foto && !(p.dados_json as any)?.autores?.[0]?.urlFoto)
                .map(p => p.autor)
                .filter(Boolean)
            )];
            if (autoresSemFoto.length === 0) return null;
            return supabase
              .from('radar_deputados')
              .select('nome, foto_url')
              .in('nome', autoresSemFoto);
          })(),
        ]);

        // Process headlines
        const map = new Map<string, string>();
        if (hlResult.data) {
          for (const h of hlResult.data) {
            if (h.headline) map.set(h.id_externo, h.headline);
          }
        }
        setHeadlines(map);

        // Process deputy photos
        const fotosMap = new Map<string, string>();
        if (depResult?.data) {
          for (const d of depResult.data) {
            if (d.foto_url) fotosMap.set(d.nome, d.foto_url);
          }
        }
        setAutorFotos(fotosMap);

        // Update cache
        cachedRadarData.set(cacheKey, {
          proposals: filtered,
          headlines: map,
          autorFotos: fotosMap,
          timestamp: Date.now(),
        });

        // Lazy-generate missing headlines via AI (batches of 3)
        const missingHeadlines = filtered.filter(p => !map.has(p.id_externo));
        if (missingHeadlines.length > 0) {
          generateMissingHeadlines(missingHeadlines, cacheKey, filtered, fotosMap);
        }

        // Auto-generate AI analysis for proposals that don't have one yet
        if (hlResult.data) {
          const missingAnalise = filtered.filter(p => {
            const cached = hlResult.data!.find((h: any) => h.id_externo === p.id_externo);
            return !cached?.analise;
          });
          for (const p of missingAnalise) {
            try {
              const { data: aiResult } = await supabase.functions.invoke('assistente-juridica', {
                body: {
                  mode: 'analise_pl',
                  ementa: p.ementa || '',
                  plNumero: p.numero,
                  plAno: p.ano,
                  autorNome: p.autor,
                  urlInteiroTeor: (p as any).url_inteiro_teor || undefined,
                }
              });
              if (aiResult?.reply) {
                await (supabase as any)
                  .from('radar_pl_headlines')
                  .upsert({ id_externo: p.id_externo, analise: aiResult.reply }, { onConflict: 'id_externo' });
              }
            } catch (e) {
              console.warn('Auto-generate analise failed for', p.id_externo, e);
            }
          }
        }
      }
    } catch (e) {
      console.error('Radar legislação error:', e);
    }
    setLoading(false);
  }

  async function generateMissingHeadlines(
    missing: any[],
    cacheKey: string,
    allProposals: any[],
    fotosMap: Map<string, string>
  ) {
    const batches = chunk(missing, 3);
    for (const batch of batches) {
      await Promise.all(batch.map(async (p) => {
        try {
          const { data } = await supabase.functions.invoke('assistente-juridica', {
            body: {
              mode: 'headline',
              ementa: p.ementa || '',
              plNumero: p.numero,
              plAno: p.ano,
              autorNome: p.autor,
              urlInteiroTeor: p.url_inteiro_teor || undefined,
            }
          });
          if (data?.reply) {
            const headline = data.reply.trim();
            // Update state incrementally
            setHeadlines(prev => {
              const next = new Map(prev);
              next.set(p.id_externo, headline);
              return next;
            });
            // Persist to DB
            try {
              await (supabase as any)
                .from('radar_pl_headlines')
                .upsert({ id_externo: p.id_externo, headline }, { onConflict: 'id_externo' });
            } catch {}
            // Update cache
            const cached = cachedRadarData.get(cacheKey);
            if (cached) {
              cached.headlines.set(p.id_externo, headline);
            }
          }
        } catch (e) {
          console.warn('Generate headline failed for', p.id_externo, e);
        }
      }));
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 pb-8">
        {[1, 2, 3].map(i => (
          <Card key={i} className="bg-card/50 border-border/50">
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 gap-2">
        <Radar className="w-8 h-8 text-muted-foreground/40" />
        <p className="text-muted-foreground text-sm">Nenhuma proposta encontrada</p>
        <p className="text-muted-foreground/60 text-xs text-center px-4">
          Não foram encontrados projetos de lei que possam alterar esta legislação no momento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-8">
      <p className="text-foreground text-xs px-1">
        {proposals.length} proposta{proposals.length !== 1 ? 's' : ''} que pode{proposals.length !== 1 ? 'm' : ''} alterar esta legislação
      </p>
      {proposals.map((p) => {
        const existingHeadline = headlines.get(p.id_externo);
        const contextTitle = buildContextualTitle(p.ementa || '', leiNome, existingHeadline);
        const fotoUrl = p.autor_foto
          || (p.dados_json as any)?.autores?.[0]?.urlFoto
          || autorFotos.get(p.autor)
          || null;
        const dataApresentacao = (p.dados_json as any)?.dataApresentacao;

        return (
          <Card
            key={p.id_externo}
            className="bg-card/50 border-border/50 cursor-pointer hover:bg-card/80 transition-colors"
            onClick={() => navigate(`/radar/pl/${p.id_externo}`)}
          >
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden bg-muted mt-0.5">
                  {fotoUrl ? (
                    <img
                      src={fotoUrl}
                      alt={p.autor || ''}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                      <Radar className="w-4 h-4 text-primary/50" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] text-foreground leading-snug line-clamp-3 mb-1.5">
                    {contextTitle}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      p.sigla_tipo === 'PEC' ? 'bg-red-500/20 text-red-400' :
                      p.sigla_tipo === 'PLP' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-primary/20 text-primary'
                    }`}>
                      {p.sigla_tipo} {p.numero}/{p.ano}
                    </span>
                    {p.autor && (
                      <span className="text-[11px] text-sky-400 truncate">{p.autor}</span>
                    )}
                    {dataApresentacao && (
                      <span className="text-[10px] text-foreground ml-auto">
                        {new Date(dataApresentacao).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-2" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default RadarLegislacaoContent;
