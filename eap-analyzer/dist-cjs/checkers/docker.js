"use strict";
/**
 * Проверки для Docker инфраструктуры
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
exports.DockerChecker = void 0;
const path = __importStar(require("path"));
const index_js_1 = require("../utils/index.js");
class DockerChecker {
    static async checkComponent(context) {
        const component = {
            name: 'Docker Infrastructure',
            description: 'Контейнеризация и развертывание приложения',
            weight: 10,
            checks: this.getChecks(),
            critical: true,
        };
        const startTime = Date.now();
        const checkResults = [];
        for (const check of component.checks) {
            const result = await this.executeCheck(check, context);
            checkResults.push(result);
        }
        const passed = checkResults.filter(r => r.passed);
        const failed = checkResults.filter(r => !r.passed);
        const score = passed.reduce((sum, r) => sum + r.score, 0);
        const maxScore = checkResults.reduce((sum, r) => sum + r.maxScore, 0);
        const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
        return {
            component,
            score,
            maxScore,
            percentage,
            passed,
            failed,
            warnings: [],
            recommendations: this.generateRecommendations(failed),
            duration: Date.now() - startTime,
        };
    }
    static getChecks() {
        return [
            {
                id: 'docker.dockerfile',
                name: 'Dockerfile присутствует',
                description: 'Наличие корректного Dockerfile для контейнеризации',
                category: 'docker',
                score: 15,
                critical: true,
                level: 'critical',
                tags: ['docker', 'containerization'],
            },
            {
                id: 'docker.compose',
                name: 'Docker Compose конфигурация',
                description: 'Наличие docker-compose.yml для развертывания',
                category: 'docker',
                score: 15,
                level: 'high',
                tags: ['docker-compose', 'deployment'],
            },
            {
                id: 'docker.multi.stage',
                name: 'Multi-stage сборка',
                description: 'Использование multi-stage сборки для оптимизации',
                category: 'docker',
                score: 10,
                level: 'high',
                tags: ['docker', 'optimization'],
            },
            {
                id: 'docker.production.ready',
                name: 'Production готовность',
                description: 'Конфигурация для production среды',
                category: 'docker',
                score: 15,
                level: 'high',
                tags: ['production', 'configuration'],
            },
            {
                id: 'docker.security',
                name: 'Безопасность контейнера',
                description: 'Настройки безопасности и non-root пользователь',
                category: 'security',
                score: 10,
                level: 'high',
                tags: ['security', 'best-practices'],
            },
            {
                id: 'docker.health.check',
                name: 'Health Check',
                description: 'Конфигурация проверки здоровья контейнера',
                category: 'docker',
                score: 10,
                level: 'medium',
                tags: ['health-check', 'monitoring'],
            },
            {
                id: 'docker.ignore',
                name: '.dockerignore файл',
                description: 'Наличие .dockerignore для оптимизации сборки',
                category: 'docker',
                score: 5,
                level: 'medium',
                tags: ['optimization', 'best-practices'],
            },
            {
                id: 'docker.environments',
                name: 'Множественные окружения',
                description: 'Конфигурации для dev, test, production',
                category: 'docker',
                score: 10,
                level: 'medium',
                tags: ['environments', 'configuration'],
            },
            {
                id: 'docker.volumes',
                name: 'Управление volumes',
                description: 'Правильная настройка volumes для данных',
                category: 'docker',
                score: 5,
                level: 'medium',
                tags: ['volumes', 'data-management'],
            },
            {
                id: 'docker.scripts',
                name: 'Скрипты управления',
                description: 'Утилиты для управления Docker контейнерами',
                category: 'docker',
                score: 5,
                level: 'optional',
                tags: ['automation', 'scripts'],
            },
        ];
    }
    static async executeCheck(check, context) {
        const startTime = Date.now();
        let passed = false;
        let details = '';
        const recommendations = [];
        try {
            switch (check.id) {
                case 'docker.dockerfile': {
                    const dockerfileResult = await this.checkDockerfile(context);
                    passed = dockerfileResult.passed;
                    details = dockerfileResult.details;
                    break;
                }
                case 'docker.compose': {
                    const composeResult = await this.checkDockerCompose(context);
                    passed = composeResult.passed;
                    details = composeResult.details;
                    break;
                }
                case 'docker.multi.stage': {
                    const multiStageResult = await this.checkMultiStage(context);
                    passed = multiStageResult.passed;
                    details = multiStageResult.details;
                    break;
                }
                case 'docker.production.ready': {
                    const prodResult = await this.checkProductionReady(context);
                    passed = prodResult.passed;
                    details = prodResult.details;
                    break;
                }
                case 'docker.security': {
                    const securityResult = await this.checkSecurity(context);
                    passed = securityResult.passed;
                    details = securityResult.details;
                    break;
                }
                case 'docker.health.check': {
                    const healthResult = await this.checkHealthCheck(context);
                    passed = healthResult.passed;
                    details = healthResult.details;
                    break;
                }
                case 'docker.ignore': {
                    passed = await this.checkDockerIgnore(context);
                    details = passed ? '.dockerignore found' : '.dockerignore missing';
                    break;
                }
                case 'docker.environments': {
                    const envResult = await this.checkEnvironments(context);
                    passed = envResult.passed;
                    details = envResult.details;
                    break;
                }
                case 'docker.volumes': {
                    const volumesResult = await this.checkVolumes(context);
                    passed = volumesResult.passed;
                    details = volumesResult.details;
                    break;
                }
                case 'docker.scripts': {
                    const scriptsResult = await this.checkDockerScripts(context);
                    passed = scriptsResult.passed;
                    details = scriptsResult.details;
                    break;
                }
                default:
                    passed = false;
                    details = 'Unknown check';
            }
            if (!passed) {
                recommendations.push(...this.getCheckRecommendations(check.id));
            }
        }
        catch (error) {
            passed = false;
            details = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
        return {
            check,
            passed,
            score: passed ? check.score : 0,
            maxScore: check.score,
            details,
            recommendations,
            duration: Date.now() - startTime,
        };
    }
    // Проверки компонентов
    static async checkDockerfile(context) {
        const dockerfilePath = path.join(context.projectPath, 'Dockerfile');
        if (!(await index_js_1.FileSystemUtils.fileExists(dockerfilePath))) {
            return { passed: false, details: 'Dockerfile not found' };
        }
        const content = await index_js_1.FileSystemUtils.readTextFile(dockerfilePath);
        if (!content) {
            return { passed: false, details: 'Dockerfile is empty' };
        }
        // Проверяем базовые элементы Dockerfile
        const hasFrom = content.includes('FROM');
        const hasWorkdir = content.includes('WORKDIR');
        const hasCopy = content.includes('COPY') || content.includes('ADD');
        const hasRun = content.includes('RUN');
        const hasExpose = content.includes('EXPOSE');
        const hasCmd = content.includes('CMD') || content.includes('ENTRYPOINT');
        const score = [hasFrom, hasWorkdir, hasCopy, hasRun, hasExpose, hasCmd].filter(Boolean).length;
        const passed = score >= 4; // Минимум 4 из 6 элементов
        return {
            passed,
            details: `Basic Dockerfile elements: ${score}/6 (FROM: ${hasFrom}, WORKDIR: ${hasWorkdir}, COPY: ${hasCopy}, RUN: ${hasRun}, EXPOSE: ${hasExpose}, CMD: ${hasCmd})`,
        };
    }
    static async checkDockerCompose(context) {
        const composeFiles = [
            'docker-compose.yml',
            'docker-compose.yaml',
            'compose.yml',
            'compose.yaml',
        ];
        let foundFiles = 0;
        let foundServices = 0;
        for (const file of composeFiles) {
            const filePath = path.join(context.projectPath, file);
            if (await index_js_1.FileSystemUtils.fileExists(filePath)) {
                foundFiles++;
                const content = await index_js_1.FileSystemUtils.readTextFile(filePath);
                if (content && content.includes('services:')) {
                    foundServices++;
                }
            }
        }
        const passed = foundFiles > 0 && foundServices > 0;
        return {
            passed,
            details: `Found ${foundFiles} compose files with ${foundServices} service definitions`,
        };
    }
    static async checkMultiStage(context) {
        const dockerfilePath = path.join(context.projectPath, 'Dockerfile');
        if (!(await index_js_1.FileSystemUtils.fileExists(dockerfilePath))) {
            return { passed: false, details: 'Dockerfile not found' };
        }
        const content = await index_js_1.FileSystemUtils.readTextFile(dockerfilePath);
        if (!content) {
            return { passed: false, details: 'Dockerfile is empty' };
        }
        // Ищем признаки multi-stage сборки
        const fromMatches = content.match(/FROM\s+\S+/g);
        const hasAlias = content.includes(' AS ') || content.includes(' as ');
        const hasCopyFrom = content.includes('COPY --from=');
        const isMultiStage = fromMatches && fromMatches.length > 1 && (hasAlias || hasCopyFrom);
        return {
            passed: !!isMultiStage,
            details: `Multi-stage indicators: ${fromMatches?.length || 0} FROM statements, aliases: ${hasAlias}, COPY --from: ${hasCopyFrom}`,
        };
    }
    static async checkProductionReady(context) {
        const prodFiles = [
            'docker-compose.prod.yml',
            'docker-compose.production.yml',
            'Dockerfile.prod',
            'Dockerfile.production',
        ];
        let foundProdFiles = 0;
        const details = [];
        for (const file of prodFiles) {
            const filePath = path.join(context.projectPath, file);
            if (await index_js_1.FileSystemUtils.fileExists(filePath)) {
                foundProdFiles++;
                details.push(file);
            }
        }
        // Также проверяем наличие ENV переменных в основном Dockerfile
        const dockerfilePath = path.join(context.projectPath, 'Dockerfile');
        let hasEnvConfig = false;
        if (await index_js_1.FileSystemUtils.fileExists(dockerfilePath)) {
            const content = await index_js_1.FileSystemUtils.readTextFile(dockerfilePath);
            if (content && (content.includes('ENV NODE_ENV') || content.includes('ENV ENVIRONMENT'))) {
                hasEnvConfig = true;
            }
        }
        const passed = foundProdFiles > 0 || hasEnvConfig;
        return {
            passed,
            details: `Production files: ${foundProdFiles} (${details.join(', ')}), ENV config: ${hasEnvConfig}`,
        };
    }
    static async checkSecurity(context) {
        const dockerfilePath = path.join(context.projectPath, 'Dockerfile');
        if (!(await index_js_1.FileSystemUtils.fileExists(dockerfilePath))) {
            return { passed: false, details: 'Dockerfile not found' };
        }
        const content = await index_js_1.FileSystemUtils.readTextFile(dockerfilePath);
        if (!content) {
            return { passed: false, details: 'Dockerfile is empty' };
        }
        // Проверяем security best practices
        const hasUser = content.includes('USER ') && !content.includes('USER root');
        const hasSecurityUpdates = content.includes('apt-get update') || content.includes('apk update');
        const hasNoCache = content.includes('--no-cache') || content.includes('rm -rf /var/lib/apt/lists/*');
        const noRootUser = !content.includes('USER 0') && !content.includes('USER root');
        const securityScore = [hasUser, hasSecurityUpdates, hasNoCache, noRootUser].filter(Boolean).length;
        const passed = securityScore >= 2;
        return {
            passed,
            details: `Security features: ${securityScore}/4 (non-root user: ${hasUser}, updates: ${hasSecurityUpdates}, cache cleanup: ${hasNoCache}, no root: ${noRootUser})`,
        };
    }
    static async checkHealthCheck(context) {
        const dockerfilePath = path.join(context.projectPath, 'Dockerfile');
        if (!(await index_js_1.FileSystemUtils.fileExists(dockerfilePath))) {
            return { passed: false, details: 'Dockerfile not found' };
        }
        const content = await index_js_1.FileSystemUtils.readTextFile(dockerfilePath);
        if (!content) {
            return { passed: false, details: 'Dockerfile is empty' };
        }
        const hasHealthCheck = content.includes('HEALTHCHECK');
        return {
            passed: hasHealthCheck,
            details: hasHealthCheck ? 'HEALTHCHECK configured' : 'No HEALTHCHECK found',
        };
    }
    static async checkDockerIgnore(context) {
        const dockerignorePath = path.join(context.projectPath, '.dockerignore');
        return await index_js_1.FileSystemUtils.fileExists(dockerignorePath);
    }
    static async checkEnvironments(context) {
        const envFiles = [
            'docker-compose.dev.yml',
            'docker-compose.test.yml',
            'docker-compose.prod.yml',
            'docker-compose.staging.yml',
        ];
        let foundEnvFiles = 0;
        const foundFiles = [];
        for (const file of envFiles) {
            const filePath = path.join(context.projectPath, file);
            if (await index_js_1.FileSystemUtils.fileExists(filePath)) {
                foundEnvFiles++;
                foundFiles.push(file);
            }
        }
        const passed = foundEnvFiles >= 2; // Минимум 2 окружения
        return {
            passed,
            details: `Environment files: ${foundEnvFiles} (${foundFiles.join(', ')})`,
        };
    }
    static async checkVolumes(context) {
        const composeFiles = ['docker-compose.yml', 'docker-compose.yaml'];
        let hasVolumes = false;
        let volumeDetails = '';
        for (const file of composeFiles) {
            const filePath = path.join(context.projectPath, file);
            if (await index_js_1.FileSystemUtils.fileExists(filePath)) {
                const content = await index_js_1.FileSystemUtils.readTextFile(filePath);
                if (content && content.includes('volumes:')) {
                    hasVolumes = true;
                    volumeDetails = `Found volumes in ${file}`;
                    break;
                }
            }
        }
        return {
            passed: hasVolumes,
            details: hasVolumes ? volumeDetails : 'No volume configuration found',
        };
    }
    static async checkDockerScripts(context) {
        const scriptFiles = [
            'docker/run.sh',
            'docker/run.ps1',
            'scripts/docker.sh',
            'scripts/docker.ps1',
            'bin/docker',
            'Makefile',
        ];
        let foundScripts = 0;
        const foundFiles = [];
        for (const file of scriptFiles) {
            const filePath = path.join(context.projectPath, file);
            if (await index_js_1.FileSystemUtils.fileExists(filePath)) {
                foundScripts++;
                foundFiles.push(file);
            }
        }
        const passed = foundScripts > 0;
        return {
            passed,
            details: `Docker management scripts: ${foundScripts} (${foundFiles.join(', ')})`,
        };
    }
    static getCheckRecommendations(checkId) {
        const recommendations = {
            'docker.dockerfile': [
                'Создайте Dockerfile с базовыми инструкциями: FROM, WORKDIR, COPY, RUN, EXPOSE, CMD',
                'Используйте официальные базовые образы для безопасности',
            ],
            'docker.compose': [
                'Создайте docker-compose.yml для оркестрации сервисов',
                'Определите все необходимые сервисы и их зависимости',
            ],
            'docker.multi.stage': [
                'Используйте multi-stage сборку для оптимизации размера образа',
                'Разделите build и runtime стадии для эффективности',
            ],
            'docker.production.ready': [
                'Создайте docker-compose.prod.yml для production',
                'Настройте ENV переменные для разных окружений',
            ],
            'docker.security': [
                'Создайте non-root пользователя в Dockerfile',
                'Очищайте кэш пакетов после установки',
            ],
            'docker.health.check': [
                'Добавьте HEALTHCHECK в Dockerfile',
                'Настройте проверку работоспособности приложения',
            ],
            'docker.ignore': [
                'Создайте .dockerignore для исключения ненужных файлов',
                'Оптимизируйте контекст сборки',
            ],
            'docker.environments': [
                'Создайте конфигурации для dev, test, prod окружений',
                'Используйте override файлы для специфичных настроек',
            ],
            'docker.volumes': [
                'Настройте volumes для персистентных данных',
                'Используйте named volumes для критичных данных',
            ],
            'docker.scripts': [
                'Создайте скрипты для управления Docker (build, run, stop)',
                'Автоматизируйте часто используемые команды',
            ],
        };
        return recommendations[checkId] || [];
    }
    static generateRecommendations(failedChecks) {
        const recommendations = [];
        const criticalFailed = failedChecks.filter(c => c.check.critical);
        const highPriorityFailed = failedChecks.filter(c => c.check.level === 'high');
        if (criticalFailed.length > 0) {
            recommendations.push('🚨 КРИТИЧЕСКИЕ ПРОБЛЕМЫ: Отсутствует базовая Docker инфраструктура');
            recommendations.push('Приоритет 1: Создайте Dockerfile для контейнеризации');
        }
        if (highPriorityFailed.length > 0) {
            recommendations.push('⚠️ Важные улучшения: Оптимизируйте Docker конфигурацию');
            recommendations.push('Приоритет 2: Добавьте multi-stage сборку и production конфигурацию');
        }
        if (failedChecks.length > 0) {
            recommendations.push('📚 Рекомендуется изучить: Docker best practices для enterprise проектов');
        }
        return recommendations;
    }
}
exports.DockerChecker = DockerChecker;
//# sourceMappingURL=docker.js.map