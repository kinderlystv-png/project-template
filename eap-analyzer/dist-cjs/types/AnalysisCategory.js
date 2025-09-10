"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ANALYSIS_CATEGORY_LABELS = exports.AnalysisCategory = void 0;
/**
 * Категории анализа в EAP системе
 */
var AnalysisCategory;
(function (AnalysisCategory) {
    AnalysisCategory["CODE"] = "code";
    AnalysisCategory["INFRASTRUCTURE"] = "infrastructure";
    AnalysisCategory["PERFORMANCE"] = "performance";
    AnalysisCategory["SECURITY"] = "security";
    AnalysisCategory["TESTING"] = "testing";
    AnalysisCategory["DEPENDENCIES"] = "dependencies";
    AnalysisCategory["DOCUMENTATION"] = "documentation";
})(AnalysisCategory || (exports.AnalysisCategory = AnalysisCategory = {}));
/**
 * Человекочитаемые названия категорий
 */
exports.ANALYSIS_CATEGORY_LABELS = {
    [AnalysisCategory.CODE]: 'Анализ кода',
    [AnalysisCategory.INFRASTRUCTURE]: 'Инфраструктура',
    [AnalysisCategory.PERFORMANCE]: 'Производительность',
    [AnalysisCategory.SECURITY]: 'Безопасность',
    [AnalysisCategory.TESTING]: 'Тестирование',
    [AnalysisCategory.DEPENDENCIES]: 'Зависимости',
    [AnalysisCategory.DOCUMENTATION]: 'Документация',
};
//# sourceMappingURL=AnalysisCategory.js.map