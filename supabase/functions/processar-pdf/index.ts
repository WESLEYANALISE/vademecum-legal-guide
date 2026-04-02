import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";
import {
  mergeCleanedPages,
  normalizeMarkdownPages,
  normalizeOcrMarkdown,
} from "./markdown-cleanup.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mistralApiKey = Deno.env.get("MISTRAL_API_KEY")!;
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY")!;

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const titulo = (formData.get("titulo") as string) || "Sem título";

    if (!file) {
      return new Response(JSON.stringify({ error: "Nenhum arquivo enviado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fileExt = file.name.split(".").pop() || "pdf";
    const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
    const fileBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("biblioteca")
      .upload(filePath, fileBuffer, { contentType: file.type || "application/pdf" });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Falha no upload do PDF" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: publicUrlData } = supabase.storage.from("biblioteca").getPublicUrl(filePath);
    const pdfPublicUrl = publicUrlData.publicUrl;

    const { data: livro, error: insertError } = await supabase
      .from("biblioteca_livros")
      .insert({
        user_id: user.id,
        titulo,
        status: "ocr",
        tamanho_bytes: file.size,
        conteudo: [],
        versao_processamento: 2,
      })
      .select("id")
      .single();

    if (insertError || !livro) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Falha ao criar registro" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // @ts-ignore
    EdgeRuntime.waitUntil(
      processPdfInBackground({
        supabaseUrl,
        supabaseServiceKey,
        mistralApiKey,
        geminiApiKey,
        pdfPublicUrl,
        userId: user.id,
        livroId: livro.id,
      })
    );

    return new Response(
      JSON.stringify({
        success: true,
        livro_id: livro.id,
        status: "processing",
        message: "Processamento iniciado",
      }),
      { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

interface ProcessPdfInBackgroundParams {
  supabaseUrl: string;
  supabaseServiceKey: string;
  mistralApiKey: string;
  geminiApiKey: string;
  pdfPublicUrl: string;
  userId: string;
  livroId: string;
}

async function markBookAsError(supabase: any, livroId: string, message: string) {
  await supabase
    .from("biblioteca_livros")
    .update({ status: "error", erro_detalhe: message.slice(0, 500) })
    .eq("id", livroId);
}

function buildOcrErrorMessage(errText: string) {
  let userMessage = `OCR: ${errText.slice(0, 500)}`;

  try {
    const errJson = JSON.parse(errText);
    if (errJson.type === "document_parser_too_many_pages" || String(errJson.code) === "3730") {
      userMessage = "O PDF tem mais de 1000 páginas, que é o limite máximo do OCR. Tente dividir o PDF em partes menores.";
    }
  } catch (_) {
    // ignore parse error
  }

  return userMessage;
}

async function processPdfInBackground({
  supabaseUrl,
  supabaseServiceKey,
  mistralApiKey,
  geminiApiKey,
  pdfPublicUrl,
  userId,
  livroId,
}: ProcessPdfInBackgroundParams) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log("Calling Mistral OCR for:", pdfPublicUrl);
    const ocrResponse = await fetch("https://api.mistral.ai/v1/ocr", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mistralApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral-ocr-latest",
        document: { type: "document_url", document_url: pdfPublicUrl },
        include_image_base64: true,
      }),
    });

    if (!ocrResponse.ok) {
      const errText = await ocrResponse.text();
      console.error("Mistral OCR error:", errText);
      await markBookAsError(supabase, livroId, buildOcrErrorMessage(errText));
      return;
    }

    const ocrData = await ocrResponse.json();
    const ocrPages = ocrData.pages || [];

    const conteudo: { pagina: number; markdown: string }[] = [];
    const imagensToInsert: { livro_id: string; pagina: number; url: string; alt_text: string }[] = [];

    for (let i = 0; i < ocrPages.length; i++) {
      const page = ocrPages[i];
      let markdown = page.markdown || "";

      if (page.images && page.images.length > 0) {
        for (const img of page.images) {
          if (img.image_base64) {
            const imgId = crypto.randomUUID();
            const imgPath = `${userId}/${livroId}/img_${i}_${imgId}.png`;
            const base64Data = img.image_base64.replace(/^data:image\/\w+;base64,/, "");
            const binaryStr = atob(base64Data);
            const bytes = new Uint8Array(binaryStr.length);
            for (let j = 0; j < binaryStr.length; j++) {
              bytes[j] = binaryStr.charCodeAt(j);
            }

            const { error: imgUploadErr } = await supabase.storage
              .from("biblioteca")
              .upload(imgPath, bytes.buffer, { contentType: "image/png" });

            if (!imgUploadErr) {
              const { data: imgUrlData } = supabase.storage.from("biblioteca").getPublicUrl(imgPath);
              if (img.id && markdown.includes(img.id)) {
                markdown = markdown.replace(
                  new RegExp(`!\\[.*?\\]\\(${img.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)`, "g"),
                  `![Imagem](${imgUrlData.publicUrl})`
                );
              }
              imagensToInsert.push({
                livro_id: livroId,
                pagina: i + 1,
                url: imgUrlData.publicUrl,
                alt_text: img.id || `Imagem página ${i + 1}`,
              });
            }
          }
        }
      }

      conteudo.push({ pagina: i + 1, markdown: normalizeOcrMarkdown(markdown) });
    }

    if (imagensToInsert.length > 0) {
      await supabase.from("biblioteca_imagens").insert(imagensToInsert);
    }

    let capaUrl: string | null = null;
    try {
      capaUrl = await fetchAmazonCover(geminiApiKey, conteudo, supabase, userId, livroId);
    } catch (e) {
      console.warn("Amazon cover fetch failed, using first page image:", e);
    }

    if (!capaUrl) {
      const firstPageImages = imagensToInsert.filter((img) => img.pagina === 1);
      if (firstPageImages.length > 0) {
        capaUrl = firstPageImages[0].url;
      }
    }

    await supabase
      .from("biblioteca_livros")
      .update({
        conteudo,
        total_paginas: ocrPages.length,
        status: "structuring",
        ...(capaUrl ? { capa_url: capaUrl } : {}),
      })
      .eq("id", livroId);

    console.log("Calling Gemini to structure chapters...");
    const estruturaLeitura = await structureWithGemini(geminiApiKey, conteudo, ocrPages.length);

    await supabase
      .from("biblioteca_livros")
      .update({
        estrutura_leitura: estruturaLeitura,
        total_paginas: ocrPages.length,
      })
      .eq("id", livroId);

    console.log("Formatting markdown with Gemini...");
    const totalPagesAll = estruturaLeitura.chapters.reduce(
      (acc: number, ch: GeminiChapter) => acc + (ch.pages?.length || 0), 0
    );
    let pagesProcessed = 0;

    await supabase
      .from("biblioteca_livros")
      .update({ status: "cleaning:0" })
      .eq("id", livroId);

    for (let ci = 0; ci < estruturaLeitura.chapters.length; ci++) {
      const ch = estruturaLeitura.chapters[ci];
      if (!ch.pages || ch.pages.length === 0) continue;

      const BATCH_SIZE = 6;
      const MAX_MD_CHARS = 6000;
      const cleanedPages: { source_page: number; markdown: string }[] = [];

      for (let bi = 0; bi < ch.pages.length; bi += BATCH_SIZE) {
        const batch = ch.pages.slice(bi, bi + BATCH_SIZE).map((p) => ({
          source_page: p.source_page,
          markdown: p.markdown.slice(0, MAX_MD_CHARS),
        }));
        const cleaned = await cleanChapterMarkdown(geminiApiKey, batch);
        cleanedPages.push(...cleaned);

        pagesProcessed += batch.length;
        const pct = totalPagesAll > 0
          ? Math.min(Math.round((pagesProcessed / totalPagesAll) * 100), 99)
          : 99;
        await supabase
          .from("biblioteca_livros")
          .update({ status: `cleaning:${pct}` })
          .eq("id", livroId);
      }

      estruturaLeitura.chapters[ci].pages = cleanedPages;
    }

    const { error: updateError } = await supabase
      .from("biblioteca_livros")
      .update({
        estrutura_leitura: estruturaLeitura,
        versao_processamento: 2,
        total_paginas: ocrPages.length,
        status: "ready",
      })
      .eq("id", livroId);

    if (updateError) {
      console.error("Update error:", updateError);
      await markBookAsError(supabase, livroId, updateError.message);
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Background processing error:", errorMessage);
    await markBookAsError(supabase, livroId, errorMessage);
  }
}

// ── Gemini structuring ──────────────────────────────────────────────

interface GeminiChapter {
  title: string;
  start_source_page: number;
  end_source_page: number;
  pages: { source_page: number; markdown: string }[];
}

interface EstruturaLeitura {
  version: number;
  title: string;
  content_start_page?: number;
  skip_pages?: number[];
  chapters: GeminiChapter[];
}

async function structureWithGemini(
  apiKey: string,
  conteudo: { pagina: number; markdown: string }[],
  totalPages: number
): Promise<EstruturaLeitura> {
  // Build a condensed version for Gemini (first 150 chars per page for mapping, full for small books)
  const isLargeBook = totalPages > 60;

  let pagesPayload: string;
  if (isLargeBook) {
    // For large books: send summaries first, then structure
    const summaries = conteudo.map(p =>
      `--- Página ${p.pagina} ---\n${p.markdown.slice(0, 200)}`
    ).join("\n\n");
    pagesPayload = summaries;
  } else {
    pagesPayload = conteudo.map(p =>
      `--- Página ${p.pagina} ---\n${p.markdown}`
    ).join("\n\n");
  }

  const prompt = `Você é um organizador de livros digitais. Recebeu o conteúdo OCR de um PDF com ${totalPages} páginas.

TAREFA:
1. Identifique o SUMÁRIO/ÍNDICE do livro (geralmente nas primeiras páginas)
2. Use o sumário como referência principal para identificar os capítulos E subcapítulos/seções
3. Confirme onde cada capítulo/seção realmente começa no conteúdo
4. Organize TODAS as ${totalPages} páginas em capítulos, sem pular nenhuma
5. Identifique páginas DESCARTÁVEIS e a página onde o conteúdo principal começa

REGRAS IMPORTANTES:
- TODAS as páginas de 1 a ${totalPages} devem estar cobertas (sem buracos nem sobreposições)
- Páginas iniciais antes do primeiro capítulo devem ir em um capítulo "Páginas Iniciais" ou "Capa / Folha de Rosto"
- Preserve a ordem original das páginas
- Os títulos dos capítulos devem seguir EXATAMENTE o que está no sumário do livro
- IMPORTANTE: Inclua TAMBÉM subtítulos e seções internas como capítulos separados. Por exemplo, se dentro de um capítulo há seções como "Os fatos", "O julgamento e os votos", "Conclusão", cada uma deve ser um capítulo próprio
- Use TODOS os níveis de divisão encontrados no sumário: capítulos, subcapítulos, seções, subseções
- NÃO reescreva o conteúdo, apenas organize
- Se não encontrar sumário, divida por títulos/headings visíveis no texto (incluindo subtítulos em negrito ou caixa alta)

PÁGINAS DESCARTÁVEIS (skip_pages):
Marque como descartáveis páginas que contêm APENAS:
- Avisos de copyright/direitos autorais
- Avisos contra pirataria
- Página em branco ou quase vazia
- Folha de rosto repetida
- Ficha catalográfica / CIP
- Biografia do autor (na contracapa ou páginas iniciais)
- Agradecimentos
- Dedicatórias

NÃO marque como descartáveis: sumário, prefácio, introdução, apresentação, capítulos reais.

CONTENT_START_PAGE: número da página onde começa o primeiro conteúdo real do livro (após sumário, dedicatórias, etc). Geralmente é o primeiro capítulo ou a introdução.

Retorne APENAS um JSON válido com esta estrutura:
{
  "version": 2,
  "title": "Título do livro",
  "content_start_page": 15,
  "skip_pages": [1, 2, 3, 4],
  "chapters": [
    {
      "title": "Nome do capítulo",
      "start_source_page": 1,
      "end_source_page": 5
    }
  ]
}

CONTEÚDO DO LIVRO:
${pagesPayload}`;

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(geminiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Gemini error:", errText);
    return buildFallbackStructure(conteudo, totalPages);
  }

  const geminiData = await response.json();
  let rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

  // Sanitize code fences
  rawText = rawText.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

  try {
    const parsed = JSON.parse(rawText) as EstruturaLeitura & { skip_pages?: number[]; content_start_page?: number };

    // Validate: all pages covered
    if (!parsed.chapters || parsed.chapters.length === 0) {
      console.warn("Gemini returned no chapters, using fallback");
      return buildFallbackStructure(conteudo, totalPages);
    }

    const skipSet = new Set(parsed.skip_pages || []);
    console.log(`Gemini skip_pages: ${parsed.skip_pages?.length || 0}, content_start_page: ${parsed.content_start_page || 'N/A'}`);

    // Populate pages within each chapter, clearing skipped pages
    const result: EstruturaLeitura = {
      version: 2,
      title: parsed.title || "Livro",
      content_start_page: parsed.content_start_page,
      skip_pages: parsed.skip_pages,
      chapters: parsed.chapters.map(ch => ({
        title: ch.title,
        start_source_page: ch.start_source_page,
        end_source_page: ch.end_source_page,
        pages: conteudo
          .filter(p => p.pagina >= ch.start_source_page && p.pagina <= ch.end_source_page)
          .map(p => ({
            source_page: p.pagina,
            markdown: skipSet.has(p.pagina) ? '' : p.markdown,
          })),
      })),
    };

    // Validate coverage
    const coveredPages = new Set<number>();
    for (const ch of result.chapters) {
      for (let p = ch.start_source_page; p <= ch.end_source_page; p++) {
        coveredPages.add(p);
      }
    }

    const missingPages: number[] = [];
    for (let p = 1; p <= totalPages; p++) {
      if (!coveredPages.has(p)) missingPages.push(p);
    }

    if (missingPages.length > 0) {
      console.warn(`Gemini missed ${missingPages.length} pages, appending to last chapter`);
      // Add missing pages to last chapter or create an extra one
      const missingContent = conteudo.filter(c => missingPages.includes(c.pagina));
      if (result.chapters.length > 0) {
        const lastCh = result.chapters[result.chapters.length - 1];
        lastCh.end_source_page = Math.max(lastCh.end_source_page, ...missingPages);
        lastCh.pages.push(...missingContent.map(p => ({ source_page: p.pagina, markdown: p.markdown })));
        lastCh.pages.sort((a, b) => a.source_page - b.source_page);
      }
    }

    return result;
  } catch (parseErr) {
    console.error("Failed to parse Gemini JSON:", parseErr, "Raw:", rawText.slice(0, 500));
    return buildFallbackStructure(conteudo, totalPages);
  }
}

async function cleanChapterMarkdown(
  apiKey: string,
  pages: { source_page: number; markdown: string }[]
): Promise<{ source_page: number; markdown: string }[]> {
  const normalizedPages = normalizeMarkdownPages(pages);

  const pagesText = normalizedPages
    .map((p) => `--- Página ${p.source_page} ---\n${p.markdown}`)
    .join("\n\n");

  const prompt = `Você é um editor profissional de livros. Recebeu páginas de um livro extraídas por OCR que precisam de formatação hierárquica rica em Markdown.

TAREFA: Leia cada página cuidadosamente e reformate com hierarquia visual clara.

FORMATAÇÃO OBRIGATÓRIA:
- Use ## para títulos de capítulo e seções principais
- Use ### para subtítulos e subseções
- Use **negrito** para: termos importantes, conceitos-chave, nomes próprios, nomes de autores, e qualquer texto que esteja em CAIXA ALTA no original
- Use listas numeradas (1. 2. 3.) quando houver enumerações no texto
- Use listas com marcadores (- item) quando houver itens sem ordem
- Separe parágrafos com uma linha em branco entre eles
- Citações devem usar > (blockquote)

LIMPEZA:
- Remova números de página soltos (ex: "1.", "23", "— 5 —")
- Em sumário/índice: cada entrada em sua própria linha, nunca marcadores soltos
- Junte palavras hifenizadas por quebra de linha (ex: "consti-tuição" → "constituição")
- Corrija espaçamentos irregulares do OCR

PROIBIÇÕES:
- NÃO invente, resuma ou altere o conteúdo textual
- NÃO remova nem altere imagens: mantenha ![...](...) intactas
- NÃO adicione conteúdo que não existe no original

Retorne APENAS um JSON válido: array de objetos com "source_page" (número) e "markdown" (string formatada).

PÁGINAS:
${pagesText}`;

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: 8192,
          temperature: 0.1,
        },
      }),
    });

    if (!response.ok) {
      console.error("Gemini clean error:", await response.text());
      return normalizedPages;
    }

    const data = await response.json();
    let rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    rawText = rawText.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

    const parsed = JSON.parse(rawText) as { source_page: number; markdown: string }[];

    if (!Array.isArray(parsed) || parsed.length === 0) {
      console.warn("Gemini clean returned empty, using originals");
      return normalizedPages;
    }

    return mergeCleanedPages(normalizedPages, parsed);
  } catch (err) {
    console.error("cleanChapterMarkdown error:", err);
    return normalizedPages;
  }
}

function buildFallbackStructure(
  conteudo: { pagina: number; markdown: string }[],
  totalPages: number
): EstruturaLeitura {
  return {
    version: 2,
    title: "Livro",
    chapters: [{
      title: "Conteúdo",
      start_source_page: 1,
      end_source_page: totalPages,
      pages: conteudo.map(p => ({ source_page: p.pagina, markdown: p.markdown })),
    }],
  };
}

// ── Amazon Cover Fetch ──────────────────────────────────────────────

async function fetchAmazonCover(
  geminiApiKey: string,
  conteudo: { pagina: number; markdown: string }[],
  supabase: any,
  userId: string,
  livroId: string
): Promise<string | null> {
  // 1. Use Gemini to extract exact title + author from first pages
  const firstPages = conteudo.slice(0, 5).map(p => p.markdown).join("\n\n");
  const extractPrompt = `Extraia o TÍTULO EXATO e o AUTOR do livro a partir destas primeiras páginas de OCR. Retorne JSON: {"title":"...","author":"..."}. Se não encontrar autor, retorne author como string vazia.\n\nPÁGINAS:\n${firstPages.slice(0, 3000)}`;

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
  const extractRes = await fetch(geminiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: extractPrompt }] }],
      generationConfig: { responseMimeType: "application/json", maxOutputTokens: 256 },
    }),
  });

  if (!extractRes.ok) return null;
  const extractData = await extractRes.json();
  let rawExtract = extractData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  rawExtract = rawExtract.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

  let bookTitle = "";
  let bookAuthor = "";
  try {
    const info = JSON.parse(rawExtract);
    bookTitle = info.title || "";
    bookAuthor = info.author || "";
  } catch {
    return null;
  }

  if (!bookTitle) return null;
  console.log(`Amazon cover search: "${bookTitle}" by "${bookAuthor}"`);

  // 2. Search Amazon.com.br
  const query = encodeURIComponent(`${bookTitle} ${bookAuthor}`.trim());
  const amazonUrl = `https://www.amazon.com.br/s?k=${query}&i=stripbooks`;

  const amazonRes = await fetch(amazonUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      "Accept": "text/html,application/xhtml+xml",
    },
  });

  if (!amazonRes.ok) {
    console.warn("Amazon search failed:", amazonRes.status);
    return null;
  }

  const html = await amazonRes.text();

  // 3. Extract first product image (s-image class)
  const imgMatch = html.match(/class="s-image"[^>]*src="([^"]+)"/);
  if (!imgMatch?.[1]) {
    // Try alternative pattern
    const altMatch = html.match(/src="(https:\/\/m\.media-amazon\.com\/images\/[^"]+)"/);
    if (!altMatch?.[1]) {
      console.warn("No Amazon cover image found");
      return null;
    }
    return await downloadAndUploadCover(altMatch[1], supabase, userId, livroId);
  }

  return await downloadAndUploadCover(imgMatch[1], supabase, userId, livroId);
}

async function downloadAndUploadCover(
  imageUrl: string,
  supabase: any,
  userId: string,
  livroId: string
): Promise<string | null> {
  try {
    // Get higher resolution version (replace size in Amazon URL)
    const hiResUrl = imageUrl.replace(/\._[^.]+_\./, "._SL500_.");

    const imgRes = await fetch(hiResUrl);
    if (!imgRes.ok) return null;

    const imgBuffer = await imgRes.arrayBuffer();
    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    const ext = contentType.includes("png") ? "png" : "jpg";
    const coverPath = `${userId}/${livroId}/cover.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("biblioteca")
      .upload(coverPath, imgBuffer, { contentType, upsert: true });

    if (uploadErr) {
      console.warn("Cover upload failed:", uploadErr);
      return null;
    }

    const { data } = supabase.storage.from("biblioteca").getPublicUrl(coverPath);
    console.log("Amazon cover uploaded:", data.publicUrl);
    return data.publicUrl;
  } catch (e) {
    console.warn("Cover download error:", e);
    return null;
  }
}
