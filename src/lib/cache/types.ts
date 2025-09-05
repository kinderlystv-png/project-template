export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  tags?: string[];
  hits?: number;
}

export interface CacheConfig {
  defaultTTL: number;
  maxSize: number;
  enableStats: boolean;
  storage: 'memory' | 'localStorage' | 'sessionStorage';
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  memoryUsage: number;
}

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  storage?: 'memory' | 'localStorage' | 'sessionStorage';
}
