import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Loader2, Search } from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { toast } from 'sonner';

interface OcrScannerProps {
  open: boolean;
  onClose: () => void;
  onTextExtracted: (text: string) => void;
}

const OcrScanner = ({ open, onClose, onTextExtracted }: OcrScannerProps) => {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    const url = URL.createObjectURL(file);
    setPreview(url);
    setProcessing(true);
    setProgress(0);

    try {
      const worker = await createWorker('por', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') setProgress(Math.round(m.progress * 100));
        },
      });
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      if (text.trim()) {
        onTextExtracted(text.trim());
        toast.success('Texto extraído com sucesso!');
        onClose();
      } else {
        toast.error('Não foi possível extrair texto da imagem');
      }
    } catch (e) {
      toast.error('Erro ao processar imagem');
      console.error(e);
    } finally {
      setProcessing(false);
      setPreview(null);
    }
  }, [onTextExtracted, onClose]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-6"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-muted">
          <X className="w-5 h-5" />
        </button>

        <Camera className="w-12 h-12 text-primary mb-4" />
        <h2 className="font-display text-xl font-bold text-foreground mb-2">Scanner OCR</h2>
        <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
          Fotografe ou selecione uma imagem de um livro de lei para extrair o texto automaticamente.
        </p>

        {preview && (
          <div className="w-48 h-48 rounded-xl overflow-hidden border border-border mb-4">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}

        {processing ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Processando... {progress}%</p>
            <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" /> Tirar Foto
            </button>
            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const f = (e.target as HTMLInputElement).files?.[0];
                  if (f) handleFile(f);
                };
                input.click();
              }}
              className="w-full py-3 rounded-xl bg-muted text-foreground font-semibold flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" /> Selecionar da Galeria
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default OcrScanner;
