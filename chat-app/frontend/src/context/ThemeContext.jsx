import { useEffect, useState } from 'react';

import ThemeContext from './themeContext.js';

function getSavedTheme() {
  return localStorage.getItem('chatly_theme') === 'dark' ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getSavedTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('chatly_theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'));
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}
