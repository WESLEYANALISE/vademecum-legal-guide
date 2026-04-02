import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const url = 'https://legis.senado.leg.br/dadosabertos/senador/lista/atual.json'
    console.log('Fetching senadores...')
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    })

    if (!res.ok) throw new Error(`Senado API error: ${res.status}`)

    const json = await res.json()
    const parlamentares = json?.ListaParlamentarEmExercicio?.Parlamentares?.Parlamentar || []

    console.log(`Total senadores fetched: ${parlamentares.length}`)

    await supabase.from('radar_senadores').delete().neq('codigo', '')

    const records = parlamentares.map((p: any) => {
      const id = p.IdentificacaoParlamentar
      return {
        codigo: String(id.CodigoParlamentar),
        nome: id.NomeParlamentar || id.NomeCompletoParlamentar,
        sigla_partido: id.SiglaPartidoParlamentar,
        sigla_uf: id.UfParlamentar,
        foto_url: id.UrlFotoParlamentar,
        dados_json: p,
        atualizado_em: new Date().toISOString(),
      }
    })

    const batchSize = 50
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)
      const { error } = await supabase.from('radar_senadores').upsert(batch, { onConflict: 'codigo' })
      if (error) console.error('Insert error:', error.message)
    }

    return new Response(
      JSON.stringify({ success: true, total: records.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
