import type { Migration, MigrationConfig, MigrationResult, MigrationStatus } from './types.js';

export class SimpleMigrationManager {
  private migrations: Migration[] = [];
  private config: MigrationConfig;

  constructor(config: Partial<MigrationConfig> = {}) {
    this.config = {
      storageKey: 'db_migrations',
      autoRun: false,
      ...config,
    };
  }

  /**
   * Регистрация новой миграции
   */
  register(migration: Migration): void {
    const existing = this.migrations.find(m => m.version === migration.version);
    if (existing) {
      throw new Error(`Migration with version ${migration.version} already exists`);
    }

    this.migrations.push(migration);
    this.sortMigrations();
    console.log(`✅ Migration ${migration.version} registered`);
  }

  /**
   * Запуск всех неисполненных миграций
   */
  async run(): Promise<MigrationResult[]> {
    const results: MigrationResult[] = [];
    const pendingMigrations = await this.getPendingMigrations();

    console.log(`🚀 Starting ${pendingMigrations.length} migrations`);

    for (const migration of pendingMigrations) {
      const result = await this.executeMigration(migration);
      results.push(result);

      if (!result.success) {
        console.error(`❌ Migration ${migration.version} failed, stopping`);
        break;
      }
    }

    this.config.onComplete?.(results);
    return results;
  }

  /**
   * Получение статуса всех миграций
   */
  async getStatus(): Promise<MigrationStatus[]> {
    const executed = this.getExecutedMigrations();

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
   * Сброс всех миграций
   */
  async reset(): Promise<void> {
    localStorage.removeItem(this.config.storageKey);
    console.log('🔄 All migrations reset');
  }

  // Приватные методы

  private async executeMigration(migration: Migration): Promise<MigrationResult> {
    const startTime = Date.now();
    this.config.onProgress?.(migration, 'start');

    try {
      console.log(`⏳ Executing migration ${migration.version}: ${migration.name}`);

      await migration.up();

      const result: MigrationResult = {
        success: true,
        version: migration.version,
        name: migration.name,
        executionTime: Date.now() - startTime,
      };

      this.markAsExecuted(migration);
      this.config.onProgress?.(migration, 'success');

      console.log(`✅ Migration ${migration.version} completed in ${result.executionTime}ms`);
      return result;
    } catch (error) {
      const result: MigrationResult = {
        success: false,
        version: migration.version,
        name: migration.name,
        error: error as Error,
        executionTime: Date.now() - startTime,
      };

      this.markAsFailed(migration, error as Error);
      this.config.onProgress?.(migration, 'error');

      console.error(`❌ Migration ${migration.version} failed:`, error);
      return result;
    }
  }

  private async getPendingMigrations(): Promise<Migration[]> {
    const executed = this.getExecutedMigrations();
    return this.migrations.filter(migration => {
      const executedStatus = executed.find(e => e.version === migration.version);
      return !executedStatus || !executedStatus.executed;
    });
  }

  private getExecutedMigrations(): MigrationStatus[] {
    try {
      const stored = localStorage.getItem(this.config.storageKey);
      const executed = stored ? JSON.parse(stored) : [];

      return executed.map(
        (item: {
          version: string;
          name: string;
          executed: boolean;
          executedAt?: string;
          error?: string;
        }) => ({
          ...item,
          executedAt: item.executedAt ? new Date(item.executedAt) : undefined,
        })
      );
    } catch (error) {
      console.error('Failed to load executed migrations:', error);
      return [];
    }
  }

  private saveExecutedMigrations(executed: MigrationStatus[]): void {
    try {
      localStorage.setItem(this.config.storageKey, JSON.stringify(executed));
    } catch (error) {
      console.error('Failed to save executed migrations:', error);
    }
  }

  private markAsExecuted(migration: Migration): void {
    const executed = this.getExecutedMigrations();
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

    this.saveExecutedMigrations(executed);
  }

  private markAsFailed(migration: Migration, error: Error): void {
    const executed = this.getExecutedMigrations();
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

    this.saveExecutedMigrations(executed);
  }

  private sortMigrations(): void {
    this.migrations.sort((a, b) => {
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
export const migrationManager = new SimpleMigrationManager({
  autoRun: false,
  onProgress: (migration, status) => {
    console.log(`🔄 Migration ${migration.version} - ${status}`);
  },
});
