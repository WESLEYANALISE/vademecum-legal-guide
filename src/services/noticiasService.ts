import { supabase } from '@/integrations/supabase/client';

export interface Noticia {
  id: string;
  titulo: string;
  resumo: string;
  conteudo: string;
  imagem_url: string | null;
  categoria: string;
  link: string;
  data_publicacao: string;
}

let noticiasCache: Noticia[] | null = null;
let fetchPromise: Promise<void> | null = null;
let lastFetchTime = 0;

const sortNoticias = (items: Noticia[]) =>
  [...items].sort((a, b) => {
    const dateDiff = new Date(b.data_publicacao).getTime() - new Date(a.data_publicacao).getTime();
    if (dateDiff !== 0) return dateDiff;
    return b.id.localeCompare(a.id);
  });

export function getNoticiasCache(): Noticia[] | null {
  return noticiasCache ? sortNoticias(noticiasCache) : null;
}

export async function prefetchNoticias(): Promise<void> {
  const now = Date.now();
  if (noticiasCache && (now - lastFetchTime) < 5 * 60 * 1000) return;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    const { data, error } = await supabase
      .from('noticias_camara' as any)
      .select('*')
      .not('imagem_url', 'is', null)
      .neq('imagem_url', '')
      .order('data_publicacao', { ascending: false })
      .order('id', { ascending: false })
      .limit(50);

    if (!error && data) {
      const filtered = (data as unknown as Noticia[]).filter(n => n.imagem_url?.trim());
      noticiasCache = sortNoticias(filtered);
      lastFetchTime = Date.now();
    }
    fetchPromise = null;
  })();

  return fetchPromise;
}
