import en from "@/dictionaries/en";
import es, { type Dictionary } from "@/dictionaries/es";
import { type Locale } from "@/lib/locale";

export type { Dictionary };

const dictionaries: Record<Locale, Dictionary> = { es, en };

/** Returns the dictionary for a supported locale. */
export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
