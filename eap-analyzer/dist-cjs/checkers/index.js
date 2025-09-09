"use strict";
/**
 * Экспорт всех общих чекеров
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UNIVERSAL_CHECKERS = void 0;
const security_checker_js_1 = require("./security.checker.js");
const performance_checker_js_1 = require("./performance.checker.js");
const code_quality_checker_js_1 = require("./code-quality.checker.js");
const testing_checker_js_1 = require("./testing.checker.js");
__exportStar(require("./security.checker.js"), exports);
__exportStar(require("./performance.checker.js"), exports);
__exportStar(require("./code-quality.checker.js"), exports);
__exportStar(require("./testing.checker.js"), exports);
// Массив всех универсальных чекеров
exports.UNIVERSAL_CHECKERS = [
    security_checker_js_1.SecurityChecker,
    performance_checker_js_1.PerformanceChecker,
    code_quality_checker_js_1.CodeQualityChecker,
    testing_checker_js_1.TestingChecker,
];
//# sourceMappingURL=index.js.map