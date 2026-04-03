import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Timer, BookOpenText, ScanEye, Sparkles, Wrench, ChevronRight, Gamepad2, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import StudyTimer from '@/components/vademecum/StudyTimer';
import AssistenteOverlay from '@/components/vademecum/AssistenteOverlay';
import DicionarioJuridico from '@/components/ferramentas/DicionarioJuridico';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';

const TOOLS = [
  {
    id: 'pomodoro',
    label: 'Pomodoro',
    desc: 'Timer de estudo com técnica Pomodoro',
    icon: Timer,
    gradient: 'from-rose-500 to-pink-600',
  },
  {
    id: 'dicionario',
    label: 'Dicionário Jurídico',
    desc: 'Consulte termos e conceitos do Direito',
    icon: BookOpenText,
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'radar360',
    label: 'Radar 360',
    desc: 'Alterações recentes e projetos de lei',
    icon: ScanEye,
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'assistente',
    label: 'Assistente Evelyn',
    desc: 'IA jurídica para tirar dúvidas',
    icon: Sparkles,
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    id: 'gamificacao',
    label: 'Gamificação',
    desc: 'Jogos educativos com artigos de lei',
    icon: Gamepad2,
    gradient: 'from-emerald-500 to-green-600',
  },
  {
    id: 'resumos',
    label: 'Resumos',
    desc: 'Resumos Cornell e Feynman de artigos',
    icon: FileText,
    gradient: 'from-sky-500 to-indigo-600',
  },
];

const Ferramentas = () => {
  const navigate = useNavigate();
  const [timerOpen, setTimerOpen] = useState(false);
  const [assistenteOpen, setAssistenteOpen] = useState(false);
  const [dicionarioOpen, setDicionarioOpen] = useState(false);

  const handleToolClick = (id: string) => {
    switch (id) {
      case 'pomodoro': setTimerOpen(true); break;
      case 'dicionario': setDicionarioOpen(true); break;
      case 'radar360': navigate('/radar-360'); break;
      case 'assistente': setAssistenteOpen(true); break;
      case 'gamificacao': navigate('/gamificacao'); break;
      case 'resumos': navigate('/resumos'); break;
      case 'gerador-post': navigate('/gerador-post'); break;
    }
  };

  const mobileHeader = (
    <div className="relative bg-gradient-to-br from-card to-secondary overflow-hidden px-4 pt-10 pb-8 sm:px-6">
      <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/5" />
      <Wrench className="absolute top-5 right-5 w-10 h-10 text-white/15 rotate-12" />
      <div className="relative max-w-2xl mx-auto z-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white font-medium transition-all text-sm px-3 py-1.5 rounded-lg mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <h1 className="font-display text-2xl text-white font-bold">Ferramentas</h1>
        <p className="text-white/70 text-sm mt-1">Recursos para potencializar seus estudos</p>
      </div>
    </div>
  );

  const toolsList = (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
      {TOOLS.map((tool, i) => {
        const Icon = tool.icon;
        return (
          <motion.button
            key={tool.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => handleToolClick(tool.id)}
            className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/40 transition-all group"
          >
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center shrink-0 shadow-md`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-display text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                {tool.label}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                {tool.desc}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </motion.button>
        );
      })}
    </div>
  );

  return (
    <DesktopPageLayout
      activeId="ferramentas"
      title="Ferramentas"
      subtitle="Recursos para potencializar seus estudos"
      mobileHeader={mobileHeader}
    >
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 lg:max-w-none lg:px-0 lg:py-0">
        {toolsList}
      </div>

      <StudyTimer open={timerOpen} onClose={() => setTimerOpen(false)} />
      <AssistenteOverlay open={assistenteOpen} onClose={() => setAssistenteOpen(false)} />
      <DicionarioJuridico open={dicionarioOpen} onClose={() => setDicionarioOpen(false)} />
    </DesktopPageLayout>
  );
};

export default Ferramentas;
