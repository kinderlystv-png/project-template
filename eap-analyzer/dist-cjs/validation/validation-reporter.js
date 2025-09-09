"use strict";
/**
 * Генератор отчетов о валидации исправлений
 * Создает детальные отчеты о состоянии исправленных багов
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
exports.ValidationReporter = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ValidationReporter {
    /**
     * Создает объединенный отчет о валидации
     */
    async generateCombinedReport(bugFixReport, metricsReport) {
        const criticalIssuesCount = bugFixReport.criticalIssues.length + metricsReport.summary.criticalViolations;
        const warningsCount = bugFixReport.rules.warnings + metricsReport.summary.warningViolations;
        const confidence = this.calculateConfidence(bugFixReport, metricsReport);
        const isValid = criticalIssuesCount === 0;
        const combinedRecommendations = [
            ...bugFixReport.recommendations,
            ...this.extractMetricsRecommendations(metricsReport),
        ].filter((rec, index, arr) => arr.indexOf(rec) === index); // Убираем дубликаты
        return {
            projectPath: bugFixReport.projectPath,
            reportGeneratedAt: new Date(),
            bugFixValidation: bugFixReport,
            metricsValidation: metricsReport,
            overall: {
                isValid,
                confidence,
                criticalIssuesCount,
                warningsCount,
                summary: this.generateOverallSummary(isValid, confidence, criticalIssuesCount, warningsCount),
            },
            recommendations: combinedRecommendations,
        };
    }
    /**
     * Выводит отчет в консоль
     */
    async printConsoleReport(report, options = {}) {
        const opts = { includeDetails: true, includeRecommendations: true, ...options };
        console.log('\n' + '='.repeat(80));
        console.log('📊 ОТЧЕТ О ВАЛИДАЦИИ ИСПРАВЛЕНИЙ EAP');
        console.log('='.repeat(80));
        if (opts.includeTimestamp) {
            console.log(`🕒 Время генерации: ${report.reportGeneratedAt.toLocaleString()}`);
        }
        console.log(`📂 Проект: ${report.projectPath}`);
        console.log('');
        // Общая сводка
        console.log('🎯 ОБЩАЯ СВОДКА:');
        console.log(`   ${report.overall.isValid ? '✅ ВАЛИДАЦИЯ ПРОШЛА' : '❌ ВАЛИДАЦИЯ НЕ ПРОШЛА'}`);
        console.log(`   🎯 Уровень доверия: ${report.overall.confidence.toFixed(1)}%`);
        console.log(`   🚨 Критические проблемы: ${report.overall.criticalIssuesCount}`);
        console.log(`   ⚠️  Предупреждения: ${report.overall.warningsCount}`);
        console.log(`   📝 ${report.overall.summary}`);
        console.log('');
        // Результаты валидации багфиксов
        console.log('🔧 ВАЛИДАЦИЯ ИСПРАВЛЕНИЙ БАГОВ:');
        console.log(`   📋 Правил: ${report.bugFixValidation.rules.total}`);
        console.log(`   ✅ Прошло: ${report.bugFixValidation.rules.passed}`);
        console.log(`   ❌ Провалено: ${report.bugFixValidation.rules.failed}`);
        console.log(`   ⚠️  Предупреждения: ${report.bugFixValidation.rules.warnings}`);
        if (opts.includeDetails) {
            console.log('\n   📊 По категориям:');
            for (const [category, results] of Object.entries(report.bugFixValidation.categories)) {
                const total = results.passed + results.failed;
                console.log(`   ${category}: ${results.passed}/${total} ✅`);
            }
        }
        // Результаты валидации метрик
        console.log('\n📊 ВАЛИДАЦИЯ МЕТРИК:');
        console.log(`   📋 Метрик: ${report.metricsValidation.totalMetrics}`);
        console.log(`   ✅ Корректных: ${report.metricsValidation.validMetrics}`);
        console.log(`   ❌ Некорректных: ${report.metricsValidation.invalidMetrics}`);
        console.log(`   🚨 Критические нарушения: ${report.metricsValidation.summary.criticalViolations}`);
        if (opts.includeDetails) {
            console.log('\n   📊 По категориям:');
            for (const [category, stats] of Object.entries(report.metricsValidation.summary.byCategory)) {
                const total = stats.valid + stats.invalid;
                console.log(`   ${category}: ${stats.valid}/${total} ✅`);
            }
        }
        // Критические проблемы
        if (report.overall.criticalIssuesCount > 0) {
            console.log('\n🚨 КРИТИЧЕСКИЕ ПРОБЛЕМЫ:');
            for (const issue of report.bugFixValidation.criticalIssues) {
                console.log(`   ❌ ${issue.message}`);
                console.log(`      Получено: ${issue.value}, Ожидалось: ${issue.expected}`);
            }
            const criticalMetrics = report.metricsValidation.results.filter(r => !r.isValid && r.violations.some(v => this.isCriticalViolation(v)));
            for (const metric of criticalMetrics) {
                console.log(`   ❌ ${metric.metric}: ${metric.value}`);
                metric.violations.forEach(violation => console.log(`      ${violation}`));
            }
        }
        // Рекомендации
        if (opts.includeRecommendations && report.recommendations.length > 0) {
            console.log('\n💡 РЕКОМЕНДАЦИИ:');
            report.recommendations.forEach(rec => console.log(`   ${rec}`));
        }
        console.log('\n' + '='.repeat(80));
    }
    /**
     * Сохраняет отчет в файл
     */
    async saveReport(report, options) {
        let content;
        let filename;
        switch (options.format) {
            case 'json':
                content = JSON.stringify(report, null, 2);
                filename = 'validation-report.json';
                break;
            case 'markdown':
                content = this.generateMarkdownReport(report, options);
                filename = 'validation-report.md';
                break;
            case 'html':
                content = this.generateHtmlReport(report, options);
                filename = 'validation-report.html';
                break;
            default:
                throw new Error(`Неподдерживаемый формат: ${options.format}`);
        }
        const outputPath = options.outputPath || './reports';
        const fullPath = path.join(outputPath, filename);
        // Создаем директорию если не существует
        if (!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath, { recursive: true });
        }
        fs.writeFileSync(fullPath, content, 'utf-8');
        console.log(`📄 Отчет сохранен: ${fullPath}`);
        return fullPath;
    }
    /**
     * Генерирует Markdown отчет
     */
    generateMarkdownReport(report, options) {
        const { includeDetails, includeRecommendations, includeTimestamp } = options;
        let md = `# 📊 Отчет о валидации исправлений EAP\n\n`;
        if (includeTimestamp) {
            md += `**Время генерации:** ${report.reportGeneratedAt.toLocaleString()}\n`;
        }
        md += `**Проект:** \`${report.projectPath}\`\n\n`;
        // Общая сводка
        md += `## 🎯 Общая сводка\n\n`;
        md += `| Параметр | Значение |\n`;
        md += `|----------|----------|\n`;
        md += `| Статус | ${report.overall.isValid ? '✅ ПРОШЛА' : '❌ НЕ ПРОШЛА'} |\n`;
        md += `| Уровень доверия | ${report.overall.confidence.toFixed(1)}% |\n`;
        md += `| Критические проблемы | ${report.overall.criticalIssuesCount} |\n`;
        md += `| Предупреждения | ${report.overall.warningsCount} |\n\n`;
        md += `**Резюме:** ${report.overall.summary}\n\n`;
        // Валидация багфиксов
        md += `## 🔧 Валидация исправлений багов\n\n`;
        md += `| Метрика | Значение |\n`;
        md += `|---------|----------|\n`;
        md += `| Всего правил | ${report.bugFixValidation.rules.total} |\n`;
        md += `| Прошло | ${report.bugFixValidation.rules.passed} |\n`;
        md += `| Провалено | ${report.bugFixValidation.rules.failed} |\n`;
        md += `| Предупреждения | ${report.bugFixValidation.rules.warnings} |\n\n`;
        if (includeDetails) {
            md += `### Детали по категориям\n\n`;
            for (const [category, results] of Object.entries(report.bugFixValidation.categories)) {
                const total = results.passed + results.failed;
                md += `- **${category}**: ${results.passed}/${total} ✅\n`;
            }
            md += '\n';
        }
        // Валидация метрик
        md += `## 📊 Валидация метрик\n\n`;
        md += `| Метрика | Значение |\n`;
        md += `|---------|----------|\n`;
        md += `| Всего метрик | ${report.metricsValidation.totalMetrics} |\n`;
        md += `| Корректных | ${report.metricsValidation.validMetrics} |\n`;
        md += `| Некорректных | ${report.metricsValidation.invalidMetrics} |\n`;
        md += `| Критические нарушения | ${report.metricsValidation.summary.criticalViolations} |\n\n`;
        // Критические проблемы
        if (report.overall.criticalIssuesCount > 0) {
            md += `## 🚨 Критические проблемы\n\n`;
            for (const issue of report.bugFixValidation.criticalIssues) {
                md += `### ${issue.message}\n`;
                md += `- **Получено:** ${issue.value}\n`;
                md += `- **Ожидалось:** ${issue.expected}\n\n`;
            }
        }
        // Рекомендации
        if (includeRecommendations && report.recommendations.length > 0) {
            md += `## 💡 Рекомендации\n\n`;
            report.recommendations.forEach(rec => (md += `- ${rec}\n`));
            md += '\n';
        }
        return md;
    }
    /**
     * Генерирует HTML отчет
     */
    generateHtmlReport(report, options) {
        const title = 'Отчет о валидации исправлений EAP';
        const statusColor = report.overall.isValid ? '#28a745' : '#dc3545';
        const statusIcon = report.overall.isValid ? '✅' : '❌';
        return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { border-bottom: 3px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }
        .status { color: ${statusColor}; font-weight: bold; font-size: 1.2em; }
        .section { margin: 30px 0; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
        .critical { background-color: #fff5f5; border-left: 4px solid #dc3545; }
        .warning { background-color: #fffbf0; border-left: 4px solid #ffc107; }
        .success { background-color: #f0fff4; border-left: 4px solid #28a745; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; }
        .metric-value { font-family: monospace; background-color: #f8f9fa; padding: 2px 6px; border-radius: 3px; }
        ul { padding-left: 20px; }
        .confidence-bar {
            width: 100%; height: 20px; background-color: #e9ecef; border-radius: 10px; overflow: hidden;
        }
        .confidence-fill {
            height: 100%; background: linear-gradient(90deg, #dc3545 0%, #ffc107 50%, #28a745 100%);
            width: ${report.overall.confidence}%; transition: width 0.3s ease;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 ${title}</h1>
        <p><strong>Проект:</strong> <code>${report.projectPath}</code></p>
        ${options.includeTimestamp ? `<p><strong>Время генерации:</strong> ${report.reportGeneratedAt.toLocaleString()}</p>` : ''}
    </div>

    <div class="section ${report.overall.isValid ? 'success' : 'critical'}">
        <h2>🎯 Общая сводка</h2>
        <p class="status">${statusIcon} Статус: ${report.overall.isValid ? 'ВАЛИДАЦИЯ ПРОШЛА' : 'ВАЛИДАЦИЯ НЕ ПРОШЛА'}</p>

        <h3>Уровень доверия: ${report.overall.confidence.toFixed(1)}%</h3>
        <div class="confidence-bar">
            <div class="confidence-fill"></div>
        </div>

        <table>
            <tr><td><strong>Критические проблемы</strong></td><td class="metric-value">${report.overall.criticalIssuesCount}</td></tr>
            <tr><td><strong>Предупреждения</strong></td><td class="metric-value">${report.overall.warningsCount}</td></tr>
        </table>

        <p><strong>Резюме:</strong> ${report.overall.summary}</p>
    </div>

    <div class="section">
        <h2>🔧 Валидация исправлений багов</h2>
        <table>
            <tr><th>Метрика</th><th>Значение</th></tr>
            <tr><td>Всего правил</td><td class="metric-value">${report.bugFixValidation.rules.total}</td></tr>
            <tr><td>Прошло</td><td class="metric-value">${report.bugFixValidation.rules.passed}</td></tr>
            <tr><td>Провалено</td><td class="metric-value">${report.bugFixValidation.rules.failed}</td></tr>
            <tr><td>Предупреждения</td><td class="metric-value">${report.bugFixValidation.rules.warnings}</td></tr>
        </table>
    </div>

    <div class="section">
        <h2>📊 Валидация метрик</h2>
        <table>
            <tr><th>Метрика</th><th>Значение</th></tr>
            <tr><td>Всего метрик</td><td class="metric-value">${report.metricsValidation.totalMetrics}</td></tr>
            <tr><td>Корректных</td><td class="metric-value">${report.metricsValidation.validMetrics}</td></tr>
            <tr><td>Некорректных</td><td class="metric-value">${report.metricsValidation.invalidMetrics}</td></tr>
            <tr><td>Критические нарушения</td><td class="metric-value">${report.metricsValidation.summary.criticalViolations}</td></tr>
        </table>
    </div>

    ${report.overall.criticalIssuesCount > 0
            ? `
    <div class="section critical">
        <h2>🚨 Критические проблемы</h2>
        <ul>
            ${report.bugFixValidation.criticalIssues
                .map(issue => `
                <li><strong>${issue.message}</strong><br>
                Получено: <code>${issue.value}</code>, Ожидалось: <code>${issue.expected}</code></li>
            `)
                .join('')}
        </ul>
    </div>`
            : ''}

    ${options.includeRecommendations && report.recommendations.length > 0
            ? `
    <div class="section">
        <h2>💡 Рекомендации</h2>
        <ul>
            ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    </div>`
            : ''}

</body>
</html>`;
    }
    /**
     * Рассчитывает уровень доверия к валидации
     */
    calculateConfidence(bugFixReport, metricsReport) {
        const bugFixConfidence = bugFixReport.rules.total > 0
            ? (bugFixReport.rules.passed / bugFixReport.rules.total) * 100
            : 100;
        const metricsConfidence = metricsReport.totalMetrics > 0
            ? (metricsReport.validMetrics / metricsReport.totalMetrics) * 100
            : 100;
        // Взвешенное среднее с учетом критических ошибок
        const criticalPenalty = Math.min(20, (bugFixReport.criticalIssues.length + metricsReport.summary.criticalViolations) * 5);
        return Math.max(0, Math.min(100, (bugFixConfidence + metricsConfidence) / 2 - criticalPenalty));
    }
    /**
     * Генерирует общее резюме
     */
    generateOverallSummary(isValid, confidence, criticalCount, warningsCount) {
        if (isValid && confidence > 90) {
            return 'Все исправления работают корректно, метрики в норме.';
        }
        else if (isValid && confidence > 70) {
            return 'Исправления работают, но есть незначительные проблемы.';
        }
        else if (criticalCount > 0) {
            return `Обнаружены критические проблемы (${criticalCount}), требуется дополнительное исправление.`;
        }
        else {
            return 'Качество исправлений требует улучшения.';
        }
    }
    /**
     * Извлекает рекомендации из отчета о метриках
     */
    extractMetricsRecommendations(report) {
        const recommendations = new Set();
        for (const result of report.results) {
            if (!result.isValid) {
                result.suggestions.forEach(suggestion => recommendations.add(suggestion));
            }
        }
        return Array.from(recommendations);
    }
    /**
     * Определяет, является ли нарушение критическим
     */
    isCriticalViolation(violation) {
        const criticalKeywords = ['невозможный', 'отрицательный', 'превышает', 'NaN', 'infinite'];
        return criticalKeywords.some(keyword => violation.toLowerCase().includes(keyword.toLowerCase()));
    }
}
exports.ValidationReporter = ValidationReporter;
//# sourceMappingURL=validation-reporter.js.map