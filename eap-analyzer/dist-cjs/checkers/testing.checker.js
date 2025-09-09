"use strict";
/**
 * Чекер тестирования - проверяет настройку и покрытие тестами
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestingChecker = void 0;
const checker_js_1 = require("../core/checker.js");
const path = __importStar(require("path"));
class TestingChecker extends checker_js_1.BaseChecker {
    name = 'Testing Setup Check';
    category = 'quality';
    description = 'Проверка настройки тестирования и покрытия';
    get priority() {
        return 4;
    }
    async check(context) {
        let score = 100;
        const issues = [];
        const recommendations = [];
        try {
            // Проверка конфигурации тестов
            await this.checkTestConfiguration(context.projectPath, issues, recommendations);
            // Проверка покрытия тестами
            await this.checkTestCoverage(context.projectPath, issues, recommendations);
            // Проверка типов тестов
            await this.checkTestTypes(context.projectPath, issues, recommendations);
            // Проверка CI/CD интеграции
            await this.checkCIIntegration(context.projectPath, issues, recommendations);
            // Вычисляем финальный балл
            score = Math.max(0, score - issues.length * 15);
            const passed = score >= 60; // Более мягкий порог для тестирования
            const message = passed
                ? `Проверки тестирования пройдены (${score}/100)`
                : `Проблемы с настройкой тестирования (${score}/100): ${issues.length} проблем`;
            return this.createResult(passed, score, message, { issues, detailsCount: issues.length }, recommendations);
        }
        catch (error) {
            return this.createErrorResult(error);
        }
    }
    async checkTestConfiguration(projectPath, issues, recommendations) {
        const packagePath = path.join(projectPath, 'package.json');
        if (!this.fileExists(packagePath)) {
            issues.push('package.json не найден');
            return;
        }
        const content = this.readFile(packagePath);
        if (!content)
            return;
        try {
            const packageJson = JSON.parse(content);
            const allDeps = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies,
            };
            // Проверка тестовых фреймворков
            const testFrameworks = {
                jest: 'Jest',
                vitest: 'Vitest',
                mocha: 'Mocha',
                jasmine: 'Jasmine',
                cypress: 'Cypress',
                '@playwright/test': 'Playwright',
            };
            const installedFrameworks = Object.entries(testFrameworks)
                .filter(([pkg]) => allDeps[pkg])
                .map(([, name]) => name);
            if (installedFrameworks.length === 0) {
                issues.push('Тестовый фреймворк не установлен');
                recommendations.push('Установите тестовый фреймворк (Jest, Vitest, Cypress)');
            }
            else {
                console.log(`Найдены фреймворки: ${installedFrameworks.join(', ')}`);
            }
            // Проверка конфигурационных файлов
            const configFiles = [
                'jest.config.js',
                'jest.config.ts',
                'vitest.config.ts',
                'vitest.config.js',
                'cypress.config.js',
                'playwright.config.ts',
            ];
            let hasConfig = false;
            for (const config of configFiles) {
                if (this.fileExists(path.join(projectPath, config))) {
                    hasConfig = true;
                    break;
                }
            }
            if (!hasConfig && installedFrameworks.length > 0) {
                recommendations.push('Создайте конфигурационный файл для тестового фреймворка');
            }
            // Проверка test скриптов
            const scripts = packageJson.scripts || {};
            const testScripts = Object.keys(scripts).filter(script => script.includes('test') && !script.includes('lint'));
            if (testScripts.length === 0) {
                issues.push('Test скрипты не настроены');
                recommendations.push('Добавьте test скрипты в package.json');
            }
        }
        catch {
            issues.push('Ошибка чтения package.json');
        }
    }
    async checkTestCoverage(projectPath, issues, recommendations) {
        // Проверка наличия папки coverage
        const coveragePath = path.join(projectPath, 'coverage');
        if (this.fileExists(coveragePath)) {
            // Попытка найти отчет о покрытии
            const coverageFiles = ['lcov-report/index.html', 'index.html', 'coverage-summary.json'];
            let hasCoverageReport = false;
            for (const file of coverageFiles) {
                if (this.fileExists(path.join(coveragePath, file))) {
                    hasCoverageReport = true;
                    break;
                }
            }
            if (!hasCoverageReport) {
                recommendations.push('Настройте генерацию отчетов о покрытии тестами');
            }
        }
        else {
            recommendations.push('Включите сбор метрик покрытия тестами');
        }
        // Проверка .gitignore для coverage
        const gitignorePath = path.join(projectPath, '.gitignore');
        if (this.fileExists(gitignorePath)) {
            const gitignore = this.readFile(gitignorePath);
            if (gitignore && !gitignore.includes('coverage')) {
                recommendations.push('Добавьте папку coverage в .gitignore');
            }
        }
    }
    async checkTestTypes(projectPath, issues, recommendations) {
        const testPatterns = {
            unit: ['.test.', '.spec.'],
            integration: ['integration', 'e2e', 'end-to-end'],
            component: ['component.test', 'component.spec'],
        };
        const foundTests = {
            unit: 0,
            integration: 0,
            component: 0,
        };
        try {
            const allFiles = await this.getAllFiles(projectPath);
            for (const file of allFiles) {
                const fileName = path.basename(file).toLowerCase();
                // Проверка типов тестов
                if (testPatterns.unit.some(pattern => fileName.includes(pattern))) {
                    foundTests.unit++;
                }
                if (testPatterns.integration.some(pattern => fileName.includes(pattern))) {
                    foundTests.integration++;
                }
                if (testPatterns.component.some(pattern => fileName.includes(pattern))) {
                    foundTests.component++;
                }
            }
            // Анализ результатов
            const totalTests = foundTests.unit + foundTests.integration + foundTests.component;
            if (totalTests === 0) {
                issues.push('Тестовые файлы не найдены');
                recommendations.push('Создайте тесты для вашего кода');
            }
            else {
                if (foundTests.unit === 0) {
                    recommendations.push('Добавьте unit тесты для отдельных функций/компонентов');
                }
                if (foundTests.integration === 0 && totalTests > 10) {
                    recommendations.push('Рассмотрите добавление интеграционных тестов');
                }
                console.log(`Найдено тестов: unit=${foundTests.unit}, integration=${foundTests.integration}, component=${foundTests.component}`);
            }
        }
        catch {
            recommendations.push('Не удалось проанализировать тестовые файлы');
        }
    }
    async checkCIIntegration(projectPath, issues, recommendations) {
        const ciFiles = [
            '.github/workflows',
            '.gitlab-ci.yml',
            'azure-pipelines.yml',
            '.circleci/config.yml',
            'jenkinsfile',
            '.travis.yml',
        ];
        let hasCIConfig = false;
        for (const ciFile of ciFiles) {
            const ciPath = path.join(projectPath, ciFile);
            if (this.fileExists(ciPath)) {
                hasCIConfig = true;
                // Для GitHub Actions проверяем наличие test jobs
                if (ciFile === '.github/workflows') {
                    await this.checkGitHubActions(ciPath, issues, recommendations);
                }
                break;
            }
        }
        if (!hasCIConfig) {
            recommendations.push('Настройте CI/CD для автоматического запуска тестов');
        }
    }
    async checkGitHubActions(workflowsPath, issues, recommendations) {
        try {
            const fs = require('fs').promises;
            const files = await fs.readdir(workflowsPath);
            let hasTestWorkflow = false;
            for (const file of files) {
                if (file.endsWith('.yml') || file.endsWith('.yaml')) {
                    const content = this.readFile(path.join(workflowsPath, file));
                    if (content &&
                        (content.includes('npm test') ||
                            content.includes('yarn test') ||
                            content.includes('pnpm test'))) {
                        hasTestWorkflow = true;
                        break;
                    }
                }
            }
            if (!hasTestWorkflow) {
                recommendations.push('Добавьте запуск тестов в GitHub Actions workflow');
            }
        }
        catch {
            // Игнорируем ошибки чтения workflow файлов
        }
    }
    async getAllFiles(projectPath) {
        const fs = require('fs').promises;
        const files = [];
        async function scanDir(dir) {
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    if (entry.isDirectory() &&
                        !['node_modules', '.git', 'dist', 'build', 'coverage'].includes(entry.name)) {
                        await scanDir(fullPath);
                    }
                    else if (entry.isFile()) {
                        files.push(fullPath);
                    }
                }
            }
            catch {
                // Пропускаем недоступные директории
            }
        }
        await scanDir(projectPath);
        return files;
    }
}
exports.TestingChecker = TestingChecker;
//# sourceMappingURL=testing.checker.js.map