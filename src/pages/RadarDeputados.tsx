import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DeputadosPanel from '@/components/radar/DeputadosPanel';

const RadarDeputados = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-secondary/60 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display text-base font-bold">Deputados Federais</h1>
          <p className="text-[11px] text-muted-foreground">513 deputados em exercício</p>
        </div>
      </div>
      <div className="p-4">
        <DeputadosPanel searchQuery="" />
      </div>
    </div>
  );
};

export default RadarDeputados;
