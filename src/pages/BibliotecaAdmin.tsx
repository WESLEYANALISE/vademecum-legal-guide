import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Loader2, CheckCircle, Zap, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cdnImg } from '@/lib/cdnImg';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface AdminLivro {
  id: number;
  titulo: string;
  autor: string | null;
  capa: string | null;
  download: string | null;
  link: string | null;
  categoria: string;
  area?: string | null;
  ebookId?: string;
  ebookStatus?: string;
}

export default function BibliotecaAdmin() {
  const navigate = useNavigate();
  const [livros, setLivros] = useState<AdminLivro[]>([]);
  const [ebookMap, setEbookMap] = useState<Map<string, { id: string; status: string }>>(new Map());
  const [loading, setLoading] = useState(true);
  const [formatting, setFormatting] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');

  useEffect(() => {
    const load = async () => {
      const [c, l, e, f, eb] = await Promise.all([
        supabase.from('biblioteca_classicos').select('id,livro,autor,imagem,download,link'),
        supabase.from('biblioteca_lideranca').select('id,livro,autor,imagem,download,link'),
        supabase.from('biblioteca_estudos').select('id,tema,area,capa_livro,download,link'),
        supabase.from('biblioteca_fora_da_toga').select('id,livro,autor,capa_livro,download,link'),
        supabase.from('biblioteca_livros').select('id,titulo,status'),
      ]);

      const all: AdminLivro[] = [];

      c.data?.forEach(r => all.push({
        id: r.id, titulo: r.livro ?? '', autor: r.autor, capa: r.imagem,
        download: r.download, link: r.link, categoria: 'Clássicos',
      }));
      l.data?.forEach(r => all.push({
        id: r.id, titulo: r.livro ?? '', autor: r.autor, capa: r.imagem,
        download: r.download, link: r.link, categoria: 'Liderança',
      }));
      e.data?.forEach(r => all.push({
        id: r.id, titulo: r.tema ?? '', autor: null, capa: r.capa_livro,
        download: r.download, link: r.link, categoria: 'Estudos', area: r.area,
      }));
      f.data?.forEach(r => all.push({
        id: r.id, titulo: r.livro ?? '', autor: r.autor, capa: r.capa_livro,
        download: r.download, link: r.link, categoria: 'Fora da Toga',
      }));

      setLivros(all);

      if (eb.data) {
        const map = new Map<string, { id: string; status: string }>();
        eb.data.forEach(b => map.set(b.titulo.toLowerCase().trim(), { id: b.id, status: b.status }));
        setEbookMap(map);
      }

      setLoading(false);
    };
    load();
  }, []);

  const getEbookInfo = (titulo: string) => {
    return ebookMap.get(titulo.toLowerCase().trim());
  };

  const handleFormat = async (livro: AdminLivro) => {
    if (!livro.download) {
      toast.error('Sem link de download para processar');
      return;
    }

    setFormatting(prev => new Set(prev).add(livro.id));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Faça login primeiro');
        return;
      }

      const { error } = await supabase.functions.invoke('processar-pdf', {
        body: {
          url: livro.download,
          titulo: livro.titulo,
          autor: livro.autor || undefined,
          capa_url: livro.capa || undefined,
        },
      });

      if (error) throw error;
      toast.success(`Formatação iniciada: ${livro.titulo}`);
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setFormatting(prev => {
        const s = new Set(prev);
        s.delete(livro.id);
        return s;
      });
    }
  };

  const filtered = useMemo(() => {
    let list = livros;
    if (filterCat !== 'all') list = list.filter(l => l.categoria === filterCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(l => l.titulo.toLowerCase().includes(q) || l.autor?.toLowerCase().includes(q));
    }
    return list;
  }, [livros, filterCat, search]);

  const cats = ['all', 'Clássicos', 'Liderança', 'Estudos', 'Fora da Toga'];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-card to-secondary px-4 pt-10 pb-6">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white font-medium text-sm px-3 py-1.5 rounded-lg mb-4">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <h1 className="text-2xl font-bold text-white">Biblioteca Admin</h1>
          <p className="text-white/70 text-sm mt-1">{livros.length} livros · Formatar e-books em escala</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar livro..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {cats.map(c => (
            <button
              key={c}
              onClick={() => setFilterCat(c)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${filterCat === c ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
            >
              {c === 'all' ? 'Todos' : c}
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">{filtered.length} resultados</p>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((livro) => {
              const capaUrl = livro.capa ? cdnImg(livro.capa, 200) : '';
              const ebook = getEbookInfo(livro.titulo);
              const isFormatting = formatting.has(livro.id);

              return (
                <div
                  key={`${livro.categoria}-${livro.id}`}
                  className="flex items-stretch rounded-xl bg-card border border-border overflow-hidden"
                >
                  <div className="w-16 flex-shrink-0 relative overflow-hidden">
                    {capaUrl ? (
                      <img src={capaUrl} alt={livro.titulo} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center p-1">
                        <BookOpen className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 px-3 py-2 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground line-clamp-1">{livro.titulo}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{livro.categoria}</span>
                        {livro.area && <span className="text-[10px] text-muted-foreground truncate">{livro.area}</span>}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {ebook ? (
                        <Badge variant={ebook.status === 'ready' ? 'default' : 'secondary'} className="text-[10px]">
                          {ebook.status === 'ready' ? (
                            <><CheckCircle className="w-3 h-3 mr-1" />Pronto</>
                          ) : ebook.status === 'processing' ? (
                            <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Processando</>
                          ) : (
                            ebook.status
                          )}
                        </Badge>
                      ) : livro.download ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 px-2"
                          disabled={isFormatting}
                          onClick={() => handleFormat(livro)}
                        >
                          {isFormatting ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <><Zap className="w-3 h-3 mr-1" />Formatar</>
                          )}
                        </Button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Sem PDF</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
