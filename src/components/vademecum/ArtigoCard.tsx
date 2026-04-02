import { Scale, ChevronRight } from 'lucide-react';
import type { ArtigoLei } from '@/data/mockData';

interface ArtigoCardProps {
  artigo: ArtigoLei;
  index: number;
  onClick: () => void;
  highlightText?: (text: string) => React.ReactNode;
  isHighlighted?: boolean;
}

const normalizeArtigoLabel = (value: string) => value
  .replace(/°/g, 'º')
  .replace(/^Art\.\s*(\d+)o\b/i, 'Art. $1º')
  .replace(/^Art\.\s*(\d+)-([A-Z])\b/i, (_, numero, sufixo) => {
    const artigoNumero = Number(numero);
    return artigoNumero >= 1 && artigoNumero <= 9
      ? `Art. ${artigoNumero}º-${String(sufixo).toUpperCase()}`
      : `Art. ${artigoNumero}-${String(sufixo).toUpperCase()}`;
  })
  .replace(/^Art\.\s*([1-9])$/i, 'Art. $1º');

const ArtigoCard = ({ artigo, index, onClick, highlightText, isHighlighted }: ArtigoCardProps) => {
  const displayNumero = normalizeArtigoLabel(artigo.numero);

  const lines = artigo.caput.split('\n').filter(l => l.trim() !== '');
  let previewText = artigo.caput;
  if (lines.length > 0) {
    const first = lines[0];
    const isNomen = first.replace(/\s*\([^)]*\)\s*/g, '').trim().length < 100 && /^[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÚÇ]/.test(first) && !/^(Art\.|§|Parágrafo|[IVXLC]+\s*[-–.]|[a-z]\))/i.test(first);
    previewText = isNomen && lines.length > 1 ? lines[1] : first;
  }
  previewText = previewText.replace(/\s*\((?:Redação|Incluído|Revogado|Acrescido|Alterado|Vide|Regulamento)[^)]*\)/gi, '');
  
  const isRevogado = previewText.trim().length === 0 && artigo.caput.trim().length > 0;
  if (isRevogado) {
    previewText = artigo.caput.trim();
  }
  const renderCaput = highlightText ? highlightText(previewText) : previewText;

  return (
    <button
      id={`artigo-${artigo.id}`}
      onClick={onClick}
      className={`w-full text-left rounded-2xl bg-card hover:bg-secondary/60 group flex overflow-hidden min-h-[82px] transition-all duration-500 ${isHighlighted ? 'ring-2 ring-primary shadow-[0_0_20px_4px_hsl(var(--primary)/0.3)]' : ''}`}
    >
      <div className="w-1.5 bg-primary rounded-l-2xl shrink-0" />
      
      <div className="flex items-center gap-3 p-4 flex-1 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
          <Scale className="w-4 h-4 text-primary-light" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-display text-[15px] font-bold text-primary-light mb-0.5">
            {displayNumero}
          </h4>
          <p className={`text-[13px] leading-relaxed line-clamp-2 ${isRevogado ? 'text-purple-300 italic' : 'text-foreground/80'}`}>
            {renderCaput}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 mt-3 transition-colors" />
      </div>
    </button>
  );
};

export default ArtigoCard;
