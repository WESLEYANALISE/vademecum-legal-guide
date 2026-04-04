import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StorageFile {
  name: string;
  bucket: string;
  size: number;
  type: string;
  publicUrl: string;
  path: string;
}

async function listAllFiles(supabase: any, bucket: string, prefix = ""): Promise<StorageFile[]> {
  const files: StorageFile[] = [];
  const SB_URL = Deno.env.get("SUPABASE_URL")!;

  const { data, error } = await supabase.storage
    .from(bucket)
    .list(prefix, { limit: 1000 });

  if (error || !data) return files;

  for (const item of data) {
    const fullPath = prefix ? `${prefix}/${item.name}` : item.name;

    if (!item.id) {
      // It's a folder
      const subFiles = await listAllFiles(supabase, bucket, fullPath);
      files.push(...subFiles);
    } else {
      const ext = item.name.split('.').pop()?.toLowerCase() || '';
      const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp', 'tiff'];
      if (imageExts.includes(ext)) {
        files.push({
          name: item.name,
          bucket,
          size: item.metadata?.size || 0,
          type: item.metadata?.mimetype || `image/${ext}`,
          publicUrl: `${SB_URL}/storage/v1/object/public/${bucket}/${fullPath}`,
          path: fullPath,
        });
      }
    }
  }

  return files;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const SB_URL = Deno.env.get("SUPABASE_URL")!;
  const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const TINIFY_KEY = Deno.env.get("TINIFY_API_KEY");
  const supabase = createClient(SB_URL, SB_KEY);

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "list";

    // ACTION: list all images across all buckets
    if (action === "list") {
      const buckets = ["biblioteca", "narracoes", "avatars", "biblioteca-externa"];
      const allFiles: StorageFile[] = [];

      for (const bucket of buckets) {
        const files = await listAllFiles(supabase, bucket);
        allFiles.push(...files);
      }

      // Sort by size descending
      allFiles.sort((a, b) => b.size - a.size);

      const totalSize = allFiles.reduce((sum, f) => sum + f.size, 0);

      return new Response(JSON.stringify({
        total: allFiles.length,
        totalSize,
        files: allFiles,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: compress a single image
    if (action === "compress") {
      if (!TINIFY_KEY) {
        return new Response(JSON.stringify({ error: "TINIFY_API_KEY não configurada" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { bucket, path: filePath } = body;
      if (!bucket || !filePath) {
        return new Response(JSON.stringify({ error: "bucket e path são obrigatórios" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Download original
      const { data: fileData, error: dlError } = await supabase.storage
        .from(bucket)
        .download(filePath);

      if (dlError || !fileData) {
        return new Response(JSON.stringify({ error: "Falha ao baixar arquivo: " + dlError?.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const originalBytes = await fileData.arrayBuffer();
      const originalSize = originalBytes.byteLength;

      // Send to TinyPNG
      const shrinkRes = await fetch("https://api.tinify.com/shrink", {
        method: "POST",
        headers: {
          Authorization: "Basic " + btoa(`api:${TINIFY_KEY}`),
        },
        body: new Uint8Array(originalBytes),
      });

      if (!shrinkRes.ok) {
        const errText = await shrinkRes.text();
        return new Response(JSON.stringify({ error: "TinyPNG falhou: " + errText }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const shrinkData = await shrinkRes.json();
      const compressedSize = shrinkData.output.size;
      const outputUrl = shrinkData.output.url;

      // Determine if we should convert to WebP
      const ext = filePath.split('.').pop()?.toLowerCase() || '';
      const canConvert = ['jpg', 'jpeg', 'png', 'bmp', 'tiff'].includes(ext);

      let finalBytes: Uint8Array;
      let finalSize: number;
      let finalPath = filePath;
      let converted = false;

      if (canConvert) {
        // Convert to WebP
        const convertRes = await fetch(outputUrl, {
          method: "POST",
          headers: {
            Authorization: "Basic " + btoa(`api:${TINIFY_KEY}`),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            convert: { type: ["image/webp"] },
          }),
        });

        if (convertRes.ok) {
          finalBytes = new Uint8Array(await convertRes.arrayBuffer());
          finalSize = finalBytes.byteLength;
          finalPath = filePath.replace(/\.[^.]+$/, '.webp');
          converted = true;
        } else {
          // Fallback: download compressed without conversion
          const dlRes = await fetch(outputUrl, {
            headers: { Authorization: "Basic " + btoa(`api:${TINIFY_KEY}`) },
          });
          finalBytes = new Uint8Array(await dlRes.arrayBuffer());
          finalSize = finalBytes.byteLength;
        }
      } else {
        // Download compressed version
        const dlRes = await fetch(outputUrl, {
          headers: { Authorization: "Basic " + btoa(`api:${TINIFY_KEY}`) },
        });
        finalBytes = new Uint8Array(await dlRes.arrayBuffer());
        finalSize = finalBytes.byteLength;
      }

      // Upload compressed back to storage
      const contentType = converted ? "image/webp" : (shrinkData.output.type || "image/png");

      // If converted, upload new webp and optionally delete old
      const { error: upError } = await supabase.storage
        .from(bucket)
        .upload(finalPath, finalBytes, {
          contentType,
          upsert: true,
        });

      if (upError) {
        return new Response(JSON.stringify({ error: "Falha ao fazer upload: " + upError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If converted to webp and path changed, remove original
      if (converted && finalPath !== filePath) {
        await supabase.storage.from(bucket).remove([filePath]);
      }

      const saved = originalSize - finalSize;
      const pctSaved = originalSize > 0 ? Math.round((saved / originalSize) * 100) : 0;

      return new Response(JSON.stringify({
        success: true,
        originalSize,
        compressedSize: finalSize,
        saved,
        pctSaved,
        converted,
        newPath: finalPath,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("comprimir-imagens error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
