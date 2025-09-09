/**
 * Базовый интерфейс для всех репортеров
 * Репортеры отвечают за формирование отчетов на основе результатов анализа
 * @typeParam T - Тип данных для создания отчета
 */
export interface IReporter<T> {
  /**
   * Генерирует отчет на основе данных
   * @param data - Данные для создания отчета
   * @returns Промис со сгенерированным отчетом
   */
  generateReport(data: T): Promise<Report>;

  /**
   * Возвращает название репортера
   */
  getName(): string;

  /**
   * Возвращает формат отчета (html, markdown, json, pdf и т.д.)
   */
  getFormat(): string;

  /**
   * Возвращает описание типа отчета
   */
  getDescription(): string;

  /**
   * Возвращает шаблон для отчета (если используется)
   */
  getTemplate?(): string;

  /**
   * Проверяет, может ли репортер создать отчет из данных
   * @param data - Данные для проверки
   * @returns Булево значение
   */
  canGenerateReport(data: T): boolean;
}

/**
 * Структура отчета
 */
export interface Report {
  /**
   * Заголовок отчета
   */
  title: string;

  /**
   * Содержимое отчета
   */
  content: string;

  /**
   * Формат содержимого
   */
  format: string;

  /**
   * Метаданные отчета
   */
  metadata: ReportMetadata;

  /**
   * Дополнительные файлы (изображения, стили и т.д.)
   */
  attachments?: ReportAttachment[];
}

/**
 * Метаданные отчета
 */
export interface ReportMetadata {
  /**
   * Дата создания отчета
   */
  createdAt: Date;

  /**
   * Автор отчета (название репортера)
   */
  author: string;

  /**
   * Версия репортера
   */
  version: string;

  /**
   * Размер отчета в байтах
   */
  size: number;

  /**
   * Дополнительные метаданные
   */
  custom?: Record<string, any>;
}

/**
 * Вложение отчета
 */
export interface ReportAttachment {
  /**
   * Имя файла
   */
  filename: string;

  /**
   * MIME тип
   */
  mimeType: string;

  /**
   * Содержимое файла (base64 или путь к файлу)
   */
  content: string;

  /**
   * Размер файла
   */
  size: number;
}

/**
 * Конфигурация для репортера
 */
export interface ReporterConfig {
  /**
   * Шаблон для отчета
   */
  template?: string;

  /**
   * Настройки стилизации
   */
  styling?: Record<string, any>;

  /**
   * Дополнительные настройки
   */
  options?: Record<string, any>;

  /**
   * Путь для сохранения отчета
   */
  outputPath?: string;

  /**
   * Включать ли временную метку в имя файла
   */
  includeTimestamp?: boolean;
}
