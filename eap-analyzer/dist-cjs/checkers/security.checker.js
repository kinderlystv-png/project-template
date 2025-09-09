"use strict";
/**
 * Чекер безопасности - проверяет общие проблемы безопасности
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
exports.SecurityChecker = void 0;
const checker_js_1 = require("../core/checker.js");
const path = __importStar(require("path"));
class SecurityChecker extends checker_js_1.BaseChecker {
    name = 'Security Check';
    category = 'security';
    description = 'Проверка общих проблем безопасности в проекте';
    get priority() {
        return 1; // Высший приоритет для безопасности
    }
    async check(context) {
        let score = 100;
        const issues = [];
        const recommendations = [];
        try {
            // Проверка .env файлов
            await this.checkEnvFiles(context.projectPath, issues, recommendations);
            // Проверка package.json на уязвимые зависимости
            await this.checkPackageJson(context.projectPath, issues, recommendations);
            // Проверка секретов в коде
            await this.checkForSecrets(context.projectPath, issues, recommendations);
            // Проверка HTTPS конфигурации
            await this.checkHttpsConfig(context.projectPath, issues, recommendations);
            // Вычисляем финальный балл
            score = Math.max(0, score - issues.length * 15);
            const passed = score >= 70;
            const message = passed
                ? `Проверки безопасности пройдены (${score}/100)`
                : `Обнаружены проблемы безопасности (${score}/100): ${issues.length} проблем`;
            return this.createResult(passed, score, message, { issues, detailsCount: issues.length }, recommendations);
        }
        catch (error) {
            return this.createErrorResult(error);
        }
    }
    async checkEnvFiles(projectPath, issues, recommendations) {
        const envFiles = ['.env', '.env.local', '.env.production', '.env.development'];
        for (const envFile of envFiles) {
            const envPath = path.join(projectPath, envFile);
            if (this.fileExists(envPath)) {
                const content = this.readFile(envPath);
                if (content) {
                    // Проверка на хранение секретов в .env
                    if (content.includes('password') ||
                        content.includes('secret') ||
                        content.includes('key')) {
                        // Проверяем, есть ли .env в .gitignore
                        const gitignorePath = path.join(projectPath, '.gitignore');
                        const gitignore = this.readFile(gitignorePath);
                        if (!gitignore || !gitignore.includes('.env')) {
                            issues.push(`Файл ${envFile} содержит секреты, но не исключен из Git`);
                            recommendations.push('Добавьте .env файлы в .gitignore');
                        }
                    }
                }
            }
        }
    }
    async checkPackageJson(projectPath, issues, recommendations) {
        const packagePath = path.join(projectPath, 'package.json');
        if (!this.fileExists(packagePath)) {
            return;
        }
        try {
            const content = this.readFile(packagePath);
            if (!content)
                return;
            const packageJson = JSON.parse(content);
            const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
            // Список известных уязвимых пакетов (упрощенная проверка)
            const vulnerablePackages = ['event-stream', 'flatmap-stream', 'eslint-scope'];
            for (const pkg of vulnerablePackages) {
                if (dependencies[pkg]) {
                    issues.push(`Обнаружен потенциально уязвимый пакет: ${pkg}`);
                    recommendations.push(`Удалите или замените пакет ${pkg}`);
                }
            }
            // Проверка устаревших версий Node.js
            if (packageJson.engines?.node) {
                const nodeVersion = packageJson.engines.node;
                if (nodeVersion.includes('8.') || nodeVersion.includes('10.')) {
                    issues.push('Используется устаревшая версия Node.js');
                    recommendations.push('Обновите версию Node.js до LTS');
                }
            }
        }
        catch (error) {
            // Игнорируем ошибки парсинга JSON
        }
    }
    async checkForSecrets(projectPath, issues, recommendations) {
        const fs = require('fs').promises;
        // Паттерны для поиска секретов
        const secretPatterns = [
            /password\s*[=:]\s*['"]\w+['"]/i,
            /api[_-]?key\s*[=:]\s*['"]\w+['"]/i,
            /secret\s*[=:]\s*['"]\w+['"]/i,
            /token\s*[=:]\s*['"]\w+['"]/i,
            /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/,
        ];
        try {
            const files = await this.getSourceFiles(projectPath);
            for (const file of files.slice(0, 50)) {
                // Ограничиваем для производительности
                try {
                    const content = await fs.readFile(file, 'utf-8');
                    for (const pattern of secretPatterns) {
                        if (pattern.test(content)) {
                            const relativePath = path.relative(projectPath, file);
                            issues.push(`Возможный секрет обнаружен в файле: ${relativePath}`);
                            recommendations.push('Вынесите секреты в переменные окружения');
                            break; // Один файл - одно предупреждение
                        }
                    }
                }
                catch {
                    // Пропускаем файлы, которые не удается прочитать
                }
            }
        }
        catch {
            // Игнорируем ошибки чтения директорий
        }
    }
    async checkHttpsConfig(projectPath, issues, recommendations) {
        // Проверка конфигурационных файлов на HTTPS
        const configFiles = ['vite.config.ts', 'vite.config.js', 'webpack.config.js', 'next.config.js'];
        for (const configFile of configFiles) {
            const configPath = path.join(projectPath, configFile);
            if (this.fileExists(configPath)) {
                const content = this.readFile(configPath);
                if (content && content.includes('http://') && !content.includes('https://')) {
                    issues.push(`Конфигурация ${configFile} использует HTTP вместо HTTPS`);
                    recommendations.push('Настройте HTTPS для продакшн сборки');
                }
            }
        }
    }
    async getSourceFiles(projectPath) {
        const fs = require('fs').promises;
        const files = [];
        const searchExtensions = ['.js', '.ts', '.jsx', '.tsx', '.vue', '.json'];
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
                        const ext = path.extname(entry.name);
                        if (searchExtensions.includes(ext)) {
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
exports.SecurityChecker = SecurityChecker;
//# sourceMappingURL=security.checker.js.map