import { useState } from 'react';
import { Scale, BookOpen, FileText, Newspaper, Landmark, Shield, ScrollText, Gavel, Settings, HelpCircle, PanelLeftClose, Radar, RefreshCw, Rss, Bell, Building2, Lightbulb, Mic, BookA, BellRing, MessageCircle, Palette, Info, LogOut, Gamepad2, ClipboardList, ShieldCheck, Brain, Activity, BookMarked, HeartPulse } from 'lucide-react';
import vacatioLogo from '@/assets/logo-vacatio.jpeg';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

type Tab = 'legislacao' | 'radar' | 'noticias' | 'estudar' | 'ferramentas';

interface DesktopSidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const CATEGORIAS = [
  { id: 'constituicao', label: 'Constituição', icon: Landmark },
  { id: 'codigo', label: 'Códigos', icon: BookOpen },
  { id: 'estatuto', label: 'Estatutos', icon: Shield },
  { id: 'lei-ordinaria', label: 'Leis Ordinárias', icon: FileText },
  { id: 'decreto', label: 'Decretos', icon: ScrollText },
  { id: 'sumula', label: 'Súmulas', icon: Gavel },
];

const CONTEUDO_ITEMS = [
  { id: 'explicacao', label: 'Artigos e Análises', icon: FileText },
  { id: 'atualizacao', label: 'Notícias Jurídicas', icon: Newspaper, route: '/noticias' },
  { id: 'boletins', label: 'Boletins', icon: Rss },
  { id: 'novidades', label: 'Novidades', icon: Bell, route: '/novidades' },
];

const FERRAMENTAS_ITEMS = [
  { id: 'camara-deputados', label: 'Câmara dos Deputados', icon: Building2, route: '/radar/deputados' },
  { id: 'explicacao-lei', label: 'Gerar Explicações (IA)', icon: Lightbulb, route: '/explicacao-lei' },
  { id: 'narracao', label: 'Narração de Artigos', icon: Mic, route: '/narracao' },
  { id: 'dicionario', label: 'Dicionário Jurídico', icon: BookA },
  { id: 'notificacao-push', label: 'Notificação Push', icon: BellRing },
  { id: 'assistente-whatsapp', label: 'Assistente WhatsApp', icon: MessageCircle },
  { id: 'gamificacao', label: 'Gamificação', icon: Gamepad2, route: '/gamificacao' },
  { id: 'mapa-mental', label: 'Mapa Mental', icon: Brain, route: '/mapa-mental' },
];

const ADMIN_ITEMS = [
  { id: 'simulado-admin', label: 'Simulado Admin', icon: ClipboardList, route: '/simulado-admin' },
  { id: 'geracao-admin', label: 'Geração Admin', icon: ShieldCheck, route: '/geracao-admin' },
  { id: 'admin-monitor', label: 'Monitoramento', icon: Activity, route: '/admin-monitor' },
];

const CONFIG_ITEMS = [
  { id: 'paleta-cores', label: 'Paleta de Cores', icon: Palette, route: '/configuracoes', disabled: true },
  { id: 'personalizar', label: 'Personalizar Atalhos', icon: Settings, disabled: true },
  { id: 'sobre', label: 'Sobre o App', icon: Info },
  { id: 'ajuda', label: 'Ajuda', icon: HelpCircle },
  { id: 'sair', label: 'Sair', icon: LogOut },
];

const DesktopSidebar = ({ activeTab, onTabChange }: DesktopSidebarProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleItemClick = async (item: { id: string; route?: string }) => {
    if (item.id === 'sair') {
      await signOut();
      navigate('/auth');
      return;
    }
    if (item.route) {
      navigate(item.route);
    }
  };

  const renderSection = (title: string, items: typeof CONTEUDO_ITEMS) => (
    <div className="py-2 border-t border-border">
      {!collapsed && (
        <p className="px-5 py-1.5 text-[10px] font-body font-semibold text-foreground/80 uppercase tracking-wider">
          {title}
        </p>
      )}
      {items.map(item => {
        const Icon = item.icon;
        const isDisabled = (item as any).disabled;
        return (
          <button
            key={item.id}
            onClick={() => !isDisabled && handleItemClick(item)}
            disabled={isDisabled}
            title={collapsed ? item.label : undefined}
            className={`w-full flex items-center gap-3 ${collapsed ? 'justify-center px-0' : 'px-5'} py-2 text-sm font-body transition-colors ${
              isDisabled
                ? 'text-muted-foreground/40 cursor-not-allowed'
                : 'text-foreground/70 hover:bg-secondary hover:text-foreground'
            }`}
          >
            <Icon className={`w-[16px] h-[16px] shrink-0 ${isDisabled ? 'text-muted-foreground/30' : 'text-primary/60'}`} />
            {!collapsed && <span>{item.label}</span>}
            {!collapsed && isDisabled && <span className="ml-auto text-[10px] text-muted-foreground/50 font-body">Em breve</span>}
          </button>
        );
      })}
    </div>
  );

  return (
    <aside className={`${collapsed ? 'w-[60px]' : 'w-[260px]'} shrink-0 sticky top-0 h-screen bg-card border-r border-border flex flex-col transition-all duration-300`}>
      {/* Collapse toggle + Logo */}
      <div className="p-3 border-b border-border flex items-center gap-2.5">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-9 h-9 rounded-lg bg-secondary/60 hover:bg-secondary flex items-center justify-center transition-colors shrink-0"
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed
            ? <img src={vacatioLogo} alt="Vacatio" className="w-6 h-6 rounded-full object-cover" />
            : <PanelLeftClose className="w-4 h-4 text-foreground/70" />
          }
        </button>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img src={vacatioLogo} alt="Vacatio" className="w-8 h-8 rounded-full object-cover border border-primary/20" />
            <div>
              <h1 className="font-display text-lg text-foreground leading-none">Vacatio</h1>
              <p className="text-[11px] font-body text-muted-foreground">Vade Mecum 2026</p>
            </div>
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Main Nav */}
        <div className="py-3">
          {!collapsed && (
            <p className="px-5 py-1.5 text-[10px] font-body font-semibold text-foreground/80 uppercase tracking-wider">
              Seções
            </p>
          )}
          {[
            { id: 'radar' as Tab, label: 'Radar Legislativo', icon: Radar },
            { id: 'legislacao' as Tab, label: 'Legislação', icon: Scale },
            { id: 'noticias' as Tab, label: 'Atualizações', icon: RefreshCw },
          ].map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 ${collapsed ? 'justify-center px-0' : 'px-5'} py-2.5 text-sm font-body transition-colors ${
                  active
                    ? 'bg-primary/15 text-primary font-semibold border-r-2 border-primary'
                    : 'text-foreground/70 hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Categorias */}
        <div className="py-2 border-t border-border">
          {!collapsed && (
            <p className="px-5 py-1.5 text-[10px] font-body font-semibold text-foreground/80 uppercase tracking-wider">
              Categorias
            </p>
          )}
          {CATEGORIAS.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => navigate(`/legislacao/${cat.id}`)}
                title={collapsed ? cat.label : undefined}
                className={`w-full flex items-center gap-3 ${collapsed ? 'justify-center px-0' : 'px-5'} py-2 text-sm font-body text-foreground/70 hover:bg-secondary hover:text-foreground transition-colors`}
              >
                <Icon className="w-[16px] h-[16px] text-primary/60 shrink-0" />
                {!collapsed && <span>{cat.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Conteúdo */}
        {renderSection('Conteúdo', CONTEUDO_ITEMS)}

        {/* Ferramentas */}
        {renderSection('Ferramentas', FERRAMENTAS_ITEMS)}

        {/* Admin */}
        {renderSection('Admin', ADMIN_ITEMS)}

        {/* Configurações */}
        {renderSection('Configurações', CONFIG_ITEMS)}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        {collapsed ? (
          <div className="flex justify-center">
            <img src={vacatioLogo} alt="Vacatio" className="w-5 h-5 rounded-full object-cover opacity-50" />
          </div>
        ) : (
          <p className="text-[10px] font-body text-muted-foreground text-center">
            © 2026 Vacatio
          </p>
        )}
      </div>
    </aside>
  );
};

export default DesktopSidebar;
