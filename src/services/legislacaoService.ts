import type { ArtigoLei } from '@/data/mockData';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

import { LEIS_CATALOG, getLeisPorTipo as _getLeisPorTipo } from '@/data/leisCatalog';

export { LEIS_CATALOG };

export async function getLeisPorTipo(tipo: string) {
  return _getLeisPorTipo(tipo);
}

export function getTodosOsTipos(): string[] {
  return ['constituicao', 'codigo', 'estatuto', 'lei-especial', 'previdenciario', 'lei-ordinaria', 'decreto', 'sumula'];
}

// In-memory cache
const artigosCache = new Map<string, ArtigoLei[]>();

function normalizeArtigoLabel(value?: string | null): string {
  const raw = (value || '').trim();
  if (!raw) return '';

  const normalized = raw
    .replace(/°/g, 'º')
    .replace(/^Art\.\s*(\d+)o\b/i, 'Art. $1º')
    .replace(/^Art\.\s*(\d+)-([A-Z])\b/i, (_, numero, sufixo) => {
      const artigoNumero = Number(numero);
      return artigoNumero >= 1 && artigoNumero <= 9
        ? `Art. ${artigoNumero}º-${String(sufixo).toUpperCase()}`
        : `Art. ${artigoNumero}-${String(sufixo).toUpperCase()}`;
    });

  const plainMatch = normalized.match(/^Art\.\s*(\d+)$/i);
  if (plainMatch) {
    const artigoNumero = Number(plainMatch[1]);
    return artigoNumero >= 1 && artigoNumero <= 9
      ? `Art. ${artigoNumero}º`
      : `Art. ${artigoNumero}`;
  }

  return normalized;
}

// Leis Ordinárias por ano
export const ANOS_LEIS_ORDINARIAS = [2026];
export const ANOS_DECRETOS = [2026];

export interface LeiOrdinaria {
  id: string;
  numero_lei: string;
  data_publicacao: string | null;
  ementa: string;
  url: string | null;
  ano: number;
  ordem: number;
  texto_completo: string | null;
  explicacao?: string | null;
}

const leisCache = new Map<string, LeiOrdinaria[]>();

export async function fetchLeisOrdinariasPorAno(ano: number): Promise<LeiOrdinaria[]> {
  const key = `leis:${ano}`;
  if (leisCache.has(key)) return leisCache.get(key)!;
  const res = await fetch(
    `${supabaseUrl}/rest/v1/leis_ordinarias?ano=eq.${ano}&select=id,numero_lei,data_publicacao,ementa,url,ano,ordem,texto_completo&order=ordem.desc&limit=10000`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    }
  );

  if (!res.ok) {
    console.error(`Erro ao buscar leis ordinárias de ${ano}:`, res.status);
    return [];
  }

  const data: LeiOrdinaria[] = await res.json();
  leisCache.set(key, data);
  return data;
}

export async function fetchDecretosPorAno(ano: number): Promise<LeiOrdinaria[]> {
  const key = `decretos:${ano}`;
  if (leisCache.has(key)) return leisCache.get(key)!;
  const res = await fetch(
    `${supabaseUrl}/rest/v1/decretos?ano=eq.${ano}&select=id,numero_lei,data_publicacao,ementa,url,ano,ordem,texto_completo&order=ordem.desc&limit=10000`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    }
  );

  if (!res.ok) {
    console.error(`Erro ao buscar decretos de ${ano}:`, res.status);
    return [];
  }

  const data2: LeiOrdinaria[] = await res.json();
  leisCache.set(key, data2);
  return data2;
}

export function getCachedArtigos(tabelaNome: string): ArtigoLei[] | null {
  const cached = artigosCache.get(tabelaNome) || null;
  return cached?.map((artigo) => ({ ...artigo, numero: normalizeArtigoLabel(artigo.numero) })) || null;
}

export async function fetchArtigosLei(_leiId: string, tabelaNome?: string | null): Promise<ArtigoLei[]> {
  if (!tabelaNome) return [];
  const cached = artigosCache.get(tabelaNome);
  if (cached) return cached.map((artigo) => ({ ...artigo, numero: normalizeArtigoLabel(artigo.numero) }));
  return fetchArtigosPaginado(tabelaNome, 0, 2000);
}

export async function fetchArtigosInstant(tabelaNome: string, count = 10): Promise<ArtigoLei[]> {
  const cached = artigosCache.get(tabelaNome);
  if (cached) return cached.slice(0, count).map((a) => ({ ...a, numero: normalizeArtigoLabel(a.numero) }));

  const res = await fetch(
    `${supabaseUrl}/rest/v1/${encodeURIComponent(tabelaNome)}?select=id,numero,rotulo,texto,ordem_numero,titulo,capitulo&order=ordem_numero.asc&offset=0&limit=${count}`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    }
  );

  if (!res.ok) return [];
  const data = await res.json();
  return (data || [])
    .map((row: any) => ({
      id: row.id,
      numero: normalizeArtigoLabel(row.rotulo || row.numero),
      caput: (row.texto || row.caput || '').replace(/(\d)o\b/g, '$1º').replace(/°/g, 'º'),
      titulo: row.titulo || undefined,
      capitulo: row.capitulo || undefined,
    }))
    .filter((a: ArtigoLei) => a.caput.trim() !== '');
}

export async function fetchArtigosPaginado(tabelaNome: string, offset: number, limit: number): Promise<ArtigoLei[]> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/${encodeURIComponent(tabelaNome)}?select=id,numero,rotulo,texto,ordem_numero,titulo,capitulo&order=ordem_numero.asc&offset=${offset}&limit=${limit}`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    }
  );

  if (!res.ok) {
    console.error(`Erro ao buscar de ${tabelaNome}:`, res.status);
    return [];
  }

  const data = await res.json();

  const artigos = (data || [])
    .map((row: any) => ({
      id: row.id,
      numero: normalizeArtigoLabel(row.rotulo || row.numero),
      caput: (row.texto || row.caput || '').replace(/(\d)o\b/g, '$1º').replace(/°/g, 'º'),
      titulo: row.titulo || undefined,
      capitulo: row.capitulo || undefined,
    }))
    .filter((a: ArtigoLei) => a.caput.trim() !== '');

  if (offset === 0) {
    artigosCache.set(tabelaNome, artigos);
  }

  return artigos;
}

export function setCachedArtigos(tabelaNome: string, artigos: ArtigoLei[]) {
  artigosCache.set(tabelaNome, artigos);
}

// Prefetch all artigos from LEIS_CATALOG with controlled concurrency
let prefetchPromise: Promise<void> | null = null;

// Auto-start prefetch as soon as this module is imported
if (typeof window !== 'undefined') {
  // Small delay to not block initial render
  setTimeout(() => prefetchAllArtigos(4), 500);
}

export function prefetchAllArtigos(concurrency = 4): Promise<void> {
  if (prefetchPromise) return prefetchPromise;

  prefetchPromise = (async () => {
    const queue = LEIS_CATALOG.filter(lei => !artigosCache.has(lei.tabela_nome));
    let i = 0;

    const worker = async () => {
      while (i < queue.length) {
        const lei = queue[i++];
        if (!lei || artigosCache.has(lei.tabela_nome)) continue;
        try {
          await fetchArtigosPaginado(lei.tabela_nome, 0, 2000);
        } catch (e) {
          console.warn(`Prefetch failed for ${lei.tabela_nome}`, e);
        }
      }
    };

    await Promise.all(Array.from({ length: concurrency }, () => worker()));
  })();

  return prefetchPromise;
}

export function getLeisCatalog() {
  return LEIS_CATALOG;
}

export function getPlanaltoUrl(tabelaNome: string): string | null {
  const lei = LEIS_CATALOG.find(l => l.tabela_nome === tabelaNome);
  return lei?.url_planalto || null;
}

export function buildPlanaltoArticleUrl(tabelaNome: string, artigoNumero: string): string | null {
  const baseUrl = getPlanaltoUrl(tabelaNome);
  if (!baseUrl) return null;
  const match = artigoNumero.match(/Art\.\s*(\d+)[º°]?(?:-([A-Z]))?/i);
  if (!match) return baseUrl;
  const num = match[1];
  const suffix = match[2] ? match[2].toLowerCase() : '';
  return `${baseUrl}#art${num}${suffix}`;
}
