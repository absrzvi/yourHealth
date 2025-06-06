import { MemoryCache, RedisCache, CacheFactory } from '../cache';

// Get the mock Redis client from our setup
const { mockRedis } = jest.requireMock('redis');

describe('Cache', () => {
  describe('MemoryCache', () => {
    let cache: MemoryCache;
    
    beforeEach(() => {
      cache = new MemoryCache();
    });
    
    afterEach(() => {
      // Clear cache between tests
      cache.clear();
    });
    
    it('should set and get a value', async () => {
      const key = 'test-key';
      const value = { foo: 'bar' };
      
      await cache.set(key, value);
      const result = await cache.get(key);
      
      expect(result).toEqual(value);
    });
    
    it('should return null for non-existent key', async () => {
      const result = await cache.get('non-existent');
      expect(result).toBeNull();
    });
    
    it('should delete a key', async () => {
      const key = 'test-key';
      const value = { foo: 'bar' };
      
      await cache.set(key, value);
      await cache.delete(key);
      const result = await cache.get(key);
      
      expect(result).toBeNull();
    });
    
    it('should clear all keys', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      
      await cache.clear();
      
      expect(await cache.get('key1')).toBeNull();
      expect(await cache.get('key2')).toBeNull();
    });
    
    it('should respect TTL', async () => {
      jest.useFakeTimers();
      
      const key = 'test-key';
      const value = { foo: 'bar' };
      
      // Set with 1 second TTL
      await cache.set(key, value, 1000);
      
      // Before TTL expires
      expect(await cache.get(key)).toEqual(value);
      
      // Fast-forward time
      jest.advanceTimersByTime(1001);
      
      // After TTL expires
      expect(await cache.get(key)).toBeNull();
      
      jest.useRealTimers();
    });
  });
  
  describe('RedisCache', () => {
    let cache: RedisCache;
    let mockRedisClient: any;
    
    beforeEach(() => {
      cache = new RedisCache('redis://localhost:6379');
      mockRedisClient = (cache as any).client;
    });
    
    afterEach(async () => {
      await cache.clear();
    });
    
    it('should set and get a value', async () => {
      const key = 'test-key';
      const value = { foo: 'bar' };
      
      // Mock Redis get to return the stringified value
      (mockRedisClient.get as jest.Mock).mockResolvedValueOnce(JSON.stringify(value));
      
      await cache.set(key, value);
      const result = await cache.get(key);
      
      expect(result).toEqual(value);
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        key,
        JSON.stringify(value),
        { EX: 3600 } // Default TTL
      );
    });
    
    it('should return null for non-existent key', async () => {
      (mockRedisClient.get as jest.Mock).mockResolvedValueOnce(null);
      
      const result = await cache.get('non-existent');
      expect(result).toBeNull();
    });
    
    it('should delete a key', async () => {
      const key = 'test-key';
      
      await cache.delete(key);
      
      expect(mockRedisClient.del).toHaveBeenCalledWith(key);
    });
    
    it('should clear all keys', async () => {
      await cache.clear();
      
      expect(mockRedisClient.flushAll).toHaveBeenCalled();
    });
    
    it('should handle JSON parse errors', async () => {
      const key = 'test-key';
      
      // Mock Redis to return invalid JSON
      (mockRedisClient.get as jest.Mock).mockResolvedValueOnce('{invalid-json');
      
      const result = await cache.get(key);
      
      expect(result).toBeNull();
    });
  });
  
  describe('CacheFactory', () => {
    it('should create a MemoryCache instance', () => {
      const cache = CacheFactory.create('memory');
      
      expect(cache).toBeInstanceOf(MemoryCache);
    });
    
    it('should create a RedisCache instance', () => {
      const cache = CacheFactory.create('redis', { redisUrl: 'redis://localhost:6379' });
      
      expect(cache).toBeInstanceOf(RedisCache);
    });
    
    it('should default to MemoryCache for unknown types', () => {
      const cache = CacheFactory.create('unknown' as any);
      
      expect(cache).toBeInstanceOf(MemoryCache);
    });
  });
});
