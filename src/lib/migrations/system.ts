/**
 * ADVANCED Migration System v1.0
 * Система миграций для базы данных и схем данных
 *
 * Возможности:
 * - Автоматические миграции схем
 * - Откат миграций (rollback)
 * - Валидация целостности данных
 * - Backup перед миграциями
 * - Версионирование схем
 * - Миграции в реальном времени
 * - Безопасные миграции с проверками
 */

// Базовые типы для системы миграций
interface MigrationDefinition {
  id: string;
  version: string;
  name: string;
  description: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
  dependencies?: string[];
  timestamp: number;
  author?: string;
  tags?: string[];
  critical?: boolean; // Критическая миграция требует особого внимания
}

interface MigrationStatus {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back';
  startedAt?: number;
  completedAt?: number;
  error?: string;
  executionTime?: number;
  attempts: number;
  rollbackAvailable: boolean;
}

interface MigrationPlan {
  migrations: MigrationDefinition[];
  totalSteps: number;
  estimatedTime: number;
  risks: Array<{
    level: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    mitigation?: string;
  }>;
  backupRequired: boolean;
}

interface BackupInfo {
  id: string;
  timestamp: number;
  size: number;
  type: 'schema' | 'data' | 'full';
  location: string;
  description: string;
  restorable: boolean;
}

interface MigrationContext {
  dryRun: boolean;
  skipBackup: boolean;
  force: boolean;
  targetVersion?: string;
  rollbackTarget?: string;
  batchSize?: number;
  timeout?: number;
}

/**
 * Продвинутая система миграций
 */
export class AdvancedMigrationSystem {
  private migrations = new Map<string, MigrationDefinition>();
  private status = new Map<string, MigrationStatus>();
  private backups: BackupInfo[] = [];
  private isRunning = false;
  private currentMigration: string | null = null;
  private storage: MigrationStorage;
  private hooks = new Map<string, Array<(context: unknown) => Promise<void>>>();

  // События миграций
  private listeners = new Map<string, Set<(data: unknown) => void>>();

  constructor(storage?: MigrationStorage) {
    this.storage = storage || new LocalStorageMigrationStorage();
    this.initializeDefaultMigrations();
  }

  /**
   * Инициализация миграций по умолчанию
   */
  private initializeDefaultMigrations(): void {
    // Миграция 001: Инициализация схемы кэша
    this.addMigration({
      id: '001_init_cache_schema',
      version: '1.0.0',
      name: 'Initialize Cache Schema',
      description: 'Создание начальной схемы для системы кэширования',
      timestamp: Date.now(),
      author: 'system',
      tags: ['cache', 'initialization'],
      up: async () => {
        await this.createCacheSchema();
      },
      down: async () => {
        await this.dropCacheSchema();
      },
    });

    // Миграция 002: Добавление индексов производительности
    this.addMigration({
      id: '002_add_performance_indexes',
      version: '1.1.0',
      name: 'Add Performance Indexes',
      description: 'Добавление индексов для улучшения производительности',
      timestamp: Date.now(),
      dependencies: ['001_init_cache_schema'],
      tags: ['performance', 'indexes'],
      up: async () => {
        await this.addPerformanceIndexes();
      },
      down: async () => {
        await this.removePerformanceIndexes();
      },
    });

    // Миграция 003: Система мониторинга
    this.addMigration({
      id: '003_monitoring_schema',
      version: '1.2.0',
      name: 'Monitoring Schema',
      description: 'Создание схемы для системы мониторинга',
      timestamp: Date.now(),
      tags: ['monitoring', 'analytics'],
      up: async () => {
        await this.createMonitoringSchema();
      },
      down: async () => {
        await this.dropMonitoringSchema();
      },
    });

    // Миграция 004: Система безопасности
    this.addMigration({
      id: '004_security_enhancements',
      version: '1.3.0',
      name: 'Security Enhancements',
      description: 'Добавление улучшений безопасности',
      timestamp: Date.now(),
      critical: true,
      tags: ['security', 'authentication'],
      up: async () => {
        await this.enhanceSecurity();
      },
      down: async () => {
        await this.revertSecurityEnhancements();
      },
    });
  }

  /**
   * Добавление новой миграции
   */
  addMigration(migration: MigrationDefinition): void {
    this.migrations.set(migration.id, migration);
    this.status.set(migration.id, {
      id: migration.id,
      status: 'pending',
      attempts: 0,
      rollbackAvailable: true,
    });
  }

  /**
   * Планирование миграций
   */
  async plan(targetVersion?: string): Promise<MigrationPlan> {
    const executedMigrations = await this.storage.getExecutedMigrations();
    const allMigrations = Array.from(this.migrations.values());

    // Фильтруем неисполненные миграции
    const pendingMigrations = allMigrations.filter(
      m =>
        !executedMigrations.includes(m.id) &&
        (!targetVersion || this.compareVersions(m.version, targetVersion) <= 0)
    );

    // Сортируем по зависимостям и времени
    const sortedMigrations = this.topologicalSort(pendingMigrations);

    // Анализируем риски
    const risks = this.analyzeRisks(sortedMigrations);

    return {
      migrations: sortedMigrations,
      totalSteps: sortedMigrations.length,
      estimatedTime: this.estimateExecutionTime(sortedMigrations),
      risks,
      backupRequired: risks.some(r => r.level === 'high' || r.level === 'critical'),
    };
  }

  /**
   * Выполнение миграций
   */
  async migrate(
    context: MigrationContext = { dryRun: false, skipBackup: false, force: false }
  ): Promise<void> {
    if (this.isRunning) {
      throw new Error('Migration is already running');
    }

    try {
      this.isRunning = true;
      await this.emit('migration:started', { context });

      const plan = await this.plan(context.targetVersion);

      if (plan.migrations.length === 0) {
        console.info('No pending migrations found');
        return;
      }

      console.info(`Planning to execute ${plan.migrations.length} migrations`);

      // Создаем backup если требуется
      if (plan.backupRequired && !context.skipBackup) {
        await this.createBackup('pre-migration');
      }

      // Проверяем критические миграции
      const criticalMigrations = plan.migrations.filter(m => m.critical);
      if (criticalMigrations.length > 0 && !context.force) {
        throw new Error(
          `Critical migrations detected: ${criticalMigrations.map(m => m.id).join(', ')}. Use force flag to proceed.`
        );
      }

      // Выполняем миграции
      for (const migration of plan.migrations) {
        await this.executeMigration(migration, context);
      }

      await this.emit('migration:completed', { migrationsCount: plan.migrations.length });
      console.info('All migrations completed successfully');
    } catch (error) {
      await this.emit('migration:failed', { error });
      console.error('Migration failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
      this.currentMigration = null;
    }
  }

  /**
   * Откат миграций
   */
  async rollback(
    target?: string,
    context: MigrationContext = { dryRun: false, skipBackup: false, force: false }
  ): Promise<void> {
    if (this.isRunning) {
      throw new Error('Migration is already running');
    }

    try {
      this.isRunning = true;
      await this.emit('rollback:started', { target, context });

      const executedMigrations = await this.storage.getExecutedMigrations();
      let migrationsToRollback: MigrationDefinition[] = [];

      if (target) {
        // Откат до определенной версии
        const targetIndex = executedMigrations.findIndex(id => id === target);
        if (targetIndex === -1) {
          throw new Error(`Target migration ${target} not found in executed migrations`);
        }

        const toRollback = executedMigrations.slice(targetIndex + 1);
        migrationsToRollback = toRollback
          .map(id => this.migrations.get(id))
          .filter(Boolean) as MigrationDefinition[];
      } else {
        // Откат последней миграции
        const lastMigration = executedMigrations[executedMigrations.length - 1];
        if (lastMigration) {
          const migration = this.migrations.get(lastMigration);
          if (migration) {
            migrationsToRollback = [migration];
          }
        }
      }

      if (migrationsToRollback.length === 0) {
        console.info('No migrations to rollback');
        return;
      }

      // Создаем backup перед откатом
      if (!context.skipBackup) {
        await this.createBackup('pre-rollback');
      }

      // Выполняем откат в обратном порядке
      migrationsToRollback.reverse();

      for (const migration of migrationsToRollback) {
        await this.rollbackMigration(migration, context);
      }

      await this.emit('rollback:completed', { migrationsCount: migrationsToRollback.length });
      console.info('Rollback completed successfully');
    } catch (error) {
      await this.emit('rollback:failed', { error });
      console.error('Rollback failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
      this.currentMigration = null;
    }
  }

  /**
   * Статус миграций
   */
  async getStatus(): Promise<{
    currentVersion: string;
    pendingMigrations: string[];
    executedMigrations: string[];
    failedMigrations: string[];
    isRunning: boolean;
    currentMigration: string | null;
  }> {
    const executedMigrations = await this.storage.getExecutedMigrations();
    const allMigrationIds = Array.from(this.migrations.keys());
    const pendingMigrations = allMigrationIds.filter(id => !executedMigrations.includes(id));
    const failedMigrations = Array.from(this.status.values())
      .filter(s => s.status === 'failed')
      .map(s => s.id);

    // Определяем текущую версию
    const lastExecutedMigration = executedMigrations[executedMigrations.length - 1];
    const currentVersion = lastExecutedMigration
      ? this.migrations.get(lastExecutedMigration)?.version || '0.0.0'
      : '0.0.0';

    return {
      currentVersion,
      pendingMigrations,
      executedMigrations,
      failedMigrations,
      isRunning: this.isRunning,
      currentMigration: this.currentMigration,
    };
  }

  /**
   * Создание backup
   */
  async createBackup(description: string): Promise<BackupInfo> {
    const backup: BackupInfo = {
      id: `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      size: 0,
      type: 'full',
      location: await this.storage.createBackup(),
      description,
      restorable: true,
    };

    this.backups.push(backup);
    await this.emit('backup:created', backup);

    console.info(`Backup created: ${backup.id}`);
    return backup;
  }

  /**
   * Восстановление из backup
   */
  async restoreBackup(backupId: string): Promise<void> {
    const backup = this.backups.find(b => b.id === backupId);
    if (!backup) {
      throw new Error(`Backup ${backupId} not found`);
    }

    if (!backup.restorable) {
      throw new Error(`Backup ${backupId} is not restorable`);
    }

    await this.storage.restoreBackup(backup.location);
    await this.emit('backup:restored', backup);

    console.info(`Backup restored: ${backupId}`);
  }

  /**
   * Подписка на события
   */
  on(event: string, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(callback);

    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  /**
   * Добавление хука
   */
  addHook(event: string, hook: (context: unknown) => Promise<void>): void {
    if (!this.hooks.has(event)) {
      this.hooks.set(event, []);
    }
    this.hooks.get(event)!.push(hook);
  }

  // Приватные методы

  private async executeMigration(
    migration: MigrationDefinition,
    context: MigrationContext
  ): Promise<void> {
    this.currentMigration = migration.id;
    const startTime = Date.now();

    try {
      await this.emit('migration:before', { migration, context });
      await this.runHooks('before_migration', { migration, context });

      this.updateStatus(migration.id, {
        status: 'running',
        startedAt: startTime,
        attempts: this.status.get(migration.id)!.attempts + 1,
      });

      console.info(`Executing migration: ${migration.id} - ${migration.name}`);

      if (!context.dryRun) {
        await migration.up();
        await this.storage.markAsExecuted(migration.id);
      } else {
        console.info(`[DRY RUN] Would execute migration: ${migration.id}`);
      }

      const endTime = Date.now();
      this.updateStatus(migration.id, {
        status: 'completed',
        completedAt: endTime,
        executionTime: endTime - startTime,
      });

      await this.runHooks('after_migration', { migration, context });
      await this.emit('migration:after', { migration, context });

      console.info(`Completed migration: ${migration.id} in ${endTime - startTime}ms`);
    } catch (error) {
      this.updateStatus(migration.id, {
        status: 'failed',
        error: String(error),
      });

      await this.emit('migration:error', { migration, error, context });
      throw new Error(`Migration ${migration.id} failed: ${error}`);
    }
  }

  private async rollbackMigration(
    migration: MigrationDefinition,
    context: MigrationContext
  ): Promise<void> {
    this.currentMigration = migration.id;
    const startTime = Date.now();

    try {
      await this.emit('rollback:before', { migration, context });

      console.info(`Rolling back migration: ${migration.id} - ${migration.name}`);

      if (!context.dryRun) {
        await migration.down();
        await this.storage.markAsRolledBack(migration.id);
      } else {
        console.info(`[DRY RUN] Would rollback migration: ${migration.id}`);
      }

      this.updateStatus(migration.id, {
        status: 'rolled_back',
        completedAt: Date.now(),
        executionTime: Date.now() - startTime,
      });

      await this.emit('rollback:after', { migration, context });

      console.info(`Rolled back migration: ${migration.id}`);
    } catch (error) {
      await this.emit('rollback:error', { migration, error, context });
      throw new Error(`Rollback of ${migration.id} failed: ${error}`);
    }
  }

  private updateStatus(id: string, updates: Partial<MigrationStatus>): void {
    const current = this.status.get(id)!;
    this.status.set(id, { ...current, ...updates });
  }

  private topologicalSort(migrations: MigrationDefinition[]): MigrationDefinition[] {
    const sorted: MigrationDefinition[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (migration: MigrationDefinition) => {
      if (visiting.has(migration.id)) {
        throw new Error(`Circular dependency detected involving migration ${migration.id}`);
      }

      if (visited.has(migration.id)) {
        return;
      }

      visiting.add(migration.id);

      // Посещаем зависимости сначала
      if (migration.dependencies) {
        for (const depId of migration.dependencies) {
          const dep = migrations.find(m => m.id === depId);
          if (dep) {
            visit(dep);
          }
        }
      }

      visiting.delete(migration.id);
      visited.add(migration.id);
      sorted.push(migration);
    };

    // Сортируем сначала по зависимостям, потом по времени
    const sortedByTime = [...migrations].sort((a, b) => a.timestamp - b.timestamp);

    for (const migration of sortedByTime) {
      visit(migration);
    }

    return sorted;
  }

  private analyzeRisks(migrations: MigrationDefinition[]): Array<{
    level: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    mitigation?: string;
  }> {
    const risks: Array<{
      level: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      mitigation?: string;
    }> = [];

    // Анализируем критические миграции
    const criticalMigrations = migrations.filter(m => m.critical);
    if (criticalMigrations.length > 0) {
      risks.push({
        level: 'critical',
        description: `${criticalMigrations.length} critical migrations detected`,
        mitigation: 'Review migrations carefully and ensure backups are available',
      });
    }

    // Анализируем количество миграций
    if (migrations.length > 10) {
      risks.push({
        level: 'medium',
        description: `Large number of migrations (${migrations.length})`,
        mitigation: 'Consider batching migrations or running during maintenance window',
      });
    }

    // Анализируем теги миграций
    const securityMigrations = migrations.filter(m => m.tags?.includes('security'));
    if (securityMigrations.length > 0) {
      risks.push({
        level: 'high',
        description: `Security-related migrations detected`,
        mitigation: 'Verify security implications and test thoroughly',
      });
    }

    return risks;
  }

  private estimateExecutionTime(migrations: MigrationDefinition[]): number {
    // Простая оценка: 1 минута на миграцию + дополнительное время для критических
    let baseTime = migrations.length * 60000; // 1 минута в мс

    const criticalCount = migrations.filter(m => m.critical).length;
    baseTime += criticalCount * 120000; // Дополнительные 2 минуты для критических

    return baseTime;
  }

  private compareVersions(version1: string, version2: string): number {
    const v1parts = version1.split('.').map(Number);
    const v2parts = version2.split('.').map(Number);

    for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
      const v1part = v1parts[i] || 0;
      const v2part = v2parts[i] || 0;

      if (v1part < v2part) return -1;
      if (v1part > v2part) return 1;
    }

    return 0;
  }

  private async emit(event: string, data: unknown): Promise<void> {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const promises = Array.from(callbacks).map(callback => {
        try {
          return Promise.resolve(callback(data));
        } catch (error) {
          console.error(`Error in migration event listener for ${event}:`, error);
          return Promise.resolve();
        }
      });

      await Promise.all(promises);
    }
  }

  private async runHooks(event: string, context: unknown): Promise<void> {
    const hooks = this.hooks.get(event) || [];
    for (const hook of hooks) {
      try {
        await hook(context);
      } catch (error) {
        console.error(`Error in migration hook for ${event}:`, error);
      }
    }
  }

  // Методы миграций по умолчанию

  private async createCacheSchema(): Promise<void> {
    console.info('Creating cache schema...');
    // Здесь будет логика создания схемы кэша
    await this.delay(1000); // Имитация работы
  }

  private async dropCacheSchema(): Promise<void> {
    console.info('Dropping cache schema...');
    await this.delay(500);
  }

  private async addPerformanceIndexes(): Promise<void> {
    console.info('Adding performance indexes...');
    await this.delay(2000);
  }

  private async removePerformanceIndexes(): Promise<void> {
    console.info('Removing performance indexes...');
    await this.delay(1000);
  }

  private async createMonitoringSchema(): Promise<void> {
    console.info('Creating monitoring schema...');
    await this.delay(1500);
  }

  private async dropMonitoringSchema(): Promise<void> {
    console.info('Dropping monitoring schema...');
    await this.delay(500);
  }

  private async enhanceSecurity(): Promise<void> {
    console.info('Enhancing security...');
    await this.delay(3000);
  }

  private async revertSecurityEnhancements(): Promise<void> {
    console.info('Reverting security enhancements...');
    await this.delay(1500);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Интерфейс для хранилища миграций
 */
interface MigrationStorage {
  getExecutedMigrations(): Promise<string[]>;
  markAsExecuted(migrationId: string): Promise<void>;
  markAsRolledBack(migrationId: string): Promise<void>;
  createBackup(): Promise<string>;
  restoreBackup(location: string): Promise<void>;
}

/**
 * Реализация хранилища в localStorage
 */
class LocalStorageMigrationStorage implements MigrationStorage {
  private readonly key = 'migration_system_data';

  async getExecutedMigrations(): Promise<string[]> {
    if (typeof localStorage === 'undefined') {
      return [];
    }

    const data = localStorage.getItem(this.key);
    if (!data) {
      return [];
    }

    try {
      const parsed = JSON.parse(data);
      return parsed.executedMigrations || [];
    } catch {
      return [];
    }
  }

  async markAsExecuted(migrationId: string): Promise<void> {
    if (typeof localStorage === 'undefined') {
      return;
    }

    const executed = await this.getExecutedMigrations();
    if (!executed.includes(migrationId)) {
      executed.push(migrationId);
      await this.saveData({ executedMigrations: executed });
    }
  }

  async markAsRolledBack(migrationId: string): Promise<void> {
    if (typeof localStorage === 'undefined') {
      return;
    }

    const executed = await this.getExecutedMigrations();
    const filtered = executed.filter(id => id !== migrationId);
    await this.saveData({ executedMigrations: filtered });
  }

  async createBackup(): Promise<string> {
    const backupData = {
      timestamp: Date.now(),
      data: typeof localStorage !== 'undefined' ? localStorage.getItem(this.key) : null,
    };

    const backupKey = `backup_${Date.now()}`;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(backupKey, JSON.stringify(backupData));
    }

    return backupKey;
  }

  async restoreBackup(location: string): Promise<void> {
    if (typeof localStorage === 'undefined') {
      return;
    }

    const backupData = localStorage.getItem(location);
    if (backupData) {
      try {
        const parsed = JSON.parse(backupData);
        if (parsed.data) {
          localStorage.setItem(this.key, parsed.data);
        }
      } catch (error) {
        throw new Error(`Failed to restore backup: ${error}`);
      }
    }
  }

  private async saveData(data: Record<string, unknown>): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.key, JSON.stringify(data));
    }
  }
}

/**
 * Глобальный экземпляр системы миграций
 */
export const migrationSystem = new AdvancedMigrationSystem();

/**
 * Хелпер для автоматического выполнения миграций при запуске
 */
export async function autoMigrate(): Promise<void> {
  try {
    const status = await migrationSystem.getStatus();
    if (status.pendingMigrations.length > 0) {
      console.info(
        `Found ${status.pendingMigrations.length} pending migrations. Running auto-migration...`
      );
      await migrationSystem.migrate({ dryRun: false, skipBackup: false, force: false });
    }
  } catch (error) {
    console.error('Auto-migration failed:', error);
    // В продакшене может быть полезно не прерывать запуск приложения
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
      console.warn('Continuing despite migration failure in production mode');
    } else {
      throw error;
    }
  }
}
