import { useState } from 'react';
import { X, Scale, FileText, Newspaper, BookOpen, Gavel, Landmark, Shield, ScrollText, Settings, Bell, Rss, Info, Palette, LogOut, User, LifeBuoy, Lightbulb, Building2, BookA, BellRing, MessageCircle, Mic, Gamepad2, ShieldCheck, ClipboardList, Brain, Activity, ChevronDown, Lock } from 'lucide-react';
import SuporteSheet from './SuporteSheet';
import vacatioLogo from '@/assets/logo-vacatio.jpeg';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface SideMenuProps {
  open: boolean;
  onClose: () => void;
  onNavigate?: (section: string) => void;
}

const MENU_SECTIONS = [
  {
    title: 'Legislação',
    items: [
      { id: 'constituicao', label: 'Constituição Federal', icon: Landmark },
      { id: 'codigos', label: 'Códigos', icon: BookOpen },
      { id: 'estatutos', label: 'Estatutos', icon: Shield },
      { id: 'leis-ordinarias', label: 'Leis Ordinárias', icon: FileText },
      { id: 'decretos', label: 'Decretos', icon: ScrollText },
      { id: 'sumulas', label: 'Jurisprudência', icon: Gavel },
    ],
  },
  {
    title: 'Conteúdo',
    items: [
      { id: 'explicacao', label: 'Artigos e Análises', icon: FileText },
      { id: 'atualizacao', label: 'Notícias Jurídicas', icon: Newspaper },
      { id: 'novidades', label: 'Novidades', icon: Bell },
    ],
  },
  {
    title: 'Configurações',
    items: [
      { id: 'sobre', label: 'Sobre o App', icon: Info },
      { id: 'sair', label: 'Sair', icon: LogOut },
    ],
  },
];

const ADMIN_FUNCTIONS = [
  { id: 'admin-monitor', label: 'Monitoramento', icon: Activity },
  { id: 'geracao-admin', label: 'Geração Admin', icon: ShieldCheck },
  { id: 'simulado-admin', label: 'Simulado Admin', icon: ClipboardList },
  { id: 'biblioteca-admin', label: 'Biblioteca Admin', icon: BookOpen },
  { id: 'gamificacao', label: 'Gamificação', icon: Gamepad2 },
  { id: 'mapa-mental', label: 'Mapa Mental', icon: Brain },
  { id: 'dicionario', label: 'Dicionário Jurídico', icon: BookA },
  { id: 'assistente-whatsapp', label: 'Assistente WhatsApp', icon: MessageCircle },
  { id: 'notificacao-push', label: 'Notificação Push', icon: BellRing },
  { id: 'narracao', label: 'Narração de Artigos', icon: Mic },
  { id: 'explicacao-lei', label: 'Gerar Explicações (IA)', icon: Lightbulb },
  { id: 'camara-deputados', label: 'Câmara dos Deputados', icon: Building2 },
  { id: 'boletins', label: 'Boletins', icon: Rss },
  { id: 'paleta-cores', label: 'Paleta de Cores', icon: Palette },
];

const SideMenu = ({ open, onClose, onNavigate }: SideMenuProps) => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [adminOpen, setAdminOpen] = useState(false);
  const [suporteOpen, setSuporteOpen] = useState(false);

  const handleItemClick = async (id: string) => {
    if (id === 'sair') {
      await signOut();
      navigate('/auth');
      onClose();
      return;
    }

    const directRoutes: Record<string, string> = {
      'paleta-cores': '/configuracoes',
      'explicacao-lei': '/explicacao-lei',
      'narracao': '/narracao',
      'camara-deputados': '/radar/deputados',
      'novidades': '/novidades',
      'atualizacao': '/noticias',
      'constituicao': '/legislacao/constituicao',
      'codigos': '/legislacao/codigos',
      'estatutos': '/legislacao/estatutos',
      'leis-ordinarias': '/legislacao/leis-ordinarias',
      'decretos': '/legislacao/decretos',
      'sumulas': '/legislacao/sumulas',
      'gamificacao': '/gamificacao',
      'mapa-mental': '/mapa-mental',
      'simulado-admin': '/simulado-admin',
      'biblioteca-admin': '/biblioteca-admin',
      'sobre': '/sobre',
      'perfil': '/perfil',
      'geracao-admin': '/geracao-admin',
      'admin-monitor': '/admin-monitor',
    };

    if (directRoutes[id]) {
      navigate(directRoutes[id]);
      onClose();
      return;
    }

    onNavigate?.(id);
    onClose();
  };

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Usuário';
  const userEmail = user?.email || '';
  const isAdmin = userEmail === 'wn7corporation@gmail.com';

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 left-0 bottom-0 z-50 w-[300px] bg-card border-r border-border flex flex-col"
          >
            {/* Profile Header */}
            <div className="p-5 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img src={vacatioLogo} alt="Vacatio" className="w-11 h-11 rounded-full object-cover border-2 border-primary/40" />
                  <div>
                    <h2 className="font-display text-base font-bold text-foreground leading-tight">{displayName}</h2>
                    <p className="text-[11px] font-body text-muted-foreground truncate max-w-[160px]">{userEmail}</p>
                  </div>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Profile & Support buttons */}
              <div className="flex gap-2">
              <button onClick={() => { navigate('/perfil'); onClose(); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary/70 border border-border text-foreground/80 hover:bg-secondary transition-colors">
                  <User className="w-4 h-4 text-primary/70" />
                  <span className="font-body text-sm font-medium">Perfil</span>
                </button>
                <button onClick={() => setSuporteOpen(true)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary/70 border border-border text-foreground/80 hover:bg-secondary transition-colors">
                  <LifeBuoy className="w-4 h-4 text-primary/70" />
                  <span className="font-body text-sm font-medium">Suporte</span>
                </button>
              </div>
            </div>

            {/* Sections */}
            <div className="flex-1 overflow-y-auto py-3">
              {MENU_SECTIONS.map((section) => (
                <div key={section.title} className="mb-3">
                  <p className="px-5 py-2 text-[11px] font-body font-semibold text-muted-foreground uppercase tracking-wider">
                    {section.title}
                  </p>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isDisabled = (item as any).disabled;
                    return (
                      <button
                        key={item.id}
                        onClick={() => !isDisabled && handleItemClick(item.id)}
                        disabled={isDisabled}
                        className={`w-full flex items-center gap-3.5 px-5 py-3 transition-colors ${
                          isDisabled
                            ? 'text-muted-foreground/40 cursor-not-allowed'
                            : 'text-foreground/80 hover:bg-secondary hover:text-foreground'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isDisabled ? 'text-muted-foreground/30' : 'text-primary/70'}`} />
                        <span className="font-body text-[15px]">{item.label}</span>
                        {isDisabled && <span className="ml-auto text-[10px] text-muted-foreground/50 font-body">Em breve</span>}
                      </button>
                    );
                  })}
                </div>
              ))}

              {/* Funções Admin - only for admin */}
              {isAdmin && (
                <div className="mb-3">
                  <button
                    onClick={() => setAdminOpen(!adminOpen)}
                    className="w-full flex items-center gap-3.5 px-5 py-3 text-foreground/80 hover:bg-secondary hover:text-foreground transition-colors"
                  >
                    <Lock className="w-5 h-5 text-primary/70" />
                    <span className="font-body text-[15px] font-semibold">Funções Admin</span>
                    <ChevronDown className={`w-4 h-4 ml-auto text-muted-foreground transition-transform ${adminOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {adminOpen && (
                    <div className="bg-secondary/30">
                      {ADMIN_FUNCTIONS.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleItemClick(item.id)}
                            className="w-full flex items-center gap-3.5 px-7 py-2.5 text-foreground/80 hover:bg-secondary hover:text-foreground transition-colors"
                          >
                            <Icon className="w-4.5 h-4.5 text-primary/70" />
                            <span className="font-body text-[14px]">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border">
              <p className="text-center text-[10px] font-body text-muted-foreground">
                Vacatio © 2026
              </p>
            </div>
          </motion.aside>
          <SuporteSheet open={suporteOpen} onClose={() => setSuporteOpen(false)} />
        </>
      )}
    </AnimatePresence>
  );
};

export default SideMenu;
