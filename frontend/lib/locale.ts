/** Locales the storefront renders. */
export const locales = ["en", "es"] as const;

export type Locale = (typeof locales)[number];

/** Locale used when the path and the saved cookie have none. */
export const defaultLocale: Locale = "en";

/** Returns whether `value` is `en` or `es`. */
export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Prefixes a path with the locale segment. */
export function localePath(locale: Locale, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${normalized}`;
}

/** Replaces `{name}` placeholders. A missing value becomes an empty string. */
export function formatMessage(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}
