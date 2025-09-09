"use strict";
/**
 * Менеджер кэширования для повышения производительности
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheManager = void 0;
class CacheManager {
    cache = new Map();
    /**
     * Получить данные из кэша или вычислить их
     * @param key Ключ кэша
     * @param compute Функция для вычисления данных, если они отсутствуют в кэше
     * @param ttl Время жизни кэша в миллисекундах (по умолчанию 1 час)
     */
    async getOrCompute(key, compute, ttl = 3600000 // 1 час
    ) {
        const cached = this.cache.get(key);
        if (cached && cached.expiry > Date.now()) {
            console.log(`✅ Cache hit for key: ${key}`);
            return cached.data;
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
    invalidate(key) {
        return this.cache.delete(key);
    }
    /**
     * Инвалидировать все ключи, соответствующие паттерну
     */
    invalidatePattern(pattern) {
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
    clear() {
        this.cache.clear();
    }
    /**
     * Получить статистику кэша
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
        };
    }
    /**
     * Получить информацию о конкретном ключе кэша
     */
    getCacheInfo(key) {
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
    cleanup() {
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
exports.CacheManager = CacheManager;
//# sourceMappingURL=cache-manager.js.map