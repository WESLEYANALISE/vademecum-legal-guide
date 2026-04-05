import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, ShieldCheck, ClipboardList, BookOpen, Gamepad2, Brain, BookA, MessageCircle, BellRing, Mic, Lightbulb, Building2, Rss, Palette } from 'lucide-react';
import { motion } from 'framer-motion';

const ADMIN_FUNCTIONS = [
  { id: 'admin-monitor', label: 'Monitoramento', icon: Activity, desc: 'Status e saúde do sistema', color: 'from-red-500/20 to-red-600/10', iconColor: 'text-red-400' },
  { id: 'geracao-admin', label: 'Geração Admin', icon: ShieldCheck, desc: 'Cache de IA e geração em lote', color: 'from-blue-500/20 to-blue-600/10', iconColor: 'text-blue-400' },
  { id: 'simulado-admin', label: 'Simulado Admin', icon: ClipboardList, desc: 'Upload e processamento de provas', color: 'from-green-500/20 to-green-600/10', iconColor: 'text-green-400' },
  { id: 'biblioteca-admin', label: 'Biblioteca Admin', icon: BookOpen, desc: 'Gestão de livros e e-books', color: 'from-purple-500/20 to-purple-600/10', iconColor: 'text-purple-400' },
  { id: 'gamificacao', label: 'Gamificação', icon: Gamepad2, desc: 'Jogos educativos', color: 'from-yellow-500/20 to-yellow-600/10', iconColor: 'text-yellow-400' },
  { id: 'mapa-mental', label: 'Mapa Mental', icon: Brain, desc: 'Mapas mentais interativos', color: 'from-pink-500/20 to-pink-600/10', iconColor: 'text-pink-400' },
  { id: 'dicionario', label: 'Dicionário Jurídico', icon: BookA, desc: 'Termos e definições', color: 'from-cyan-500/20 to-cyan-600/10', iconColor: 'text-cyan-400' },
  { id: 'assistente-whatsapp', label: 'Assistente WhatsApp', icon: MessageCircle, desc: 'Integração WhatsApp', color: 'from-emerald-500/20 to-emerald-600/10', iconColor: 'text-emerald-400' },
  { id: 'notificacao-push', label: 'Notificação Push', icon: BellRing, desc: 'Envio de notificações', color: 'from-orange-500/20 to-orange-600/10', iconColor: 'text-orange-400' },
  { id: 'narracao', label: 'Narração de Artigos', icon: Mic, desc: 'TTS com Gemini', color: 'from-indigo-500/20 to-indigo-600/10', iconColor: 'text-indigo-400' },
  { id: 'explicacao-lei', label: 'Gerar Explicações (IA)', icon: Lightbulb, desc: 'Batch de explicações', color: 'from-amber-500/20 to-amber-600/10', iconColor: 'text-amber-400' },
  { id: 'camara-deputados', label: 'Câmara dos Deputados', icon: Building2, desc: 'Radar legislativo', color: 'from-sky-500/20 to-sky-600/10', iconColor: 'text-sky-400' },
  { id: 'boletins', label: 'Boletins', icon: Rss, desc: 'Newsletters e boletins', color: 'from-rose-500/20 to-rose-600/10', iconColor: 'text-rose-400' },
  { id: 'paleta-cores', label: 'Paleta de Cores', icon: Palette, desc: 'Configurações visuais', color: 'from-violet-500/20 to-violet-600/10', iconColor: 'text-violet-400' },
];

const ROUTES: Record<string, string> = {
  'admin-monitor': '/admin-monitor',
  'geracao-admin': '/geracao-admin',
  'simulado-admin': '/simulado-admin',
  'biblioteca-admin': '/biblioteca-admin',
  'gamificacao': '/gamificacao',
  'mapa-mental': '/mapa-mental',
  'narracao': '/narracao',
  'explicacao-lei': '/explicacao-lei',
  'camara-deputados': '/radar/deputados',
  'paleta-cores': '/configuracoes',
};

const AdminFuncoes = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-display text-lg font-bold text-foreground">Funções Admin</h1>
        </div>
      </div>

      {/* Grid */}
      <div className="p-4 grid grid-cols-2 gap-3">
        {ADMIN_FUNCTIONS.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => ROUTES[item.id] ? navigate(ROUTES[item.id]) : null}
              className={`flex flex-col items-start p-4 rounded-2xl bg-gradient-to-br ${item.color} border border-border/50 text-left hover:scale-[1.02] active:scale-[0.98] transition-transform`}
            >
              <div className={`w-10 h-10 rounded-xl bg-background/50 flex items-center justify-center mb-3 ${item.iconColor}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="font-body text-sm font-semibold text-foreground leading-tight">{item.label}</span>
              <span className="font-body text-[11px] text-muted-foreground mt-1 leading-snug">{item.desc}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default AdminFuncoes;
