"use client";

import { createContext, useContext } from "react";

import type { Dictionary } from "@/lib/i18n";
import { localePath, type Locale } from "@/lib/locale";

type I18n = {
  locale: Locale;
  dictionary: Dictionary;
  href: (path: string) => string;
};

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({
  locale,
  dictionary,
  children,
}: {
  locale: Locale;
  dictionary: Dictionary;
  children: React.ReactNode;
}) {
  const value = { locale, dictionary, href: (path: string) => localePath(locale, path) };
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const value = useContext(I18nContext);
  if (!value) throw new Error("I18nProvider is missing.");
  return value;
}
