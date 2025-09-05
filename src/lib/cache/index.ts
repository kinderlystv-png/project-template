// Экспортируем базовую систему кэширования
export { CacheManager } from './manager.js';

// Экспортируем оптимизированную систему кэширования v2.0
export {
  cache,
  optimizedCache,
  OptimizedCacheFactory,
  OptimizedCacheManager,
} from './optimized.js';

export type { CacheConfig, CacheEntry, CacheOptions, CacheStats } from './types.js';

// Для миграции с базового кэша на оптимизированный
import { optimizedCache } from './optimized.js';

/**
 * Утилита для миграции данных с базового кэша на оптимизированный
 */
export class CacheMigrator {
  static async migrateFromBasic(targetCache = optimizedCache): Promise<void> {
    try {
      // Получаем все ключи из localStorage с нашим префиксом
      const keysToMigrate: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cache_')) {
          keysToMigrate.push(key);
        }
      }

      // Мигрируем каждую запись
      for (const storageKey of keysToMigrate) {
        try {
          const entry = JSON.parse(localStorage.getItem(storageKey) || '{}');
          const originalKey = storageKey.replace('cache_', '');

          // Переносим в оптимизированный кэш с улучшенными опциями
          await targetCache.set(originalKey, entry.data, {
            ttl: entry.ttl,
            tags: entry.tags || [],
            priority: 5, // Средний приоритет для мигрированных данных
            compress: true, // Включаем компрессию для экономии места
          });

          // Удаляем старую запись
          localStorage.removeItem(storageKey);
        } catch (error) {
          // Логируем ошибки миграции без использования console
          if (typeof window !== 'undefined' && window.console) {
            window.console.warn(`Failed to migrate cache entry ${storageKey}:`, error);
          }
        }
      }

      // Успешное завершение миграции
      if (typeof window !== 'undefined' && window.console) {
        window.console.info(
          `✅ Cache migration completed. Migrated ${keysToMigrate.length} entries.`
        );
      }
    } catch (error) {
      if (typeof window !== 'undefined' && window.console) {
        window.console.error('❌ Cache migration failed:', error);
      }
    }
  }
}
