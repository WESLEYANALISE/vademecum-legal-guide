import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

async function fetchViaProxy(url: string): Promise<string> {
  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
    });
    if (resp.ok) {
      const text = await resp.text();
      if (text.length > 500) return text;
    }
  } catch (e) {
    console.log(`Direct fetch failed: ${e}`);
  }

  try {
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const resp = await fetch(proxyUrl);
    if (resp.ok) {
      const text = await resp.text();
      if (text.length > 500) return text;
    }
  } catch (e) {
    console.log(`corsproxy failed: ${e}`);
  }

  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const resp = await fetch(proxyUrl);
    if (resp.ok) {
      const text = await resp.text();
      if (text.length > 500) return text;
    }
  } catch (e) {
    console.log(`allorigins failed: ${e}`);
  }

  return '';
}

function cleanDouHtml(html: string): string {
  let body = html;
  body = body.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  body = body.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  const textoMatch = body.match(/<div\s+class="texto-dou">([\s\S]*?)<\/div>\s*(?:<\/div>|<div\s+class)/i);
  if (textoMatch) body = textoMatch[1];

  body = body.replace(/<\/p>/gi, '\n\n');
  body = body.replace(/<br\s*\/?>/gi, '\n');
  body = body.replace(/<\/div>/gi, '\n');
  body = body.replace(/<[^>]+>/g, '');
  body = decodeHtmlEntities(body);
  body = body.split('\n').map(l => l.trim()).filter(l => l.length > 0).join('\n');
  return body.trim();
}

function cleanPlanaltoHtml(rawBytes: Uint8Array): string {
  let body: string;
  try {
    body = new TextDecoder("utf-8", { fatal: true }).decode(rawBytes);
  } catch {
    body = new TextDecoder("windows-1252").decode(rawBytes);
  }
  body = body.normalize("NFC")
    .replace(/\uFFFD/g, " ")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  body = body.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  body = body.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  body = body.replace(/<(?:strike|s|del)[^>]*>[\s\S]*?<\/(?:strike|s|del)>/gi, '');

  const bodyMatch = body.match(/<body[^>]*>([\s\S]+)<\/body>/i);
  if (bodyMatch) body = bodyMatch[1];

  body = body.replace(/<blockquote[^>]*>/gi, '');
  body = body.replace(/<\/blockquote>/gi, '');
  body = body.replace(/<\/p>/gi, '\n\n');
  body = body.replace(/<br\s*\/?>/gi, '\n');
  body = body.replace(/<\/div>/gi, '\n');
  body = body.replace(/<\/tr>/gi, '\n');
  body = body.replace(/<[^>]+>/g, '');
  body = decodeHtmlEntities(body);

  body = body.split('\n').map(l => l.trim()).filter(l => l.length > 0).join('\n');

  const lawStart = body.search(/(?:Presidência\s+da\s+República|LEI\s+N[ºo°]|DECRETO\s+N[ºo°]|MEDIDA\s+PROVISÓRIA)/i);
  if (lawStart > 0 && lawStart < 2000) body = body.substring(lawStart);

  const dontSub = body.search(/Este texto não substitui/i);
  if (dontSub > 0) {
    const nl = body.indexOf('\n', dontSub);
    if (nl > 0) body = body.substring(0, nl);
  }

  return body.replace(/[\s*]+$/, '').trim();
}

function buildPlanaltoUrl(numeroAto: string): string | null {
  const decretoMatch = numeroAto.match(/DECRETO\s+N[ºo°]\s+([\d.]+)/i);
  if (decretoMatch) {
    const num = decretoMatch[1].replace(/\./g, '');
    return `https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/Decreto/D${num}.htm`;
  }

  const leiMatch = numeroAto.match(/LEI\s+N[ºo°]\s+([\d.]+)/i);
  if (leiMatch) {
    const num = leiMatch[1].replace(/\./g, '');
    return `https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/Lei/L${num}.htm`;
  }

  const lcMatch = numeroAto.match(/LEI\s+COMPLEMENTAR\s+N[ºo°]\s+([\d.]+)/i);
  if (lcMatch) {
    const num = lcMatch[1].replace(/\./g, '');
    return `https://www.planalto.gov.br/ccivil_03/LEIS/LCP/Lcp${num}.htm`;
  }

  const mpMatch = numeroAto.match(/MEDIDA\s+PROVIS[OÓ]RIA\s+N[ºo°]\s+([\d.]+)/i);
  if (mpMatch) {
    const num = mpMatch[1].replace(/\./g, '');
    return `https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/Mpv/mpv${num}.htm`;
  }

  return null;
}

async function fetchTextoCompleto(url: string, numeroAto: string): Promise<string> {
  try {
    if (/in\.gov\.br/i.test(url)) {
      const planaltoUrl = buildPlanaltoUrl(numeroAto);
      if (planaltoUrl) {
        console.log(`Mapped DOU → Planalto: ${planaltoUrl}`);
        const response = await fetch(planaltoUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; LegalBot/1.0)" },
        });
        if (response.ok) {
          const rawBytes = new Uint8Array(await response.arrayBuffer());
          const texto = cleanPlanaltoHtml(rawBytes);
          if (texto.length > 100) return texto;
        }
        console.log(`Planalto URL not available yet, trying proxy for DOU...`);
      }

      const html = await fetchViaProxy(url);
      if (html) return cleanDouHtml(html);
      return '';
    }

    let fullUrl = url;
    if (url.startsWith('/')) fullUrl = `https://www.planalto.gov.br${url}`;
    else if (!url.startsWith('http')) fullUrl = `https://www.planalto.gov.br/${url}`;
    fullUrl = fullUrl.replace(/^http:/, 'https:');

    console.log(`Buscando texto Planalto: ${fullUrl}`);

    const response = await fetch(fullUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LegalBot/1.0)" },
    });

    if (!response.ok) {
      console.error(`Erro ${response.status} ao buscar ${fullUrl}`);
      return '';
    }

    const rawBytes = new Uint8Array(await response.arrayBuffer());
    return cleanPlanaltoHtml(rawBytes);
  } catch (error) {
    console.error(`Erro ao buscar texto: ${url}`, error);
    return '';
  }
}

// ── Gemini explanation generator ──

async function gerarExplicacao(ementa: string, textoCompleto: string, geminiKey: string): Promise<string> {
  const textoTruncado = textoCompleto.length > 12000 ? textoCompleto.substring(0, 12000) + '...' : textoCompleto;

  const prompt = `Você é um professor de Direito brasileiro. Gere uma explicação didática e acessível sobre esta lei/decreto.

**Ementa:** ${ementa}

**Texto da lei:**
${textoTruncado}

Sua explicação deve conter:
1. **Resumo**: O que a lei/decreto faz em 2-3 frases simples
2. **O que muda**: Principais mudanças ou determinações
3. **Quem é afetado**: Grupos ou setores impactados
4. **Impacto prático**: Consequências no dia a dia

Use linguagem acessível, evite jargão excessivo. Formato em Markdown com títulos ##.`;

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 2048, temperature: 0.4 },
      }),
    }
  );

  if (!resp.ok) {
    const err = await resp.text();
    console.error(`Gemini error ${resp.status}: ${err}`);
    return '';
  }

  const data = await resp.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// Parse articles from the full law text
function parseArtigos(texto: string): { numero: string; textoArt: string }[] {
  const artigos: { numero: string; textoArt: string }[] = [];
  const lines = texto.split('\n');
  let currentArt: { numero: string; lines: string[] } | null = null;
  const artPattern = /^Art\.\s*(\d+[ºª°]?(?:-[A-Z])?)/i;

  for (const line of lines) {
    const m = line.match(artPattern);
    if (m) {
      if (currentArt) {
        artigos.push({ numero: `Art. ${currentArt.numero}`, textoArt: currentArt.lines.join('\n') });
      }
      currentArt = { numero: m[1], lines: [line] };
    } else if (currentArt) {
      currentArt.lines.push(line);
    }
  }
  if (currentArt) {
    artigos.push({ numero: `Art. ${currentArt.numero}`, textoArt: currentArt.lines.join('\n') });
  }
  return artigos;
}

// Generate per-article explanations and cache them
async function gerarExplicacoesArtigos(
  leiId: string, texto: string, ementa: string, geminiKey: string, supabase: any
) {
  const artigos = parseArtigos(texto);
  if (artigos.length === 0 || artigos.length > 15) return; // skip if too many

  const tabelaNome = `resenha_${leiId}`;
  console.log(`Gerando explicações para ${artigos.length} artigos de ${tabelaNome}...`);

  for (const art of artigos) {
    // Check if already cached
    const { data: existing } = await supabase
      .from('artigo_ai_cache')
      .select('id')
      .eq('tabela_nome', tabelaNome)
      .eq('artigo_numero', art.numero)
      .eq('modo', 'explicacao')
      .maybeSingle();

    if (existing) continue;

    const prompt = `Você é um professor de Direito brasileiro explicando para um aluno. Explique de forma didática e acessível o seguinte artigo de lei.

**Contexto da lei:** ${ementa}

**${art.numero}:**
${art.textoArt}

Explique:
- O que este artigo determina
- Termos jurídicos importantes
- Impacto prático

Use linguagem simples e amigável, como se estivesse batendo um papo com o aluno. Formato em Markdown.`;

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 1500, temperature: 0.4 },
        }),
      }
    );

    if (resp.ok) {
      const data = await resp.json();
      const conteudo = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (conteudo.length > 50) {
        await supabase.from('artigo_ai_cache').upsert({
          tabela_nome: tabelaNome,
          artigo_numero: art.numero,
          modo: 'explicacao',
          conteudo,
        }, { onConflict: 'tabela_nome,artigo_numero,modo' });
      }
    }

    await new Promise(r => setTimeout(r, 1500));
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiKey = Deno.env.get("GEMINI_API_KEY") || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const limit = (body as any).limit || 20;
    const forceRefresh = (body as any).force === true;
    const onlyExplicacao = (body as any).only_explicacao === true;

    // Mode 1: only generate explanations for items that already have texto_completo
    if (onlyExplicacao) {
      if (!geminiKey) {
        return new Response(
          JSON.stringify({ error: "GEMINI_API_KEY not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: pendingItems, error: pErr } = await supabase
        .from("resenha_diaria")
        .select("id, numero_ato, ementa, texto_completo")
        .not("texto_completo", "is", null)
        .is("explicacao", null)
        .order("data_dou", { ascending: false })
        .limit(limit);

      if (pErr) throw pErr;
      if (!pendingItems || pendingItems.length === 0) {
        return new Response(
          JSON.stringify({ message: "Todas as leis já possuem explicação" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Gerando explicações para ${pendingItems.length} atos...`);
      let generated = 0;

      for (const item of pendingItems) {
        const explicacao = await gerarExplicacao(item.ementa, item.texto_completo, geminiKey);
        if (explicacao.length > 50) {
          const { error: uErr } = await supabase
            .from("resenha_diaria")
            .update({ explicacao })
            .eq("id", item.id);
          if (!uErr) generated++;
          else console.error(`Erro update explicacao ${item.numero_ato}:`, uErr);
        }
        await new Promise(r => setTimeout(r, 1500));
      }

      return new Response(
        JSON.stringify({ processed: pendingItems.length, generated }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mode 2: fetch texto_completo + generate explicacao
    let query = supabase
      .from("resenha_diaria")
      .select("id, numero_ato, ementa, url")
      .order("data_dou", { ascending: false })
      .limit(limit);

    if (!forceRefresh) {
      query = query.is("texto_completo", null);
    }

    const { data: items, error: fetchError } = await query;
    if (fetchError) throw fetchError;

    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ message: "Todos os atos já possuem texto completo" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Buscando texto de ${items.length} atos...`);
    let updated = 0;
    const results: { ato: string; chars: number; explicacao: boolean }[] = [];

    for (const item of items) {
      if (!item.url) continue;

      const texto = await fetchTextoCompleto(item.url, item.numero_ato);

        if (texto.length > 100) {
        const updateData: Record<string, string> = { texto_completo: texto };

        // Generate explanation if Gemini key is available
        if (geminiKey) {
          const explicacao = await gerarExplicacao(item.ementa, texto, geminiKey);
          if (explicacao.length > 50) {
            updateData.explicacao = explicacao;
          }
        }

        const { error: updateError } = await supabase
          .from("resenha_diaria")
          .update(updateData)
          .eq("id", item.id);

        if (!updateError) {
          updated++;
          results.push({ ato: item.numero_ato, chars: texto.length, explicacao: !!updateData.explicacao });

          // Pre-generate per-article explanations and cache in artigo_ai_cache
          if (geminiKey) {
            await gerarExplicacoesArtigos(item.id, texto, item.ementa, geminiKey, supabase);
          }
        } else {
          console.error(`Erro update ${item.numero_ato}:`, updateError);
        }
      } else {
        console.log(`Texto curto para ${item.numero_ato}: ${texto.length}`);
        results.push({ ato: item.numero_ato, chars: texto.length, explicacao: false });
      }

      await new Promise(r => setTimeout(r, 200));
    }

    return new Response(
      JSON.stringify({ processed: items.length, updated, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
