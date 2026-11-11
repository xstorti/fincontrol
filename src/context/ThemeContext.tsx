'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const applyTheme = async () => {
      try {
        // Try to get current user type
        const res = await fetch('/api/auth/me', { 
          credentials: 'include',
          cache: 'no-store'
        });
        
        if (res.ok) {
          const data = await res.json();
          const userType = data.data?.tipo_usuario;
          
          // Admin = light mode, User = dark mode
          const newTheme = userType === 'admin' ? 'light' : 'dark';
          setTheme(newTheme);
          document.documentElement.classList.toggle('dark', newTheme === 'dark');
        } else {
          // Not authenticated - use dark mode by default
          document.documentElement.classList.add('dark');
        }
      } catch (err) {
        // On error, default to dark mode
        document.documentElement.classList.add('dark');
      } finally {
        setMounted(true);
      }
    };

    applyTheme();
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    return {
      theme: 'dark' as const,
    };
  }
  return context;
}
