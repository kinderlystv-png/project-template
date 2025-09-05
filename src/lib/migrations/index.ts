// Экспорт основных типов
export type { Migration, MigrationConfig, MigrationResult, MigrationStatus } from './types.js';

// Экспорт менеджера миграций
export { SimpleMigrationManager, migrationManager } from './simple-manager.js';
