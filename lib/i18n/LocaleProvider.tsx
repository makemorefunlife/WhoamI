"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { Locale } from "@/lib/i18n/locale";
import { DEFAULT_LOCALE, localizedPath } from "@/lib/i18n/locale";
import { getMessages, type MessageCatalog } from "@/lib/i18n/messages";

type LocaleContextValue = {
  locale: Locale;
  messages: MessageCatalog;
  /** Locale-aware absolute app path */
  href: (path: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const value = useMemo<LocaleContextValue>(() => {
    const resolved = locale ?? DEFAULT_LOCALE;
    return {
      locale: resolved,
      messages: getMessages(resolved),
      href: (path: string) => localizedPath(path, resolved),
    };
  }, [locale]);

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    // Safe fallback for edges outside provider (e.g. rare portals)
    const locale = DEFAULT_LOCALE;
    return {
      locale,
      messages: getMessages(locale),
      href: (path: string) => localizedPath(path, locale),
    };
  }
  return ctx;
}

export function useMessages(): MessageCatalog {
  return useLocale().messages;
}
