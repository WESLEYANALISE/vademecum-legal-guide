import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, (m) => String.fromCharCode(parseInt(m.slice(2, -1))));
}

function parseDecretos(html: string): { numero_lei: string; data_publicacao: string; ementa: string; url: string }[] {
  const items: { numero_lei: string; data_publicacao: string; ementa: string; url: string }[] = [];

  const rows = html.split(/<tr[^>]*>/i);

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const cells = row.split(/<td[^>]*>/i);
    if (cells.length < 3) continue;

    const cell1 = cells[1] || '';
    const cell2 = cells[2] || '';

    const linkMatch = cell1.match(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!linkMatch) continue;

    const url = linkMatch[1].trim();
    const linkText = linkMatch[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

    const decMatch = linkText.match(/(Decreto\s+n[ºo°]\s*[\d.]+),?\s*de\s*([\d.]+\.\d{4})/i);
    let numero_lei = '';
    let data_publicacao = '';

    if (decMatch) {
      numero_lei = decMatch[1].trim();
      data_publicacao = decMatch[2].trim();
    } else {
      numero_lei = linkText;
    }

    if (numero_lei.toLowerCase().includes('nº do decreto') || numero_lei.toLowerCase().includes('ementa')) continue;

    const ementa = decodeHtmlEntities(
      cell2
        .replace(/<\/td>.*/is, '')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    );

    if (!ementa) continue;

    items.push({ numero_lei, data_publicacao, ementa, url });
  }

  return items;
}

const FETCH_HEADERS_PLANALTO = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
};

async function fetchTextoCompleto(url: string): Promise<string> {
  try {
    let fullUrl = url;
    if (url.startsWith('/')) {
      fullUrl = `https://www.planalto.gov.br${url}`;
    } else if (!url.startsWith('http')) {
      fullUrl = `https://www.planalto.gov.br/${url}`;
    }
    fullUrl = fullUrl.replace(/^http:/, 'https:');

    console.log(`Buscando texto completo (fetch direto): ${fullUrl}`);

    const response = await fetch(fullUrl, { headers: FETCH_HEADERS_PLANALTO });

    if (!response.ok) {
      console.error(`Erro ao buscar ${fullUrl}: ${response.status}`);
      return '';
    }

    const html = await response.text();

    let body = html;
    body = body.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    body = body.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    body = body.replace(/<(?:strike|s|del)[^>]*>[\s\S]*?<\/(?:strike|s|del)>/gi, '');

    // Extract body content (greedy match)
    const bodyMatch = body.match(/<body[^>]*>([\s\S]+)<\/body>/i);
    if (bodyMatch) {
      body = bodyMatch[1];
    }

    body = body.replace(/<blockquote[^>]*>/gi, '');
    body = body.replace(/<\/blockquote>/gi, '');
    body = body.replace(/<\/p>/gi, '\n\n');
    body = body.replace(/<br\s*\/?>/gi, '\n');
    body = body.replace(/<\/div>/gi, '\n');
    body = body.replace(/<\/tr>/gi, '\n');
    body = body.replace(/<[^>]+>/g, '');
    body = decodeHtmlEntities(body);

    body = body
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');

    // Find start of decree content
    const lawStart = body.search(/(?:Presidência\s+da\s+República|DECRETO\s+N[ºo°])/i);
    if (lawStart > 0 && lawStart < 2000) {
      body = body.substring(lawStart);
    }

    // Remove trailing junk
    const dontSub = body.search(/Este texto não substitui/i);
    if (dontSub > 0) {
      const nextNewline = body.indexOf('\n', dontSub);
      if (nextNewline > 0) {
        body = body.substring(0, nextNewline);
      }
    }

    body = body.replace(/[\s*]+$/, '').trim();

    return body;
  } catch (error) {
    console.error(`Erro ao buscar texto completo de ${url}:`, error);
    return '';
  }
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

    const browserlessKey = Deno.env.get("BROWSERLESS_API_KEY");
    if (!browserlessKey) {
      return new Response(
        JSON.stringify({ error: "BROWSERLESS_API_KEY não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const targetUrl = `https://www4.planalto.gov.br/legislacao/portal-legis/legislacao-1/decretos1/${ano}-decretos`;
    console.log(`Buscando decretos de ${ano}: ${targetUrl}`);

    const browserlessUrl = `https://production-sfo.browserless.io/content?token=${browserlessKey}`;
    const response = await fetch(browserlessUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: targetUrl,
        bestAttempt: true,
        gotoOptions: {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Browserless error:", errText);
      return new Response(
        JSON.stringify({ error: `Browserless error: ${response.status}`, detail: errText.substring(0, 500) }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = await response.text();
    console.log(`HTML recebido: ${html.length} caracteres`);

    const decretos = parseDecretos(html);
    console.log(`Decretos encontrados: ${decretos.length}`);

    if (decretos.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum decreto encontrado no HTML", htmlPreview: html.substring(0, 3000) }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    decretos.reverse();

    console.log(`Buscando texto completo de ${decretos.length} decretos...`);
    const textos: string[] = [];
    for (let i = 0; i < decretos.length; i++) {
      const dec = decretos[i];
      if (dec.url) {
        const texto = await fetchTextoCompleto(dec.url);
        textos.push(texto);
        console.log(`Decreto ${i + 1}/${decretos.length}: ${dec.numero_lei} - ${texto.length} chars`);
        if (i < decretos.length - 1) {
          await new Promise(r => setTimeout(r, 500));
        }
      } else {
        textos.push('');
      }
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: deleteError } = await supabase
      .from("decretos")
      .delete()
      .eq("ano", ano);

    if (deleteError) {
      console.error("Erro ao deletar:", deleteError);
    }

    const records = decretos.map((dec, index) => ({
      numero_lei: dec.numero_lei,
      data_publicacao: dec.data_publicacao,
      ementa: dec.ementa,
      url: dec.url,
      ano,
      ordem: index + 1,
      texto_completo: textos[index] || null,
    }));

    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from("decretos")
        .insert(batch);

      if (insertError) {
        console.error(`Erro ao inserir batch ${i}:`, insertError);
      } else {
        inserted += batch.length;
      }
    }

    console.log(`✅ ${inserted} decretos de ${ano} inseridos com texto completo`);

    return new Response(
      JSON.stringify({
        ano,
        totalDecretos: decretos.length,
        inserted,
        comTexto: textos.filter(t => t.length > 0).length,
        sample: decretos.slice(0, 3).map((d, i) => ({ ...d, textoPreview: textos[i]?.substring(0, 200) })),
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
