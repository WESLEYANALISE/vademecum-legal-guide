import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OcrImage { id: string; image_base64: string; }
interface OcrPage { markdown: string; images?: OcrImage[]; }

async function addLog(
  supabase: ReturnType<typeof createClient>,
  simuladoId: string,
  etapa: string,
  detalhe: string,
  questaoNumero?: number,
  imageUrl?: string,
) {
  await supabase.from("simulado_process_logs").insert({
    simulado_id: simuladoId,
    etapa,
    detalhe,
    questao_numero: questaoNumero ?? null,
    image_url: imageUrl ?? null,
  });
}

async function ocrPdf(
  arrayBuf: ArrayBuffer,
  fileName: string,
  mistralKey: string,
): Promise<{ text: string; images: Map<string, string> }> {
  const fd = new FormData();
  fd.append("file", new Blob([arrayBuf], { type: "application/pdf" }), fileName);
  fd.append("purpose", "ocr");
  const uploadRes = await fetch("https://api.mistral.ai/v1/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${mistralKey}` },
    body: fd,
  });
  const uploadJson = await uploadRes.json();
  if (!uploadJson.id) throw new Error(JSON.stringify(uploadJson));

  const ocrRes = await fetch("https://api.mistral.ai/v1/ocr", {
    method: "POST",
    headers: { Authorization: `Bearer ${mistralKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "mistral-ocr-latest",
      document: { type: "file", file_id: uploadJson.id },
      include_image_base64: true,
    }),
  });
  const ocrJson = await ocrRes.json();
  if (!ocrJson.pages) throw new Error(JSON.stringify(ocrJson));

  const images = new Map<string, string>();
  const text = (ocrJson.pages as OcrPage[])
    .map((p, i) => {
      if (p.images) {
        for (const img of p.images) {
          images.set(img.id, img.image_base64);
        }
      }
      return `--- Página ${i + 1} ---\n${p.markdown}`;
    })
    .join("\n\n");

  return { text, images };
}

async function saveImageToStorage(
  supabase: ReturnType<typeof createClient>,
  base64: string,
  path: string,
): Promise<string> {
  const raw = base64.includes(",") ? base64.split(",")[1] : base64;
  const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
  await supabase.storage.from("biblioteca").upload(path, bytes, {
    contentType: "image/png",
    upsert: true,
  });
  const { data } = supabase.storage.from("biblioteca").getPublicUrl(path);
  return data.publicUrl;
}

// ---- PHASE 1: OCR + metadata + save images ----
async function phaseOcr(
  supabase: ReturnType<typeof createClient>,
  simuladoId: string,
  provaArrayBuf: ArrayBuffer,
  provaFileName: string,
  gabArrayBuf: ArrayBuffer,
  gabFileName: string,
  mistralKey: string,
  geminiKey: string,
) {
  // 1. OCR Prova
  await addLog(supabase, simuladoId, "ocr_prova", "Iniciando OCR da prova...");
  const ocrProva = await ocrPdf(provaArrayBuf, provaFileName, mistralKey);
  await addLog(supabase, simuladoId, "ocr_prova",
    `OCR da prova concluído (${ocrProva.text.length} chars, ${ocrProva.images.size} imagens)`);

  // 2. OCR Gabarito
  await addLog(supabase, simuladoId, "ocr_gabarito", "Iniciando OCR do gabarito...");
  const gabResult = await ocrPdf(gabArrayBuf, gabFileName, mistralKey);
  await addLog(supabase, simuladoId, "ocr_gabarito", "OCR do gabarito concluído");

  // 3. Save images
  const imageUrlMap: Record<string, string> = {};
  if (ocrProva.images.size > 0) {
    await addLog(supabase, simuladoId, "imagem_pagina",
      `Salvando ${ocrProva.images.size} imagens no Storage...`);
    let imgIdx = 0;
    for (const [imgId, base64] of ocrProva.images) {
      try {
        const path = `simulados/${simuladoId}/img_${imgIdx}.png`;
        const publicUrl = await saveImageToStorage(supabase, base64, path);
        imageUrlMap[imgId] = publicUrl;
        imgIdx++;
      } catch (e) {
        console.error("Erro ao salvar imagem:", imgId, (e as Error).message);
      }
    }
    await addLog(supabase, simuladoId, "imagem_pagina",
      `${Object.keys(imageUrlMap).length} imagens salvas`);
  }

  // 4. Metadata via Gemini
  await addLog(supabase, simuladoId, "gemini", "Identificando metadados da prova...");
  const metaPrompt = `Analise o conteúdo OCR desta prova e gabarito. Retorne APENAS JSON:
{
  "metadados": { "titulo": "", "tipo_prova": "", "banca": "", "ano": 0, "orgao": "" },
  "total_questoes": 80
}
Identifique: titulo completo da prova, tipo (OAB, Delegado, etc), banca, ano, órgão, e número total de questões.

=== PROVA (primeiros 8000 chars) ===
${ocrProva.text.substring(0, 8000)}

=== GABARITO ===
${gabResult.text.substring(0, 20000)}`;

  const metaRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: metaPrompt }] }],
        generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
      }),
    },
  );
  if (!metaRes.ok) throw new Error(`Gemini meta HTTP ${metaRes.status}`);
  const metaJson = await metaRes.json();
  const metaText = metaJson.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!metaText) throw new Error("Gemini não retornou metadados");
  const metaParsed = JSON.parse(metaText);
  const totalQ = metaParsed.total_questoes || 80;
  const meta = metaParsed.metadados;

  const titulo = meta.titulo ||
    `${meta.tipo_prova || "Simulado"} ${meta.banca || ""} ${meta.ano || ""}`.trim();

  await addLog(supabase, simuladoId, "gemini",
    `Prova: ${titulo} — ${totalQ} questões detectadas`);

  // 5. Persist OCR text + metadata so next calls can use it
  await supabase.from("simulados").update({
    titulo,
    tipo_prova: meta.tipo_prova || null,
    banca: meta.banca || null,
    ano: meta.ano || null,
    orgao: meta.orgao || null,
    total_questoes: totalQ,
    ocr_prova_text: ocrProva.text,
    ocr_gabarito_text: gabResult.text,
    imagem_urls: imageUrlMap,
    questao_offset: 0,
  }).eq("id", simuladoId);

  return totalQ;
}

// ---- PHASE 2: Extract one batch of questions ----
async function phaseBatch(
  supabase: ReturnType<typeof createClient>,
  simuladoId: string,
  geminiKey: string,
) {
  const { data: sim } = await supabase
    .from("simulados")
    .select("ocr_prova_text, ocr_gabarito_text, imagem_urls, questao_offset, total_questoes")
    .eq("id", simuladoId)
    .single();

  if (!sim || !sim.ocr_prova_text) throw new Error("OCR text not found");

  const offset = sim.questao_offset || 0;
  const totalQ = sim.total_questoes || 80;
  const imageUrlMap: Record<string, string> = (sim.imagem_urls as Record<string, string>) || {};
  const BATCH_SIZE = 10;
  const start = offset + 1;
  const end = Math.min(offset + BATCH_SIZE, totalQ);

  if (start > totalQ) {
    // All done
    return { done: true, extracted: 0 };
  }

  await addLog(supabase, simuladoId, "gemini",
    `Extraindo questões ${start} a ${end} de ${totalQ}...`);

  const batchPrompt = `Extraia as questões ${start} a ${end} desta prova.

REGRAS CRÍTICAS:
1. Muitas questões (especialmente de Língua Portuguesa, Redação, Interpretação de Texto) possuem um TEXTO DE APOIO que o candidato precisa ler antes de responder. Esse texto geralmente aparece ANTES do grupo de questões, com instruções como "Leia o texto para responder às questões de X a Y", "Com base no texto", "Leia o trecho", etc.
2. O texto_base deve conter o texto de apoio COMPLETO e NA ÍNTEGRA — não resuma, não omita parágrafos.
3. Se um mesmo texto de apoio serve para múltiplas questões (ex: "questões de 01 a 05"), REPITA o texto_base integralmente em CADA uma dessas questões.
4. O enunciado deve conter APENAS a parte da pergunta que aparece ANTES de qualquer imagem/figura/gráfico.
5. Textos de apoio incluem: trechos de leis, artigos de jornal, poemas, textos literários, tirinhas (descreva), tabelas, gráficos, editais, comunicados, etc.
6. Converta TODA notação LaTeX/matemática para texto plano legível usando caracteres Unicode. Exemplos: "$253~\\mathrm{cm}^2$" → "253 cm²", "$35~\\mathrm{cm}$" → "35 cm", "$x^2$" → "x²", "$\\frac{1}{2}$" → "1/2", "$\\geq$" → "≥", "$\\leq$" → "≤", "$\\pi$" → "π", "$\\times$" → "×", "$\\div$" → "÷". NUNCA retorne LaTeX cru com $ ou \\.
7. Se uma questão tem imagem/figura no meio do enunciado e há texto DEPOIS da imagem (ex: "Dado que a área...", "Sabendo-se que..."), coloque esse texto no campo "enunciado_pos_imagem".

Para cada questão retorne:
- numero (inteiro)
- texto_base: o texto de apoio/suporte COMPLETO. Se não há texto de apoio, retorne null.
- enunciado: apenas a parte da pergunta ANTES da imagem (sem o texto de apoio)
- enunciado_pos_imagem: texto do enunciado que aparece DEPOIS da imagem/figura. null se não houver imagem ou não houver texto após ela.
- alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e (texto, null se não existir)
- gabarito: letra correta do gabarito oficial ("A","B","C","D","E")
- materia: área do direito ou disciplina
- tem_imagem: true se referencia imagem/figura/gráfico no enunciado
- imagem_id: ID da imagem no markdown se tem_imagem=true, null caso contrário

Retorne APENAS JSON: { "questoes": [...] }

=== CONTEÚDO DA PROVA ===
${sim.ocr_prova_text.substring(0, 400000)}

=== GABARITO OFICIAL ===
${sim.ocr_gabarito_text.substring(0, 100000)}`;

  const batchRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: batchPrompt }] }],
        generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
      }),
    },
  );

  if (!batchRes.ok) {
    const errText = await batchRes.text();
    await addLog(supabase, simuladoId, "erro", `Erro lote ${start}-${end}: HTTP ${batchRes.status}`);
    console.error(`Gemini batch failed:`, errText.substring(0, 300));
    // Skip this batch by advancing offset
    await supabase.from("simulados").update({ questao_offset: end }).eq("id", simuladoId);
    return { done: end >= totalQ, extracted: 0 };
  }

  const batchJson = await batchRes.json();
  const batchText = batchJson.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!batchText) {
    await addLog(supabase, simuladoId, "erro", `Lote ${start}-${end}: resposta vazia`);
    await supabase.from("simulados").update({ questao_offset: end }).eq("id", simuladoId);
    return { done: end >= totalQ, extracted: 0 };
  }

  const batchParsed = JSON.parse(batchText);
  const questoes = batchParsed.questoes || [];

  const batchInsert = [];
  for (const q of questoes) {
    let imagemUrl: string | null = null;
    if (q.tem_imagem && q.imagem_id && imageUrlMap[q.imagem_id]) {
      imagemUrl = imageUrlMap[q.imagem_id];
    }

    batchInsert.push({
      simulado_id: simuladoId,
      numero: q.numero,
      enunciado: q.enunciado,
      enunciado_pos_imagem: q.enunciado_pos_imagem || null,
      texto_base: q.texto_base || null,
      alternativa_a: q.alternativa_a,
      alternativa_b: q.alternativa_b,
      alternativa_c: q.alternativa_c,
      alternativa_d: q.alternativa_d,
      alternativa_e: q.alternativa_e,
      gabarito: (q.gabarito || "A").toUpperCase(),
      materia: q.materia,
      ordem: q.numero - 1,
      imagem_url: imagemUrl,
    });

    await addLog(supabase, simuladoId, "questao_extraida",
      `Questão ${q.numero} extraída${q.materia ? ` — ${q.materia}` : ""}${q.tem_imagem ? " 🖼️" : ""}`,
      q.numero, imagemUrl);
  }

  if (batchInsert.length > 0) {
    const { error: qErr } = await supabase.from("simulado_questoes").insert(batchInsert);
    if (qErr) {
      await addLog(supabase, simuladoId, "erro", `Erro ao salvar lote: ${qErr.message}`);
    } else {
      await addLog(supabase, simuladoId, "gemini",
        `✅ Lote ${start}-${end} salvo (${batchInsert.length} questões)`);
    }
  }

  // Advance offset
  await supabase.from("simulados").update({ questao_offset: end }).eq("id", simuladoId);

  return { done: end >= totalQ, extracted: batchInsert.length };
}

// ---- Self re-enqueue: invoke this same function again for the next batch ----
async function enqueueNextBatch(simuladoId: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  await fetch(`${supabaseUrl}/functions/v1/processar-simulado`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ simulado_id: simuladoId, phase: "batch" }),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mistralKey = Deno.env.get("MISTRAL_API_KEY")!;
    const geminiKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GEMINI_API_KEY2") || "";
    const supabase = createClient(supabaseUrl, serviceKey);

    const contentType = req.headers.get("content-type") || "";

    // ---- MODE 2: JSON body = batch continuation ----
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const simuladoId = body.simulado_id;
      if (!simuladoId) throw new Error("simulado_id required");

      try {
        const result = await phaseBatch(supabase, simuladoId, geminiKey);

        if (result.done) {
          // Count total inserted questions
          const { count } = await supabase
            .from("simulado_questoes")
            .select("id", { count: "exact", head: true })
            .eq("simulado_id", simuladoId);

          const total = count || 0;
          const questoesComImagem = await supabase
            .from("simulado_questoes")
            .select("id", { count: "exact", head: true })
            .eq("simulado_id", simuladoId)
            .not("imagem_url", "is", null);

          await supabase.from("simulados").update({
            status: total > 0 ? "ready" : "error",
            total_questoes: total,
            erro_detalhe: total === 0 ? "Nenhuma questão extraída" : null,
          }).eq("id", simuladoId);

          await addLog(supabase, simuladoId, "concluido",
            `✅ Concluído: ${total} questões extraídas`);
        } else {
          // Re-enqueue for next batch — fire and forget
          // @ts-ignore
          EdgeRuntime.waitUntil(enqueueNextBatch(simuladoId));
        }

        return new Response(JSON.stringify({ ok: true, ...result }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e) {
        const errMsg = (e as Error).message;
        console.error("Batch error:", errMsg);
        await addLog(supabase, simuladoId, "erro", "Falha: " + errMsg.substring(0, 300));
        await supabase.from("simulados")
          .update({ status: "error", erro_detalhe: errMsg.substring(0, 500) })
          .eq("id", simuladoId);
        return new Response(JSON.stringify({ error: errMsg }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ---- MODE 1: FormData = initial upload (OCR phase) ----
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const gabaritoFile = formData.get("gabarito_file") as File | null;
    const userId = formData.get("user_id") as string;

    if (!file || !gabaritoFile || !userId) {
      return new Response(
        JSON.stringify({ error: "file, gabarito_file e user_id são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Upload PDF to storage
    const sanitize = (n: string) => n.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `simulados/${userId}/${Date.now()}_${sanitize(file.name)}`;
    const arrayBuf = await file.arrayBuffer();
    const { error: uploadErr } = await supabase.storage
      .from("biblioteca")
      .upload(fileName, arrayBuf, { contentType: "application/pdf" });
    if (uploadErr) throw new Error("Falha no upload: " + uploadErr.message);
    const { data: urlData } = supabase.storage.from("biblioteca").getPublicUrl(fileName);

    // Upload gabarito PDF to storage
    const gabFileName = `simulados/${userId}/${Date.now()}_gabarito_${sanitize(gabaritoFile.name)}`;
    const gabArrayBufUpload = await gabaritoFile.arrayBuffer();
    await supabase.storage
      .from("biblioteca")
      .upload(gabFileName, gabArrayBufUpload, { contentType: "application/pdf" });
    const { data: gabUrlData } = supabase.storage.from("biblioteca").getPublicUrl(gabFileName);

    // Create simulado record
    const { data: simulado, error: insertErr } = await supabase
      .from("simulados")
      .insert({
        user_id: userId,
        titulo: "Processando...",
        status: "processing",
        pdf_url: urlData.publicUrl,
        gabarito_pdf_url: gabUrlData.publicUrl,
      })
      .select("id")
      .single();
    if (insertErr) throw new Error("Erro ao criar simulado: " + insertErr.message);

    const gabArrayBuf = await gabaritoFile.arrayBuffer();

    // Run OCR phase in background, then trigger first batch
    // @ts-ignore
    EdgeRuntime.waitUntil((async () => {
      try {
        await phaseOcr(
          supabase, simulado.id,
          arrayBuf, file.name,
          gabArrayBuf, gabaritoFile.name,
          mistralKey, geminiKey,
        );
        // Trigger first batch
        await enqueueNextBatch(simulado.id);
      } catch (e) {
        const errMsg = (e as Error).message;
        console.error("OCR phase error:", errMsg);
        await addLog(supabase, simulado.id, "erro", "Falha OCR: " + errMsg.substring(0, 300));
        await supabase.from("simulados")
          .update({ status: "error", erro_detalhe: errMsg.substring(0, 500) })
          .eq("id", simulado.id);
      }
    })());

    return new Response(
      JSON.stringify({ success: true, id: simulado.id, message: "Processamento iniciado" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
