import { ui, defaultLang, languages, type Lang, type UIKey } from './ui';
import { langForCountry } from './regions';

const LANGS = Object.keys(languages) as Lang[];

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGS as string[]).includes(value);
}

/**
 * Translation lookup for a locale, falling back to `defaultLang` per key.
 *
 * Per the Astro i18n recipe: a key missing from a locale falls back rather than
 * rendering blank, so a partially translated locale is always safe to ship.
 * https://docs.astro.build/en/recipes/i18n/#translate-ui-strings
 */
export function useTranslations(lang: Lang | undefined) {
  const active = isLang(lang) ? lang : defaultLang;
  return function t(key: UIKey): string {
    const dict = ui[active] as Record<string, string>;
    return dict[key] ?? ui[defaultLang][key];
  };
}

/**
 * Narrow `Astro.currentLocale` (typed `string | undefined`) to our Lang union.
 * Astro derives it from the URL, so this works on prerendered pages too.
 */
export function localeFrom(currentLocale: string | undefined): Lang {
  return isLang(currentLocale) ? currentLocale : defaultLang;
}

/**
 * Best-effort language for an incoming request.
 *
 * `Astro.preferredLocale` does the Accept-Language work for us, but it only
 * matches codes present in `i18n.locales` VERBATIM. The documented fix is
 * custom locale paths (`{ path, codes }`), which map es-ES/de-AT/zh-Hans onto one
 * locale — but that feature requires `output: "server"` with no prerendered
 * pages, which is the opposite of this site's shape. So we supplement it:
 * re-read the header and strip region subtags (es-ES -> es).
 *
 * Chrome sends "es-ES,es;q=0.9" and matches on the bare tag, but Safari can
 * send "es-ES" alone, which would otherwise fall through to English.
 *
 * Country is consulted last and only as a fallback — never to override a
 * language the visitor's browser actually stated.
 *
 * English is the default and the universal fallback: if the browser states
 * nothing usable and the country maps to no supported language — including
 * every Portuguese- and French-speaking country, which this site does not
 * translate — this returns `defaultLang`. There is no path out of this function
 * that returns anything but a supported language.
 */
export function resolvePreferredLang(
  preferredLocale: string | undefined,
  acceptLanguage: string | null | undefined,
  country: string | null | undefined,
): Lang {
  if (isLang(preferredLocale)) return preferredLocale;

  if (acceptLanguage) {
    const ranked = acceptLanguage
      .split(',')
      .map((part) => {
        const [tag, ...params] = part.trim().split(';');
        const q = params.find((p) => p.trim().startsWith('q='));
        return { tag: tag.trim().toLowerCase(), q: q ? Number.parseFloat(q.split('=')[1]) : 1 };
      })
      .filter((entry) => entry.tag && !Number.isNaN(entry.q))
      .sort((a, b) => b.q - a.q);

    for (const { tag } of ranked) {
      if (tag === '*') break;
      const base = tag.split('-')[0];
      if (isLang(base)) return base;
    }
  }

  return langForCountry(country) ?? defaultLang;
}

/** BCP-47 tag for <html lang> and og:locale. */
export const HTML_LANG: Readonly<Record<Lang, string>> = {
  en: 'en',
  es: 'es',
  de: 'de',
  it: 'it',
  zh: 'zh-Hans',
};

/** og:locale wants underscore form. */
export const OG_LOCALE: Readonly<Record<Lang, string>> = {
  en: 'en_US',
  es: 'es_ES',
  de: 'de_DE',
  it: 'it_IT',
  zh: 'zh_CN',
};

export { LANGS };
