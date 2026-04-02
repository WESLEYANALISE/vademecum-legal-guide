import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODOS = ["explicacao", "exemplo", "termos", "sugerir_perguntas"] as const;

const TABELAS_TOP = [
  "CF88_CONSTITUICAO_FEDERAL",
  "CP_CODIGO_PENAL",
  "CC_CODIGO_CIVIL",
  "CPC_CODIGO_PROCESSO_CIVIL",
  "CPP_CODIGO_PROCESSO_PENAL",
  "CLT_CONSOLIDACAO_LEIS_TRABALHO",
  "CDC_CODIGO_DEFESA_CONSUMIDOR",
  "CTN_CODIGO_TRIBUTARIO_NACIONAL",
  "ECA_ESTATUTO_CRIANCA_ADOLESCENTE",
  "CTB_CODIGO_TRANSITO_BRASILEIRO",
];

async function callGemini(apiKey: string, prompt: string, systemPrompt: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
        signal: AbortSignal.timeout(30000),
      }
    );
    if (!res.ok) {
      const errText = await res.text();
      console.error(`Gemini HTTP ${res.status}: ${errText.slice(0, 200)}`);
      return null;
    }
    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) {
      console.warn(`Gemini empty candidate: ${JSON.stringify(json).slice(0, 200)}`);
    }
    return text || null;
  } catch (e: any) {
    console.error(`Gemini fetch error: ${e.message}`);
    return null;
  }
}

function buildPrompt(modo: string, artigo: { numero: string; caput: string; texto: string }, tabela: string): { prompt: string; system: string } {
  const ctx = `Lei/Código: ${tabela.replace(/_/g, " ")}\n${artigo.numero}\n${artigo.caput || artigo.texto}`;

  switch (modo) {
    case "explicacao":
      return {
        system: "Você é um professor de Direito Brasileiro. Explique artigos de forma clara, didática e completa em português.",
        prompt: `Explique o seguinte artigo de lei de forma completa, clara e didática. Inclua contexto, finalidade e aplicação prática.\n\n${ctx}`,
      };
    case "exemplo":
      return {
        system: "Você é um professor de Direito que cria exemplos práticos e realistas para ilustrar artigos de lei.",
        prompt: `Crie 2-3 exemplos práticos e realistas que ilustrem a aplicação do seguinte artigo:\n\n${ctx}`,
      };
    case "termos":
      return {
        system: "Você é um glossarista jurídico especializado em terminologia legal brasileira.",
        prompt: `Identifique e defina os termos jurídicos técnicos presentes no seguinte artigo. Forneça definições claras e acessíveis.\n\n${ctx}`,
      };
    case "sugerir_perguntas":
      return {
        system: "Você é um tutor jurídico que cria perguntas de estudo sobre artigos de lei.",
        prompt: `Gere 5 perguntas de estudo relevantes sobre o seguinte artigo, variando entre conceituais, práticas e de interpretação:\n\n${ctx}\n\nRetorne APENAS um JSON array de strings, ex: ["Pergunta 1?", "Pergunta 2?"]`,
      };
    default:
      return { system: "", prompt: ctx };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_KEY) throw new Error("GEMINI_API_KEY not set");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json().catch(() => ({}));
    const tabela = body.tabela || TABELAS_TOP[0];
    const limitPerRun = body.limit || 10;
    const modos = body.modos || [...MODOS];

    console.log(`[popular-explicacoes] tabela=${tabela}, limit=${limitPerRun}, modos=${modos.join(",")}`);

    // 1. Get all articles from the table
    const { data: artigos, error: artErr } = await supabase
      .from(tabela)
      .select("numero, caput, texto")
      .order("ordem_numero", { ascending: true });

    if (artErr || !artigos?.length) {
      return new Response(
        JSON.stringify({ error: artErr?.message || "No articles found", tabela }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Get existing cache entries for this table
    const { data: cached } = await supabase
      .from("artigo_ai_cache")
      .select("artigo_numero, modo")
      .eq("tabela_nome", tabela);

    const cacheSet = new Set((cached || []).map((c: any) => `${c.artigo_numero}::${c.modo}`));

    // 3. Find articles missing cache for any modo
    const pending: { artigo: any; modo: string }[] = [];
    for (const art of artigos) {
      for (const modo of modos) {
        if (!cacheSet.has(`${art.numero}::${modo}`)) {
          pending.push({ artigo: art, modo });
        }
      }
    }

    console.log(`[popular-explicacoes] ${pending.length} pending generations, processing up to ${limitPerRun}`);

    const toProcess = pending.slice(0, limitPerRun);
    let generated = 0;
    let errors = 0;

    // Process in batches of 3 with delay
    const batchSize = 3;
    for (let i = 0; i < toProcess.length; i += batchSize) {
      const batch = toProcess.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async ({ artigo, modo }) => {
          try {
            const { prompt, system } = buildPrompt(modo, artigo, tabela);
            const result = await callGemini(GEMINI_KEY, prompt, system);

            if (result) {
              await supabase.from("artigo_ai_cache").upsert(
                {
                  tabela_nome: tabela,
                  artigo_numero: artigo.numero,
                  modo,
                  conteudo: result,
                },
                { onConflict: "tabela_nome,artigo_numero,modo" }
              );
              generated++;
              console.log(`✓ ${tabela} ${artigo.numero} [${modo}]`);
            } else {
              errors++;
              console.warn(`✗ ${tabela} ${artigo.numero} [${modo}] — empty response`);
            }
          } catch (e: any) {
            errors++;
            console.error(`✗ ${tabela} ${artigo.numero} [${modo}] — ${e.message}`);
          }
        })
      );

      // Delay between batches to respect rate limits
      if (i + batchSize < toProcess.length) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    return new Response(
      JSON.stringify({
        tabela,
        totalArticles: artigos.length,
        totalPending: pending.length,
        processed: toProcess.length,
        generated,
        errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[popular-explicacoes] Fatal:", err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
