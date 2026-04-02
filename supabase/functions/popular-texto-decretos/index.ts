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

    const response = await fetch(fullUrl, { headers: FETCH_HEADERS });

    if (!response.ok) {
      console.error(`Erro ao buscar ${fullUrl}: ${response.status}`);
      return '';
    }

    const rawBytes = new Uint8Array(await response.arrayBuffer());
    let html: string;
    try {
      html = new TextDecoder("utf-8", { fatal: true }).decode(rawBytes);
    } catch {
      html = new TextDecoder("windows-1252").decode(rawBytes);
    }
    html = html.normalize("NFC").replace(/\uFFFD/g, " ").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");

    let body = html;
    body = body.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    body = body.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    body = body.replace(/<(?:strike|s|del)[^>]*>[\s\S]*?<\/(?:strike|s|del)>/gi, '');

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

    const lawStart = body.search(/(?:Presidência\s+da\s+República|DECRETO\s+N[ºo°])/i);
    if (lawStart > 0 && lawStart < 2000) {
      body = body.substring(lawStart);
    }

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
    console.error(`Erro ao buscar texto: ${url}`, error);
    return '';
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { ano, limit, offset } = body as { ano?: number; limit?: number; offset?: number };

    if (!ano) {
      return new Response(
        JSON.stringify({ error: "Campo 'ano' é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const maxItems = limit || 20;
    const startOffset = offset || 0;

    const { data: decretos, error: fetchError } = await supabase
      .from("decretos")
      .select("id, numero_lei, url, texto_completo")
      .eq("ano", ano)
      .order("ordem", { ascending: true })
      .range(startOffset, startOffset + maxItems - 1);

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!decretos || decretos.length === 0) {
      return new Response(
        JSON.stringify({ message: "Nenhum decreto encontrado", ano }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Buscando texto completo de ${decretos.length} decretos de ${ano} (offset ${startOffset})...`);

    let updated = 0;
    const results: { decreto: string; chars: number }[] = [];

    for (const dec of decretos) {
      if (!dec.url) continue;

      if (dec.texto_completo && dec.texto_completo.length > 500) {
        console.log(`Pulando ${dec.numero_lei} - já tem texto (${dec.texto_completo.length} chars)`);
        results.push({ decreto: dec.numero_lei, chars: dec.texto_completo.length });
        continue;
      }

      const texto = await fetchTextoCompleto(dec.url);

      if (texto.length > 100) {
        const { error: updateError } = await supabase
          .from("decretos")
          .update({ texto_completo: texto })
          .eq("id", dec.id);

        if (!updateError) {
          updated++;
          results.push({ decreto: dec.numero_lei, chars: texto.length });
        } else {
          console.error(`Erro ao atualizar ${dec.numero_lei}:`, updateError);
        }
      } else {
        console.log(`Texto muito curto para ${dec.numero_lei}: ${texto.length} chars`);
        results.push({ decreto: dec.numero_lei, chars: texto.length });
      }

      await new Promise(r => setTimeout(r, 500));
    }

    return new Response(
      JSON.stringify({ ano, processed: decretos.length, updated, offset: startOffset, results }),
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