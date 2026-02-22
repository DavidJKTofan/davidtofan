/**
 * Calculate reading time from text content
 * @param content - The text content to analyze
 * @param wordsPerMinute - Average reading speed (default: 200 wpm)
 * @returns Reading time string (e.g., "5 min read")
 */
export function calculateReadingTime(content: string | undefined, wordsPerMinute: number = 200): string {
  if (!content) return '1 min read';
  
  // Remove HTML tags, code blocks, and extra whitespace
  const cleanContent = content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]*`/g, '') // Remove inline code
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  const wordCount = cleanContent.split(/\s+/).filter(word => word.length > 0).length;
  const minutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  
  return `${minutes} min read`;
}
