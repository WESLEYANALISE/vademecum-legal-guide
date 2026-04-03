import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// External Supabase
const EXT_URL = 'https://izspjvegxdfgkgibpyst.supabase.co';

// Table mappings: external name → local name + column mapping
const TABLE_MAPS = [
  {
    ext: 'BIBLIOTECA-CLASSICOS',
    local: 'biblioteca_classicos',
    cols: (r: any) => ({
      id: r.id, livro: r.livro, autor: r.autor, area: r.area, sobre: r.sobre,
      imagem: r.imagem, capa_area: r['Capa-area'], download: r.download,
      link: r.link, aula: r.aula, beneficios: r.beneficios,
      resumo_capitulos: r.resumo_capitulos, questoes_resumo: r.questoes_resumo,
      resumo_gerado_em: r.resumo_gerado_em, analise_status: r.analise_status,
      capitulos_gerados: r.capitulos_gerados, total_capitulos: r.total_capitulos,
      total_paginas: r.total_paginas, total_temas: r.total_temas,
      url_videoaula: r.url_videoaula,
    }),
  },
  {
    ext: 'BIBLIOTECA-ESTUDOS',
    local: 'biblioteca_estudos',
    cols: (r: any) => ({
      id: r.id, tema: r.Tema, area: r['Área'], capa_area: r['Capa-area'],
      capa_livro: r['Capa-livro'], download: r.Download, link: r.Link,
      sobre: r.Sobre, aula: r.aula, ordem: r.Ordem,
      url_capa_gerada: r.url_capa_gerada,
    }),
  },
  {
    ext: 'BIBLIOTECA-FORA-DA-TOGA',
    local: 'biblioteca_fora_da_toga',
    cols: (r: any) => ({
      id: r.id, livro: r.livro, autor: r.autor, area: r.area,
      capa_area: r['capa-area'], capa_livro: r['capa-livro'],
      download: r.download, link: r.link, sobre: r.sobre, aula: r.aula,
    }),
  },
  {
    ext: 'BIBLIOTECA-LIDERANÇA',
    local: 'biblioteca_lideranca',
    cols: (r: any) => ({
      id: r.id, livro: r.livro, autor: r.autor, area: r.area,
      capa_area: r['Capa-area'], imagem: r.imagem, download: r.download,
      link: r.link, sobre: r.sobre, aula: r.aula, beneficios: r.beneficios,
      resumo_capitulos: r.resumo_capitulos, questoes_resumo: r.questoes_resumo,
      resumo_gerado_em: r.resumo_gerado_em,
    }),
  },
  {
    ext: 'BIBLIOTECA-CONTRIBUICOES',
    local: 'biblioteca_contribuicoes',
    cols: (r: any) => ({
      id: r.id, livro: r.livro, autor: r.autor, area: r.area,
      download: r.download, imagem: r.imagem, sobre: r.sobre,
      formato: r.formato, idioma: r.idioma, tamanho: r.tamanho,
      md5: r.md5, aprovado: r.aprovado, contribuidor_id: r.contribuidor_id,
    }),
  },
  {
    ext: 'BIBLIOTECA-LEITURA-DINAMICA',
    local: 'biblioteca_leitura_dinamica',
    cols: (r: any) => ({
      id: r.id, titulo_obra: r['Titulo da Obra'],
      titulo_capitulo: r['Titulo do Capitulo'],
      pagina: r.Pagina, conteudo: r['Conteúdo'],
    }),
  },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const EXT_KEY = Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY');
    if (!EXT_KEY) throw new Error('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY not set');

    const extSupa = createClient(EXT_URL, EXT_KEY);
    const localSupa = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'all'; // 'tables', 'pdfs', 'all'
    const results: Record<string, any> = {};

    // --- Import tables ---
    if (action === 'tables' || action === 'all') {
      for (const map of TABLE_MAPS) {
        try {
          // Fetch all rows (paginated)
          let allRows: any[] = [];
          let from = 0;
          const pageSize = 1000;
          while (true) {
            const { data, error } = await extSupa
              .from(map.ext)
              .select('*')
              .range(from, from + pageSize - 1);
            if (error) throw error;
            if (!data || data.length === 0) break;
            allRows = allRows.concat(data);
            if (data.length < pageSize) break;
            from += pageSize;
          }

          // Map columns
          const mapped = allRows.map(map.cols);

          // Upsert in batches of 500
          let upserted = 0;
          for (let i = 0; i < mapped.length; i += 500) {
            const batch = mapped.slice(i, i + 500);
            const { error: uErr } = await localSupa
              .from(map.local)
              .upsert(batch, { onConflict: 'id' });
            if (uErr) throw uErr;
            upserted += batch.length;
          }

          results[map.local] = { total: allRows.length, upserted };
        } catch (e: any) {
          results[map.local] = { error: e.message };
        }
      }

      // Import classicos_paginas
      try {
        let allPages: any[] = [];
        let from = 0;
        while (true) {
          const { data, error } = await extSupa
            .from('biblioteca_classicos_paginas')
            .select('*')
            .range(from, from + 999);
          if (error) throw error;
          if (!data || data.length === 0) break;
          allPages = allPages.concat(data);
          if (data.length < 1000) break;
          from += 1000;
        }
        for (let i = 0; i < allPages.length; i += 500) {
          const batch = allPages.slice(i, i + 500).map((r: any) => ({
            id: r.id, livro_id: r.livro_id, pagina: r.pagina, conteudo: r.conteudo,
          }));
          await localSupa.from('ext_biblioteca_classicos_paginas').upsert(batch, { onConflict: 'id' });
        }
        results['ext_biblioteca_classicos_paginas'] = { total: allPages.length };
      } catch (e: any) {
        results['ext_biblioteca_classicos_paginas'] = { error: e.message };
      }

      // Import classicos_temas
      try {
        let allTemas: any[] = [];
        let from = 0;
        while (true) {
          const { data, error } = await extSupa
            .from('biblioteca_classicos_temas')
            .select('*')
            .range(from, from + 999);
          if (error) throw error;
          if (!data || data.length === 0) break;
          allTemas = allTemas.concat(data);
          if (data.length < 1000) break;
          from += 1000;
        }
        for (let i = 0; i < allTemas.length; i += 500) {
          const batch = allTemas.slice(i, i + 500).map((r: any) => ({
            id: r.id, livro_id: r.livro_id, titulo_tema: r.titulo_tema,
            conteudo_markdown: r.conteudo_markdown, audio_url: r.audio_url,
            capa_url: r.capa_url, correspondencias: r.correspondencias,
          }));
          await localSupa.from('ext_biblioteca_classicos_temas').upsert(batch, { onConflict: 'id' });
        }
        results['ext_biblioteca_classicos_temas'] = { total: allTemas.length };
      } catch (e: any) {
        results['ext_biblioteca_classicos_temas'] = { error: e.message };
      }

      // Import atualizacao_biblioteca
      try {
        const { data, error } = await extSupa.from('atualizacao_biblioteca').select('*');
        if (error) throw error;
        if (data && data.length > 0) {
          const mapped = data.map((r: any) => ({
            id: r.id, nome_livro: r.nome_livro, autor: r.autor,
            biblioteca: r.biblioteca, capa_url: r.capa_url,
            ativo: r.ativo, vezes: r.vezes,
          }));
          await localSupa.from('ext_atualizacao_biblioteca').upsert(mapped, { onConflict: 'id' });
        }
        results['ext_atualizacao_biblioteca'] = { total: data?.length || 0 };
      } catch (e: any) {
        results['ext_atualizacao_biblioteca'] = { error: e.message };
      }
    }

    // --- Import PDFs from storage (one bucket at a time via body.bucket) ---
    if (action === 'pdfs') {
      const singleBucket = body.bucket;
      const buckets = singleBucket ? [singleBucket] : ['pdfs', 'pdfs-educacionais', 'simulados-pdfs'];
      for (const bucket of buckets) {
        try {
          const { data: files, error } = await extSupa.storage.from(bucket).list('', { limit: 500 });
          if (error) throw error;

          // Also check abnt/ subfolder for pdfs bucket
          let allFiles = (files || []).filter((f: any) => f.name?.endsWith('.pdf'));
          if (bucket === 'pdfs') {
            const { data: abntFiles } = await extSupa.storage.from(bucket).list('abnt', { limit: 500 });
            if (abntFiles) {
              allFiles = allFiles.concat(
                abntFiles.filter((f: any) => f.name?.endsWith('.pdf')).map((f: any) => ({
                  ...f, name: `abnt/${f.name}`
                }))
              );
            }
          }

          let copied = 0;
          for (const file of allFiles) {
            const path = file.name;
            const { data: blob, error: dlErr } = await extSupa.storage.from(bucket).download(path);
            if (dlErr || !blob) continue;

            const destPath = `${bucket}/${path}`;
            await localSupa.storage.from('biblioteca-externa').upload(destPath, blob, {
              contentType: 'application/pdf',
              upsert: true,
            });
            copied++;
          }
          results[`storage_${bucket}`] = { files: allFiles.length, copied };
        } catch (e: any) {
          results[`storage_${bucket}`] = { error: e.message };
        }
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
