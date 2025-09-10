"use strict";
/**
 * Docker Analyzer
 * Анализатор конфигураций Docker
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
exports.DockerAnalyzer = void 0;
const interfaces_1 = require("../interfaces");
const yaml = __importStar(require("js-yaml"));
class DockerAnalyzer extends interfaces_1.BaseAnalyzer {
    constructor() {
        super('DockerAnalyzer', 'Анализирует конфигурации Docker, включая Dockerfile и docker-compose файлы');
    }
    async analyze(project) {
        console.log(`[${this.name}] Начинаем анализ Docker конфигураций...`);
        try {
            const issues = [];
            const recommendations = [];
            const securityMetrics = {
                exposedPorts: 0,
                rootUserUsage: false,
                secretsInConfig: 0,
                vulnerabilities: 0
            };
            // Анализируем Dockerfile
            const dockerfileAnalysis = await this.analyzeDockerfile(project);
            issues.push(...dockerfileAnalysis.issues);
            recommendations.push(...dockerfileAnalysis.recommendations);
            // Обновляем метрики безопасности
            securityMetrics.exposedPorts = dockerfileAnalysis.exposedPorts.length;
            securityMetrics.rootUserUsage = dockerfileAnalysis.rootUserUsage;
            securityMetrics.secretsInConfig += dockerfileAnalysis.secretsCount;
            // Анализируем docker-compose файлы
            const composeAnalysis = await this.analyzeDockerCompose(project);
            issues.push(...composeAnalysis.issues);
            recommendations.push(...composeAnalysis.recommendations);
            securityMetrics.secretsInConfig += composeAnalysis.secretsCount;
            // Определяем общий статус
            const criticalIssues = issues.filter(issue => issue.severity === 'critical');
            const highIssues = issues.filter(issue => issue.severity === 'high');
            let status;
            if (criticalIssues.length > 0) {
                status = 'invalid';
            }
            else if (highIssues.length > 0) {
                status = 'invalid';
            }
            else {
                status = 'valid';
            }
            const result = {
                type: 'docker',
                status,
                issues,
                recommendations,
                securityMetrics,
                baseImage: dockerfileAnalysis.baseImage,
                layersCount: dockerfileAnalysis.layersCount,
                multiStage: dockerfileAnalysis.multiStage,
                exposedPorts: dockerfileAnalysis.exposedPorts,
                environmentVariables: dockerfileAnalysis.environmentVariables,
                hasHealthcheck: dockerfileAnalysis.hasHealthcheck
            };
            console.log(`[${this.name}] Анализ завершен. Статус: ${status}, найдено проблем: ${issues.length}`);
            return result;
        }
        catch (error) {
            console.error(`[${this.name}] Ошибка при анализе:`, error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Ошибка анализа Docker конфигураций: ${errorMessage}`);
        }
    }
    /**
     * Анализирует Dockerfile
     */
    async analyzeDockerfile(project) {
        const issues = [];
        const recommendations = [];
        // Инициализируем результат значениями по умолчанию
        const result = {
            issues,
            recommendations,
            baseImage: { name: '', tag: '' },
            layersCount: 0,
            multiStage: false,
            exposedPorts: [],
            environmentVariables: [],
            hasHealthcheck: false,
            rootUserUsage: false,
            secretsCount: 0
        };
        const dockerfileContent = await this.safeReadFile(project, 'Dockerfile');
        if (!dockerfileContent) {
            issues.push({
                type: 'missing-dockerfile',
                severity: 'medium',
                message: 'Dockerfile не найден',
                file: 'Dockerfile'
            });
            return result;
        }
        const lines = dockerfileContent.split('\n').map(line => line.trim());
        let fromInstructions = 0;
        let userAsRoot = false;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i + 1;
            // Анализируем инструкции FROM
            if (line.startsWith('FROM ')) {
                fromInstructions++;
                if (fromInstructions === 1) {
                    const baseImageMatch = line.match(/FROM\s+([^\s]+)/);
                    if (baseImageMatch) {
                        const [imageName, tag = 'latest'] = baseImageMatch[1].split(':');
                        result.baseImage = { name: imageName, tag };
                        // Проверяем использование latest тега
                        if (tag === 'latest') {
                            issues.push({
                                type: 'latest-tag',
                                severity: 'medium',
                                message: 'Использование тега "latest" может привести к непредсказуемому поведению',
                                file: 'Dockerfile',
                                line: lineNumber
                            });
                        }
                    }
                }
            }
            // Считаем инструкции, создающие слои
            if (line.match(/^(RUN|COPY|ADD|WORKDIR|ENV|EXPOSE|VOLUME|USER|HEALTHCHECK)/)) {
                result.layersCount++;
            }
            // Проверяем EXPOSE инструкции
            if (line.startsWith('EXPOSE ')) {
                const portsMatch = line.match(/EXPOSE\s+(.+)/);
                if (portsMatch) {
                    const ports = portsMatch[1].split(/\s+/).map(p => parseInt(p.split('/')[0])).filter(p => !isNaN(p));
                    result.exposedPorts.push(...ports);
                }
            }
            // Проверяем переменные окружения
            if (line.startsWith('ENV ')) {
                const envMatch = line.match(/ENV\s+(\w+)/);
                if (envMatch) {
                    result.environmentVariables.push(envMatch[1]);
                    // Проверяем на секреты в переменных окружения
                    if (this.containsSecret(line)) {
                        result.secretsCount++;
                        issues.push({
                            type: 'secrets-in-env',
                            severity: 'high',
                            message: 'Обнаружены секреты в переменных окружения',
                            file: 'Dockerfile',
                            line: lineNumber
                        });
                    }
                }
            }
            // Проверяем пользователя
            if (line.startsWith('USER ')) {
                const userMatch = line.match(/USER\s+(.+)/);
                if (userMatch && (userMatch[1] === 'root' || userMatch[1] === '0')) {
                    userAsRoot = true;
                    result.rootUserUsage = true;
                    issues.push({
                        type: 'root-user',
                        severity: 'high',
                        message: 'Контейнер запускается от пользователя root',
                        file: 'Dockerfile',
                        line: lineNumber
                    });
                }
            }
            // Проверяем healthcheck
            if (line.startsWith('HEALTHCHECK ')) {
                result.hasHealthcheck = true;
            }
            // Проверяем небезопасные команды
            if (line.includes('curl') && line.includes('bash')) {
                issues.push({
                    type: 'unsafe-download',
                    severity: 'medium',
                    message: 'Обнаружена потенциально небезопасная загрузка с помощью curl | bash',
                    file: 'Dockerfile',
                    line: lineNumber
                });
            }
        }
        // Определяем multi-stage build
        result.multiStage = fromInstructions > 1;
        // Добавляем рекомендации
        if (result.layersCount > 20) {
            recommendations.push({
                category: 'optimization',
                priority: 'medium',
                description: 'Слишком много слоев в образе. Рассмотрите объединение RUN инструкций',
                estimatedEffort: '1-2 часа'
            });
        }
        if (!result.hasHealthcheck) {
            recommendations.push({
                category: 'reliability',
                priority: 'medium',
                description: 'Добавьте HEALTHCHECK инструкцию для мониторинга состояния контейнера',
                estimatedEffort: '30 минут'
            });
        }
        if (!result.multiStage && result.layersCount > 10) {
            recommendations.push({
                category: 'optimization',
                priority: 'low',
                description: 'Рассмотрите использование multi-stage build для уменьшения размера образа',
                estimatedEffort: '2-4 часа'
            });
        }
        return result;
    }
    /**
     * Анализирует docker-compose файлы
     */
    async analyzeDockerCompose(project) {
        const issues = [];
        const recommendations = [];
        let secretsCount = 0;
        const composeFiles = [
            'docker-compose.yml',
            'docker-compose.yaml',
            'docker-compose.override.yml',
            'docker-compose.prod.yml',
            'docker-compose.dev.yml'
        ];
        for (const composeFile of composeFiles) {
            const content = await this.safeReadFile(project, composeFile);
            if (!content)
                continue;
            try {
                const compose = yaml.load(content);
                if (!compose || !compose.services)
                    continue;
                // Анализируем сервисы
                for (const [serviceName, service] of Object.entries(compose.services)) {
                    // Проверяем переменные окружения
                    if (service.environment) {
                        const envVars = Array.isArray(service.environment)
                            ? service.environment
                            : Object.entries(service.environment).map(([k, v]) => `${k}=${v}`);
                        for (const envVar of envVars) {
                            if (this.containsSecret(String(envVar))) {
                                secretsCount++;
                                issues.push({
                                    type: 'secrets-in-compose',
                                    severity: 'high',
                                    message: `Обнаружены секреты в переменных окружения сервиса ${serviceName}`,
                                    file: composeFile
                                });
                            }
                        }
                    }
                    // Проверяем маппинг портов
                    if (service.ports) {
                        const exposedPorts = service.ports.length;
                        if (exposedPorts > 5) {
                            issues.push({
                                type: 'too-many-ports',
                                severity: 'medium',
                                message: `Сервис ${serviceName} открывает слишком много портов (${exposedPorts})`,
                                file: composeFile
                            });
                        }
                    }
                    // Проверяем privileged режим
                    if (service.privileged === true) {
                        issues.push({
                            type: 'privileged-container',
                            severity: 'critical',
                            message: `Сервис ${serviceName} запускается в privileged режиме`,
                            file: composeFile
                        });
                    }
                    // Проверяем volume binds
                    if (service.volumes) {
                        for (const volume of service.volumes) {
                            if (typeof volume === 'string' && volume.includes('/')) {
                                const [host, container] = volume.split(':');
                                if (host.startsWith('/') && (host.includes('/etc') || host.includes('/proc'))) {
                                    issues.push({
                                        type: 'dangerous-volume-mount',
                                        severity: 'high',
                                        message: `Сервис ${serviceName} монтирует системную директорию ${host}`,
                                        file: composeFile
                                    });
                                }
                            }
                        }
                    }
                }
                // Проверяем использование сетей
                if (!compose.networks) {
                    recommendations.push({
                        category: 'security',
                        priority: 'medium',
                        description: 'Рассмотрите создание пользовательских сетей для изоляции сервисов',
                        estimatedEffort: '1 час'
                    });
                }
            }
            catch (yamlError) {
                issues.push({
                    type: 'invalid-compose',
                    severity: 'high',
                    message: `Ошибка парсинга ${composeFile}: некорректный YAML`,
                    file: composeFile
                });
            }
        }
        return { issues, recommendations, secretsCount };
    }
    /**
     * Проверяет, содержит ли строка секреты
     */
    containsSecret(text) {
        const secretPatterns = [
            /password\s*[:=]\s*[\'\"]?[^\s\'\";]+/i,
            /secret\s*[:=]\s*[\'\"]?[^\s\'\";]+/i,
            /token\s*[:=]\s*[\'\"]?[^\s\'\";]+/i,
            /key\s*[:=]\s*[\'\"]?[^\s\'\";]+/i,
            /api[_-]?key\s*[:=]\s*[\'\"]?[^\s\'\";]+/i,
            /private[_-]?key\s*[:=]\s*[\'\"]?[^\s\'\";]+/i
        ];
        return secretPatterns.some(pattern => pattern.test(text));
    }
    /**
     * Проверяет применимость анализатора
     */
    async isApplicable(project) {
        const dockerFiles = ['Dockerfile', 'docker-compose.yml', 'docker-compose.yaml'];
        for (const file of dockerFiles) {
            if (await project.exists(file)) {
                return true;
            }
        }
        return false;
    }
}
exports.DockerAnalyzer = DockerAnalyzer;
//# sourceMappingURL=DockerAnalyzer.js.map