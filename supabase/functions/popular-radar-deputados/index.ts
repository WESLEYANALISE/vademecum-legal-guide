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

    const allDeputados: any[] = []
    let pagina = 1
    const itens = 100

    while (true) {
      const url = `https://dadosabertos.camara.leg.br/api/v2/deputados?ordem=ASC&ordenarPor=nome&pagina=${pagina}&itens=${itens}`
      console.log(`Fetching page ${pagina}...`)
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      })
      if (!res.ok) {
        console.error(`API error: ${res.status}`)
        break
      }
      const json = await res.json()
      const dados = json.dados || []
      if (dados.length === 0) break
      allDeputados.push(...dados)
      if (dados.length < itens) break
      pagina++
    }

    console.log(`Total deputados fetched: ${allDeputados.length}`)

    // Clear old data
    await supabase.from('radar_deputados').delete().gte('id', 0)

    // Insert in batches
    const batchSize = 50
    for (let i = 0; i < allDeputados.length; i += batchSize) {
      const batch = allDeputados.slice(i, i + batchSize).map((d: any) => ({
        id: d.id,
        nome: d.nome,
        sigla_partido: d.siglaPartido,
        sigla_uf: d.siglaUf,
        foto_url: d.urlFoto,
        email: d.email || null,
        legislatura_id: 57,
        dados_json: d,
        atualizado_em: new Date().toISOString(),
      }))

      const { error } = await supabase.from('radar_deputados').upsert(batch, { onConflict: 'id' })
      if (error) console.error('Insert error:', error.message)
    }

    return new Response(
      JSON.stringify({ success: true, total: allDeputados.length }),
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
