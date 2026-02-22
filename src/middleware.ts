import { defineMiddleware } from 'astro:middleware';

/**
 * Security headers middleware
 * Adds security headers to all SSR-rendered responses
 * 
 * Note: Static assets use headers from public/_headers file
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  // Only add headers to HTML responses (not static assets handled by _headers)
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('text/html')) {
    // Security headers for HTML pages
    // https://developers.cloudflare.com/cache/cache-security/avoid-web-poisoning/
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Cache control for HTML - no caching of dynamic content to prevent cache deception
    // https://developers.cloudflare.com/cache/cache-security/cache-deception-armor/
    // HTML pages should not be cached to prevent personalized content from being served to other users
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    // Permissions-Policy (formerly Feature-Policy)
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  }

  return response;
});
