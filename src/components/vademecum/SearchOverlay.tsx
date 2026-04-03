import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Hash, Tag, Camera } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';
import OcrScanner from './OcrScanner';

import { LEIS_CATALOG } from '@/data/leisCatalog';

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  onSelectLei: (lei: { tipo: string; leiId: string; nome: string; descricao: string; tabela_nome: string; artigoNumero?: string }) => void;
}

type SearchMode = 'lei' | 'numero';

const SearchOverlay = ({ open, onClose, onSelectLei }: SearchOverlayProps) => {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('lei');
  const [ocrOpen, setOcrOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  // Fuzzy search for leis (includes tags)
  const filteredLeis = useFuzzySearch(LEIS_CATALOG, query, {
    keys: ['nome', 'sigla', 'descricao', 'tags'],
    threshold: 0.35,
    limit: 20,
  });

  // Fuzzy search for leis by number (descricao contains "Lei nº X.XXX/YYYY")
  const filteredByNumero = useFuzzySearch(LEIS_CATALOG, mode === 'numero' ? query : '', {
    keys: ['descricao', 'sigla', 'nome'],
    threshold: 0.3,
    limit: 20,
  });

  // Get matching tags for a lei given the current query
  const getMatchingTags = (tags?: string[]) => {
    if (!tags || !query || query.length < 2) return [];
    const q = query.toLowerCase();
    return tags.filter(t => t.toLowerCase().includes(q)).slice(0, 3);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[49] bg-black/50 backdrop-blur-sm"
        />
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed z-50 inset-x-0 bottom-0 top-8 bg-background flex flex-col rounded-t-3xl lg:top-[5%] lg:max-w-[800px] lg:mx-auto lg:rounded-t-2xl lg:shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={mode === 'numero' ? 'Digite o nº da lei (ex: 8.078, 13.105)...' : 'Pesquise por nome, sigla ou tema...'}
                className="pl-9 h-10 bg-muted border-none text-sm"
              />
            </div>
            <button
              onClick={() => setOcrOpen(true)}
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0"
              title="Scanner OCR"
            >
              <Camera className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-2 px-4 py-3">
            <button
              onClick={() => setMode('lei')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'lei'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <Tag className="w-4 h-4" />
              Palavra-chave
            </button>
            <button
              onClick={() => setMode('numero')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'numero'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <Hash className="w-4 h-4" />
              Nº da Lei
            </button>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto px-4 pb-6">
            {mode === 'lei' && (
              <div className="space-y-2">
                {filteredLeis.map((lei) => {
                  const matchedTags = getMatchingTags(lei.tags);
                  return (
                    <button
                      key={lei.id}
                      onClick={() => {
                        onSelectLei({
                          tipo: lei.tipo,
                          leiId: lei.id,
                          nome: lei.nome,
                          descricao: lei.descricao,
                          tabela_nome: lei.tabela_nome,
                        });
                        onClose();
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/40 transition-all text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">{lei.sigla}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{lei.nome}</p>
                        <p className="text-xs text-muted-foreground truncate">{lei.descricao}</p>
                        {matchedTags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {matchedTags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
                {query.length >= 2 && filteredLeis.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-8">Nenhuma lei encontrada</p>
                )}
              </div>
            )}

            {mode === 'numero' && (
              <div className="space-y-2">
                {query.trim().length < 1 && (
                  <p className="text-center text-muted-foreground text-sm py-8">
                    Digite o número da lei para buscar (ex: 8.078, 13.105)
                  </p>
                )}
                {query.trim().length >= 1 && filteredByNumero.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-8">Nenhuma lei encontrada</p>
                )}
                {query.trim().length >= 1 && filteredByNumero.map((lei) => (
                  <button
                    key={lei.id}
                    onClick={() => {
                      onSelectLei({
                        tipo: lei.tipo,
                        leiId: lei.id,
                        nome: lei.nome,
                        descricao: lei.descricao,
                        tabela_nome: lei.tabela_nome,
                      });
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/40 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">{lei.sigla}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{lei.nome}</p>
                      <p className="text-xs text-muted-foreground truncate">{lei.descricao}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <OcrScanner
          open={ocrOpen}
          onClose={() => setOcrOpen(false)}
          onTextExtracted={(text) => {
            setQuery(text.slice(0, 100));
            setMode('artigo');
          }}
        />
        </>
      )}
    </AnimatePresence>
  );
};

export default SearchOverlay;
