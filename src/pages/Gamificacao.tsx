import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gamepad2, Skull, Grid3X3, Hash, ChevronRight, Search, Loader2, ArrowLeftCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import HangmanGame from '@/components/gamificacao/HangmanGame';
import WordSearchGame from '@/components/gamificacao/WordSearchGame';
import CrosswordGame from '@/components/gamificacao/CrosswordGame';
import ArtigoTrail from '@/components/gamificacao/ArtigoTrail';

import { LEIS_COMPACTAS as LEIS } from '@/data/leisCatalog';

type TipoJogo = 'forca' | 'caca-palavras' | 'cruzadas';
type View = 'menu' | 'select-lei' | 'select-artigo' | 'playing';

const JOGOS = [
  { id: 'forca' as TipoJogo, label: 'Jogo da Forca', desc: 'Adivinhe o termo jurídico', icon: Skull },
  { id: 'caca-palavras' as TipoJogo, label: 'Caça-Palavras', desc: 'Encontre termos escondidos na grade', icon: Grid3X3 },
  { id: 'cruzadas' as TipoJogo, label: 'Palavras Cruzadas', desc: 'Complete a cruzada jurídica', icon: Hash },
];

const Gamificacao = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<View>('menu');
  const [selectedJogo, setSelectedJogo] = useState<TipoJogo>('forca');
  const [selectedLei, setSelectedLei] = useState<typeof LEIS[0] | null>(null);
  const [artigos, setArtigos] = useState<{ numero: string; rotulo?: string; caput?: string }[]>([]);
  const [selectedArtigo, setSelectedArtigo] = useState('');
  const [loadingArtigos, setLoadingArtigos] = useState(false);
  const [loadingGame, setLoadingGame] = useState(false);
  const [searchArtigo, setSearchArtigo] = useState('');
  const [gameData, setGameData] = useState<any>(null);
  const [error, setError] = useState('');

  const loadArtigos = async (tabela: string) => {
    setLoadingArtigos(true);
    const { data } = await supabase
      .from(tabela as any)
      .select('numero, rotulo, caput')
      .order('ordem_numero', { ascending: true });
    setArtigos((data as any[]) || []);
    setLoadingArtigos(false);
  };

  const handleSelectJogo = (tipo: TipoJogo) => {
    setSelectedJogo(tipo);
    setView('select-lei');
  };

  const handleSelectLei = (lei: typeof LEIS[0]) => {
    setSelectedLei(lei);
    loadArtigos(lei.tabela);
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
      generateGame(selectedLei.tabela, numero, selectedJogo);
    }
  };

  const handleNewGame = () => {
    if (selectedLei) {
      generateGame(selectedLei.tabela, selectedArtigo, selectedJogo);
    }
  };

  const handleBack = () => {
    if (view === 'playing') setView('select-artigo');
    else if (view === 'select-artigo') setView('select-lei');
    else if (view === 'select-lei') setView('menu');
    else navigate(-1);
  };

  const filteredArtigos = useMemo(() => {
    if (!searchArtigo.trim()) return artigos;
    const q = searchArtigo.toLowerCase();
    return artigos.filter(
      a =>
        a.numero.toLowerCase().includes(q) ||
        (a.rotulo && a.rotulo.toLowerCase().includes(q)) ||
        (a.caput && a.caput.toLowerCase().includes(q))
    );
  }, [artigos, searchArtigo]);

  const jogoInfo = JOGOS.find(j => j.id === selectedJogo);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-primary via-accent to-primary overflow-hidden px-4 pt-10 pb-8 sm:px-6">
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-primary-foreground/10" />
        <Gamepad2 className="absolute top-5 right-5 w-10 h-10 text-primary-foreground/25 rotate-12" />

        <div className="relative max-w-2xl mx-auto z-10">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white font-medium transition-all text-sm px-3 py-1.5 rounded-lg mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <h1 className="font-display text-2xl text-primary-foreground font-bold">
            {view === 'menu' && 'Gamificação'}
            {view === 'select-lei' && jogoInfo?.label}
            {view === 'select-artigo' && selectedLei?.nome}
            {view === 'playing' && `${jogoInfo?.label} — Art. ${selectedArtigo}`}
          </h1>
          <p className="text-primary-foreground/70 text-sm mt-1">
            {view === 'menu' && 'Aprenda Direito jogando'}
            {view === 'select-lei' && 'Escolha a legislação'}
            {view === 'select-artigo' && 'Escolha o artigo para jogar'}
            {view === 'playing' && selectedLei?.sigla}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
        {/* Menu - Game selection */}
        {view === 'menu' && (
          <div className="flex flex-col gap-2">
            {JOGOS.map((jogo, i) => {
              const Icon = jogo.icon;
              return (
                <motion.button
                  key={jogo.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => handleSelectJogo(jogo.id)}
                  className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/40 transition-all group"
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-md">
                    <Icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-display text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {jogo.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                      {jogo.desc}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Law selection */}
        {view === 'select-lei' && (
          <div className="flex flex-col gap-2">
            {LEIS.map((lei, i) => (
              <motion.button
                key={lei.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => handleSelectLei(lei)}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border hover:border-primary/40 transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-display font-bold text-primary">{lei.sigla}</span>
                </div>
                <p className="flex-1 text-left text-sm font-body text-foreground group-hover:text-primary transition-colors">
                  {lei.nome}
                </p>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </motion.button>
            ))}
          </div>
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
