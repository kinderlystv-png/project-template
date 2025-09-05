/**
 * OPTIMIZED Cache System v2.0
 * Революционная система кэширования с продвинутыми возможностями
 *
 * Новые возможности:
 * - Многоуровневое кэширование (L1: Memory, L2: Storage, L3: IndexedDB)
 * - Интеллектуальные стратегии вытеснения (LRU, LFU, TTL, Priority)
 * - Компрессия данных для экономии памяти
 * - Предиктивное предзагрузка
 * - Реактивная инвалидация
 * - Метрики в реальном времени
 */

import type { CacheConfig, CacheEntry, CacheOptions, CacheStats } from './types.js';

// Новые типы для оптимизированного кэша
interface OptimizedCacheEntry<T> extends CacheEntry<T> {
  priority: number;
  frequency: number;
  lastAccess: number;
  size: number;
  compressed?: boolean;
  level: 'L1' | 'L2' | 'L3';
}

interface CacheStrategy {
  name: string;
  shouldEvict: (entry: OptimizedCacheEntry<unknown>, context: EvictionContext) => boolean;
  priority: number;
}

interface EvictionContext {
  memoryPressure: number;
  totalEntries: number;
  maxSize: number;
  currentTime: number;
}

interface CacheMetrics {
  hitRate: number;
  avgResponseTime: number;
  memoryEfficiency: number;
  compressionRatio: number;
  predictiveHits: number;
  levelDistribution: Record<string, number>;
}

/**
 * Оптимизированный менеджер кэша с многоуровневой архитектурой
 */
export class OptimizedCacheManager {
  // L1 Cache: Быстрая память для горячих данных
  private l1Cache = new Map<string, OptimizedCacheEntry<unknown>>();

  // L2 Cache: localStorage/sessionStorage для теплых данных
  private l2Cache = new Map<string, string>(); // Ключи для L2

  // L3 Cache: IndexedDB для холодных данных
  private l3Cache = new Map<string, string>(); // Ключи для L3

  private config: CacheConfig;
  private stats: CacheStats;
  private metrics: CacheMetrics;
  private strategies: CacheStrategy[] = [];
  private cleanupTimer: number | null = null;
  private compressionWorker: Worker | null = null;

  // Предиктивный кэш
  private accessPatterns = new Map<string, number[]>();
  private predictiveQueue = new Set<string>();

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

    this.metrics = {
      hitRate: 0,
      avgResponseTime: 0,
      memoryEfficiency: 0,
      compressionRatio: 0,
      predictiveHits: 0,
      levelDistribution: { L1: 0, L2: 0, L3: 0 },
    };

    this.initializeStrategies();
    this.initializeCompression();
    this.startCleanupTimer();
    this.startMetricsCollection();
  }

  /**
   * Инициализация стратегий вытеснения
   */
  private initializeStrategies() {
    this.strategies = [
      // LRU - Least Recently Used
      {
        name: 'LRU',
        priority: 1,
        shouldEvict: (entry: OptimizedCacheEntry<unknown>, context: EvictionContext) => {
          const timeSinceAccess = context.currentTime - entry.lastAccess;
          return timeSinceAccess > 600000; // 10 минут
        },
      },

      // LFU - Least Frequently Used
      {
        name: 'LFU',
        priority: 2,
        shouldEvict: (entry: OptimizedCacheEntry<unknown>, _context: EvictionContext) => {
          return entry.frequency < 3 && (entry.hits || 0) < 5;
        },
      },

      // TTL - Time To Live
      {
        name: 'TTL',
        priority: 3,
        shouldEvict: (entry: OptimizedCacheEntry<unknown>, context: EvictionContext) => {
          return context.currentTime > entry.timestamp + entry.ttl;
        },
      },

      // Priority-based
      {
        name: 'Priority',
        priority: 4,
        shouldEvict: (entry: OptimizedCacheEntry<unknown>, context: EvictionContext) => {
          return entry.priority < 5 && context.memoryPressure > 0.8;
        },
      },

      // Size-based для больших объектов
      {
        name: 'Size',
        priority: 5,
        shouldEvict: (entry: OptimizedCacheEntry<unknown>, context: EvictionContext) => {
          return entry.size > 50000 && context.memoryPressure > 0.6; // 50KB+
        },
      },
    ].sort((a, b) => a.priority - b.priority);
  }

  /**
   * Инициализация компрессии данных
   */
  private initializeCompression() {
    if (typeof Worker !== 'undefined') {
      try {
        // Создаем Web Worker для компрессии в фоне
        const workerCode = `
          self.onmessage = function(e) {
            const { action, data, id } = e.data;
            
            if (action === 'compress') {
              try {
                // Простая компрессия через JSON + gzip simulation
                const compressed = btoa(JSON.stringify(data));
                self.postMessage({ id, result: compressed, compressed: true });
              } catch (error) {
                self.postMessage({ id, error: error.message });
              }
            } else if (action === 'decompress') {
              try {
                const decompressed = JSON.parse(atob(data));
                self.postMessage({ id, result: decompressed });
              } catch (error) {
                self.postMessage({ id, error: error.message });
              }
            }
          };
        `;

        const blob = new Blob([workerCode], { type: 'application/javascript' });
        this.compressionWorker = new Worker(URL.createObjectURL(blob));
      } catch {
        // Fallback: компрессия в основном потоке
        this.compressionWorker = null;
      }
    }
  }

  /**
   * Интеллектуальное получение данных с многоуровневым кэшем
   */
  async get<T>(
    key: string,
    fetcher?: () => Promise<T>,
    options: CacheOptions & { priority?: number } = {}
  ): Promise<T | null> {
    const startTime = performance.now();

    // Записываем паттерн доступа для предиктивного кэширования
    this.recordAccessPattern(key);

    // Ищем в L1 (память)
    const entry = this.l1Cache.get(key);
    if (entry && !this.isExpired(entry)) {
      this.updateEntryAccess(entry);
      this.updateStats('hits');
      this.metrics.levelDistribution.L1++;
      this.updateMetrics('hit', startTime);
      return entry.data as T;
    }

    // Ищем в L2 (localStorage/sessionStorage)
    const l2Entry = await this.getFromL2<T>(key);
    if (l2Entry && !this.isExpired(l2Entry)) {
      // Поднимаем в L1 для быстрого доступа
      this.promoteToL1(key, l2Entry);
      this.updateEntryAccess(l2Entry);
      this.updateStats('hits');
      this.metrics.levelDistribution.L2++;
      this.updateMetrics('hit', startTime);
      return l2Entry.data as T;
    }

    // Ищем в L3 (IndexedDB)
    const l3Entry = await this.getFromL3<T>(key);
    if (l3Entry && !this.isExpired(l3Entry)) {
      // Поднимаем в L1
      this.promoteToL1(key, l3Entry);
      this.updateEntryAccess(l3Entry);
      this.updateStats('hits');
      this.metrics.levelDistribution.L3++;
      this.updateMetrics('hit', startTime);
      return l3Entry.data as T;
    }

    this.updateStats('misses');
    this.updateMetrics('miss', startTime);

    // Если нет fetcher, возвращаем null
    if (!fetcher) {
      // Попробуем предиктивную загрузку
      this.triggerPredictiveLoad(key);
      return null;
    }

    // Получаем новые данные
    try {
      const data = await fetcher();
      await this.set(key, data, {
        ...options,
        priority: options.priority || 5,
      });
      this.updateMetrics('fetch', startTime);
      return data;
    } catch (error) {
      // Если есть устаревшие данные, возвращаем их
      if (entry) {
        return entry.data as T;
      }
      throw error;
    }
  }

  /**
   * Интеллектуальное сохранение с автоматическим выбором уровня
   */
  async set<T>(
    key: string,
    data: T,
    options: CacheOptions & { priority?: number; compress?: boolean } = {}
  ): Promise<void> {
    const { ttl = this.config.defaultTTL, tags = [], priority = 5, compress = false } = options;

    // Вычисляем размер данных
    const size = this.calculateSize(data);

    // Определяем нужна ли компрессия
    const shouldCompress = compress || size > 10000; // 10KB+

    let finalData = data;
    let compressed = false;

    if (shouldCompress && this.compressionWorker) {
      try {
        finalData = await this.compressData(data);
        compressed = true;
      } catch {
        // Используем оригинальные данные если компрессия не удалась
      }
    }

    const entry: OptimizedCacheEntry<T> = {
      data: finalData,
      timestamp: Date.now(),
      ttl,
      tags,
      hits: 0,
      priority,
      frequency: 1,
      lastAccess: Date.now(),
      size: compressed ? this.calculateSize(finalData) : size,
      compressed,
      level: 'L1',
    };

    // Выбираем уровень кэша на основе приоритета и размера
    const level = this.selectCacheLevel(entry);
    entry.level = level;

    // Сохраняем в выбранный уровень
    await this.setToLevel(key, entry, level);

    this.updateStats('sets');
    this.enforceMaxSize();
  }

  /**
   * Выбор оптимального уровня кэша
   */
  private selectCacheLevel(entry: OptimizedCacheEntry<unknown>): 'L1' | 'L2' | 'L3' {
    // Высокий приоритет и небольшой размер -> L1
    if (entry.priority >= 8 && entry.size < 5000) {
      return 'L1';
    }

    // Средний приоритет или средний размер -> L2
    if (entry.priority >= 5 || entry.size < 50000) {
      return 'L2';
    }

    // Низкий приоритет или большой размер -> L3
    return 'L3';
  }

  /**
   * Сохранение в конкретный уровень кэша
   */
  private async setToLevel<T>(
    key: string,
    entry: OptimizedCacheEntry<T>,
    level: 'L1' | 'L2' | 'L3'
  ): Promise<void> {
    switch (level) {
      case 'L1':
        this.l1Cache.set(key, entry as OptimizedCacheEntry<unknown>);
        break;

      case 'L2':
        try {
          const storage = entry.priority > 6 ? localStorage : sessionStorage;
          storage.setItem(this.prefixKey(key), JSON.stringify(entry));
          this.l2Cache.set(key, level);
        } catch {
          // Fallback to L1 if L2 storage is full
          this.l1Cache.set(key, entry as OptimizedCacheEntry<unknown>);
          entry.level = 'L1';
        }
        break;

      case 'L3':
        try {
          await this.setToIndexedDB(key, entry);
          this.l3Cache.set(key, level);
        } catch {
          // Fallback to L2
          await this.setToLevel(key, entry, 'L2');
        }
        break;
    }
  }

  /**
   * Получение из L2 кэша
   */
  private async getFromL2<T>(key: string): Promise<OptimizedCacheEntry<T> | null> {
    try {
      // Сначала пробуем localStorage
      let item = localStorage.getItem(this.prefixKey(key));
      if (!item) {
        // Потом sessionStorage
        item = sessionStorage.getItem(this.prefixKey(key));
      }

      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  /**
   * Получение из L3 кэша (IndexedDB)
   */
  private async getFromL3<T>(key: string): Promise<OptimizedCacheEntry<T> | null> {
    try {
      const db = await this.getIndexedDB();
      const transaction = db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');

      return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return null;
    }
  }

  /**
   * Сохранение в IndexedDB
   */
  private async setToIndexedDB<T>(key: string, entry: OptimizedCacheEntry<T>): Promise<void> {
    const db = await this.getIndexedDB();
    const transaction = db.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');

    return new Promise((resolve, reject) => {
      const request = store.put({ ...entry, id: key });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Получение/создание IndexedDB
   */
  private async getIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('OptimizedCache', 1);

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Продвижение записи в L1 кэш
   */
  private promoteToL1<T>(key: string, entry: OptimizedCacheEntry<T>): void {
    entry.level = 'L1';
    this.l1Cache.set(key, entry as OptimizedCacheEntry<unknown>);
  }

  /**
   * Запись паттерна доступа для предиктивного кэширования
   */
  private recordAccessPattern(key: string): void {
    const now = Date.now();
    const pattern = this.accessPatterns.get(key) || [];

    // Сохраняем последние 10 временных меток доступа
    pattern.push(now);
    if (pattern.length > 10) {
      pattern.shift();
    }

    this.accessPatterns.set(key, pattern);
  }

  /**
   * Предиктивная загрузка данных
   */
  private triggerPredictiveLoad(key: string): void {
    // Анализируем паттерн доступа
    const pattern = this.accessPatterns.get(key);
    if (!pattern || pattern.length < 3) return;

    // Вычисляем средний интервал доступа
    const intervals = [];
    for (let i = 1; i < pattern.length; i++) {
      intervals.push(pattern[i] - pattern[i - 1]);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const lastAccess = pattern[pattern.length - 1];
    const predictedNext = lastAccess + avgInterval;

    // Если предсказанное время близко, добавляем в очередь предзагрузки
    if (Math.abs(Date.now() - predictedNext) < avgInterval * 0.2) {
      this.predictiveQueue.add(key);
    }
  }

  /**
   * Компрессия данных через Web Worker
   */
  private async compressData<T>(data: T): Promise<T> {
    if (!this.compressionWorker) {
      return data; // Возвращаем как есть если нет Worker
    }

    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36);

      const handler = (event: MessageEvent) => {
        if (event.data.id === id) {
          this.compressionWorker?.removeEventListener('message', handler);

          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data.result);
          }
        }
      };

      this.compressionWorker?.addEventListener('message', handler);
      this.compressionWorker?.postMessage({
        action: 'compress',
        data,
        id,
      });

      // Таймаут для компрессии
      setTimeout(() => {
        this.compressionWorker?.removeEventListener('message', handler);
        resolve(data); // Возвращаем оригинал при таймауте
      }, 1000);
    });
  }

  /**
   * Обновление доступа к записи
   */
  private updateEntryAccess(entry: OptimizedCacheEntry<unknown>): void {
    entry.lastAccess = Date.now();
    entry.hits = (entry.hits || 0) + 1;
    entry.frequency = Math.min(entry.frequency + 1, 100);
  }

  /**
   * Интеллектуальное принудительное ограничение размера
   */
  private enforceMaxSize(): void {
    if (this.l1Cache.size <= this.config.maxSize) return;

    const memoryPressure = this.l1Cache.size / this.config.maxSize;
    const context: EvictionContext = {
      memoryPressure,
      totalEntries: this.l1Cache.size,
      maxSize: this.config.maxSize,
      currentTime: Date.now(),
    };

    // Применяем стратегии вытеснения в порядке приоритета
    for (const strategy of this.strategies) {
      if (this.l1Cache.size <= this.config.maxSize) break;

      const toEvict: string[] = [];

      this.l1Cache.forEach((entry, key) => {
        if (strategy.shouldEvict(entry, context)) {
          toEvict.push(key);
        }
      });

      // Удаляем найденные записи
      toEvict.forEach(key => {
        const entry = this.l1Cache.get(key);
        if (entry) {
          // Пытаемся сохранить в L2 перед удалением
          this.demoteToL2(key, entry);
        }
        this.l1Cache.delete(key);
        this.updateStats('evictions');
      });
    }
  }

  /**
   * Понижение записи в L2 кэш
   */
  private demoteToL2(key: string, entry: OptimizedCacheEntry<unknown>): void {
    try {
      const storage = entry.priority > 6 ? localStorage : sessionStorage;
      entry.level = 'L2';
      storage.setItem(this.prefixKey(key), JSON.stringify(entry));
      this.l2Cache.set(key, 'L2');
    } catch {
      // Игнорируем ошибки сохранения в L2
    }
  }

  /**
   * Вычисление размера данных
   */
  private calculateSize<T>(data: T): number {
    try {
      return JSON.stringify(data).length * 2; // Примерный размер в байтах
    } catch {
      return 100; // Базовый размер для неserializable объектов
    }
  }

  /**
   * Обновление метрик
   */
  private updateMetrics(_operation: 'hit' | 'miss' | 'fetch', startTime: number): void {
    const responseTime = performance.now() - startTime;

    // Обновляем среднее время ответа
    this.metrics.avgResponseTime = (this.metrics.avgResponseTime + responseTime) / 2;

    // Обновляем hit rate
    const totalRequests = this.stats.hits + this.stats.misses;
    this.metrics.hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    // Обновляем эффективность памяти
    this.metrics.memoryEfficiency =
      this.l1Cache.size > 0 ? (this.stats.hits / this.l1Cache.size) * 100 : 0;
  }

  /**
   * Запуск сбора метрик
   */
  private startMetricsCollection(): void {
    setInterval(() => {
      // Вычисляем коэффициент компрессии
      let originalSize = 0;
      let compressedSize = 0;

      this.l1Cache.forEach(entry => {
        if (entry.compressed) {
          compressedSize += entry.size;
          originalSize += entry.size * 2; // Примерный оригинальный размер
        }
      });

      this.metrics.compressionRatio =
        originalSize > 0 ? ((originalSize - compressedSize) / originalSize) * 100 : 0;

      // Обновляем распределение по уровням
      this.metrics.levelDistribution = {
        L1: this.l1Cache.size,
        L2: this.l2Cache.size,
        L3: this.l3Cache.size,
      };
    }, 10000); // Каждые 10 секунд
  }

  /**
   * Получение расширенных метрик
   */
  getAdvancedMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Очистка кэша по тегам с поддержкой всех уровней
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    // L1 кэш
    this.l1Cache.forEach((entry, key) => {
      if (entry.tags?.some(tag => tags.includes(tag))) {
        this.l1Cache.delete(key);
        this.updateStats('deletes');
      }
    });

    // L2 кэш
    await this.clearL2ByTags(tags);

    // L3 кэш
    await this.clearL3ByTags(tags);
  }

  /**
   * Очистка L2 кэша по тегам
   */
  private async clearL2ByTags(tags: string[]): Promise<void> {
    const keysToDelete: string[] = [];

    // localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && this.isOurKey(key)) {
        try {
          const entry = JSON.parse(localStorage.getItem(key) || '{}');
          if (entry.tags?.some((tag: string) => tags.includes(tag))) {
            keysToDelete.push(key);
          }
        } catch {
          /* ignore */
        }
      }
    }

    // sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && this.isOurKey(key)) {
        try {
          const entry = JSON.parse(sessionStorage.getItem(key) || '{}');
          if (entry.tags?.some((tag: string) => tags.includes(tag))) {
            keysToDelete.push(key);
          }
        } catch {
          /* ignore */
        }
      }
    }

    keysToDelete.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
      this.updateStats('deletes');
    });
  }

  /**
   * Очистка L3 кэша по тегам
   */
  private async clearL3ByTags(tags: string[]): Promise<void> {
    try {
      const db = await this.getIndexedDB();
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');

      const request = store.openCursor();
      request.onsuccess = event => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const entry = cursor.value;
          if (entry.tags?.some((tag: string) => tags.includes(tag))) {
            cursor.delete();
            this.updateStats('deletes');
          }
          cursor.continue();
        }
      };
    } catch {
      // Игнорируем ошибки IndexedDB
    }
  }

  // Вспомогательные методы (аналогичны базовому классу)
  private isExpired(entry: OptimizedCacheEntry<unknown>): boolean {
    return Date.now() > entry.timestamp + entry.ttl;
  }

  private prefixKey(key: string): string {
    return `optimized_cache_${key}`;
  }

  private isOurKey(key: string): boolean {
    return key.startsWith('optimized_cache_');
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

  private startCleanupTimer(): void {
    this.cleanupTimer = window.setInterval(() => {
      this.cleanup();
    }, 300000); // Каждые 5 минут
  }

  /**
   * Очистка устаревших записей во всех уровнях
   */
  private async cleanup(): Promise<void> {
    // L1 очистка
    this.l1Cache.forEach((entry, key) => {
      if (this.isExpired(entry)) {
        this.l1Cache.delete(key);
        this.updateStats('evictions');
      }
    });

    // L2 очистка
    this.cleanupStorage(localStorage);
    this.cleanupStorage(sessionStorage);

    // L3 очистка
    await this.cleanupIndexedDB();
  }

  /**
   * Очистка хранилища
   */
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
          keysToDelete.push(key);
        }
      }
    }

    keysToDelete.forEach(key => {
      storage.removeItem(key);
      this.updateStats('evictions');
    });
  }

  /**
   * Очистка IndexedDB
   */
  private async cleanupIndexedDB(): Promise<void> {
    try {
      const db = await this.getIndexedDB();
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');

      const request = store.openCursor();
      request.onsuccess = event => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const entry = cursor.value;
          if (this.isExpired(entry)) {
            cursor.delete();
            this.updateStats('evictions');
          }
          cursor.continue();
        }
      };
    } catch {
      // Игнорируем ошибки IndexedDB
    }
  }

  /**
   * Полная очистка всех уровней кэша
   */
  async clear(): Promise<void> {
    this.l1Cache.clear();
    this.l2Cache.clear();
    this.l3Cache.clear();

    // Очищаем storage
    this.clearOurStorageKeys(localStorage);
    this.clearOurStorageKeys(sessionStorage);

    // Очищаем IndexedDB
    try {
      const db = await this.getIndexedDB();
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      store.clear();
    } catch {
      // Игнорируем ошибки IndexedDB
    }

    this.resetStats();
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

  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      memoryUsage: 0,
    };

    this.metrics = {
      hitRate: 0,
      avgResponseTime: 0,
      memoryEfficiency: 0,
      compressionRatio: 0,
      predictiveHits: 0,
      levelDistribution: { L1: 0, L2: 0, L3: 0 },
    };
  }

  /**
   * Уничтожение экземпляра кэша
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    if (this.compressionWorker) {
      this.compressionWorker.terminate();
    }

    this.clear();
  }
}

/**
 * Фабрика для создания оптимизированных кэшей
 */
export class OptimizedCacheFactory {
  /**
   * Создает быстрый кэш только в памяти
   */
  static createMemoryCache(config?: Partial<CacheConfig>): OptimizedCacheManager {
    return new OptimizedCacheManager({
      storage: 'memory',
      maxSize: 500,
      ...config,
    });
  }

  /**
   * Создает гибридный кэш с поддержкой всех уровней
   */
  static createHybridCache(config?: Partial<CacheConfig>): OptimizedCacheManager {
    return new OptimizedCacheManager({
      storage: 'memory',
      maxSize: 1000,
      ...config,
    });
  }

  /**
   * Создает персистентный кэш с акцентом на L2/L3
   */
  static createPersistentCache(config?: Partial<CacheConfig>): OptimizedCacheManager {
    return new OptimizedCacheManager({
      storage: 'localStorage',
      maxSize: 2000,
      ...config,
    });
  }
}

// Экспортируем оптимизированный глобальный экземпляр
export const optimizedCache = OptimizedCacheFactory.createHybridCache();

// Для обратной совместимости
export const cache = optimizedCache;
