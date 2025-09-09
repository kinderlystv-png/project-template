"use strict";
/**
 * EMT Dependencies Checker - проверяет зависимости EMT проекта
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMTDependenciesChecker = void 0;
const checker_js_1 = require("../../../core/checker.js");
class EMTDependenciesChecker extends checker_js_1.BaseChecker {
    name = 'EMT Dependencies Checker';
    category = 'security';
    description = 'Проверяет состояние и безопасность зависимостей EMT проекта';
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
            const packagePath = path.join(context.projectPath, 'package.json');
            if (!fs.existsSync(packagePath)) {
                issues.push('Отсутствует package.json');
                return this.createResult(false, 0, 'Dependencies check failed', { issues });
            }
            const packageContent = fs.readFileSync(packagePath, 'utf-8');
            const packageJson = JSON.parse(packageContent);
            const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
            // Проверка основных EMT зависимостей
            const coreEmtPackages = ['emt-framework', 'emt-core', '@emt/core'];
            const hasEmtCore = coreEmtPackages.some(pkg => dependencies[pkg]);
            if (!hasEmtCore) {
                issues.push('Отсутствуют основные EMT зависимости');
                score -= 50;
                recommendations.push('Установите основные EMT пакеты: npm install emt-framework');
            }
            // Проверка версий EMT пакетов
            for (const [pkg, version] of Object.entries(dependencies)) {
                const versionStr = version;
                if (pkg.includes('emt') || pkg.includes('@emt/')) {
                    // Проверка на устаревшие версии
                    if (versionStr.includes('0.') ||
                        versionStr.startsWith('^0.') ||
                        versionStr.startsWith('~0.')) {
                        warnings.push(`Устаревшая версия ${pkg}: ${versionStr}`);
                        score -= 10;
                        recommendations.push(`Обновите ${pkg} до стабильной версии`);
                    }
                    // Проверка на pre-release версии
                    if (versionStr.includes('beta') ||
                        versionStr.includes('alpha') ||
                        versionStr.includes('rc')) {
                        warnings.push(`Нестабильная версия ${pkg}: ${versionStr}`);
                        score -= 5;
                    }
                    // Проверка на небезопасные версии
                    if (versionStr.includes('latest') || versionStr === '*') {
                        issues.push(`Небезопасная версия ${pkg}: ${versionStr}`);
                        score -= 15;
                        recommendations.push(`Зафиксируйте конкретную версию для ${pkg}`);
                    }
                }
            }
            // Проверка lock файлов
            const lockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
            let hasLockFile = false;
            for (const lockFile of lockFiles) {
                if (fs.existsSync(path.join(context.projectPath, lockFile))) {
                    hasLockFile = true;
                    break;
                }
            }
            if (!hasLockFile) {
                warnings.push('Отсутствует lock файл для зависимостей');
                score -= 10;
                recommendations.push('Зафиксируйте версии зависимостей с помощью lock файла');
            }
            // Проверка dev зависимостей
            const recommendedDevDeps = [
                '@types/node',
                'typescript',
                'eslint',
                '@typescript-eslint/eslint-plugin',
                '@typescript-eslint/parser',
            ];
            const devDependencies = packageJson.devDependencies || {};
            for (const dep of recommendedDevDeps) {
                if (!devDependencies[dep] && !dependencies[dep]) {
                    warnings.push(`Рекомендуется установить dev зависимость: ${dep}`);
                    score -= 3;
                }
            }
            // Проверка peer dependencies
            if (packageJson.peerDependencies) {
                const peerDeps = packageJson.peerDependencies;
                for (const [peer, version] of Object.entries(peerDeps)) {
                    if (!dependencies[peer] && !devDependencies[peer]) {
                        warnings.push(`Не установлена peer dependency: ${peer}`);
                        score -= 5;
                    }
                }
            }
            // Проверка на избыточные зависимости
            const unnecessaryPackages = [
                'lodash', // можно заменить на нативные ES6+ методы
                'moment', // можно заменить на date-fns или нативные Date методы
                'left-pad', // известная проблемная зависимость
            ];
            for (const pkg of unnecessaryPackages) {
                if (dependencies[pkg] || devDependencies[pkg]) {
                    warnings.push(`Найдена потенциально избыточная зависимость: ${pkg}`);
                    score -= 5;
                    recommendations.push(`Рассмотрите замену ${pkg} на более современные альтернативы`);
                }
            }
            // Проверка скриптов package.json
            const scripts = packageJson.scripts || {};
            const requiredScripts = ['build', 'dev', 'start'];
            for (const script of requiredScripts) {
                if (!scripts[script]) {
                    warnings.push(`Отсутствует npm script: ${script}`);
                    score -= 5;
                }
            }
            // Проверка security scripts
            const securityScripts = ['audit', 'audit:fix'];
            let hasSecurityScript = false;
            for (const script of securityScripts) {
                if (scripts[script]) {
                    hasSecurityScript = true;
                    break;
                }
            }
            if (!hasSecurityScript) {
                recommendations.push('Добавьте npm scripts для проверки безопасности: "audit": "npm audit"');
            }
            // Финальная оценка
            score = Math.max(0, score);
            const passed = issues.length === 0 && score >= 70;
            return this.createResult(passed, score, `Dependencies check ${passed ? 'passed' : 'failed'} (${score}/100)`, {
                issues,
                warnings,
                totalDependencies: Object.keys(dependencies).length,
                emtPackages: Object.keys(dependencies).filter(pkg => pkg.includes('emt') || pkg.includes('@emt/')),
            }, recommendations);
        }
        catch (error) {
            return this.createResult(false, 0, 'Dependencies check failed', [
                `Ошибка проверки зависимостей: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
            ]);
        }
    }
    isApplicable(context) {
        const path = require('path');
        const fs = require('fs');
        // Применимо к любому проекту с package.json
        const packagePath = path.join(context.projectPath, 'package.json');
        return fs.existsSync(packagePath);
    }
}
exports.EMTDependenciesChecker = EMTDependenciesChecker;
//# sourceMappingURL=dependencies.checker.js.map