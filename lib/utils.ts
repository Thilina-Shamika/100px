import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

/**
 * Generate a URL-friendly slug from a string
 * Handles special characters, spaces, and edge cases
 */
export function generateSlug(text: string | undefined | null): string {
  if (!text) return ''
  
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except word chars, spaces, and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Convert WordPress URL to Next.js route
 * Maps WordPress page URLs to corresponding Next.js routes
 */
export function mapWordPressUrlToNextRoute(url: string | undefined | null): string {
  if (!url) return '#'
  
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    
    // Remove trailing slash
    const cleanPath = pathname.replace(/\/$/, '')
    
    // Map WordPress paths to Next.js routes
    const routeMap: Record<string, string> = {
      '/home': '/',
      '/services': '/services',
      '/gallery': '/gallery',
      '/contact-us': '/contact-us',
    }
    
    // Check if path matches any mapped route
    if (routeMap[cleanPath]) {
      return routeMap[cleanPath]
    }
    
    // If it's a WordPress domain URL but path doesn't match, try to extract the slug
    if (urlObj.hostname.includes('100px.lk') || urlObj.hostname.includes('100px.local')) {
      // Extract slug from path (e.g., /services/ -> /services)
      const slug = cleanPath.split('/').filter(Boolean).pop() || ''
      if (slug) {
        // Check if it matches any known route
        const mappedRoute = routeMap[`/${slug}`]
        if (mappedRoute) {
          return mappedRoute
        }
        // Return the slug as route (for dynamic routes)
        return `/${slug}`
      }
    }
    
    // If it's an external URL, return as is
    if (urlObj.hostname && !urlObj.hostname.includes('100px.lk') && !urlObj.hostname.includes('100px.local')) {
      return url
    }
    
    // Default: return the pathname or #
    return cleanPath || '#'
  } catch (error) {
    // If URL parsing fails, try simple string matching
    if (url.includes('/home')) return '/'
    if (url.includes('/services')) return '/services'
    if (url.includes('/gallery')) return '/gallery'
    if (url.includes('/contact-us')) return '/contact-us'
    
    return '#'
  }
}

