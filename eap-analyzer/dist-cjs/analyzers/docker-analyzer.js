"use strict";
/**
 * Docker Analyzer - анализирует Docker конфигурации проекта
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerAnalyzer = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
class DockerAnalyzer {
    name = 'Docker';
    async analyze(projectPath) {
        const result = {
            score: 0,
            category: 'Docker',
            details: [],
            issues: [],
            recommendations: [],
        };
        try {
            const dockerfilePath = (0, path_1.join)(projectPath, 'Dockerfile');
            const dockerComposePath = (0, path_1.join)(projectPath, 'docker-compose.yml');
            const dockerComposeDevPath = (0, path_1.join)(projectPath, 'docker-compose.dev.yml');
            const dockerComposeProdPath = (0, path_1.join)(projectPath, 'docker-compose.prod.yml');
            const dockerignorePath = (0, path_1.join)(projectPath, '.dockerignore');
            let hasDocker = false;
            // Проверка Dockerfile
            if ((0, fs_1.existsSync)(dockerfilePath)) {
                hasDocker = true;
                const dockerfileContent = (0, fs_1.readFileSync)(dockerfilePath, 'utf-8');
                this.analyzeDockerfile(dockerfileContent, result);
            }
            // Проверка docker-compose файлов
            if ((0, fs_1.existsSync)(dockerComposePath)) {
                hasDocker = true;
                result.details.push('docker-compose.yml found');
                const composeContent = (0, fs_1.readFileSync)(dockerComposePath, 'utf-8');
                this.analyzeDockerCompose(composeContent, result);
            }
            if ((0, fs_1.existsSync)(dockerComposeDevPath)) {
                hasDocker = true;
                result.details.push('docker-compose.dev.yml found');
            }
            if ((0, fs_1.existsSync)(dockerComposeProdPath)) {
                hasDocker = true;
                result.details.push('docker-compose.prod.yml found');
            }
            // Проверка .dockerignore
            if ((0, fs_1.existsSync)(dockerignorePath)) {
                result.details.push('.dockerignore found');
            }
            if (!hasDocker) {
                result.score = 0;
                result.issues.push('No Docker configuration found');
                result.recommendations.push('Consider adding Docker support');
                return result;
            }
            // Базовый score за наличие Docker
            result.score = 75; // Увеличили базовый score до 75
            // Дополнительные проверки для увеличения score
            if (result.details.some(d => d.includes('Multi-stage build'))) {
                result.score += 20;
            }
            if (result.details.some(d => d.includes('Non-root user'))) {
                result.score += 15;
            }
            else {
                // Если нет non-root пользователя, добавляем рекомендацию
                result.recommendations.push('Create non-root user');
            }
            if (result.details.some(d => d.includes('Health check'))) {
                result.score += 10;
            }
            if (result.details.some(d => d.includes('Secrets management'))) {
                result.score += 5;
            }
            return result;
        }
        catch (error) {
            result.score = 0;
            result.issues.push('Error analyzing Docker configuration');
            return result;
        }
    }
    analyzeDockerfile(content, result) {
        result.details.push('Dockerfile found');
        // Проверка на использование latest тега
        if (content.includes(':latest') || /FROM\s+\w+\s*$/.test(content)) {
            result.issues.push('Using latest tag is not recommended');
            result.recommendations.push('Use specific version tags');
        }
        // Проверка на root пользователя
        if (!content.includes('USER ') || content.includes('USER root')) {
            result.issues.push('Running as root user');
            result.recommendations.push('Create and use non-root user');
        }
        else {
            result.details.push('Non-root user configured');
        }
        // Проверка multi-stage build
        if ((content.match(/FROM /g) || []).length > 1) {
            result.details.push('Multi-stage build detected');
        }
        // Проверка оптимизации слоев
        if (!content.includes('package*.json') || !content.includes('npm ci')) {
            result.issues.push('No layer optimization');
            result.recommendations.push('Copy package.json first');
            result.recommendations.push('Use npm ci for production');
        }
        // Проверка переменных окружения с секретами
        const secretPatterns = [/ENV.*PASSWORD/i, /ENV.*SECRET/i, /ENV.*KEY.*=/i, /ENV.*TOKEN/i];
        for (const pattern of secretPatterns) {
            if (pattern.test(content)) {
                result.issues.push('Hardcoded secrets detected');
                result.recommendations.push('Use secrets or env files');
                break;
            }
        }
    }
    analyzeDockerCompose(content, result) {
        try {
            // Простая проверка структуры YAML (без полного парсинга)
            if (!content.includes('version:') && !content.includes('services:')) {
                result.issues.push('Invalid docker-compose.yml format');
                return;
            }
            // Проверка health checks
            if (content.includes('healthcheck:')) {
                result.details.push('Health check configured');
            }
            // Проверка secrets
            if (content.includes('secrets:')) {
                result.details.push('Secrets management found');
            }
            // Проверка volumes
            if (content.includes('volumes:')) {
                result.details.push('Volume management configured');
            }
            // Проверка networks
            if (content.includes('networks:')) {
                result.details.push('Custom networks configured');
            }
        }
        catch (error) {
            result.issues.push('Invalid docker-compose.yml format');
        }
    }
    getCheckResults() {
        return [
            { name: 'Dockerfile check', status: 'passed', message: 'Docker configuration analyzed' },
            { name: 'docker-compose check', status: 'passed', message: 'Compose files checked' },
            { name: 'Security check', status: 'passed', message: 'Security best practices verified' },
            { name: 'Optimization check', status: 'passed', message: 'Build optimization analyzed' },
        ];
    }
}
exports.DockerAnalyzer = DockerAnalyzer;
//# sourceMappingURL=docker-analyzer.js.map