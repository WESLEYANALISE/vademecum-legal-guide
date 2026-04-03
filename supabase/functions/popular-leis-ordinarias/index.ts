import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const FETCH_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
};

function decodeHtml(raw: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(raw);
  } catch {
    return new TextDecoder("iso-8859-1").decode(raw);
  }
}

function extractLeiData(html: string, num: number): {
  numero_lei: string;
  data_publicacao: string;
  ementa: string;
  texto_completo: string;
  url: string;
} | null {
  if (html.includes("Ocorreu um erro") || html.length < 500) return null;

  // Clean body for extraction
  const bodyClean = html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#\d+;/g, (m) => String.fromCharCode(parseInt(m.slice(2, -1))))
    .replace(/\s+/g, " ")
    .trim();

  // Extract title + ementa
  const m = bodyClean.match(
    /LEI\s+N[ºo°]\s*[\d.]+,?\s*DE\s+(\d{1,2})\s+DE\s+(\w+)\s+DE\s+(\d{4})\s*(.+?)\s*O\s+PRESIDENTE/i
  );

  let data_publicacao = "";
  let ementa = "";

  if (m) {
    const meses: Record<string, string> = {
      janeiro: "1", fevereiro: "2", "março": "3", marco: "3",
      abril: "4", maio: "5", junho: "6", julho: "7",
      agosto: "8", setembro: "9", outubro: "10", novembro: "11", dezembro: "12",
    };
    data_publicacao = `${m[1]}.${meses[m[2].toLowerCase()] || "0"}.${m[3]}`;
    ementa = m[4].replace(/^Mensagem de veto\s*/i, "").trim();
  }

  // Build numero_lei
  const nStr = num >= 10000
    ? `${Math.floor(num / 1000)}.${String(num % 1000).padStart(3, "0")}`
    : String(num);
  const numero_lei = `Lei nº ${nStr}`;

  // Full text
  let body = html;
  body = body.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  body = body.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  body = body.replace(/<\/p>/gi, "\n\n");
  body = body.replace(/<br\s*\/?>/gi, "\n");
  body = body.replace(/<\/div>/gi, "\n");
  body = body.replace(/<[^>]+>/g, "");
  body = body.replace(/&nbsp;/g, " ");
  body = body.replace(/&amp;/g, "&");
  body = body.replace(/&lt;/g, "<");
  body = body.replace(/&gt;/g, ">");
  body = body.replace(/&quot;/g, '"');
  body = body.replace(/&#39;/g, "'");
  body = body.replace(/&#\d+;/g, (m) => String.fromCharCode(parseInt(m.slice(2, -1))));
  body = body.replace(/\n{3,}/g, "\n\n").trim();

  return {
    numero_lei,
    data_publicacao,
    ementa: ementa.substring(0, 500),
    texto_completo: body.substring(0, 50000),
    url: `/ccivil_03/_ato2023-2026/2026/lei/L${num}.htm`,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { ano } = body as { ano?: number };

    if (!ano) {
      return new Response(
        JSON.stringify({ error: "Campo 'ano' é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Connect to Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get existing laws to know what we already have
    const { data: existing } = await supabase
      .from("leis_ordinarias")
      .select("numero_lei")
      .eq("ano", ano);

    const existingSet = new Set((existing || []).map((e: any) => e.numero_lei));
    const maxExistingOrdem = existing?.length || 0;

    // Scan individual law URLs to find new ones
    // Start from the last known number and scan forward
    const lastNum = Math.max(
      ...Array.from(existingSet).map((n: string) => {
        const m = n.match(/(\d[\d.]*\d)/);
        return m ? parseInt(m[1].replace(/\./g, "")) : 0;
      }),
      15321 // fallback start for 2026
    );

    console.log(`Último número conhecido: ${lastNum}, existentes: ${existingSet.size}`);

    const newLeis: any[] = [];
    let consecutiveMisses = 0;

    for (let num = lastNum + 1; consecutiveMisses < 5; num++) {
      const url = `https://www.planalto.gov.br/ccivil_03/_ato2023-2026/${ano}/lei/L${num}.htm`;

      try {
        const resp = await fetch(url, { headers: FETCH_HEADERS });

        if (!resp.ok || resp.status === 404) {
          consecutiveMisses++;
          continue;
        }

        const raw = new Uint8Array(await resp.arrayBuffer());
        const html = decodeHtml(raw);
        const lei = extractLeiData(html, num);

        if (!lei) {
          consecutiveMisses++;
          continue;
        }

        consecutiveMisses = 0;

        if (existingSet.has(lei.numero_lei)) {
          console.log(`Já existe: ${lei.numero_lei}`);
          continue;
        }

        newLeis.push(lei);
        console.log(`Nova: ${lei.numero_lei} | ${lei.data_publicacao}`);

        // Small delay
        await new Promise((r) => setTimeout(r, 300));
      } catch (err) {
        console.error(`Erro ao buscar L${num}:`, err);
        consecutiveMisses++;
      }
    }

    if (newLeis.length === 0) {
      return new Response(
        JSON.stringify({ ano, message: "Nenhuma lei nova encontrada", total: existingSet.size }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert new records
    const records = newLeis.map((lei, i) => ({
      ...lei,
      ano,
      ordem: maxExistingOrdem + i + 1,
    }));

    const batchSize = 50;
    let inserted = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from("leis_ordinarias")
        .insert(batch);

      if (insertError) {
        console.error(`Erro ao inserir batch ${i}:`, insertError);
      } else {
        inserted += batch.length;
      }
    }

    console.log(`✅ ${inserted} leis ordinárias novas de ${ano} inseridas`);

    return new Response(
      JSON.stringify({
        ano,
        novasLeis: inserted,
        totalAnterior: existingSet.size,
        totalAtual: existingSet.size + inserted,
        sample: newLeis.slice(0, 5).map((l) => ({
          numero_lei: l.numero_lei,
          data_publicacao: l.data_publicacao,
          ementa: l.ementa.substring(0, 100),
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
