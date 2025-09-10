"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseReporter = void 0;
/**
 * Базовый класс для всех репортеров
 * Предоставляет общую функциональность и стандартную реализацию
 * @typeParam T - Тип данных для создания отчета
 */
class BaseReporter {
    name;
    category;
    version;
    description;
    config;
    format;
    /**
     * @param name - Название репортера
     * @param category - Категория анализа
     * @param description - Описание репортера
     * @param format - Формат отчета
     * @param version - Версия репортера
     * @param config - Конфигурация репортера
     */
    constructor(name, category, description, format, version = '1.0.0', config = { outputPath: './reports', includeTimestamp: true }) {
        this.name = name;
        this.category = category;
        this.description = description;
        this.format = format;
        this.version = version;
        this.config = config;
    }
    /**
     * @inheritdoc
     */
    getFormat() {
        return this.format;
    }
    /**
     * @inheritdoc
     */
    getName() {
        return this.name;
    }
    /**
     * @inheritdoc
     */
    getDescription() {
        return this.description;
    }
    /**
     * @inheritdoc
     */
    async saveReport(data, filename) {
        const report = await this.generateReport(data);
        const finalFilename = filename || this.generateFilename();
        const fullPath = this.getFullPath(finalFilename);
        // В базовой реализации возвращаем путь к файлу
        // Конкретные репортеры должны переопределить этот метод для реального сохранения
        this.log(`Отчет сгенерирован: ${fullPath}`, 'info');
        return fullPath;
    }
    /**
     * @inheritdoc
     */
    canGenerateReport(data) {
        // Базовая проверка - данные не должны быть null/undefined
        return data != null;
    } /**
     * Получить категорию анализа
     */
    getCategory() {
        return this.category;
    }
    /**
     * Получить версию
     */
    getVersion() {
        return this.version;
    }
    /**
     * Получить конфигурацию репортера
     */
    getConfig() {
        return this.config;
    }
    /**
     * Сгенерировать имя файла для отчета
     * @param suffix - Дополнительный суффикс
     * @returns Имя файла
     */
    generateFilename(suffix) {
        const timestamp = this.config.includeTimestamp
            ? new Date().toISOString().replace(/[:.]/g, '-')
            : '';
        const parts = [this.name];
        if (suffix)
            parts.push(suffix);
        if (timestamp)
            parts.push(timestamp);
        const extension = this.getFileExtension();
        return `${parts.join('-')}.${extension}`;
    }
    /**
     * Получить расширение файла на основе формата
     * @returns Расширение файла
     */
    getFileExtension() {
        const formatExtensions = {
            json: 'json',
            html: 'html',
            markdown: 'md',
            csv: 'csv',
            xml: 'xml',
            txt: 'txt',
            pdf: 'pdf',
        };
        return formatExtensions[this.format.toLowerCase()] || 'txt';
    }
    /**
     * Получить полный путь к файлу отчета
     * @param filename - Имя файла
     * @returns Полный путь
     */
    getFullPath(filename) {
        const outputPath = this.config.outputPath || './reports';
        return `${outputPath}/${filename}`;
    }
    /**
     * Логирование для репортера
     * @param message - Сообщение для логирования
     * @param level - Уровень логирования
     */
    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${this.name}]`;
        switch (level) {
            case 'warn':
                console.warn(`${prefix} WARN: ${message}`);
                break;
            case 'error':
                console.error(`${prefix} ERROR: ${message}`);
                break;
            default:
                console.log(`${prefix} INFO: ${message}`);
        }
    }
    /**
     * Безопасное создание отчета с обработкой ошибок
     * @param data - Данные для отчета
     * @param filename - Имя файла (опционально)
     * @returns Путь к созданному отчету или null в случае ошибки
     */
    async safeGenerateReport(data, filename) {
        try {
            if (!this.canGenerateReport(data)) {
                this.log('Репортер не может работать с данными данными', 'warn');
                return null;
            }
            const startTime = Date.now();
            this.log('Начало создания отчета', 'info');
            const reportPath = await this.saveReport(data, filename);
            const duration = Date.now() - startTime;
            this.log(`Отчет создан за ${duration}ms: ${reportPath}`, 'info');
            return reportPath;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.log(`Ошибка при создании отчета: ${errorMessage}`, 'error');
            return null;
        }
    }
    /**
     * Форматирование даты в читаемый вид
     * @param date - Дата для форматирования
     * @returns Отформатированная строка
     */
    formatDate(date) {
        return date.toLocaleString('ru-RU', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    }
    /**
     * Экранирование HTML-символов
     * @param text - Текст для экранирования
     * @returns Экранированный текст
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        };
        return text.replace(/[&<>"']/g, char => map[char]);
    }
    /**
     * Экранирование символов для JSON
     * @param text - Текст для экранирования
     * @returns Экранированный текст
     */
    escapeJson(text) {
        return text
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
    }
    /**
     * Создание базовых метаданных отчета
     * @returns Метаданные отчета
     */
    createMetadata() {
        const content = ''; // Заглушка для подсчета размера
        return {
            createdAt: new Date(),
            author: this.name,
            version: this.version,
            size: Buffer.byteLength(content, 'utf8'),
            custom: {
                category: this.category,
                format: this.format,
            },
        };
    }
    /**
     * Создание базового отчета
     * @param title - Заголовок отчета
     * @param content - Содержимое отчета
     * @returns Объект отчета
     */
    createReport(title, content) {
        const metadata = this.createMetadata();
        metadata.size = Buffer.byteLength(content, 'utf8');
        return {
            title,
            content,
            format: this.format,
            metadata,
        };
    }
}
exports.BaseReporter = BaseReporter;
//# sourceMappingURL=BaseReporter.js.map