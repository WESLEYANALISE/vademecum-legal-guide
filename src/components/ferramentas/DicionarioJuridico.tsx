import { useState, useRef, useEffect } from 'react';
import { Search, BookOpenText, X, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

interface DicionarioJuridicoProps {
  open: boolean;
  onClose: () => void;
}

interface Termo {
  termo: string;
  definicao: string;
}

// Dicionário local de termos jurídicos mais comuns
const TERMOS_LOCAIS: Termo[] = [
  { termo: 'Ab initio', definicao: 'Desde o início. Expressão que indica que algo é considerado desde sua origem, como se nunca tivesse existido.' },
  { termo: 'Ação', definicao: 'Direito de provocar o Poder Judiciário para obter uma decisão sobre uma pretensão. É o instrumento pelo qual se exerce o direito de acesso à justiça.' },
  { termo: 'Acórdão', definicao: 'Decisão proferida por tribunal, resultado do julgamento colegiado. Diferencia-se da sentença, que é decisão de juiz singular.' },
  { termo: 'Ad hoc', definicao: 'Para isso, para este caso específico. Designa algo feito para uma finalidade particular.' },
  { termo: 'Agravo', definicao: 'Recurso interposto contra decisões interlocutórias (que não põem fim ao processo). Pode ser de instrumento ou interno.' },
  { termo: 'Alvará', definicao: 'Documento judicial ou administrativo que autoriza a prática de determinado ato ou confere um direito.' },
  { termo: 'Amicus curiae', definicao: 'Amigo da corte. Pessoa ou entidade que, sem ser parte no processo, é admitida para fornecer subsídios ao julgamento.' },
  { termo: 'Animus', definicao: 'Intenção, vontade. Elemento subjetivo considerado em diversos institutos jurídicos (animus possidendi, animus necandi).' },
  { termo: 'Apelação', definicao: 'Recurso cabível contra sentença, visando sua reforma ou anulação pelo tribunal competente.' },
  { termo: 'Caput', definicao: 'Cabeça. Refere-se ao texto principal de um artigo de lei, antes de seus incisos, alíneas e parágrafos.' },
  { termo: 'Coisa julgada', definicao: 'Qualidade da decisão judicial contra a qual não cabe mais recurso, tornando-a definitiva e imutável.' },
  { termo: 'Competência', definicao: 'Medida da jurisdição. Define os limites dentro dos quais um juiz ou tribunal pode exercer legitimamente a jurisdição.' },
  { termo: 'Contraditório', definicao: 'Princípio constitucional que garante às partes o direito de serem ouvidas e de se manifestarem sobre todos os atos processuais.' },
  { termo: 'Culpa', definicao: 'Conduta voluntária que produz resultado ilícito não desejado, mas previsível. Divide-se em negligência, imprudência e imperícia.' },
  { termo: 'Data venia', definicao: 'Com a devida licença. Expressão de cortesia usada ao discordar respeitosamente de uma opinião ou decisão.' },
  { termo: 'De cujus', definicao: 'Pessoa falecida de cuja sucessão se trata. Termo usado em direito das sucessões.' },
  { termo: 'Dolo', definicao: 'Vontade consciente e livre de praticar um ato ilícito ou de assumir o risco de produzi-lo.' },
  { termo: 'Ementa', definicao: 'Resumo de uma decisão judicial ou de um projeto de lei, apresentando os pontos essenciais do conteúdo.' },
  { termo: 'Erga omnes', definicao: 'Contra todos. Efeito que se aplica a todas as pessoas, não apenas às partes envolvidas.' },
  { termo: 'Ex officio', definicao: 'Por dever do ofício. Ato praticado pelo juiz por iniciativa própria, sem provocação das partes.' },
  { termo: 'Habeas corpus', definicao: 'Remédio constitucional para proteger o direito de locomoção contra ilegalidade ou abuso de poder.' },
  { termo: 'Habeas data', definicao: 'Ação constitucional para garantir acesso a informações pessoais constantes em registros públicos ou para retificá-las.' },
  { termo: 'Impetrar', definicao: 'Requerer judicialmente, especialmente em relação a mandado de segurança, habeas corpus e habeas data.' },
  { termo: 'In dubio pro reo', definicao: 'Na dúvida, a favor do réu. Princípio penal que determina a absolvição quando houver dúvida sobre a autoria ou materialidade do crime.' },
  { termo: 'Incidente', definicao: 'Questão secundária que surge no curso de um processo e que deve ser resolvida antes do julgamento do mérito.' },
  { termo: 'Jurisprudência', definicao: 'Conjunto de decisões judiciais reiteradas sobre determinada matéria. Serve como fonte do Direito e orientação para decisões futuras.' },
  { termo: 'Lide', definicao: 'Conflito de interesses qualificado por uma pretensão resistida. É o objeto do processo judicial.' },
  { termo: 'Liminar', definicao: 'Decisão provisória concedida no início do processo para evitar dano irreparável ou de difícil reparação.' },
  { termo: 'Litisconsórcio', definicao: 'Pluralidade de partes (autores ou réus) em um mesmo processo, por compartilharem interesse comum na causa.' },
  { termo: 'Mandado de segurança', definicao: 'Ação constitucional para proteger direito líquido e certo contra ato ilegal ou abusivo de autoridade pública.' },
  { termo: 'Mérito', definicao: 'Questão principal do processo; o direito material discutido na causa, em oposição às questões processuais.' },
  { termo: 'Nulidade', definicao: 'Vício que torna um ato jurídico inválido, podendo ser absoluta (insanável) ou relativa (sanável).' },
  { termo: 'Ônus da prova', definicao: 'Encargo atribuído à parte de demonstrar a veracidade dos fatos que alega. Geralmente, cabe a quem alega provar.' },
  { termo: 'Periculum in mora', definicao: 'Perigo na demora. Risco de que o tempo necessário ao processo cause dano irreparável ao direito da parte.' },
  { termo: 'Prescrição', definicao: 'Perda do direito de ação pelo decurso do tempo previsto em lei. Extingue a pretensão, não o direito em si.' },
  { termo: 'Recurso', definicao: 'Meio processual pelo qual a parte inconformada com uma decisão judicial busca sua reforma ou anulação.' },
  { termo: 'Sentença', definicao: 'Pronunciamento do juiz que resolve o mérito da causa ou extingue o processo sem resolução de mérito.' },
  { termo: 'Súmula', definicao: 'Enunciado que resume a jurisprudência predominante de um tribunal sobre determinada matéria jurídica.' },
  { termo: 'Súmula vinculante', definicao: 'Enunciado do STF com efeito obrigatório para todos os órgãos do Judiciário e da administração pública.' },
  { termo: 'Tipicidade', definicao: 'Adequação da conduta ao tipo penal previsto em lei. É elemento essencial do crime no Direito Penal.' },
  { termo: 'Trânsito em julgado', definicao: 'Momento em que a decisão judicial se torna definitiva, por não caber mais recurso contra ela.' },
  { termo: 'Tutela antecipada', definicao: 'Decisão provisória que antecipa os efeitos do julgamento final quando há probabilidade do direito e perigo de dano.' },
];

const DicionarioJuridico = ({ open, onClose }: DicionarioJuridicoProps) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const filtered = query.trim().length < 1
    ? TERMOS_LOCAIS
    : TERMOS_LOCAIS.filter(t =>
        t.termo.toLowerCase().includes(query.toLowerCase()) ||
        t.definicao.toLowerCase().includes(query.toLowerCase())
      );

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0">
        <SheetHeader className="px-5 pt-5 pb-3">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <BookOpenText className="w-5 h-5 text-primary" />
            Dicionário Jurídico
          </SheetTitle>
        </SheetHeader>

        <div className="px-5 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar termo jurídico..."
              className="pl-9 pr-9 h-10 rounded-xl bg-secondary/60 border-border/60"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-5 pb-8" style={{ maxHeight: 'calc(85vh - 130px)' }}>
          {filtered.length === 0 ? (
            <div className="text-center py-10">
              <BookOpenText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum termo encontrado para "{query}"</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((t, i) => (
                <div key={i} className="p-3 rounded-xl bg-card border border-border/60">
                  <h3 className="font-display text-sm font-bold text-primary mb-1">{t.termo}</h3>
                  <p className="text-xs text-foreground/80 leading-relaxed">{t.definicao}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DicionarioJuridico;
