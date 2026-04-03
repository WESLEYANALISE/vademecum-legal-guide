import { ArrowLeft } from 'lucide-react';

interface LeitorWebViewProps {
  url: string;
  titulo: string;
  onClose: () => void;
}

const LeitorWebView = ({ url, titulo, onClose }: LeitorWebViewProps) => {
  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
        <button
          onClick={onClose}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <p className="text-sm font-semibold text-foreground truncate flex-1">{titulo}</p>
      </div>
      <iframe
        src={url}
        className="flex-1 w-full border-0"
        allowFullScreen
        title={titulo}
      />
    </div>
  );
};

export default LeitorWebView;
