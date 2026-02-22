/**
 * Copy featured.png images from article folders to public/articles/[slug]/
 * This makes them available as static assets for SEO metatags (og:image, twitter:image)
 */

import { readdirSync, existsSync, mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const articlesDir = join(rootDir, 'src/content/articles');
const publicArticlesDir = join(rootDir, 'public/articles');

// Ensure public/articles directory exists
if (!existsSync(publicArticlesDir)) {
  mkdirSync(publicArticlesDir, { recursive: true });
}

// Get all article directories
const articleFolders = readdirSync(articlesDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

let copiedCount = 0;

for (const folder of articleFolders) {
  const featuredSrc = join(articlesDir, folder, 'featured.png');
  
  if (existsSync(featuredSrc)) {
    const destDir = join(publicArticlesDir, folder);
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

console.log(`Copied ${copiedCount} featured images to public/articles/`);
