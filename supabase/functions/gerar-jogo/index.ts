import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tabela, artigo, tipo_jogo } = await req.json();
    if (!tabela || !artigo || !tipo_jogo) {
      return new Response(
        JSON.stringify({ error: "tabela, artigo e tipo_jogo são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch article text from Supabase
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const dbResp = await fetch(
      `${SUPABASE_URL}/rest/v1/${tabela}?numero=eq.${encodeURIComponent(artigo)}&select=numero,caput,texto,incisos,paragrafos,rotulo`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    const rows = await dbResp.json();
    if (!rows || rows.length === 0) {
      return new Response(
        JSON.stringify({ error: "Artigo não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const art = rows[0];
    const textoCompleto = [
      art.caput || art.texto || "",
      ...(art.incisos || []),
      ...(art.paragrafos || []),
    ].join("\n");

    let prompt = "";

    if (tipo_jogo === "forca") {
      prompt = `Você é um professor de Direito brasileiro. Com base no artigo de lei abaixo, extraia 5 termos jurídicos importantes (palavras únicas, sem espaços, sem acentos, em MAIÚSCULAS) e uma dica contextual curta para cada um.

Artigo: ${textoCompleto}

Responda APENAS em JSON válido neste formato exato:
{"palavras": [{"palavra": "EXEMPLO", "dica": "Dica contextual sobre o termo"}, {"palavra": "OUTRO", "dica": "Dica do segundo termo"}, {"palavra": "TERCEIRO", "dica": "Dica do terceiro"}, {"palavra": "QUARTO", "dica": "Dica do quarto"}, {"palavra": "QUINTO", "dica": "Dica do quinto"}]}

Regras:
- Exatamente 5 termos diferentes
- Cada palavra deve ter entre 4 e 12 letras
- Sem acentos, sem espaços, sem hífens
- Apenas letras A-Z maiúsculas
- Cada dica deve ter no máximo 80 caracteres
- Os termos devem ser relevantes ao conteúdo do artigo`;
    } else if (tipo_jogo === "caca-palavras") {
      prompt = `Você é um professor de Direito brasileiro. Com base no artigo de lei abaixo, extraia 8 termos jurídicos relevantes (palavras únicas, sem espaços, sem acentos, em MAIÚSCULAS, entre 3 e 10 letras).

Artigo: ${textoCompleto}

Depois, crie uma grade 12x12 de letras onde essas 8 palavras estejam escondidas (horizontal, vertical ou diagonal). Preencha os espaços vazios com letras aleatórias maiúsculas.

Responda APENAS em JSON válido neste formato:
{
  "palavras": ["TERMO1", "TERMO2", ...],
  "grade": [["A","B","C","D","E","F","G","H","I","J","K","L"], ...]
}

Regras:
- Exatamente 12 linhas e 12 colunas
- Todas as 8 palavras devem estar presentes na grade
- Sem acentos, sem espaços, apenas A-Z`;
    } else if (tipo_jogo === "cruzadas") {
      prompt = `Você é um professor de Direito brasileiro. Com base no artigo de lei abaixo, crie uma mini palavra cruzada com 6 termos jurídicos.

Artigo: ${textoCompleto}

Para cada termo, forneça: número, direção (horizontal ou vertical), dica, resposta (sem acentos, maiúsculas), linha e coluna iniciais (base 0, grade 15x15).

Responda APENAS em JSON válido neste formato:
{
  "tamanho": 15,
  "pistas": [
    {"numero": 1, "direcao": "horizontal", "dica": "...", "resposta": "TERMO", "linha": 0, "coluna": 2},
    {"numero": 2, "direcao": "vertical", "dica": "...", "resposta": "OUTRO", "linha": 0, "coluna": 4}
  ]
}

Regras:
- Respostas sem acentos, sem espaços, apenas A-Z maiúsculas
- Cada resposta entre 3 e 12 letras
- As palavras devem caber na grade 15x15
- Pelo menos 2 cruzamentos entre palavras horizontais e verticais
- Dicas com no máximo 80 caracteres`;
    } else {
      return new Response(
        JSON.stringify({ error: "tipo_jogo inválido. Use: forca, caca-palavras, cruzadas" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    const geminiData = await geminiResp.json();
    const rawText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse JSON from response
    let gameData;
    try {
      gameData = JSON.parse(rawText);
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        gameData = JSON.parse(jsonMatch[1].trim());
      } else {
        throw new Error("Resposta da IA não é JSON válido");
      }
    }

    return new Response(JSON.stringify(gameData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro gerar-jogo:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
