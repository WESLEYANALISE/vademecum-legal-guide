import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, RefreshCw, Scale } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import PLNewsCard from './PLNewsCard';


const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

function getDayList(centerDate: Date, range = 2): Date[] {
  const days: Date[] = [];
  for (let i = range; i >= -range; i--) {
    const d = new Date(centerDate);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateLabel(date: Date): string {
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return 'HOJE';
  return WEEKDAYS[date.getDay()];
}

function formatFullDate(date: Date): string {
  const weekdayFull = ['Domingo', 'Segunda-Feira', 'Terça-Feira', 'Quarta-Feira', 'Quinta-Feira', 'Sexta-Feira', 'Sábado'];
  const monthFull = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return `${weekdayFull[date.getDay()]}, ${date.getDate()} de ${monthFull[date.getMonth()]} de ${date.getFullYear()}`;
}

interface RadarTabProps {
  searchQuery: string;
}

let cachedProposicoes: any[] | null = null;
let cachedHeadlineMap: Map<string, string> | null = null;

/** Returns today's PL count from module cache (available after RadarTab mounts once) */
export function getTodayPlCount(): number {
  if (!cachedProposicoes) return 0;
  const today = toDateKey(new Date());
  return cachedProposicoes.filter(p => (p.dataApresentacao || '').slice(0, 10) === today).length;
}

const RadarTab = ({ searchQuery }: RadarTabProps) => {
  const navigate = useNavigate();
  return <RadarHome onNavigate={(route: string) => navigate(route)} />;
};

function RadarHome({ onNavigate }: { onNavigate: (route: string) => void }) {
  const [proposicoes, setProposicoes] = useState<any[]>(cachedProposicoes || []);
  const [loadingProps, setLoadingProps] = useState(!cachedProposicoes);
  // Find the last date with PLs to center the calendar on
  const lastDateWithPLs = useMemo(() => {
    const dates = proposicoes.map(p => p.dataApresentacao).filter(Boolean).sort().reverse();
    if (dates.length > 0) {
      const parts = dates[0].split('-');
      return new Date(+parts[0], +parts[1] - 1, +parts[2]);
    }
    return new Date();
  }, [proposicoes]);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const dayList = useMemo(() => getDayList(lastDateWithPLs, 2), [lastDateWithPLs]);
  const effectiveSelected = selectedDate || lastDateWithPLs;
  const selectedDateKey = toDateKey(effectiveSelected);

  // Track which days have propositions
  const daysWithPLs = useMemo(() => {
    const set = new Set<string>();
    proposicoes.forEach(p => {
      const d = (p.dataApresentacao || '').slice(0, 10);
      if (d) set.add(d);
    });
    return set;
  }, [proposicoes]);

  const filteredProposicoes = useMemo(() => {
    return proposicoes.filter(p => {
      const d = (p.dataApresentacao || '').slice(0, 10);
      return d === selectedDateKey;
    });
  }, [proposicoes, selectedDateKey]);

  const displayProposicoes = filteredProposicoes.length > 0 ? filteredProposicoes : proposicoes;

  const handleDayClick = useCallback((day: Date) => {
    const key = toDateKey(day);
    if (!daysWithPLs.has(key)) {
      toast.info('Nenhum projeto de lei apresentado neste dia.');
    }
    setSelectedDate(day);
  }, [daysWithPLs]);

  useEffect(() => {
    let alive = true;

    const mapProps = (propsData: any[], headlineMap?: Map<string, string>) =>
      propsData
        .map((p: any) => ({
          id: p.id_externo,
          sigla_tipo: p.sigla_tipo,
          numero: p.numero,
          ano: p.ano,
          ementa: p.ementa,
          autorNome: p.autor || (p.dados_json as any)?.autores?.[0]?.nome || '',
          autorFoto: p.autor_foto || (p.dados_json as any)?.autores?.[0]?.urlFoto || null,
          dataApresentacao: ((p.dados_json as any)?.dataApresentacao || '').slice(0, 10),
          headline: headlineMap?.get(p.id_externo) || null,
        }))
        .filter((p: any) => p.dataApresentacao)
        .sort((a: any, b: any) => b.dataApresentacao.localeCompare(a.dataApresentacao));

    (async () => {
      try {
        // Fetch proposições AND headlines in parallel
        const [{ data: propsData }, { data: headlinesData }] = await Promise.all([
          supabase
            .from('radar_proposicoes')
            .select('id_externo,sigla_tipo,numero,ano,ementa,autor,autor_foto,dados_json')
            .eq('sigla_tipo', 'PL')
            .eq('ano', new Date().getFullYear()),
          (supabase as any)
            .from('radar_pl_headlines')
            .select('id_externo, headline'),
        ]);

        if (!alive) return;

        const headlineMap = new Map<string, string>();
        for (const h of (headlinesData || [])) {
          if (h.headline) headlineMap.set(h.id_externo, h.headline);
        }
        cachedHeadlineMap = headlineMap;

        let result = mapProps(propsData || [], headlineMap);

        // Fallback: fetch missing author photos from radar_deputados
        const semFoto = [...new Set(result.filter(p => !p.autorFoto && p.autorNome).map(p => p.autorNome))];
        if (semFoto.length > 0) {
          const { data: deps } = await supabase
            .from('radar_deputados')
            .select('nome, foto_url')
            .in('nome', semFoto);
          if (deps && deps.length > 0) {
            const fotoMap = new Map<string, string>();
            for (const d of deps) {
              if (d.foto_url) fotoMap.set(d.nome, d.foto_url);
            }
            result = result.map(p => p.autorFoto ? p : { ...p, autorFoto: fotoMap.get(p.autorNome) || null });
          }
        }

        cachedProposicoes = result;
        setProposicoes(result);
      } catch {
        if (!cachedProposicoes) setProposicoes([]);
      }
      setLoadingProps(false);
    })();

    return () => { alive = false; };
  }, []);

  return (
    <div className="space-y-5">
      {/* Card explicativo + Calendário */}
      <div className="rounded-xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 p-4">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-sm font-bold text-foreground">Radar Legislativo</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
              Acompanhe em tempo real os projetos de lei da Câmara dos Deputados com análises por IA.
            </p>
          </div>
        </div>

        {/* Calendar strip */}
        <div className="flex justify-between gap-1.5">
            {dayList.map((day) => {
            const key = toDateKey(day);
            const isSelected = key === selectedDateKey;
            const hasContent = daysWithPLs.has(key);
            const label = formatDateLabel(day);

            return (
              <button
                key={key}
                onClick={() => handleDayClick(day)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-primary/80 text-white shadow-lg shadow-primary/15'
                    : hasContent
                      ? 'bg-card/40 text-foreground hover:bg-card/60'
                      : 'bg-card/20 text-muted-foreground/50 hover:bg-card/30'
                }`}
              >
                <span className={`text-[9px] font-semibold uppercase tracking-wide ${isSelected ? 'text-white' : ''}`}>{label}</span>
                <span className={`text-base font-bold leading-none ${isSelected ? 'text-white' : ''}`}>{day.getDate()}</span>
                <span className={`text-[8px] uppercase ${isSelected ? 'text-white/80' : 'opacity-80'}`}>{MONTHS[day.getMonth()]}</span>
              </button>
            );
          })}
        </div>

        {/* Full date label */}
        <p className="text-[11px] text-primary font-medium mt-3 flex items-center gap-1.5">
          📅 {formatFullDate(effectiveSelected)}
        </p>
      </div>

      {/* Projetos de Lei - Lista */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">Projetos de Lei</h2>
            <p className="text-xs text-muted-foreground">Proposições recentes da Câmara</p>
          </div>
          <button
            onClick={() => onNavigate(`/radar/proposicoes?data=${selectedDateKey}`)}
            className="text-xs text-primary font-semibold flex items-center gap-1 hover:text-primary/80 transition-colors"
          >
            Ver mais <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {loadingProps ? (
          <div className="flex justify-center py-10">
            <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayProposicoes.map((prop, i) => (
              <PLNewsCard
                key={prop.id || i}
                pl={prop}
                onVerAnalise={() => onNavigate(`/radar/pl/${prop.id}`)}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default RadarTab;
