import { siteConfig } from '../config/site';
import { HTML_LANG } from '../i18n/utils';
import profileImage from '../assets/img/profile.png';

/**
 * Shared schema.org nodes. Every block that names the author uses the same
 * `@id`, so Google and agents can join the author of each article, project and
 * listing to the Person on the homepage's ProfilePage, instead of seeing
 * unrelated "David Tofan"s with slightly different profile URLs.
 *
 * The `#person` / `#website` fragments are JSON-LD node identifiers, not links:
 * they name the thing described (a person, a site) as distinct from the page
 * at https://davidtofan.com/ itself, and are never fetched. Google's own
 * ProfilePage example uses the same pattern ("@id": "#main-author").
 */
const homeURL = `${siteConfig.url}/`;
const PERSON_ID = `${homeURL}#person`;
const WEBSITE_ID = `${homeURL}#website`;

/**
 * The author as referenced from `author` fields. Carries name, url and sameAs
 * as well as the `@id`, so each block still stands on its own.
 */
export const authorSchema = {
  '@type': 'Person',
  '@id': PERSON_ID,
  name: siteConfig.author.name,
  url: homeURL,
  jobTitle: 'Senior Customer Engineer',
  sameAs: [
    `https://github.com/${siteConfig.author.github}`,
    `https://www.linkedin.com/in/${siteConfig.author.linkedin}/`,
    `https://x.com/${siteConfig.author.twitter.replace('@', '')}`,
  ],
};

/**
 * The full Person, for the homepage's ProfilePage and the layout fallback.
 * Per Google's ProfilePage guidelines, `description` is the person's byline
 * and `image` their profile picture — not the site's share banner, since
 * "if there are no images, don't include a default image".
 */
export function personSchema(byline: string) {
  return {
    ...authorSchema,
    description: byline,
    image: new URL(profileImage.src, siteConfig.url).toString(),
    knowsAbout: [
      'Cybersecurity',
      'Cloud Computing',
      'Cloudflare',
      'Data Science',
      'Web Security',
      'Infrastructure Security',
    ],
  };
}

/**
 * A project's own website and source repository as absolute URLs, for `sameAs`.
 * Not `mainEntityOfPage`, which names the page describing the project (its page
 * on this site), and not `codeRepository`, which is only valid on
 * SoftwareSourceCode, not CreativeWork.
 */
export function projectSameAs(website?: string, github?: string) {
  const links = [website, github]
    .filter((link): link is string => Boolean(link))
    .map((link) => new URL(link, siteConfig.url).toString());
  return links.length > 0 ? [...new Set(links)] : undefined;
}

/**
 * WebSite node. Google reads its `name` on the root homepage to choose the site
 * name shown in results: https://developers.google.com/search/docs/appearance/site-names
 */
export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  name: siteConfig.name,
  url: homeURL,
  inLanguage: Object.values(HTML_LANG),
  author: { '@id': PERSON_ID },
};

/**
 * Homepage as a ProfilePage about the author:
 * https://developers.google.com/search/docs/appearance/structured-data/profile-page
 * `inLanguage` lives here rather than on the Person, where it is not a valid
 * property.
 */
export function profilePageSchema({ url, name, description, byline, lang }: {
  url: string;
  name: string;
  description: string;
  byline: string;
  lang: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url,
    name,
    description,
    inLanguage: lang,
    isPartOf: { '@id': WEBSITE_ID },
    mainEntity: personSchema(byline),
  };
}
