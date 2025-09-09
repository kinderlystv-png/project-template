"use strict";
/**
 * Улучшенный модуль ИИ-распознавания паттернов в коде
 * Использует улучшенные алгоритмы и множественные критерии для повышения точности
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatternRecognizer = void 0;
const pattern_matchers_1 = require("./pattern-matchers");
const pattern_definitions_1 = require("./pattern-definitions");
class PatternRecognizer {
    CONFIDENCE_THRESHOLD = 50; // Снижен для лучшего покрытия
    PATTERN_WEIGHTS = {
        architectural: 1.0,
        design: 0.8,
        antipattern: 1.2,
        performance: 0.9,
        security: 1.3,
    };
    context;
    constructor() {
        this.context = {
            files: [],
            directories: [],
            imports: new Map(),
            classes: new Map(),
            functions: new Map(),
            fileContents: new Map(),
            projectSize: 0,
        };
    }
    /**
     * Анализирует паттерны в структуре проекта с улучшенными алгоритмами
     */
    async analyzePatterns(files) {
        console.log(`🤖 Анализируем паттерны в ${files.length} файлах с улучшенными алгоритмами...`);
        // Обновляем контекст
        this.updateContext(files);
        const detectedPatterns = [];
        // Анализируем каждый тип паттернов с новыми алгоритмами
        detectedPatterns.push(...(await this.analyzePatternGroup('architectural', pattern_definitions_1.ARCHITECTURAL_PATTERNS)));
        detectedPatterns.push(...(await this.analyzePatternGroup('design', pattern_definitions_1.DESIGN_PATTERNS)));
        detectedPatterns.push(...(await this.analyzePatternGroup('antipattern', pattern_definitions_1.ANTIPATTERNS)));
        detectedPatterns.push(...(await this.analyzePatternGroup('security', pattern_definitions_1.SECURITY_PATTERNS)));
        // Фильтруем по уровню уверенности
        const significantPatterns = detectedPatterns.filter(p => p.confidence >= this.CONFIDENCE_THRESHOLD);
        const analysis = this.analyzeResults(significantPatterns);
        console.log(`✅ Обнаружено ${significantPatterns.length} значимых паттернов (улучшенный алгоритм)`);
        return {
            detectedPatterns: significantPatterns,
            ...analysis,
        };
    }
    /**
     * Обновляет контекст анализа на основе файлов
     */
    updateContext(files) {
        this.context.files = files.map(f => f.path);
        this.context.projectSize = files.length;
        // Извлекаем директории
        const directories = new Set();
        files.forEach(f => {
            const pathParts = f.path.split(/[\/\\]/);
            for (let i = 1; i < pathParts.length; i++) {
                directories.add(pathParts.slice(0, i).join('/'));
            }
        });
        this.context.directories = Array.from(directories);
        // Обновляем контент файлов
        this.context.fileContents.clear();
        files.forEach(f => {
            this.context.fileContents.set(f.path, f.content);
        });
        // Извлекаем импорты (упрощенная версия)
        this.context.imports.clear();
        files.forEach(f => {
            const imports = this.extractImports(f.content);
            if (imports.length > 0) {
                this.context.imports.set(f.path, imports);
            }
        });
        // Обновляем классы и функции
        this.context.classes.clear();
        this.context.functions.clear();
        files.forEach(f => {
            f.classes.forEach(c => {
                this.context.classes.set(c.name, {
                    name: c.name,
                    methods: Array.from({ length: c.methods }, (_, i) => `method${i}`),
                    properties: Array.from({ length: c.properties }, (_, i) => `prop${i}`),
                    extends: c.inheritance[0],
                    implements: c.interfaces,
                });
            });
            f.functions.forEach(fn => {
                this.context.functions.set(fn.name, {
                    name: fn.name,
                    parameters: fn.parameters,
                    async: fn.async,
                    generator: false,
                    complexity: fn.complexity,
                });
            });
        });
    }
    /**
     * Анализирует группу паттернов определенного типа
     */
    async analyzePatternGroup(groupType, patterns) {
        const results = [];
        for (const patternDef of patterns) {
            const result = this.analyzePatternDefinition(patternDef);
            if (result) {
                results.push(result);
            }
        }
        return results;
    }
    /**
     * Анализирует конкретное определение паттерна
     */
    analyzePatternDefinition(definition) {
        const evidence = [];
        const matchedConditions = [];
        let totalScore = 0;
        let matchedMatchers = 0;
        // Оцениваем каждый матчер
        for (const matcher of definition.matchers) {
            const score = pattern_matchers_1.PatternMatchers.matchCombined(this.context, [matcher]);
            if (score > 0) {
                matchedMatchers++;
                totalScore += score * matcher.weight;
                // Генерируем доказательство
                const evidenceText = this.generateEvidence(matcher, score);
                if (evidenceText) {
                    evidence.push(evidenceText);
                    matchedConditions.push(matcher.type);
                }
            }
        }
        // Проверяем минимальное количество совпадений
        if (matchedMatchers < definition.minMatches) {
            return null;
        }
        // Рассчитываем базовую уверенность
        let confidence = definition.baseConfidence * totalScore;
        // Применяем модификаторы уверенности
        const appliedModifiers = [];
        if (definition.confidenceModifiers) {
            for (const modifier of definition.confidenceModifiers) {
                try {
                    if (modifier.condition(this.context)) {
                        confidence *= modifier.modifier;
                        appliedModifiers.push({
                            description: modifier.description,
                            impact: modifier.modifier,
                        });
                        evidence.push(`✓ ${modifier.description}`);
                    }
                }
                catch (error) {
                    console.warn(`Confidence modifier evaluation error: ${error}`);
                }
            }
        }
        // Ограничиваем уверенность в пределах 0-100
        confidence = Math.max(0, Math.min(100, confidence * 100));
        // Создаем результат
        const pattern = {
            id: definition.id,
            name: definition.name,
            type: definition.category,
            confidence: Math.round(confidence),
            description: definition.description,
            impact: this.determineImpact(definition.category, confidence),
            locations: this.generateLocations(evidence),
            recommendation: this.generateRecommendation(definition),
            examples: this.generateExamples(definition),
            evidence,
            matchDetails: {
                matchedConditions: matchedMatchers,
                totalConditions: definition.matchers.length,
                criticalMatches: matchedConditions,
                confidenceModifiers: appliedModifiers,
            },
        };
        return pattern;
    }
    /**
     * Определяет уровень воздействия паттерна
     */
    determineImpact(category, confidence) {
        if (category === 'security') {
            return confidence > 80 ? 'critical' : confidence > 60 ? 'high' : 'medium';
        }
        if (category === 'antipattern') {
            return confidence > 85 ? 'high' : confidence > 65 ? 'medium' : 'low';
        }
        if (category === 'architectural') {
            return confidence > 80 ? 'medium' : 'low';
        }
        return 'low';
    }
    /**
     * Генерирует описание доказательства
     */
    generateEvidence(matcher, score) {
        const confidence = Math.round(score * 100);
        switch (matcher.type) {
            case 'file':
                return `Файловая структура соответствует паттерну (${confidence}%)`;
            case 'directory':
                return `Структура директорий указывает на паттерн (${confidence}%)`;
            case 'content':
                return `Содержимое кода содержит признаки паттерна (${confidence}%)`;
            case 'import':
                return `Импорты соответствуют паттерну (${confidence}%)`;
            case 'class':
                return `Найдены классы, характерные для паттерна (${confidence}%)`;
            case 'function':
                return `Функции соответствуют паттерну (${confidence}%)`;
            default:
                return `Обнаружен признак паттерна (${confidence}%)`;
        }
    }
    /**
     * Генерирует локации для паттерна
     */
    generateLocations(evidence) {
        // Упрощенная генерация локаций
        const locations = [];
        const files = Array.from(this.context.files).slice(0, 3);
        files.forEach((filePath, index) => {
            locations.push({
                filePath,
                startLine: 1,
                endLine: 10,
                codeSnippet: `// Pattern evidence ${index + 1}`,
                context: evidence[index] || 'Pattern detected',
            });
        });
        return locations;
    }
    /**
     * Генерирует рекомендацию для паттерна
     */
    generateRecommendation(definition) {
        const category = definition.category;
        const name = definition.name;
        if (category === 'architectural') {
            return `Хорошая архитектурная практика (${name}). Продолжайте следовать этому паттерну.`;
        }
        if (category === 'design') {
            return `Паттерн проектирования (${name}) обнаружен. Убедитесь в правильной реализации.`;
        }
        if (category === 'antipattern') {
            return `ВНИМАНИЕ: Обнаружен антипаттерн (${name}). Рекомендуется рефакторинг.`;
        }
        if (category === 'security') {
            return `КРИТИЧНО: Проблема безопасности (${name}). Требуется немедленное исправление.`;
        }
        return `Обнаружен паттерн: ${name}. Проверьте соответствие лучшим практикам.`;
    }
    /**
     * Генерирует примеры для паттерна
     */
    generateExamples(definition) {
        const examples = [];
        definition.matchers.forEach(matcher => {
            if (matcher.type === 'class') {
                examples.push(`Классы с паттерном ${matcher.type}`);
            }
            else if (matcher.type === 'file') {
                examples.push(`Файлы соответствующие структуре`);
            }
            else {
                examples.push(`Признаки в ${matcher.type}`);
            }
        });
        return examples.slice(0, 3);
    }
    /**
     * Извлекает импорты из содержимого файла
     */
    extractImports(content) {
        const imports = [];
        // Простое извлечение импортов
        const importRegex = /import\s+(?:[\w\s{},*]+\s+from\s+)?['"]([^'"]+)['"]/g;
        const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
        let match;
        while ((match = importRegex.exec(content)) !== null) {
            imports.push(match[1]);
        }
        while ((match = requireRegex.exec(content)) !== null) {
            imports.push(match[1]);
        }
        return imports;
    } /**
     * Обнаруживает архитектурные паттерны (оставлены старые методы для совместимости)
     */
    async detectArchitecturalPatterns(files) {
        // Используем новый улучшенный алгоритм
        this.updateContext(files);
        return this.analyzePatternGroup('architectural', pattern_definitions_1.ARCHITECTURAL_PATTERNS);
    }
    /**
     * Обнаруживает паттерны проектирования
     */
    async detectDesignPatterns(files) {
        return this.analyzePatternGroup('design', pattern_definitions_1.DESIGN_PATTERNS);
    }
    /**
     * Обнаруживает антипаттерны
     */
    async detectAntipatterns(files) {
        return this.analyzePatternGroup('antipattern', pattern_definitions_1.ANTIPATTERNS);
    }
    /**
     * Обнаруживает паттерны производительности
     */
    async detectPerformancePatterns(files) {
        const patterns = [];
        // N+1 Query Problem (улучшенное обнаружение)
        const nPlusOnePattern = this.detectNPlusOneQueries(files);
        if (nPlusOnePattern)
            patterns.push(nPlusOnePattern);
        // Memory Leaks (улучшенное обнаружение)
        const memoryLeakPattern = this.detectMemoryLeaks(files);
        if (memoryLeakPattern)
            patterns.push(memoryLeakPattern);
        // Inefficient Loops (улучшенное обнаружение)
        const inefficientLoopsPattern = this.detectInefficientLoops(files);
        if (inefficientLoopsPattern)
            patterns.push(inefficientLoopsPattern);
        return patterns;
    }
    /**
     * Обнаруживает проблемы безопасности
     */
    async detectSecurityPatterns(files) {
        return this.analyzePatternGroup('security', pattern_definitions_1.SECURITY_PATTERNS);
    }
    /**
     * Обнаруживает паттерн MVC
     */
    detectMVCPattern(files) {
        const controllers = files.filter(f => f.path.includes('controller') ||
            f.path.includes('route') ||
            f.content.includes('app.get(') ||
            f.content.includes('app.post('));
        const models = files.filter(f => f.path.includes('model') ||
            f.path.includes('schema') ||
            f.content.includes('mongoose.Schema') ||
            f.content.includes('class.*Model'));
        const views = files.filter(f => f.path.includes('view') ||
            f.path.includes('template') ||
            f.path.includes('component') ||
            f.path.endsWith('.jsx') ||
            f.path.endsWith('.vue'));
        if (controllers.length === 0 && models.length === 0 && views.length === 0) {
            return null;
        }
        const confidence = Math.min(100, controllers.length * 20 + models.length * 25 + views.length * 15);
        if (confidence < 40)
            return null;
        return {
            id: 'mvc-pattern',
            name: 'Model-View-Controller (MVC)',
            type: 'architectural',
            confidence,
            description: 'Архитектурный паттерн MVC разделяет логику на модели, представления и контроллеры',
            impact: 'medium',
            locations: [
                ...controllers.slice(0, 3).map(f => this.createPatternLocation(f, 'Controller')),
                ...models.slice(0, 3).map(f => this.createPatternLocation(f, 'Model')),
                ...views.slice(0, 3).map(f => this.createPatternLocation(f, 'View')),
            ],
            recommendation: 'Хорошая архитектурная основа. Убедитесь в четком разделении ответственности между слоями.',
            examples: [
                'Controllers: обработка HTTP запросов',
                'Models: бизнес-логика и данные',
                'Views: отображение пользовательского интерфейса',
            ],
        };
    }
    /**
     * Обнаруживает микросервисную архитектуру
     */
    detectMicroservicesPattern(files) {
        const serviceIndicators = files.filter(f => f.path.includes('service') ||
            f.content.includes('microservice') ||
            f.content.includes('api/v') ||
            f.content.includes('express()') ||
            f.content.includes('fastify()'));
        const dockerFiles = files.filter(f => f.path.includes('Dockerfile') || f.path.includes('docker-compose'));
        const apiGateways = files.filter(f => f.content.includes('proxy') || f.content.includes('gateway') || f.content.includes('nginx'));
        const confidence = Math.min(100, serviceIndicators.length * 15 + dockerFiles.length * 25 + apiGateways.length * 30);
        if (confidence < 50)
            return null;
        return {
            id: 'microservices-pattern',
            name: 'Microservices Architecture',
            type: 'architectural',
            confidence,
            description: 'Микросервисная архитектура с разделением на независимые сервисы',
            impact: 'high',
            locations: serviceIndicators
                .slice(0, 5)
                .map(f => this.createPatternLocation(f, 'Microservice')),
            recommendation: 'Отличная масштабируемая архитектура. Обратите внимание на мониторинг и обработку ошибок между сервисами.',
            examples: [
                'Независимые сервисы с собственными API',
                'Контейнеризация с Docker',
                'API Gateway для маршрутизации',
            ],
        };
    }
    /**
     * Обнаруживает слоистую архитектуру
     */
    detectLayeredArchitecture(files) {
        const layers = {
            presentation: files.filter(f => f.path.includes('ui/') || f.path.includes('frontend/') || f.path.includes('components/')),
            business: files.filter(f => f.path.includes('business/') || f.path.includes('logic/') || f.path.includes('services/')),
            data: files.filter(f => f.path.includes('data/') || f.path.includes('dao/') || f.path.includes('repository/')),
        };
        const layerCount = Object.values(layers).filter(layer => layer.length > 0).length;
        if (layerCount < 2)
            return null;
        const confidence = Math.min(100, layerCount * 25 +
            Object.values(layers).reduce((sum, layer) => sum + Math.min(layer.length, 5), 0) * 5);
        return {
            id: 'layered-architecture',
            name: 'Layered Architecture',
            type: 'architectural',
            confidence,
            description: 'Слоистая архитектура с четким разделением уровней ответственности',
            impact: 'medium',
            locations: Object.entries(layers)
                .filter(([_, files]) => files.length > 0)
                .map(([layer, files]) => this.createPatternLocation(files[0], `${layer} layer`)),
            recommendation: 'Хорошая организация кода по слоям. Избегайте нарушения зависимостей между слоями.',
            examples: [
                'Presentation Layer: UI компоненты',
                'Business Layer: бизнес-логика',
                'Data Layer: работа с данными',
            ],
        };
    }
    /**
     * Обнаруживает компонентную архитектуру
     */
    detectComponentPattern(files) {
        const componentFiles = files.filter(f => f.path.includes('component') ||
            f.path.endsWith('.jsx') ||
            f.path.endsWith('.tsx') ||
            f.path.endsWith('.vue') ||
            f.content.includes('React.Component') ||
            f.content.includes('Vue.component'));
        if (componentFiles.length < 3)
            return null;
        const confidence = Math.min(100, componentFiles.length * 8);
        return {
            id: 'component-pattern',
            name: 'Component-Based Architecture',
            type: 'architectural',
            confidence,
            description: 'Компонентная архитектура с переиспользуемыми UI компонентами',
            impact: 'medium',
            locations: componentFiles.slice(0, 5).map(f => this.createPatternLocation(f, 'Component')),
            recommendation: 'Отличная модульность. Следите за размером компонентов и избегайте глубокой вложенности.',
            examples: [
                'Переиспользуемые UI компоненты',
                'Инкапсуляция логики представления',
                'Композиция вместо наследования',
            ],
        };
    }
    /**
     * Создает локацию паттерна
     */
    createPatternLocation(file, context) {
        const lines = file.content.split('\n');
        const snippet = lines.slice(0, 5).join('\n');
        return {
            filePath: file.path,
            startLine: 1,
            endLine: Math.min(5, lines.length),
            codeSnippet: snippet,
            context,
        };
    }
    /**
     * Анализирует результаты обнаружения паттернов
     */
    analyzeResults(patterns) {
        const antipatterns = patterns.filter(p => p.type === 'antipattern');
        const securityConcerns = patterns.filter(p => p.type === 'security');
        const performanceIssues = patterns.filter(p => p.type === 'performance');
        const goodPatterns = patterns.filter(p => ['architectural', 'design'].includes(p.type));
        // Расчет архитектурного счета
        const architecturalScore = Math.max(0, 100 -
            antipatterns.length * 15 -
            securityConcerns.length * 25 -
            performanceIssues.length * 10 +
            goodPatterns.length * 5);
        // Расчет качества дизайна
        const designQuality = Math.max(0, 100 -
            antipatterns.filter(p => p.impact === 'high' || p.impact === 'critical').length * 20 -
            patterns.filter(p => p.confidence < 70).length * 5);
        // Общая уверенность
        const totalConfidence = patterns.length > 0
            ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length
            : 0;
        // Определение преобладающей архитектуры
        const architecturalPatterns = patterns.filter(p => p.type === 'architectural');
        const predominantArchitecture = architecturalPatterns.length > 0
            ? architecturalPatterns.reduce((prev, current) => current.confidence > prev.confidence ? current : prev).name
            : 'Неопределена';
        // Генерация рекомендаций
        const recommendations = this.generateSummaryRecommendations(patterns, architecturalScore, designQuality);
        return {
            architecturalScore: Math.round(architecturalScore),
            designQuality: Math.round(designQuality),
            antipatternCount: antipatterns.length,
            securityConcerns,
            performanceIssues,
            recommendations,
            summary: {
                goodPatterns: goodPatterns.length,
                problematicPatterns: antipatterns.length + securityConcerns.length + performanceIssues.length,
                totalConfidence: Math.round(totalConfidence),
                predominantArchitecture,
            },
        };
    }
    /**
     * Генерирует итоговые рекомендации
     */
    generateSummaryRecommendations(patterns, architecturalScore, designQuality) {
        const recommendations = [];
        // Критические проблемы
        const criticalPatterns = patterns.filter(p => p.impact === 'critical');
        if (criticalPatterns.length > 0) {
            recommendations.push(`🚨 КРИТИЧНО: Обнаружено ${criticalPatterns.length} критических проблем требующих немедленного исправления!`);
        }
        // Архитектурные рекомендации
        if (architecturalScore < 50) {
            recommendations.push('🏗️ Архитектура требует серьезной переработки. Рассмотрите рефакторинг.');
        }
        else if (architecturalScore < 70) {
            recommendations.push('🔧 Архитектура нуждается в улучшениях. Устраните выявленные антипаттерны.');
        }
        else {
            recommendations.push('✅ Архитектура в хорошем состоянии. Продолжайте следовать лучшим практикам.');
        }
        // Дизайн рекомендации
        if (designQuality < 60) {
            recommendations.push('📐 Качество дизайна низкое. Применяйте принципы SOLID и паттерны проектирования.');
        }
        // Безопасность
        const securityIssues = patterns.filter(p => p.type === 'security').length;
        if (securityIssues > 0) {
            recommendations.push(`🔒 Обнаружено ${securityIssues} проблем безопасности. Проведите security аудит.`);
        }
        // Производительность
        const performanceIssues = patterns.filter(p => p.type === 'performance').length;
        if (performanceIssues > 0) {
            recommendations.push(`⚡ Обнаружено ${performanceIssues} проблем производительности. Оптимизируйте алгоритмы.`);
        }
        if (recommendations.length === 0) {
            recommendations.push('🎉 Отличная работа! Серьезных проблем не обнаружено.');
        }
        return recommendations;
    }
    /**
     * Обнаруживает N+1 Query Problem
     */
    detectNPlusOneQueries(files) {
        const suspiciousFiles = files.filter(f => {
            const content = f.content.toLowerCase();
            const hasLoopWithQuery = (content.includes('for') || content.includes('foreach') || content.includes('map')) &&
                (content.includes('query') || content.includes('find') || content.includes('select'));
            return hasLoopWithQuery;
        });
        if (suspiciousFiles.length === 0)
            return null;
        return {
            id: 'n-plus-one-queries',
            name: 'N+1 Query Problem',
            type: 'performance',
            confidence: Math.min(75, suspiciousFiles.length * 35),
            description: 'Обнаружена потенциальная проблема N+1 запросов в циклах',
            impact: 'high',
            locations: suspiciousFiles.map(f => this.createPatternLocation(f, 'N+1 Queries')),
            recommendation: 'КРИТИЧНО для производительности: Используйте eager loading, batch queries или JOIN запросы вместо запросов в циклах.',
            examples: [
                'Запросы к БД в циклах',
                'API вызовы для каждого элемента массива',
                'Отсутствие batch loading',
            ],
        };
    }
    /**
     * Обнаруживает потенциальные утечки памяти
     */
    detectMemoryLeaks(files) {
        const suspiciousFiles = files.filter(f => {
            const content = f.content.toLowerCase();
            const hasEventListeners = content.includes('addeventlistener') && !content.includes('removeeventlistener');
            const hasIntervals = content.includes('setinterval') && !content.includes('clearinterval');
            const hasTimeouts = content.includes('settimeout') && !content.includes('cleartimeout');
            return hasEventListeners || hasIntervals || hasTimeouts;
        });
        if (suspiciousFiles.length === 0)
            return null;
        return {
            id: 'memory-leaks',
            name: 'Potential Memory Leaks',
            type: 'performance',
            confidence: Math.min(65, suspiciousFiles.length * 30),
            description: 'Обнаружены потенциальные утечки памяти из-за неочищенных ресурсов',
            impact: 'medium',
            locations: suspiciousFiles.map(f => this.createPatternLocation(f, 'Memory Leak Risk')),
            recommendation: 'Убедитесь в правильной очистке event listeners, timers и других ресурсов. Используйте cleanup методы.',
            examples: [
                'Event listeners без removeEventListener',
                'setInterval без clearInterval',
                'setTimeout без clearTimeout',
            ],
        };
    }
    /**
     * Обнаруживает неэффективные циклы
     */
    detectInefficientLoops(files) {
        const suspiciousFiles = files.filter(f => {
            const content = f.content;
            const nestedLoops = (content.match(/for.*{[\s\S]*?for/g) || []).length;
            const inefficientOperations = (content.includes('indexOf') && content.includes('for')) ||
                (content.includes('includes') && content.includes('for'));
            return nestedLoops > 2 || inefficientOperations;
        });
        if (suspiciousFiles.length === 0)
            return null;
        return {
            id: 'inefficient-loops',
            name: 'Inefficient Loop Patterns',
            type: 'performance',
            confidence: Math.min(70, suspiciousFiles.length * 25),
            description: 'Обнаружены потенциально неэффективные циклы или алгоритмы',
            impact: 'medium',
            locations: suspiciousFiles.map(f => this.createPatternLocation(f, 'Inefficient Loop')),
            recommendation: 'Рассмотрите использование более эффективных алгоритмов: Map/Set для поиска, уменьшение вложенности циклов.',
            examples: [
                'Глубоко вложенные циклы (O(n³)+)',
                'Поиск в массиве внутри цикла',
                'Неоптимальные алгоритмы сортировки',
            ],
        };
    }
}
exports.PatternRecognizer = PatternRecognizer;
//# sourceMappingURL=pattern-recognizer.js.map