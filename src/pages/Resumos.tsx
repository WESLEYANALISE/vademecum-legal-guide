import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, FileText, Layers, ChevronRight, Search, Loader2, BookOpen, Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import ResumoCornellView from '@/components/estudar/ResumoCornellView';
import ResumoFeynmanView from '@/components/estudar/ResumoFeynmanView';

type Categoria = 'codigos' | 'estatutos';

const CATEGORIAS: { id: Categoria; label: string }[] = [
  { id: 'codigos', label: 'Códigos' },
  { id: 'estatutos', label: 'Estatutos' },
];

const LEIS: Record<Categoria, { id: string; nome: string; sigla: string; tabela: string }[]> = {
  codigos: [
    { id: 'cf88', nome: 'Constituição Federal', sigla: 'CF/88', tabela: 'CF88_CONSTITUICAO_FEDERAL' },
    { id: 'cp', nome: 'Código Penal', sigla: 'CP', tabela: 'CP_CODIGO_PENAL' },
    { id: 'cc', nome: 'Código Civil', sigla: 'CC', tabela: 'CC_CODIGO_CIVIL' },
    { id: 'cpc', nome: 'Código de Processo Civil', sigla: 'CPC', tabela: 'CPC_CODIGO_PROCESSO_CIVIL' },
    { id: 'cpp', nome: 'Código de Processo Penal', sigla: 'CPP', tabela: 'CPP_CODIGO_PROCESSO_PENAL' },
    { id: 'ctn', nome: 'Código Tributário Nacional', sigla: 'CTN', tabela: 'CTN_CODIGO_TRIBUTARIO_NACIONAL' },
    { id: 'cdc', nome: 'Código de Defesa do Consumidor', sigla: 'CDC', tabela: 'CDC_CODIGO_DEFESA_CONSUMIDOR' },
    { id: 'clt', nome: 'CLT', sigla: 'CLT', tabela: 'CLT_CONSOLIDACAO_LEIS_TRABALHO' },
    { id: 'ctb', nome: 'Código de Trânsito', sigla: 'CTB', tabela: 'CTB_CODIGO_TRANSITO_BRASILEIRO' },
    { id: 'ce', nome: 'Código Eleitoral', sigla: 'CE', tabela: 'CE_CODIGO_ELEITORAL' },
    { id: 'cflor', nome: 'Código Florestal', sigla: 'CFLOR', tabela: 'CFLOR_CODIGO_FLORESTAL' },
    { id: 'ccom', nome: 'Código Comercial', sigla: 'CCOM', tabela: 'CCOM_CODIGO_COMERCIAL' },
    { id: 'cpm', nome: 'Código Penal Militar', sigla: 'CPM', tabela: 'CPM_CODIGO_PENAL_MILITAR' },
    { id: 'cppm', nome: 'Código de Processo Penal Militar', sigla: 'CPPM', tabela: 'CPPM_CODIGO_PROCESSO_PENAL_MILITAR' },
    { id: 'cmin', nome: 'Código de Minas', sigla: 'CMIN', tabela: 'CMIN_CODIGO_MINAS' },
    { id: 'cagua', nome: 'Código de Águas', sigla: 'CAGUA', tabela: 'CAGUA_CODIGO_AGUAS' },
    { id: 'ctel', nome: 'Código de Telecomunicações', sigla: 'CTEL', tabela: 'CTEL_CODIGO_TELECOMUNICACOES' },
  ],
  estatutos: [
    { id: 'eca', nome: 'Estatuto da Criança e Adolescente', sigla: 'ECA', tabela: 'ECA_ESTATUTO_CRIANCA_ADOLESCENTE' },
    { id: 'ei', nome: 'Estatuto do Idoso', sigla: 'EI', tabela: 'EI_ESTATUTO_IDOSO' },
    { id: 'epd', nome: 'Estatuto da Pessoa com Deficiência', sigla: 'EPD', tabela: 'EPD_ESTATUTO_PESSOA_DEFICIENCIA' },
    { id: 'eoab', nome: 'Estatuto da OAB', sigla: 'EOAB', tabela: 'EOAB_ESTATUTO_OAB' },
    { id: 'eterra', nome: 'Estatuto da Terra', sigla: 'ETERRA', tabela: 'ETERRA_ESTATUTO_TERRA' },
    { id: 'ec', nome: 'Estatuto da Cidade', sigla: 'EC', tabela: 'EC_ESTATUTO_CIDADE' },
    { id: 'ed', nome: 'Estatuto do Desarmamento', sigla: 'ED', tabela: 'ED_ESTATUTO_DESARMAMENTO' },
    { id: 'et', nome: 'Estatuto do Torcedor', sigla: 'ET', tabela: 'ET_ESTATUTO_TORCEDOR' },
    { id: 'ej', nome: 'Estatuto da Juventude', sigla: 'EJ', tabela: 'EJ_ESTATUTO_JUVENTUDE' },
    { id: 'em', nome: 'Estatuto dos Militares', sigla: 'EM', tabela: 'EM_ESTATUTO_MILITARES' },
    { id: 'eme', nome: 'Estatuto da Microempresa', sigla: 'EME', tabela: 'EME_ESTATUTO_MICROEMPRESA' },
    { id: 'eir', nome: 'Estatuto da Igualdade Racial', sigla: 'EIR', tabela: 'EIR_ESTATUTO_IGUALDADE_RACIAL' },
    { id: 'eind', nome: 'Estatuto do Índio', sigla: 'EIND', tabela: 'EIND_ESTATUTO_INDIO' },
    { id: 'eref', nome: 'Estatuto do Refugiado', sigla: 'EREF', tabela: 'EREF_ESTATUTO_REFUGIADO' },
    { id: 'emig', nome: 'Estatuto da Migração', sigla: 'EMIG', tabela: 'EMIG_ESTATUTO_MIGRACAO' },
    { id: 'emus', nome: 'Estatuto dos Museus', sigla: 'EMUS', tabela: 'EMUS_ESTATUTO_MUSEUS' },
    { id: 'emet', nome: 'Estatuto da Metrópole', sigla: 'EMET', tabela: 'EMET_ESTATUTO_METROPOLE' },
    { id: 'epc', nome: 'Estatuto da Pessoa com Câncer', sigla: 'EPC', tabela: 'EPC_ESTATUTO_PESSOA_CANCER' },
  ],
};

type Tipo = 'cornell' | 'feynman';
type LeiItem = { id: string; nome: string; sigla: string; tabela: string };
type View = 'menu' | 'select-lei' | 'select-artigo' | 'resultado';

const Resumos = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramTabela = searchParams.get('tabela');
  const paramArtigo = searchParams.get('artigo');

  // If we have tabela+artigo from query params, we're in "single article" mode
  const singleArticleMode = !!(paramTabela && paramArtigo);

  // Find the lei matching the tabela param
  const paramLei = singleArticleMode
    ? [...LEIS.codigos, ...LEIS.estatutos].find(l => l.tabela === paramTabela) || null
    : null;

  const [view, setView] = useState<View>(singleArticleMode ? 'menu' : 'menu');
  const [tipo, setTipo] = useState<Tipo>('cornell');
  const [selectedLei, setSelectedLei] = useState<LeiItem | null>(paramLei);
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria>('codigos');
  const [artigos, setArtigos] = useState<{ numero: string; rotulo?: string; caput?: string }[]>([]);
  const [selectedArtigo, setSelectedArtigo] = useState(paramArtigo || '');
  const [loadingArtigos, setLoadingArtigos] = useState(false);
  const [searchArtigo, setSearchArtigo] = useState('');
  const [generating, setGenerating] = useState(false);
  const [resumoData, setResumoData] = useState<any>(null);

  const handleSelectTipo = (t: Tipo) => {
    setTipo(t);
    if (singleArticleMode && paramLei) {
      // Skip lei/artigo selection — go directly to generating
      setSelectedLei(paramLei);
      setSelectedArtigo(paramArtigo!);
      setGenerating(true);
      setView('resultado');
      supabase.functions.invoke('gerar-resumo', {
        body: { tabela_nome: paramLei.tabela, artigo_numero: paramArtigo, tipo: t },
      }).then(({ data, error }) => {
        if (error) { console.error(error); setResumoData(null); }
        else setResumoData(data.data);
      }).catch(e => { console.error(e); setResumoData(null); })
        .finally(() => setGenerating(false));
    } else {
      setView('select-lei');
    }
  };

  const loadArtigos = async (tabela: string) => {
    setLoadingArtigos(true);
    const { data } = await supabase
      .from(tabela as any)
      .select('numero, rotulo, caput')
      .order('ordem_numero', { ascending: true });
    setArtigos((data as any[]) || []);
    setLoadingArtigos(false);
  };

  const handleSelectLei = (lei: LeiItem) => {
    setSelectedLei(lei);
    loadArtigos(lei.tabela);
    setView('select-artigo');
  };

  const handleSelectArtigo = async (numero: string) => {
    setSelectedArtigo(numero);
    setGenerating(true);
    setView('resultado');

    try {
      const { data, error } = await supabase.functions.invoke('gerar-resumo', {
        body: { tabela_nome: selectedLei!.tabela, artigo_numero: numero, tipo },
      });
      if (error) throw error;
      setResumoData(data.data);
    } catch (e: any) {
      console.error(e);
      setResumoData(null);
    } finally {
      setGenerating(false);
    }
  };

  const handleBack = () => {
    if (view === 'resultado' && singleArticleMode) { setView('menu'); setResumoData(null); }
    else if (view === 'resultado') { setView('select-artigo'); setResumoData(null); }
    else if (view === 'select-artigo') setView('select-lei');
    else if (view === 'select-lei') setView('menu');
    else navigate(-1);
  };

  const filteredArtigos = useMemo(() => {
    if (!searchArtigo) return artigos;
    const q = searchArtigo.toLowerCase();
    return artigos.filter(a =>
      a.numero.toLowerCase().includes(q) ||
      a.rotulo?.toLowerCase().includes(q) ||
      a.caput?.toLowerCase().includes(q)
    );
  }, [artigos, searchArtigo]);

  const headerTitle = view === 'menu' ? 'Resumos' :
    view === 'select-lei' ? `Resumo ${tipo === 'cornell' ? 'Cornell' : 'Feynman'}` :
    view === 'select-artigo' ? selectedLei?.sigla || '' :
    selectedArtigo;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-primary via-accent to-primary overflow-hidden px-4 pt-10 pb-8 sm:px-6">
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-primary-foreground/10" />
        <FileText className="absolute top-5 right-5 w-10 h-10 text-primary-foreground/25 rotate-12" />
        <div className="relative max-w-2xl mx-auto z-10">
          <button onClick={handleBack}
            className="flex items-center gap-2 bg-primary-foreground/15 hover:bg-primary-foreground/25 backdrop-blur-sm text-primary-foreground font-medium transition-all text-sm mb-4 px-3 py-1.5 rounded-lg">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <h1 className="font-display text-2xl text-primary-foreground font-bold">{headerTitle}</h1>
          <p className="text-primary-foreground/80 text-sm mt-1 font-semibold">
            {view === 'menu' && (singleArticleMode
              ? `${paramArtigo} — Escolha o tipo de resumo`
              : 'Escolha o tipo de resumo para estudar')}
            {view === 'select-lei' && 'Selecione a legislação'}
            {view === 'select-artigo' && 'Selecione o artigo'}
            {view === 'resultado' && (tipo === 'cornell' ? 'Método Cornell' : 'Técnica Feynman')}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-3 sm:px-6 py-4">
        {/* Menu: choose type */}
        {view === 'menu' && (
          <div className="grid grid-cols-1 gap-3">
            <motion.button initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => handleSelectTipo('cornell')}
              className="flex items-start gap-4 p-5 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all group text-left">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-md">
                <Layers className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-display text-base font-bold text-foreground group-hover:text-primary transition-colors">Resumo Cornell</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Divide em 3 áreas: palavras-chave e perguntas (esquerda), anotações detalhadas (direita) e resumo geral (rodapé). Ideal para estudo ativo e revisão.
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary mt-1 shrink-0" />
            </motion.button>

            <motion.button initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
              onClick={() => handleSelectTipo('feynman')}
              className="flex items-start gap-4 p-5 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all group text-left">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center shrink-0 shadow-md">
                <Brain className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-display text-base font-bold text-foreground group-hover:text-primary transition-colors">Resumo Feynman</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Explica o conceito em linguagem simples, como se ensinasse a uma criança. Identifica lacunas e cria analogias memoráveis.
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary mt-1 shrink-0" />
            </motion.button>
          </div>
        )}

        {/* Select law */}
        {view === 'select-lei' && (
          <div>
            {/* Category tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {CATEGORIAS.map(cat => (
                <button key={cat.id}
                  onClick={() => setSelectedCategoria(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                    selectedCategoria === cat.id
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                  }`}>
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              {LEIS[selectedCategoria].map((lei, i) => (
                <motion.button key={lei.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  onClick={() => handleSelectLei(lei)}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border hover:border-primary/40 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{lei.nome}</p>
                    <p className="text-[10px] text-muted-foreground">{lei.sigla}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Select article */}
        {view === 'select-artigo' && (
          <div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar artigo..." value={searchArtigo} onChange={e => setSearchArtigo(e.target.value)}
                className="pl-9 h-10 rounded-xl text-sm" />
            </div>
            {loadingArtigos ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pb-6">
                {filteredArtigos.map((art, i) => (
                  <motion.button key={art.numero} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    onClick={() => handleSelectArtigo(art.numero)}
                    className="w-full text-left rounded-2xl bg-card hover:bg-secondary/60 transition-all group flex overflow-hidden min-h-[72px]">
                    <div className="w-1.5 bg-primary rounded-l-2xl shrink-0" />
                    <div className="flex items-center gap-3 p-3 flex-1 min-w-0">
                      <span className="text-[15px] font-display font-bold text-primary min-w-[56px]">{art.numero}</span>
                      <p className="text-[13px] leading-relaxed text-foreground/80 line-clamp-2 flex-1">{art.rotulo || art.caput?.slice(0, 100)}</p>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Result */}
        {view === 'resultado' && (
          generating ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Gerando resumo {tipo === 'cornell' ? 'Cornell' : 'Feynman'}...</p>
            </div>
          ) : resumoData ? (
            tipo === 'cornell' ? (
              <ResumoCornellView data={resumoData} leiNome={selectedLei?.nome || ''} artigoNumero={selectedArtigo} />
            ) : (
              <ResumoFeynmanView data={resumoData} leiNome={selectedLei?.nome || ''} artigoNumero={selectedArtigo} />
            )
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-destructive">Erro ao gerar resumo. Tente novamente.</p>
              <button onClick={() => handleSelectArtigo(selectedArtigo)} className="mt-3 text-sm text-primary underline">Tentar novamente</button>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Resumos;
