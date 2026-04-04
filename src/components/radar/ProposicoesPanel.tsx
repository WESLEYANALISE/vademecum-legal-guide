import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { RefreshCw, ArrowLeft, CalendarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import PLNewsCard from './PLNewsCard';

interface ProposicoesPanelProps {
  searchQuery: string;
  dataInicial?: string; // 'YYYY-MM-DD'
}

const ProposicoesPanel = ({ searchQuery, dataInicial }: ProposicoesPanelProps) => {
  const navigate = useNavigate();
  const [proposicoes, setProposicoes] = useState<any[]>([]);
  const [headlines, setHeadlines] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    dataInicial ? new Date(dataInicial + 'T12:00:00') : undefined
  );

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  async function loadData() {
    setLoading(true);
    try {
      let query = supabase
        .from('radar_proposicoes')
        .select('id_externo,sigla_tipo,numero,ano,ementa,autor,autor_foto,dados_json')
        .eq('sigla_tipo', 'PL');

      if (selectedDate) {
        const dateKey = format(selectedDate, 'yyyy-MM-dd');
        query = query.filter('dados_json->>dataApresentacao', 'like', `${dateKey}%`);
      } else {
        query = query.eq('ano', new Date().getFullYear());
      }

      // Fetch proposições and ALL headlines in parallel
      const [{ data: propsData }, { data: headlinesData }] = await Promise.all([
        query.order('numero', { ascending: false }).limit(10000),
        (supabase as any).from('radar_pl_headlines').select('id_externo, headline').limit(10000),
      ]);

      const headlineMap = new Map<string, string>();
      for (const h of (headlinesData || [])) {
        if (h.headline) headlineMap.set(h.id_externo, h.headline);
      }
      setHeadlines(headlineMap);

      setProposicoes((propsData || []).map((p: any) => ({
        id: p.id_externo,
        sigla_tipo: p.sigla_tipo,
        numero: p.numero,
        ano: p.ano,
        ementa: p.ementa,
        autorNome: p.autor || (p.dados_json as any)?.autores?.[0]?.nome || '',
        autorFoto: p.autor_foto || (p.dados_json as any)?.autores?.[0]?.urlFoto || null,
        dataApresentacao: ((p.dados_json as any)?.dataApresentacao || '').slice(0, 10),
      })));
    } catch {
      setProposicoes([]);
    }
    setLoading(false);
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const dateLabel = selectedDate
    ? format(selectedDate, "dd/MM/yyyy")
    : 'Selecionar data';

  return (
    <div>
      {/* Date picker filter */}
      <div className="flex items-center gap-2 mb-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal flex-1",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
        {selectedDate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedDate(undefined)}
            className="text-xs text-muted-foreground"
          >
            Limpar
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground mb-3">
            {proposicoes.length} projeto{proposicoes.length !== 1 ? 's' : ''} encontrado{proposicoes.length !== 1 ? 's' : ''}
          </p>
          <div className="space-y-2.5">
            {proposicoes.map((prop, i) => (
              <PLNewsCard
                key={prop.id || i}
                pl={{
                  ...prop,
                  headline: headlines.get(prop.id) || null,
                }}
                onVerAnalise={() => navigate(`/radar/pl/${prop.id}`)}
              />
            ))}
          </div>
          {proposicoes.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum projeto de lei encontrado para esta data.
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default ProposicoesPanel;
