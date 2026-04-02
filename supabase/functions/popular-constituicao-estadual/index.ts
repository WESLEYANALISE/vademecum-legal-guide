import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// URLs das Constituições Estaduais (HTML scrapeable)
const CONSTITUICOES_URLS: Record<string, string> = {
  AC: "http://www.legis.ac.gov.br/detalhar_constituicao",
  AL: "http://www.pge.al.gov.br/documentos/category/174-constituicao-do-estado-de-alagoas",
  BA: "https://www.sinpojud.org.br/UserFiles/File/Legislacao/Constituicao%20Estadual.pdf",
  CE: "https://belt.al.ce.gov.br/index.php/constituicao-do-ceara/constituicao-do-ceara-em-pdf",
  DF: "http://www.sinj.df.gov.br/sinj/Norma/66634/Lei_Org_nica__08_06_1993.html",
  GO: "https://legisla.casacivil.go.gov.br/constituicao-estadual",
  MA: "https://legislacao.al.ma.leg.br/ged/constituicao-estadual/detalhe.html?dswid=4783",
  MG: "https://www.almg.gov.br/atividade-parlamentar/leis/constituicao-estadual",
  MT: "https://leisestaduais.com.br/lei/constituicao-estadual-mt",
  MS: "http://aacpdappls.net.ms.gov.br/appls/legislacao/secoge/govato.nsf/0a67c456bc566b8a04257e590063f1fd/dfde24a4767ddcbf04257e4b006c0233?OpenDocument",
  PA: "http://bancodeleis.alepa.pa.gov.br:8080/especificas/c_estaduallei__74312.pdf",
  PR: "https://www.legislacao.pr.gov.br/legislacao/exibirAto.do?action=iniciarProcesso&codAto=9779&codItemAto=97783",
  PE: "https://legis.alepe.pe.gov.br/texto.aspx?id=4937&tipo=",
  RJ: "http://www3.alerj.rj.gov.br/lotus_notes/default.asp?id=73",
  RO: "https://www.al.ro.leg.br/downloads/constituicao-do-estado-de-rondonia",
  RR: "https://sapl.al.rr.leg.br/ta/564/text",
  SC: "https://www.alesc.sc.gov.br/legislacao",
  SE: "https://legislacao.se.gov.br/constituicao",
  SP: "https://www.al.sp.gov.br/leis/constituicoes/",
  RS: "http://www2.al.rs.gov.br/dal/LegislaCAo/ConstituiCAoEstadual/tabid/3683/Default.aspx",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { uf } = await req.json();

    if (!uf) {
      return new Response(
        JSON.stringify({ error: "Campo obrigatório: uf" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = CONSTITUICOES_URLS[uf.toUpperCase()];
    if (!url) {
      return new Response(
        JSON.stringify({ error: `URL não configurada para UF: ${uf}` }),
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

    // Fetch HTML via Browserless
    console.log(`Scraping constituição ${uf}: ${url}`);
    const browserlessRes = await fetch(
      `https://production-sfo.browserless.io/content?token=${browserlessKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      }
    );

    if (!browserlessRes.ok) {
      const errText = await browserlessRes.text();
      console.error("Browserless error:", errText);
      return new Response(
        JSON.stringify({ error: `Browserless falhou: ${browserlessRes.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = await browserlessRes.text();
    console.log(`HTML recebido para ${uf}: ${html.length} caracteres`);

    // Parse articles
    const artigos = parseHtmlConstituicao(html);
    console.log(`Artigos encontrados para ${uf}: ${artigos.length}`);

    if (artigos.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum artigo encontrado", htmlLength: html.length, uf }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clear existing data for this UF
    await supabase.from("constituicoes_estaduais").delete().eq("uf", uf.toUpperCase());

    // Insert in batches
    let totalInserted = 0;
    for (let i = 0; i < artigos.length; i += 50) {
      const batch = artigos.slice(i, i + 50).map((art) => ({
        uf: uf.toUpperCase(),
        numero: art.numero,
        rotulo: art.rotulo,
        texto: art.texto,
        caput: art.texto.split("\n")[0] || "",
        ordem_numero: art.ordem_numero,
        ordem: Math.floor(art.ordem_numero),
        titulo: art.titulo || null,
        capitulo: art.capitulo || null,
      }));

      const { error } = await supabase.from("constituicoes_estaduais").insert(batch);
      if (error) {
        console.error(`Erro batch ${i}:`, error.message);
      } else {
        totalInserted += batch.length;
      }
    }

    const result = { success: true, uf: uf.toUpperCase(), totalArtigos: totalInserted };
    console.log("Resultado:", JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro geral:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

interface ArtigoParsed {
  numero: string;
  rotulo: string;
  texto: string;
  ordem_numero: number;
  titulo: string;
  capitulo: string;
}

function decodeHtmlText(text: string): string {
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

function parseHtmlConstituicao(html: string): ArtigoParsed[] {
  const textBlocks: string[] = [];
  const blockRegex = /<(?:p|h[1-6]|center|div|span|li)[^>]*>([\s\S]*?)<\/(?:p|h[1-6]|center|div|span|li)>/gi;
  let match;
  while ((match = blockRegex.exec(html)) !== null) {
    const cleaned = match[1]
      .replace(/<(?:strike|s|del)\b[^>]*>[\s\S]*?<\/(?:strike|s|del)\b>/gi, "")
      .replace(/<(?:br|hr)\s*\/?>/gi, "\n");
    const decoded = decodeHtmlText(cleaned);
    if (decoded) textBlocks.push(decoded);
  }

  const artigos: ArtigoParsed[] = [];
  const artRegex = /^Art\.\s*(\d+(?:\.\d+)*[º°o]?(?:-[A-Z])?)\s*[.–\-\s]/i;
  const capituloRegex = /^CAP[ÍI]TULO\s+/i;
  const tituloRegex = /^T[ÍI]TULO\s+/i;

  let currentTitulo = "";
  let currentCapitulo = "";
  let currentArticle: { artMatch: string; lines: string[]; titulo: string; capitulo: string } | null = null;

  for (let i = 0; i < textBlocks.length; i++) {
    const block = textBlocks[i];

    if (tituloRegex.test(block)) {
      let full = block;
      if (i + 1 < textBlocks.length) {
        const next = textBlocks[i + 1];
        if (/^[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÚÇ]/.test(next) && !artRegex.test(next) && !tituloRegex.test(next) && !capituloRegex.test(next) && next.length < 120) {
          full = block + " " + next;
          i++;
        }
      }
      currentTitulo = full;
      currentCapitulo = "";
      continue;
    }

    if (capituloRegex.test(block)) {
      let full = block;
      if (i + 1 < textBlocks.length) {
        const next = textBlocks[i + 1];
        if (/^[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÚÇ]/.test(next) && !artRegex.test(next) && !tituloRegex.test(next) && !capituloRegex.test(next) && next.length < 120) {
          full = block + " " + next;
          i++;
        }
      }
      currentCapitulo = full;
      continue;
    }

    const artMatch = block.match(artRegex);
    if (artMatch) {
      // Save previous article
      if (currentArticle) {
        pushArticle(artigos, currentArticle);
      }
      currentArticle = {
        artMatch: artMatch[1],
        lines: [block],
        titulo: currentTitulo,
        capitulo: currentCapitulo,
      };
      continue;
    }

    if (currentArticle) {
      currentArticle.lines.push(block);
    }
  }

  // Save last article
  if (currentArticle) {
    pushArticle(artigos, currentArticle);
  }

  // Deduplicate
  const deduped = new Map<number, ArtigoParsed>();
  for (const art of artigos) {
    deduped.set(art.ordem_numero, art);
  }
  return Array.from(deduped.values());
}

function pushArticle(artigos: ArtigoParsed[], raw: { artMatch: string; lines: string[]; titulo: string; capitulo: string }) {
  const normalizedLabel = raw.artMatch.trim().replace(/°/g, "º").replace(/(\d)o\b/gi, "$1º");
  const clean = raw.artMatch.replace(/[º°o]/g, "").replace(/\./g, "").trim();
  const suffixMatch = clean.match(/^(\d+)-([A-Z])$/i);
  let ordem: number;
  if (suffixMatch) {
    const base = parseInt(suffixMatch[1]);
    const suffix = suffixMatch[2].toUpperCase().charCodeAt(0) - 64;
    ordem = base + suffix * 0.1;
  } else {
    const num = parseInt(clean);
    ordem = isNaN(num) ? 0 : num;
  }

  const artRegex = /^Art\.\s*(\d+(?:\.\d+)*[º°o]?(?:-[A-Z])?)\s*[.–\-\s]/i;
  const caputText = raw.lines[0].replace(artRegex, "").replace(/^[oº]\s*/, "").trim();
  const textParts = [caputText, ...raw.lines.slice(1)].filter(Boolean);
  const textoRaw = textParts.join("\n");
  const texto = textoRaw.replace(/(\d)o\b/g, "$1º").replace(/°/g, "º");

  if (texto.trim()) {
    artigos.push({
      numero: `Art. ${clean}`,
      rotulo: `Art. ${normalizedLabel}`,
      texto,
      ordem_numero: ordem,
      titulo: raw.titulo,
      capitulo: raw.capitulo,
    });
  }
}
