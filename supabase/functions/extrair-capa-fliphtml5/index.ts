import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const SB_URL = Deno.env.get("SUPABASE_URL")!;
  const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SB_URL, SB_KEY);

  // Fetch all estudos without capa_livro but with a fliphtml5 link
  const { data: livros, error } = await supabase
    .from("biblioteca_estudos")
    .select("id, link, capa_livro")
    .is("capa_livro", null)
    .not("link", "is", null);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: { id: number; status: string; url?: string }[] = [];

  for (const livro of livros || []) {
    if (!livro.link?.includes("fliphtml5.com")) {
      results.push({ id: livro.id, status: "skipped" });
      continue;
    }

    try {
      const base = livro.link.replace(/\/$/, "");
      const thumbUrl = `${base}/files/large/1.jpg`;

      const imgRes = await fetch(thumbUrl);
      if (!imgRes.ok) {
        results.push({ id: livro.id, status: `fetch_failed_${imgRes.status}` });
        continue;
      }

      const imgBytes = new Uint8Array(await imgRes.arrayBuffer());
      const path = `capas-estudos/${livro.id}.jpg`;

      const { error: uploadErr } = await supabase.storage
        .from("biblioteca")
        .upload(path, imgBytes, { contentType: "image/jpeg", upsert: true });

      if (uploadErr) {
        results.push({ id: livro.id, status: `upload_error: ${uploadErr.message}` });
        continue;
      }

      const publicUrl = `${SB_URL}/storage/v1/object/public/biblioteca/${path}`;

      const { error: updateErr } = await supabase
        .from("biblioteca_estudos")
        .update({ capa_livro: publicUrl })
        .eq("id", livro.id);

      if (updateErr) {
        results.push({ id: livro.id, status: `update_error: ${updateErr.message}` });
      } else {
        results.push({ id: livro.id, status: "ok", url: publicUrl });
      }
    } catch (e) {
      results.push({ id: livro.id, status: `error: ${e.message}` });
    }
  }

  return new Response(
    JSON.stringify({ total: livros?.length || 0, processed: results }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
