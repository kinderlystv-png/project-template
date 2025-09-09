/**
 * Setup файл для Vitest тестов
 */

import { vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';

// Глобальные моки
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  return {
    ...actual,
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    readdirSync: vi.fn(),
    statSync: vi.fn(),
  };
});

// Настройка тестового окружения
beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Типы для глобальных утилит
declare global {
  function createMockProject(structure: Record<string, any>): void;
}

// Глобальные тестовые утилиты
(global as any).createMockProject = (structure: Record<string, any>) => {
  const mockFs = vi.mocked(fs);

  mockFs.existsSync.mockImplementation((pathLike: fs.PathLike) => {
    const pathStr = pathLike.toString();
    return Object.keys(structure).some(key => pathStr.includes(key));
  });

  mockFs.readFileSync.mockImplementation((pathLike: fs.PathOrFileDescriptor) => {
    const pathStr = pathLike.toString();
    const key = Object.keys(structure).find(k => pathStr.includes(k));
    return key ? structure[key] : '';
  });

  mockFs.readdirSync.mockReturnValue([] as any);
};
