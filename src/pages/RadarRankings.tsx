import { ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import RankingPanel from '@/components/radar/RankingPanel';

const RadarRankings = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-secondary/60 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display text-base font-bold">Rankings</h1>
          <p className="text-[11px] text-muted-foreground">Desempenho dos deputados federais</p>
        </div>
      </div>
      <div className="p-4">
        <RankingPanel />
      </div>
    </div>
  );
};

export default RadarRankings;
