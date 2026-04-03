import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CAMARA_API = 'https://dadosabertos.camara.leg.br/api/v2';
const BATCH_SIZE = 10;

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

// Status priority: publicada > sancao > votacao > tramitando
const STATUS_PRIORITY: Record<string, number> = {
  'publicada': 4,
  'sancao': 3,
  'votacao': 2,
  'tramitando': 1,
};

function classificarStatus(situacao: string, codSituacao?: number): string {
  const sit = (situacao || '').toLowerCase();

  // Check codSituacao first (most reliable)
  if (codSituacao) {
    if (codSituacao === 1257 || codSituacao === 1392 || codSituacao === 1178) return 'publicada';
    if (codSituacao === 918 || codSituacao === 1087) return 'sancao';
    if (codSituacao === 1140 || codSituacao === 1148 || codSituacao === 1058 || codSituacao === 1065) return 'votacao';
  }

  // Fallback to text matching
  if (sit.includes('transformad') || sit.includes('norma jurídica') || sit.includes('publicad')) return 'publicada';
  if (sit.includes('sanção') || sit.includes('sancao') || sit.includes('sancionad') || sit.includes('veto') || sit.includes('presidência da república') || sit.includes('remetida à sanção')) return 'sancao';
  if (sit.includes('plenário') || sit.includes('plenario') || sit.includes('votação') || sit.includes('votacao') || sit.includes('pauta') || sit.includes('pronta para pauta') || sit.includes('apreciação')) return 'votacao';
  if (sit.includes('arquivad')) return 'arquivada';
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

// Seed: fetch propositions from Câmara API by codSituacao
async function seedFromApi(supabase: any) {
  console.log('Seeding kanban from Câmara API...');

  // Process in order of priority: publicada first, then sancao, votacao
  // Use separate upsert calls to prevent overwriting higher-priority status
  const situacoes = [
    { id: '1257', status: 'publicada', label: 'Transformada em Lei' },
    { id: '918', status: 'sancao', label: 'Aguardando Sanção' },
    { id: '1140', status: 'votacao', label: 'Pronta para Pauta' },
    { id: '1148', status: 'votacao', label: 'Em apreciação pelo Plenário' },
  ];

  const tipos = ['PL', 'PLP', 'PEC', 'MPV'];
  const insertedIds = new Set<string>();
  let totalInserted = 0;

  for (const sit of situacoes) {
    try {
      const url = `${CAMARA_API}/proposicoes?siglaTipo=${tipos.join(',')}&ano=2025&ano=2026&codSituacao=${sit.id}&itens=30&ordenarPor=ano&ordem=DESC`;
      console.log(`Fetching ${sit.label}: ${url}`);
      const res = await fetchWithRetry(url);
      if (!res.ok) { console.log(`Failed ${sit.label}: ${res.status}`); continue; }
      const json = await res.json();
      const dados = json.dados || [];
      console.log(`Got ${dados.length} for ${sit.label}`);

      if (dados.length === 0) continue;

      // Only insert items not already inserted with a higher-priority status
      const newItems = dados.filter((p: any) => !insertedIds.has(String(p.id)));

      const toInsert = newItems.map((p: any) => ({
        id_externo: String(p.id),
        sigla_tipo: p.siglaTipo || 'PL',
        numero: p.numero || 0,
        ano: p.ano || 2026,
        ementa: p.ementa,
        status_kanban: sit.status,
        lei_afetada: extractLeiAfetada(p.ementa),
        atualizado_em: new Date().toISOString(),
      }));

      if (toInsert.length > 0) {
        const { error } = await supabase.from('kanban_proposicoes').upsert(toInsert, { onConflict: 'id_externo' });
        if (error) console.log(`Upsert error for ${sit.label}:`, error.message);
        else {
          totalInserted += toInsert.length;
          newItems.forEach((p: any) => insertedIds.add(String(p.id)));
        }
      }
      console.log(`Inserted ${toInsert.length} unique for ${sit.label}`);
    } catch (e: any) {
      console.log(`Error seeding ${sit.label}: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 300));
  }

  // Also seed recent tramitando from radar_proposicoes (skip already seeded)
  const { data: radarItems } = await supabase
    .from('radar_proposicoes')
    .select('id_externo, sigla_tipo, numero, ano, ementa')
    .order('atualizado_em', { ascending: false })
    .limit(50);

  if (radarItems && radarItems.length > 0) {
    const newRadar = radarItems.filter((p: any) => !insertedIds.has(String(p.id_externo)));
    const toInsert = newRadar.map((p: any) => ({
      id_externo: p.id_externo,
      sigla_tipo: p.sigla_tipo || 'PL',
      numero: p.numero || 0,
      ano: p.ano || 2026,
      ementa: p.ementa,
      status_kanban: 'tramitando',
      lei_afetada: extractLeiAfetada(p.ementa),
      atualizado_em: new Date().toISOString(),
    }));
    if (toInsert.length > 0) {
      await supabase.from('kanban_proposicoes').upsert(toInsert, { onConflict: 'id_externo', ignoreDuplicates: true });
      totalInserted += toInsert.length;
    }
  }

  console.log(`Seed complete. Total inserted/updated: ${totalInserted}`);
  return totalInserted;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Check if kanban is empty → seed
    const { count } = await supabase
      .from('kanban_proposicoes')
      .select('id', { count: 'exact', head: true });

    if (!count || count === 0) {
      const seeded = await seedFromApi(supabase);
      return new Response(JSON.stringify({
        message: `Seeded ${seeded} propositions from Câmara API`,
        seeded: true,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fill lei_afetada for items missing it
    const { data: missingLei } = await supabase
      .from('kanban_proposicoes')
      .select('id, ementa')
      .is('lei_afetada', null)
      .not('ementa', 'is', null)
      .limit(50);

    if (missingLei && missingLei.length > 0) {
      for (const item of missingLei) {
        const lei = extractLeiAfetada(item.ementa);
        if (lei) await supabase.from('kanban_proposicoes').update({ lei_afetada: lei }).eq('id', item.id);
      }
      console.log(`Filled lei_afetada for ${missingLei.length} items`);
    }

    // Fetch BATCH_SIZE items to update (oldest first, skip publicada)
    const { data: kanbanItems } = await supabase
      .from('kanban_proposicoes')
      .select('*')
      .neq('status_kanban', 'publicada')
      .neq('status_kanban', 'arquivada')
      .order('atualizado_em', { ascending: true, nullsFirst: true })
      .limit(BATCH_SIZE);

    if (!kanbanItems || kanbanItems.length === 0) {
      console.log('No items to update');
      return new Response(JSON.stringify({ message: 'No items to update' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Updating ${kanbanItems.length} items...`);
    let updated = 0;
    const errors: string[] = [];

    for (const item of kanbanItems) {
      try {
        const detRes = await fetchWithRetry(`${CAMARA_API}/proposicoes/${item.id_externo}`);
        if (!detRes.ok) {
          console.log(`Detail failed for ${item.id_externo}: ${detRes.status}`);
          // Still mark as updated to avoid retrying forever
          await supabase.from('kanban_proposicoes').update({ atualizado_em: new Date().toISOString() }).eq('id', item.id);
          continue;
        }
        const detJson = await detRes.json();
        const dados = detJson.dados;
        if (!dados) continue;

        const situacao = dados.statusProposicao?.descricaoSituacao || '';
        const codSituacao = dados.statusProposicao?.codSituacao;
        const novoStatus = classificarStatus(situacao, codSituacao);

        // Don't downgrade status (e.g., don't move "sancao" back to "tramitando")
        const currentPriority = STATUS_PRIORITY[item.status_kanban] || 0;
        const newPriority = STATUS_PRIORITY[novoStatus] || 0;
        const finalStatus = newPriority >= currentPriority ? novoStatus : item.status_kanban;

        const updateData: any = {
          status_kanban: finalStatus,
          situacao_camara: situacao,
          atualizado_em: new Date().toISOString(),
        };

        if (dados.statusProposicao?.dataHora) {
          updateData.data_ultima_acao = dados.statusProposicao.dataHora;
        }

        if (!item.ementa && dados.ementa) {
          updateData.ementa = dados.ementa;
        }

        if (!item.lei_afetada) {
          const lei = extractLeiAfetada(item.ementa || dados.ementa);
          if (lei) updateData.lei_afetada = lei;
        }

        await supabase.from('kanban_proposicoes').update(updateData).eq('id', item.id);
        console.log(`Updated ${item.id_externo} → ${finalStatus} (API: ${situacao})`);
        updated++;

        await new Promise(r => setTimeout(r, 200));
      } catch (e: any) {
        errors.push(`${item.id_externo}: ${e.message}`);
      }
    }

    console.log(`Done. Updated ${updated}/${kanbanItems.length}`);

    return new Response(JSON.stringify({
      message: `Updated ${updated}/${kanbanItems.length} items`,
      errors: errors.length > 0 ? errors : undefined,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('Edge function error:', e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
