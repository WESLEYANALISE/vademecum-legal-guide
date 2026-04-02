import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AtoExtraido {
  tipo_ato: string; numero_ato: string; ementa: string;
  url: string; data_publicacao: string; data_dou: string;
}

const MESES_URL: Record<string, string> = {
  "01":"janeiro-resenha-diaria","02":"fevereiro-resenha-diaria",
  "03":"marco-resenha-diaria","04":"abril-resenha-diaria",
  "05":"maio-resenha-diaria","06":"junho-resenha-diaria",
  "07":"julho-resenha-diaria","08":"agosto-resenha-diaria",
  "09":"setembro-resenha-diaria","10":"outubro-resenha-diaria",
  "11":"novembro-resenha-diaria","12":"dezembro-resenha-diaria",
};

function classificarTipo(t: string): string | null {
  if (/Lei\s+Complementar/i.test(t)) return "Lei Complementar";
  if (/Medida\s+Provis[oó]ria/i.test(t)) return "Medida Provisória";
  if (/Decreto\s/i.test(t)) return "Decreto";
  if (/Lei\s/i.test(t)) return "Lei";
  return null;
}

function normalizeDateToISO(dateStr: string): string {
  const meses: Record<string,string> = {
    janeiro:"01",fevereiro:"02","março":"03",marco:"03",
    abril:"04",maio:"05",junho:"06",julho:"07",
    agosto:"08",setembro:"09",outubro:"10",novembro:"11",dezembro:"12",
  };
  const m = dateStr.match(/(\d{1,2})[ºª°]?\s+de\s+(\w+)\s+de\s+(\d{4})/i);
  if (!m) return "";
  return `${m[3]}-${meses[m[2].toLowerCase()]||"01"}-${m[1].padStart(2,"0")}`;
}

async function fetchPage(url: string): Promise<string | null> {
  // Strategy 1: Direct fetch with retries
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const resp = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        },
      });
      if (resp.ok) { const t = await resp.text(); if (t.length > 200) { console.log(`Direct OK: ${t.length} chars`); return t; } }
    } catch (e) { console.log(`Direct attempt ${attempt} failed: ${e}`); }
  }

  // Strategy 2: Browserless v2 API
  const key = Deno.env.get("BROWSERLESS_API_KEY");
  if (key) {
    // Try v2 /content endpoint
    for (const baseUrl of [
      `https://production-sfo.browserless.io/content?token=${key}`,
      `https://chrome.browserless.io/content?token=${key}`,
    ]) {
      try {
        console.log(`Trying Browserless: ${baseUrl.split('?')[0]}`);
        const resp = await fetch(baseUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, gotoOptions: { waitUntil: "networkidle2", timeout: 20000 } }),
        });
        console.log(`Browserless status: ${resp.status}`);
        if (resp.ok) {
          const t = await resp.text();
          console.log(`Browserless response length: ${t.length}`);
          if (t.length > 200) return t;
        } else {
          console.log(`Browserless error body: ${(await resp.text()).slice(0, 300)}`);
        }
      } catch (e) { console.log(`Browserless failed: ${e}`); }
    }
  }

  // Strategy 3: Google cache as last resort
  try {
    const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(url)}`;
    const resp = await fetch(cacheUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });
    if (resp.ok) { const t = await resp.text(); if (t.length > 200) { console.log(`Google cache OK: ${t.length} chars`); return t; } }
  } catch (e) { console.log(`Google cache failed: ${e}`); }

  return null;
}

function parseResenhaHTML(html: string): AtoExtraido[] {
  const atos: AtoExtraido[] = [];

  // Extract all <a> tags pointing to planalto
  const allLinks: { url: string; text: string; pos: number }[] = [];
  const linkRe = /<a[^>]*href="(https?:\/\/[^"]*planalto\.gov\.br[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  let lm;
  while ((lm = linkRe.exec(html)) !== null) {
    const text = lm[2].replace(/<[^>]+>/g, "").trim();
    if (text && !(/Mensagem\s+de\s+veto/i.test(text))) {
      allLinks.push({ url: lm[1], text, pos: lm.index });
    }
  }

  // Extract all date occurrences
  const dateRe = /(\d{1,2}[ºª°]?\s+de\s+(?:janeiro|fevereiro|mar[çc]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de\s+\d{4})/gi;
  const dates: { raw: string; iso: string; pos: number }[] = [];
  let dm;
  while ((dm = dateRe.exec(html)) !== null) {
    const iso = normalizeDateToISO(dm[1]);
    if (iso) dates.push({ raw: dm[1], iso, pos: dm.index });
  }

  for (const link of allLinks) {
    const tipo = classificarTipo(link.text);
    if (!tipo) continue;

    let bestDate = dates[0];
    for (const d of dates) { if (d.pos <= link.pos) bestDate = d; else break; }
    if (!bestDate) continue;

    const ementaMatch = link.text.match(/\s+-\s+(.+)/);
    const ementa = ementaMatch ? ementaMatch[1].trim() : link.text;

    atos.push({
      tipo_ato: tipo, numero_ato: link.text.substring(0, 200),
      ementa: ementa.substring(0, 500), url: link.url,
      data_publicacao: bestDate.raw, data_dou: bestDate.iso,
    });
  }
  console.log(`Parsed ${atos.length} atos`);
  return atos;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const curMonth = String(now.getMonth() + 1).padStart(2, "0");
    const prevMonth = String(now.getMonth() === 0 ? 12 : now.getMonth()).padStart(2, "0");

    const allAtos: AtoExtraido[] = [];

    const curUrl = `https://www4.planalto.gov.br/legislacao/portal-legis/resenha-diaria/${MESES_URL[curMonth]}`;
    const curHtml = await fetchPage(curUrl);
    if (curHtml) allAtos.push(...parseResenhaHTML(curHtml));

    if (now.getDate() <= 5 || allAtos.length === 0) {
      const prevUrl = `https://www4.planalto.gov.br/legislacao/portal-legis/resenha-diaria/${MESES_URL[prevMonth]}`;
      const prevHtml = await fetchPage(prevUrl);
      if (prevHtml) allAtos.push(...parseResenhaHTML(prevHtml));
    }

    if (allAtos.length === 0) {
      return new Response(JSON.stringify({ message: "No atos found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const seen = new Set<string>();
    const unique = allAtos.filter(a => { if (seen.has(a.url)) return false; seen.add(a.url); return true; });

    const { error } = await supabase.from("resenha_diaria").upsert(
      unique.map(a => ({ tipo_ato: a.tipo_ato, numero_ato: a.numero_ato, ementa: a.ementa, url: a.url, data_publicacao: a.data_publicacao, data_dou: a.data_dou })),
      { onConflict: "url", ignoreDuplicates: true }
    );
    if (error) throw error;

    return new Response(JSON.stringify({ message: `Scraped ${unique.length} atos`, count: unique.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
