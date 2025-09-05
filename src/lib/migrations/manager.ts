import { derived, readable, writable } from 'svelte/store';
import { Logger, LogLevel } from '../logger/index.js';
import type { Migration, MigrationConfig, MigrationResult, MigrationStatus } from './types.js';

const logger = new Logger({ level: LogLevel.INFO });

export class MigrationManager {
  private migrations: Migration[] = [];
  private config: MigrationConfig;
  private executedMigrations = writable<MigrationStatus[]>([]);
  private isRunning = writable<boolean>(false);
  private currentMigration = writable<Migration | null>(null);

  constructor(config: Partial<MigrationConfig> = {}) {
    this.config = {
      storageKey: 'db_migrations',
      autoRun: false,
      ...config,
    };

    this.loadExecutedMigrations();
  }

  /**
   * Регистрация новой миграции
   */
  register(migration: Migration): void {
    // Проверяем на дублирование версий
    const existing = this.migrations.find(m => m.version === migration.version);
    if (existing) {
      throw new Error(`Migration with version ${migration.version} already exists`);
    }

    this.migrations.push(migration);
    this.sortMigrations();

    logger.info('Migration registered', {
      version: migration.version,
      name: migration.name,
      total: this.migrations.length,
    });
  }

  /**
   * Регистрация нескольких миграций
   */
  registerMultiple(migrations: Migration[]): void {
    migrations.forEach(migration => this.register(migration));
  }

  /**
   * Запуск всех неисполненных миграций
   */
  async run(): Promise<MigrationResult[]> {
    if (this.isRunning.subscribe) {
      const isCurrentlyRunning = await new Promise<boolean>(resolve => {
        const unsubscribe = this.isRunning.subscribe(value => {
          unsubscribe();
          resolve(value);
        });
      });

      if (isCurrentlyRunning) {
        throw new Error('Migrations are already running');
      }
    }

    this.isRunning.set(true);
    const results: MigrationResult[] = [];

    try {
      const pendingMigrations = await this.getPendingMigrations();

      logger.info('Starting migrations', {
        total: this.migrations.length,
        pending: pendingMigrations.length,
      });

      for (const migration of pendingMigrations) {
        const result = await this.executeMigration(migration);
        results.push(result);

        if (!result.success) {
          logger.error('Migration failed, stopping execution', {
            version: migration.version,
            errorMessage: result.error?.message || 'Unknown error',
          });
          break;
        }
      }

      this.config.onComplete?.(results);

      logger.info('Migrations completed', {
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      });
    } catch (error) {
      logger.error('Migration execution failed', {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    } finally {
      this.isRunning.set(false);
      this.currentMigration.set(null);
    }

    return results;
  }

  /**
   * Откат миграции до определенной версии
   */
  async rollback(targetVersion: string): Promise<MigrationResult[]> {
    this.isRunning.set(true);
    const results: MigrationResult[] = [];

    try {
      const executedStatuses = await this.getExecutedMigrations();
      const toRollback = executedStatuses
        .filter(
          status => status.executed && this.compareVersions(status.version, targetVersion) > 0
        )
        .sort((a, b) => this.compareVersions(b.version, a.version)); // Обратный порядок

      logger.info('Starting rollback', {
        targetVersion,
        migrationsToRollback: toRollback.length,
      });

      for (const status of toRollback) {
        const migration = this.migrations.find(m => m.version === status.version);
        if (!migration) {
          logger.warn('Migration not found for rollback', { version: status.version });
          continue;
        }

        const result = await this.rollbackMigration(migration);
        results.push(result);

        if (!result.success) {
          logger.error('Rollback failed, stopping', {
            version: migration.version,
            error: result.error?.message,
          });
          break;
        }
      }
    } catch (error) {
      logger.error('Rollback execution failed', { error: error.message });
      throw error;
    } finally {
      this.isRunning.set(false);
      this.currentMigration.set(null);
    }

    return results;
  }

  /**
   * Получение статуса всех миграций
   */
  async getStatus(): Promise<MigrationStatus[]> {
    const executed = await this.getExecutedMigrations();

    return this.migrations.map(migration => {
      const executedStatus = executed.find(e => e.version === migration.version);
      return {
        version: migration.version,
        name: migration.name,
        executed: executedStatus?.executed || false,
        executedAt: executedStatus?.executedAt,
        error: executedStatus?.error,
      };
    });
  }

  /**
   * Проверка наличия неисполненных миграций
   */
  async hasPendingMigrations(): Promise<boolean> {
    const pending = await this.getPendingMigrations();
    return pending.length > 0;
  }

  /**
   * Сброс всех миграций (для тестирования)
   */
  async reset(): Promise<void> {
    localStorage.removeItem(this.config.storageKey);
    this.executedMigrations.set([]);
    logger.info('All migrations reset');
  }

  // Store accessors
  get stores() {
    return {
      executed: readable([], set => {
        return this.executedMigrations.subscribe(set);
      }),
      isRunning: readable(false, set => {
        return this.isRunning.subscribe(set);
      }),
      current: readable(null, set => {
        return this.currentMigration.subscribe(set);
      }),
      pending: derived([this.executedMigrations], ([$executed]) => {
        return this.migrations.filter(
          migration => !$executed.find(e => e.version === migration.version && e.executed)
        );
      }),
    };
  }

  // Приватные методы

  private async executeMigration(migration: Migration): Promise<MigrationResult> {
    const startTime = Date.now();
    this.currentMigration.set(migration);
    this.config.onProgress?.(migration, 'start');

    try {
      logger.info('Executing migration', {
        version: migration.version,
        name: migration.name,
      });

      await migration.up();

      const result: MigrationResult = {
        success: true,
        version: migration.version,
        name: migration.name,
        executionTime: Date.now() - startTime,
      };

      await this.markAsExecuted(migration);
      this.config.onProgress?.(migration, 'success');

      logger.info('Migration completed successfully', {
        version: migration.version,
        executionTime: result.executionTime,
      });

      return result;
    } catch (error) {
      const result: MigrationResult = {
        success: false,
        version: migration.version,
        name: migration.name,
        error: error as Error,
        executionTime: Date.now() - startTime,
      };

      await this.markAsFailed(migration, error as Error);
      this.config.onProgress?.(migration, 'error');

      logger.error('Migration failed', {
        version: migration.version,
        error: error.message,
        executionTime: result.executionTime,
      });

      return result;
    }
  }

  private async rollbackMigration(migration: Migration): Promise<MigrationResult> {
    const startTime = Date.now();
    this.currentMigration.set(migration);

    try {
      logger.info('Rolling back migration', {
        version: migration.version,
        name: migration.name,
      });

      await migration.down();

      const result: MigrationResult = {
        success: true,
        version: migration.version,
        name: migration.name,
        executionTime: Date.now() - startTime,
      };

      await this.markAsRolledBack(migration);

      logger.info('Migration rolled back successfully', {
        version: migration.version,
        executionTime: result.executionTime,
      });

      return result;
    } catch (error) {
      const result: MigrationResult = {
        success: false,
        version: migration.version,
        name: migration.name,
        error: error as Error,
        executionTime: Date.now() - startTime,
      };

      logger.error('Migration rollback failed', {
        version: migration.version,
        error: error.message,
        executionTime: result.executionTime,
      });

      return result;
    }
  }

  private async getPendingMigrations(): Promise<Migration[]> {
    const executed = await this.getExecutedMigrations();
    return this.migrations.filter(migration => {
      const executedStatus = executed.find(e => e.version === migration.version);
      return !executedStatus || !executedStatus.executed;
    });
  }

  private async getExecutedMigrations(): Promise<MigrationStatus[]> {
    return new Promise(resolve => {
      const unsubscribe = this.executedMigrations.subscribe(value => {
        unsubscribe();
        resolve(value);
      });
    });
  }

  private loadExecutedMigrations(): void {
    try {
      const stored = localStorage.getItem(this.config.storageKey);
      const executed = stored ? JSON.parse(stored) : [];

      // Преобразуем даты обратно из строк
      const processedExecuted = executed.map((item: any) => ({
        ...item,
        executedAt: item.executedAt ? new Date(item.executedAt) : undefined,
      }));

      this.executedMigrations.set(processedExecuted);
    } catch (error) {
      logger.error('Failed to load executed migrations', { error: error.message });
      this.executedMigrations.set([]);
    }
  }

  private async saveExecutedMigrations(): Promise<void> {
    const executed = await this.getExecutedMigrations();
    try {
      localStorage.setItem(this.config.storageKey, JSON.stringify(executed));
    } catch (error) {
      logger.error('Failed to save executed migrations', { error: error.message });
    }
  }

  private async markAsExecuted(migration: Migration): Promise<void> {
    const executed = await this.getExecutedMigrations();
    const existing = executed.find(e => e.version === migration.version);

    if (existing) {
      existing.executed = true;
      existing.executedAt = new Date();
      existing.error = undefined;
    } else {
      executed.push({
        version: migration.version,
        name: migration.name,
        executed: true,
        executedAt: new Date(),
      });
    }

    this.executedMigrations.set(executed);
    await this.saveExecutedMigrations();
  }

  private async markAsFailed(migration: Migration, error: Error): Promise<void> {
    const executed = await this.getExecutedMigrations();
    const existing = executed.find(e => e.version === migration.version);

    if (existing) {
      existing.executed = false;
      existing.error = error.message;
    } else {
      executed.push({
        version: migration.version,
        name: migration.name,
        executed: false,
        error: error.message,
      });
    }

    this.executedMigrations.set(executed);
    await this.saveExecutedMigrations();
  }

  private async markAsRolledBack(migration: Migration): Promise<void> {
    const executed = await this.getExecutedMigrations();
    const index = executed.findIndex(e => e.version === migration.version);

    if (index !== -1) {
      executed.splice(index, 1);
      this.executedMigrations.set(executed);
      await this.saveExecutedMigrations();
    }
  }

  private sortMigrations(): void {
    this.migrations.sort((a, b) => {
      // Сначала по timestamp, потом по версии
      if (a.timestamp !== b.timestamp) {
        return a.timestamp - b.timestamp;
      }
      return this.compareVersions(a.version, b.version);
    });
  }

  private compareVersions(version1: string, version2: string): number {
    const parts1 = version1.split('.').map(Number);
    const parts2 = version2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;

      if (part1 !== part2) {
        return part1 - part2;
      }
    }

    return 0;
  }
}

// Глобальный экземпляр менеджера миграций
export const migrationManager = new MigrationManager({
  autoRun: false,
  onProgress: (migration, status) => {
    logger.info('Migration progress', {
      version: migration.version,
      name: migration.name,
      status,
    });
  },
});
