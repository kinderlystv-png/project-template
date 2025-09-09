"use strict";
/**
 * Logging System Checker
 * Проверки системы логирования и мониторинга
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingChecker = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
class LoggingChecker {
    context;
    constructor(context) {
        this.context = context;
    }
    async checkAll() {
        const checks = [
            this.checkLoggingLibraries(),
            this.checkLoggingConfiguration(),
            this.checkLogLevels(),
            this.checkConsoleUsage(),
            this.checkErrorHandling(),
            this.checkProductionLogging(),
        ];
        return Promise.all(checks);
    }
    async checkLoggingLibraries() {
        const packagePath = (0, path_1.join)(this.context.projectPath, 'package.json');
        let passed = false;
        let details = '';
        const foundLibraries = [];
        if ((0, fs_1.existsSync)(packagePath)) {
            try {
                const pkg = JSON.parse((0, fs_1.readFileSync)(packagePath, 'utf-8'));
                const allDeps = {
                    ...pkg.dependencies,
                    ...pkg.devDependencies,
                };
                // Проверим популярные библиотеки логирования
                const loggingLibraries = [
                    'winston',
                    'pino',
                    'bunyan',
                    'loglevel',
                    'consola',
                    'npmlog',
                    '@sentry/node',
                    '@sentry/browser',
                    'debug',
                ];
                for (const lib of loggingLibraries) {
                    if (allDeps[lib]) {
                        foundLibraries.push(lib);
                        passed = true;
                    }
                }
                if (foundLibraries.length > 0) {
                    details = `Библиотеки логирования (${foundLibraries.length}): ${foundLibraries.join(', ')}`;
                    // Проверим качество выбранных библиотек
                    const hasStructuredLogging = foundLibraries.some(lib => ['winston', 'pino', 'bunyan'].includes(lib));
                    const hasErrorTracking = foundLibraries.some(lib => lib.includes('sentry'));
                    const hasDebugLib = foundLibraries.includes('debug');
                    if (hasStructuredLogging) {
                        details += '. Структурированное логирование';
                    }
                    if (hasErrorTracking) {
                        details += '. Отслеживание ошибок';
                    }
                    if (hasDebugLib) {
                        details += '. Debug логирование';
                    }
                    // Рекомендации по производительности
                    if (foundLibraries.includes('pino')) {
                        details += '. Быстрое логирование (Pino)';
                    }
                }
                else {
                    details = 'Специализированные библиотеки логирования не найдены';
                }
            }
            catch (error) {
                details = `Ошибка чтения package.json: ${error}`;
            }
        }
        else {
            details = 'package.json не найден';
        }
        return {
            check: {
                id: 'logging-libraries',
                name: 'Logging Libraries',
                description: 'Проверка установленных библиотек логирования',
                category: 'logging',
                score: 20,
                critical: false,
                level: 'high',
                tags: ['logging', 'libraries', 'winston', 'pino'],
            },
            passed,
            score: passed ? 20 : 0,
            maxScore: 20,
            details,
            recommendations: passed
                ? []
                : [
                    'Установите профессиональную библиотеку логирования (winston, pino)',
                    'Добавьте библиотеку для отслеживания ошибок (@sentry)',
                    'Используйте debug для разработки',
                    'Настройте структурированное логирование в JSON формате',
                ],
        };
    }
    async checkLoggingConfiguration() {
        const configFiles = [
            'winston.config.js',
            'winston.config.ts',
            'logger.config.js',
            'logger.config.ts',
            'logging.config.js',
            'logging.config.ts',
        ];
        let passed = false;
        let configFile = '';
        let details = '';
        // Проверим специальные конфигурационные файлы
        for (const file of configFiles) {
            if ((0, fs_1.existsSync)((0, path_1.join)(this.context.projectPath, file))) {
                passed = true;
                configFile = file;
                break;
            }
        }
        if (passed) {
            details = `Конфигурация логирования: ${configFile}`;
        }
        else {
            // Проверим конфигурацию в основных файлах
            const mainFiles = ['src/lib/logger.ts', 'src/lib/logger.js', 'src/utils/logger.ts'];
            for (const file of mainFiles) {
                if ((0, fs_1.existsSync)((0, path_1.join)(this.context.projectPath, file))) {
                    passed = true;
                    details = `Модуль логирования: ${file}`;
                    try {
                        const content = (0, fs_1.readFileSync)((0, path_1.join)(this.context.projectPath, file), 'utf-8');
                        // Проверим настройки логирования
                        if (content.includes('createLogger') || content.includes('winston')) {
                            details += '. Winston настроен';
                        }
                        if (content.includes('level:') || content.includes('levels:')) {
                            details += '. Уровни логирования настроены';
                        }
                        if (content.includes('format:') || content.includes('printf')) {
                            details += '. Форматирование настроено';
                        }
                        if (content.includes('transports:')) {
                            details += '. Транспорты настроены';
                        }
                    }
                    catch (error) {
                        details += '. Ошибка чтения файла';
                    }
                    break;
                }
            }
        }
        if (!passed) {
            details = 'Конфигурация логирования не найдена';
        }
        return {
            check: {
                id: 'logging-configuration',
                name: 'Logging Configuration',
                description: 'Проверка конфигурации системы логирования',
                category: 'logging',
                score: 15,
                critical: false,
                level: 'high',
                tags: ['configuration', 'setup', 'winston'],
            },
            passed,
            score: passed ? 15 : 0,
            maxScore: 15,
            details,
            recommendations: passed
                ? []
                : [
                    'Создайте централизованную конфигурацию логирования',
                    'Настройте различные транспорты (файл, консоль)',
                    'Определите форматы логов для разработки и production',
                    'Настройте ротацию логов для production',
                ],
        };
    }
    async checkLogLevels() {
        let passed = false;
        let details = '';
        // Проверим использование уровней логирования в коде
        try {
            // Простая проверка наличия файлов с логированием
            const loggerFile = (0, path_1.join)(this.context.projectPath, 'src', 'lib', 'logger.ts');
            const loggerFileJs = (0, path_1.join)(this.context.projectPath, 'src', 'lib', 'logger.js');
            if ((0, fs_1.existsSync)(loggerFile) || (0, fs_1.existsSync)(loggerFileJs)) {
                const filePath = (0, fs_1.existsSync)(loggerFile) ? loggerFile : loggerFileJs;
                const content = (0, fs_1.readFileSync)(filePath, 'utf-8');
                // Проверим определение уровней
                const hasLogLevels = content.includes('error') &&
                    content.includes('warn') &&
                    content.includes('info') &&
                    content.includes('debug');
                if (hasLogLevels) {
                    passed = true;
                    details = 'Уровни логирования определены (error, warn, info, debug)';
                    // Проверим дополнительные уровни
                    if (content.includes('trace')) {
                        details += '. Включен trace уровень';
                    }
                    if (content.includes('fatal')) {
                        details += '. Включен fatal уровень';
                    }
                    // Проверим настройку уровней для разных окружений
                    if (content.includes('NODE_ENV') || content.includes('process.env')) {
                        details += '. Уровни зависят от окружения';
                    }
                }
                else {
                    details = 'Базовые уровни логирования найдены частично';
                    passed = true; // Частичный успех
                }
            }
            else {
                details = 'Файл логирования не найден для проверки уровней';
            }
        }
        catch (error) {
            details = `Ошибка проверки уровней логирования: ${error}`;
        }
        return {
            check: {
                id: 'log-levels',
                name: 'Log Levels',
                description: 'Проверка настройки и использования уровней логирования',
                category: 'logging',
                score: 10,
                critical: false,
                level: 'medium',
                tags: ['log-levels', 'error', 'warn', 'info', 'debug'],
            },
            passed,
            score: passed ? 10 : 0,
            maxScore: 10,
            details,
            recommendations: passed
                ? []
                : [
                    'Определите стандартные уровни: error, warn, info, debug',
                    'Используйте trace для детального отслеживания',
                    'Настройте разные уровни для dev/production',
                    'Документируйте когда использовать каждый уровень',
                ],
        };
    }
    async checkConsoleUsage() {
        let passed = false;
        let details = '';
        try {
            // Проверим использование console.* в исходном коде
            const srcPath = (0, path_1.join)(this.context.projectPath, 'src');
            if ((0, fs_1.existsSync)(srcPath)) {
                // Простая проверка - ищем файлы и анализируем console usage
                const packagePath = (0, path_1.join)(this.context.projectPath, 'package.json');
                if ((0, fs_1.existsSync)(packagePath)) {
                    const pkg = JSON.parse((0, fs_1.readFileSync)(packagePath, 'utf-8'));
                    const scripts = pkg.scripts || {};
                    // Проверим наличие линтинг правил против console
                    const hasLintScript = scripts.lint;
                    if (hasLintScript && hasLintScript.includes('eslint')) {
                        // Проверим .eslintrc на правила no-console
                        const eslintFiles = ['.eslintrc.js', '.eslintrc.cjs', '.eslintrc.json'];
                        for (const eslintFile of eslintFiles) {
                            const eslintPath = (0, path_1.join)(this.context.projectPath, eslintFile);
                            if ((0, fs_1.existsSync)(eslintPath)) {
                                try {
                                    const eslintContent = (0, fs_1.readFileSync)(eslintPath, 'utf-8');
                                    if (eslintContent.includes('no-console')) {
                                        passed = true;
                                        details = 'ESLint правило no-console настроено';
                                        if (eslintContent.includes('"no-console": "error"')) {
                                            details += '. Строгий режим (error)';
                                        }
                                        else if (eslintContent.includes('"no-console": "warn"')) {
                                            details += '. Предупреждения (warn)';
                                        }
                                        break;
                                    }
                                }
                                catch (error) {
                                    // Игнорируем ошибки чтения
                                }
                            }
                        }
                    }
                }
                if (!passed) {
                    // Проверим простым способом - есть ли logger файлы
                    const loggerExists = (0, fs_1.existsSync)((0, path_1.join)(srcPath, 'lib', 'logger.ts')) ||
                        (0, fs_1.existsSync)((0, path_1.join)(srcPath, 'lib', 'logger.js')) ||
                        (0, fs_1.existsSync)((0, path_1.join)(srcPath, 'utils', 'logger.ts'));
                    if (loggerExists) {
                        passed = true;
                        details = 'Логгер найден, предположительно console.log заменен';
                    }
                    else {
                        details = 'Контроль использования console.log не настроен';
                    }
                }
            }
            else {
                details = 'Исходный код не найден';
            }
        }
        catch (error) {
            details = `Ошибка проверки console usage: ${error}`;
        }
        return {
            check: {
                id: 'console-usage',
                name: 'Console Usage Control',
                description: 'Проверка контроля использования console.log в коде',
                category: 'logging',
                score: 8,
                critical: false,
                level: 'medium',
                tags: ['console', 'eslint', 'code-quality'],
            },
            passed,
            score: passed ? 8 : 0,
            maxScore: 8,
            details,
            recommendations: passed
                ? []
                : [
                    'Настройте ESLint правило no-console для production',
                    'Замените console.log на профессиональное логирование',
                    'Используйте console только для отладки в development',
                    'Добавьте pre-commit hooks для проверки console statements',
                ],
        };
    }
    async checkErrorHandling() {
        let passed = false;
        let details = '';
        try {
            // Проверим наличие глобального обработчика ошибок
            const appFiles = [
                'src/app.ts',
                'src/app.js',
                'src/main.ts',
                'src/main.js',
                'src/app.html',
                'app.js',
            ];
            let hasErrorHandler = false;
            let foundFile = '';
            for (const file of appFiles) {
                const filePath = (0, path_1.join)(this.context.projectPath, file);
                if ((0, fs_1.existsSync)(filePath)) {
                    try {
                        const content = (0, fs_1.readFileSync)(filePath, 'utf-8');
                        // Проверим наличие обработчиков ошибок
                        if (content.includes('window.onerror') ||
                            content.includes('addEventListener("error"') ||
                            content.includes('addEventListener("unhandledrejection"') ||
                            content.includes('process.on("uncaughtException"') ||
                            content.includes('process.on("unhandledRejection"')) {
                            hasErrorHandler = true;
                            foundFile = file;
                            break;
                        }
                    }
                    catch (error) {
                        // Игнорируем ошибки чтения
                    }
                }
            }
            if (hasErrorHandler) {
                passed = true;
                details = `Глобальный обработчик ошибок найден в ${foundFile}`;
            }
            else {
                // Проверим Sentry или другие сервисы мониторинга
                const packagePath = (0, path_1.join)(this.context.projectPath, 'package.json');
                if ((0, fs_1.existsSync)(packagePath)) {
                    try {
                        const pkg = JSON.parse((0, fs_1.readFileSync)(packagePath, 'utf-8'));
                        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
                        const errorTrackingServices = [
                            '@sentry/browser',
                            '@sentry/node',
                            '@sentry/svelte',
                            'bugsnag',
                            'rollbar',
                        ];
                        const foundServices = [];
                        for (const service of errorTrackingServices) {
                            if (allDeps[service]) {
                                foundServices.push(service);
                                passed = true;
                            }
                        }
                        if (foundServices.length > 0) {
                            details = `Сервисы отслеживания ошибок: ${foundServices.join(', ')}`;
                        }
                        else {
                            details = 'Глобальная обработка ошибок не настроена';
                        }
                    }
                    catch (error) {
                        details = 'Ошибка чтения package.json';
                    }
                }
                else {
                    details = 'Обработка ошибок не найдена';
                }
            }
        }
        catch (error) {
            details = `Ошибка проверки обработки ошибок: ${error}`;
        }
        return {
            check: {
                id: 'error-handling',
                name: 'Error Handling',
                description: 'Проверка глобальной обработки и логирования ошибок',
                category: 'logging',
                score: 12,
                critical: false,
                level: 'high',
                tags: ['error-handling', 'sentry', 'monitoring'],
            },
            passed,
            score: passed ? 12 : 0,
            maxScore: 12,
            details,
            recommendations: passed
                ? []
                : [
                    'Настройте глобальные обработчики ошибок',
                    'Интегрируйте Sentry или аналогичный сервис мониторинга',
                    'Логируйте все неперехваченные ошибки',
                    'Добавьте контекстную информацию к ошибкам',
                ],
        };
    }
    async checkProductionLogging() {
        let passed = false;
        let details = '';
        try {
            // Проверим конфигурацию для production
            const configFiles = [
                'src/lib/logger.ts',
                'src/lib/logger.js',
                'src/utils/logger.ts',
                'winston.config.js',
                'logger.config.js',
            ];
            let hasProductionConfig = false;
            let foundFile = '';
            for (const file of configFiles) {
                const filePath = (0, path_1.join)(this.context.projectPath, file);
                if ((0, fs_1.existsSync)(filePath)) {
                    try {
                        const content = (0, fs_1.readFileSync)(filePath, 'utf-8');
                        // Проверим настройки для production
                        if (content.includes('NODE_ENV') && content.includes('production')) {
                            hasProductionConfig = true;
                            foundFile = file;
                            // Проверим специфичные настройки production
                            const hasFileTransport = content.includes('File') || content.includes('DailyRotateFile');
                            const hasLogRotation = content.includes('rotate') ||
                                content.includes('maxSize') ||
                                content.includes('maxFiles');
                            const hasJsonFormat = content.includes('json') || content.includes('JSON');
                            const hasErrorOnlyInProd = content.includes('error') && content.includes('production');
                            details = `Production логирование настроено в ${foundFile}`;
                            if (hasFileTransport)
                                details += '. Файловое логирование';
                            if (hasLogRotation)
                                details += '. Ротация логов';
                            if (hasJsonFormat)
                                details += '. JSON формат';
                            if (hasErrorOnlyInProd)
                                details += '. Фильтрация по уровням';
                            break;
                        }
                    }
                    catch (error) {
                        // Игнорируем ошибки чтения
                    }
                }
            }
            if (hasProductionConfig) {
                passed = true;
            }
            else {
                // Проверим переменные окружения в package.json или .env
                const packagePath = (0, path_1.join)(this.context.projectPath, 'package.json');
                if ((0, fs_1.existsSync)(packagePath)) {
                    try {
                        const pkg = JSON.parse((0, fs_1.readFileSync)(packagePath, 'utf-8'));
                        const scripts = pkg.scripts || {};
                        // Проверим build или start скрипты на настройки логирования
                        const buildScript = scripts.build || '';
                        const startScript = scripts.start || '';
                        if (buildScript.includes('NODE_ENV=production') ||
                            startScript.includes('NODE_ENV=production')) {
                            passed = true;
                            details = 'Production окружение настроено в scripts';
                        }
                        else {
                            details = 'Production логирование не настроено';
                        }
                    }
                    catch (error) {
                        details = 'Ошибка чтения package.json';
                    }
                }
                else {
                    details = 'Конфигурация production не найдена';
                }
            }
        }
        catch (error) {
            details = `Ошибка проверки production логирования: ${error}`;
        }
        return {
            check: {
                id: 'production-logging',
                name: 'Production Logging',
                description: 'Проверка настройки логирования для production окружения',
                category: 'logging',
                score: 15,
                critical: false,
                level: 'high',
                tags: ['production', 'environment', 'file-logging'],
            },
            passed,
            score: passed ? 15 : 0,
            maxScore: 15,
            details,
            recommendations: passed
                ? []
                : [
                    'Настройте разные конфигурации для dev/production',
                    'Используйте файловое логирование в production',
                    'Настройте ротацию логов для экономии места',
                    'Используйте JSON формат для structured logging',
                ],
        };
    }
}
exports.LoggingChecker = LoggingChecker;
//# sourceMappingURL=logging.js.map