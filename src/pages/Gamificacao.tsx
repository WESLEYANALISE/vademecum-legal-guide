import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gamepad2, Skull, Grid3X3, Hash, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AnimatePresence } from 'framer-motion';
import HangmanGame from '@/components/gamificacao/HangmanGame';
import WordSearchGame from '@/components/gamificacao/WordSearchGame';
import CrosswordGame from '@/components/gamificacao/CrosswordGame';
import ArtigoTrail from '@/components/gamificacao/ArtigoTrail';
import LeiTrail from '@/components/gamificacao/LeiTrail';
import { LEIS_CATALOG, type LeiCatalogItem } from '@/data/leisCatalog';

type TipoJogo = 'forca' | 'caca-palavras' | 'cruzadas';
type View = 'select-lei' | 'select-artigo' | 'playing';

const JOGOS = [
  { id: 'forca' as TipoJogo, label: 'Forca', icon: Skull },
  { id: 'caca-palavras' as TipoJogo, label: 'Caça-Palavras', icon: Grid3X3 },
  { id: 'cruzadas' as TipoJogo, label: 'Cruzadas', icon: Hash },
];

const CATEGORIAS = [
  { id: 'constituicao', label: 'Constituição' },
  { id: 'codigo', label: 'Códigos' },
  { id: 'estatuto', label: 'Estatutos' },
  { id: 'lei-especial', label: 'Leis Especiais' },
  { id: 'previdenciario', label: 'Previdenciário' },
];

const Gamificacao = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<View>('select-lei');
  const [selectedJogo, setSelectedJogo] = useState<TipoJogo>('forca');
  const [selectedCategoria, setSelectedCategoria] = useState('codigo');
  const [selectedLei, setSelectedLei] = useState<LeiCatalogItem | null>(null);
  const [artigos, setArtigos] = useState<{ numero: string; rotulo?: string; caput?: string }[]>([]);
  const [selectedArtigo, setSelectedArtigo] = useState('');
  const [loadingArtigos, setLoadingArtigos] = useState(false);
  const [loadingGame, setLoadingGame] = useState(false);
  const [gameData, setGameData] = useState<any>(null);
  const [error, setError] = useState('');

  const leisFiltradas = useMemo(
    () => LEIS_CATALOG.filter(l => l.tipo === selectedCategoria),
    [selectedCategoria]
  );

  const loadArtigos = async (tabela: string) => {
    setLoadingArtigos(true);
    const { data } = await supabase
      .from(tabela as any)
      .select('numero, rotulo, caput')
      .order('ordem_numero', { ascending: true });
    setArtigos((data as any[]) || []);
    setLoadingArtigos(false);
  };

  const handleSelectLei = (lei: LeiCatalogItem) => {
    setSelectedLei(lei);
    loadArtigos(lei.tabela_nome);
    setView('select-artigo');
  };

  const generateGame = async (tabela: string, artigo: string, tipo: TipoJogo) => {
    setLoadingGame(true);
    setError('');
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const resp = await fetch(
        `https://${projectId}.supabase.co/functions/v1/gerar-jogo`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ tabela, artigo, tipo_jogo: tipo }),
        }
      );
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Erro ao gerar jogo');
      }
      const data = await resp.json();
      setGameData(data);
      setView('playing');
    } catch (e: any) {
      setError(e.message || 'Erro ao gerar jogo');
    } finally {
      setLoadingGame(false);
    }
  };

  const handleSelectArtigo = (numero: string) => {
    setSelectedArtigo(numero);
    if (selectedLei) {
      generateGame(selectedLei.tabela_nome, numero, selectedJogo);
    }
  };

  const handleNewGame = () => {
    if (selectedLei) {
      generateGame(selectedLei.tabela_nome, selectedArtigo, selectedJogo);
    }
  };

  const handleBack = () => {
    if (view === 'playing') setView('select-artigo');
    else if (view === 'select-artigo') setView('select-lei');
    else navigate(-1);
  };

  const jogoInfo = JOGOS.find(j => j.id === selectedJogo);

  const headerTitle = () => {
    if (view === 'playing') return `${jogoInfo?.label} — Art. ${selectedArtigo}`;
    if (view === 'select-artigo') return selectedLei?.nome || '';
    return 'Gamificação';
  };

  const headerSubtitle = () => {
    if (view === 'playing') return selectedLei?.sigla || '';
    if (view === 'select-artigo') return 'Escolha o artigo para jogar';
    return 'Aprenda Direito jogando';
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-primary via-accent to-primary overflow-hidden px-4 pt-10 pb-4 sm:px-6">
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-primary-foreground/10" />
        <Gamepad2 className="absolute top-5 right-5 w-10 h-10 text-primary-foreground/25 rotate-12" />

        <div className="relative max-w-2xl mx-auto z-10">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white font-medium transition-all text-sm px-3 py-1.5 rounded-lg mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <h1 className="font-display text-2xl text-primary-foreground font-bold">
            {headerTitle()}
          </h1>
          <p className="text-primary-foreground/70 text-sm mt-1">
            {headerSubtitle()}
          </p>
        </div>

        {/* Game type tabs - always visible */}
        {view === 'select-lei' && (
          <div className="relative max-w-2xl mx-auto z-10 mt-4">
            <div className="flex gap-1.5 bg-white/10 backdrop-blur-sm rounded-xl p-1">
              {JOGOS.map(jogo => {
                const Icon = jogo.icon;
                const active = selectedJogo === jogo.id;
                return (
                  <button
                    key={jogo.id}
                    onClick={() => setSelectedJogo(jogo.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-display font-bold transition-all ${
                      active
                        ? 'bg-white/25 text-primary-foreground shadow-sm'
                        : 'text-primary-foreground/60 hover:text-primary-foreground/80'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {jogo.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
        {/* Category tabs + Lei trail */}
        {view === 'select-lei' && (
          <>
            <div className="flex flex-wrap gap-2 mb-5">
              {CATEGORIAS.map(cat => {
                const active = selectedCategoria === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoria(cat.id)}
                    className={`text-[11px] px-3 py-1.5 rounded-full font-display font-bold border transition-all ${
                      active
                        ? 'bg-signature/20 border-signature text-signature'
                        : 'bg-card border-border text-muted-foreground hover:border-signature/40 hover:text-foreground'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={selectedCategoria}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <LeiTrail leis={leisFiltradas} onSelect={handleSelectLei} />
              </motion.div>
            </AnimatePresence>
          </>
        )}

        {/* Article selection */}
        {view === 'select-artigo' && (
          <ArtigoTrail
            artigos={artigos}
            loading={loadingArtigos}
            loadingGame={loadingGame}
            onSelect={handleSelectArtigo}
          />
        )}

        {/* Loading game */}
        {loadingGame && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Gerando jogo com IA...</p>
          </div>
        )}

        {/* Error */}
        {error && !loadingGame && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-xl text-sm text-center">
            {error}
            <button onClick={() => setView('select-artigo')} className="block mt-2 text-xs underline mx-auto">
              Tentar outro artigo
            </button>
          </div>
        )}

        {/* Playing */}
        {view === 'playing' && !loadingGame && !error && gameData && (
          <div className="py-2">
            {selectedJogo === 'forca' && (
              <HangmanGame
                palavras={
                  gameData.palavras
                    ? (Array.isArray(gameData.palavras) ? gameData.palavras : [])
                    : [{ palavra: gameData.palavra, dica: gameData.dica }]
                }
                onNewGame={handleNewGame}
              />
            )}
            {selectedJogo === 'caca-palavras' && (
              <WordSearchGame
                palavras={gameData.palavras}
                grade={gameData.grade}
                onNewGame={handleNewGame}
              />
            )}
            {selectedJogo === 'cruzadas' && (
              <CrosswordGame
                tamanho={gameData.tamanho}
                pistas={gameData.pistas}
                onNewGame={handleNewGame}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Gamificacao;
