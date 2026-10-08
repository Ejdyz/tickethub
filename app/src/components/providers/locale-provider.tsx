'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Locale, DICTIONARIES, getDictionary } from '@/lib/i18n';

interface LocaleContextType {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  t: typeof DICTIONARIES['en'];
}

const LocaleContext = createContext<LocaleContextType>({
  locale: 'en',
  setLocale: () => {},
  t: DICTIONARIES.en
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('cs');

  useEffect(() => {
    const saved = document.cookie
      .split('; ')
      .find(row => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1] as Locale;
    if (saved === 'en' || saved === 'cs') {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (newLoc: Locale) => {
    setLocaleState(newLoc);
    document.cookie = `NEXT_LOCALE=${newLoc}; path=/; max-age=31536000; SameSite=Lax`;
  };

  const t = getDictionary(locale);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useI18n() {
  return useContext(LocaleContext);
}

