import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Video, Play, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import clip1 from '@/assets/videos/clip-1-intro.mp4.asset.json';
import clip2 from '@/assets/videos/clip-2-legalidade.mp4.asset.json';
import clip3 from '@/assets/videos/clip-3-anterioridade.mp4.asset.json';
import clip4 from '@/assets/videos/clip-4-exemplos.mp4.asset.json';
import clip5 from '@/assets/videos/clip-5-jurisprudencia.mp4.asset.json';
import clip6 from '@/assets/videos/clip-6-encerramento.mp4.asset.json';

const SEGMENTS = [
  { time: "0:00–1:40", title: "Introdução e Art. 1º", clip: clip1, description: "Apresentação do Código Penal Brasileiro e do Art. 1º: 'Não há crime sem lei anterior que o defina. Não há pena sem prévia cominação legal.'" },
  { time: "1:40–3:20", title: "Princípio da Legalidade", clip: clip2, description: "Origem histórica (Magna Carta, Beccaria, Feuerbach), reserva legal vs. legalidade, função de garantia política, jurídica e individual." },
  { time: "3:20–5:00", title: "Princípio da Anterioridade", clip: clip3, description: "Irretroatividade da lei penal, exceção da lei mais benéfica (novatio legis in mellius, abolitio criminis), Súmula 711 do STF." },
  { time: "5:00–6:40", title: "Exemplos Práticos", clip: clip4, description: "Casos concretos: conduta atípica, aumento de pena e descriminalização. Dicas para OAB e concursos." },
  { time: "6:40–8:20", title: "Jurisprudência e Doutrina", clip: clip5, description: "Visão de Hungria, Fragoso e Bitencourt. Analogia in bonam/malam partem. Entendimento do STF sobre reserva legal." },
  { time: "8:20–10:00", title: "Resumo e Encerramento", clip: clip6, description: "Mapa mental do Art. 1º, pontos-chave para revisão e referências bibliográficas." },
];

const GerarVideo = () => {
  const navigate = useNavigate();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            <h1 className="font-display text-lg text-foreground">Vídeo Explicativo</h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Info Card */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="font-display text-base text-foreground mb-1">Art. 1º — Código Penal</h2>
          <p className="font-body text-sm text-muted-foreground italic leading-relaxed">
            "Não há crime sem lei anterior que o defina. Não há pena sem prévia cominação legal."
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-[10px] font-body bg-primary/10 text-primary px-2 py-1 rounded-full">6 segmentos</span>
            <span className="text-[10px] font-body bg-primary/10 text-primary px-2 py-1 rounded-full">~10 minutos de conteúdo</span>
          </div>
        </div>

        {/* Segments with videos */}
        {SEGMENTS.map((seg, i) => {
          const isExpanded = expandedIndex === i;
          return (
            <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden">
              <button
                onClick={() => setExpandedIndex(isExpanded ? null : i)}
                className="w-full flex items-center gap-3 p-4 text-left"
              >
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <Play className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm text-foreground truncate">{seg.title}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{seg.time}</p>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                  <video
                    src={seg.clip.url}
                    controls
                    className="w-full rounded-xl"
                    playsInline
                  />
                  <p className="font-body text-sm text-muted-foreground leading-relaxed">
                    {seg.description}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GerarVideo;
