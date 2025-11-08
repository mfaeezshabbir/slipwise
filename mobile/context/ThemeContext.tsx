import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getSymbolForCurrency,
  DEFAULT_CURRENCY_CODE,
  DEFAULT_CURRENCY_SYMBOL,
  getAllCurrencies,
} from '@/services/currency';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => Promise<void>;
  colorScheme: 'light' | 'dark';
  currencyCode: string;
  currencySymbol: string;
  setCurrency: (code: string) => Promise<void>;
  availableCurrencies: Array<{ code: string; name: string; symbol?: string }>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useSystemColorScheme();
  const [isDark, setIsDark] = useState<boolean>(systemColorScheme === 'dark');
  const [isLoaded, setIsLoaded] = useState(false);

  // currency state
  const [currencyCode, setCurrencyCode] = useState<string>(DEFAULT_CURRENCY_CODE);
  const [currencySymbol, setCurrencySymbol] = useState<string>(DEFAULT_CURRENCY_SYMBOL);
  const [availableCurrencies, setAvailableCurrencies] = useState<
    Array<{ code: string; name: string; symbol?: string }>
  >([]);

  // Load saved preferences on mount
  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme) {
          setIsDark(savedTheme === 'dark');
        } else if (systemColorScheme) {
          setIsDark(systemColorScheme === 'dark');
        }

        const savedCurrency = await AsyncStorage.getItem('currency');
        if (savedCurrency) {
          setCurrencyCode(savedCurrency);
          setCurrencySymbol(getSymbolForCurrency(savedCurrency));
        } else {
          setCurrencyCode(DEFAULT_CURRENCY_CODE);
          setCurrencySymbol(getSymbolForCurrency(DEFAULT_CURRENCY_CODE));
        }
        try {
          // load full list from package (sync) or fallback
          const list = getAllCurrencies();
          setAvailableCurrencies(list);
        } catch (err) {
          // ignore and keep defaults
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadPrefs();
  }, [systemColorScheme]);

  const toggleTheme = async () => {
    try {
      const newIsDark = !isDark;
      setIsDark(newIsDark);
      await AsyncStorage.setItem('theme', newIsDark ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const setCurrency = async (code: string) => {
    try {
      setCurrencyCode(code);
      setCurrencySymbol(getSymbolForCurrency(code));
      await AsyncStorage.setItem('currency', code);
    } catch (err) {
      console.error('Error saving currency preference:', err);
    }
  };

  if (!isLoaded) {
    return null; // Or return a loading screen
  }

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        toggleTheme,
        colorScheme: isDark ? 'dark' : 'light',
        currencyCode,
        currencySymbol,
        setCurrency,
        availableCurrencies: availableCurrencies,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
