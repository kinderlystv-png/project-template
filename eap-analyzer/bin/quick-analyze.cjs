#!/usr/bin/env node

/**
 * Ultimate EAP Analyzer v3.0 - Quick Analysis
 * Простой скрипт для быстрого анализа любого проекта
 */

const fs = require('fs');
const path = require('path');

// Получаем путь к проекту из аргументов
const targetProject = process.argv[2] || process.cwd();

console.log('🔍 Ultimate EAP Analyzer v3.0 - Быстрый анализ');
console.log('=' .repeat(50));

if (!fs.existsSync(targetProject)) {
    console.error('❌ Путь к проекту не найден:', targetProject);
    process.exit(1);
}

// Простой анализ файлов
function analyzeProject(projectPath) {
    const stats = {
        totalFiles: 0,
        codeFiles: 0,
        totalLines: 0,
        fileTypes: {},
        issues: {
            security: 0,
            performance: 0,
            quality: 0,
            debt: 0
        },
        recommendations: []
    };

    function scanDirectory(dir) {
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                // Пропускаем служебные папки
                if (entry.isDirectory()) {
                    if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(entry.name)) {
                        scanDirectory(fullPath);
                    }
                    continue;
                }
                
                if (entry.isFile()) {
                    stats.totalFiles++;
                    
                    const ext = path.extname(entry.name).toLowerCase();
                    stats.fileTypes[ext] = (stats.fileTypes[ext] || 0) + 1;
                    
                    // Анализируем только кодовые файлы
                    if (['.js', '.ts', '.jsx', '.tsx', '.vue', '.svelte', '.py', '.java', '.cs', '.cpp', '.c', '.php'].includes(ext)) {
                        stats.codeFiles++;
                        analyzeCodeFile(fullPath, stats);
                    }
                }
            }
        } catch (err) {
            // Игнорируем ошибки доступа
        }
    }

    function analyzeCodeFile(filePath, stats) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            stats.totalLines += lines.length;
            
            // Простые проверки качества
            if (content.includes('eval(')) {
                stats.issues.security++;
                stats.recommendations.push({
                    type: 'security',
                    file: path.relative(projectPath, filePath),
                    issue: 'Использование eval() небезопасно'
                });
            }
            
            if (content.includes('document.write')) {
                stats.issues.security++;
                stats.recommendations.push({
                    type: 'security', 
                    file: path.relative(projectPath, filePath),
                    issue: 'document.write может быть уязвимым'
                });
            }
            
            // Проверки производительности
            if (content.includes('for (') && content.includes('getElementById')) {
                stats.issues.performance++;
                stats.recommendations.push({
                    type: 'performance',
                    file: path.relative(projectPath, filePath),
                    issue: 'DOM-запросы в циклах замедляют работу'
                });
            }
            
            // Проверки качества кода
            if (lines.length > 500) {
                stats.issues.quality++;
                stats.recommendations.push({
                    type: 'quality',
                    file: path.relative(projectPath, filePath),
                    issue: `Большой файл (${lines.length} строк) - стоит разделить`
                });
            }
            
            const longLines = lines.filter(line => line.length > 120);
            if (longLines.length > 10) {
                stats.issues.quality++;
                stats.recommendations.push({
                    type: 'quality',
                    file: path.relative(projectPath, filePath),
                    issue: `Много длинных строк (${longLines.length}) - ухудшает читаемость`
                });
            }
            
            // Анализ технического долга
            const todoCount = (content.match(/TODO|FIXME|HACK|XXX/gi) || []).length;
            if (todoCount > 5) {
                stats.issues.debt++;
                stats.recommendations.push({
                    type: 'debt',
                    file: path.relative(projectPath, filePath),
                    issue: `Много TODO/FIXME комментариев (${todoCount}) - накапливается долг`
                });
            }
            
        } catch (err) {
            // Игнорируем ошибки чтения файлов
        }
    }
    
    console.log(`📁 Анализируем: ${projectPath}`);
    scanDirectory(projectPath);
    
    return stats;
}

// Запускаем анализ
const results = analyzeProject(targetProject);

// Выводим результаты
console.log('\n📊 Результаты анализа:');
console.log(`📁 Всего файлов: ${results.totalFiles}`);
console.log(`💻 Кодовых файлов: ${results.codeFiles}`);
console.log(`📏 Строк кода: ${results.totalLines.toLocaleString()}`);

console.log('\n📈 Типы файлов:');
Object.entries(results.fileTypes)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([ext, count]) => {
        console.log(`   ${ext || 'без расширения'}: ${count}`);
    });

console.log('\n🎯 Найденные проблемы:');
console.log(`🔒 Security: ${results.issues.security} проблем`);
console.log(`⚡ Performance: ${results.issues.performance} проблем`);
console.log(`✨ Quality: ${results.issues.quality} проблем`);
console.log(`💸 Technical Debt: ${results.issues.debt} проблем`);

if (results.recommendations.length > 0) {
    console.log('\n💡 Топ рекомендации:');
    results.recommendations
        .slice(0, 10)
        .forEach((rec, i) => {
            const icon = rec.type === 'security' ? '🔒' : 
                        rec.type === 'performance' ? '⚡' : 
                        rec.type === 'quality' ? '✨' : '💸';
            console.log(`   ${icon} ${rec.file}: ${rec.issue}`);
        });
}

// Рассчитываем примерный ROI
const totalIssues = Object.values(results.issues).reduce((a, b) => a + b, 0);
const estimatedSavings = totalIssues * 2000; // $2000 за проблему
const effortHours = totalIssues * 4; // 4 часа на проблему
const roiPercent = estimatedSavings > 0 ? Math.round(((estimatedSavings - effortHours * 100) / (effortHours * 100)) * 100) : 0;

console.log('\n💰 ROI Анализ:');
console.log(`💵 Потенциальная экономия: $${estimatedSavings.toLocaleString()}`);
console.log(`⏱️  Требуемые усилия: ${effortHours} часов`);
console.log(`📈 ROI: ${roiPercent}%`);

// Сохраняем результаты в JSON
const reportData = {
    timestamp: new Date().toISOString(),
    projectPath: targetProject,
    version: '3.0.0',
    analyzer: 'Ultimate EAP Analyzer',
    summary: {
        totalFiles: results.totalFiles,
        codeFiles: results.codeFiles,
        totalLines: results.totalLines,
        issues: results.issues,
        totalIssues: totalIssues
    },
    fileTypes: results.fileTypes,
    recommendations: results.recommendations,
    roi: {
        estimatedSavings,
        effortHours,
        roiPercent
    },
    aiInsights: {
        enabled: false,
        reason: 'Simplified analysis mode'
    }
};

const outputFile = path.join(process.cwd(), 'eap-analysis-latest.json');
fs.writeFileSync(outputFile, JSON.stringify(reportData, null, 2));

console.log(`\n📄 Отчет сохранен: ${outputFile}`);
console.log('\n✅ Анализ завершен! Ultimate EAP Analyzer v3.0');
