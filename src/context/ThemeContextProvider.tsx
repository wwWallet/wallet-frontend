'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { themeOptions, ThemeOption } from '../components/ThemeSelector/themes';

type ThemeContextType = {
  selectedTheme: ThemeOption;
  changeTheme: (newTheme: ThemeOption) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

type ThemeProviderProps = {
  children: ReactNode;
};

// Helper function to apply the theme class
const applyThemeClass = (themeValue: string) => {
  const isDark = themeValue === 'dark' || (themeValue === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

// Helper function to get the initial theme
const getInitialTheme = (): ThemeOption => {
  const savedThemeValue = localStorage.getItem('theme');
  // Ensure 'system' is always an option if saved value is invalid
  return themeOptions.find(theme => theme.value === savedThemeValue) || themeOptions.find(t => t.value === 'system') || themeOptions[0]; 
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>(getInitialTheme);

  // Apply initial theme and handle system changes
  useEffect(() => {
    applyThemeClass(selectedTheme.value);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (selectedTheme.value === 'system') {
        applyThemeClass('system');
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);

    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [selectedTheme]);

  // Function to change theme
  const changeTheme = useCallback((newTheme: ThemeOption) => {
    setSelectedTheme(newTheme);
    localStorage.setItem('theme', newTheme.value);
    // Application is handled by the useEffect hook
  }, []);

  return (
    <ThemeContext.Provider value={{ selectedTheme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}; 