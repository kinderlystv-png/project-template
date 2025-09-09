"use strict";
/**
 * EMT Configuration Checker - проверяет конфигурацию EMT проекта
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMTConfigChecker = void 0;
const checker_js_1 = require("../../../core/checker.js");
class EMTConfigChecker extends checker_js_1.BaseChecker {
    name = 'EMT Configuration Checker';
    category = 'quality';
    description = 'Проверяет корректность конфигурации EMT проекта';
    metadata = {
        version: '1.0.0',
    };
    async check(context) {
        const path = require('path');
        const fs = require('fs');
        const issues = [];
        const warnings = [];
        const recommendations = [];
        try {
            let score = 100;
            // Проверка основного конфига EMT
            const configFiles = ['emt.config.js', 'emt.config.ts', 'emt.config.json'];
            let hasEmtConfig = false;
            for (const configFile of configFiles) {
                const configPath = path.join(context.projectPath, configFile);
                if (fs.existsSync(configPath)) {
                    hasEmtConfig = true;
                    break;
                }
            }
            if (!hasEmtConfig) {
                issues.push('Отсутствует конфигурационный файл EMT');
                score -= 30;
                recommendations.push('Создайте emt.config.js или emt.config.ts файл');
            }
            // Проверка package.json
            const packagePath = path.join(context.projectPath, 'package.json');
            if (!fs.existsSync(packagePath)) {
                issues.push('Отсутствует package.json');
                score -= 50;
            }
            else {
                const packageContent = fs.readFileSync(packagePath, 'utf-8');
                const packageJson = JSON.parse(packageContent);
                // Проверка EMT зависимостей
                const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
                const emtPackages = ['emt-framework', 'emt-core', '@emt/core'];
                const hasEmtDeps = emtPackages.some(pkg => dependencies[pkg]);
                if (!hasEmtDeps) {
                    issues.push('EMT зависимости не найдены в package.json');
                    score -= 40;
                }
                // Проверка scripts
                const scripts = packageJson.scripts || {};
                const expectedScripts = ['dev', 'build', 'start'];
                for (const script of expectedScripts) {
                    if (!scripts[script]) {
                        warnings.push(`Отсутствует npm script: ${script}`);
                        score -= 5;
                    }
                }
                // Проверка версий зависимостей
                for (const [pkg, version] of Object.entries(dependencies)) {
                    const versionStr = version;
                    if (pkg.includes('emt')) {
                        if (versionStr.includes('beta') || versionStr.includes('alpha')) {
                            warnings.push(`Используется нестабильная версия ${pkg}: ${versionStr}`);
                            score -= 5;
                        }
                    }
                }
            }
            // Проверка TypeScript конфигурации
            const tsconfigPath = path.join(context.projectPath, 'tsconfig.json');
            if (!fs.existsSync(tsconfigPath)) {
                warnings.push('Отсутствует tsconfig.json - рекомендуется для TypeScript проектов');
                score -= 10;
                recommendations.push('Добавьте TypeScript конфигурацию для лучшей типизации');
            }
            else {
                try {
                    const tsconfigContent = fs.readFileSync(tsconfigPath, 'utf-8');
                    const tsconfig = JSON.parse(tsconfigContent);
                    if (!tsconfig.compilerOptions?.strict) {
                        warnings.push('Не включен strict режим TypeScript');
                        score -= 5;
                    }
                    if (!tsconfig.compilerOptions?.moduleResolution) {
                        warnings.push('Не настроен moduleResolution в TypeScript');
                        score -= 5;
                    }
                }
                catch {
                    warnings.push('Ошибка парсинга tsconfig.json');
                    score -= 10;
                }
            }
            // Проверка ESLint конфигурации
            const eslintConfigs = ['.eslintrc.js', '.eslintrc.json', 'eslint.config.js'];
            let hasEslint = false;
            for (const eslintConfig of eslintConfigs) {
                if (fs.existsSync(path.join(context.projectPath, eslintConfig))) {
                    hasEslint = true;
                    break;
                }
            }
            if (!hasEslint) {
                warnings.push('Отсутствует ESLint конфигурация');
                score -= 10;
                recommendations.push('Настройте ESLint для улучшения качества кода');
            }
            // Проверка .env файлов
            const envFiles = ['.env', '.env.example', '.env.local'];
            let hasEnvExample = false;
            for (const envFile of envFiles) {
                if (fs.existsSync(path.join(context.projectPath, envFile))) {
                    if (envFile === '.env.example') {
                        hasEnvExample = true;
                    }
                }
            }
            if (fs.existsSync(path.join(context.projectPath, '.env')) && !hasEnvExample) {
                warnings.push('Найден .env файл, но отсутствует .env.example');
                recommendations.push('Создайте .env.example с шаблоном переменных окружения');
            }
            // Проверка .gitignore
            const gitignorePath = path.join(context.projectPath, '.gitignore');
            if (!fs.existsSync(gitignorePath)) {
                warnings.push('Отсутствует .gitignore файл');
                score -= 5;
            }
            else {
                const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
                const requiredIgnores = ['node_modules', '.env', 'dist', 'build'];
                for (const ignore of requiredIgnores) {
                    if (!gitignoreContent.includes(ignore)) {
                        warnings.push(`В .gitignore не найден: ${ignore}`);
                        score -= 2;
                    }
                }
            }
            // Финальная оценка
            score = Math.max(0, score);
            const passed = issues.length === 0 && score >= 70;
            return this.createResult(passed, score, `Configuration check ${passed ? 'passed' : 'failed'} (${score}/100)`, { issues, warnings }, recommendations);
        }
        catch (error) {
            return this.createResult(false, 0, 'Configuration check failed', [
                `Ошибка проверки конфигурации: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
            ]);
        }
    }
    isApplicable(context) {
        const path = require('path');
        const fs = require('fs');
        // Проверяем наличие EMT зависимостей
        const packagePath = path.join(context.projectPath, 'package.json');
        if (!fs.existsSync(packagePath)) {
            return false;
        }
        try {
            const packageContent = fs.readFileSync(packagePath, 'utf-8');
            const packageJson = JSON.parse(packageContent);
            const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
            const emtPackages = ['emt-framework', 'emt-core', '@emt/core'];
            return emtPackages.some(pkg => dependencies[pkg]);
        }
        catch {
            return false;
        }
    }
}
exports.EMTConfigChecker = EMTConfigChecker;
//# sourceMappingURL=config.checker.js.map