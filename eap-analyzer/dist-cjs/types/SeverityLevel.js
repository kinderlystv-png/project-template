"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEVERITY_WEIGHTS = exports.SEVERITY_LEVEL_LABELS = exports.SeverityLevel = void 0;
/**
 * Уровни серьезности проблем и проверок
 */
var SeverityLevel;
(function (SeverityLevel) {
    SeverityLevel["LOW"] = "low";
    SeverityLevel["MEDIUM"] = "medium";
    SeverityLevel["HIGH"] = "high";
    SeverityLevel["CRITICAL"] = "critical";
})(SeverityLevel || (exports.SeverityLevel = SeverityLevel = {}));
/**
 * Человекочитаемые названия уровней серьезности
 */
exports.SEVERITY_LEVEL_LABELS = {
    [SeverityLevel.LOW]: 'Низкий',
    [SeverityLevel.MEDIUM]: 'Средний',
    [SeverityLevel.HIGH]: 'Высокий',
    [SeverityLevel.CRITICAL]: 'Критический',
};
/**
 * Числовые веса для сортировки по важности
 */
exports.SEVERITY_WEIGHTS = {
    [SeverityLevel.LOW]: 1,
    [SeverityLevel.MEDIUM]: 2,
    [SeverityLevel.HIGH]: 3,
    [SeverityLevel.CRITICAL]: 4,
};
//# sourceMappingURL=SeverityLevel.js.map