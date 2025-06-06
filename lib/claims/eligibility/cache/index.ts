import { CacheOptions } from '../types';

/**
 * Interface for cache operations
 */
export interface ICache {
  /**
   * Get a value from cache
   * @param key Cache key
   * @returns Cached value or null if not found
   */
  get<T = unknown>(key: string): Promise<T | null>;
  
  /**
   * Set a value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in seconds
   */
  set(key: string, value: unknown, ttl?: number): Promise<boolean>;
  
  /**
   * Delete a value from cache
   * @param key Cache key
   */
  delete(key: string): Promise<boolean>;
  
  /**
   * Clear all cached values
   */
  clear(): Promise<void>;
}

/**
 * In-memory cache implementation
 */
export class MemoryCache implements ICache {
  private cache: Map<string, { value: any; expires: number }> = new Map();
  
  async get<T = unknown>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    // Check if item has expired
    if (item.expires && item.expires < Date.now()) {
      await this.delete(key);
      return null;
    }
    
    return item.value as T;
  }
  
  async set(key: string, value: unknown, ttl: number = 3600): Promise<boolean> {
    try {
      this.cache.set(key, {
        value,
        expires: ttl ? Date.now() + ttl * 1000 : 0
      });
      return true;
    } catch (error) {
      console.error('MemoryCache set error:', error);
      return false;
    }
  }
  
  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }
  
  async clear(): Promise<void> {
    this.cache.clear();
  }
}

/**
 * Redis cache implementation
 */
export class RedisCache implements ICache {
  private client: any;
  
  constructor(redisUrl?: string) {
    try {
      // Use dynamic import to avoid requiring redis at module level
      const { createClient } = require('redis');
      this.client = createClient({
        url: redisUrl || process.env.REDIS_URL
      });
      
      this.client.on('error', (err: Error) => {
        console.error('Redis client error:', err);
      });
      
      // Connect to Redis
      this.client.connect().catch(console.error);
    } catch (error) {
      console.error('Failed to initialize Redis client:', error);
      throw new Error('Redis client initialization failed');
    }
  }
  
  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('RedisCache get error:', error);
      return null;
    }
  }
  
  async set(key: string, value: unknown, ttl: number = 3600): Promise<boolean> {
    try {
      const options = ttl ? { EX: ttl } : undefined;
      await this.client.set(key, JSON.stringify(value), options);
      return true;
    } catch (error) {
      console.error('RedisCache set error:', error);
      return false;
    }
  }
  
  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      console.error('RedisCache delete error:', error);
      return false;
    }
  }
  
  async clear(): Promise<void> {
    try {
      await this.client.flushDb();
    } catch (error) {
      console.error('RedisCache clear error:', error);
      throw error;
    }
  }
  
  /**
   * Close the Redis connection
   */
  async disconnect(): Promise<void> {
    try {
      await this.client.quit();
    } catch (error) {
      console.error('Error disconnecting Redis client:', error);
    }
  }
}

/**
 * Cache factory to create appropriate cache instance
 */
export class CacheFactory {
  /**
   * Create a cache instance based on configuration
   * @param type Cache type ('memory' | 'redis')
   * @param options Cache options
   * @returns Cache instance
   */
  static create(type: 'memory' | 'redis' = 'memory', options?: { redisUrl?: string }): ICache {
    switch (type) {
      case 'redis':
        try {
          return new RedisCache(options?.redisUrl);
        } catch (error) {
          console.warn('Falling back to MemoryCache due to Redis initialization error');
          return new MemoryCache();
        }
      case 'memory':
      default:
        return new MemoryCache();
    }
  }
}
