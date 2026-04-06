import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Roman numeral to Portuguese ordinal mapping
const ROMAN_TO_ORDINAL: Record<string, string> = {
  I: "primeiro", II: "segundo", III: "terceiro", IV: "quarto", V: "quinto",
  VI: "sexto", VII: "sétimo", VIII: "oitavo", IX: "nono", X: "décimo",
  XI: "décimo primeiro", XII: "décimo segundo", XIII: "décimo terceiro",
  XIV: "décimo quarto", XV: "décimo quinto", XVI: "décimo sexto",
  XVII: "décimo sétimo", XVIII: "décimo oitavo", XIX: "décimo nono",
  XX: "vigésimo", XXI: "vigésimo primeiro", XXII: "vigésimo segundo",
  XXIII: "vigésimo terceiro", XXIV: "vigésimo quarto", XXV: "vigésimo quinto",
  XXVI: "vigésimo sexto", XXVII: "vigésimo sétimo", XXVIII: "vigésimo oitavo",
  XXIX: "vigésimo nono", XXX: "trigésimo", XXXI: "trigésimo primeiro",
  XXXII: "trigésimo segundo", XXXIII: "trigésimo terceiro",
  XXXIV: "trigésimo quarto", XXXV: "trigésimo quinto",
  XXXVI: "trigésimo sexto", XXXVII: "trigésimo sétimo",
  XXXVIII: "trigésimo oitavo", XXXIX: "trigésimo nono",
  XL: "quadragésimo", XLI: "quadragésimo primeiro",
  XLII: "quadragésimo segundo", XLIII: "quadragésimo terceiro",
  XLIV: "quadragésimo quarto", XLV: "quadragésimo quinto",
  XLVI: "quadragésimo sexto", XLVII: "quadragésimo sétimo",
  XLVIII: "quadragésimo oitavo", XLIX: "quadragésimo nono",
  L: "quinquagésimo",
};

const CARDINAL_TO_ORDINAL: Record<number, string> = {
  1: "primeiro", 2: "segundo", 3: "terceiro", 4: "quarto", 5: "quinto",
  6: "sexto", 7: "sétimo", 8: "oitavo", 9: "nono", 10: "décimo",
  11: "décimo primeiro", 12: "décimo segundo", 13: "décimo terceiro",
  14: "décimo quarto", 15: "décimo quinto", 16: "décimo sexto",
  17: "décimo sétimo", 18: "décimo oitavo", 19: "décimo nono",
  20: "vigésimo",
};

function preprocessNarrationText(text: string): string {
  let result = text;

  // 1. Convert roman numeral incisos: "I -", "II -", "III -" etc.
  result = result.replace(/\b([IVXLC]+)\s*[-–—]\s*/g, (match, roman) => {
    const ordinal = ROMAN_TO_ORDINAL[roman.toUpperCase()];
    if (ordinal) {
      return `Inciso ${ordinal}, `;
    }
    return match;
  });

  // 2. Convert alíneas: "a)", "b)", etc.
  result = result.replace(/\b([a-z])\)\s*/g, (_, letter) => {
    return `alínea ${letter}, `;
  });

  // 3. Convert paragraphs: "§ 1º" → "parágrafo primeiro", "§ 2º" → "parágrafo segundo"
  result = result.replace(/§\s*(\d+)[ºo°]/g, (_, num) => {
    const n = parseInt(num);
    const ordinal = CARDINAL_TO_ORDINAL[n];
    if (ordinal) {
      return `parágrafo ${ordinal}`;
    }
    return `parágrafo ${num}`;
  });

  // 4. Remove parentheses content EXCEPT when it contains "revogado"
  result = result.replace(/\([^)]*\)/g, (match) => {
    if (/revogad/i.test(match)) {
      return match;
    }
    return "";
  });

  // 5. Clean up extra whitespace
  result = result.replace(/\s{2,}/g, " ").trim();

  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tabela_nome, artigo_numero, artigo_texto, lei_nome, titulo_artigo } = await req.json();

    if (!tabela_nome || !artigo_numero || !artigo_texto || !lei_nome) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios faltando" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const GEMINI_API_KEY2 = Deno.env.get("GEMINI_API_KEY2");
    const geminiKeys = [GEMINI_API_KEY, GEMINI_API_KEY2].filter(Boolean) as string[];
    if (!geminiKeys.length) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pre-process text for better TTS pronunciation
    const processedText = preprocessNarrationText(artigo_texto);

    // Build narration: Lei name + artigo number + processed text
    const narrationText = `${lei_nome}. ${artigo_numero}. ${processedText}`;

    console.log(`Narrando: ${lei_nome} - ${artigo_numero} (${narrationText.length} chars)`);

    // Call Gemini TTS
    const ttsUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${GEMINI_API_KEY}`;
    
    const ttsRes = await fetch(ttsUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: narrationText }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Kore" },
            },
          },
        },
      }),
    });

    if (!ttsRes.ok) {
      const errText = await ttsRes.text();
      console.error("Gemini TTS error:", ttsRes.status, errText);
      return new Response(JSON.stringify({ error: `Gemini TTS falhou: ${ttsRes.status}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ttsData = await ttsRes.json();
    const audioBase64 = ttsData?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioBase64) {
      console.error("No audio data in response:", JSON.stringify(ttsData).slice(0, 500));
      return new Response(JSON.stringify({ error: "Sem dados de áudio na resposta" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decode base64 to raw PCM bytes
    const binaryStr = atob(audioBase64);
    const pcm = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      pcm[i] = binaryStr.charCodeAt(i);
    }

    // Wrap raw PCM in a proper WAV container
    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;
    const wavBuffer = new ArrayBuffer(44 + pcm.length);
    const view = new DataView(wavBuffer);
    let offset = 0;
    const writeString = (s: string) => { for (const c of s) view.setUint8(offset++, c.charCodeAt(0)); };
    writeString('RIFF');
    view.setUint32(offset, 36 + pcm.length, true); offset += 4;
    writeString('WAVEfmt ');
    view.setUint32(offset, 16, true); offset += 4;
    view.setUint16(offset, 1, true); offset += 2;
    view.setUint16(offset, numChannels, true); offset += 2;
    view.setUint32(offset, sampleRate, true); offset += 4;
    view.setUint32(offset, byteRate, true); offset += 4;
    view.setUint16(offset, blockAlign, true); offset += 2;
    view.setUint16(offset, bitsPerSample, true); offset += 2;
    writeString('data');
    view.setUint32(offset, pcm.length, true); offset += 4;
    new Uint8Array(wavBuffer, 44).set(pcm);
    const audioBytes = new Uint8Array(wavBuffer);

    // Upload to Supabase Storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const filePath = `${tabela_nome}/${artigo_numero.replace(/[^a-zA-Z0-9]/g, "_")}.wav`;

    const { error: uploadError } = await supabase.storage
      .from("narracoes")
      .upload(filePath, audioBytes, {
        contentType: "audio/wav",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(JSON.stringify({ error: `Upload falhou: ${uploadError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: publicUrlData } = supabase.storage.from("narracoes").getPublicUrl(filePath);
    const audioUrl = publicUrlData.publicUrl;

    // Cache in narracoes_artigos table
    const { error: insertError } = await supabase.from("narracoes_artigos").upsert(
      {
        tabela_nome,
        artigo_numero,
        lei_nome,
        titulo_artigo: titulo_artigo || null,
        audio_url: audioUrl,
      },
      { onConflict: "tabela_nome,artigo_numero" }
    );

    if (insertError) {
      console.error("Insert cache error:", insertError);
    }

    console.log(`Narração salva: ${audioUrl}`);

    return new Response(JSON.stringify({ audio_url: audioUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Erro geral:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
