import type { CacheConfig, CacheEntry, CacheOptions, CacheStats } from './types.js';

export class CacheManager {
  private memory = new Map<string, CacheEntry<unknown>>();
  private config: CacheConfig;
  private stats: CacheStats;
  private cleanupTimer: number | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 3600000, // 1 час
      maxSize: 1000,
      enableStats: true,
      storage: 'memory',
      ...config,
    };

    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      memoryUsage: 0,
    };

    this.startCleanupTimer();
  }

  /**
   * Получение данных из кэша с возможностью автоматической загрузки
   */
  async get<T>(
    key: string,
    fetcher?: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T | null> {
    const { ttl = this.config.defaultTTL, tags = [], storage = this.config.storage } = options;

    // Проверяем кэш
    const cached = this.getFromCache<T>(key, storage);
    if (cached && !this.isExpired(cached)) {
      this.updateStats('hit');
      this.incrementHits(cached);
      return cached.data;
    }

    this.updateStats('miss');

    // Если нет fetcher, возвращаем null
    if (!fetcher) return null;

    // Получаем новые данные
    try {
      const data = await fetcher();
      this.set(key, data, { ttl, tags, storage });
      return data;
    } catch (error) {
      // Если есть устаревшие данные, возвращаем их
      if (cached) {
        return cached.data;
      }
      throw error;
    }
  }

  /**
   * Сохранение данных в кэш
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const { ttl = this.config.defaultTTL, tags = [], storage = this.config.storage } = options;

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      tags,
      hits: 0,
    };

    this.setToCache(key, entry, storage);
    this.updateStats('set');
    this.enforceMaxSize();
  }

  /**
   * Проверка наличия ключа в кэше
   */
  has(
    key: string,
    storage: 'memory' | 'localStorage' | 'sessionStorage' = this.config.storage
  ): boolean {
    const entry = this.getFromCache(key, storage);
    return entry !== null && !this.isExpired(entry);
  }

  /**
   * Удаление из кэша
   */
  delete(key: string): void {
    this.memory.delete(key);
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
    this.updateStats('delete');
  }

  /**
   * Очистка кэша по тегам
   */
  invalidateByTags(tags: string[]): void {
    // Очистка из памяти
    this.memory.forEach((entry, key) => {
      if (entry.tags?.some(tag => tags.includes(tag))) {
        this.memory.delete(key);
        this.updateStats('delete');
      }
    });

    // Очистка из localStorage
    this.clearStorageByTags(localStorage, tags);

    // Очистка из sessionStorage
    this.clearStorageByTags(sessionStorage, tags);
  }

  /**
   * Полная очистка кэша
   */
  clear(): void {
    this.memory.clear();

    // Очищаем только наши ключи из storage
    this.clearOurStorageKeys(localStorage);
    this.clearOurStorageKeys(sessionStorage);

    this.resetStats();
  }

  /**
   * Получение статистики кэша
   */
  getStats(): CacheStats {
    return {
      ...this.stats,
      memoryUsage: this.calculateMemoryUsage(),
    };
  }

  /**
   * Получение всех ключей
   */
  getKeys(): string[] {
    const keys = new Set<string>();

    // Из памяти
    this.memory.forEach((_, key) => keys.add(key));

    // Из localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && this.isOurKey(key)) {
        keys.add(key);
      }
    }

    // Из sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && this.isOurKey(key)) {
        keys.add(key);
      }
    }

    return Array.from(keys);
  }

  /**
   * Принудительная очистка устаревших записей
   */
  cleanup(): void {
    const now = Date.now();

    // Очистка памяти
    this.memory.forEach((entry, key) => {
      if (this.isExpired(entry)) {
        this.memory.delete(key);
        this.updateStats('eviction');
      }
    });

    // Очистка localStorage
    this.cleanupStorage(localStorage);

    // Очистка sessionStorage
    this.cleanupStorage(sessionStorage);
  }

  /**
   * Уничтожение экземпляра кэша
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
  }

  // Приватные методы

  private getFromCache<T>(key: string, storage: string): CacheEntry<T> | null {
    switch (storage) {
      case 'memory':
        return (this.memory.get(key) as CacheEntry<T>) || null;
      case 'localStorage':
      case 'sessionStorage':
        return this.getFromStorage(this.getStorage(storage), key);
      default:
        return null;
    }
  }

  private setToCache<T>(key: string, entry: CacheEntry<T>, storage: string): void {
    switch (storage) {
      case 'memory':
        this.memory.set(key, entry as CacheEntry<unknown>);
        break;
      case 'localStorage':
      case 'sessionStorage':
        this.setToStorage(this.getStorage(storage), key, entry);
        break;
    }
  }

  private getFromStorage<T>(storage: Storage, key: string): CacheEntry<T> | null {
    try {
      const item = storage.getItem(this.prefixKey(key));
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  private setToStorage<T>(storage: Storage, key: string, entry: CacheEntry<T>): void {
    try {
      storage.setItem(this.prefixKey(key), JSON.stringify(entry));
    } catch (error) {
      // Storage is full or unavailable, fallback to memory
      this.memory.set(key, entry as CacheEntry<unknown>);
    }
  }

  private getStorage(storageType: string): Storage {
    return storageType === 'localStorage' ? localStorage : sessionStorage;
  }

  private isExpired(entry: CacheEntry<unknown>): boolean {
    return Date.now() > entry.timestamp + entry.ttl;
  }

  private incrementHits(entry: CacheEntry<unknown>): void {
    if (entry.hits !== undefined) {
      entry.hits++;
    }
  }

  private clearStorageByTags(storage: Storage, tags: string[]): void {
    const keysToDelete: string[] = [];

    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && this.isOurKey(key)) {
        try {
          const entry = JSON.parse(storage.getItem(key) || '{}');
          if (entry.tags?.some((tag: string) => tags.includes(tag))) {
            keysToDelete.push(key);
          }
        } catch {
          // Ignore invalid entries
        }
      }
    }

    keysToDelete.forEach(key => {
      storage.removeItem(key);
      this.updateStats('delete');
    });
  }

  private clearOurStorageKeys(storage: Storage): void {
    const keysToDelete: string[] = [];

    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && this.isOurKey(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => storage.removeItem(key));
  }

  private cleanupStorage(storage: Storage): void {
    const keysToDelete: string[] = [];

    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && this.isOurKey(key)) {
        try {
          const entry = JSON.parse(storage.getItem(key) || '{}');
          if (this.isExpired(entry)) {
            keysToDelete.push(key);
          }
        } catch {
          // Remove invalid entries
          keysToDelete.push(key);
        }
      }
    }

    keysToDelete.forEach(key => {
      storage.removeItem(key);
      this.updateStats('eviction');
    });
  }

  private prefixKey(key: string): string {
    return `cache_${key}`;
  }

  private isOurKey(key: string): boolean {
    return key.startsWith('cache_');
  }

  private enforceMaxSize(): void {
    if (this.memory.size <= this.config.maxSize) return;

    // Удаляем наименее используемые записи (LRU)
    const entries = Array.from(this.memory.entries())
      .map(([key, entry]) => ({ key, entry, lastUsed: entry.timestamp + (entry.hits || 0) }))
      .sort((a, b) => a.lastUsed - b.lastUsed);

    const toRemove = this.memory.size - this.config.maxSize;
    for (let i = 0; i < toRemove; i++) {
      this.memory.delete(entries[i].key);
      this.updateStats('eviction');
    }
  }

  private calculateMemoryUsage(): number {
    let usage = 0;
    this.memory.forEach(entry => {
      try {
        usage += JSON.stringify(entry).length * 2; // Примерный размер в байтах
      } catch {
        usage += 100; // Базовый размер для неserializable объектов
      }
    });
    return usage;
  }

  private updateStats(operation: keyof CacheStats): void {
    if (!this.config.enableStats) return;

    switch (operation) {
      case 'hits':
        this.stats.hits++;
        break;
      case 'misses':
        this.stats.misses++;
        break;
      case 'sets':
        this.stats.sets++;
        break;
      case 'deletes':
        this.stats.deletes++;
        break;
      case 'evictions':
        this.stats.evictions++;
        break;
    }
  }

  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      memoryUsage: 0,
    };
  }

  private startCleanupTimer(): void {
    // Очистка каждые 5 минут
    this.cleanupTimer = window.setInterval(() => {
      this.cleanup();
    }, 300000);
  }
}

// Глобальный экземпляр кэша
export const cache = new CacheManager();
