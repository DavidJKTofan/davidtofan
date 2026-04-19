/**
 * @typedef {'articles' | 'projects'} ContentKind
 * @typedef {{ date: Date, modified?: Date | undefined }} DatedContent
 */

export const sitePageMetadata = {
  aiLicensingTerms: {
    route: '/ai-licensing-terms/',
    lastModified: '2026-04-19',
  },
};

/**
 * Return the explicit image when provided, otherwise use the conventional
 * featured image path copied into public/ during prebuild.
 *
 * @param {ContentKind} contentKind
 * @param {string} slug
 * @param {string | undefined} explicitImage
 */
export function getContentImagePath(contentKind, slug, explicitImage) {
  return explicitImage || `/${contentKind}/${slug}/featured.png`;
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
 * Build a URL -> lastmod map for sitemap serialization using content
 * frontmatter and explicitly versioned static pages.
 *
 * This function is intentionally Node-only and lazily imports filesystem
 * dependencies so page-level imports of this module stay runtime-safe.
 *
 * @param {string} siteUrl
 */
export async function buildSitemapLastmodMap(siteUrl) {
  const [{ existsSync, readdirSync, readFileSync }, { join }, { fileURLToPath }] = await Promise.all([
    import('node:fs'),
    import('node:path'),
    import('node:url'),
  ]);

  const projectRoot = fileURLToPath(new URL('../..', import.meta.url));
  const contentRoot = join(projectRoot, 'src', 'content');
  const lastmodMap = new Map();

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

      const dates = readFrontmatterDates(readFileSync, indexFile);
      if (!dates.date) {
        continue;
      }

      const lastmod = getEffectiveModifiedTime(dates).toISOString();
      const route = `/${contentKind}/${slug}/`;
      lastmodMap.set(new URL(route, siteUrl).toString(), lastmod);
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
function readFrontmatterDates(readFileSync, filePath) {
  const frontmatter = readFrontmatter(readFileSync, filePath);
  return {
    date: parseFrontmatterDate(frontmatter, 'date'),
    modified: parseFrontmatterDate(frontmatter, 'modified'),
  };
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
 * @param {string} value
 */
function toIsoDate(value) {
  const parsedDate = parseDateLiteral(value);
  return parsedDate?.toISOString();
}