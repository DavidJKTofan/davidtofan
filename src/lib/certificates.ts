import type { Certificate } from '../types';

/**
 * Category mapping rules for auto-categorization
 * Add new rules here to categorize certificates by organization
 */
const CATEGORY_RULES: Array<{ keywords: string[]; category: string }> = [
  { keywords: ['cloudflare'], category: 'Cloudflare' },
  { keywords: ['ibm', 'cognitive class'], category: 'IBM' },
  { keywords: ['coursera'], category: 'Coursera' },
  { keywords: ['udemy'], category: 'Udemy' },
  { keywords: ['cisco'], category: 'Cisco' },
  { keywords: ['google'], category: 'Google' },
  { keywords: ['nvidia'], category: 'NVIDIA' },
  { keywords: ['tryhackme', 'cybrary'], category: 'Cybersecurity' },
];

/**
 * Auto-categorize a certificate based on its organization
 */
export function getCategory(cert: Certificate): string {
  const org = cert.organization.toLowerCase();
  
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(keyword => org.includes(keyword))) {
      return rule.category;
    }
  }
  
  return 'Other';
}

/**
 * Group certificates by category
 */
export function groupByCategory(certificates: Certificate[]): Record<string, Certificate[]> {
  return certificates.reduce((acc, cert) => {
    const category = cert.category || getCategory(cert);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(cert);
    return acc;
  }, {} as Record<string, Certificate[]>);
}

/**
 * Sort categories with priority order
 * Cloudflare first, then by count, then alphabetically
 */
export function sortCategories(
  categories: string[],
  grouped: Record<string, Certificate[]>
): string[] {
  return categories.sort((a, b) => {
    if (a === 'Cloudflare') return -1;
    if (b === 'Cloudflare') return 1;
    const countDiff = grouped[b].length - grouped[a].length;
    if (countDiff !== 0) return countDiff;
    return a.localeCompare(b);
  });
}

/**
 * Parse certificate date and extract year
 */
export function parseYear(dateStr: string): number {
  const parts = dateStr.split(' ');
  const year = parseInt(parts[parts.length - 1]);
  return isNaN(year) ? new Date().getFullYear() : year;
}

/**
 * Calculate years of learning from certificates
 */
export function calculateYearsLearning(certificates: Certificate[]): number {
  const years = certificates.map(c => parseYear(c.date));
  const earliestYear = Math.min(...years);
  return new Date().getFullYear() - earliestYear;
}
