/**
 * @typedef {'articles' | 'projects'} ContentKind
 * @typedef {{ date: Date, modified?: Date | undefined }} DatedContent
 */

export const sitePageMetadata = {
  aiLicensingTerms: {
    route: '/ai-licensing-terms/',
    lastModified: '2026-04-19',
  },
  disclaimer: {
    route: '/disclaimer/',
    lastModified: '2026-08-28',
  },
  imprint: {
    route: '/imprint/',
    lastModified: '2026-09-27',
  },
};

/**
 * Routes rendered with `noIndex` (see BaseLayout) and an `X-Robots-Tag` in
 * public/_headers. Exported so the sitemap can exclude them — advertising a
 * `noindex` URL in the sitemap sends crawlers two contradicting instructions.
 */
export const noIndexRoutes = new Set([
  sitePageMetadata.aiLicensingTerms.route,
  sitePageMetadata.disclaimer.route,
  sitePageMetadata.imprint.route,
]);

/**
 * Return the explicit image when provided, otherwise the conventional featured
 * image copied into public/ during prebuild — but only if that file exists.
 * Without the check, an entry with no featured.png advertises a 404 as its
 * og:image, twitter:image and JSON-LD image, so `fallbackImage` is used instead.
 *
 * Pages are prerendered in workerd, which cannot read the filesystem, so the
 * existing images are injected at build time as `__FEATURED_IMAGES__` by
 * astro.config.mjs (from `listFeaturedImages()` below).
 *
 * @param {ContentKind} contentKind
 * @param {string} slug
 * @param {string | undefined} explicitImage
 * @param {string} fallbackImage
 */
export function getContentImagePath(contentKind, slug, explicitImage, fallbackImage) {
  if (explicitImage) {
    return explicitImage;
  }
  const featuredImage = `/${contentKind}/${slug}/featured.png`;
  return __FEATURED_IMAGES__.includes(featuredImage) ? featuredImage : fallbackImage;
}

/**
 * Use the author-provided modified date when available, otherwise fall back to
 * the original publication/start date so downstream metadata stays consistent.
 *
 * @param {DatedContent} entryData
 */
export function getEffectiveModifiedTime(entryData) {
  return entryData.modified ?? entryData.date;
}

/**
 * Featured images that exist on disk, as the public paths the prebuild script
 * copies them to, plus the published entries that have none. Node-only;
 * astro.config.mjs injects `paths` as `__FEATURED_IMAGES__` and logs `missing`.
 */
export async function listFeaturedImages() {
  const { entries } = await readContentEntries();
  return {
    paths: entries
      .filter((entry) => entry.hasFeaturedImage)
      .map((entry) => `/${entry.contentKind}/${entry.slug}/featured.png`),
    missing: entries
      .filter((entry) => !entry.hasFeaturedImage && !entry.draft)
      .map((entry) => `${entry.contentKind}/${entry.slug}`),
  };
}

/**
 * Build a URL -> lastmod map for sitemap serialization using content
 * frontmatter and explicitly versioned static pages.
 *
 * This function is intentionally Node-only and lazily imports filesystem
 * dependencies so page-level imports of this module stay runtime-safe.
 *
 * @param {string} siteUrl
 * @param {{ locales: string[], defaultLocale: string }} i18n
 */
export async function buildSitemapLastmodMap(siteUrl, { locales, defaultLocale }) {
  const { entries, projectRoot, existsSync, readFileSync, join } = await readContentEntries();
  const lastmodMap = new Map();
  /** @type {Map<ContentKind, Date>} */
  const newestByKind = new Map();

  for (const { contentKind, slug, date, modified, draft } of entries) {
    // Drafts are never built, so they must not set a listing page's freshness.
    if (draft || !date) {
      continue;
    }

    const effectiveDate = getEffectiveModifiedTime({ date, modified });
    const route = `/${contentKind}/${slug}/`;
    lastmodMap.set(new URL(route, siteUrl).toString(), effectiveDate.toISOString());

    const currentNewest = newestByKind.get(contentKind);
    if (!currentNewest || effectiveDate > currentNewest) {
      newestByKind.set(contentKind, effectiveDate);
    }
  }

  // Listing pages have no frontmatter of their own, so without this they ship
  // with no `lastmod` at all — worst on exactly the highest-priority routes.
  // Their freshness is the freshness of the newest entry they list.
  const newestArticle = newestByKind.get('articles');
  const newestProject = newestByKind.get('projects');
  const listingLastmods = new Map([
    ['/', newestDate([newestArticle, newestProject])],
    ['/articles/', newestArticle],
    ['/projects/', newestProject],
    ['/certificates/', readNewestCertificateDate(readFileSync, existsSync, join(projectRoot, 'src', 'data', 'certificates.json'))],
  ]);

  // Localized copies of the listing pages are the same content in another
  // language, so they share their English original's freshness. Without this
  // the localized routes ship with no `lastmod` at all.
  const localePrefixes = locales.map((code) => (code === defaultLocale ? '' : `/${code}`));

  for (const [route, lastmod] of listingLastmods) {
    if (!lastmod) {
      continue;
    }
    for (const prefix of localePrefixes) {
      const localizedRoute = prefix === '' ? route : `${prefix}${route}`;
      lastmodMap.set(new URL(localizedRoute, siteUrl).toString(), lastmod.toISOString());
    }
  }

  for (const page of Object.values(sitePageMetadata)) {
    const lastmod = toIsoDate(page.lastModified);
    if (!lastmod) {
      continue;
    }
    lastmodMap.set(new URL(page.route, siteUrl).toString(), lastmod);
  }

  return lastmodMap;
}

/**
 * Every article and project as its frontmatter on disk. Node-only: the
 * filesystem modules are imported lazily so page-level imports of this module
 * stay runtime-safe.
 */
async function readContentEntries() {
  const [{ existsSync, readdirSync, readFileSync }, { join }, { fileURLToPath }] = await Promise.all([
    import('node:fs'),
    import('node:path'),
    import('node:url'),
  ]);

  const projectRoot = fileURLToPath(new URL('../..', import.meta.url));
  const contentRoot = join(projectRoot, 'src', 'content');
  const entries = [];

  for (const contentKind of /** @type {ContentKind[]} */ (['articles', 'projects'])) {
    const contentDir = join(contentRoot, contentKind);
    if (!existsSync(contentDir)) {
      continue;
    }

    const slugs = readdirSync(contentDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    for (const slug of slugs) {
      const indexFile = getContentIndexFile(join, contentDir, slug, existsSync);
      if (!indexFile) {
        continue;
      }

      const frontmatter = readFrontmatter(readFileSync, indexFile);
      entries.push({
        contentKind,
        slug,
        date: parseFrontmatterDate(frontmatter, 'date'),
        modified: parseFrontmatterDate(frontmatter, 'modified'),
        draft: /^draft:\s*true\b/m.test(frontmatter),
        hasFeaturedImage: existsSync(join(contentDir, slug, 'featured.png')),
      });
    }
  }

  return { entries, projectRoot, existsSync, readFileSync, join };
}

/**
 * @param {(a: string, b: string) => string} join
 * @param {string} contentDir
 * @param {string} slug
 * @param {(path: string) => boolean} existsSync
 */
function getContentIndexFile(join, contentDir, slug, existsSync) {
  const directory = join(contentDir, slug);
  const candidates = ['index.md', 'index.mdx'];

  for (const candidate of candidates) {
    const filePath = join(directory, candidate);
    if (existsSync(filePath)) {
      return filePath;
    }
  }

  return undefined;
}

/**
 * @param {(path: string, encoding: string) => string} readFileSync
 * @param {string} filePath
 */
function readFrontmatter(readFileSync, filePath) {
  const source = readFileSync(filePath, 'utf8');
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return match?.[1] ?? '';
}

/**
 * @param {string} frontmatter
 * @param {'date' | 'modified'} fieldName
 */
function parseFrontmatterDate(frontmatter, fieldName) {
  const match = frontmatter.match(new RegExp(`^${fieldName}:\\s*(.+)$`, 'm'));
  if (!match) {
    return undefined;
  }

  return parseDateLiteral(match[1]);
}

/**
 * @param {string} value
 */
function parseDateLiteral(value) {
  const cleanedValue = value.trim().replace(/^['"]|['"]$/g, '');
  const parsedDate = new Date(cleanedValue);
  if (Number.isNaN(parsedDate.valueOf())) {
    return undefined;
  }
  return parsedDate;
}

/**
 * Newest of a sparse list of dates, ignoring undefined entries.
 *
 * @param {(Date | undefined)[]} dates
 */
function newestDate(dates) {
  return dates.reduce(
    (newest, date) => (date && (!newest || date > newest) ? date : newest),
    /** @type {Date | undefined} */ (undefined),
  );
}

/**
 * Certificates carry human-readable dates ("Feb 2026") rather than frontmatter,
 * so the listing page's freshness is derived from the newest entry in the JSON.
 *
 * @param {(path: string, encoding: string) => string} readFileSync
 * @param {(path: string) => boolean} existsSync
 * @param {string} filePath
 */
function readNewestCertificateDate(readFileSync, existsSync, filePath) {
  if (!existsSync(filePath)) {
    return undefined;
  }

  let entries;
  try {
    const parsed = JSON.parse(readFileSync(filePath, 'utf8'));
    entries = Array.isArray(parsed) ? parsed : parsed?.certificates;
  } catch {
    return undefined;
  }

  if (!Array.isArray(entries)) {
    return undefined;
  }

  return newestDate(entries.map((entry) => parseCertificateDate(entry?.date)));
}

/**
 * Normalize a "Mon YYYY" certificate date to UTC midnight so the emitted
 * lastmod does not shift by a day depending on the build machine's timezone.
 *
 * @param {unknown} value
 */
function parseCertificateDate(value) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    return undefined;
  }

  return new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()));
}

/**
 * @param {string} value
 */
function toIsoDate(value) {
  const parsedDate = parseDateLiteral(value);
  return parsedDate?.toISOString();
}