import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders } from 'https://esm.sh/@supabase/supabase-js@2.49.1/cors';

const CAMARA_API = 'https://dadosabertos.camara.leg.br/api/v2';

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
  
  // Check latest tramitações
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

    const existingIds = new Set((existing || []).map(e => e.id_externo));

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
          dados_json: p.dados_json,
        }));

        await supabase.from('kanban_proposicoes').upsert(toInsert, { onConflict: 'id_externo' });
      }
    }

    // Now fetch all kanban items to update
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
        // Fetch proposição details
        const detRes = await fetchWithRetry(`${CAMARA_API}/proposicoes/${item.id_externo}`);
        if (!detRes.ok) continue;
        const detJson = await detRes.json();
        const dados = detJson.dados;
        if (!dados) continue;

        // Fetch tramitações
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

        // Rate limit: wait 200ms between API calls
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
