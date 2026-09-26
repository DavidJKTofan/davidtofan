/**
 * Browser-side language preference, shared by the language picker and the
 * locale offer on `/`. Import it only from client `<script>` tags.
 *
 * These scripts used to receive the same constants through `define:vars`, which
 * forces a script inline (and re-serialized) into every page. Importing from
 * here lets Astro bundle it once into a cacheable module instead; only the
 * constants used below are kept, so TIMEZONE_TO_REGION is tree-shaken away.
 */
import {
  COUNTRY_TO_LANG,
  LANG_COOKIE,
  LANG_HOME_REGION,
  NEUTRAL_REGION,
  PREF_COOKIE_MAX_AGE,
  REGION_COOKIE,
} from './regions';

export function writePrefCookie(name: string, value: string): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${PREF_COOKIE_MAX_AGE}; samesite=lax`;
}

/**
 * Persist an explicit language choice and return the region whose accent it
 * implies (`null` for the neutral look).
 *
 * Choosing a language also re-themes the site, because a palette that ignored
 * an explicit choice would read as broken. The exception is deliberate: if the
 * visitor's current region already speaks the chosen language, that region's
 * palette is kept — someone in Mexico choosing Spanish stays on Mexico's
 * palette instead of being flattened into Spain's.
 *
 * NEUTRAL_REGION is stored rather than clearing the region: an explicit
 * "no accent" must survive, or detection re-applies the visitor's country on
 * the next load.
 */
export function rememberLanguageChoice(chosen: string): string | null {
  const currentRegion = document.documentElement.getAttribute('data-region');
  const keepRegion = currentRegion !== null && COUNTRY_TO_LANG[currentRegion] === chosen;
  const nextRegion = keepRegion ? currentRegion : LANG_HOME_REGION[chosen] ?? null;
  const storedRegion = nextRegion || NEUTRAL_REGION;

  try {
    localStorage.setItem('lang', chosen);
    localStorage.setItem('region', storedRegion);
  } catch {
    /* private mode */
  }
  writePrefCookie(LANG_COOKIE, chosen);
  writePrefCookie(REGION_COOKIE, storedRegion);

  return nextRegion;
}
