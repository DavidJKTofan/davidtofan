import type { Lang } from './ui';

/**
 * Two independent layers, deliberately kept apart:
 *
 *   LANGUAGE  decides the words.  Driven by Accept-Language first; country is
 *             only ever a fallback, because country cannot determine language
 *             (Switzerland, Belgium, Luxembourg and Singapore all disprove it).
 *   REGION    decides the accent only.  Driven by `request.cf.country`.
 *
 * Keeping them separate is the whole point: a visitor in Mexico and a visitor
 * in Spain both read Spanish, but they do not get the same palette.
 */

/**
 * Country -> language, used only when the browser tells us nothing usable.
 * Grouped by language so the regional coverage is reviewable at a glance.
 */
export const COUNTRY_TO_LANG: Readonly<Record<string, Lang>> = {
  // Spanish — Spain and Spanish-speaking Latin America
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es', VE: 'es',
  EC: 'es', GT: 'es', CU: 'es', BO: 'es', DO: 'es', HN: 'es', PY: 'es',
  SV: 'es', NI: 'es', CR: 'es', PA: 'es', UY: 'es', PR: 'es', GQ: 'es',

  // German — the DACH countries plus Liechtenstein
  DE: 'de', AT: 'de', LI: 'de',

  // Portuguese- and French-speaking countries are mapped to English.
  // Those two languages are not offered by the site, and English is the
  // default, so naming them here is equivalent to leaving them out — but it
  // records the decision rather than letting it look like an oversight.
  //
  // Portugal, Brazil, Lusophone Africa and Timor-Leste:
  PT: 'en', BR: 'en', AO: 'en', MZ: 'en', CV: 'en', GW: 'en', ST: 'en', TL: 'en',
  // France, Monaco, Francophone Africa, the Caribbean and the Pacific:
  FR: 'en', MC: 'en', SN: 'en', CI: 'en', CM: 'en', ML: 'en', BF: 'en',
  NE: 'en', TD: 'en', MG: 'en', CD: 'en', CG: 'en', GA: 'en', BJ: 'en',
  TG: 'en', HT: 'en', GN: 'en', RW: 'en', BI: 'en', DJ: 'en', NC: 'en', PF: 'en',

  // Italian — Italy, San Marino and the Vatican
  IT: 'it', SM: 'it', VA: 'it',

  // Chinese — mainland China, Taiwan, Hong Kong and Macao
  CN: 'zh', TW: 'zh', HK: 'zh', MO: 'zh',

  // English — North America, the British Isles, Oceania, and countries where
  // English is the dominant language of public life.
  US: 'en', CA: 'en', BZ: 'en', GB: 'en', IE: 'en', AU: 'en', NZ: 'en',
  ZA: 'en', NG: 'en', KE: 'en', GH: 'en', UG: 'en', TZ: 'en', ZM: 'en',
  ZW: 'en', BW: 'en', IN: 'en', PK: 'en', PH: 'en', MY: 'en', JM: 'en',
  TT: 'en', BS: 'en', BB: 'en', MT: 'en',

  // Deliberately omitted: CH, BE, LU and SG are multilingual, so guessing from
  // country would be worse than falling back to the default language.
};

/**
 * Countries with a hand-designed accent profile in global.css.
 *
 * BR, PT and FR are still here although Portuguese and French are no longer
 * offered as languages. The two layers are independent on purpose: this list is
 * about *place*, not language. A visitor in Lisbon or Paris now reads English,
 * but still gets the accent derived from their own design tradition — exactly
 * as a visitor in the US reads English and gets the neutral default, because
 * the US has no profile. Delete an entry here only to remove that place's
 * visual identity, not because its language went away.
 */
export const REGION_CODES = ['ES', 'MX', 'AR', 'BR', 'PT', 'DE', 'FR', 'IT', 'CN'] as const;
export type RegionCode = (typeof REGION_CODES)[number];

const REGION_SET: ReadonlySet<string> = new Set(REGION_CODES);

/**
 * Resolve a country code to an accent profile.
 *
 * Anything without a hand-designed profile returns `null`, which renders the
 * neutral default. That is intentional: shipping a half-considered palette for
 * a place is worse than shipping none.
 */
export function resolveRegion(country: string | null | undefined): RegionCode | null {
  if (!country) return null;
  const code = country.toUpperCase();
  return REGION_SET.has(code) ? (code as RegionCode) : null;
}

/** Language implied by a country, for when the browser gives us nothing. */
export function langForCountry(country: string | null | undefined): Lang | null {
  if (!country) return null;
  return COUNTRY_TO_LANG[country.toUpperCase()] ?? null;
}

/**
 * IANA time zone -> country, for the client-side fallback.
 *
 * Only the nine countries that actually have an accent profile need to be
 * distinguishable, so this stays small rather than becoming a full tz database.
 * It is what lets a visitor arriving straight at an article from search — never
 * touching the on-demand `/` — still get their regional accent, with no Worker
 * invocation and no network request.
 */
export const TIMEZONE_TO_REGION: Readonly<Record<string, RegionCode>> = {
  'Europe/Madrid': 'ES',
  'Africa/Ceuta': 'ES',
  'Atlantic/Canary': 'ES',
  'Europe/Lisbon': 'PT',
  'Atlantic/Madeira': 'PT',
  'Atlantic/Azores': 'PT',
  'Europe/Berlin': 'DE',
  'Europe/Busingen': 'DE',
  'Europe/Paris': 'FR',
  'Europe/Rome': 'IT',
  'America/Mexico_City': 'MX',
  'America/Cancun': 'MX',
  'America/Monterrey': 'MX',
  'America/Tijuana': 'MX',
  'America/Merida': 'MX',
  'America/Chihuahua': 'MX',
  'America/Hermosillo': 'MX',
  'America/Mazatlan': 'MX',
  'America/Argentina/Buenos_Aires': 'AR',
  'America/Argentina/Cordoba': 'AR',
  'America/Argentina/Mendoza': 'AR',
  'America/Argentina/Salta': 'AR',
  'America/Argentina/Tucuman': 'AR',
  'America/Sao_Paulo': 'BR',
  'America/Bahia': 'BR',
  'America/Fortaleza': 'BR',
  'America/Recife': 'BR',
  'America/Manaus': 'BR',
  'America/Belem': 'BR',
  'America/Cuiaba': 'BR',
  'America/Porto_Velho': 'BR',
  'Asia/Shanghai': 'CN',
  'Asia/Chongqing': 'CN',
  'Asia/Harbin': 'CN',
  'Asia/Urumqi': 'CN',
};

/**
 * The region a language "comes from", used only when a visitor picks a language
 * by hand.
 *
 * Auto-detection never consults this: it uses the visitor's actual country, so
 * Madrid gets ES and Mexico City gets MX even though both read Spanish. But an
 * explicit choice from the picker is a stated preference, and it would feel
 * broken for the palette to ignore it — so switching language re-themes the
 * site, UNLESS the visitor's detected country already speaks the language they
 * chose. Someone in Mexico choosing Spanish keeps Mexico's palette rather than
 * being flattened into Spain's.
 *
 * English maps to null, i.e. the neutral default: the countries where English
 * dominates deliberately have no profile, and the site's original blue is that
 * neutral look.
 */
export const LANG_HOME_REGION: Readonly<Record<string, RegionCode | null>> = {
  en: null,
  es: 'ES',
  de: 'DE',
  it: 'IT',
  zh: 'CN',
};

/**
 * Sentinel meaning "the visitor explicitly chose the neutral look".
 *
 * Needed because an *absent* region and a *deliberately neutral* region are
 * different states. Without it, choosing English (which maps to no profile)
 * simply cleared the stored region, and the next resolve fell straight through
 * to the time-zone guess and re-applied the visitor's country — so picking
 * English in Madrid put the Spanish palette back.
 */
export const NEUTRAL_REGION = 'neutral';

/** Cookie names. Values are a country code and a language tag — nothing personal. */
export const REGION_COOKIE = 'dt-region';
export const LANG_COOKIE = 'dt-lang';
export const OFFER_COOKIE = 'dt-lang-offer';
