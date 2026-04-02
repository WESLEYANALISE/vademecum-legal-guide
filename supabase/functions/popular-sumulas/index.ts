import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tribunal } = await req.json();
    if (!tribunal) {
      return new Response(
        JSON.stringify({ error: "Campo obrigatório: tribunal (STF_VINCULANTE, STF, STJ, TST, TSE, STM)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const browserlessKey = Deno.env.get("BROWSERLESS_API_KEY");
    if (!browserlessKey) {
      return new Response(
        JSON.stringify({ error: "BROWSERLESS_API_KEY não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let sumulas: { numero: number; enunciado: string; situacao: string }[] = [];

    switch (tribunal.toUpperCase()) {
      case "STF_VINCULANTE":
        sumulas = await scrapeSTFVinculantes(browserlessKey);
        break;
      case "STF":
        sumulas = await scrapeSTF(browserlessKey);
        break;
      case "STJ":
        sumulas = await scrapeSTJ(browserlessKey);
        break;
      case "TST":
        sumulas = await scrapeTST(browserlessKey);
        break;
      case "TSE":
        sumulas = await scrapeTSE(browserlessKey);
        break;
      case "STM":
        sumulas = await scrapeSTM(browserlessKey);
        break;
      default:
        return new Response(
          JSON.stringify({ error: `Tribunal não suportado: ${tribunal}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    console.log(`Súmulas encontradas para ${tribunal}: ${sumulas.length}`);

    if (sumulas.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhuma súmula encontrada", tribunal }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase.from("sumulas").delete().eq("tribunal", tribunal.toUpperCase());

    let totalInserted = 0;
    for (let i = 0; i < sumulas.length; i += 50) {
      const batch = sumulas.slice(i, i + 50).map((s) => ({
        tribunal: tribunal.toUpperCase(),
        numero: s.numero,
        enunciado: s.enunciado,
        situacao: s.situacao || "vigente",
        ordem: s.numero,
      }));

      const { error } = await supabase.from("sumulas").insert(batch);
      if (error) {
        console.error(`Erro batch ${i}:`, error.message);
      } else {
        totalInserted += batch.length;
      }
    }

    return new Response(
      JSON.stringify({ success: true, tribunal: tribunal.toUpperCase(), total: totalInserted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro geral:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function fetchHtml(url: string, browserlessKey: string): Promise<string> {
  const res = await fetch(
    `https://production-sfo.browserless.io/content?token=${browserlessKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    }
  );
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Browserless falhou (${res.status}): ${errText.substring(0, 200)}`);
  }
  return await res.text();
}

function decodeHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

// ============ STF VINCULANTES ============
// List page (base=26) has links with sumula IDs
// Individual pages have: <div class="parCOM"><div>ENUNCIADO</div></div>
async function scrapeSTFVinculantes(key: string) {
  const sumulas: { numero: number; enunciado: string; situacao: string }[] = [];
  
  const html = await fetchHtml("https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26", key);
  
  // Extract all sumula links: sumula=ID and Vinculante NUMBER
  const itemRegex = /sumula=(\d+)"[^>]*>\s*S[úu]mula\s+Vinculante\s*(?:&nbsp;)?\s*(\d+)\s*([\s\S]*?)<\/a>/gi;
  const items: { id: string; numero: number; situacao: string }[] = [];
  let match;
  while ((match = itemRegex.exec(html)) !== null) {
    const situacao = match[3].toLowerCase().includes("cancelad") ? "cancelada" : "vigente";
    items.push({ id: match[1], numero: parseInt(match[2]), situacao });
  }
  
  console.log(`STF Vinculantes: ${items.length} links encontrados`);
  
  // Fetch each individual page to get the enunciado
  for (const item of items) {
    try {
      const pageUrl = `https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=${item.id}`;
      const pageHtml = await fetchHtml(pageUrl, key);
      
      // First parCOM div contains the enunciado
      const parcomMatch = pageHtml.match(/class="parCOM"[^>]*>\s*<(?:div|p)[^>]*>([\s\S]*?)<\/(?:div|p)>/i);
      if (parcomMatch) {
        const enunciado = decodeHtml(parcomMatch[1]);
        if (enunciado.length > 10) {
          sumulas.push({ numero: item.numero, enunciado, situacao: item.situacao });
          console.log(`  SV ${item.numero}: ${enunciado.substring(0, 60)}...`);
        }
      }
    } catch (e) {
      console.warn(`Erro SV ${item.numero}:`, e.message);
    }
  }
  
  return sumulas.sort((a, b) => a.numero - b.numero);
}

// ============ STF SUMULAS ============
// Similar structure but base=30, many more pages
async function scrapeSTF(key: string) {
  const sumulas: { numero: number; enunciado: string; situacao: string }[] = [];
  
  const html = await fetchHtml("https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=30", key);
  
  // Extract links
  const itemRegex = /sumula=(\d+)"[^>]*>\s*S[úu]mula\s*(?:&nbsp;)?\s*(\d+)\s*([\s\S]*?)<\/a>/gi;
  const items: { id: string; numero: number; situacao: string }[] = [];
  let match;
  while ((match = itemRegex.exec(html)) !== null) {
    const situacao = match[3].toLowerCase().includes("cancelad") || match[3].toLowerCase().includes("superad") ? "cancelada" : "vigente";
    items.push({ id: match[1], numero: parseInt(match[2]), situacao });
  }
  
  console.log(`STF: ${items.length} links encontrados`);
  
  // For STF regular, there are 700+ sumulas. Fetch each page.
  // Edge Function has 150s timeout, so we process all we can
  for (const item of items) {
    try {
      const pageUrl = `https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=30&sumula=${item.id}`;
      const pageHtml = await fetchHtml(pageUrl, key);
      
      const parcomMatch = pageHtml.match(/class="parCOM"[^>]*>\s*<(?:div|p)[^>]*>([\s\S]*?)<\/(?:div|p)>/i);
      if (parcomMatch) {
        const enunciado = decodeHtml(parcomMatch[1]);
        if (enunciado.length > 10) {
          sumulas.push({ numero: item.numero, enunciado, situacao: item.situacao });
        }
      }
    } catch (e) {
      console.warn(`Erro STF ${item.numero}:`, e.message);
    }
  }
  
  return deduplicateSumulas(sumulas);
}

// ============ STJ ============
// Page has <div class="gridSumula"> blocks
// Each has <span class="numeroSumula">N</span> and <div class="blocoVerbete"> with text
async function scrapeSTJ(key: string) {
  const sumulas: { numero: number; enunciado: string; situacao: string }[] = [];
  
  for (let page = 0; page < 7; page++) {
    const start = page * 100;
    const url = page === 0
      ? "https://scon.stj.jus.br/SCON/sumstj/toc.jsp?livre=&tipo=&operador=e&b=SUMU&p=true&tp=T&l=100"
      : `https://scon.stj.jus.br/SCON/sumstj/toc.jsp?livre=&tipo=&operador=e&b=SUMU&p=true&tp=T&l=100&i=${start + 1}`;
    
    try {
      console.log(`STJ: buscando página ${page + 1}...`);
      const html = await fetchHtml(url, key);
      
      // Split by gridSumula
      const grids = html.split('class="gridSumula"').slice(1);
      console.log(`  Encontradas ${grids.length} súmulas nesta página`);
      
      for (const grid of grids) {
        const numMatch = grid.match(/class="numeroSumula">(\d+)</);
        if (!numMatch) continue;
        const numero = parseInt(numMatch[1]);
        
        // Extract verbete text
        const verbeteMatch = grid.match(/class="blocoVerbete">([\s\S]*?)<\/div>\s*<div class="blocoIcones/);
        if (!verbeteMatch) continue;
        
        let verbeteHtml = verbeteMatch[1];
        // Remove ramoSumula span
        verbeteHtml = verbeteHtml.replace(/<span class="ramoSumula">[\s\S]*?<\/span>/gi, '');
        // Remove anchor tags
        verbeteHtml = verbeteHtml.replace(/<a[^>]*>/gi, '').replace(/<\/a>/gi, '');
        
        const enunciado = decodeHtml(verbeteHtml).trim();
        
        if (enunciado.length > 5) {
          const situacao = grid.toUpperCase().includes("CANCELADA") ? "cancelada" : "vigente";
          sumulas.push({ numero, enunciado, situacao });
        }
      }
    } catch (e) {
      console.warn(`Erro STJ página ${page}:`, e.message);
    }
  }
  
  return deduplicateSumulas(sumulas);
}

// ============ TST ============
async function scrapeTST(key: string) {
  const sumulas: { numero: number; enunciado: string; situacao: string }[] = [];
  try {
    const html = await fetchHtml("https://www3.tst.jus.br/jurisprudencia/Sumulas_com_indice/Sumulas_Ind_Ato_Normativo.html", key);
    const parts = html.split(/S[ÚU]MULA\s+(?:N[ºo°]?\s*)?(\d+)/i);
    for (let i = 1; i < parts.length; i += 2) {
      const numero = parseInt(parts[i]);
      const rest = parts[i + 1] || "";
      const pMatch = rest.match(/<(?:p|div|td)[^>]*>([\s\S]*?)<\/(?:p|div|td)>/i);
      if (pMatch) {
        const enunciado = decodeHtml(pMatch[1]).trim();
        if (enunciado.length > 15) {
          const situacao = rest.substring(0, 300).match(/cancelad[ao]/i) ? "cancelada" : "vigente";
          sumulas.push({ numero, enunciado, situacao });
        }
      }
    }
  } catch (e) {
    console.warn("Erro TST:", e.message);
  }
  return deduplicateSumulas(sumulas);
}

// ============ TSE ============
async function scrapeTSE(key: string) {
  const sumulas: { numero: number; enunciado: string; situacao: string }[] = [];
  try {
    const html = await fetchHtml("https://www.tse.jus.br/legislacao/codigo-eleitoral/sumulas/sumulas-do-tse", key);
    const extracted = extractSumulasGeneric(html);
    sumulas.push(...extracted);
  } catch (e) {
    console.warn("Erro TSE:", e.message);
  }
  return deduplicateSumulas(sumulas);
}

// ============ STM ============
async function scrapeSTM(key: string) {
  const sumulas: { numero: number; enunciado: string; situacao: string }[] = [];
  try {
    const html = await fetchHtml("https://www.stm.jus.br/servicos-stm/juridico/sumulas", key);
    const extracted = extractSumulasGeneric(html);
    sumulas.push(...extracted);
  } catch (e) {
    console.warn("Erro STM:", e.message);
  }
  return deduplicateSumulas(sumulas);
}

function extractSumulasGeneric(html: string) {
  const results: { numero: number; enunciado: string; situacao: string }[] = [];
  const regex = /S[ÚU]MULA\s+(?:N[ºo°]?\s*)?(\d+)\s*[-–:.]\s*/gi;
  const parts = html.split(regex);
  for (let i = 1; i < parts.length; i += 2) {
    const numero = parseInt(parts[i]);
    const rest = parts[i + 1] || "";
    const pMatch = rest.match(/<(?:p|div|td|span)[^>]*>([\s\S]*?)<\/(?:p|div|td|span)>/i);
    let enunciado = "";
    if (pMatch) {
      enunciado = decodeHtml(pMatch[1]).trim();
    } else {
      const plainMatch = rest.match(/^([^<]{20,500})/);
      if (plainMatch) enunciado = plainMatch[1].trim();
    }
    if (enunciado.length > 10) {
      const situacao = enunciado.match(/cancelad[ao]/i) ? "cancelada" : "vigente";
      results.push({ numero, enunciado, situacao });
    }
  }
  return results;
}

function deduplicateSumulas(sumulas: { numero: number; enunciado: string; situacao: string }[]) {
  const map = new Map<number, typeof sumulas[0]>();
  for (const s of sumulas) {
    const existing = map.get(s.numero);
    if (!existing || s.enunciado.length > existing.enunciado.length) {
      map.set(s.numero, s);
    }
  }
  return Array.from(map.values()).sort((a, b) => a.numero - b.numero);
}
