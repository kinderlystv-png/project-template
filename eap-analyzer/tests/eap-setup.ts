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
  var mockFileSystem: Record<string, any>;
}

// Глобальная переменная для хранения мок структуры
(global as any).mockFileSystem = {};

// Глобальные тестовые утилиты
(global as any).createMockProject = (structure: Record<string, any>) => {
  (global as any).mockFileSystem = structure;
  const mockFs = vi.mocked(fs);

  mockFs.existsSync.mockImplementation((pathLike: fs.PathLike) => {
    const pathStr = pathLike.toString().replace(/\\/g, '/');
    const normalizedPath = pathStr.startsWith('/mock/project/')
      ? pathStr.slice('/mock/project/'.length)
      : pathStr;

    // Прямое совпадение файла
    if (structure[normalizedPath]) {
      return true;
    }

    // Проверка существования директории - если есть файлы с таким префиксом
    const dirPath = normalizedPath.endsWith('/') ? normalizedPath : normalizedPath + '/';
    const hasFilesInDir = Object.keys(structure).some(key => key.startsWith(dirPath));

    return hasFilesInDir;
  });

  mockFs.readFileSync.mockImplementation((pathLike: fs.PathOrFileDescriptor, encoding?: any) => {
    const pathStr = pathLike.toString().replace(/\\/g, '/');
    const normalizedPath = pathStr.startsWith('/') ? pathStr.slice(1) : pathStr;
    const key = Object.keys(structure).find(k => k === normalizedPath || pathStr.includes(k));
    return key ? structure[key] : '';
  });

  mockFs.readdirSync.mockReturnValue([] as any);
};
