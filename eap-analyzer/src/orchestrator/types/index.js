/**
 * Эталонный Анализатор Проектов (ЭАП)
 * Типы и интерфейсы для анализа проектов
 */
// Конфигурация золотого стандарта по умолчанию
export const DEFAULT_GOLDEN_STANDARD = {
    name: 'SHINOMONTAGKA Golden Standard',
    version: '1.0.0',
    standards: [], // Будет заполнено в файлах checkers
    weights: {
        emt: 10,
        docker: 9,
        sveltekit: 9,
        cicd: 9,
        codeQuality: 10,
        vitest: 8,
        dependencies: 8,
        logging: 7,
        framework: 7,
        security: 8,
        performance: 7,
        documentation: 6,
    },
    thresholds: {
        excellent: 90,
        good: 70,
        acceptable: 50,
        poor: 0,
    },
};
