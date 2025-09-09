"use strict";
/**
 * Чекер качества кода - проверяет общие метрики качества
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
exports.CodeQualityChecker = void 0;
const checker_js_1 = require("../core/checker.js");
const path = __importStar(require("path"));
class CodeQualityChecker extends checker_js_1.BaseChecker {
    name = 'Code Quality Check';
    category = 'quality';
    description = 'Проверка общих метрик качества кода';
    get priority() {
        return 2;
    }
    async check(context) {
        let score = 100;
        const issues = [];
        const recommendations = [];
        try {
            // Проверка конфигурации линтера
            await this.checkLinterConfig(context.projectPath, issues, recommendations);
            // Проверка TypeScript конфигурации
            await this.checkTypeScriptConfig(context.projectPath, issues, recommendations);
            // Проверка тестирования
            await this.checkTestingSetup(context.projectPath, issues, recommendations);
            // Проверка документации
            await this.checkDocumentation(context.projectPath, issues, recommendations);
            // Проверка структуры проекта
            await this.checkProjectStructure(context.projectPath, issues, recommendations);
            // Вычисляем финальный балл
            score = Math.max(0, score - issues.length * 12);
            const passed = score >= 70;
            const message = passed
                ? `Проверки качества кода пройдены (${score}/100)`
                : `Обнаружены проблемы качества (${score}/100): ${issues.length} проблем`;
            return this.createResult(passed, score, message, { issues, detailsCount: issues.length }, recommendations);
        }
        catch (error) {
            return this.createErrorResult(error);
        }
    }
    async checkLinterConfig(projectPath, issues, recommendations) {
        const linterConfigs = ['.eslintrc.js', '.eslintrc.json', 'eslint.config.js', '.eslintrc.yml'];
        let hasLinter = false;
        for (const config of linterConfigs) {
            if (this.fileExists(path.join(projectPath, config))) {
                hasLinter = true;
                break;
            }
        }
        if (!hasLinter) {
            issues.push('ESLint не настроен');
            recommendations.push('Настройте ESLint для контроля качества кода');
        }
        else {
            // Проверяем package.json на наличие eslint зависимости
            const packagePath = path.join(projectPath, 'package.json');
            if (this.fileExists(packagePath)) {
                const content = this.readFile(packagePath);
                if (content) {
                    try {
                        const packageJson = JSON.parse(content);
                        const allDeps = {
                            ...packageJson.dependencies,
                            ...packageJson.devDependencies,
                        };
                        if (!allDeps.eslint) {
                            issues.push('ESLint конфигурация найдена, но пакет не установлен');
                            recommendations.push('Установите пакет eslint');
                        }
                    }
                    catch {
                        // Игнорируем ошибки парсинга
                    }
                }
            }
        }
        // Проверка Prettier
        const prettierConfigs = [
            '.prettierrc',
            '.prettierrc.json',
            '.prettierrc.js',
            'prettier.config.js',
        ];
        let hasPrettier = false;
        for (const config of prettierConfigs) {
            if (this.fileExists(path.join(projectPath, config))) {
                hasPrettier = true;
                break;
            }
        }
        if (!hasPrettier) {
            recommendations.push('Рассмотрите настройку Prettier для форматирования кода');
        }
    }
    async checkTypeScriptConfig(projectPath, issues, recommendations) {
        const tsconfigPath = path.join(projectPath, 'tsconfig.json');
        if (!this.fileExists(tsconfigPath)) {
            // Проверяем, есть ли TypeScript файлы
            const hasTypeScript = await this.hasTypeScriptFiles(projectPath);
            if (hasTypeScript) {
                issues.push('TypeScript файлы найдены, но tsconfig.json отсутствует');
                recommendations.push('Создайте tsconfig.json для TypeScript проекта');
            }
            return;
        }
        const content = this.readFile(tsconfigPath);
        if (!content)
            return;
        try {
            const tsconfig = JSON.parse(content);
            const compilerOptions = tsconfig.compilerOptions || {};
            // Проверка строгого режима
            if (!compilerOptions.strict) {
                issues.push('Строгий режим TypeScript не включен');
                recommendations.push('Включите strict режим в tsconfig.json');
            }
            // Проверка noImplicitAny
            if (compilerOptions.noImplicitAny === false) {
                issues.push('noImplicitAny отключен');
                recommendations.push('Включите noImplicitAny для лучшей типизации');
            }
            // Проверка target
            if (compilerOptions.target && ['es3', 'es5'].includes(compilerOptions.target.toLowerCase())) {
                issues.push('Устаревший target в TypeScript конфигурации');
                recommendations.push('Обновите target до ES2020 или новее');
            }
        }
        catch {
            issues.push('Невалидный tsconfig.json');
            recommendations.push('Проверьте синтаксис tsconfig.json');
        }
    }
    async checkTestingSetup(projectPath, issues, recommendations) {
        const packagePath = path.join(projectPath, 'package.json');
        if (!this.fileExists(packagePath)) {
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
            // Проверка наличия тестового фреймворка
            const testFrameworks = ['jest', 'vitest', 'mocha', 'jasmine', 'cypress', '@playwright/test'];
            const hasTestFramework = testFrameworks.some(framework => allDeps[framework]);
            if (!hasTestFramework) {
                issues.push('Тестовый фреймворк не настроен');
                recommendations.push('Настройте тестирование (Jest, Vitest, Cypress)');
            }
            // Проверка test скриптов
            const scripts = packageJson.scripts || {};
            const hasTestScript = Object.keys(scripts).some(script => script.includes('test') && !script.includes('lint'));
            if (!hasTestScript) {
                issues.push('Test скрипты не настроены в package.json');
                recommendations.push('Добавьте test скрипты в package.json');
            }
            // Проверка наличия тестовых файлов
            const hasTestFiles = await this.hasTestFiles(projectPath);
            if (!hasTestFiles) {
                issues.push('Тестовые файлы не найдены');
                recommendations.push('Создайте тесты для вашего кода');
            }
        }
        catch {
            // Игнорируем ошибки парсинга
        }
    }
    async checkDocumentation(projectPath, issues, recommendations) {
        // Проверка README
        const readmeFiles = ['README.md', 'readme.md', 'README.txt', 'README'];
        let hasReadme = false;
        for (const readme of readmeFiles) {
            if (this.fileExists(path.join(projectPath, readme))) {
                hasReadme = true;
                // Проверяем содержимое README
                const content = this.readFile(path.join(projectPath, readme));
                if (content && content.length < 100) {
                    issues.push('README файл слишком короткий');
                    recommendations.push('Расширьте README с описанием проекта');
                }
                break;
            }
        }
        if (!hasReadme) {
            issues.push('README файл отсутствует');
            recommendations.push('Создайте README.md с описанием проекта');
        }
        // Проверка CHANGELOG
        if (!this.fileExists(path.join(projectPath, 'CHANGELOG.md'))) {
            recommendations.push('Рассмотрите создание CHANGELOG.md для отслеживания изменений');
        }
        // Проверка LICENSE
        if (!this.fileExists(path.join(projectPath, 'LICENSE')) &&
            !this.fileExists(path.join(projectPath, 'LICENSE.md'))) {
            recommendations.push('Добавьте LICENSE файл для указания лицензии');
        }
    }
    async checkProjectStructure(projectPath, issues, recommendations) {
        // Проверка .gitignore
        if (!this.fileExists(path.join(projectPath, '.gitignore'))) {
            issues.push('.gitignore файл отсутствует');
            recommendations.push('Создайте .gitignore для исключения служебных файлов');
        }
        // Проверка структуры src
        const srcPath = path.join(projectPath, 'src');
        if (!this.fileExists(srcPath)) {
            recommendations.push('Рассмотрите создание папки src для исходного кода');
        }
        // Проверка package.json
        const packagePath = path.join(projectPath, 'package.json');
        if (this.fileExists(packagePath)) {
            const content = this.readFile(packagePath);
            if (content) {
                try {
                    const packageJson = JSON.parse(content);
                    // Проверка обязательных полей
                    if (!packageJson.name) {
                        issues.push('Поле name отсутствует в package.json');
                    }
                    if (!packageJson.version) {
                        issues.push('Поле version отсутствует в package.json');
                    }
                    if (!packageJson.description) {
                        recommendations.push('Добавьте описание в package.json');
                    }
                }
                catch {
                    issues.push('Невалидный package.json');
                }
            }
        }
    }
    async hasTypeScriptFiles(projectPath) {
        try {
            const files = await this.getFiles(projectPath, ['.ts', '.tsx']);
            return files.length > 0;
        }
        catch {
            return false;
        }
    }
    async hasTestFiles(projectPath) {
        try {
            const files = await this.getFiles(projectPath, ['.test.', '.spec.']);
            return files.length > 0;
        }
        catch {
            return false;
        }
    }
    async getFiles(projectPath, patterns) {
        const fs = require('fs').promises;
        const files = [];
        async function scanDir(dir) {
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    if (entry.isDirectory() &&
                        !['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
                        await scanDir(fullPath);
                    }
                    else if (entry.isFile()) {
                        const matches = patterns.some(pattern => entry.name.includes(pattern));
                        if (matches) {
                            files.push(fullPath);
                        }
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
exports.CodeQualityChecker = CodeQualityChecker;
//# sourceMappingURL=code-quality.checker.js.map