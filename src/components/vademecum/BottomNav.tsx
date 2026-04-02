import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Wrench, Sparkles, Search, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

interface BottomNavProps {
  onSearchClick: () => void;
  onAssistenteClick: () => void;
  onMenuClick?: () => void;
}

const NAV_ITEMS = [
  { id: 'estudar', label: 'Estudar', icon: GraduationCap },
  { id: 'ferramentas', label: 'Ferramentas', icon: Wrench },
  { id: 'buscar', label: 'Buscar', icon: Search, center: true },
  { id: 'assistente', label: 'Assistente', icon: Sparkles },
  { id: 'menu', label: 'Menu', icon: Menu },
];

const BottomNav = ({ onSearchClick, onAssistenteClick, onMenuClick }: BottomNavProps) => {
  const navigate = useNavigate();

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
                  className="w-14 h-14 rounded-full bg-[hsl(48,95%,54%)] flex items-center justify-center shadow-lg shadow-[hsl(48,95%,54%)/0.35] border-4 border-card relative overflow-hidden"
                >
                  <div className="absolute inset-0 pointer-events-none">
                    <div
                      className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg]"
                      style={{ animation: 'shinePratique 3s ease-in-out infinite' }}
                    />
                  </div>
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                    className="relative z-10"
                  >
                    <Icon className="w-6 h-6 text-accent-foreground" />
                  </motion.div>
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
                item.id === 'assistente' ? onAssistenteClick :
                item.id === 'estudar' ? () => navigate('/estudar') :
                undefined
              }
              className="flex flex-col items-center gap-0.5 py-1 px-2 text-foreground hover:text-primary transition-colors relative"
            >
              <div className="relative">
                <Icon className="w-[22px] h-[22px]" />
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
