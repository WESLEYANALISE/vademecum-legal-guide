import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CAMARA_API = 'https://dadosabertos.camara.leg.br/api/v2';

// Map of keywords in ementas to the law they affect
const LEI_KEYWORDS: [RegExp, string][] = [
  [/c[oó]digo\s+penal(?!\s+militar)/i, 'Código Penal'],
  [/decreto[- ]?lei\s+n?[ºo°]?\s*2\.?848/i, 'Código Penal'],
  [/c[oó]digo\s+civil/i, 'Código Civil'],
  [/lei\s+n?[ºo°]?\s*10\.?406/i, 'Código Civil'],
  [/c[oó]digo\s+de?\s+processo\s+civil/i, 'CPC'],
  [/lei\s+n?[ºo°]?\s*13\.?105/i, 'CPC'],
  [/c[oó]digo\s+de?\s+processo\s+penal/i, 'CPP'],
  [/decreto[- ]?lei\s+n?[ºo°]?\s*3\.?689/i, 'CPP'],
  [/c[oó]digo\s+penal\s+militar/i, 'Código Penal Militar'],
  [/consolida[cç][aã]o\s+das?\s+leis\s+d[oe]\s+trabalho|CLT/i, 'CLT'],
  [/c[oó]digo\s+de?\s+defesa\s+d[oe]\s+consumidor|CDC/i, 'CDC'],
  [/lei\s+n?[ºo°]?\s*8\.?078/i, 'CDC'],
  [/c[oó]digo\s+tribut[aá]rio\s+nacional|CTN/i, 'CTN'],
  [/c[oó]digo\s+de?\s+tr[aâ]nsito/i, 'CTB'],
  [/lei\s+n?[ºo°]?\s*9\.?503/i, 'CTB'],
  [/c[oó]digo\s+eleitoral/i, 'Código Eleitoral'],
  [/c[oó]digo\s+florestal/i, 'Código Florestal'],
  [/estatuto\s+da?\s+crian[cç]a/i, 'ECA'],
  [/lei\s+n?[ºo°]?\s*8\.?069/i, 'ECA'],
  [/estatuto\s+d[oe]\s+idoso/i, 'Estatuto do Idoso'],
  [/estatuto\s+da?\s+pessoa\s+com\s+defici[eê]ncia/i, 'EPD'],
  [/estatuto\s+da?\s+OAB/i, 'Estatuto da OAB'],
  [/lei\s+maria\s+da?\s+penha/i, 'Lei Maria da Penha'],
  [/lei\s+n?[ºo°]?\s*11\.?340/i, 'Lei Maria da Penha'],
  [/lei\s+de?\s+drogas/i, 'Lei de Drogas'],
  [/lei\s+de?\s+execu[cç][aã]o\s+penal|LEP/i, 'LEP'],
  [/lei\s+n?[ºo°]?\s*7\.?210/i, 'LEP'],
  [/lei\s+de?\s+licita[cç][oõ]es/i, 'Lei de Licitações'],
  [/LGPD|prote[cç][aã]o\s+de?\s+dados/i, 'LGPD'],
  [/lei\s+n?[ºo°]?\s*13\.?709/i, 'LGPD'],
  [/marco\s+civil\s+da?\s+internet/i, 'Marco Civil da Internet'],
  [/lei\s+n?[ºo°]?\s*12\.?965/i, 'Marco Civil da Internet'],
  [/lei\s+de?\s+improbidade/i, 'Improbidade Administrativa'],
  [/constitui[cç][aã]o\s+federal/i, 'Constituição Federal'],
  [/lei\s+de?\s+falências/i, 'Lei de Falências'],
  [/lei\s+d[oe]\s+inquilinato/i, 'Lei do Inquilinato'],
];

function extractLeiAfetada(ementa: string | null): string | null {
  if (!ementa) return null;
  const found: string[] = [];
  for (const [regex, label] of LEI_KEYWORDS) {
    if (regex.test(ementa) && !found.includes(label)) {
      found.push(label);
    }
  }
  return found.length > 0 ? found.join(', ') : null;
}

interface ProposicaoTramitacao {
  dataHora: string;
  descricaoTramitacao: string;
  descricaoSituacao: string;
  despacho: string;
  siglaOrgao: string;
}

function classificarStatus(situacao: string, tramitacoes: ProposicaoTramitacao[]): string {
  const sit = (situacao || '').toLowerCase();
  
  if (sit.includes('transformad') || sit.includes('lei') || sit.includes('publicad')) {
    return 'publicada';
  }
  if (sit.includes('sanção') || sit.includes('sancao') || sit.includes('sancionad') || sit.includes('veto') || sit.includes('presidência da república')) {
    return 'sancao';
  }
  if (sit.includes('plenário') || sit.includes('plenario') || sit.includes('votação') || sit.includes('votacao') || sit.includes('pauta')) {
    return 'votacao';
  }
  
  const latest = tramitacoes.slice(0, 5);
  for (const t of latest) {
    const desc = ((t.descricaoTramitacao || '') + ' ' + (t.despacho || '')).toLowerCase();
    if (desc.includes('transformad') || desc.includes('lei nº') || desc.includes('lei no')) return 'publicada';
    if (desc.includes('sanção') || desc.includes('sancao') || desc.includes('presidência')) return 'sancao';
    if (desc.includes('plenário') || desc.includes('votação') || desc.includes('pauta')) return 'votacao';
  }
  
  return 'tramitando';
}

async function fetchWithRetry(url: string, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (res.ok) return res;
      if (res.status === 429 && i < retries) {
        await new Promise(r => setTimeout(r, 2000 * (i + 1)));
        continue;
      }
      return res;
    } catch (e) {
      if (i === retries) throw e;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw new Error('fetch failed');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get existing kanban items
    const { data: existing } = await supabase
      .from('kanban_proposicoes')
      .select('id, id_externo, status_kanban');

    // If kanban is empty, seed from radar_proposicoes (top 100 most recent)
    if (!existing || existing.length === 0) {
      const { data: proposicoes } = await supabase
        .from('radar_proposicoes')
        .select('id_externo, sigla_tipo, numero, ano, ementa, dados_json')
        .order('atualizado_em', { ascending: false })
        .limit(100);

      if (proposicoes && proposicoes.length > 0) {
        const toInsert = proposicoes.map((p: any) => ({
          id_externo: p.id_externo,
          sigla_tipo: p.sigla_tipo || 'PL',
          numero: p.numero || 0,
          ano: p.ano || 2025,
          ementa: p.ementa,
          status_kanban: 'tramitando',
          lei_afetada: extractLeiAfetada(p.ementa),
          dados_json: p.dados_json,
        }));

        await supabase.from('kanban_proposicoes').upsert(toInsert, { onConflict: 'id_externo' });
      }
    }

    // Step 1: Fill in lei_afetada for items that don't have it yet
    const { data: missingLei } = await supabase
      .from('kanban_proposicoes')
      .select('id, ementa')
      .is('lei_afetada', null)
      .not('ementa', 'is', null);

    if (missingLei && missingLei.length > 0) {
      for (const item of missingLei) {
        const lei = extractLeiAfetada(item.ementa);
        if (lei) {
          await supabase.from('kanban_proposicoes').update({ lei_afetada: lei }).eq('id', item.id);
        }
      }
    }

    // Now fetch all kanban items to update statuses
    const { data: kanbanItems } = await supabase
      .from('kanban_proposicoes')
      .select('*')
      .neq('status_kanban', 'publicada')
      .limit(50);

    if (!kanbanItems || kanbanItems.length === 0) {
      return new Response(JSON.stringify({ message: 'No items to update' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let updated = 0;
    const errors: string[] = [];

    for (const item of kanbanItems) {
      try {
        const detRes = await fetchWithRetry(`${CAMARA_API}/proposicoes/${item.id_externo}`);
        if (!detRes.ok) continue;
        const detJson = await detRes.json();
        const dados = detJson.dados;
        if (!dados) continue;

        const tramRes = await fetchWithRetry(`${CAMARA_API}/proposicoes/${item.id_externo}/tramitacoes?ordem=DESC&ordenarPor=dataHora&itens=10`);
        const tramJson = tramRes.ok ? await tramRes.json() : { dados: [] };
        const tramitacoes = tramJson.dados || [];

        const situacao = dados.statusProposicao?.descricaoSituacao || '';
        const novoStatus = classificarStatus(situacao, tramitacoes);

        const updateData: any = {
          status_kanban: novoStatus,
          situacao_camara: situacao,
          atualizado_em: new Date().toISOString(),
          dados_json: dados,
        };

        if (dados.statusProposicao?.dataHora) {
          updateData.data_ultima_acao = dados.statusProposicao.dataHora;
        }

        // Fill lei_afetada if missing
        if (!item.lei_afetada && item.ementa) {
          const lei = extractLeiAfetada(item.ementa);
          if (lei) updateData.lei_afetada = lei;
        }

        // Try to get author
        if (!item.autor) {
          const autRes = await fetchWithRetry(`${CAMARA_API}/proposicoes/${item.id_externo}/autores`);
          if (autRes.ok) {
            const autJson = await autRes.json();
            const autores = autJson.dados || [];
            if (autores.length > 0) {
              updateData.autor = autores.map((a: any) => a.nome).join(', ');
            }
          }
        }

        await supabase
          .from('kanban_proposicoes')
          .update(updateData)
          .eq('id', item.id);

        updated++;

        await new Promise(r => setTimeout(r, 200));
      } catch (e: any) {
        errors.push(`${item.id_externo}: ${e.message}`);
      }
    }

    return new Response(JSON.stringify({
      message: `Updated ${updated}/${kanbanItems.length} items`,
      errors: errors.length > 0 ? errors : undefined,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
