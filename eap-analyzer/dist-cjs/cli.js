#!/usr/bin/env node
"use strict";
/**
 * CLI интерфейс для Эталонного Анализатора Проектов (ЭАП)
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
const commander_1 = require("commander");
const path = __importStar(require("path"));
const analyzer_js_1 = require("./analyzer.js");
const program = new commander_1.Command();
program
    .name('eap')
    .description('Эталонный Анализатор Проектов (ЭАП) - анализ по золотому стандарту SHINOMONTAGKA')
    .version('1.0.0');
program
    .command('analyze')
    .alias('a')
    .description('Анализировать проект по золотому стандарту')
    .argument('[path]', 'Путь к проекту (по умолчанию: текущая директория)', '.')
    .option('-o, --output <file>', 'Сохранить результаты в JSON файл')
    .option('-r, --report <file>', 'Создать HTML отчет')
    .option('--silent', 'Тихий режим (только результат)')
    .action(async (projectPath, options) => {
    try {
        const resolvedPath = path.resolve(projectPath);
        if (!options.silent) {
            // eslint-disable-next-line no-console
            console.log('🔍 Запуск анализа проекта...');
            // eslint-disable-next-line no-console
            console.log(`📂 Анализируем: ${resolvedPath}`);
            // eslint-disable-next-line no-console
            console.log('');
        }
        const analyzer = new analyzer_js_1.GoldenStandardAnalyzer();
        const result = await analyzer.analyzeProject(resolvedPath);
        // Сохранение результатов
        if (options.output) {
            await analyzer.saveResults(result, options.output);
        }
        if (options.report) {
            // TODO: Реализовать создание HTML отчета
            // eslint-disable-next-line no-console
            console.log('📄 HTML отчет будет реализован в следующей версии');
        }
        // Возвращаем код завершения в зависимости от результата
        if (result.summary.percentage >= 75) {
            process.exit(0); // Успех
        }
        else if (result.summary.percentage >= 50) {
            process.exit(1); // Предупреждение
        }
        else {
            process.exit(2); // Критические проблемы
        }
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Ошибка при анализе:', error instanceof Error ? error.message : error);
        process.exit(3);
    }
});
program
    .command('check')
    .alias('c')
    .description('Быстрая проверка готовности проекта')
    .argument('[path]', 'Путь к проекту (по умолчанию: текущая директория)', '.')
    .action(async (projectPath) => {
    try {
        const analyzer = new analyzer_js_1.GoldenStandardAnalyzer();
        const result = await analyzer.analyzeProject(path.resolve(projectPath));
        // Краткий вывод
        // eslint-disable-next-line no-console
        console.log('\n🎯 КРАТКИЙ РЕЗУЛЬТАТ:');
        // eslint-disable-next-line no-console
        console.log(`   Оценка: ${result.summary.percentage}/100`);
        // eslint-disable-next-line no-console
        console.log(`   Проверок пройдено: ${result.summary.passedChecks}/${result.summary.totalChecks}`);
        // eslint-disable-next-line no-console
        console.log(`   Критических проблем: ${result.summary.criticalIssues}`);
        if (result.summary.percentage >= 75) {
            // eslint-disable-next-line no-console
            console.log('✅ Проект готов к продакшену!');
        }
        else {
            // eslint-disable-next-line no-console
            console.log('⚠️ Проект требует доработки.');
        }
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Ошибка:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
});
program
    .command('init')
    .description('Инициализация проекта с базовыми файлами золотого стандарта')
    .argument('[path]', 'Путь к проекту (по умолчанию: текущая директория)', '.')
    .action(async (_projectPath) => {
    // eslint-disable-next-line no-console
    console.log('🚀 Инициализация проекта по золотому стандарту...');
    // eslint-disable-next-line no-console
    console.log('📝 Эта функция будет реализована в следующей версии');
    // eslint-disable-next-line no-console
    console.log('💡 Пока что используйте SHINOMONTAGKA template как основу');
});
program
    .command('standard')
    .alias('s')
    .description('Показать информацию о золотом стандарте')
    .action(() => {
    // eslint-disable-next-line no-console
    console.log('📚 SHINOMONTAGKA Golden Standard');
    // eslint-disable-next-line no-console
    console.log('━'.repeat(50));
    // eslint-disable-next-line no-console
    console.log('🔬 ЭМТ (Эталонный Модуль Тестирования):');
    // eslint-disable-next-line no-console
    console.log('   • Vitest для unit/integration тестов');
    // eslint-disable-next-line no-console
    console.log('   • Playwright для E2E тестов');
    // eslint-disable-next-line no-console
    console.log('   • Coverage >= 75%');
    // eslint-disable-next-line no-console
    console.log('');
    // eslint-disable-next-line no-console
    console.log('🐳 Docker Infrastructure:');
    // eslint-disable-next-line no-console
    console.log('   • Multi-stage Dockerfile');
    // eslint-disable-next-line no-console
    console.log('   • Docker Compose для всех окружений');
    // eslint-disable-next-line no-console
    console.log('   • Безопасность и оптимизация');
    // eslint-disable-next-line no-console
    console.log('');
    // eslint-disable-next-line no-console
    console.log('🎯 И еще 5 компонентов золотого стандарта!');
});
// Если нет аргументов, показываем help
if (process.argv.length <= 2) {
    program.help();
}
program.parse();
//# sourceMappingURL=cli.js.map