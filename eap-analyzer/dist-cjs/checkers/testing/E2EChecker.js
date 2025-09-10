"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.E2EChecker = void 0;
const BaseChecker_1 = require("../../core/base/BaseChecker");
const AnalysisCategory_1 = require("../../types/AnalysisCategory");
const SeverityLevel_1 = require("../../types/SeverityLevel");
/**
 * Проверщик настроек E2E (End-to-End) тестирования
 * Анализирует конфигурацию и наличие интеграционных тестов
 */
class E2EChecker extends BaseChecker_1.BaseChecker {
    constructor() {
        super('E2EChecker', AnalysisCategory_1.AnalysisCategory.TESTING, 'Проверка настроек E2E тестирования', 'E2E Testing Standards', SeverityLevel_1.SeverityLevel.MEDIUM, '2.0.0', {
            enabled: true,
            failOnError: false,
            thresholds: {
                'min_e2e_tests': 3,
                'config_score': 40
            }
        });
    }
    /**
     * @inheritdoc
     */
    async check(project) {
        const results = [];
        const startTime = Date.now();
        try {
            const e2eFrameworks = await this.analyzeE2EFrameworks(project);
            if (e2eFrameworks.length === 0) {
                results.push(this.createNoE2EFrameworkResult());
            }
            else {
                // Создаем результат для каждого найденного E2E фреймворка
                for (const framework of e2eFrameworks) {
                    results.push(this.createE2EFrameworkResult(framework));
                }
            }
            // Проверяем общую структуру E2E тестов
            results.push(await this.checkE2EStructure(project));
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            results.push(this.createResult('e2e-check-error', 'E2E Check Error', 'Ошибка при проверке E2E тестирования', false, `Ошибка: ${errorMessage}`, 0, 10, SeverityLevel_1.SeverityLevel.MEDIUM, { error: errorMessage }));
        }
        const duration = Date.now() - startTime;
        results.forEach(result => {
            if (result.stats) {
                result.stats.duration = duration / results.length;
            }
        });
        return results;
    }
    /**
     * @inheritdoc
     */
    getAvailableChecks() {
        return [
            {
                id: 'playwright-e2e',
                name: 'Playwright E2E Check',
                description: 'Проверка настройки Playwright для E2E тестов',
                severity: SeverityLevel_1.SeverityLevel.MEDIUM,
                maxScore: 30,
                tags: [AnalysisCategory_1.AnalysisCategory.TESTING, 'e2e', 'playwright']
            },
            {
                id: 'cypress-e2e',
                name: 'Cypress E2E Check',
                description: 'Проверка настройки Cypress для E2E тестов',
                severity: SeverityLevel_1.SeverityLevel.MEDIUM,
                maxScore: 30,
                tags: [AnalysisCategory_1.AnalysisCategory.TESTING, 'e2e', 'cypress']
            },
            {
                id: 'e2e-structure',
                name: 'E2E Test Structure Check',
                description: 'Проверка структуры и организации E2E тестов',
                severity: SeverityLevel_1.SeverityLevel.LOW,
                maxScore: 20,
                tags: [AnalysisCategory_1.AnalysisCategory.TESTING, 'e2e', 'structure']
            }
        ];
    }
    /**
     * @inheritdoc
     */
    async isApplicable(project) {
        try {
            // Проверяем наличие package.json
            if (!(await project.exists('package.json'))) {
                return false;
            }
            const packageContent = await project.readFile('package.json');
            const packageJson = JSON.parse(packageContent);
            const allDeps = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies
            };
            // Проверяем наличие E2E фреймворков
            const hasE2EFramework = this.hasAnyE2EFramework(allDeps);
            if (hasE2EFramework)
                return true;
            // Проверяем наличие конфигурационных файлов E2E
            const hasE2EConfig = await project.exists('playwright.config.ts') ||
                await project.exists('playwright.config.js') ||
                await project.exists('cypress.config.ts') ||
                await project.exists('cypress.config.js') ||
                await project.exists('cypress.json') ||
                await project.exists('wdio.conf.js') ||
                await project.exists('wdio.conf.ts');
            return hasE2EConfig;
        }
        catch (error) {
            this.log(`Ошибка при проверке применимости: ${error}`, 'error');
            return false;
        }
    }
    /**
     * Анализирует E2E фреймворки в проекте
     */
    async analyzeE2EFrameworks(project) {
        const frameworks = [];
        const packageContent = await project.readFile('package.json');
        const packageJson = JSON.parse(packageContent);
        const allDeps = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies
        };
        const files = await project.getFileList();
        // Проверяем Playwright
        if (allDeps.playwright || allDeps['@playwright/test']) {
            const playwrightInfo = await this.analyzePlaywright(project, files, allDeps);
            frameworks.push(playwrightInfo);
        }
        // Проверяем Cypress
        if (allDeps.cypress) {
            const cypressInfo = await this.analyzeCypress(project, files, allDeps);
            frameworks.push(cypressInfo);
        }
        // Проверяем WebdriverIO
        if (allDeps.webdriverio || allDeps['@wdio/cli']) {
            const wdioInfo = await this.analyzeWebdriverIO(project, files, allDeps);
            frameworks.push(wdioInfo);
        }
        // Проверяем Puppeteer
        if (allDeps.puppeteer) {
            const puppeteerInfo = await this.analyzePuppeteer(project, files, allDeps);
            frameworks.push(puppeteerInfo);
        }
        return frameworks;
    }
    /**
     * Анализирует настройку Playwright
     */
    async analyzePlaywright(project, files, deps) {
        const configFiles = ['playwright.config.ts', 'playwright.config.js'];
        let configFile = null;
        let configured = false;
        for (const file of configFiles) {
            if (await project.exists(file)) {
                configFile = file;
                configured = true;
                break;
            }
        }
        // Ищем Playwright тестовые файлы
        const testFiles = files.filter(file => (file.includes('e2e') || file.includes('tests')) &&
            (file.endsWith('.spec.ts') || file.endsWith('.test.ts') || file.endsWith('.spec.js')));
        return {
            name: 'Playwright',
            installed: true,
            configured,
            testFiles,
            configFile,
            version: deps.playwright || deps['@playwright/test']
        };
    }
    /**
     * Анализирует настройку Cypress
     */
    async analyzeCypress(project, files, deps) {
        const configFiles = ['cypress.config.ts', 'cypress.config.js', 'cypress.json'];
        let configFile = null;
        let configured = false;
        for (const file of configFiles) {
            if (await project.exists(file)) {
                configFile = file;
                configured = true;
                break;
            }
        }
        // Ищем Cypress тестовые файлы
        const testFiles = files.filter(file => (file.includes('cypress') || file.includes('e2e')) &&
            (file.endsWith('.cy.ts') || file.endsWith('.cy.js') || file.endsWith('.spec.ts')));
        return {
            name: 'Cypress',
            installed: true,
            configured,
            testFiles,
            configFile,
            version: deps.cypress
        };
    }
    /**
     * Анализирует настройку WebdriverIO
     */
    async analyzeWebdriverIO(project, files, deps) {
        const configFiles = ['wdio.conf.js', 'wdio.conf.ts'];
        let configFile = null;
        let configured = false;
        for (const file of configFiles) {
            if (await project.exists(file)) {
                configFile = file;
                configured = true;
                break;
            }
        }
        // Ищем WebdriverIO тестовые файлы
        const testFiles = files.filter(file => (file.includes('e2e') || file.includes('test')) &&
            (file.endsWith('.e2e.ts') || file.endsWith('.e2e.js') || file.endsWith('.spec.ts')));
        return {
            name: 'WebdriverIO',
            installed: true,
            configured,
            testFiles,
            configFile,
            version: deps.webdriverio || deps['@wdio/cli']
        };
    }
    /**
     * Анализирует настройку Puppeteer
     */
    async analyzePuppeteer(project, files, deps) {
        // Puppeteer обычно не имеет стандартного конфигурационного файла
        const configured = true; // Считаем настроенным, если установлен
        // Ищем Puppeteer тестовые файлы
        const testFiles = files.filter(file => (file.includes('e2e') || file.includes('test')) &&
            (file.includes('puppeteer') || file.endsWith('.e2e.ts') || file.endsWith('.e2e.js')));
        return {
            name: 'Puppeteer',
            installed: true,
            configured,
            testFiles,
            configFile: null, // Puppeteer не требует обязательной конфигурации
            version: deps.puppeteer
        };
    }
    /**
     * Проверяет структуру E2E тестов
     */
    async checkE2EStructure(project) {
        const files = await project.getFileList();
        const e2eFiles = files.filter(file => file.includes('e2e') ||
            file.includes('integration') ||
            file.endsWith('.cy.ts') ||
            file.endsWith('.cy.js') ||
            file.endsWith('.e2e.ts') ||
            file.endsWith('.e2e.js'));
        const e2eDirs = [...new Set(e2eFiles.map(file => file.split('/').slice(0, -1).join('/')))].filter(dir => dir);
        let score = 20;
        const issues = [];
        const recommendations = [];
        if (e2eFiles.length === 0) {
            score = 0;
            issues.push('E2E тестовые файлы не найдены');
            recommendations.push('Создайте E2E тесты для критических пользовательских сценариев');
        }
        else {
            if (e2eFiles.length < 3) {
                issues.push(`Найдено только ${e2eFiles.length} E2E тестов, рекомендуется больше`);
                score -= 10;
                recommendations.push('Добавьте больше E2E тестов для покрытия основных пользовательских путей');
            }
            if (e2eDirs.length === 0) {
                issues.push('E2E тесты не организованы в отдельные директории');
                score -= 5;
                recommendations.push('Организуйте E2E тесты в логические директории (по функциональности)');
            }
        }
        // Проверяем наличие helpers/utils для E2E
        const hasE2EHelpers = files.some(file => (file.includes('e2e') || file.includes('test')) &&
            (file.includes('helper') || file.includes('util') || file.includes('support')));
        if (!hasE2EHelpers && e2eFiles.length > 0) {
            issues.push('Отсутствуют вспомогательные файлы для E2E тестов');
            score -= 3;
            recommendations.push('Создайте helpers/utils для переиспользования кода в E2E тестах');
        }
        return this.createResult('e2e-structure', 'E2E Test Structure Check', 'Проверка структуры E2E тестов', score >= 15, `E2E структура: ${e2eFiles.length} тестов в ${e2eDirs.length} директориях`, Math.max(0, score), 20, score >= 15 ? SeverityLevel_1.SeverityLevel.LOW : SeverityLevel_1.SeverityLevel.MEDIUM, {
            testCount: e2eFiles.length,
            testDirs: e2eDirs.length,
            hasHelpers: hasE2EHelpers,
            issues: issues.length > 0 ? issues : undefined,
            recommendations: recommendations.length > 0 ? recommendations : undefined
        });
    }
    /**
     * Создает результат для конкретного E2E фреймворка
     */
    createE2EFrameworkResult(framework) {
        const issues = [];
        let score = 100;
        const recommendations = [];
        // Проверяем конфигурацию
        if (!framework.configured) {
            issues.push(`${framework.name} не настроен должным образом`);
            score -= 40;
            recommendations.push(`Создайте конфигурационный файл для ${framework.name}`);
        }
        // Проверяем наличие тестовых файлов
        if (framework.testFiles.length === 0) {
            issues.push(`E2E тесты для ${framework.name} не найдены`);
            score -= 50;
            recommendations.push(`Создайте E2E тесты используя ${framework.name}`);
        }
        else if (framework.testFiles.length < 3) {
            issues.push(`Найдено только ${framework.testFiles.length} E2E тестов для ${framework.name}`);
            score -= 20;
            recommendations.push('Добавьте больше E2E тестов для критических пользовательских сценариев');
        }
        // Специфичные рекомендации для фреймворков
        if (!framework.configured) {
            switch (framework.name) {
                case 'Playwright':
                    recommendations.push('Запустите "npx playwright init" для создания конфигурации');
                    break;
                case 'Cypress':
                    recommendations.push('Запустите "npx cypress open" для инициализации');
                    break;
                case 'WebdriverIO':
                    recommendations.push('Запустите "npx wdio init" для создания конфигурации');
                    break;
            }
        }
        return this.createResult(`${framework.name.toLowerCase()}-e2e`, `${framework.name} E2E Check`, `Проверка настройки ${framework.name} для E2E тестирования`, score >= 70, `${framework.name}: ${framework.testFiles.length} E2E тестов, конфигурация ${framework.configured ? 'найдена' : 'не найдена'}`, Math.max(0, score), 100, score >= 70 ? SeverityLevel_1.SeverityLevel.LOW : SeverityLevel_1.SeverityLevel.MEDIUM, {
            framework: framework.name,
            version: framework.version,
            testCount: framework.testFiles.length,
            configured: framework.configured,
            configFile: framework.configFile,
            issues: issues.length > 0 ? issues : undefined,
            recommendations: recommendations.length > 0 ? recommendations : undefined
        });
    }
    /**
     * Создает результат для случая отсутствия E2E фреймворков
     */
    createNoE2EFrameworkResult() {
        return this.createResult('no-e2e-framework', 'No E2E Framework', 'E2E фреймворк не обнаружен', false, 'В проекте не найдено E2E тестовых фреймворков', 0, 100, SeverityLevel_1.SeverityLevel.MEDIUM, {
            recommendations: [
                'Установите Playwright для современного E2E тестирования с хорошей производительностью',
                'Рассмотрите Cypress для интерактивного тестирования с удобной отладкой',
                'Создайте E2E тесты для критических пользовательских сценариев',
                'Настройте CI/CD для автоматического запуска E2E тестов'
            ]
        });
    }
    /**
     * Проверяет наличие E2E фреймворков в зависимостях
     */
    hasAnyE2EFramework(dependencies) {
        const e2eFrameworks = [
            'playwright',
            '@playwright/test',
            'cypress',
            'webdriverio',
            '@wdio/cli',
            'puppeteer',
            'selenium-webdriver'
        ];
        return e2eFrameworks.some(framework => dependencies[framework]);
    }
}
exports.E2EChecker = E2EChecker;
//# sourceMappingURL=E2EChecker.js.map