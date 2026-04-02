const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export interface Sumula {
  id: string;
  tribunal: string;
  numero: number;
  enunciado: string;
  situacao: string;
  data_publicacao: string | null;
  referencia: string | null;
  ordem: number;
}

export const SUMULA_TRIBUNAIS = [
  { id: 'STF_VINCULANTE', nome: 'Súmulas Vinculantes', tribunal: 'STF', descricao: 'Efeito vinculante para o Judiciário e Administração Pública', iconColor: '#dc2626', count: 63 },
  { id: 'STF', nome: 'Súmulas do STF', tribunal: 'STF', descricao: 'Supremo Tribunal Federal', iconColor: '#1d4ed8', count: 736 },
  { id: 'STJ', nome: 'Súmulas do STJ', tribunal: 'STJ', descricao: 'Superior Tribunal de Justiça', iconColor: '#16a34a', count: 676 },
  { id: 'TST', nome: 'Súmulas do TST', tribunal: 'TST', descricao: 'Tribunal Superior do Trabalho', iconColor: '#9333ea', count: 460 },
  { id: 'TSE', nome: 'Súmulas do TSE', tribunal: 'TSE', descricao: 'Tribunal Superior Eleitoral', iconColor: '#ea580c', count: 70 },
  { id: 'STM', nome: 'Súmulas do STM', tribunal: 'STM', descricao: 'Superior Tribunal Militar', iconColor: '#475569', count: 20 },
];

// In-memory cache
const sumulasCache = new Map<string, Sumula[]>();

export async function fetchSumulas(tribunal: string): Promise<Sumula[]> {
  const cached = sumulasCache.get(tribunal);
  if (cached) return cached;

  const res = await fetch(
    `${supabaseUrl}/rest/v1/sumulas?tribunal=eq.${tribunal}&select=*&order=numero.asc&limit=10000`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    }
  );

  if (!res.ok) {
    console.error(`Erro ao buscar súmulas ${tribunal}:`, res.status);
    return [];
  }

  const data: Sumula[] = await res.json();
  sumulasCache.set(tribunal, data);
  return data;
}
