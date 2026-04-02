import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ThemePalette {
  id: string;
  name: string;
  description: string;
  colors: Record<string, string>;
}

function p(bg: string, fg: string, card: string, cardFg: string, primary: string, primaryFg: string, primaryLight: string, secondary: string, secondaryFg: string, muted: string, mutedFg: string, accent: string, accentFg: string, border: string, ring: string, copper: string, copperLight: string, copperDark: string): Record<string, string> {
  return {
    '--background': bg, '--foreground': fg,
    '--card': card, '--card-foreground': cardFg,
    '--popover': card, '--popover-foreground': cardFg,
    '--primary': primary, '--primary-foreground': primaryFg, '--primary-light': primaryLight,
    '--secondary': secondary, '--secondary-foreground': secondaryFg,
    '--muted': muted, '--muted-foreground': mutedFg,
    '--accent': accent, '--accent-foreground': accentFg,
    '--destructive': '0 70% 55%', '--destructive-foreground': '0 0% 100%',
    '--border': border, '--input': border, '--ring': ring,
    '--sidebar-background': bg, '--sidebar-foreground': secondaryFg,
    '--sidebar-primary': primary, '--sidebar-primary-foreground': primaryFg,
    '--sidebar-accent': muted, '--sidebar-accent-foreground': secondaryFg,
    '--sidebar-border': border, '--sidebar-ring': ring,
    '--copper': copper, '--copper-light': copperLight, '--copper-dark': copperDark,
  };
}

const PALETTES: ThemePalette[] = [
  // 1 — Marsala & Ouro (padrão) — bordô escuro + dourado quente
  { id: 'marsala-ouro', name: 'Marsala & Ouro', description: 'Elegância bordô com destaques em ouro',
    colors: p('340 55% 12%','38 15% 95%','340 50% 16%','38 15% 95%','38 72% 48%','340 55% 10%','38 78% 58%','340 40% 21%','38 10% 90%','340 40% 18%','340 30% 55%','36 68% 45%','340 55% 10%','340 35% 24%','38 72% 48%','38 72% 48%','38 62% 58%','38 52% 34%') },

  // 2 — Vinho Noturno — bordô profundo/preto + ouro suave
  { id: 'vinho-noturno', name: 'Vinho Noturno', description: 'Profundidade noturna com brilho dourado suave',
    colors: p('340 50% 8%','36 12% 94%','340 45% 12%','36 12% 94%','36 62% 46%','340 50% 6%','36 68% 56%','340 35% 17%','36 8% 88%','340 35% 14%','340 25% 48%','34 55% 42%','340 50% 6%','340 30% 20%','36 62% 46%','36 62% 46%','36 52% 56%','36 45% 32%') },

  // 3 — Rubi Imperial — vermelho rubi vibrante + ouro intenso
  { id: 'rubi-imperial', name: 'Rubi Imperial', description: 'Vermelho rubi vibrante com ouro intenso',
    colors: p('350 60% 14%','40 14% 95%','350 55% 18%','40 14% 95%','40 78% 48%','350 60% 10%','40 82% 58%','350 45% 23%','40 10% 90%','350 45% 20%','350 35% 55%','38 72% 45%','350 60% 10%','350 40% 26%','40 78% 48%','40 78% 48%','40 68% 58%','40 56% 34%') },

  // 4 — Mogno & Champanhe — marrom avermelhado + champanhe dourado
  { id: 'mogno-champanhe', name: 'Mogno & Champanhe', description: 'Calor do mogno com suavidade champanhe',
    colors: p('15 45% 13%','36 18% 93%','15 40% 17%','36 18% 93%','36 52% 52%','15 45% 10%','36 58% 62%','15 30% 22%','36 12% 88%','15 30% 19%','15 20% 52%','34 45% 48%','15 45% 10%','15 25% 25%','36 52% 52%','36 52% 52%','36 45% 62%','36 40% 38%') },

  // 5 — Carmesim & Bronze — vermelho escuro + bronze metálico
  { id: 'carmesim-bronze', name: 'Carmesim & Bronze', description: 'Força carmesim com reflexos em bronze',
    colors: p('355 52% 13%','32 14% 94%','355 48% 17%','32 14% 94%','28 62% 42%','355 52% 10%','28 68% 52%','355 38% 22%','32 10% 88%','355 38% 19%','355 28% 52%','26 55% 40%','355 52% 10%','355 33% 24%','28 62% 42%','28 62% 42%','28 52% 52%','28 45% 30%') },

  // 6 — Borgonha Clássica — borgonha pura + ouro antigo envelhecido
  { id: 'borgonha-classica', name: 'Borgonha Clássica', description: 'Borgonha pura com ouro envelhecido',
    colors: p('345 58% 11%','38 12% 94%','345 52% 15%','38 12% 94%','38 65% 44%','345 58% 8%','38 70% 54%','345 42% 20%','38 8% 87%','345 42% 17%','345 32% 50%','36 58% 40%','345 58% 8%','345 37% 22%','38 65% 44%','38 65% 44%','38 55% 54%','38 48% 30%') },

  // 7 — Ébano & Ouro — preto elegante + ouro do logo
  { id: 'ebano-ouro', name: 'Ébano & Ouro', description: 'Preto puro elegante com ouro luminoso',
    colors: p('0 0% 5%','0 0% 100%','0 0% 9%','0 0% 100%','38 75% 48%','0 0% 4%','38 80% 58%','0 0% 18%','0 0% 90%','0 0% 12%','0 0% 50%','36 68% 44%','0 0% 4%','0 0% 16%','38 75% 48%','38 75% 48%','38 65% 58%','38 55% 34%') },

  // 8 — Grafite Bordeaux — cinza com subtom bordô + ouro
  { id: 'grafite-bordeaux', name: 'Grafite Bordeaux', description: 'Cinza sofisticado com nuance bordô e ouro',
    colors: p('340 12% 12%','38 10% 94%','340 10% 16%','38 10% 94%','38 68% 46%','340 12% 10%','38 74% 56%','340 8% 21%','38 6% 88%','340 8% 18%','340 6% 52%','36 60% 42%','340 12% 10%','340 6% 24%','38 68% 46%','38 68% 46%','38 58% 56%','38 48% 32%') },

  // 9 — Terracota & Mel — terracota quente + mel dourado
  { id: 'terracota-mel', name: 'Terracota & Mel', description: 'Calor terroso com doçura de mel dourado',
    colors: p('12 40% 14%','38 16% 93%','12 35% 18%','38 16% 93%','36 68% 46%','12 40% 10%','36 74% 56%','12 28% 23%','38 10% 88%','12 28% 20%','12 18% 52%','34 60% 42%','12 40% 10%','12 22% 25%','36 68% 46%','36 68% 46%','36 58% 56%','36 48% 32%') },

  // 10 — Obsidiana Régia — preto com nuance roxa + ouro real
  { id: 'obsidiana-regia', name: 'Obsidiana Régia', description: 'Preto profundo com nuance violeta e ouro real',
    colors: p('280 15% 6%','0 0% 100%','280 12% 10%','0 0% 100%','38 78% 46%','280 15% 5%','38 82% 56%','280 10% 19%','0 0% 90%','280 10% 13%','280 8% 48%','36 70% 42%','280 15% 5%','280 8% 17%','38 78% 46%','38 78% 46%','38 68% 56%','38 55% 32%') },
];

interface ThemeContextType {
  currentTheme: string;
  setTheme: (id: string) => void;
  palettes: ThemePalette[];
}

const ThemeContext = createContext<ThemeContextType>({
  currentTheme: 'marsala-ouro',
  setTheme: () => {},
  palettes: PALETTES,
});

function applyTheme(palette: ThemePalette) {
  const root = document.documentElement;
  Object.entries(palette.colors).forEach(([prop, value]) => {
    root.style.setProperty(prop, value);
  });
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('vademecum-theme') || 'marsala-ouro';
  });

  // Load theme from Supabase on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      supabase
        .from('user_preferences')
        .select('theme_id')
        .eq('user_id', session.user.id)
        .single()
        .then(({ data }) => {
          if (data?.theme_id) {
            setCurrentTheme(data.theme_id);
            localStorage.setItem('vademecum-theme', data.theme_id);
          }
        });
    });
  }, []);

  useEffect(() => {
    const palette = PALETTES.find((p) => p.id === currentTheme) || PALETTES[0];
    applyTheme(palette);
  }, [currentTheme]);

  const setTheme = useCallback((id: string) => {
    setCurrentTheme(id);
    localStorage.setItem('vademecum-theme', id);
    // Persist to Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      supabase
        .from('user_preferences')
        .update({ theme_id: id, updated_at: new Date().toISOString() })
        .eq('user_id', session.user.id)
        .then(() => {});
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, palettes: PALETTES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
