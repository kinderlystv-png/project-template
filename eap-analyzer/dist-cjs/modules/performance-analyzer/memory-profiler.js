"use strict";
/**
 * Профайлер памяти для анализа использования ресурсов
 * Анализирует потребление памяти во время выполнения анализа
 * и предоставляет рекомендации по оптимизации
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryProfiler = void 0;
class MemoryProfiler {
    snapshots = [];
    isActive = false;
    intervalId = null;
    SNAPSHOT_INTERVAL = 500; // 500ms
    /**
     * Запускает профилирование памяти
     */
    startProfiling() {
        if (this.isActive) {
            return;
        }
        this.isActive = true;
        this.snapshots = [];
        // Форсируем сборку мусора перед началом
        if (global.gc) {
            global.gc();
        }
        // Делаем первый снимок
        this.takeSnapshot('initialization');
        // Запускаем периодические снимки
        this.intervalId = setInterval(() => {
            this.takeSnapshot('runtime');
        }, this.SNAPSHOT_INTERVAL);
    }
    /**
     * Останавливает профилирование памяти
     */
    stopProfiling() {
        if (!this.isActive) {
            return;
        }
        this.isActive = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        // Финальный снимок
        this.takeSnapshot('finalization');
    }
    /**
     * Делает снимок состояния памяти
     */
    takeSnapshot(phase) {
        const memUsage = process.memoryUsage();
        const snapshot = {
            timestamp: Date.now(),
            heapUsed: Math.round((memUsage.heapUsed / 1024 / 1024) * 100) / 100, // MB
            heapTotal: Math.round((memUsage.heapTotal / 1024 / 1024) * 100) / 100, // MB
            external: Math.round((memUsage.external / 1024 / 1024) * 100) / 100, // MB
            rss: Math.round((memUsage.rss / 1024 / 1024) * 100) / 100, // MB
            arrayBuffers: Math.round((memUsage.arrayBuffers / 1024 / 1024) * 100) / 100, // MB
            phase,
        };
        this.snapshots.push(snapshot);
    }
    /**
     * Анализирует профиль памяти и возвращает результаты
     */
    analyzeProfile() {
        if (this.snapshots.length === 0) {
            return this.getEmptyResult();
        }
        const heapValues = this.snapshots.map(s => s.heapUsed);
        const peakMemory = Math.max(...heapValues);
        const averageMemory = Math.round((heapValues.reduce((sum, val) => sum + val, 0) / heapValues.length) * 100) / 100;
        const memoryLeaks = this.detectMemoryLeaks();
        const recommendations = this.generateRecommendations(peakMemory, averageMemory, memoryLeaks);
        const efficiency = this.calculateEfficiency(peakMemory, averageMemory, memoryLeaks);
        return {
            snapshots: this.snapshots,
            peakMemory,
            averageMemory,
            memoryLeaks,
            recommendations,
            efficiency,
        };
    }
    /**
     * Обнаруживает потенциальные утечки памяти
     */
    detectMemoryLeaks() {
        const leaks = [];
        if (this.snapshots.length < 3) {
            return leaks;
        }
        // Анализируем тренды по фазам
        const phases = [...new Set(this.snapshots.map(s => s.phase))];
        for (const phase of phases) {
            const phaseSnapshots = this.snapshots.filter(s => s.phase === phase);
            if (phaseSnapshots.length < 2) {
                continue;
            }
            // Рассчитываем рост памяти
            const firstSnapshot = phaseSnapshots[0];
            const lastSnapshot = phaseSnapshots[phaseSnapshots.length - 1];
            const timeSpanSeconds = (lastSnapshot.timestamp - firstSnapshot.timestamp) / 1000;
            const memoryGrowth = lastSnapshot.heapUsed - firstSnapshot.heapUsed;
            const growthRate = timeSpanSeconds > 0 ? memoryGrowth / timeSpanSeconds : 0;
            // Определяем серьезность утечки
            let severity = 'low';
            let description = `Фаза ${phase}: незначительный рост памяти`;
            if (growthRate > 10) {
                severity = 'critical';
                description = `Фаза ${phase}: критическая утечка памяти! Рост ${growthRate.toFixed(2)} МБ/с`;
            }
            else if (growthRate > 5) {
                severity = 'high';
                description = `Фаза ${phase}: серьезная утечка памяти. Рост ${growthRate.toFixed(2)} МБ/с`;
            }
            else if (growthRate > 2) {
                severity = 'medium';
                description = `Фаза ${phase}: умеренная утечка памяти. Рост ${growthRate.toFixed(2)} МБ/с`;
            }
            else if (growthRate > 0.5) {
                severity = 'low';
                description = `Фаза ${phase}: небольшой рост памяти. Рост ${growthRate.toFixed(2)} МБ/с`;
            }
            if (growthRate > 0.5) {
                leaks.push({
                    phase,
                    growthRate: Math.round(growthRate * 100) / 100,
                    severity,
                    description,
                });
            }
        }
        return leaks;
    }
    /**
     * Генерирует рекомендации по оптимизации памяти
     */
    generateRecommendations(peak, average, leaks) {
        const recommendations = [];
        // Рекомендации по пиковому использованию
        if (peak > 1000) {
            recommendations.push('🚨 Критически высокое потребление памяти (>1GB). Рассмотрите обработку данных частями.');
        }
        else if (peak > 500) {
            recommendations.push('⚠️ Высокое потребление памяти (>500MB). Оптимизируйте алгоритмы обработки.');
        }
        else if (peak > 200) {
            recommendations.push('💡 Умеренное потребление памяти. Можно оптимизировать для лучшей производительности.');
        }
        else {
            recommendations.push('✅ Отличное управление памятью. Потребление в норме.');
        }
        // Рекомендации по утечкам
        const criticalLeaks = leaks.filter(l => l.severity === 'critical');
        const highLeaks = leaks.filter(l => l.severity === 'high');
        if (criticalLeaks.length > 0) {
            recommendations.push('🔥 КРИТИЧЕСКИЕ УТЕЧКИ ПАМЯТИ! Немедленно проверьте циклы и замыкания.');
        }
        if (highLeaks.length > 0) {
            recommendations.push('🔴 Обнаружены серьезные утечки памяти. Проверьте очистку ресурсов.');
        }
        // Рекомендации по эффективности
        if (average / peak < 0.3) {
            recommendations.push('📊 Неравномерное использование памяти. Рассмотрите пулы объектов.');
        }
        return recommendations;
    }
    /**
     * Рассчитывает эффективность использования памяти
     */
    calculateEfficiency(peak, average, leaks) {
        let score = 100;
        // Штрафы за высокое потребление
        if (peak > 1000)
            score -= 40;
        else if (peak > 500)
            score -= 25;
        else if (peak > 200)
            score -= 10;
        // Штрафы за утечки
        const criticalLeaks = leaks.filter(l => l.severity === 'critical').length;
        const highLeaks = leaks.filter(l => l.severity === 'high').length;
        const mediumLeaks = leaks.filter(l => l.severity === 'medium').length;
        score -= criticalLeaks * 30;
        score -= highLeaks * 15;
        score -= mediumLeaks * 5;
        // Штраф за неэффективность
        const efficiency = peak > 0 ? average / peak : 1;
        if (efficiency < 0.3)
            score -= 15;
        else if (efficiency < 0.5)
            score -= 8;
        score = Math.max(0, score);
        let grade;
        let description;
        if (score >= 90) {
            grade = 'A';
            description = 'Отличное управление памятью';
        }
        else if (score >= 80) {
            grade = 'B';
            description = 'Хорошее управление памятью';
        }
        else if (score >= 70) {
            grade = 'C';
            description = 'Удовлетворительное управление памятью';
        }
        else if (score >= 60) {
            grade = 'D';
            description = 'Плохое управление памятью';
        }
        else {
            grade = 'F';
            description = 'Критические проблемы с памятью';
        }
        return { score, grade, description };
    }
    /**
     * Возвращает пустой результат для случаев без данных
     */
    getEmptyResult() {
        return {
            snapshots: [],
            peakMemory: 0,
            averageMemory: 0,
            memoryLeaks: [],
            recommendations: ['Профилирование не проводилось'],
            efficiency: {
                score: 0,
                grade: 'F',
                description: 'Нет данных для анализа',
            },
        };
    }
    /**
     * Форсирует сборку мусора (если доступно)
     */
    forceGC() {
        if (global.gc) {
            global.gc();
            return true;
        }
        return false;
    }
    /**
     * Получает текущее использование памяти
     */
    getCurrentMemoryUsage() {
        const memUsage = process.memoryUsage();
        return {
            timestamp: Date.now(),
            heapUsed: Math.round((memUsage.heapUsed / 1024 / 1024) * 100) / 100,
            heapTotal: Math.round((memUsage.heapTotal / 1024 / 1024) * 100) / 100,
            external: Math.round((memUsage.external / 1024 / 1024) * 100) / 100,
            rss: Math.round((memUsage.rss / 1024 / 1024) * 100) / 100,
            arrayBuffers: Math.round((memUsage.arrayBuffers / 1024 / 1024) * 100) / 100,
            phase: 'current',
        };
    }
}
exports.MemoryProfiler = MemoryProfiler;
//# sourceMappingURL=memory-profiler.js.map