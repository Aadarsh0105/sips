import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeCtx {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

function getInitial(): Theme {
  try {
    const stored = localStorage.getItem('sfms.theme') as Theme | null;
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {
    // Ignore localStorage errors
  }

  // Default theme is always light
  return 'light';
}

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>(getInitial);

  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    try {
      localStorage.setItem('sfms.theme', theme);
    } catch {
      // Ignore localStorage errors
    }
  }, [theme]);

  const value: ThemeCtx = {
    theme,
    setTheme: setThemeState,
    toggle: () =>
      setThemeState((t) => (t === 'dark' ? 'light' : 'dark')),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(Ctx);

  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return ctx;
}