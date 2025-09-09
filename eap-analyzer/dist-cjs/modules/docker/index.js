"use strict";
/**
 * Docker Module - полный модуль для анализа Docker конфигураций
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerModule = exports.DOCKER_CHECKERS = exports.DockerOptimizationChecker = exports.DockerSecurityChecker = exports.DockerAnalyzer = void 0;
const analyzer_js_1 = require("./analyzer.js");
const index_js_1 = require("./checkers/index.js");
var analyzer_js_2 = require("./analyzer.js");
Object.defineProperty(exports, "DockerAnalyzer", { enumerable: true, get: function () { return analyzer_js_2.DockerAnalyzer; } });
var index_js_2 = require("./checkers/index.js");
Object.defineProperty(exports, "DockerSecurityChecker", { enumerable: true, get: function () { return index_js_2.DockerSecurityChecker; } });
Object.defineProperty(exports, "DockerOptimizationChecker", { enumerable: true, get: function () { return index_js_2.DockerOptimizationChecker; } });
Object.defineProperty(exports, "DOCKER_CHECKERS", { enumerable: true, get: function () { return index_js_2.DOCKER_CHECKERS; } });
// Основной экспорт модуля
exports.DockerModule = {
    analyzer: analyzer_js_1.DockerAnalyzer,
    checkers: index_js_1.DOCKER_CHECKERS,
    name: 'Docker Module',
    version: '3.0.0',
};
//# sourceMappingURL=index.js.map