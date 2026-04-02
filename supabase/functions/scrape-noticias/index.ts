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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check for fill_empty mode
    let mode = "scrape";
    try {
      const body = await req.json();
      if (body?.mode === "fill_empty") mode = "fill_empty";
    } catch { /* no body = default scrape */ }

    if (mode === "fill_empty") {
      return await handleFillEmpty(supabase);
    }

    const browserlessUrl = '';  // Not used anymore for Migalhas

    // ── 1. Scrape Câmara ──
    console.log("Scraping Câmara dos Deputados...");
    const camaraResults = await scrapeCamara(browserlessUrl);
    console.log(`Câmara: ${camaraResults.length} artigos`);

    // ── 2. Scrape Migalhas ──
    console.log("Scraping Migalhas...");
    const migalhasResults = await scrapeMigalhas(browserlessUrl);
    console.log(`Migalhas: ${migalhasResults.length} artigos`);

    // ── 3. Upsert all ──
    const allResults = [...camaraResults, ...migalhasResults];
    let inserted = 0;
    for (const item of allResults) {
      const { error } = await supabase
        .from('noticias_camara')
        .upsert(item, { onConflict: 'link' });
      if (error) {
        console.error(`Upsert error for ${item.link}:`, error.message);
      } else {
        inserted++;
      }
    }

    const result = {
      success: true,
      camara: camaraResults.length,
      migalhas: migalhasResults.length,
      total_inserted: inserted,
    };
    console.log("Result:", JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("General error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ════════════════════════════════════════
// Fill empty content for existing news
// ════════════════════════════════════════

async function handleFillEmpty(supabase: any) {
  const { data: emptyNews, error } = await supabase
    .from('noticias_camara')
    .select('id, link, categoria')
    .or('conteudo.is.null,conteudo.eq.')
    .limit(50);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!emptyNews || emptyNews.length === 0) {
    return new Response(JSON.stringify({ success: true, message: "No empty news to fill", filled: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log(`fill_empty: ${emptyNews.length} notícias sem conteúdo`);
  let filled = 0;
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9",
  };

  for (const item of emptyNews) {
    try {
      const resp = await fetch(item.link, { headers });
      if (!resp.ok) { console.error(`HTTP ${resp.status} for ${item.link}`); continue; }
      const html = await resp.text();
      let conteudo = '';

      if (item.link.includes('migalhas.com.br')) {
        conteudo = extractMigalhasContent(html);
      } else if (item.link.includes('camara.leg.br')) {
        conteudo = parseCamaraArticleContent(html);
      } else {
        // Generic: extract paragraphs
        const pReg = /<p[^>]*>([\s\S]*?)<\/p>/gi;
        const paragraphs: string[] = [];
        let m;
        while ((m = pReg.exec(html)) !== null) {
          const text = decodeHtml(m[1]);
          if (text.length > 30) paragraphs.push(text);
        }
        conteudo = paragraphs.join('\n\n');
      }

      if (conteudo && conteudo.length > 50) {
        const { error: upErr } = await supabase
          .from('noticias_camara')
          .update({ conteudo })
          .eq('id', item.id);
        if (!upErr) filled++;
        else console.error(`Update error for ${item.id}:`, upErr.message);
      }
    } catch (e) {
      console.error(`fill_empty error for ${item.link}:`, e);
    }
    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`fill_empty done: ${filled}/${emptyNews.length} filled`);
  return new Response(JSON.stringify({ success: true, total_empty: emptyNews.length, filled }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function extractMigalhasContent(html: string): string {
  // Strategy 1: LEITURA embedded JSON
  const artScriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = artScriptRegex.exec(html)) !== null) {
    if (m[1].includes('LEITURA') && m[1].includes('&q;')) {
      const decoded = m[1].replace(/&q;/g, '"');
      try {
        const data = JSON.parse(decoded);
        for (const key of Object.keys(data)) {
          if (!key.includes('LEITURA')) continue;
          const d = data[key]?.Data;
          if (d?.body) return decodeHtml(d.body);
          if (d?.content) return decodeHtml(d.content);
        }
      } catch { /* skip */ }
    }
  }
  // Strategy 2: HTML containers
  const containers = [
    /<div[^>]*class="[^"]*leitura-corpo[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<main[^>]*>([\s\S]*?)<\/main>/i,
  ];
  for (const pat of containers) {
    const cm = html.match(pat);
    if (cm) {
      const paragraphs: string[] = [];
      const pReg = /<p[^>]*>([\s\S]*?)<\/p>/gi;
      let pm;
      while ((pm = pReg.exec(cm[1])) !== null) {
        const text = decodeHtml(pm[1]);
        if (text.length > 30) paragraphs.push(text);
      }
      if (paragraphs.length > 0) return paragraphs.join('\n\n');
    }
  }
  // Strategy 3: og:description
  const ogDesc = html.match(/property="og:description"[^>]*content="([^"]+)"/i);
  if (ogDesc) return decodeHtml(ogDesc[1]);
  return '';
}

// ════════════════════════════════════════
// Shared helpers
// ════════════════════════════════════════

async function fetchPage(browserlessUrl: string, targetUrl: string): Promise<string> {
  const res = await fetch(browserlessUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: targetUrl,
      gotoOptions: { waitUntil: "domcontentloaded", timeout: 60000 },
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Browserless failed (${res.status}): ${errText}`);
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
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

function isValidYear(year: number): boolean {
  return year >= 2020 && year <= 2030;
}

// ════════════════════════════════════════
// Câmara dos Deputados
// ════════════════════════════════════════

interface NewsItem {
  titulo: string;
  resumo: string;
  conteudo: string;
  imagem_url: string;
  categoria: string;
  link: string;
  data_publicacao: string;
}

async function scrapeCamara(_browserlessUrl: string): Promise<NewsItem[]> {
  try {
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "pt-BR,pt;q=0.9",
    };
    const resp = await fetch("https://www.camara.leg.br/noticias", { headers });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const listHtml = await resp.text();
    const newsItems = parseCamaraList(listHtml);
    if (newsItems.length === 0) return [];

    const limit = Math.min(newsItems.length, 15);
    const results: NewsItem[] = [];

    for (let i = 0; i < limit; i++) {
      const item = newsItems[i];
      try {
        const artResp = await fetch(item.link, { headers });
        const articleHtml = artResp.ok ? await artResp.text() : '';
        const conteudo = articleHtml ? parseCamaraArticleContent(articleHtml) : '';
        const dataPublicacao = articleHtml ? parseCamaraArticleDate(articleHtml) : null;
        const imagemUrl = item.imagemUrl || (articleHtml ? parseCamaraArticleImage(articleHtml) : '');

        results.push({
          titulo: item.titulo,
          resumo: item.resumo,
          conteudo,
          imagem_url: imagemUrl,
          categoria: item.categoria,
          link: item.link,
          data_publicacao: dataPublicacao || new Date().toISOString(),
        });
      } catch (err) {
        console.error(`Error scraping camara ${item.link}:`, err);
        results.push({
          titulo: item.titulo,
          resumo: item.resumo,
          conteudo: '',
          imagem_url: item.imagemUrl,
          categoria: item.categoria,
          link: item.link,
          data_publicacao: new Date().toISOString(),
        });
      }
      if (i < limit - 1) await new Promise(r => setTimeout(r, 300));
    }
    return results;
  } catch (err) {
    console.error("Câmara scrape failed:", err);
    return [];
  }
}

interface CamaraListItem {
  titulo: string;
  resumo: string;
  imagemUrl: string;
  categoria: string;
  link: string;
}

function parseCamaraList(html: string): CamaraListItem[] {
  const items: CamaraListItem[] = [];
  const linkRegex = /<a[^>]*class="[^"]*g-chamada__titulo-link[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  const imgRegex = /<img[^>]*class="[^"]*g-chamada__imagem[^"]*"[^>]*src="([^"]*)"[^>]*/gi;
  const catRegex = /<span[^>]*class="[^"]*g-chamada__retranca[^"]*"[^>]*>([\s\S]*?)<\/span>/gi;
  const descRegex = /<p[^>]*class="[^"]*g-chamada__descricao[^"]*"[^>]*>([\s\S]*?)<\/p>/gi;

  const links: { href: string; text: string }[] = [];
  const imgs: string[] = [];
  const cats: string[] = [];
  const descs: string[] = [];

  let m;
  while ((m = linkRegex.exec(html)) !== null) links.push({ href: m[1], text: decodeHtml(m[2]) });
  while ((m = imgRegex.exec(html)) !== null) imgs.push(m[1]);
  while ((m = catRegex.exec(html)) !== null) cats.push(decodeHtml(m[1]));
  while ((m = descRegex.exec(html)) !== null) descs.push(decodeHtml(m[1]));

  if (links.length === 0) {
    const fallbackRegex = /<a[^>]*href="(https?:\/\/www\.camara\.leg\.br\/noticias\/\d+[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    while ((m = fallbackRegex.exec(html)) !== null) {
      const text = decodeHtml(m[2]);
      if (text.length > 10) links.push({ href: m[1], text });
    }
  }

  const seen = new Set<string>();
  for (let i = 0; i < links.length; i++) {
    let href = links[i].href;
    if (href.startsWith('/')) href = `https://www.camara.leg.br${href}`;
    if (seen.has(href)) continue;
    seen.add(href);
    items.push({
      titulo: links[i].text,
      resumo: descs[i] || '',
      imagemUrl: imgs[i] || '',
      categoria: cats[i] || 'Legislação',
      link: href,
    });
  }
  return items;
}

function parseCamaraArticleImage(html: string): string {
  const patterns = [
    /<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i,
    /<meta[^>]*content="([^"]+)"[^>]*property="og:image"/i,
    /<meta[^>]*name="twitter:image"[^>]*content="([^"]+)"/i,
    /<meta[^>]*content="([^"]+)"[^>]*name="twitter:image"/i,
    /<figure[^>]*>[\s\S]*?<img[^>]*src="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i,
    /<img[^>]*class="[^"]*(?:foto-materia|imagem-materia|foto|imagem)[^"]*"[^>]*src="([^"]+)"/i,
    /<img[^>]*src="(https?:\/\/[^"]*camara\.leg\.br\/midias\/image[^"]+)"/i,
    /src="(https?:\/\/[^"]*camara\.leg\.br[^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"/i,
  ];
  for (const p of patterns) {
    const match = html.match(p);
    if (match?.[1]) return match[1];
  }
  return '';
}

function parseCamaraArticleContent(html: string): string {
  const contentPatterns = [
    /<div[^>]*class="[^"]*texto-materia[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<div[^>]*class="(?!.*texto-materia))/i,
    /<div[^>]*class="[^"]*wrapper-conteudo-noticia[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<(?:footer|aside|div[^>]*class="(?!.*wrapper-conteudo))/i,
    /<article[^>]*>([\s\S]*?)<\/article>/i,
  ];
  let rawContent = '';
  for (const p of contentPatterns) {
    const match = html.match(p);
    if (match) { rawContent = match[1]; break; }
  }
  if (!rawContent) {
    const bodyMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    rawContent = bodyMatch ? bodyMatch[1] : html;
  }
  const paragraphs: string[] = [];
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = pRegex.exec(rawContent)) !== null) {
    const text = decodeHtml(m[1]);
    if (text.length > 10) paragraphs.push(text);
  }
  return paragraphs.join('\n\n');
}

function parseCamaraArticleDate(html: string): string | null {
  const dtMatch = html.match(/datetime="([^"]+)"/);
  if (dtMatch) {
    const parsed = new Date(dtMatch[1]);
    if (!isNaN(parsed.getTime()) && isValidYear(parsed.getFullYear())) return dtMatch[1];
  }
  const brMatch = html.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (brMatch) {
    const year = Number(brMatch[3]);
    if (isValidYear(year)) return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}T00:00:00Z`;
  }
  return null;
}

// ════════════════════════════════════════
// Migalhas (fetch direto — extrai JSON embutido no HTML)
// ════════════════════════════════════════

async function scrapeMigalhas(browserlessUrl: string): Promise<NewsItem[]> {
  try {
    // Fetch the page directly — Migalhas embeds article data as JSON in a <script> tag
    const resp = await fetch("https://www.migalhas.com.br/quentes", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
    });
    if (!resp.ok) {
      console.error(`Migalhas fetch failed: ${resp.status}`);
      return [];
    }
    const html = await resp.text();

    // Find the embedded JSON (Angular transfer state) — uses &q; as quote delimiter
    const scripts: string[] = [];
    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    let m;
    while ((m = scriptRegex.exec(html)) !== null) {
      if (m[1].includes('QUENTES_LISTA') && m[1].includes('&q;')) {
        scripts.push(m[1]);
      }
    }

    if (scripts.length === 0) {
      console.error("Migalhas: no embedded JSON found");
      return [];
    }

    const decoded = scripts[0].replace(/&q;/g, '"');
    let data: Record<string, any>;
    try {
      data = JSON.parse(decoded);
    } catch (e) {
      console.error("Migalhas JSON parse error:", e);
      return [];
    }

    // Find the QUENTES_LISTA widget with articles
    let assets: any[] = [];
    for (const key of Object.keys(data)) {
      if (key.includes('QUENTES_LISTA') && key.includes('pagenumber')) {
        assets = data[key]?.Data?.widgetassets || [];
        break;
      }
    }

    if (assets.length === 0) {
      console.log("Migalhas: no articles in widgetassets");
      return [];
    }

    const results: NewsItem[] = [];
    const limit = Math.min(assets.length, 10);

    for (let i = 0; i < limit; i++) {
      const asset = assets[i]?.asset;
      if (!asset) continue;

      const titulo = asset.title || '';
      const resumo = asset.summary || '';
      const link = asset.href?.address?.absoluteuri || '';
      const imagemUrl = asset.image?.address?.absoluteuri || '';
      const pubdate = asset.pubdate || '';

      if (!titulo || !link) continue;

      // Format date
      let data_publicacao = new Date().toISOString();
      if (pubdate) {
        try {
          const d = new Date(pubdate);
          if (!isNaN(d.getTime()) && isValidYear(d.getFullYear())) {
            data_publicacao = d.toISOString();
          }
        } catch { /* use default */ }
      }

      let conteudo = '';
      // Fetch article content directly (no Browserless needed)
      try {
        const artResp = await fetch(link, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "pt-BR,pt;q=0.9",
          },
        });
        if (!artResp.ok) throw new Error(`HTTP ${artResp.status}`);
        const articleHtml = await artResp.text();

        // Strategy 1: Extract from LEITURA embedded JSON
        const artScripts: string[] = [];
        let am;
        const artScriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
        while ((am = artScriptRegex.exec(articleHtml)) !== null) {
          if (am[1].includes('LEITURA') && am[1].includes('&q;')) {
            artScripts.push(am[1]);
          }
        }
        if (artScripts.length > 0) {
          const artDecoded = artScripts[0].replace(/&q;/g, '"');
          try {
            const artData = JSON.parse(artDecoded);
            for (const key of Object.keys(artData)) {
              if (!key.includes('LEITURA')) continue;
              const d = artData[key]?.Data;
              if (d?.body) {
                conteudo = decodeHtml(d.body);
                break;
              }
              if (d?.content) {
                conteudo = decodeHtml(d.content);
                break;
              }
            }
          } catch { /* skip */ }
        }

        // Strategy 2: Extract <p> tags from article containers
        if (!conteudo || conteudo.length < 100) {
          const containers = [
            /<div[^>]*class="[^"]*leitura-corpo[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
            /<div[^>]*class="[^"]*materia-conteudo[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
            /<article[^>]*>([\s\S]*?)<\/article>/i,
            /<main[^>]*>([\s\S]*?)<\/main>/i,
          ];
          let rawContent = '';
          for (const pat of containers) {
            const cm = articleHtml.match(pat);
            if (cm) { rawContent = cm[1]; break; }
          }
          if (rawContent) {
            const paragraphs: string[] = [];
            const pReg = /<p[^>]*>([\s\S]*?)<\/p>/gi;
            let pm;
            while ((pm = pReg.exec(rawContent)) !== null) {
              const text = decodeHtml(pm[1]);
              if (text.length > 30) paragraphs.push(text);
            }
            if (paragraphs.length > 0) conteudo = paragraphs.join('\n\n');
          }
        }

        // Strategy 3: og:description fallback
        if (!conteudo) {
          const ogDesc = articleHtml.match(/property="og:description"[^>]*content="([^"]+)"/i);
          if (ogDesc) conteudo = decodeHtml(ogDesc[1]);
        }
      } catch (e) {
        console.error(`Error fetching migalhas article ${link}:`, e);
      }

      results.push({
        titulo,
        resumo,
        conteudo,
        imagem_url: imagemUrl,
        categoria: 'Migalhas',
        link,
        data_publicacao,
      });

      if (i < limit - 1) await new Promise(r => setTimeout(r, 300));
    }

    return results;
  } catch (err) {
    console.error("Migalhas scrape failed:", err);
    return [];
  }
}
