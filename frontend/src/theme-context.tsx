import React, { createContext, useContext, useState } from 'react';

// Brand palettes. Dark mode flips surfaces/ink; brand colors stay.
export const palettes = {
  light: {
    bg: '#F9F9F9',
    card: '#FFFFFF',
    ink: '#1A1A1A',
    sub: '#666666',
    border: '#EDEDED',
    toggleBg: '#f1f1f1',
  },
  dark: {
    bg: '#0E1116',
    card: '#1A1F26',
    ink: '#F2F4F7',
    sub: '#9AA4B2',
    border: '#262C34',
    toggleBg: '#262C34',
  },
};

export type Palette = typeof palettes.light;

const ThemeContext = createContext<{ palette: Palette; dark: boolean; setDark: (d: boolean) => void }>({
  palette: palettes.light,
  dark: false,
  setDark: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);
  return (
    <ThemeContext.Provider value={{ palette: dark ? palettes.dark : palettes.light, dark, setDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
