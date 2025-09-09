/**
 * Интерфейс для представления проекта в системе анализа
 */
export interface Project {
  /**
   * Абсолютный путь к корню проекта
   */
  path: string;

  /**
   * Название проекта
   */
  name: string;

  /**
   * Получить список всех файлов в проекте
   * @param pattern - Glob паттерн для фильтрации файлов (опционально)
   * @returns Промис с массивом относительных путей к файлам
   */
  getFileList(pattern?: string): Promise<string[]>;

  /**
   * Получить статистику файла
   * @param filePath - Относительный путь к файлу
   * @returns Промис с метаданными файла
   */
  getFileStats(filePath: string): Promise<FileStats>;

  /**
   * Прочитать содержимое файла
   * @param filePath - Относительный путь к файлу
   * @param encoding - Кодировка файла (по умолчанию utf-8)
   * @returns Промис с содержимым файла
   */
  readFile(filePath: string, encoding?: string): Promise<string>;

  /**
   * Проверить существование файла или директории
   * @param path - Относительный путь
   * @returns Промис с булевым значением
   */
  exists(path: string): Promise<boolean>;

  /**
   * Получить абсолютный путь к файлу
   * @param relativePath - Относительный путь
   * @returns Абсолютный путь
   */
  resolvePath(relativePath: string): string;
}

/**
 * Метаданные файла
 */
export interface FileStats {
  /**
   * Размер файла в байтах
   */
  size: number;

  /**
   * Дата создания файла
   */
  created: Date;

  /**
   * Дата последнего изменения
   */
  modified: Date;

  /**
   * Является ли объект директорией
   */
  isDirectory: boolean;

  /**
   * Является ли объект файлом
   */
  isFile: boolean;
}
