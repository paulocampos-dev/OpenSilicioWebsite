import { Request, Response, NextFunction } from 'express';

interface CacheEntry {
  data: any;
  timestamp: number;
  headers: Record<string, string>;
}

interface CacheOptions {
  ttl?: number; // Time to live in seconds (default: 60)
  key?: (req: Request) => string; // Custom cache key generator
}

/**
 * Simple in-memory cache for API responses
 * Use for public endpoints to reduce database queries
 */
class ResponseCache {
  private cache: Map<string, CacheEntry>;

  constructor() {
    this.cache = new Map();
  }

  /**
   * Generate cache key from request
   */
  private generateKey(req: Request, customKey?: (req: Request) => string): string {
    if (customKey) {
      return customKey(req);
    }
    // Default: use method + path + query string
    const queryString = new URLSearchParams(req.query as any).toString();
    return `${req.method}:${req.path}${queryString ? '?' + queryString : ''}`;
  }

  /**
   * Get cached response
   */
  get(key: string, ttl: number): CacheEntry | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = (Date.now() - entry.timestamp) / 1000;
    if (age > ttl) {
      // Cache expired
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  /**
   * Set cached response
   */
  set(key: string, data: any, headers: Record<string, string>): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      headers,
    });
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear cache entries matching a pattern
   */
  clearPattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Singleton instance
const responseCache = new ResponseCache();

/**
 * Cache middleware factory
 * Creates a caching middleware for specific routes
 */
export function cacheMiddleware(options: CacheOptions = {}) {
  const ttl = options.ttl || 60; // Default: 60 seconds

  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = responseCache.generateKey(req, options.key);
    const cached = responseCache.get(cacheKey, ttl);

    if (cached) {
      // Send cached response
      res.set({
        ...cached.headers,
        'X-Cache': 'HIT',
        'X-Cache-Key': cacheKey,
      });
      return res.json(cached.data);
    }

    // Intercept res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = function (data: any) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        responseCache.set(cacheKey, data, headers);
      }

      // Add cache miss header
      res.set({
        'X-Cache': 'MISS',
        'X-Cache-Key': cacheKey,
      });

      return originalJson(data);
    };

    next();
  };
}

/**
 * Clear cache for specific patterns
 * Useful for invalidating cache when data is updated
 */
export function clearCache(pattern?: string): void {
  if (pattern) {
    responseCache.clearPattern(pattern);
  } else {
    responseCache.clear();
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return responseCache.getStats();
}

export default responseCache;
