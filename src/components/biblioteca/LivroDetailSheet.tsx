import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { BookOpen, Download, ExternalLink } from 'lucide-react';
import type { LivroUnificado } from './LivroCard';
import { cdnImg } from '@/lib/cdnImg';

interface LivroDetailSheetProps {
  livro: LivroUnificado | null;
  open: boolean;
  onClose: () => void;
  onRead: (livro: LivroUnificado) => void;
}

const LivroDetailSheet = ({ livro, open, onClose, onRead }: LivroDetailSheetProps) => {
  if (!livro) return null;

  const capaUrl = livro.capa ? cdnImg(livro.capa, 400) : '';

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto p-0">
        <div className="p-5 space-y-4">
          <SheetHeader className="text-left">
            <SheetTitle className="text-lg">{livro.titulo}</SheetTitle>
            {livro.autor && (
              <SheetDescription>{livro.autor}</SheetDescription>
            )}
          </SheetHeader>

          <div className="flex gap-4">
            {capaUrl && (
              <img
                src={capaUrl}
                alt={livro.titulo}
                className="w-24 h-36 rounded-lg object-cover shadow-md flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              {livro.sinopse && (
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-6">
                  {livro.sinopse}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {livro.categoria}
                </span>
                {livro.area && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">
                    {livro.area}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            {livro.link && (
              <Button className="flex-1 gap-2" onClick={() => onRead(livro)}>
                <BookOpen className="w-4 h-4" />
                Ler agora
              </Button>
            )}
            {livro.download && (
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => window.open(livro.download!, '_blank')}
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            )}
            {!livro.link && !livro.download && (
              <p className="text-xs text-muted-foreground">Nenhum link disponível</p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default LivroDetailSheet;
