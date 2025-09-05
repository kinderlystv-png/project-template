export interface Migration {
  version: string;
  name: string;
  description: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
  timestamp: number;
  dependencies?: string[];
}

export interface MigrationStatus {
  version: string;
  name: string;
  executed: boolean;
  executedAt?: Date;
  error?: string;
}

export interface MigrationResult {
  success: boolean;
  version: string;
  name: string;
  error?: Error;
  executionTime: number;
}

export interface MigrationConfig {
  storageKey: string;
  autoRun: boolean;
  onProgress?: (migration: Migration, status: 'start' | 'success' | 'error') => void;
  onComplete?: (results: MigrationResult[]) => void;
}
