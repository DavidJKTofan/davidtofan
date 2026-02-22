/**
 * Copy featured.png images from content folders to public directories
 * This makes them available as static assets for SEO metatags (og:image, twitter:image)
 * 
 * Copies from:
 * - src/content/articles/[slug]/featured.png -> public/articles/[slug]/featured.png
 * - src/content/projects/[slug]/featured.png -> public/projects/[slug]/featured.png
 */

import { readdirSync, existsSync, mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

/**
 * Copy featured images from a content directory to a public directory
 * @param {string} contentType - 'articles' or 'projects'
 */
function copyFeaturedImages(contentType) {
  const contentDir = join(rootDir, `src/content/${contentType}`);
  const publicDir = join(rootDir, `public/${contentType}`);
  
  // Skip if content directory doesn't exist
  if (!existsSync(contentDir)) {
    return 0;
  }

  // Ensure public directory exists
  if (!existsSync(publicDir)) {
    mkdirSync(publicDir, { recursive: true });
  }

  // Get all content directories
  const folders = readdirSync(contentDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  let copiedCount = 0;

  for (const folder of folders) {
    const featuredSrc = join(contentDir, folder, 'featured.png');
    
    if (existsSync(featuredSrc)) {
      const destDir = join(publicDir, folder);
      const featuredDest = join(destDir, 'featured.png');
      
      // Create destination directory if it doesn't exist
      if (!existsSync(destDir)) {
        mkdirSync(destDir, { recursive: true });
      }
      
      // Copy the featured image
      copyFileSync(featuredSrc, featuredDest);
      copiedCount++;
    }
  }

  return copiedCount;
}

// Copy featured images for articles and projects
const articlesCopied = copyFeaturedImages('articles');
const projectsCopied = copyFeaturedImages('projects');

console.log(`Copied ${articlesCopied} article featured images to public/articles/`);
console.log(`Copied ${projectsCopied} project featured images to public/projects/`);
