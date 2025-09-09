"use strict";
/**
 * Docker модуль - анализирует Docker конфигурации проекта
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerAnalyzer = void 0;
const analyzer_js_1 = require("../../core/analyzer.js");
class DockerAnalyzer extends analyzer_js_1.BaseAnalyzer {
    metadata = {
        name: 'Docker Analyzer',
        version: '3.0.0',
        description: 'Анализирует Docker конфигурации и контейнеризацию проекта',
        supportedFileTypes: ['Dockerfile', 'docker-compose.yml', '.dockerignore'],
    };
    async analyze(projectPath) {
        const startTime = Date.now();
        let filesAnalyzed = 0;
        try {
            const metrics = {
                hasDockerfile: false,
                hasCompose: false,
                hasDockerignore: false,
                hasMultiStage: false,
                hasNonRootUser: false,
                hasHealthCheck: false,
                securityScore: 100,
                optimizationScore: 100,
                files: [],
            };
            const path = require('path');
            const fs = require('fs');
            const warnings = [];
            const errors = [];
            // Проверка Dockerfile
            const dockerfilePath = path.join(projectPath, 'Dockerfile');
            if (fs.existsSync(dockerfilePath)) {
                metrics.hasDockerfile = true;
                filesAnalyzed++;
                const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf-8');
                const dockerfileAnalysis = this.analyzeDockerfile(dockerfileContent);
                metrics.hasMultiStage = dockerfileAnalysis.hasMultiStage;
                metrics.hasNonRootUser = dockerfileAnalysis.hasNonRootUser;
                metrics.hasHealthCheck = dockerfileAnalysis.hasHealthCheck;
                metrics.securityScore = dockerfileAnalysis.securityScore;
                metrics.optimizationScore = dockerfileAnalysis.optimizationScore;
                metrics.files.push({
                    name: 'Dockerfile',
                    path: dockerfilePath,
                    type: 'dockerfile',
                    size: dockerfileContent.length,
                    issues: dockerfileAnalysis.issues,
                });
                errors.push(...dockerfileAnalysis.issues.filter(issue => issue.includes('критический')));
                warnings.push(...dockerfileAnalysis.issues.filter(issue => !issue.includes('критический')));
            }
            // Проверка docker-compose файлов
            const composeFiles = [
                'docker-compose.yml',
                'docker-compose.yaml',
                'docker-compose.dev.yml',
                'docker-compose.prod.yml',
                'docker-compose.test.yml',
            ];
            for (const composeFile of composeFiles) {
                const composePath = path.join(projectPath, composeFile);
                if (fs.existsSync(composePath)) {
                    metrics.hasCompose = true;
                    filesAnalyzed++;
                    const composeContent = fs.readFileSync(composePath, 'utf-8');
                    const composeAnalysis = this.analyzeDockerCompose(composeContent);
                    metrics.files.push({
                        name: composeFile,
                        path: composePath,
                        type: 'compose',
                        size: composeContent.length,
                        issues: composeAnalysis.issues,
                    });
                    warnings.push(...composeAnalysis.issues);
                }
            }
            // Проверка .dockerignore
            const dockerignorePath = path.join(projectPath, '.dockerignore');
            if (fs.existsSync(dockerignorePath)) {
                metrics.hasDockerignore = true;
                filesAnalyzed++;
                const dockerignoreContent = fs.readFileSync(dockerignorePath, 'utf-8');
                const dockerignoreAnalysis = this.analyzeDockerignore(dockerignoreContent);
                metrics.files.push({
                    name: '.dockerignore',
                    path: dockerignorePath,
                    type: 'ignore',
                    size: dockerignoreContent.length,
                    issues: dockerignoreAnalysis.issues,
                });
                warnings.push(...dockerignoreAnalysis.issues);
            }
            // Проверки и рекомендации
            if (!metrics.hasDockerfile) {
                warnings.push('Отсутствует Dockerfile - рассмотрите контейнеризацию проекта');
            }
            if (metrics.hasDockerfile && !metrics.hasDockerignore) {
                warnings.push('Отсутствует .dockerignore - может замедлить сборку образа');
            }
            if (metrics.hasDockerfile && !metrics.hasCompose) {
                warnings.push('Рассмотрите добавление docker-compose.yml для упрощения разработки');
            }
            if (!metrics.hasNonRootUser && metrics.hasDockerfile) {
                warnings.push('Docker контейнер запускается от root пользователя - это угроза безопасности');
            }
            return this.createResult(true, metrics, errors, warnings, filesAnalyzed);
        }
        catch (error) {
            return this.createResult(false, null, [`Ошибка анализа Docker: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`], [], filesAnalyzed);
        }
    }
    isSupported(projectPath) {
        const path = require('path');
        const fs = require('fs');
        // Проверяем наличие любых Docker файлов
        const dockerFiles = [
            'Dockerfile',
            'docker-compose.yml',
            'docker-compose.yaml',
            '.dockerignore',
        ];
        return dockerFiles.some(file => fs.existsSync(path.join(projectPath, file)));
    }
    analyzeDockerfile(content) {
        const lines = content.split('\n').map(line => line.trim());
        const issues = [];
        let securityScore = 100;
        let optimizationScore = 100;
        // Проверка multi-stage build
        const fromLines = lines.filter(line => line.startsWith('FROM'));
        const hasMultiStage = fromLines.length > 1;
        // Проверка USER инструкций
        const userLines = lines.filter(line => line.startsWith('USER'));
        const hasNonRootUser = userLines.some(line => !line.includes('USER root') && !line.includes('USER 0'));
        // Проверка HEALTHCHECK
        const hasHealthCheck = lines.some(line => line.startsWith('HEALTHCHECK'));
        // Безопасность
        if (!hasNonRootUser) {
            issues.push('Отсутствует USER инструкция для non-root пользователя');
            securityScore -= 20;
        }
        if (lines.some(line => line.includes('ADD') && line.includes('http'))) {
            issues.push('Использование ADD с URL может быть небезопасным');
            securityScore -= 15;
        }
        if (lines.some(line => line.includes('--password') || line.includes('PASSWORD='))) {
            issues.push('критический: Обнаружены пароли в Dockerfile');
            securityScore -= 30;
        }
        // Оптимизация
        if (!hasMultiStage && lines.filter(line => line.startsWith('RUN')).length > 5) {
            issues.push('Много RUN инструкций - рассмотрите multi-stage build');
            optimizationScore -= 10;
        }
        if (lines.some(line => line.includes('RUN apt-get update') && !line.includes('apt-get clean'))) {
            issues.push('apt-get update без clean - увеличивает размер образа');
            optimizationScore -= 15;
        }
        if (!lines.some(line => line.startsWith('LABEL'))) {
            issues.push('Отсутствуют LABEL метаданные');
            optimizationScore -= 5;
        }
        return {
            hasMultiStage,
            hasNonRootUser,
            hasHealthCheck,
            securityScore: Math.max(0, securityScore),
            optimizationScore: Math.max(0, optimizationScore),
            issues,
        };
    }
    analyzeDockerCompose(content) {
        const issues = [];
        try {
            // Простая проверка YAML структуры
            if (!content.includes('version:')) {
                issues.push('Отсутствует версия в docker-compose.yml');
            }
            if (!content.includes('services:')) {
                issues.push('Отсутствует секция services в docker-compose.yml');
            }
            if (content.includes('latest')) {
                issues.push('Использование latest тега - зафиксируйте версии образов');
            }
            if (content.includes('privileged: true')) {
                issues.push('Использование privileged режима может быть небезопасным');
            }
            if (!content.includes('restart:')) {
                issues.push('Рассмотрите добавление restart policy');
            }
        }
        catch (error) {
            issues.push('Ошибка парсинга docker-compose.yml');
        }
        return { issues };
    }
    analyzeDockerignore(content) {
        const issues = [];
        const lines = content
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean);
        const recommendedIgnores = ['node_modules', '.git', '.env', '*.log', 'coverage', '.nyc_output'];
        for (const ignore of recommendedIgnores) {
            if (!lines.some(line => line.includes(ignore))) {
                issues.push(`Рекомендуется добавить в .dockerignore: ${ignore}`);
            }
        }
        return { issues };
    }
}
exports.DockerAnalyzer = DockerAnalyzer;
//# sourceMappingURL=analyzer.js.map