import { translations } from "./translations";
import type { Language, StringKey } from "./translations";

/**
 * Returns a translation function bound to the given language.
 * Call sites: `const t = useT(language); t('back')`.
 */
export function useT(language: Language) {
  const dict = translations[language] ?? translations.en;
  return (key: StringKey): string => dict[key] ?? translations.en[key];
}
