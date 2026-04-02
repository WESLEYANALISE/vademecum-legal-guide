import Dexie, { type Table } from 'dexie';

export interface OfflineArtigo {
  id: string;
  tabelaNome: string;
  numero: string;
  caput: string;
  texto: string;
  titulo?: string;
  capitulo?: string;
  rotulo?: string;
  incisos?: string[];
  paragrafos?: string[];
  ordem: number;
  ordem_numero: number;
}

export interface OfflineFavorito {
  id: string;
  tabelaNome: string;
  artigoNumero: string;
  createdAt: string;
}

export interface OfflineHighlight {
  id: string;
  artigoId: string;
  data: string; // JSON stringified
}

export interface OfflineNarracao {
  id: string;
  tabelaNome: string;
  artigoNumero: string;
  audioBlob: Blob;
}

class DrLeisDB extends Dexie {
  artigos!: Table<OfflineArtigo, string>;
  favoritos!: Table<OfflineFavorito, string>;
  highlights!: Table<OfflineHighlight, string>;
  narracoes!: Table<OfflineNarracao, string>;

  constructor() {
    super('DrLeisDB');
    this.version(1).stores({
      artigos: 'id, tabelaNome, numero, ordem',
      favoritos: 'id, tabelaNome, artigoNumero',
      highlights: 'id, artigoId',
      narracoes: 'id, [tabelaNome+artigoNumero]',
    });
  }
}

export const db = new DrLeisDB();

export async function saveArtigosOffline(tabelaNome: string, artigos: any[]) {
  const mapped: OfflineArtigo[] = artigos.map(a => ({
    id: a.id,
    tabelaNome,
    numero: a.numero,
    caput: a.caput,
    texto: a.texto || a.caput,
    titulo: a.titulo,
    capitulo: a.capitulo,
    rotulo: a.rotulo,
    incisos: a.incisos,
    paragrafos: a.paragrafos,
    ordem: a.ordem,
    ordem_numero: a.ordem_numero,
  }));
  await db.artigos.bulkPut(mapped);
}

export async function getOfflineArtigos(tabelaNome: string) {
  return db.artigos.where('tabelaNome').equals(tabelaNome).sortBy('ordem');
}

export async function isLeiDownloaded(tabelaNome: string): Promise<boolean> {
  const count = await db.artigos.where('tabelaNome').equals(tabelaNome).count();
  return count > 0;
}
