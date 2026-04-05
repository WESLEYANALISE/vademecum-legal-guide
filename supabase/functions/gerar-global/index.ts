import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TABELAS = [
  "CF88_CONSTITUICAO_FEDERAL","CP_CODIGO_PENAL","CC_CODIGO_CIVIL",
  "CPC_CODIGO_PROCESSO_CIVIL","CPP_CODIGO_PROCESSO_PENAL",
  "CTN_CODIGO_TRIBUTARIO_NACIONAL","CDC_CODIGO_DEFESA_CONSUMIDOR",
  "CLT_CONSOLIDACAO_LEIS_TRABALHO","ECA_ESTATUTO_CRIANCA_ADOLESCENTE",
  "CTB_CODIGO_TRANSITO_BRASILEIRO","EI_ESTATUTO_IDOSO",
  "EPD_ESTATUTO_PESSOA_DEFICIENCIA","EOAB_ESTATUTO_OAB",
  "CE_CODIGO_ELEITORAL","CFLOR_CODIGO_FLORESTAL",
  "CPM_CODIGO_PENAL_MILITAR","CPPM_CODIGO_PROCESSO_PENAL_MILITAR",
  "CBA_CODIGO_BRASILEIRO_AERONAUTICA","CCOM_CODIGO_COMERCIAL",
  "CMIN_CODIGO_MINAS","CTEL_CODIGO_TELECOMUNICACOES",
  "CAGUA_CODIGO_AGUAS","EC_ESTATUTO_CIDADE",
  "ED_ESTATUTO_DESARMAMENTO","EIND_ESTATUTO_INDIO",
  "EIR_ESTATUTO_IGUALDADE_RACIAL","EJ_ESTATUTO_JUVENTUDE",
  "EM_ESTATUTO_MILITARES","EME_ESTATUTO_MICROEMPRESA",
  "EMET_ESTATUTO_METROPOLE","EMIG_ESTATUTO_MIGRACAO",
  "EMUS_ESTATUTO_MUSEUS","EPC_ESTATUTO_PESSOA_CANCER",
  "EREF_ESTATUTO_REFUGIADO","ET_ESTATUTO_TORCEDOR",
  "ETERRA_ESTATUTO_TERRA",
  "LEP_EXECUCAO_PENAL","LMP_MARIA_PENHA","LD_LEI_DROGAS",
  "LOC_ORGANIZACAO_CRIMINOSA","LAA_ABUSO_AUTORIDADE",
  "LIT_INTERCEPTACAO_TELEFONICA","L8112_SERVIDORES_FEDERAIS",
  "LIA_IMPROBIDADE_ADMINISTRATIVA","NLL_LICITACOES",
  "LMS_MANDADO_SEGURANCA","LACP_ACAO_CIVIL_PUBLICA",
  "LJE_JUIZADOS_ESPECIAIS","LGPD_PROTECAO_DADOS",
  "MCI_MARCO_CIVIL_INTERNET","LF_FALENCIAS",
  "LA_ARBITRAGEM","LI_INQUILINATO",
  "LRP_REGISTROS_PUBLICOS","LOMAN_LEI_ORGANICA_MAGISTRATURA",
  "LAT_ANTITERRORISMO",
  "LBPS_BENEFICIOS_PREVIDENCIA","LCSS_CUSTEIO_SEGURIDADE",
  "LPC_PREVIDENCIA_COMPLEMENTAR",
  "CES_CODIGO_ETICA_SERVIDOR",
];

const MODOS = ["explicacao", "exemplo", "termos", "sugerir_perguntas"];

function buildPrompt(modo: string, artigo: { numero: string; caput: string; texto: string }, tabela: string): { prompt: string; system: string } {
  const ctx = `Lei/Código: ${tabela.replace(/_/g, " ")}\n${artigo.numero}\n${artigo.caput || artigo.texto}`;
  switch (modo) {
    case "explicacao":
      return { system: "Você é um professor de Direito Brasileiro. Explique artigos de forma clara, didática e completa em português.", prompt: `Explique o seguinte artigo de lei de forma completa, clara e didática. Inclua contexto, finalidade e aplicação prática.\n\n${ctx}` };
    case "exemplo":
      return { system: "Você é um professor de Direito que cria exemplos práticos e realistas para ilustrar artigos de lei.", prompt: `Crie 2-3 exemplos práticos e realistas que ilustrem a aplicação do seguinte artigo:\n\n${ctx}` };
    case "termos":
      return { system: "Você é um glossarista jurídico especializado em terminologia legal brasileira.", prompt: `Identifique e defina os termos jurídicos técnicos presentes no seguinte artigo. Forneça definições claras e acessíveis.\n\n${ctx}` };
    case "sugerir_perguntas":
      return { system: "Você é um tutor jurídico que cria perguntas de estudo sobre artigos de lei.", prompt: `Gere 5 perguntas de estudo relevantes sobre o seguinte artigo, variando entre conceituais, práticas e de interpretação:\n\n${ctx}\n\nRetorne APENAS um JSON array de strings, ex: ["Pergunta 1?", "Pergunta 2?"]` };
    default:
      return { system: "", prompt: ctx };
  }
}

async function callGemini(apiKey: string, prompt: string, system: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
        signal: AbortSignal.timeout(30000),
      }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!GEMINI_KEY) return new Response(JSON.stringify({ error: "GEMINI_API_KEY not set" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // GET → return current state
  if (req.method === "GET") {
    const { data } = await supabase.from("geracao_global").select("*").limit(1).single();
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const body = await req.json().catch(() => ({}));
  const action = body.action;

  // ── STOP ──
  if (action === "stop") {
    await supabase.from("geracao_global").update({ status: "paused", updated_at: new Date().toISOString() }).neq("status", "idle");
    return new Response(JSON.stringify({ ok: true, status: "paused" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // ── START ──
  if (action === "start") {
    // Count total pending across all tables and modes
    let totalPending = 0;
    for (const tabela of TABELAS) {
      const { count: artCount } = await supabase.from(tabela as any).select("*", { count: "exact", head: true });
      const { count: cacheCount } = await supabase.from("artigo_ai_cache").select("*", { count: "exact", head: true }).eq("tabela_nome", tabela).in("modo", MODOS);
      const maxPossible = (artCount || 0) * MODOS.length;
      totalPending += maxPossible - (cacheCount || 0);
    }

    await supabase.from("geracao_global").update({
      status: "running",
      total_pendentes: totalPending,
      total_processadas: 0,
      total_erros: 0,
      current_tabela: null,
      current_artigo: null,
      current_modo: null,
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).not("id", "is", null);

    // Self-invoke tick
    const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/gerar-global`;
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
      body: JSON.stringify({ action: "tick" }),
    }).catch(() => {});

    return new Response(JSON.stringify({ ok: true, status: "running", totalPending }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // ── TICK ──
  if (action === "tick") {
    // Check if still running
    const { data: state } = await supabase.from("geracao_global").select("status").limit(1).single();
    if (state?.status !== "running") {
      return new Response(JSON.stringify({ ok: true, stopped: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Find next pending item
    let found = false;
    for (const tabela of TABELAS) {
      for (const modo of MODOS) {
        // Find one article without cache for this mode
        const { data: artigos } = await supabase.rpc("find_uncached_artigo", { p_tabela: tabela, p_modo: modo });
        
        // Fallback: manual query if RPC doesn't exist
        let artigo: any = artigos?.[0];
        if (!artigo) {
          // Get all articles, then check cache
          const { data: allArt } = await supabase.from(tabela as any).select("numero, caput, texto").order("ordem_numero", { ascending: true }).limit(1);
          if (!allArt?.length) continue;
          
          // Check if this one is cached
          const { data: cached } = await supabase.from("artigo_ai_cache").select("id").eq("tabela_nome", tabela).eq("artigo_numero", allArt[0].numero).eq("modo", modo).limit(1);
          if (cached?.length) {
            // Need to find uncached - do batch check
            const { data: batchArt } = await supabase.from(tabela as any).select("numero, caput, texto").order("ordem_numero", { ascending: true }).limit(5000);
            const { data: batchCache } = await supabase.from("artigo_ai_cache").select("artigo_numero").eq("tabela_nome", tabela).eq("modo", modo);
            const cachedSet = new Set((batchCache || []).map((c: any) => c.artigo_numero));
            artigo = (batchArt || []).find((a: any) => !cachedSet.has(a.numero));
          } else {
            artigo = allArt[0];
          }
        }

        if (!artigo) continue;

        // Found one! Generate it
        found = true;
        await supabase.from("geracao_global").update({
          current_tabela: tabela,
          current_artigo: artigo.numero,
          current_modo: modo,
          updated_at: new Date().toISOString(),
        }).not("id", "is", null);

        const { prompt, system } = buildPrompt(modo, artigo, tabela);
        const result = await callGemini(GEMINI_KEY, prompt, system);

        if (result) {
          await supabase.from("artigo_ai_cache").upsert(
            { tabela_nome: tabela, artigo_numero: artigo.numero, modo, conteudo: result },
            { onConflict: "tabela_nome,artigo_numero,modo" }
          );
          await supabase.rpc("increment_geracao_processadas");
        } else {
          await supabase.rpc("increment_geracao_erros");
        }

        // Wait 2s then self-invoke
        await new Promise(r => setTimeout(r, 2000));
        const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/gerar-global`;
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
          body: JSON.stringify({ action: "tick" }),
        }).catch(() => {});

        return new Response(JSON.stringify({ ok: true, generated: tabela, artigo: artigo.numero, modo }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Nothing pending → done
    if (!found) {
      await supabase.from("geracao_global").update({ status: "done", updated_at: new Date().toISOString() }).not("id", "is", null);
    }

    return new Response(JSON.stringify({ ok: true, done: !found }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
