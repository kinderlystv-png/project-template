"use strict";
/**
 * Vitest Testing Framework Checker
 * Проверки конфигурации и настройки Vitest
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VitestChecker = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
class VitestChecker {
    context;
    constructor(context) {
        this.context = context;
    }
    async checkAll() {
        const checks = [
            this.checkVitestConfig(),
            this.checkVitestVersion(),
            this.checkTestingLibraries(),
            this.checkCoverageConfig(),
            this.checkTestScripts(),
            this.checkTestFileStructure(),
            this.checkMockingSetup(),
            this.checkE2EIntegration(),
            this.checkCIIntegration(),
        ];
        return Promise.all(checks);
    }
    async checkVitestConfig() {
        const configFiles = [
            'vitest.config.ts',
            'vitest.config.js',
            'vitest.config.mts',
            'vitest.config.mjs',
            'vite.config.ts', // Может содержать конфигурацию Vitest
            'vite.config.js',
        ];
        let passed = false;
        let configFile = '';
        let hasVitestConfig = false;
        for (const file of configFiles) {
            const filePath = (0, path_1.join)(this.context.projectPath, file);
            if ((0, fs_1.existsSync)(filePath)) {
                try {
                    const content = (0, fs_1.readFileSync)(filePath, 'utf-8');
                    if (content.includes('vitest') || content.includes('test:')) {
                        passed = true;
                        configFile = file;
                        hasVitestConfig = true;
                        break;
                    }
                    else if (file.startsWith('vite.config') && !hasVitestConfig) {
                        configFile = file;
                    }
                }
                catch (error) {
                    // Игнорируем ошибки чтения
                }
            }
        }
        let details = '';
        if (passed) {
            try {
                const content = (0, fs_1.readFileSync)((0, path_1.join)(this.context.projectPath, configFile), 'utf-8');
                details = `Vitest конфигурация: ${configFile}`;
                // Проверим основные настройки
                const hasTestEnvironment = content.includes('environment:') ||
                    content.includes('jsdom') ||
                    content.includes('happy-dom');
                const hasGlobals = content.includes('globals: true');
                const hasSetupFiles = content.includes('setupFiles');
                const hasCoverage = content.includes('coverage');
                if (hasTestEnvironment)
                    details += '. Тестовое окружение настроено';
                if (hasGlobals)
                    details += '. Глобальные функции включены';
                if (hasSetupFiles)
                    details += '. Setup файлы настроены';
                if (hasCoverage)
                    details += '. Покрытие кода настроено';
                if (!hasTestEnvironment) {
                    details += '. Предупреждение: тестовое окружение не настроено';
                }
            }
            catch (error) {
                details = `Ошибка чтения ${configFile}: ${error}`;
            }
        }
        else {
            details = 'Vitest конфигурация не найдена';
        }
        return {
            check: {
                id: 'vitest-config',
                name: 'Vitest Configuration',
                description: 'Проверка конфигурации Vitest тестового фреймворка',
                category: 'vitest',
                score: 20,
                critical: true,
                level: 'critical',
                tags: ['vitest', 'config', 'testing'],
            },
            passed,
            score: passed ? 20 : 0,
            maxScore: 20,
            details,
            recommendations: passed
                ? []
                : [
                    'Создайте vitest.config.ts с базовой конфигурацией',
                    'Настройте тестовое окружение (jsdom для DOM тестов)',
                    'Включите globals для удобства написания тестов',
                    'Добавьте setup файлы для общих настроек тестов',
                ],
        };
    }
    async checkVitestVersion() {
        const packagePath = (0, path_1.join)(this.context.projectPath, 'package.json');
        let passed = false;
        let details = '';
        if ((0, fs_1.existsSync)(packagePath)) {
            try {
                const pkg = JSON.parse((0, fs_1.readFileSync)(packagePath, 'utf-8'));
                const vitestVersion = pkg.devDependencies?.vitest || pkg.dependencies?.vitest;
                if (vitestVersion) {
                    passed = true;
                    details = `Vitest версия: ${vitestVersion}`;
                    // Проверим актуальность версии (3.x считается современной)
                    const isModern = vitestVersion.includes('3.') ||
                        vitestVersion.includes('^3.') ||
                        vitestVersion.includes('~3.');
                    if (isModern) {
                        details += '. Современная версия 3.x';
                    }
                    else {
                        details += '. Рекомендуется обновление до 3.x';
                    }
                    // Проверим сопутствующие пакеты
                    const hasJSDOM = pkg.devDependencies?.jsdom;
                    const hasHappyDOM = pkg.devDependencies?.['happy-dom'];
                    const hasTestingLibrary = pkg.devDependencies?.['@testing-library/svelte'];
                    if (hasJSDOM || hasHappyDOM) {
                        details += '. DOM окружение установлено';
                    }
                    if (hasTestingLibrary) {
                        details += '. Testing Library интегрирована';
                    }
                }
                else {
                    details = 'Vitest не найден в зависимостях';
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
                id: 'vitest-version',
                name: 'Vitest Version',
                description: 'Проверка версии Vitest и сопутствующих пакетов',
                category: 'vitest',
                score: 15,
                critical: false,
                level: 'high',
                tags: ['vitest', 'version', 'dependencies'],
            },
            passed,
            score: passed ? 15 : 0,
            maxScore: 15,
            details,
            recommendations: passed
                ? []
                : [
                    'Установите vitest как dev dependency',
                    'Используйте актуальную версию 3.x',
                    'Добавьте jsdom или happy-dom для DOM тестов',
                    'Установите @testing-library/svelte для компонентных тестов',
                ],
        };
    }
    async checkTestingLibraries() {
        const packagePath = (0, path_1.join)(this.context.projectPath, 'package.json');
        let passed = false;
        let details = '';
        const foundLibraries = [];
        if ((0, fs_1.existsSync)(packagePath)) {
            try {
                const pkg = JSON.parse((0, fs_1.readFileSync)(packagePath, 'utf-8'));
                const devDeps = pkg.devDependencies || {};
                // Проверим основные тестовые библиотеки
                const testingLibraries = [
                    '@testing-library/svelte',
                    '@testing-library/jest-dom',
                    '@testing-library/user-event',
                    'vitest-dom',
                    'jsdom',
                    'happy-dom',
                ];
                for (const lib of testingLibraries) {
                    if (devDeps[lib]) {
                        foundLibraries.push(lib);
                    }
                }
                passed = foundLibraries.length >= 2; // Минимум 2 библиотеки
                if (foundLibraries.length > 0) {
                    details = `Тестовые библиотеки (${foundLibraries.length}): ${foundLibraries.join(', ')}`;
                    // Проверим специфичные комбинации
                    const hasSvelteTestingLibrary = foundLibraries.includes('@testing-library/svelte');
                    const hasDOMEnvironment = foundLibraries.includes('jsdom') || foundLibraries.includes('happy-dom');
                    const hasUserEvents = foundLibraries.includes('@testing-library/user-event');
                    if (hasSvelteTestingLibrary)
                        details += '. Svelte компоненты';
                    if (hasDOMEnvironment)
                        details += '. DOM окружение';
                    if (hasUserEvents)
                        details += '. Пользовательские события';
                    if (!hasSvelteTestingLibrary) {
                        details += '. Предупреждение: тестирование Svelte компонентов не настроено';
                    }
                }
                else {
                    details = 'Тестовые библиотеки не найдены';
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
                id: 'testing-libraries',
                name: 'Testing Libraries',
                description: 'Проверка установленных тестовых библиотек',
                category: 'vitest',
                score: 12,
                critical: false,
                level: 'high',
                tags: ['testing-library', 'dependencies', 'dom-testing'],
            },
            passed,
            score: passed ? 12 : 0,
            maxScore: 12,
            details,
            recommendations: passed
                ? []
                : [
                    'Установите @testing-library/svelte для тестирования компонентов',
                    'Добавьте @testing-library/jest-dom для DOM матчеров',
                    'Установите @testing-library/user-event для симуляции событий',
                    'Выберите jsdom или happy-dom как DOM окружение',
                ],
        };
    }
    async checkCoverageConfig() {
        const configFiles = [
            'vitest.config.ts',
            'vitest.config.js',
            'vite.config.ts',
            'vite.config.js',
        ];
        let passed = false;
        let details = '';
        for (const configFile of configFiles) {
            const filePath = (0, path_1.join)(this.context.projectPath, configFile);
            if ((0, fs_1.existsSync)(filePath)) {
                try {
                    const content = (0, fs_1.readFileSync)(filePath, 'utf-8');
                    if (content.includes('coverage')) {
                        passed = true;
                        details = `Покрытие кода настроено в ${configFile}`;
                        // Проверим настройки покрытия
                        const hasProvider = content.includes('provider:') || content.includes('c8') || content.includes('v8');
                        const hasThresholds = content.includes('thresholds') || content.includes('threshold');
                        const hasReporter = content.includes('reporter');
                        const hasExclude = content.includes('exclude:');
                        let configCount = 0;
                        if (hasProvider) {
                            details += '. Провайдер настроен';
                            configCount++;
                        }
                        if (hasThresholds) {
                            details += '. Пороги заданы';
                            configCount++;
                        }
                        if (hasReporter) {
                            details += '. Репортеры настроены';
                            configCount++;
                        }
                        if (hasExclude) {
                            details += '. Исключения настроены';
                            configCount++;
                        }
                        details += ` (${configCount}/4 настроек)`;
                        if (configCount >= 3) {
                            details += '. Отличная конфигурация';
                        }
                        else if (configCount >= 2) {
                            details += '. Хорошая конфигурация';
                        }
                        else {
                            details += '. Базовая конфигурация';
                        }
                        break;
                    }
                }
                catch (error) {
                    // Игнорируем ошибки чтения
                }
            }
        }
        if (!passed) {
            details = 'Покрытие кода не настроено';
        }
        return {
            check: {
                id: 'coverage-config',
                name: 'Coverage Configuration',
                description: 'Проверка настройки сбора покрытия кода',
                category: 'vitest',
                score: 15,
                critical: false,
                level: 'high',
                tags: ['coverage', 'code-quality', 'metrics'],
            },
            passed,
            score: passed ? 15 : 0,
            maxScore: 15,
            details,
            recommendations: passed
                ? []
                : [
                    'Настройте сбор покрытия кода в vitest.config.ts',
                    'Установите пороги покрытия (80%+ рекомендуется)',
                    'Добавьте различные репортеры (html, lcov, text)',
                    'Исключите ненужные файлы из анализа покрытия',
                ],
        };
    }
    async checkTestScripts() {
        const packagePath = (0, path_1.join)(this.context.projectPath, 'package.json');
        let passed = false;
        let details = '';
        if ((0, fs_1.existsSync)(packagePath)) {
            try {
                const pkg = JSON.parse((0, fs_1.readFileSync)(packagePath, 'utf-8'));
                const scripts = pkg.scripts || {};
                // Проверим тестовые скрипты
                const testScripts = [
                    'test',
                    'test:unit',
                    'test:watch',
                    'test:coverage',
                    'test:ui',
                    'test:run',
                ];
                const foundScripts = [];
                for (const script of testScripts) {
                    if (scripts[script]) {
                        foundScripts.push(script);
                    }
                }
                passed = foundScripts.length >= 2; // Минимум 2 скрипта
                if (foundScripts.length > 0) {
                    details = `Тестовые скрипты (${foundScripts.length}): ${foundScripts.join(', ')}`;
                    // Проверим содержимое основного test скрипта
                    if (scripts.test) {
                        const testScript = scripts.test;
                        if (testScript.includes('vitest')) {
                            details += '. Vitest команды настроены';
                        }
                        if (testScript.includes('run')) {
                            details += '. Одноразовый запуск';
                        }
                    }
                    // Проверим дополнительные скрипты
                    if (scripts['test:watch'])
                        details += '. Watch режим';
                    if (scripts['test:coverage'])
                        details += '. Покрытие кода';
                    if (scripts['test:ui'])
                        details += '. UI интерфейс';
                }
                else {
                    details = 'Тестовые скрипты не найдены';
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
                id: 'test-scripts',
                name: 'Test Scripts',
                description: 'Проверка npm скриптов для тестирования',
                category: 'vitest',
                score: 10,
                critical: false,
                level: 'medium',
                tags: ['npm-scripts', 'testing', 'automation'],
            },
            passed,
            score: passed ? 10 : 0,
            maxScore: 10,
            details,
            recommendations: passed
                ? []
                : [
                    'Добавьте базовый скрипт "test" для запуска тестов',
                    'Создайте "test:watch" для режима наблюдения',
                    'Добавьте "test:coverage" для анализа покрытия',
                    'Рассмотрите "test:ui" для графического интерфейса',
                ],
        };
    }
    async checkTestFileStructure() {
        const testDirs = ['src/tests', 'src/test', 'tests', 'test', '__tests__'];
        let passed = false;
        let details = '';
        const foundDirs = [];
        // Проверим наличие тестовых директорий
        for (const dir of testDirs) {
            const dirPath = (0, path_1.join)(this.context.projectPath, dir);
            if ((0, fs_1.existsSync)(dirPath)) {
                foundDirs.push(dir);
                passed = true;
            }
        }
        if (passed) {
            details = `Тестовые директории: ${foundDirs.join(', ')}`;
            // Подсчитаем тестовые файлы
            let testFileCount = 0;
            try {
                const { execSync } = require('child_process');
                // Используем find для поиска тестовых файлов (только на Unix-системах)
                try {
                    const result = execSync(`find ${this.context.projectPath} -name "*.test.*" -o -name "*.spec.*" | wc -l`, { encoding: 'utf-8', timeout: 5000 });
                    testFileCount = parseInt(result.trim()) || 0;
                }
                catch {
                    // Fallback - простой подсчет через fs
                    // Это упрощенная версия, в реальности нужна рекурсивная функция
                }
            }
            catch {
                // Игнорируем ошибки подсчета
            }
            if (testFileCount > 0) {
                details += `. Файлов тестов: ~${testFileCount}`;
            }
        }
        else {
            details = 'Тестовые директории не найдены';
        }
        return {
            check: {
                id: 'test-file-structure',
                name: 'Test File Structure',
                description: 'Проверка структуры и организации тестовых файлов',
                category: 'vitest',
                score: 8,
                critical: false,
                level: 'medium',
                tags: ['file-structure', 'organization', 'tests'],
            },
            passed,
            score: passed ? 8 : 0,
            maxScore: 8,
            details,
            recommendations: passed
                ? []
                : [
                    'Создайте директорию src/tests для тестов',
                    'Используйте соглашение .test.ts или .spec.ts для именования',
                    'Организуйте тесты по модулям или компонентам',
                    'Создайте отдельные папки для unit, integration, e2e тестов',
                ],
        };
    }
    async checkMockingSetup() {
        const configFiles = ['vitest.config.ts', 'vitest.config.js', 'vite.config.ts'];
        let passed = false;
        let details = '';
        // Проверим конфигурацию моков
        for (const configFile of configFiles) {
            const filePath = (0, path_1.join)(this.context.projectPath, configFile);
            if ((0, fs_1.existsSync)(filePath)) {
                try {
                    const content = (0, fs_1.readFileSync)(filePath, 'utf-8');
                    if (content.includes('mock') || content.includes('vi.mock')) {
                        passed = true;
                        details = `Мокинг настроен в ${configFile}`;
                        break;
                    }
                }
                catch (error) {
                    // Игнорируем ошибки
                }
            }
        }
        // Проверим наличие моков в тестовых файлах
        if (!passed) {
            const testDirs = ['src/tests', 'src/test', 'tests', 'test'];
            for (const dir of testDirs) {
                const dirPath = (0, path_1.join)(this.context.projectPath, dir);
                if ((0, fs_1.existsSync)(dirPath)) {
                    // Здесь можно добавить проверку файлов на наличие vi.mock()
                    // Для простоты считаем что если есть тестовые директории, то мокинг может быть настроен
                    details = 'Тестовые файлы найдены, мокинг возможен';
                    break;
                }
            }
        }
        if (!passed && !details) {
            details = 'Мокинг не настроен';
        }
        return {
            check: {
                id: 'mocking-setup',
                name: 'Mocking Setup',
                description: 'Проверка настройки мокинга для изоляции тестов',
                category: 'vitest',
                score: 6,
                critical: false,
                level: 'low',
                tags: ['mocking', 'isolation', 'testing'],
            },
            passed,
            score: passed ? 6 : 0,
            maxScore: 6,
            details,
            recommendations: passed
                ? []
                : [
                    'Настройте автоматический мокинг модулей в vitest.config.ts',
                    'Используйте vi.mock() для изоляции внешних зависимостей',
                    'Создайте __mocks__ директорию для ручных моков',
                    'Добавьте моки для API вызовов и внешних сервисов',
                ],
        };
    }
    async checkE2EIntegration() {
        const packagePath = (0, path_1.join)(this.context.projectPath, 'package.json');
        let passed = false;
        let details = '';
        if ((0, fs_1.existsSync)(packagePath)) {
            try {
                const pkg = JSON.parse((0, fs_1.readFileSync)(packagePath, 'utf-8'));
                const devDeps = pkg.devDependencies || {};
                // Проверим E2E фреймворки
                const e2eLibraries = [
                    '@playwright/test',
                    'playwright',
                    'cypress',
                    'puppeteer',
                    'webdriverio',
                ];
                const foundE2E = [];
                for (const lib of e2eLibraries) {
                    if (devDeps[lib]) {
                        foundE2E.push(lib);
                        passed = true;
                    }
                }
                if (passed) {
                    details = `E2E тестирование: ${foundE2E.join(', ')}`;
                    // Проверим скрипты E2E тестов
                    const scripts = pkg.scripts || {};
                    const hasE2EScript = scripts['test:e2e'] || scripts['e2e'] || scripts['playwright'];
                    if (hasE2EScript) {
                        details += '. Скрипты E2E настроены';
                    }
                    else {
                        details += '. Предупреждение: скрипты E2E не найдены';
                    }
                }
                else {
                    details = 'E2E тестирование не настроено';
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
                id: 'e2e-integration',
                name: 'E2E Integration',
                description: 'Проверка интеграции с E2E тестированием',
                category: 'vitest',
                score: 8,
                critical: false,
                level: 'medium',
                tags: ['e2e', 'integration', 'playwright'],
            },
            passed,
            score: passed ? 8 : 0,
            maxScore: 8,
            details,
            recommendations: passed
                ? []
                : [
                    'Установите @playwright/test для E2E тестирования',
                    'Создайте скрипт "test:e2e" для запуска E2E тестов',
                    'Настройте интеграцию между Vitest и Playwright',
                    'Добавьте E2E тесты для критических пользовательских сценариев',
                ],
        };
    }
    async checkCIIntegration() {
        const actionsPath = (0, path_1.join)(this.context.projectPath, '.github', 'workflows');
        let passed = false;
        let details = '';
        if ((0, fs_1.existsSync)(actionsPath)) {
            try {
                const workflows = require('fs').readdirSync(actionsPath);
                for (const workflow of workflows) {
                    if (workflow.endsWith('.yml') || workflow.endsWith('.yaml')) {
                        const content = (0, fs_1.readFileSync)((0, path_1.join)(actionsPath, workflow), 'utf-8');
                        if (content.includes('vitest') ||
                            (content.includes('test') && content.includes('npm run test'))) {
                            passed = true;
                            details = `Vitest интегрирован в CI: ${workflow}`;
                            // Проверим дополнительные настройки
                            if (content.includes('coverage')) {
                                details += '. Покрытие в CI';
                            }
                            if (content.includes('matrix')) {
                                details += '. Матричное тестирование';
                            }
                            break;
                        }
                    }
                }
                if (!passed) {
                    details = 'Vitest не интегрирован в CI/CD';
                }
            }
            catch (error) {
                details = `Ошибка чтения workflow файлов: ${error}`;
            }
        }
        else {
            details = 'GitHub Actions не настроен';
        }
        return {
            check: {
                id: 'ci-integration',
                name: 'CI Integration',
                description: 'Проверка интеграции Vitest с CI/CD pipeline',
                category: 'vitest',
                score: 10,
                critical: false,
                level: 'medium',
                tags: ['ci-cd', 'automation', 'integration'],
            },
            passed,
            score: passed ? 10 : 0,
            maxScore: 10,
            details,
            recommendations: passed
                ? []
                : [
                    'Добавьте запуск vitest в GitHub Actions workflow',
                    'Настройте сбор покрытия кода в CI',
                    'Добавьте матричное тестирование для разных версий Node.js',
                    'Настройте кеширование зависимостей для ускорения CI',
                ],
        };
    }
}
exports.VitestChecker = VitestChecker;
//# sourceMappingURL=vitest.js.map