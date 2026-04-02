import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Wrench, Sparkles, Bell, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import { getLatestDayCount, getResenhaCache, prefetchResenha } from '@/services/atualizacaoService';

interface BottomNavProps {
  onSearchClick: () => void;
  onMenuClick?: () => void;
}

const NAV_ITEMS = [
  { id: 'estudar', label: 'Estudar', icon: GraduationCap },
  { id: 'ferramentas', label: 'Ferramentas', icon: Wrench },
  { id: 'assistente', label: 'Assistente', icon: Sparkles, center: true },
  { id: 'novidades', label: 'Novidades', icon: Bell },
  { id: 'menu', label: 'Menu', icon: Menu },
];

const BottomNav = ({ onSearchClick, onMenuClick }: BottomNavProps) => {
  const navigate = useNavigate();
  const [badgeCount, setBadgeCount] = useState(0);

  useEffect(() => {
    const cached = getResenhaCache();
    if (cached) {
      setBadgeCount(getLatestDayCount());
    } else {
      prefetchResenha().then(() => setBadgeCount(getLatestDayCount()));
    }
  }, []);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="flex items-end justify-around px-2 pt-1 pb-2 max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;

          if (item.center) {
            return (
              <button
                key={item.id}
                onClick={onSearchClick}
                className="flex flex-col items-center gap-0.5 -mt-5"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="w-14 h-14 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/30 border-4 border-card"
                >
                  <Icon className="w-6 h-6 text-accent-foreground" />
                </motion.div>
                <span className="font-body text-[11px] text-foreground font-semibold">{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={
                item.id === 'menu' ? onMenuClick :
                item.id === 'ferramentas' ? () => navigate('/ferramentas') :
                item.id === 'novidades' ? () => { setBadgeCount(0); navigate('/novidades'); } :
                item.id === 'estudar' ? () => navigate('/estudar') :
                undefined
              }
              className="flex flex-col items-center gap-0.5 py-1 px-2 text-foreground hover:text-primary transition-colors relative"
            >
              <div className="relative">
                <Icon className="w-[22px] h-[22px]" />
                {item.id === 'novidades' && badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center px-1">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </div>
              <span className="font-body text-[11px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
