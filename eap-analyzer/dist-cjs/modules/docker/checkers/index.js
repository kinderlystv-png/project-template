"use strict";
/**
 * Docker Module Checkers - экспорт всех чекеров для Docker модуля
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOCKER_CHECKERS = exports.DockerOptimizationChecker = exports.DockerSecurityChecker = void 0;
const security_checker_js_1 = require("./security.checker.js");
const optimization_checker_js_1 = require("./optimization.checker.js");
var security_checker_js_2 = require("./security.checker.js");
Object.defineProperty(exports, "DockerSecurityChecker", { enumerable: true, get: function () { return security_checker_js_2.DockerSecurityChecker; } });
var optimization_checker_js_2 = require("./optimization.checker.js");
Object.defineProperty(exports, "DockerOptimizationChecker", { enumerable: true, get: function () { return optimization_checker_js_2.DockerOptimizationChecker; } });
// Массив всех Docker чекеров для удобного импорта
exports.DOCKER_CHECKERS = [security_checker_js_1.DockerSecurityChecker, optimization_checker_js_1.DockerOptimizationChecker];
//# sourceMappingURL=index.js.map