/**
 * Менеджер кэширования для повышения производительности
 */

import { CachedResult } from './types.js';

export class CacheManager {
  private cache = new Map<string, CachedResult>();

  /**
   * Получить данные из кэша или вычислить их
   * @param key Ключ кэша
   * @param compute Функция для вычисления данных, если они отсутствуют в кэше
   * @param ttl Время жизни кэша в миллисекундах (по умолчанию 1 час)
   */
  async getOrCompute<T>(
    key: string,
    compute: () => Promise<T>,
    ttl: number = 3600000 // 1 час
  ): Promise<T> {
    const cached = this.cache.get(key);

    if (cached && cached.expiry > Date.now()) {
      console.log(`✅ Cache hit for key: ${key}`);
      return cached.data as T;
    }

    console.log(`❌ Cache miss for key: ${key}`);
    const result = await compute();

    this.cache.set(key, {
      data: result,
      expiry: Date.now() + ttl,
    });

    return result;
  }

  /**
   * Инвалидировать кэш по ключу
   */
  invalidate(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Инвалидировать все ключи, соответствующие паттерну
   */
  invalidatePattern(pattern: string): number {
    const regex = new RegExp(pattern);
    let count = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Очистить весь кэш
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Получить статистику кэша
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Получить информацию о конкретном ключе кэша
   */
  getCacheInfo(key: string): { exists: boolean; expiry?: Date; ttl?: number } {
    const cached = this.cache.get(key);

    if (!cached) {
      return { exists: false };
    }

    return {
      exists: true,
      expiry: new Date(cached.expiry),
      ttl: Math.max(0, cached.expiry - Date.now()),
    };
  }

  /**
   * Очистка устаревших записей
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, cached] of this.cache.entries()) {
      if (cached.expiry <= now) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
    }

    return cleaned;
  }
}
