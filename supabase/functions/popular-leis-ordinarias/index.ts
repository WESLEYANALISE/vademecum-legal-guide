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

function parseLeisOrdinarias(html: string): { numero_lei: string; data_publicacao: string; ementa: string; url: string }[] {
  const leis: { numero_lei: string; data_publicacao: string; ementa: string; url: string }[] = [];

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

    const leiMatch = linkText.match(/(Lei\s+n[ºo°]\s*[\d.]+),?\s*de\s*([\d.]+\.\d{4})/i);
    let numero_lei = '';
    let data_publicacao = '';

    if (leiMatch) {
      numero_lei = leiMatch[1].trim();
      data_publicacao = leiMatch[2].trim();
    } else {
      numero_lei = linkText;
    }

    if (numero_lei.toLowerCase().includes('nº da lei') || numero_lei.toLowerCase().includes('ementa')) continue;

    const ementa = decodeHtmlEntities(
      cell2
        .replace(/<\/td>.*/is, '')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    );

    if (!ementa) continue;

    leis.push({ numero_lei, data_publicacao, ementa, url });
  }

  return leis;
}

const FETCH_HEADERS = {
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

    console.log(`Buscando texto completo (fetch direto): ${fullUrl}`);

    const response = await fetch(fullUrl, { headers: FETCH_HEADERS });

    if (!response.ok) {
      console.error(`Erro ao buscar ${fullUrl}: ${response.status}`);
      return '';
    }

    const html = await response.text();

    // Extract the main content body - look for the law text
    // Remove everything before the first Art. or CAPÍTULO or the law title
    let body = html;

    // Remove script/style tags
    body = body.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    body = body.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

    // Remove strikethrough content (revoked)
    body = body.replace(/<(?:strike|s|del)[^>]*>[\s\S]*?<\/(?:strike|s|del)>/gi, '');

    // Try to find the main content area
    const contentMatch = body.match(/<div[^>]*id="textoLei"[^>]*>([\s\S]*?)<\/div>/i)
      || body.match(/<div[^>]*class="textoLei"[^>]*>([\s\S]*?)<\/div>/i)
      || body.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

    if (contentMatch) {
      body = contentMatch[1];
    }

    // Convert <p>, <br> to newlines
    body = body.replace(/<\/p>/gi, '\n\n');
    body = body.replace(/<br\s*\/?>/gi, '\n');
    body = body.replace(/<\/div>/gi, '\n');

    // Remove all remaining HTML tags
    body = body.replace(/<[^>]+>/g, '');

    // Decode entities
    body = decodeHtmlEntities(body);

    // Clean up whitespace
    body = body
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n\n');

    // Remove navigation/header junk (lines before the actual law content)
    const lawStart = body.search(/(?:LEI\s+N[ºo°]|Presidência\s+da\s+República|O\s+PRESIDENTE\s+DA\s+REPÚBLICA)/i);
    if (lawStart > 0 && lawStart < 2000) {
      body = body.substring(lawStart);
    }

    return body.trim();
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

    const targetUrl = `https://www4.planalto.gov.br/legislacao/portal-legis/legislacao-1/leis-ordinarias/${ano}-leis-ordinarias`;
    console.log(`Buscando leis ordinárias de ${ano}: ${targetUrl}`);

    // Use Browserless /content endpoint
    const browserlessUrl = `https://production-sfo.browserless.io/content?token=${browserlessKey}`;
    const response = await fetch(browserlessUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: targetUrl,
        bestAttempt: true,
        gotoOptions: {
          waitUntil: "domcontentloaded",
          timeout: 15000,
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

    const leis = parseLeisOrdinarias(html);
    console.log(`Leis encontradas: ${leis.length}`);

    if (leis.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhuma lei encontrada no HTML", htmlPreview: html.substring(0, 3000) }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Reverse to ascending order (page comes descending)
    leis.reverse();

    // Fetch full text for each law (with delay to avoid rate limiting)
    console.log(`Buscando texto completo de ${leis.length} leis...`);
    const textos: string[] = [];
    for (let i = 0; i < leis.length; i++) {
      const lei = leis[i];
      if (lei.url) {
        const texto = await fetchTextoCompleto(lei.url);
        textos.push(texto);
        console.log(`Lei ${i + 1}/${leis.length}: ${lei.numero_lei} - ${texto.length} chars`);
        // Small delay between requests
        if (i < leis.length - 1) {
          await new Promise(r => setTimeout(r, 500));
        }
      } else {
        textos.push('');
      }
    }

    // Connect to Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Delete existing records for this year
    const { error: deleteError } = await supabase
      .from("leis_ordinarias")
      .delete()
      .eq("ano", ano);

    if (deleteError) {
      console.error("Erro ao deletar:", deleteError);
    }

    // Insert new records
    const records = leis.map((lei, index) => ({
      numero_lei: lei.numero_lei,
      data_publicacao: lei.data_publicacao,
      ementa: lei.ementa,
      url: lei.url,
      ano,
      ordem: index + 1,
      texto_completo: textos[index] || null,
    }));

    const batchSize = 100;
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

    console.log(`✅ ${inserted} leis ordinárias de ${ano} inseridas com texto completo`);

    return new Response(
      JSON.stringify({
        ano,
        totalLeis: leis.length,
        inserted,
        comTexto: textos.filter(t => t.length > 0).length,
        sample: leis.slice(0, 3).map((l, i) => ({ ...l, textoPreview: textos[i]?.substring(0, 200) })),
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
