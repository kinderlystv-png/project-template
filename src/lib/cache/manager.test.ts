/**
 * Тесты для кэш-менеджера
 * @file src/lib/cache/manager.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CacheManager } from './manager.js';

describe('CacheManager', () => {
  let cache: CacheManager;

  beforeEach(() => {
    cache = new CacheManager();
  });

  describe('Основные операции', () => {
    it('должен создаваться с конфигурацией по умолчанию', () => {
      expect(cache).toBeDefined();
      expect(cache).toBeInstanceOf(CacheManager);
    });

    it('должен сохранять и получать данные', async () => {
      const testData = { message: 'test' };

      cache.set('test-key', testData);
      const result = await cache.get('test-key');

      expect(result).toEqual(testData);
    });

    it('должен возвращать null для несуществующих ключей', async () => {
      const result = await cache.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('должен удалять данные', async () => {
      cache.set('test-key', 'test-data');

      cache.delete('test-key');

      const result = await cache.get('test-key');
      expect(result).toBeNull();
    });
    it('должен очищать весь кэш', async () => {
      cache.set('key1', 'data1');
      cache.set('key2', 'data2');

      cache.clear();

      const result1 = await cache.get('key1');
      const result2 = await cache.get('key2');

      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });

    it('должен проверять существование ключей', () => {
      expect(cache.has('test-key')).toBe(false);

      cache.set('test-key', 'test-data');
      expect(cache.has('test-key')).toBe(true);
    });
  });

  describe('TTL (время жизни)', () => {
    it('должен учитывать TTL при сохранении', async () => {
      cache.set('test-key', 'test-data', { ttl: 100 });

      let result = await cache.get('test-key');
      expect(result).toBe('test-data');

      // Симулируем истечение времени
      vi.useFakeTimers();
      vi.advanceTimersByTime(150);

      result = await cache.get('test-key');
      expect(result).toBeNull();

      vi.useRealTimers();
    });

    it('должен использовать TTL по умолчанию', async () => {
      const customCache = new CacheManager({ defaultTTL: 50 });

      customCache.set('test-key', 'test-data');

      vi.useFakeTimers();
      vi.advanceTimersByTime(75);

      const result = await customCache.get('test-key');
      expect(result).toBeNull();

      vi.useRealTimers();
    });
  });

  describe('Fetcher функциональность', () => {
    it('должен вызывать fetcher при отсутствии данных в кэше', async () => {
      const mockFetcher = vi.fn().mockResolvedValue('fetched-data');

      const result = await cache.get('test-key', mockFetcher);

      expect(mockFetcher).toHaveBeenCalledOnce();
      expect(result).toBe('fetched-data');
    });

    it('должен сохранять данные от fetcher в кэш', async () => {
      const mockFetcher = vi.fn().mockResolvedValue('fetched-data');

      await cache.get('test-key', mockFetcher);

      // Повторный запрос не должен вызывать fetcher
      const result = await cache.get('test-key', mockFetcher);

      expect(mockFetcher).toHaveBeenCalledOnce();
      expect(result).toBe('fetched-data');
    });

    it('должен обрабатывать ошибки fetcher', async () => {
      const mockFetcher = vi.fn().mockRejectedValue(new Error('Fetch failed'));

      await expect(cache.get('test-key', mockFetcher)).rejects.toThrow('Fetch failed');
    });

    it('должен возвращать устаревшие данные при ошибке fetcher', async () => {
      // Сначала сохраняем данные
      cache.set('test-key', 'old-data', { ttl: 50 });

      // Ждем истечения TTL
      vi.useFakeTimers();
      vi.advanceTimersByTime(75);

      // Fetcher выбрасывает ошибку
      const mockFetcher = vi.fn().mockRejectedValue(new Error('Fetch failed'));

      const result = await cache.get('test-key', mockFetcher);

      expect(result).toBe('old-data');

      vi.useRealTimers();
    });
  });

  describe('Статистика', () => {
    it('должен получать статистику кэша', () => {
      const stats = cache.getStats();

      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('sets');
      expect(stats).toHaveProperty('deletes');
    });

    it('должен считать hits и misses', async () => {
      cache.set('test-key', 'test-data');

      // Hit
      await cache.get('test-key');

      // Miss
      await cache.get('non-existent-key');

      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });
  });

  describe('Теги', () => {
    it('должен удалять записи по одному тегу', async () => {
      cache.set('key1', 'data1', { tags: ['tag1', 'tag2'] });
      cache.set('key2', 'data2', { tags: ['tag2', 'tag3'] });
      cache.set('key3', 'data3', { tags: ['tag3'] });

      cache.invalidateByTags(['tag2']);

      expect(await cache.get('key1')).toBeNull();
      expect(await cache.get('key2')).toBeNull();
      expect(await cache.get('key3')).toBe('data3');
    });

    it('должен удалять записи по нескольким тегам', async () => {
      cache.set('key1', 'data1', { tags: ['tag1'] });
      cache.set('key2', 'data2', { tags: ['tag2'] });
      cache.set('key3', 'data3', { tags: ['tag3'] });

      cache.invalidateByTags(['tag1', 'tag3']);

      expect(await cache.get('key1')).toBeNull();
      expect(await cache.get('key2')).toBe('data2');
      expect(await cache.get('key3')).toBeNull();
    });
  });

  describe('Размер кэша', () => {
    it('должен ограничивать размер кэша', () => {
      const smallCache = new CacheManager({ maxSize: 2 });

      smallCache.set('key1', 'data1');
      smallCache.set('key2', 'data2');
      smallCache.set('key3', 'data3'); // Должно вытеснить key1

      expect(smallCache.has('key1')).toBe(false);
      expect(smallCache.has('key2')).toBe(true);
      expect(smallCache.has('key3')).toBe(true);
    });
  });

  describe('Конфигурация', () => {
    it('должен применять пользовательскую конфигурацию', () => {
      const config = {
        defaultTTL: 5000,
        maxSize: 500,
        enableStats: false,
        storage: 'memory' as const,
      };

      const customCache = new CacheManager(config);

      expect(customCache).toBeDefined();
      // Косвенно проверяем, что конфигурация применилась
      customCache.set('test', 'data');
      expect(customCache.has('test')).toBe(true);
    });
  });
});
