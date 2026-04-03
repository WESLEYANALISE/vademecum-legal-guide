import { X } from 'lucide-react';

interface LeitorWebViewProps {
  url: string;
  titulo: string;
  onClose: () => void;
}

const LeitorWebView = ({ url, titulo, onClose }: LeitorWebViewProps) => {
  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border">
        <p className="text-sm font-semibold text-foreground truncate flex-1 mr-3">{titulo}</p>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-destructive/20 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
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
